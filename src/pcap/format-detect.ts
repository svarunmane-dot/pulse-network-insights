/**
 * Phase 1a — format detection only.
 *
 * Pure functions. No browser globals, no I/O, no parsing beyond the
 * global header (libpcap) / first Section Header Block (PCAPNG).
 */

export type PcapEndianness = "little" | "big";
export type PcapTimestampResolution = "microsecond" | "nanosecond";

export type CaptureFormat =
  | {
      kind: "libpcap";
      endianness: PcapEndianness;
      timestampResolution: PcapTimestampResolution;
      magic: string;
      versionMajor: number;
      versionMinor: number;
      snaplen: number;
      /** LINKTYPE_* value from the global header. */
      linkType: number;
      /** Bytes consumed by the global header. */
      headerLength: 24;
    }
  | {
      kind: "pcapng";
      endianness: PcapEndianness;
      magic: string;
      versionMajor: number;
      versionMinor: number;
      /** Length of the first Section Header Block, in bytes. */
      sectionHeaderLength: number;
      /** -1 when the section length is unspecified (0xFFFFFFFFFFFFFFFF). */
      sectionLength: number;
    }
  | {
      kind: "unsupported";
      magic: string;
      reason: string;
    };

const LIBPCAP_MAGICS = {
  // magic bytes as read big-endian-first from the file
  d4c3b2a1: { endianness: "little", timestampResolution: "microsecond" },
  a1b2c3d4: { endianness: "big", timestampResolution: "microsecond" },
  "4d3cb2a1": { endianness: "little", timestampResolution: "nanosecond" },
  a1b23c4d: { endianness: "big", timestampResolution: "nanosecond" },
} as const satisfies Record<
  string,
  { endianness: PcapEndianness; timestampResolution: PcapTimestampResolution }
>;

const PCAPNG_BLOCK_TYPE_SHB = 0x0a0d0d0a;
const PCAPNG_BYTE_ORDER_MAGIC = 0x1a2b3c4d;

/** Minimum bytes needed to classify any supported format. */
export const DETECTION_MIN_BYTES = 32;

function hex(bytes: Uint8Array, length: number): string {
  let out = "";
  for (let i = 0; i < Math.min(length, bytes.length); i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Classify a capture from its leading bytes. Pass at least
 * {@link DETECTION_MIN_BYTES} bytes; more is ignored.
 */
export function detectCaptureFormat(head: Uint8Array): CaptureFormat {
  if (head.length < 4) {
    return {
      kind: "unsupported",
      magic: hex(head, head.length),
      reason: "File is too small to contain a capture header.",
    };
  }

  const magic4 = hex(head, 4);
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);

  const libpcap = LIBPCAP_MAGICS[magic4 as keyof typeof LIBPCAP_MAGICS];
  if (libpcap) {
    if (head.length < 24) {
      return {
        kind: "unsupported",
        magic: magic4,
        reason: "libpcap magic found but the 24-byte global header is truncated.",
      };
    }
    const le = libpcap.endianness === "little";
    return {
      kind: "libpcap",
      endianness: libpcap.endianness,
      timestampResolution: libpcap.timestampResolution,
      magic: magic4,
      versionMajor: view.getUint16(4, le),
      versionMinor: view.getUint16(6, le),
      snaplen: view.getUint32(16, le),
      linkType: view.getUint32(20, le),
      headerLength: 24,
    };
  }

  if (view.getUint32(0, false) === PCAPNG_BLOCK_TYPE_SHB) {
    if (head.length < 28) {
      return {
        kind: "unsupported",
        magic: magic4,
        reason: "PCAPNG magic found but the Section Header Block is truncated.",
      };
    }
    const byteOrderBE = view.getUint32(8, false);
    const byteOrderLE = view.getUint32(8, true);
    let le: boolean;
    if (byteOrderBE === PCAPNG_BYTE_ORDER_MAGIC) le = false;
    else if (byteOrderLE === PCAPNG_BYTE_ORDER_MAGIC) le = true;
    else {
      return {
        kind: "unsupported",
        magic: magic4,
        reason: "PCAPNG block header without a valid byte-order magic.",
      };
    }

    const sectionLengthRaw = view.getBigInt64(16, le);
    return {
      kind: "pcapng",
      endianness: le ? "little" : "big",
      magic: magic4,
      versionMajor: view.getUint16(12, le),
      versionMinor: view.getUint16(14, le),
      sectionHeaderLength: view.getUint32(4, le),
      sectionLength: sectionLengthRaw === -1n ? -1 : Number(sectionLengthRaw),
    };
  }

  const known: Record<string, string> = {
    "1f8b0800": "Gzip archive — decompress it before uploading.",
    "504b0304": "Zip archive — extract the capture first.",
    "d0cf11e0": "Legacy Microsoft Office document — not a capture.",
  };
  return {
    kind: "unsupported",
    magic: magic4,
    reason:
      known[magic4] ??
      "Not a libpcap or PCAPNG capture (unrecognised magic bytes). Supported: .pcap, .pcapng, .cap.",
  };
}
