/**
 * Phase 1b — minimal header dissection.
 *
 * Only what the 22-column model needs: L2 -> VLAN -> L3 -> L4 header
 * fields. No payload interpretation, no protocol state, no flow logic.
 * Every read is bounds-checked against the captured bytes so a
 * snaplen-truncated frame degrades instead of throwing.
 */

import {
  FLAG_HAS_L4,
  FLAG_IPV6,
  FLAG_SHORT_L3,
  FLAG_VLAN,
  L2_ETHERNET,
  L2_IEEE802_11,
  L2_LINUX_SLL,
  L2_NULL_LOOPBACK,
  L2_RAW_IP,
  L2_UNKNOWN,
  L3_ARP,
  L3_IPV4,
  L3_IPV6,
  L3_NONE,
  L3_OTHER,
  L4_ICMP,
  L4_ICMPV6,
  L4_NONE,
  L4_OTHER,
  L4_TCP,
  L4_UDP,
  type ColumnName,
} from "./columnar";
import type { Ipv6Table } from "./columnar";

export const LINKTYPE_NULL = 0;
export const LINKTYPE_ETHERNET = 1;
export const LINKTYPE_RAW = 101;
export const LINKTYPE_IEEE802_11 = 105;
export const LINKTYPE_LINUX_SLL = 113;
export const LINKTYPE_IPV4 = 228;
export const LINKTYPE_IPV6 = 229;
export const LINKTYPE_IEEE802_11_RADIOTAP = 127;

export function l2TypeOf(linkType: number): number {
  switch (linkType) {
    case LINKTYPE_ETHERNET:
      return L2_ETHERNET;
    case LINKTYPE_LINUX_SLL:
      return L2_LINUX_SLL;
    case LINKTYPE_RAW:
    case LINKTYPE_IPV4:
    case LINKTYPE_IPV6:
      return L2_RAW_IP;
    case LINKTYPE_IEEE802_11:
    case LINKTYPE_IEEE802_11_RADIOTAP:
      return L2_IEEE802_11;
    case LINKTYPE_NULL:
      return L2_NULL_LOOPBACK;
    default:
      return L2_UNKNOWN;
  }
}

export type DissectFields = Partial<Record<ColumnName, number>>;

/**
 * Dissect one captured frame.
 *
 * @param buf    buffer containing the frame
 * @param start  frame offset inside buf
 * @param capLen captured length (bytes actually present)
 */
export function dissectFrame(
  buf: Uint8Array,
  view: DataView,
  start: number,
  capLen: number,
  linkType: number,
  ipv6Table: Ipv6Table,
): DissectFields {
  const out: DissectFields = {
    l2Type: l2TypeOf(linkType),
    l3Proto: L3_NONE,
    l4Type: L4_NONE,
    frameFlags: 0,
  };
  const end = start + capLen;
  let pos = start;
  let etherType = -1;

  switch (out.l2Type) {
    case L2_ETHERNET: {
      if (end - pos < 14) return out;
      etherType = view.getUint16(pos + 12, false);
      pos += 14;
      // 802.1Q / QinQ
      let guard = 0;
      while ((etherType === 0x8100 || etherType === 0x88a8) && guard++ < 2) {
        if (end - pos < 4) return out;
        out.vlanId = view.getUint16(pos, false) & 0x0fff;
        out.frameFlags! |= FLAG_VLAN;
        etherType = view.getUint16(pos + 2, false);
        pos += 4;
      }
      break;
    }
    case L2_LINUX_SLL: {
      if (end - pos < 16) return out;
      etherType = view.getUint16(pos + 14, false);
      pos += 16;
      break;
    }
    case L2_RAW_IP: {
      if (end - pos < 1) return out;
      const v = buf[pos] >> 4;
      etherType = v === 6 ? 0x86dd : 0x0800;
      break;
    }
    case L2_NULL_LOOPBACK: {
      if (end - pos < 4) return out;
      const family = view.getUint32(pos, true);
      etherType =
        family === 2 ? 0x0800 : family === 24 || family === 28 || family === 30 ? 0x86dd : -1;
      pos += 4;
      break;
    }
    default:
      // 802.11 and unknown link layers: no L3 extraction in Phase 1b.
      return out;
  }

  if (etherType === 0x0806) {
    out.l3Proto = L3_ARP;
    return out;
  }

  if (etherType === 0x0800) {
    out.l3Proto = L3_IPV4;
    if (end - pos < 20) {
      out.frameFlags! |= FLAG_SHORT_L3;
      return out;
    }
    const ihl = (buf[pos] & 0x0f) * 4;
    out.ipTtl = buf[pos + 8];
    out.ipProto = buf[pos + 9];
    out.srcAddr32 = view.getUint32(pos + 12, false);
    out.dstAddr32 = view.getUint32(pos + 16, false);
    const totalLen = view.getUint16(pos + 2, false);
    if (ihl < 20 || end - pos < ihl) {
      out.frameFlags! |= FLAG_SHORT_L3;
      return out;
    }
    const l3PayloadLen = Math.max(0, totalLen - ihl);
    pos += ihl;
    dissectL4(buf, view, pos, end, out.ipProto, l3PayloadLen, out);
    return out;
  }

  if (etherType === 0x86dd) {
    out.l3Proto = L3_IPV6;
    out.frameFlags! |= FLAG_IPV6;
    if (end - pos < 40) {
      out.frameFlags! |= FLAG_SHORT_L3;
      return out;
    }
    out.ipTtl = buf[pos + 7]; // hop limit
    const nextHeader = buf[pos + 6];
    out.ipProto = nextHeader;
    out.srcAddr32 = ipv6Table.intern(buf, pos + 8);
    out.dstAddr32 = ipv6Table.intern(buf, pos + 24);
    const payloadLen = view.getUint16(pos + 4, false);
    pos += 40;
    dissectL4(buf, view, pos, end, nextHeader, payloadLen, out);
    return out;
  }

  out.l3Proto = etherType === -1 ? L3_NONE : L3_OTHER;
  return out;
}

function dissectL4(
  buf: Uint8Array,
  view: DataView,
  pos: number,
  end: number,
  proto: number,
  l3PayloadLen: number,
  out: DissectFields,
): void {
  if (proto === 6) {
    out.l4Type = L4_TCP;
    if (end - pos < 20) {
      out.frameFlags! |= FLAG_SHORT_L3;
      return;
    }
    out.srcPort = view.getUint16(pos, false);
    out.dstPort = view.getUint16(pos + 2, false);
    out.tcpSeq = view.getUint32(pos + 4, false);
    out.tcpAck = view.getUint32(pos + 8, false);
    const dataOffset = (buf[pos + 12] >> 4) * 4;
    out.tcpFlags = view.getUint16(pos + 12, false) & 0x0fff;
    out.tcpWindow = view.getUint16(pos + 14, false);
    out.payloadLen = Math.max(0, l3PayloadLen - Math.max(20, dataOffset));
    out.frameFlags! |= FLAG_HAS_L4;
    return;
  }
  if (proto === 17) {
    out.l4Type = L4_UDP;
    if (end - pos < 8) {
      out.frameFlags! |= FLAG_SHORT_L3;
      return;
    }
    out.srcPort = view.getUint16(pos, false);
    out.dstPort = view.getUint16(pos + 2, false);
    out.payloadLen = Math.max(0, view.getUint16(pos + 4, false) - 8);
    out.frameFlags! |= FLAG_HAS_L4;
    return;
  }
  if (proto === 1) {
    out.l4Type = L4_ICMP;
    out.payloadLen = Math.max(0, l3PayloadLen - 8);
    return;
  }
  if (proto === 58) {
    out.l4Type = L4_ICMPV6;
    out.payloadLen = Math.max(0, l3PayloadLen - 8);
    return;
  }
  out.l4Type = L4_OTHER;
  out.payloadLen = l3PayloadLen;
}
