#!/usr/bin/env python3
"""Pulse-Speed PCAP Troubleshooter - Phase 0, item 24 memory-stress half.

Generates a deterministic ~100 MB / ~1.45M-frame small-packet capture:
pure 54-byte TCP ACK traffic (Ethernet 14 + IPv4 20 + TCP 20, no payload)
across 200 concurrent flows. This is the worst case for the columnar SoA
reader: maximum frames per megabyte, maximum flow-table churn, zero payload.

All checksums (IPv4 and TCP) are correct so the engine must not raise
checksum findings.

Run:  python3 test-corpus/generate-stress.py [output_path]
Default output: test-corpus/captures/24-ack-storm-memory-stress.pcap
(~101 MB - intentionally NOT committed to the repo; regenerate on demand.)
"""
import os
import struct
import sys

FLOWS = 200
FRAMES_PER_FLOW = 7250          # 200 * 7250 = 1,450,000 frames
TOTAL = FLOWS * FRAMES_PER_FLOW
FRAME_LEN = 54
SNAPLEN = 65535
START_EPOCH = 1_800_000_000     # fixed, deterministic
INTER_FRAME_US = 200            # 5,000 frames/s aggregate -> 290 s capture

MAC_C = bytes.fromhex("00155d0a0a01")
MAC_S = bytes.fromhex("00155d0b0b02")


def cksum(data: bytes) -> int:
    if len(data) % 2:
        data += b"\x00"
    s = 0
    for i in range(0, len(data), 2):
        s += (data[i] << 8) | data[i + 1]
    s = (s & 0xFFFF) + (s >> 16)
    s = (s & 0xFFFF) + (s >> 16)
    return (~s) & 0xFFFF


def ip2b(s: str) -> bytes:
    return bytes(int(x) for x in s.split("."))


def build_flow(idx):
    """Return (eth+ip prefix, src_ip, dst_ip, sport, dport)."""
    src = ip2b("10.%d.%d.%d" % (idx // 250 + 1, (idx % 250) + 1, 10))
    dst = ip2b("192.168.%d.%d" % (idx // 250 + 1, (idx % 250) + 1))
    sport = 40000 + idx
    dport = 443
    ip = bytearray(
        struct.pack(
            ">BBHHHBBH", 0x45, 0, 40, 0x1000 + idx, 0x4000, 64, 6, 0
        ) + src + dst
    )
    ip[10:12] = struct.pack(">H", cksum(bytes(ip)))
    eth = MAC_C + MAC_S + b"\x08\x00"
    eth_rev = MAC_S + MAC_C + b"\x08\x00"
    return bytes(eth), bytes(eth_rev), bytes(ip), src, dst, sport, dport


def tcp_ack(src, dst, sport, dport, seq, ack, win):
    hdr = struct.pack(">HHIIBBHHH", sport, dport, seq, ack, 0x50, 0x10, win, 0, 0)
    pseudo = src + dst + struct.pack(">BBH", 0, 6, 20)
    c = cksum(pseudo + hdr)
    return hdr[:16] + struct.pack(">H", c) + hdr[18:]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "captures", "24-ack-storm-memory-stress.pcap",
    )
    os.makedirs(os.path.dirname(out), exist_ok=True)

    flows = [build_flow(i) for i in range(FLOWS)]
    # reversed IP header (server -> client) per flow
    rev_ip = []
    for (_e, _er, ip, src, dst, _sp, _dp) in flows:
        r = bytearray(ip)
        r[12:16] = dst
        r[16:20] = src
        r[10:12] = b"\x00\x00"
        r[10:12] = struct.pack(">H", cksum(bytes(r)))
        rev_ip.append(bytes(r))

    ts_us = 0
    buf = bytearray()
    with open(out, "wb") as fh:
        fh.write(struct.pack("<IHHiIII", 0xA1B2C3D4, 2, 4, 0, 0, SNAPLEN, 1))
        for n in range(FRAMES_PER_FLOW):
            for i, (eth, eth_rev, ip, src, dst, sport, dport) in enumerate(flows):
                # client->server data ACK on even frames, server->client on odd
                seq = 1000 + n * 1460
                ack = 5000 + n * 1460
                if n & 1:
                    tcp = tcp_ack(dst, src, dport, sport, ack, seq, 64240)
                    frame = eth_rev + rev_ip[i] + tcp
                else:
                    tcp = tcp_ack(src, dst, sport, dport, seq, ack, 64240)
                    frame = eth + ip + tcp
                ts_us += INTER_FRAME_US
                buf += struct.pack(
                    "<IIII", START_EPOCH + ts_us // 1_000_000,
                    ts_us % 1_000_000, FRAME_LEN, FRAME_LEN
                ) + frame
            if len(buf) > 4 << 20:
                fh.write(buf)
                buf = bytearray()
        if buf:
            fh.write(buf)

    size = os.path.getsize(out)
    print("wrote %s: %d frames, %d bytes (%.1f MB)" % (out, TOTAL, size, size / 1e6))


if __name__ == "__main__":
    main()
