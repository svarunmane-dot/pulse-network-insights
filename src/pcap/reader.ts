/**
 * Phase 1b — streaming libpcap + PCAPNG readers.
 *
 * The parser is fed sequential byte chunks (≈8 MB from File.slice()) and
 * keeps a carry-over buffer for records/blocks that straddle a chunk
 * boundary. The whole file is never materialised.
 *
 * Safety invariants:
 *  - every loop iteration must strictly advance the file offset, or the
 *    file is declared malformed and parsing stops;
 *  - a hard iteration budget bounds total work regardless of input.
 */

import {
  FLAG_TRUNCATED,
  Ipv6Table,
  L3_ARP,
  L3_IPV4,
  L3_IPV6,
  L4_ICMP,
  L4_ICMPV6,
  L4_TCP,
  L4_UDP,
  PacketStore,
} from "./columnar";
import { dissectFrame } from "./dissect";
import { emptyStats, type CaptureKind, type CaptureStats, type InterfaceInfo } from "./types";

/** Absolute ceiling on parse loop iterations (records + blocks + resync steps). */
export const MAX_ITERATIONS = 40_000_000;
/** Any declared record/block larger than this is treated as corruption. */
export const MAX_RECORD_BYTES = 256 * 1024 * 1024;
/** Default streaming chunk size. */
export const CHUNK_BYTES = 8 * 1024 * 1024;

const EMPTY = new Uint8Array(0);

const PCAPNG_SHB = 0x0a0d0d0a;
const PCAPNG_IDB = 0x00000001;
const PCAPNG_SPB = 0x00000003;
const PCAPNG_NRB = 0x00000004;
const PCAPNG_ISB = 0x00000005;
const PCAPNG_EPB = 0x00000006;
const BYTE_ORDER_MAGIC = 0x1a2b3c4d;

const LIBPCAP_MAGICS: Record<string, { le: boolean; tsResolNs: number }> = {
  a1b2c3d4: { le: false, tsResolNs: 1000 },
  d4c3b2a1: { le: true, tsResolNs: 1000 },
  a1b23c4d: { le: false, tsResolNs: 1 },
  "4d3cb2a1": { le: true, tsResolNs: 1 },
};

export interface ParseResult {
  stats: CaptureStats;
  store: PacketStore;
  ipv6Table: Ipv6Table;
}

type Mode = "init" | "libpcap" | "pcapng" | "dead";

interface PcapngSection {
  le: boolean;
  /** local interface index -> global interface id */
  interfaces: number[];
}

export class CaptureParser {
  private mode: Mode = "init";
  private carry: Uint8Array = EMPTY;
  /** File offset of carry[0]. */
  private carryOffset = 0;
  private iterations = 0;
  private resyncing = false;

  private readonly store = new PacketStore();
  private readonly ipv6Table = new Ipv6Table();
  private stats: CaptureStats;

  // libpcap state
  private le = true;
  private tsResolNs = 1000;
  private linkType = 1;

  // pcapng state
  private section: PcapngSection = { le: true, interfaces: [] };

  private firstNs: number | null = null;
  private firstAbs: { sec: number; nsec: number } | null = null;

  constructor(private readonly fileSize: number) {
    this.stats = emptyStats("libpcap", fileSize);
  }

  /** Feed the next sequential chunk of the file. */
  feed(chunk: Uint8Array): void {
    if (this.mode === "dead" || chunk.length === 0) return;
    let buf: Uint8Array;
    if (this.carry.length === 0) {
      buf = chunk;
    } else {
      buf = new Uint8Array(this.carry.length + chunk.length);
      buf.set(this.carry, 0);
      buf.set(chunk, this.carry.length);
    }
    const bufOffset = this.carryOffset;
    const consumed = this.parse(buf, bufOffset);
    if (consumed >= buf.length) {
      this.carry = EMPTY;
    } else {
      this.carry = buf.slice(consumed);
    }
    this.carryOffset = bufOffset + consumed;
  }

  /** Finish parsing and return stats + columnar store. */
  finish(): ParseResult {
    if (this.carry.length > 0 && this.mode !== "dead") {
      this.stats.truncatedFinalRecord = true;
      this.stats.notes.push(
        `Final ${this.carry.length} byte(s) at offset ${this.carryOffset} are an incomplete record; ignored.`,
      );
    }
    this.stats.format = this.mode === "pcapng" ? "pcapng" : this.stats.format;
    this.stats.packetCount = this.store.count;
    if (this.firstAbs && this.stats.lastTimestamp) {
      this.stats.firstTimestamp = this.firstAbs;
      this.stats.durationNs =
        (this.stats.lastTimestamp.sec - this.firstAbs.sec) * 1e9 +
        (this.stats.lastTimestamp.nsec - this.firstAbs.nsec);
    }
    this.stats.snaplen = this.stats.interfaces.length
      ? Math.min(...this.stats.interfaces.map((i) => i.snaplen || 0))
      : 0;
    this.stats.linkTypes = [...new Set(this.stats.interfaces.map((i) => i.linkType))].sort(
      (a, b) => a - b,
    );
    if (this.stats.format === "pcapng") {
      this.stats.pcapngInterfaceCount = this.stats.interfaces.length;
    }
    return { stats: this.stats, store: this.store, ipv6Table: this.ipv6Table };
  }

  // -------------------------------------------------------------------
  // Core loop
  // -------------------------------------------------------------------

  /** Parse as much of buf as possible; returns bytes consumed. */
  private parse(buf: Uint8Array, bufOffset: number): number {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let pos = 0;

    while (this.mode !== "dead") {
      if (++this.iterations > MAX_ITERATIONS) {
        this.die(bufOffset + pos, "Iteration budget exhausted; file abandoned.");
        break;
      }
      const before = pos;

      if (this.resyncing) {
        const found = this.scanForBlock(buf, view, pos);
        if (found < 0) {
          // Keep only the tail that might start a block header.
          return Math.max(pos, buf.length - 11);
        }
        pos = found;
        this.resyncing = false;
        this.stats.resyncCount++;
      }

      let next: number;
      const mode: Mode = this.mode;
      if (mode === "init") next = this.parseHeader(buf, view, pos);
      else if (mode === "libpcap") next = this.parseLibpcapRecord(buf, view, pos, bufOffset);
      else next = this.parsePcapngBlock(buf, view, pos, bufOffset);

      if (next === -1) return pos; // need more bytes
      if ((this.mode as Mode) === "dead") break;
      if (this.resyncing) {
        pos = next;
        continue;
      }
      if (next <= before) {
        this.die(bufOffset + pos, "Parser made no forward progress; file abandoned.");
        break;
      }
      pos = next;
    }
    return this.mode === "dead" ? buf.length : pos;
  }

  private die(offset: number, note: string): void {
    this.mode = "dead";
    this.stats.abandonedAtOffset = offset;
    this.stats.notes.push(note);
  }

  private malformed(offset: number, note: string): void {
    this.stats.malformedRecordCount++;
    if (this.stats.format === "pcapng") {
      this.resyncing = true;
      this.stats.notes.push(`${note} (offset ${offset}) — resynchronising.`);
    } else {
      // Classic pcap has no resync anchor: stop cleanly, keep what we have.
      this.die(
        offset,
        `${note} (offset ${offset}) — classic pcap has no resync anchor, remainder skipped.`,
      );
    }
  }

  // -------------------------------------------------------------------
  // Headers
  // -------------------------------------------------------------------

  private parseHeader(buf: Uint8Array, view: DataView, pos: number): number {
    if (buf.length - pos < 4) return -1;
    let magic = "";
    for (let i = 0; i < 4; i++) magic += buf[pos + i].toString(16).padStart(2, "0");

    const lib = LIBPCAP_MAGICS[magic];
    if (lib) {
      if (buf.length - pos < 24) return -1;
      this.mode = "libpcap";
      this.stats.format = "libpcap";
      this.le = lib.le;
      this.tsResolNs = lib.tsResolNs;
      const snaplen = view.getUint32(pos + 16, this.le);
      this.linkType = view.getUint32(pos + 20, this.le);
      this.stats.interfaces.push({
        globalId: 0,
        section: 0,
        localId: 0,
        linkType: this.linkType,
        snaplen,
        tsResolNs: this.tsResolNs,
      });
      return pos + 24;
    }

    if (view.getUint32(pos, false) === PCAPNG_SHB) {
      this.mode = "pcapng";
      this.stats.format = "pcapng";
      return this.parsePcapngBlock(buf, view, pos, 0);
    }

    this.die(pos, "Unsupported file format: no libpcap or PCAPNG magic.");
    return pos;
  }

  // -------------------------------------------------------------------
  // libpcap records
  // -------------------------------------------------------------------

  private parseLibpcapRecord(
    buf: Uint8Array,
    view: DataView,
    pos: number,
    bufOffset: number,
  ): number {
    if (buf.length - pos < 16) return -1;
    const tsSec = view.getUint32(pos, this.le);
    const tsFrac = view.getUint32(pos + 4, this.le);
    const capLen = view.getUint32(pos + 8, this.le);
    const origLen = view.getUint32(pos + 12, this.le);

    if (capLen > MAX_RECORD_BYTES || origLen > MAX_RECORD_BYTES) {
      this.malformed(bufOffset + pos, `Implausible record length ${capLen}/${origLen}`);
      return pos;
    }
    const remainingInFile = this.fileSize - (bufOffset + pos + 16);
    if (capLen > remainingInFile) {
      // Declared caplen exceeds what the file can still contain.
      this.stats.truncatedFinalRecord = true;
      this.stats.notes.push(
        `Final record at offset ${bufOffset + pos} declares ${capLen} bytes but only ${Math.max(0, remainingInFile)} remain; ignored.`,
      );
      this.mode = "dead";
      this.stats.abandonedAtOffset = bufOffset + pos;
      return pos;
    }
    if (buf.length - pos < 16 + capLen) return -1;

    const nsec = tsFrac * this.tsResolNs;
    this.addFrame({
      buf,
      view,
      dataStart: pos + 16,
      capLen,
      origLen,
      tsSec,
      tsNsec: nsec,
      ifaceId: 0,
      linkType: this.linkType,
      fileOffset: bufOffset + pos,
    });
    return pos + 16 + capLen;
  }

  // -------------------------------------------------------------------
  // PCAPNG blocks
  // -------------------------------------------------------------------

  private parsePcapngBlock(
    buf: Uint8Array,
    view: DataView,
    pos: number,
    bufOffset: number,
  ): number {
    if (buf.length - pos < 12) return -1;
    // SHB's magic is byte-order agnostic; every other block type must be read
    // with the endianness the current section declared.
    const isShb = view.getUint32(pos, false) === PCAPNG_SHB;
    const blockType = isShb ? PCAPNG_SHB : view.getUint32(pos, this.section.le);

    if (isShb) {
      // Byte-order magic decides endianness for the whole new section.
      if (buf.length - pos < 28) return -1;
      let le: boolean;
      if (view.getUint32(pos + 8, false) === BYTE_ORDER_MAGIC) le = false;
      else if (view.getUint32(pos + 8, true) === BYTE_ORDER_MAGIC) le = true;
      else {
        this.malformed(bufOffset + pos, "SHB without a valid byte-order magic");
        return pos;
      }
      const total = view.getUint32(pos + 4, le);
      if (total < 28 || total % 4 !== 0 || total > MAX_RECORD_BYTES) {
        this.malformed(bufOffset + pos, `SHB with implausible length ${total}`);
        return pos;
      }
      if (buf.length - pos < total) return -1;
      if (view.getUint32(pos + total - 4, le) !== total) {
        this.malformed(bufOffset + pos, "SHB trailing length mismatch");
        return pos;
      }
      this.section = { le, interfaces: [] };
      this.stats.pcapngSectionCount++;
      return pos + total;
    }

    const le = this.section.le;
    const total = view.getUint32(pos + 4, le);
    if (total < 12 || total % 4 !== 0 || total > MAX_RECORD_BYTES) {
      this.malformed(bufOffset + pos, `Block type 0x${blockType.toString(16)} length ${total}`);
      return pos;
    }
    if (buf.length - pos < total) return -1;
    if (view.getUint32(pos + total - 4, le) !== total) {
      this.malformed(bufOffset + pos, "Block trailing length mismatch");
      return pos;
    }

    switch (blockType) {
      case PCAPNG_IDB:
        this.parseIdb(buf, view, pos, total, le);
        break;
      case PCAPNG_EPB:
        this.parseEpb(buf, view, pos, total, le, bufOffset);
        break;
      case PCAPNG_SPB:
        this.parseSpb(buf, view, pos, total, le, bufOffset);
        break;
      case PCAPNG_ISB:
        this.parseIsb(view, pos, total, le);
        break;
      case PCAPNG_NRB:
      default:
        // NRB and unknown blocks are skipped by block_total_length.
        break;
    }
    return pos + total;
  }

  private parseIdb(
    buf: Uint8Array,
    view: DataView,
    pos: number,
    total: number,
    le: boolean,
  ): void {
    const linkType = view.getUint16(pos + 8, le);
    const snaplen = view.getUint32(pos + 12, le);
    const info: InterfaceInfo = {
      globalId: this.stats.interfaces.length,
      section: Math.max(0, this.stats.pcapngSectionCount - 1),
      localId: this.section.interfaces.length,
      linkType,
      snaplen,
      tsResolNs: 1000,
    };
    // Options start at pos+16, end at pos+total-4.
    this.eachOption(view, pos + 16, pos + total - 4, le, (code, optPos, optLen) => {
      if (code === 9 && optLen >= 1) {
        const raw = buf[optPos];
        info.tsResolNs =
          (raw & 0x80) !== 0 ? 1e9 / Math.pow(2, raw & 0x7f) : 1e9 / Math.pow(10, raw & 0x7f);
      } else if (code === 2) {
        info.name = utf8(buf, optPos, optLen);
      } else if (code === 3) {
        info.description = utf8(buf, optPos, optLen);
      }
    });
    this.stats.interfaces.push(info);
    this.section.interfaces.push(info.globalId);
  }

  private parseEpb(
    buf: Uint8Array,
    view: DataView,
    pos: number,
    total: number,
    le: boolean,
    bufOffset: number,
  ): void {
    if (total < 32) {
      this.malformed(bufOffset + pos, "EPB shorter than its fixed fields");
      return;
    }
    const localIface = view.getUint32(pos + 8, le);
    const tsHigh = view.getUint32(pos + 12, le);
    const tsLow = view.getUint32(pos + 16, le);
    const capLen = view.getUint32(pos + 20, le);
    const origLen = view.getUint32(pos + 24, le);
    const dataStart = pos + 28;
    if (capLen > total - 32) {
      this.malformed(bufOffset + pos, `EPB caplen ${capLen} exceeds block length`);
      return;
    }
    const globalId = this.section.interfaces[localIface] ?? 0;
    const iface = this.stats.interfaces[globalId];
    const ticks = tsHigh * 4294967296 + tsLow;
    const totalNs = ticks * (iface?.tsResolNs ?? 1000);
    this.addFrame({
      buf,
      view,
      dataStart,
      capLen,
      origLen,
      tsSec: Math.floor(totalNs / 1e9),
      tsNsec: totalNs - Math.floor(totalNs / 1e9) * 1e9,
      ifaceId: globalId,
      linkType: iface?.linkType ?? 1,
      fileOffset: bufOffset + pos,
    });
  }

  private parseSpb(
    buf: Uint8Array,
    view: DataView,
    pos: number,
    total: number,
    le: boolean,
    bufOffset: number,
  ): void {
    if (total < 16) {
      this.malformed(bufOffset + pos, "SPB shorter than its fixed fields");
      return;
    }
    const origLen = view.getUint32(pos + 8, le);
    // Implicit interface 0; caplen derived from the block length.
    const globalId = this.section.interfaces[0] ?? 0;
    const iface = this.stats.interfaces[globalId];
    const available = total - 16;
    const snaplen = iface?.snaplen || 0;
    let capLen = Math.min(origLen, available);
    if (snaplen > 0) capLen = Math.min(capLen, snaplen);
    this.addFrame({
      buf,
      view,
      dataStart: pos + 12,
      capLen,
      origLen,
      tsSec: 0,
      tsNsec: 0,
      ifaceId: globalId,
      linkType: iface?.linkType ?? 1,
      fileOffset: bufOffset + pos,
      noTimestamp: true,
    });
  }

  private parseIsb(view: DataView, pos: number, total: number, le: boolean): void {
    const localIface = view.getUint32(pos + 8, le);
    const globalId = this.section.interfaces[localIface] ?? 0;
    let ifDrop = 0;
    let filterDrop = 0;
    this.eachOption(view, pos + 20, pos + total - 4, le, (code, optPos, optLen) => {
      if (optLen >= 8) {
        const value = view.getUint32(optPos + (le ? 4 : 0), le) * 4294967296 + view.getUint32(optPos + (le ? 0 : 4), le);
        if (code === 5) ifDrop = value;
        if (code === 7) filterDrop = value;
      }
    });
    if (ifDrop || filterDrop) {
      this.stats.pcapngDropCounters.push({ interfaceGlobalId: globalId, ifDrop, filterDrop });
    }
  }

  private eachOption(
    view: DataView,
    start: number,
    end: number,
    le: boolean,
    fn: (code: number, valuePos: number, valueLen: number) => void,
  ): void {
    let p = start;
    let guard = 0;
    while (p + 4 <= end && guard++ < 4096) {
      const code = view.getUint16(p, le);
      const len = view.getUint16(p + 2, le);
      if (code === 0) break; // opt_endofopt
      const valuePos = p + 4;
      if (valuePos + len > end) break;
      fn(code, valuePos, len);
      p = valuePos + ((len + 3) & ~3); // 4-byte option padding
    }
  }

  // -------------------------------------------------------------------
  // Frame ingestion
  // -------------------------------------------------------------------

  private addFrame(args: {
    buf: Uint8Array;
    view: DataView;
    dataStart: number;
    capLen: number;
    origLen: number;
    tsSec: number;
    tsNsec: number;
    ifaceId: number;
    linkType: number;
    fileOffset: number;
    noTimestamp?: boolean;
  }): void {
    const { buf, view, dataStart, capLen, origLen, ifaceId, linkType, fileOffset } = args;
    const absNs = args.tsSec * 1e9 + args.tsNsec;

    if (!args.noTimestamp) {
      if (this.firstNs === null) {
        this.firstNs = absNs;
        this.firstAbs = { sec: args.tsSec, nsec: args.tsNsec };
      }
      this.stats.lastTimestamp = { sec: args.tsSec, nsec: args.tsNsec };
    }
    const relNs = this.firstNs === null || args.noTimestamp ? 0 : absNs - this.firstNs;
    const hi = Math.floor(relNs / 4294967296);
    const lo = relNs - hi * 4294967296;

    const fields = dissectFrame(buf, view, dataStart, capLen, linkType, this.ipv6Table);
    let flags = fields.frameFlags ?? 0;
    if (capLen < origLen) {
      flags |= FLAG_TRUNCATED;
      this.stats.truncatedPacketCount++;
    }

    this.stats.capturedBytes += capLen;
    this.stats.originalBytes += origLen;
    switch (fields.l3Proto) {
      case L3_IPV4:
        this.stats.ipv4PacketCount++;
        break;
      case L3_IPV6:
        this.stats.ipv6PacketCount++;
        break;
      case L3_ARP:
        this.stats.arpPacketCount++;
        break;
      default:
        this.stats.otherPacketCount++;
    }
    switch (fields.l4Type) {
      case L4_TCP:
        this.stats.tcpPacketCount++;
        break;
      case L4_UDP:
        this.stats.udpPacketCount++;
        break;
      case L4_ICMP:
      case L4_ICMPV6:
        this.stats.icmpPacketCount++;
        break;
      default:
        break;
    }

    this.store.push({
      ...fields,
      frameFlags: flags,
      tsNanoLo: lo >>> 0,
      tsNanoHi: hi >>> 0,
      capLen,
      origLen,
      ifaceId,
      fileOffset: fileOffset >>> 0,
    });
  }

  // -------------------------------------------------------------------
  // Resync
  // -------------------------------------------------------------------

  /** Scan forward on 4-byte boundaries for a plausible PCAPNG block header. */
  private scanForBlock(buf: Uint8Array, view: DataView, from: number): number {
    const start = from + 4 - ((from + 4) % 4 === 0 ? 0 : (from + 4) % 4);
    for (let p = Math.max(start, from + 4); p + 12 <= buf.length; p += 4) {
      const isShb = view.getUint32(p, false) === PCAPNG_SHB;
      const le = this.section.le;
      const type = isShb ? PCAPNG_SHB : view.getUint32(p, le);
      if (isShb) {
        if (p + 28 <= buf.length) {
          const beMagic = view.getUint32(p + 8, false) === BYTE_ORDER_MAGIC;
          const leMagic = view.getUint32(p + 8, true) === BYTE_ORDER_MAGIC;
          if (beMagic || leMagic) return p;
        }
        continue;
      }
      if (type !== PCAPNG_IDB && type !== PCAPNG_SPB && type !== PCAPNG_NRB && type !== PCAPNG_ISB && type !== PCAPNG_EPB) {
        continue;
      }
      const total = view.getUint32(p + 4, le!);
      if (total < 12 || total % 4 !== 0 || total > MAX_RECORD_BYTES) continue;
      if (p + total > buf.length) continue; // need more bytes to confirm
      if (view.getUint32(p + total - 4, le!) !== total) continue;
      return p;
    }
    return -1;
  }
}

function utf8(buf: Uint8Array, pos: number, len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += String.fromCharCode(buf[pos + i]);
  return out;
}

/** A sequential source of file bytes. */
export interface ChunkSource {
  readonly size: number;
  /** Read [start, end) as bytes. */
  slice(start: number, end: number): Promise<Uint8Array>;
}

/** Parse a whole capture from a chunk source, ~8 MB at a time. */
export async function parseCapture(
  source: ChunkSource,
  chunkBytes: number = CHUNK_BYTES,
): Promise<ParseResult> {
  const parser = new CaptureParser(source.size);
  for (let offset = 0; offset < source.size; offset += chunkBytes) {
    const end = Math.min(source.size, offset + chunkBytes);
    parser.feed(await source.slice(offset, end));
  }
  return parser.finish();
}

/** ChunkSource backed by a browser File/Blob — never calls file.arrayBuffer(). */
export function fileChunkSource(file: Blob): ChunkSource {
  return {
    size: file.size,
    async slice(start, end) {
      return new Uint8Array(await file.slice(start, end).arrayBuffer());
    },
  };
}
