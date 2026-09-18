/**
 * Phase 1b — columnar (struct-of-arrays) packet model.
 *
 * 22 columns, exactly the frozen Day-1 field list, each allocated in fixed
 * 65,536-frame pages. Nothing is allocated up front beyond the first page of
 * each column.
 *
 * Per-frame byte cost (one element of every column):
 *   1 x Int32 + 6 x Uint32 = 28 B, 9 x Uint16 = 18 B, 6 x Uint8 = 6 B
 *   -> 52 B/frame.
 */

export const PAGE_SIZE = 65536;

/** Column element kinds, in the frozen column order. */
export type ColumnName =
  | "tsNanoLo"
  | "tsNanoHi"
  | "srcAddr32"
  | "dstAddr32"
  | "tcpSeq"
  | "tcpAck"
  | "flowId"
  | "capLen"
  | "origLen"
  | "payloadLen"
  | "srcPort"
  | "dstPort"
  | "tcpWindow"
  | "vlanId"
  | "frameFlags"
  | "l4Offset"
  | "tcpFlags"
  | "l2Type"
  | "l3Proto"
  | "l4Proto"
  | "ifaceId"
  | "appHint";

/** Signed: -1 means "no flow assigned yet". */
export const I32_COLUMNS = ["flowId"] as const;

export const U32_COLUMNS = [
  "tsNanoLo",
  "tsNanoHi",
  "srcAddr32",
  "dstAddr32",
  "tcpSeq",
  "tcpAck",
] as const;

export const U16_COLUMNS = [
  "capLen",
  "origLen",
  "payloadLen",
  "srcPort",
  "dstPort",
  "tcpWindow",
  "vlanId",
  "frameFlags",
  "l4Offset",
] as const;

export const U8_COLUMNS = [
  "tcpFlags",
  "l2Type",
  "l3Proto",
  "l4Proto",
  "ifaceId",
  "appHint",
] as const;

export const COLUMN_NAMES: readonly ColumnName[] = [
  ...U32_COLUMNS,
  ...I32_COLUMNS,
  ...U16_COLUMNS,
  ...U8_COLUMNS,
] as readonly ColumnName[];

export const BYTES_PER_FRAME =
  (U32_COLUMNS.length + I32_COLUMNS.length) * 4 + U16_COLUMNS.length * 2 + U8_COLUMNS.length * 1;

/** Largest value a Uint16 column can hold; bigger values are clamped. */
export const U16_MAX = 65535;
/** Largest value a Uint8 column can hold; bigger values are clamped. */
export const U8_MAX = 255;
/** Unassigned flow marker for the flowId column. */
export const NO_FLOW = -1;

/** frameFlags bits. */
export const FLAG_IPV6 = 1 << 0;
export const FLAG_TRUNCATED = 1 << 1; // capLen < origLen
export const FLAG_VLAN = 1 << 2;
export const FLAG_SHORT_L3 = 1 << 3; // header cut off by snaplen
export const FLAG_HAS_L4 = 1 << 4;
/** A length column (capLen/origLen/payloadLen) exceeded 65535 and was clamped. */
export const FLAG_LEN_CLAMPED = 1 << 5;
/** ifaceId exceeded 255 and was clamped. */
export const FLAG_IFACE_CLAMPED = 1 << 6;

/** l2Type values. */
export const L2_UNKNOWN = 0;
export const L2_ETHERNET = 1;
export const L2_LINUX_SLL = 2;
export const L2_RAW_IP = 3;
export const L2_IEEE802_11 = 4;
export const L2_NULL_LOOPBACK = 5;

/** l3Proto values. */
export const L3_NONE = 0;
export const L3_IPV4 = 1;
export const L3_IPV6 = 2;
export const L3_ARP = 3;
export const L3_OTHER = 4;

/** l4Proto holds the IANA IP protocol number; 0 means none/unknown. */
export const IPPROTO_NONE = 0;
export const IPPROTO_ICMP = 1;
export const IPPROTO_TCP = 6;
export const IPPROTO_UDP = 17;
export const IPPROTO_ICMPV6 = 58;

/** appHint values — reserved for protocol-hint dissection in a later phase. */
export const APP_HINT_NONE = 0;

type PagedU32 = Uint32Array[];
type PagedU16 = Uint16Array[];
type PagedU8 = Uint8Array[];

/** A single paged column. */
class Column<T extends Uint32Array | Uint16Array | Uint8Array> {
  readonly pages: T[] = [];
  constructor(private readonly make: (n: number) => T) {}

  private page(index: number): T {
    const p = index >>> 16; // index / PAGE_SIZE
    let page = this.pages[p];
    if (!page) {
      page = this.make(PAGE_SIZE);
      this.pages[p] = page;
    }
    return page;
  }

  set(index: number, value: number): void {
    this.page(index)[index & (PAGE_SIZE - 1)] = value;
  }

  get(index: number): number {
    const page = this.pages[index >>> 16];
    return page ? page[index & (PAGE_SIZE - 1)] : 0;
  }

  get pageCount(): number {
    return this.pages.filter(Boolean).length;
  }
}

export class PacketStore {
  private readonly u32 = new Map<string, Column<Uint32Array>>();
  private readonly u16 = new Map<string, Column<Uint16Array>>();
  private readonly u8 = new Map<string, Column<Uint8Array>>();
  private _count = 0;

  constructor() {
    for (const name of U32_COLUMNS) this.u32.set(name, new Column((n) => new Uint32Array(n)));
    for (const name of U16_COLUMNS) this.u16.set(name, new Column((n) => new Uint16Array(n)));
    for (const name of U8_COLUMNS) this.u8.set(name, new Column((n) => new Uint8Array(n)));
  }

  get count(): number {
    return this._count;
  }

  /** Append one frame; returns its index. */
  push(frame: Partial<Record<ColumnName, number>>): number {
    const i = this._count++;
    for (const [name, col] of this.u32) col.set(i, frame[name as ColumnName] ?? 0);
    // Uint16/Uint8 columns clamp rather than wrap: a jumbo length or a 9-bit
    // TCP flags word must never silently alias to a small value.
    for (const [name, col] of this.u16)
      col.set(i, Math.min(frame[name as ColumnName] ?? 0, U16_MAX));
    for (const [name, col] of this.u8) col.set(i, Math.min(frame[name as ColumnName] ?? 0, 255));
    return i;
  }

  get(index: number, name: ColumnName): number {
    return (
      this.u32.get(name)?.get(index) ??
      this.u16.get(name)?.get(index) ??
      this.u8.get(name)?.get(index) ??
      0
    );
  }

  /** Raw paged backing arrays, for transfer or inspection. */
  pagesOf(name: ColumnName): (Uint32Array | Uint16Array | Uint8Array)[] {
    const col = this.u32.get(name) ?? this.u16.get(name) ?? this.u8.get(name);
    return (col?.pages ?? []) as PagedU32 | PagedU16 | PagedU8;
  }

  /** Allocation report — proves paging rather than one upfront array. */
  allocationReport(): { column: ColumnName; pages: number; bytesPerElement: number }[] {
    const rows: { column: ColumnName; pages: number; bytesPerElement: number }[] = [];
    for (const [name, col] of this.u32)
      rows.push({ column: name as ColumnName, pages: col.pageCount, bytesPerElement: 4 });
    for (const [name, col] of this.u16)
      rows.push({ column: name as ColumnName, pages: col.pageCount, bytesPerElement: 2 });
    for (const [name, col] of this.u8)
      rows.push({ column: name as ColumnName, pages: col.pageCount, bytesPerElement: 1 });
    return rows;
  }
}

/**
 * IPv6 side table: 16-byte addresses interned to an index stored in
 * srcAddr32/dstAddr32 when l3Proto === L3_IPV6.
 */
export class Ipv6Table {
  private readonly map = new Map<string, number>();
  private readonly bytes: number[] = [];

  intern(addr: Uint8Array, offset: number): number {
    let key = "";
    for (let i = 0; i < 16; i++) key += addr[offset + i].toString(16).padStart(2, "0");
    const existing = this.map.get(key);
    if (existing !== undefined) return existing;
    const index = this.map.size;
    this.map.set(key, index);
    for (let i = 0; i < 16; i++) this.bytes.push(addr[offset + i]);
    return index;
  }

  get size(): number {
    return this.map.size;
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  addressAt(index: number): Uint8Array {
    return new Uint8Array(this.bytes.slice(index * 16, index * 16 + 16));
  }
}
