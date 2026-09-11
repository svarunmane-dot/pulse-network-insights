#!/usr/bin/env python3
"""Pulse-Speed PCAP Troubleshooter - Phase 0, item 24 memory-stress half.

Generates a deterministic ~100 MB / 1.45M-frame small-packet capture across
200 concurrent TCP conversations. This is the worst case for the columnar SoA
reader: maximum frames per megabyte, maximum flow-table churn, no bulk payload.

Frame pattern, repeated per conversation:
  server -> client  55 B  1-byte data segment, seq advances by 1
  client -> server  54 B  pure ACK, ack strictly advances by 1

Every ACK acknowledges data that is actually present in the capture and every
ack number within a conversation is strictly greater than the previous one, so
tshark reports ZERO tcp.analysis.flags: no duplicate ACKs, no keep-alives, no
"ACKed unseen segment", no "previous segment not captured". A minimal 1-byte
payload on the data direction is required for that - a capture of pure
zero-length ACKs can only be produced by acknowledging segments that were never
captured, which is itself a finding.

All IPv4 and TCP checksums are correct, so no checksum findings either.

Run:  python3 test-corpus/generate-stress.py [output_path]
Default output: test-corpus/captures/24-ack-storm-memory-stress.pcap
(~102 MB - intentionally NOT committed to the repo; regenerate on demand,
takes about 10 s.)
"""
import os
import struct
import sys

FLOWS = 200
PAIRS_PER_FLOW = 3625           # 2 frames per pair -> 7,250 frames per flow
TOTAL = FLOWS * PAIRS_PER_FLOW * 2      # 1,450,000 frames
SNAPLEN = 65535
START_EPOCH = 1_800_000_000     # fixed, deterministic
INTER_FRAME_US = 200            # 5,000 frames/s aggregate -> 290 s capture
DPORT = 33445                   # no well-known dissector, keeps output pure TCP

MAC_C = bytes.fromhex("00155d0a0a01")
MAC_S = bytes.fromhex("00155d0b0b02")
PAYLOAD = b"\x41"


def cksum(data: bytes) -> int:
    if len(data) % 2:
        data += b"\x00"
    s = 0
    for i in range(0, len(data), 2):
        s += (data[i] << 8) | data[i + 1]
    s = (s & 0xFFFF) + (s >> 16)
    s = (s & 0xFFFF) + (s >> 16)
    return (~s) & 0xFFFF


def ip_hdr(src, dst, ident, payload_len):
    ip = bytearray(
        struct.pack(">BBHHHBBH", 0x45, 0, 40 + payload_len, ident, 0x4000, 64, 6, 0)
        + src + dst
    )
    ip[10:12] = struct.pack(">H", cksum(bytes(ip)))
    return bytes(ip)


def tcp_seg(src, dst, sport, dport, seq, ack, win, payload=b""):
    flags = 0x18 if payload else 0x10
    hdr = struct.pack(">HHIIBBHHH", sport, dport, seq, ack, 0x50, flags, win, 0, 0)
    pseudo = src + dst + struct.pack(">BBH", 0, 6, 20 + len(payload))
    c = cksum(pseudo + hdr + payload)
    return hdr[:16] + struct.pack(">H", c) + hdr[18:] + payload


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "captures", "24-ack-storm-memory-stress.pcap",
    )
    os.makedirs(os.path.dirname(out), exist_ok=True)

    flows = []
    for i in range(FLOWS):
        src = bytes([10, i // 250 + 1, (i % 250) + 1, 10])
        dst = bytes([192, 168, i // 250 + 1, (i % 250) + 1])
        sport = 40000 + i
        flows.append((
            MAC_C + MAC_S + b"\x08\x00",          # eth client -> server
            MAC_S + MAC_C + b"\x08\x00",          # eth server -> client
            ip_hdr(src, dst, 0x1000 + i, 0),      # client -> server, no payload
            ip_hdr(dst, src, 0x8000 + i, 1),      # server -> client, 1 B payload
            src, dst, sport,
        ))

    ts_us = 0
    buf = bytearray()
    with open(out, "wb") as fh:
        fh.write(struct.pack("<IHHiIII", 0xA1B2C3D4, 2, 4, 0, 0, SNAPLEN, 1))
        for n in range(PAIRS_PER_FLOW):
            seq = 1 + n           # server sequence number for this segment
            ack = 2 + n           # client ack: strictly increasing, seq + 1
            for (eth_cs, eth_sc, ip_cs, ip_sc, src, dst, sport) in flows:
                data = eth_sc + ip_sc + tcp_seg(
                    dst, src, DPORT, sport, seq, 1, 64240, PAYLOAD
                )
                ts_us += INTER_FRAME_US
                buf += struct.pack(
                    "<IIII", START_EPOCH + ts_us // 1_000_000,
                    ts_us % 1_000_000, len(data), len(data)
                ) + data

                pure = eth_cs + ip_cs + tcp_seg(
                    src, dst, sport, DPORT, 1, ack, 64240
                )
                ts_us += INTER_FRAME_US
                buf += struct.pack(
                    "<IIII", START_EPOCH + ts_us // 1_000_000,
                    ts_us % 1_000_000, len(pure), len(pure)
                ) + pure
            if len(buf) > 4 << 20:
                fh.write(buf)
                buf = bytearray()
        if buf:
            fh.write(buf)

    size = os.path.getsize(out)
    print("wrote %s: %d frames, %d bytes (%.1f MB)" % (out, TOTAL, size, size / 1e6))


if __name__ == "__main__":
    main()
