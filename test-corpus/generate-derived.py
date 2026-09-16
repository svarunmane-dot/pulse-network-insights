#!/usr/bin/env python3
"""
Phase 1b derived fixtures.

Deterministically derives endian/resolution variants from the committed
baseline capture, plus a hand-built multi-section PCAPNG carrying an ISB
with drop counters and a binary if_tsresol. Nothing here is random.

  python3 test-corpus/generate-derived.py
"""
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CAP = ROOT / "captures"
SRC = CAP / "01-clean-baseline-tcp-http.pcap"


def read_libpcap(path):
    d = path.read_bytes()
    magic = d[:4].hex()
    le = magic in ("d4c3b2a1", "4d3cb2a1")
    end = "<" if le else ">"
    ns = magic in ("a1b23c4d", "4d3cb2a1")
    vmaj, vmin, tz, sig, snaplen, link = struct.unpack_from(end + "HHiIII", d, 4)
    recs, p = [], 24
    while p + 16 <= len(d):
        sec, frac, cap, orig = struct.unpack_from(end + "IIII", d, p)
        recs.append((sec, frac if not ns else frac // 1000, cap, orig, d[p + 16:p + 16 + cap]))
        p += 16 + cap
    return snaplen, link, recs  # frac normalised to microseconds


def write_libpcap(path, snaplen, link, recs, le, ns):
    end = "<" if le else ">"
    magic = (0xA1B23C4D if ns else 0xA1B2C3D4)
    out = bytearray(struct.pack(end + "IHHiIII", magic, 2, 4, 0, 0, snaplen, link))
    for sec, usec, cap, orig, data in recs:
        frac = usec * 1000 if ns else usec
        out += struct.pack(end + "IIII", sec, frac, cap, orig)
        out += data
    path.write_bytes(bytes(out))


def opt(code, value):
    pad = (-len(value)) % 4
    return struct.pack("<HH", code, len(value)) + value + b"\x00" * pad


def block(btype, body):
    total = len(body) + 12
    return struct.pack("<II", btype, total) + body + struct.pack("<I", total)


def shb():
    return block(0x0A0D0D0A, struct.pack("<IHHq", 0x1A2B3C4D, 1, 0, -1))


def idb(link, snaplen, tsresol):
    return block(0x00000001, struct.pack("<HHI", link, 0, snaplen) + opt(9, bytes([tsresol])) + opt(0, b""))


def epb(iface, ticks, data, orig):
    hi, lo = ticks >> 32, ticks & 0xFFFFFFFF
    pad = (-len(data)) % 4
    body = struct.pack("<IIIII", iface, hi, lo, len(data), orig) + data + b"\x00" * pad
    return block(0x00000006, body)


def isb(iface, ifdrop, filterdrop):
    body = struct.pack("<III", iface, 0, 0)
    body += opt(5, struct.pack("<Q", ifdrop)) + opt(7, struct.pack("<Q", filterdrop)) + opt(0, b"")
    return block(0x00000005, body)


def main():
    snaplen, link, recs = read_libpcap(SRC)

    write_libpcap(CAP / "27-libpcap-bigendian-micro.pcap", snaplen, link, recs, le=False, ns=False)
    write_libpcap(CAP / "28-libpcap-littleendian-nano.pcap", snaplen, link, recs, le=True, ns=True)
    write_libpcap(CAP / "29-libpcap-bigendian-nano.pcap", snaplen, link, recs, le=False, ns=True)

    # Multi-section PCAPNG: section 0 microsecond (tsresol 6),
    # section 1 binary resolution 2^-20 s (tsresol 0x94), plus ISB drops.
    out = bytearray()
    out += shb() + idb(link, snaplen, 6)
    for sec, usec, cap, orig, data in recs[:5]:
        out += epb(0, sec * 1_000_000 + usec, data, orig)
    out += isb(0, 17, 3)
    out += shb() + idb(link, snaplen, 0x94)
    for sec, usec, cap, orig, data in recs[5:]:
        ticks = (sec * 1_000_000 + usec) * (1 << 20) // 1_000_000
        out += epb(0, ticks, data, orig)
    out += isb(0, 5, 0)
    (CAP / "30-pcapng-multisection-isb.pcapng").write_bytes(bytes(out))

    # Corrupt PCAPNG: overwrite the middle of a block with garbage so the
    # trailing length check fails and the reader must resynchronise.
    good = (CAP / "22-pcapng-two-interfaces.pcapng").read_bytes()
    bad = bytearray(good)
    bad[150:170] = b"\xff" * 20
    (CAP / "31-pcapng-corrupt-resync.pcapng").write_bytes(bytes(bad))

    # Truncated classic pcap: cut the final record in half.
    src = SRC.read_bytes()
    (CAP / "32-libpcap-truncated-tail.pcap").write_bytes(src[: len(src) - 20])

    print("derived fixtures written")


if __name__ == "__main__":
    main()
