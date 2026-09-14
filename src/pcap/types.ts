/** Phase 1b — shared capture types. */

export type CaptureKind = "libpcap" | "pcapng";

export interface InterfaceInfo {
  /** Global interface id assigned across all sections. */
  globalId: number;
  /** Section this interface was declared in (0 for libpcap). */
  section: number;
  /** Interface index inside its own section. */
  localId: number;
  linkType: number;
  snaplen: number;
  /** Nanoseconds per timestamp tick. */
  tsResolNs: number;
  name?: string;
  description?: string;
}

export interface DropCounters {
  interfaceGlobalId: number;
  ifDrop: number;
  filterDrop: number;
}

export interface CaptureStats {
  fileSize: number;
  format: CaptureKind;
  packetCount: number;
  /** Absolute epoch timestamps of the first/last frame, exact. */
  firstTimestamp: { sec: number; nsec: number } | null;
  lastTimestamp: { sec: number; nsec: number } | null;
  /** Seconds between first and last frame, computed in integer nanoseconds. */
  durationNs: number;
  interfaces: InterfaceInfo[];
  linkTypes: number[];
  /** Smallest declared snaplen across interfaces (0 if none declared). */
  snaplen: number;
  capturedBytes: number;
  originalBytes: number;
  truncatedPacketCount: number;
  malformedRecordCount: number;
  truncatedFinalRecord: boolean;
  resyncCount: number;
  abandonedAtOffset: number | null;
  pcapngSectionCount: number;
  pcapngInterfaceCount: number;
  pcapngDropCounters: DropCounters[];
  ipv4PacketCount: number;
  ipv6PacketCount: number;
  tcpPacketCount: number;
  udpPacketCount: number;
  icmpPacketCount: number;
  arpPacketCount: number;
  otherPacketCount: number;
  /** Non-fatal notes (truncated final record, resync, abandoned tail...). */
  notes: string[];
}

export function emptyStats(format: CaptureKind, fileSize: number): CaptureStats {
  return {
    fileSize,
    format,
    packetCount: 0,
    firstTimestamp: null,
    lastTimestamp: null,
    durationNs: 0,
    interfaces: [],
    linkTypes: [],
    snaplen: 0,
    capturedBytes: 0,
    originalBytes: 0,
    truncatedPacketCount: 0,
    malformedRecordCount: 0,
    truncatedFinalRecord: false,
    resyncCount: 0,
    abandonedAtOffset: null,
    pcapngSectionCount: 0,
    pcapngInterfaceCount: 0,
    pcapngDropCounters: [],
    ipv4PacketCount: 0,
    ipv6PacketCount: 0,
    tcpPacketCount: 0,
    udpPacketCount: 0,
    icmpPacketCount: 0,
    arpPacketCount: 0,
    otherPacketCount: 0,
    notes: [],
  };
}
