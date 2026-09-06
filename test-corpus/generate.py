#!/usr/bin/env python3
"""Pulse-Speed PCAP Troubleshooter - Phase 0 synthetic corpus generator.

Writes deterministic .pcap / .pcapng fixtures plus human-authored golden JSON
predictions. No dissector or rule code is involved; the golden files are the
expected-output contract the future reader/rule engine is graded against.

Run:  python3 test-corpus/generate.py
"""
import json
import os
import struct

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captures")
GOLD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "golden")
os.makedirs(OUT, exist_ok=True)
os.makedirs(GOLD, exist_ok=True)

LINKTYPE_ETHERNET = 1

MAC_A = bytes.fromhex("00155d010101")
MAC_B = bytes.fromhex("00155d020202")
MAC_GW = bytes.fromhex("00155d0000fe")
MAC_BCAST = b"\xff" * 6

# ---------------------------------------------------------------- primitives


def ip2b(s):
    return bytes(int(x) for x in s.split("."))


def ip6b(s):
    import ipaddress

    return ipaddress.IPv6Address(s).packed


def cksum(data):
    if len(data) % 2:
        data += b"\x00"
    s = 0
    for i in range(0, len(data), 2):
        s += (data[i] << 8) + data[i + 1]
    while s >> 16:
        s = (s & 0xFFFF) + (s >> 16)
    return (~s) & 0xFFFF


def eth(dst, src, ethertype, payload, vlan=None):
    if vlan is not None:
        return dst + src + struct.pack("!H", 0x8100) + struct.pack("!H", vlan) + struct.pack("!H", ethertype) + payload
    return dst + src + struct.pack("!H", ethertype) + payload


def ipv4(src, dst, proto, payload, ttl=64, ident=0, frag=0x4000):
    total = 20 + len(payload)
    hdr = struct.pack("!BBHHHBBH", 0x45, 0, total, ident, frag, ttl, proto, 0) + ip2b(src) + ip2b(dst)
    c = cksum(hdr)
    hdr = hdr[:10] + struct.pack("!H", c) + hdr[12:]
    return hdr + payload


def ipv6(src, dst, nxt, payload, hlim=64):
    return struct.pack("!IHBB", 0x60000000, len(payload), nxt, hlim) + ip6b(src) + ip6b(dst) + payload


def tcp(sport, dport, seq, ack, flags, payload=b"", window=64240, opts=b""):
    if len(opts) % 4:
        opts += b"\x00" * (4 - len(opts) % 4)
    off = (20 + len(opts)) // 4
    hdr = struct.pack("!HHIIBBHHH", sport, dport, seq, ack, off << 4, flags, window, 0, 0)
    return hdr + opts + payload


def udp(sport, dport, payload):
    return struct.pack("!HHHH", sport, dport, 8 + len(payload), 0) + payload


def icmp(t, code, rest=b"\x00" * 4, payload=b""):
    body = struct.pack("!BBH", t, code, 0) + rest + payload
    c = cksum(body)
    return body[:2] + struct.pack("!H", c) + body[4:]


def arp(op, sha, spa, tha, tpa):
    return struct.pack("!HHBBH", 1, 0x0800, 6, 4, op) + sha + ip2b(spa) + tha + ip2b(tpa)


# TCP flag constants
FIN, SYN, RST, PSH, ACK, URG = 0x01, 0x02, 0x04, 0x08, 0x10, 0x20


def dns_name(name):
    out = b""
    for label in name.split("."):
        out += bytes([len(label)]) + label.encode()
    return out + b"\x00"


def dns_query(txid, name, qtype=1, flags=0x0100):
    return struct.pack("!HHHHHH", txid, flags, 1, 0, 0, 0) + dns_name(name) + struct.pack("!HH", qtype, 1)


def dns_response(txid, name, addr=None, rcode=0, qtype=1):
    ancount = 1 if addr else 0
    body = struct.pack("!HHHHHH", txid, 0x8180 | rcode, 1, ancount, 0, 0) + dns_name(name) + struct.pack("!HH", qtype, 1)
    if addr:
        body += b"\xc0\x0c" + struct.pack("!HHIH", 1, 1, 60, 4) + ip2b(addr)
    return body


def dhcp(op, xid, chaddr, msgtype, ciaddr="0.0.0.0", yiaddr="0.0.0.0", siaddr="0.0.0.0"):
    pkt = struct.pack("!BBBBIHH", op, 1, 6, 0, xid, 0, 0x8000)
    pkt += ip2b(ciaddr) + ip2b(yiaddr) + ip2b(siaddr) + ip2b("0.0.0.0")
    pkt += chaddr + b"\x00" * 10 + b"\x00" * 64 + b"\x00" * 128
    pkt += b"\x63\x82\x53\x63" + bytes([53, 1, msgtype]) + b"\xff"
    return pkt


def tls_client_hello(sni):
    sni_b = sni.encode()
    server_name = b"\x00" + struct.pack("!H", len(sni_b)) + sni_b
    sni_list = struct.pack("!H", len(server_name)) + server_name
    ext_sni = struct.pack("!HH", 0, len(sni_list)) + sni_list
    exts = ext_sni
    body = (
        struct.pack("!H", 0x0303)
        + b"\x11" * 32
        + b"\x00"
        + struct.pack("!H", 2)
        + b"\x13\x01"
        + b"\x01\x00"
        + struct.pack("!H", len(exts))
        + exts
    )
    hs = b"\x01" + struct.pack("!I", len(body))[1:] + body
    return b"\x16\x03\x01" + struct.pack("!H", len(hs)) + hs


def tls_alert(level, desc):
    return b"\x15\x03\x03" + struct.pack("!H", 2) + bytes([level, desc])


def tls_server_hello():
    body = struct.pack("!H", 0x0303) + b"\x22" * 32 + b"\x00" + b"\x13\x01" + b"\x00" + struct.pack("!H", 0)
    hs = b"\x02" + struct.pack("!I", len(body))[1:] + body
    return b"\x16\x03\x03" + struct.pack("!H", len(hs)) + hs


# ---------------------------------------------------------------- writers


def write_pcap(path, frames, linktype=LINKTYPE_ETHERNET, snaplen=262144):
    with open(path, "wb") as f:
        f.write(struct.pack("<IHHiIII", 0xA1B2C3D4, 2, 4, 0, 0, snaplen, linktype))
        for ts, data, origlen in frames:
            sec = int(ts)
            usec = int(round((ts - sec) * 1e6))
            caplen = min(len(data), snaplen)
            f.write(struct.pack("<IIII", sec, usec, caplen, origlen or len(data)))
            f.write(data[:caplen])


def _opt(code, value):
    pad = (-len(value)) % 4
    return struct.pack("<HH", code, len(value)) + value + b"\x00" * pad


def write_pcapng(path, frames, ifaces=(("eth0", LINKTYPE_ETHERNET),)):
    """frames: (ts_seconds_float, bytes, origlen, iface_index)"""
    out = bytearray()
    body = _opt(3, b"synthetic corpus") + b"\x00\x00\x00\x00"
    shb = struct.pack("<IIIHHq", 0x0A0D0D0A, 0, 0x1A2B3C4D, 1, 0, -1) + body
    shb = shb[:4] + struct.pack("<I", len(shb) + 4) + shb[8:] + struct.pack("<I", len(shb) + 4)
    out += shb
    for name, lt in ifaces:
        b = struct.pack("<HHI", lt, 0, 262144) + _opt(2, name.encode()) + _opt(9, bytes([6])) + b"\x00\x00\x00\x00"
        idb = struct.pack("<II", 1, 0) + b
        idb = idb[:4] + struct.pack("<I", len(idb) + 4) + idb[8:] + struct.pack("<I", len(idb) + 4)
        out += idb
    for ts, data, origlen, ifidx in frames:
        tsu = int(round(ts * 1e6))
        pad = (-len(data)) % 4
        b = struct.pack("<IIIII", ifidx, tsu >> 32, tsu & 0xFFFFFFFF, len(data), origlen or len(data))
        b += data + b"\x00" * pad + b"\x00\x00\x00\x00"
        epb = struct.pack("<II", 6, 0) + b
        epb = epb[:4] + struct.pack("<I", len(epb) + 4) + epb[8:] + struct.pack("<I", len(epb) + 4)
        out += epb
    with open(path, "wb") as f:
        f.write(bytes(out))


CORPUS = []


def emit(item_id, name, desc, frames, golden, pcapng=False, ifaces=None, linktype=LINKTYPE_ETHERNET, snaplen=262144):
    ext = "pcapng" if pcapng else "pcap"
    fname = f"{item_id:02d}-{name}.{ext}"
    path = os.path.join(OUT, fname)
    if pcapng:
        write_pcapng(path, frames, ifaces or (("eth0", linktype),))
        count = len(frames)
    else:
        write_pcap(path, frames, linktype=linktype, snaplen=snaplen)
        count = len(frames)
    golden = dict(golden)
    golden["corpusItem"] = item_id
    golden["file"] = fname
    golden["description"] = desc
    golden["frameCount"] = count
    with open(os.path.join(GOLD, fname.rsplit(".", 1)[0] + ".golden.json"), "w") as f:
        json.dump(golden, f, indent=2)
        f.write("\n")
    CORPUS.append({"item": item_id, "file": fname, "frames": count, "bytes": os.path.getsize(path), "description": desc})


# ---------------------------------------------------------------- helpers


def tcp4(src, dst, sport, dport, seq, ack, flags, payload=b"", window=64240, vlan=None, ttl=64, opts=b""):
    seg = tcp(sport, dport, seq, ack, flags, payload, window, opts)
    return eth(MAC_B if src.endswith(".10") else MAC_A, MAC_A if src.endswith(".10") else MAC_B, 0x0800,
               ipv4(src, dst, 6, seg, ttl=ttl), vlan=vlan)


C = "192.168.1.10"   # client
S = "203.0.113.50"   # server
DNSSRV = "192.168.1.1"

BASE = 1767225600.0  # 2026-01-01T00:00:00Z

# ---------------------------------------------------------------- item 1
f = []
t = BASE
f.append((t, tcp4(C, S, 50001, 80, 1000, 0, SYN), None))
f.append((t + 0.020, tcp4(S, C, 80, 50001, 5000, 1001, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50001, 80, 1001, 5001, ACK), None))
req = b"GET /index.html HTTP/1.1\r\nHost: example.net\r\nUser-Agent: pulse/1.0\r\n\r\n"
f.append((t + 0.021, tcp4(C, S, 50001, 80, 1001, 5001, PSH | ACK, req), None))
f.append((t + 0.041, tcp4(S, C, 80, 50001, 5001, 1001 + len(req), ACK), None))
resp = b"HTTP/1.1 200 OK\r\nContent-Length: 5\r\nContent-Type: text/plain\r\n\r\nhello"
f.append((t + 0.045, tcp4(S, C, 80, 50001, 5001, 1001 + len(req), PSH | ACK, resp), None))
f.append((t + 0.0452, tcp4(C, S, 50001, 80, 1001 + len(req), 5001 + len(resp), ACK), None))
f.append((t + 0.050, tcp4(C, S, 50001, 80, 1001 + len(req), 5001 + len(resp), FIN | ACK), None))
f.append((t + 0.070, tcp4(S, C, 80, 50001, 5001 + len(resp), 1002 + len(req), FIN | ACK), None))
f.append((t + 0.0702, tcp4(C, S, 50001, 80, 1002 + len(req), 5002 + len(resp), ACK), None))
emit(1, "clean-baseline-tcp-http", "Clean bidirectional TCP+HTTP session: handshake, request, 200 OK, graceful FIN close.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional", "expectTruncated": False, "expectDropIndicators": False},
    "mustReport": [],
    "mustNotReport": [
        "tcp.retransmission", "tcp.dup-ack", "tcp.out-of-order", "tcp.zero-window",
        "tcp.window-full", "tcp.reset", "tcp.handshake-incomplete", "tcp.high-rtt",
        "capture.asymmetric", "capture.truncated"],
    "notes": "Baseline false-positive guard. Any finding at all is a rule-engine failure.",
})

# ---------------------------------------------------------------- item 2
f = []
t = BASE
for i, dt in enumerate([0.0, 1.0, 3.0, 7.0]):
    f.append((t + dt, tcp4(C, S, 50002, 8443, 2000, 0, SYN), None))
emit(2, "syn-no-synack", "Four SYN retries to port 8443, no SYN/ACK ever returned; connection never establishes.", f, {
    "captureQuality": {"expectDirectionality": "unidirectional-flow", "expectTruncated": False},
    "mustReport": [
        {"ruleId": "tcp.syn-retransmission", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [1, 2, 3], "detail": "3 SYN retransmissions with ~1s/2s/4s exponential backoff"},
        {"ruleId": "tcp.handshake-incomplete", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [0, 1, 2, 3], "detail": "No SYN/ACK for 192.168.1.10:50002 -> 203.0.113.50:8443"}],
    "mustNotReport": ["tcp.reset", "tcp.dup-ack", "tcp.zero-window", "tcp.out-of-order"],
    "notes": "Causes must be tiered 'possible': firewall drop, service not listening with silent drop, black-holed route. Must NOT assert which one.",
})

# ---------------------------------------------------------------- item 3
f = []
t = BASE
f.append((t, tcp4(C, S, 50003, 3389, 3000, 0, SYN), None))
f.append((t + 0.018, tcp4(S, C, 3389, 50003, 0, 3001, RST | ACK), None))
emit(3, "syn-rst-refused", "SYN answered immediately with RST/ACK: connection actively refused.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.connection-refused", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [0, 1], "detail": "RST/ACK 18 ms after SYN, before any data"}],
    "mustNotReport": ["tcp.syn-retransmission", "tcp.handshake-incomplete", "tcp.retransmission", "tcp.high-rtt"],
    "notes": "Fast RST implies reachable host with closed port or a rejecting middlebox - both 'likely', neither 'observed'.",
})

# ---------------------------------------------------------------- item 4
f = []
t = BASE
f.append((t, tcp4(C, S, 50004, 443, 4000, 0, SYN), None))
f.append((t + 0.03, tcp4(S, C, 443, 50004, 9000, 4001, SYN | ACK), None))
f.append((t + 0.0302, tcp4(C, S, 50004, 443, 4001, 9001, ACK), None))
payload = b"X" * 1400
f.append((t + 0.031, tcp4(C, S, 50004, 443, 4001, 9001, PSH | ACK, payload), None))
f.append((t + 0.331, tcp4(C, S, 50004, 443, 4001, 9001, PSH | ACK, payload), None))
f.append((t + 0.931, tcp4(C, S, 50004, 443, 4001, 9001, PSH | ACK, payload), None))
f.append((t + 0.960, tcp4(S, C, 443, 50004, 9001, 4001 + 1400, ACK), None))
emit(4, "tcp-retransmission-rto", "Same 1400-byte segment sent three times with RTO backoff before it is finally ACKed.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.retransmission", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [4, 5], "detail": "2 retransmissions of seq 4001 len 1400 (300 ms then 600 ms RTO)"},
        {"ruleId": "tcp.packet-loss-indicator", "severity": "warning", "certainty": "likely",
         "evidenceFrames": [3, 4, 5, 6], "detail": "Loss inferred from timer-based retransmit with no intervening ACK"}],
    "mustNotReport": ["tcp.out-of-order", "tcp.dup-ack", "tcp.zero-window", "tcp.handshake-incomplete", "tcp.reset"],
    "notes": "Retransmission itself is 'observed'; direction of loss is 'likely' only - capture point is client-side.",
})

# ---------------------------------------------------------------- item 5
f = []
t = BASE
f.append((t, tcp4(C, S, 50005, 443, 5000, 0, SYN), None))
f.append((t + 0.02, tcp4(S, C, 443, 50005, 7000, 5001, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50005, 443, 5001, 7001, ACK), None))
seq = 7001
for i in range(1, 5):  # server segments; segment #1 (seq 7001) is missing from capture
    f.append((t + 0.03 + i * 0.001, tcp4(S, C, 443, 50005, seq + i * 1400, 5001, ACK, b"Y" * 1400), None))
for i in range(3):
    f.append((t + 0.035 + i * 0.001, tcp4(C, S, 50005, 443, 5001, 7001, ACK), None))
f.append((t + 0.040, tcp4(S, C, 443, 50005, 7001, 5001, ACK, b"Y" * 1400), None))
emit(5, "dup-acks-fast-retransmit", "Missing server segment triggers 3 duplicate ACKs and a fast retransmit.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.dup-ack", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [7, 8, 9], "detail": "3 duplicate ACKs for ack=7001"},
        {"ruleId": "tcp.fast-retransmission", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [10], "detail": "Retransmit of seq 7001 immediately after 3rd dup-ACK"},
        {"ruleId": "tcp.packet-loss-indicator", "severity": "warning", "certainty": "likely",
         "evidenceFrames": [3, 7, 8, 9, 10], "detail": "Gap in server sequence space before the capture point"}],
    "mustNotReport": ["tcp.zero-window", "tcp.reset", "tcp.handshake-incomplete", "tcp.connection-refused"],
    "notes": "Segments 3..6 arriving above the gap must be classified as out-of-order OR previous-segment-missing, not as retransmissions.",
})

# ---------------------------------------------------------------- item 6
f = []
t = BASE
f.append((t, tcp4(C, S, 50006, 80, 6000, 0, SYN), None))
f.append((t + 0.02, tcp4(S, C, 80, 50006, 8000, 6001, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50006, 80, 6001, 8001, ACK), None))
segs = [8001, 9401, 12201, 10801, 13601]  # 4th arrives late/out of order
for i, s in enumerate(segs):
    f.append((t + 0.03 + i * 0.002, tcp4(S, C, 80, 50006, s, 6001, ACK, b"Z" * 1400), None))
emit(6, "tcp-out-of-order", "Server segments arrive 1,2,4,3,5 - one segment delivered out of sequence order.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.out-of-order", "severity": "observation", "certainty": "observed",
         "evidenceFrames": [5, 6], "detail": "seq 12201 seen before seq 10801; seq 10801 arrives 2 ms later with lower seq and no retransmit timer"}],
    "mustNotReport": ["tcp.retransmission", "tcp.fast-retransmission", "tcp.dup-ack", "tcp.packet-loss-indicator"],
    "notes": "Discriminator: reordered segment arrives within one RTT and was never previously seen -> out-of-order, not retransmission.",
})

# ---------------------------------------------------------------- item 7
f = []
t = BASE
f.append((t, tcp4(C, S, 50007, 445, 7000, 0, SYN), None))
f.append((t + 0.02, tcp4(S, C, 445, 50007, 3000, 7001, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50007, 445, 7001, 3001, ACK), None))
f.append((t + 0.03, tcp4(S, C, 445, 50007, 3001, 7001, ACK, b"D" * 1400, window=2000), None))
f.append((t + 0.031, tcp4(C, S, 50007, 445, 7001, 4401, ACK, window=0), None))
f.append((t + 0.35, tcp4(S, C, 445, 50007, 4401, 7001, ACK, window=2000), None))  # zero-window probe
f.append((t + 0.351, tcp4(C, S, 50007, 445, 7001, 4401, ACK, window=0), None))
f.append((t + 1.35, tcp4(C, S, 50007, 445, 7001, 4401, ACK, window=64240), None))  # window update
emit(7, "tcp-zero-window", "Receiver advertises window 0 for ~1.3 s, sender probes, window finally re-opens.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.zero-window", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [4, 6], "detail": "Window 0 advertised by 192.168.1.10:50007, stalled ~1.319 s"},
        {"ruleId": "tcp.zero-window-probe", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [5], "detail": "Sender keep-probe during zero-window"},
        {"ruleId": "tcp.window-update", "severity": "observation", "certainty": "observed",
         "evidenceFrames": [7], "detail": "Window re-opened to 64240"}],
    "mustNotReport": ["tcp.retransmission", "tcp.reset", "tcp.dup-ack"],
    "notes": "Cause must be 'likely': receiving application not draining its socket buffer. Never assert a specific application.",
})

# ---------------------------------------------------------------- item 8
f = []
t = BASE
f.append((t, tcp4(C, S, 50008, 445, 8000, 0, SYN, window=8192), None))
f.append((t + 0.02, tcp4(S, C, 445, 50008, 4000, 8001, SYN | ACK, window=8192), None))
f.append((t + 0.0202, tcp4(C, S, 50008, 445, 8001, 4001, ACK, window=8192), None))
seq = 4001
for i in range(6):  # 6 x 1400 = 8400 > 8192 advertised window
    f.append((t + 0.03 + i * 0.0005, tcp4(S, C, 445, 50008, seq + i * 1400, 8001, ACK, b"W" * 1400, window=8192), None))
f.append((t + 0.10, tcp4(C, S, 50008, 445, 8001, seq + 5 * 1400, ACK, window=8192), None))
emit(8, "tcp-window-full", "Sender fills the receiver's entire advertised 8192-byte window and stalls awaiting an ACK.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.window-full", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [8], "detail": "Bytes in flight reach advertised window 8192 for 203.0.113.50:445"},
        {"ruleId": "tcp.throughput-limited-by-window", "severity": "observation", "certainty": "likely",
         "evidenceFrames": [3, 8, 9], "detail": "Small receive window plus 20 ms RTT bounds throughput"}],
    "mustNotReport": ["tcp.zero-window", "tcp.retransmission", "tcp.dup-ack", "tcp.reset"],
    "notes": "window-full is a sender-side condition and must not be conflated with zero-window (receiver-side).",
})

# ---------------------------------------------------------------- item 9
f = []
t = BASE
f.append((t, tcp4(C, S, 50009, 443, 9000, 0, SYN), None))
f.append((t + 0.02, tcp4(S, C, 443, 50009, 6000, 9001, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50009, 443, 9001, 6001, ACK), None))
f.append((t + 0.03, tcp4(C, S, 50009, 443, 9001, 6001, PSH | ACK, b"REQUEST" * 20), None))
f.append((t + 0.05, tcp4(S, C, 443, 50009, 6001, 9001 + 140, ACK), None))
f.append((t + 2.05, tcp4(S, C, 443, 50009, 6001, 9001 + 140, RST | ACK), None))
emit(9, "tcp-midstream-reset", "Established session torn down by a server RST 2 s after the client request, with no response data.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.reset", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [5], "detail": "RST from 203.0.113.50:443 on an established flow after 2.02 s idle"},
        {"ruleId": "tcp.request-unanswered", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [3, 4, 5], "detail": "140 request bytes ACKed but never answered with payload"}],
    "mustNotReport": ["tcp.connection-refused", "tcp.handshake-incomplete", "tcp.retransmission", "tcp.zero-window"],
    "notes": "Mid-stream RST must be a distinct rule from SYN-RST refusal (item 3).",
})

# ---------------------------------------------------------------- item 10
f = []
t = BASE
f.append((t, tcp4(C, S, 50010, 443, 10000, 0, SYN), None))
f.append((t + 0.412, tcp4(S, C, 443, 50010, 2000, 10001, SYN | ACK), None))
f.append((t + 0.4122, tcp4(C, S, 50010, 443, 10001, 2001, ACK), None))
f.append((t + 0.42, tcp4(C, S, 50010, 443, 10001, 2001, PSH | ACK, b"Q" * 100), None))
f.append((t + 0.83, tcp4(S, C, 443, 50010, 2001, 10101, ACK), None))
f.append((t + 0.84, tcp4(S, C, 443, 50010, 2001, 10101, PSH | ACK, b"R" * 200), None))
emit(10, "tcp-high-rtt", "Handshake RTT of 412 ms and data ACK RTT of ~410 ms with no loss.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tcp.high-rtt", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [0, 1, 3, 4], "detail": "SYN->SYN/ACK 412 ms; data->ACK 410 ms"}],
    "mustNotReport": ["tcp.retransmission", "tcp.dup-ack", "tcp.out-of-order", "tcp.zero-window", "tcp.packet-loss-indicator"],
    "notes": "High latency with zero loss must not be reported as congestion; causes 'possible': long path, satellite/mobile link, queueing.",
})

# ---------------------------------------------------------------- item 11
f = []
t = BASE
q = eth(MAC_A, MAC_GW, 0x0800, ipv4(C, DNSSRV, 17, udp(53123, 53, dns_query(0x1234, "does-not-exist.example.net"))))
r = eth(MAC_GW, MAC_A, 0x0800, ipv4(DNSSRV, C, 17, udp(53, 53123, dns_response(0x1234, "does-not-exist.example.net", None, rcode=3))))
f.append((t, q, None))
f.append((t + 0.015, r, None))
q2 = eth(MAC_A, MAC_GW, 0x0800, ipv4(C, DNSSRV, 17, udp(53124, 53, dns_query(0x1235, "timeout.example.net"))))
f.append((t + 0.1, q2, None))
f.append((t + 1.1, q2, None))
f.append((t + 3.1, q2, None))
emit(11, "dns-nxdomain-and-timeout", "One NXDOMAIN answer plus a second query retried 3x with no answer at all.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "dns.nxdomain", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [1], "detail": "rcode=3 for does-not-exist.example.net"},
        {"ruleId": "dns.no-response", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [2, 3, 4], "detail": "txid 0x1235 timeout.example.net asked 3x, never answered"},
        {"ruleId": "dns.query-retransmission", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [3, 4], "detail": "2 retries at 1 s and 2 s"}],
    "mustNotReport": ["dns.slow-response", "tcp.retransmission", "icmp.unreachable"],
    "notes": "NXDOMAIN is a valid server answer - severity warning, never critical.",
})

# ---------------------------------------------------------------- item 12
f = []
t = BASE
q = eth(MAC_A, MAC_GW, 0x0800, ipv4(C, DNSSRV, 17, udp(53200, 53, dns_query(0x2001, "slow.example.net"))))
r = eth(MAC_GW, MAC_A, 0x0800, ipv4(DNSSRV, C, 17, udp(53, 53200, dns_response(0x2001, "slow.example.net", "203.0.113.50"))))
f.append((t, q, None))
f.append((t + 2.45, r, None))
q2 = eth(MAC_A, MAC_GW, 0x0800, ipv4(C, DNSSRV, 17, udp(53201, 53, dns_query(0x2002, "fast.example.net"))))
r2 = eth(MAC_GW, MAC_A, 0x0800, ipv4(DNSSRV, C, 17, udp(53, 53201, dns_response(0x2002, "fast.example.net", "203.0.113.51"))))
f.append((t + 3.0, q2, None))
f.append((t + 3.008, r2, None))
emit(12, "dns-slow-response", "One DNS answer takes 2.45 s; a control query answers in 8 ms.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "dns.slow-response", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [0, 1], "detail": "2450 ms query->response latency for slow.example.net"}],
    "mustNotReport": ["dns.no-response", "dns.nxdomain", "dns.query-retransmission"],
    "notes": "The 8 ms control transaction must not be flagged; threshold must be well above 8 ms and at/below 2450 ms.",
})

# ---------------------------------------------------------------- item 13
f = []
t = BASE
xid = 0xAABBCCDD
d = eth(MAC_A, MAC_BCAST, 0x0800, ipv4("0.0.0.0", "255.255.255.255", 17, udp(68, 67, dhcp(1, xid, MAC_A, 1))))
for dt in [0.0, 2.0, 6.0, 14.0]:
    f.append((t + dt, d, None))
emit(13, "dhcp-discover-no-offer", "Four DHCP DISCOVERs with exponential backoff and no OFFER on the wire.", f, {
    "captureQuality": {"expectDirectionality": "unidirectional-flow"},
    "mustReport": [
        {"ruleId": "dhcp.no-offer", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [0, 1, 2, 3], "detail": "4 DISCOVERs for xid 0xAABBCCDD over 14 s, zero OFFERs"},
        {"ruleId": "dhcp.discover-retransmission", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [1, 2, 3], "detail": "Backoff 2 s / 4 s / 8 s"}],
    "mustNotReport": ["dhcp.nak", "dhcp.duplicate-offer", "arp.duplicate-address"],
    "notes": "Causes 'possible': no DHCP server on the VLAN, relay misconfigured, pool exhausted (pool exhaustion normally yields a NAK, so rank it lower).",
})

# ---------------------------------------------------------------- item 14
f = []
t = BASE
f.append((t, eth(MAC_A, MAC_BCAST, 0x0806, arp(1, MAC_A, "192.168.1.77", b"\x00" * 6, "192.168.1.77")), None))
f.append((t + 0.5, eth(MAC_B, MAC_BCAST, 0x0806, arp(1, MAC_B, "192.168.1.77", b"\x00" * 6, "192.168.1.77")), None))
f.append((t + 0.6, eth(MAC_A, MAC_BCAST, 0x0806, arp(2, MAC_A, "192.168.1.77", MAC_B, "192.168.1.77")), None))
for i in range(12):
    f.append((t + 1.0 + i * 0.01, eth(MAC_B, MAC_BCAST, 0x0806, arp(1, MAC_B, "192.168.1.20", b"\x00" * 6, f"192.168.1.{100 + i}")), None))
emit(14, "arp-conflict-and-scan", "Two MACs claim 192.168.1.77 (duplicate address), followed by a 12-target ARP sweep.", f, {
    "captureQuality": {"expectDirectionality": "broadcast-only"},
    "mustReport": [
        {"ruleId": "arp.duplicate-address", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [0, 1, 2], "detail": "192.168.1.77 announced by 00:15:5d:01:01:01 and 00:15:5d:02:02:02"},
        {"ruleId": "arp.scan-burst", "severity": "observation", "certainty": "likely",
         "evidenceFrames": list(range(3, 15)), "detail": "12 ARP requests for 12 distinct targets from one MAC in 120 ms"},
        {"ruleId": "arp.unanswered-request", "severity": "observation", "certainty": "observed",
         "evidenceFrames": list(range(3, 15)), "detail": "None of the 12 sweep requests are answered in this capture"}],
    "mustNotReport": ["arp.gratuitous-normal", "tcp.retransmission", "dhcp.no-offer"],
    "notes": "Sweep certainty is 'likely' - a legitimate scanner or monitoring tool is an equally valid cause.",
})

# ---------------------------------------------------------------- item 17
f = []
t = BASE
orig = ipv4(C, "198.51.100.9", 17, udp(40000, 33434, b"trace"), ttl=1)
f.append((t, eth(MAC_A, MAC_GW, 0x0800, orig), None))
quote = orig[:28]
f.append((t + 0.005, eth(MAC_GW, MAC_A, 0x0800, ipv4("192.168.1.1", C, 1, icmp(11, 0, payload=quote))), None))
orig2 = ipv4(C, "198.51.100.9", 6, tcp(50017, 443, 100, 0, SYN))
f.append((t + 0.10, eth(MAC_A, MAC_GW, 0x0800, orig2), None))
f.append((t + 0.115, eth(MAC_GW, MAC_A, 0x0800, ipv4("203.0.113.1", C, 1, icmp(3, 3, payload=orig2[:28]))), None))
f.append((t + 0.20, eth(MAC_A, MAC_GW, 0x0800, ipv4(C, "198.51.100.9", 1, icmp(8, 0, payload=b"P" * 32))), None))
f.append((t + 0.22, eth(MAC_GW, MAC_A, 0x0800, ipv4("203.0.113.1", C, 1, icmp(3, 4, payload=ipv4(C, "198.51.100.9", 1, b"\x08\x00")[:28]))), None))
emit(17, "icmp-unreachable-and-ttl", "ICMP TTL exceeded, port unreachable, and fragmentation-needed responses.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "icmp.port-unreachable", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [3], "detail": "type 3 code 3 from 203.0.113.1 quoting TCP 50017->443"},
        {"ruleId": "icmp.fragmentation-needed", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [5], "detail": "type 3 code 4 - PMTU black-hole risk"},
        {"ruleId": "icmp.ttl-exceeded", "severity": "observation", "certainty": "observed",
         "evidenceFrames": [1], "detail": "type 11 code 0, consistent with a traceroute probe"}],
    "mustNotReport": ["icmp.echo-no-reply", "tcp.handshake-incomplete", "tcp.reset"],
    "notes": "TTL-exceeded next to a TTL=1 UDP probe to port 33434 is expected traceroute behaviour - observation, not a fault.",
})

# ---------------------------------------------------------------- item 18
f = []
t = BASE
f.append((t, tcp4(C, S, 50018, 80, 1800, 0, SYN, vlan=10), None))
f.append((t + 0.02, tcp4(S, C, 80, 50018, 4800, 1801, SYN | ACK, vlan=10), None))
f.append((t + 0.0202, tcp4(C, S, 50018, 80, 1801, 4801, ACK, vlan=10), None))
f.append((t + 0.03, tcp4("192.168.20.10", "203.0.113.60", 50019, 80, 1900, 0, SYN, vlan=20), None))
f.append((t + 0.05, tcp4("203.0.113.60", "192.168.20.10", 80, 50019, 4900, 1901, SYN | ACK, vlan=20), None))
f.append((t + 0.0502, tcp4("192.168.20.10", "203.0.113.60", 50019, 80, 1901, 4901, ACK, vlan=20), None))
emit(18, "vlan-tagged-802.1q", "Two healthy TCP handshakes on 802.1Q VLANs 10 and 20 on the same trunk.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional", "expectVlansSeen": [10, 20]},
    "mustReport": [],
    "mustNotReport": ["tcp.retransmission", "tcp.handshake-incomplete", "vlan.mismatch", "tcp.dup-ack"],
    "notes": "Correctness contract: vlanId column must be 10 for frames 0-2 and 20 for frames 3-5, flowId must differ per VLAN even if the 5-tuple repeated.",
})

# ---------------------------------------------------------------- item 19
f = []
t = BASE
c6, s6 = "2001:db8:1::10", "2001:db8:2::50"
def tcp6(src, dst, sp, dp, seq, ack, flags, payload=b"", window=64240):
    return eth(MAC_A, MAC_B, 0x86DD, ipv6(src, dst, 6, tcp(sp, dp, seq, ack, flags, payload, window)))
f.append((t, tcp6(c6, s6, 50020, 443, 1000, 0, SYN), None))
f.append((t + 0.025, tcp6(s6, c6, 443, 50020, 7000, 1001, SYN | ACK), None))
f.append((t + 0.0252, tcp6(c6, s6, 50020, 443, 1001, 7001, ACK), None))
f.append((t + 0.03, tcp6(c6, s6, 50020, 443, 1001, 7001, PSH | ACK, tls_client_hello("secure.example.net")), None))
f.append((t + 0.06, tcp6(s6, c6, 443, 50020, 7001, 1001 + len(tls_client_hello("secure.example.net")), ACK), None))
emit(19, "ipv6-tcp-tls", "IPv6 TCP handshake followed by a TLS ClientHello with SNI secure.example.net.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional", "expectIpv6": True},
    "mustReport": [],
    "mustNotReport": ["tcp.retransmission", "tcp.handshake-incomplete", "tls.handshake-failure", "ipv6.unsupported"],
    "notes": "Correctness contract for the frozen IPv6 interning design: srcAddr32/dstAddr32 must hold v6 side-table indices, and the two v6 addresses must intern to exactly 2 distinct entries.",
})

# ---------------------------------------------------------------- item 20
f = []
t = BASE
ch = tls_client_hello("broken.example.net")
f.append((t, tcp4(C, S, 50021, 443, 2100, 0, SYN), None))
f.append((t + 0.02, tcp4(S, C, 443, 50021, 8100, 2101, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50021, 443, 2101, 8101, ACK), None))
f.append((t + 0.021, tcp4(C, S, 50021, 443, 2101, 8101, PSH | ACK, ch), None))
al = tls_alert(2, 40)  # fatal, handshake_failure
f.append((t + 0.045, tcp4(S, C, 443, 50021, 8101, 2101 + len(ch), PSH | ACK, al), None))
f.append((t + 0.046, tcp4(S, C, 443, 50021, 8101 + len(al), 2101 + len(ch), FIN | ACK), None))
emit(20, "tls-handshake-failure-alert", "TLS ClientHello (SNI broken.example.net) answered with fatal alert 40 handshake_failure.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "tls.fatal-alert", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [4], "detail": "Alert level 2 (fatal) description 40 (handshake_failure)"},
        {"ruleId": "tls.handshake-incomplete", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [3, 4, 5], "detail": "ClientHello sent, no ServerHello, session closed"}],
    "mustNotReport": ["tcp.reset", "tcp.retransmission", "tls.weak-cipher", "tcp.handshake-incomplete"],
    "notes": "SNI broken.example.net must appear in evidence. Causes 'possible': no shared cipher/version, SNI not served, client cert required.",
})

# ---------------------------------------------------------------- item 21
f = []
t = BASE
f.append((t, tcp4(C, S, 50022, 80, 2200, 0, SYN), None))
f.append((t + 0.02, tcp4(S, C, 80, 50022, 9200, 2201, SYN | ACK), None))
f.append((t + 0.0202, tcp4(C, S, 50022, 80, 2201, 9201, ACK), None))
req = b"GET /api/report HTTP/1.1\r\nHost: app.example.net\r\n\r\n"
f.append((t + 0.021, tcp4(C, S, 50022, 80, 2201, 9201, PSH | ACK, req), None))
f.append((t + 0.041, tcp4(S, C, 80, 50022, 9201, 2201 + len(req), ACK), None))
r500 = b"HTTP/1.1 500 Internal Server Error\r\nContent-Length: 11\r\n\r\nserver fail"
f.append((t + 5.2, tcp4(S, C, 80, 50022, 9201, 2201 + len(req), PSH | ACK, r500), None))
req2 = b"GET /api/missing HTTP/1.1\r\nHost: app.example.net\r\n\r\n"
f.append((t + 5.3, tcp4(C, S, 50022, 80, 2201 + len(req), 9201 + len(r500), PSH | ACK, req2), None))
r404 = b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n"
f.append((t + 5.33, tcp4(S, C, 80, 50022, 9201 + len(r500), 2201 + len(req) + len(req2), PSH | ACK, r404), None))
emit(21, "http-500-and-slow-response", "HTTP/1.1 request answered with 500 after 5.18 s server think time, then a fast 404.", f, {
    "captureQuality": {"expectDirectionality": "bidirectional"},
    "mustReport": [
        {"ruleId": "http.server-error", "severity": "critical", "certainty": "observed",
         "evidenceFrames": [5], "detail": "HTTP 500 for GET /api/report"},
        {"ruleId": "http.slow-response", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [3, 5], "detail": "5179 ms between request and response, TCP ACK at 20 ms proves the delay is server-side"},
        {"ruleId": "http.client-error", "severity": "observation", "certainty": "observed",
         "evidenceFrames": [7], "detail": "HTTP 404 for GET /api/missing"}],
    "mustNotReport": ["tcp.retransmission", "tcp.high-rtt", "tcp.zero-window", "tcp.reset"],
    "notes": "Key discrimination: application slowness must NOT be reported as network latency, because the transport ACK returned in 20 ms.",
})

# ---------------------------------------------------------------- item 22 (pcapng, 2 interfaces)
t = BASE
fr = []
fr.append((t, tcp4(C, S, 50023, 443, 2300, 0, SYN), None, 0))
fr.append((t + 0.001, tcp4(C, S, 50023, 443, 2300, 0, SYN), None, 1))
fr.append((t + 0.021, tcp4(S, C, 443, 50023, 9300, 2301, SYN | ACK), None, 1))
fr.append((t + 0.022, tcp4(S, C, 443, 50023, 9300, 2301, SYN | ACK), None, 0))
fr.append((t + 0.0222, tcp4(C, S, 50023, 443, 2301, 9301, ACK), None, 0))
fr.append((t + 0.0223, tcp4(C, S, 50023, 443, 2301, 9301, ACK), None, 1))
emit(22, "pcapng-two-interfaces", "pcapng with two IDBs; the same session captured on both interfaces (SPAN duplication).", fr, {
    "captureQuality": {"expectDirectionality": "bidirectional", "expectInterfaceCount": 2, "expectDuplicateFrames": True},
    "mustReport": [
        {"ruleId": "capture.duplicate-frames", "severity": "observation", "certainty": "likely",
         "evidenceFrames": [0, 1, 2, 3, 4, 5], "detail": "Every frame appears once per interface within 1 ms"}],
    "mustNotReport": ["tcp.retransmission", "tcp.dup-ack", "tcp.out-of-order", "tcp.handshake-incomplete"],
    "notes": "Hard false-positive trap for the frozen flow key: 5-tuple + VLAN + INTERFACE means ifaceId 0 and 1 are distinct flows and duplicates must never surface as retransmissions.",
}, pcapng=True, ifaces=(("eth0-lan", LINKTYPE_ETHERNET), ("eth1-span", LINKTYPE_ETHERNET)))

# ---------------------------------------------------------------- item 23 (asymmetric + truncated)
f = []
t = BASE
f.append((t, tcp4(C, S, 50024, 443, 2400, 0, SYN), 1514))
f.append((t + 0.03, tcp4(C, S, 50024, 443, 2401, 9401, ACK), 1514))
for i in range(4):
    f.append((t + 0.05 + i * 0.01, tcp4(C, S, 50024, 443, 2401 + i * 1400, 9401, PSH | ACK, b"A" * 1400), 1514))
f.append((t + 0.20, tcp4(C, S, 50024, 443, 2401, 9401, PSH | ACK, b"A" * 1400), 1514))
emit(23, "asymmetric-truncated-capture", "Client-side-only capture with 96-byte snaplen: no server frames at all, payload truncated.", f, {
    "captureQuality": {"expectDirectionality": "unidirectional", "expectTruncated": True, "expectSnaplen": 96,
                       "expectCertaintyCap": "possible"},
    "mustReport": [
        {"ruleId": "capture.asymmetric", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [0, 1], "detail": "Zero frames from 203.0.113.50; only one direction present"},
        {"ruleId": "capture.truncated", "severity": "warning", "certainty": "observed",
         "evidenceFrames": [0], "detail": "capLen 96 < origLen 1514 on every frame"}],
    "mustNotReport": ["tcp.handshake-incomplete", "tcp.dup-ack", "http.server-error", "tls.fatal-alert"],
    "certaintyGovernance": {
        "rule": "Every rule that fires on this fixture must be capped at 'possible' or lower by finalise(), except capture.* rules which describe the capture itself.",
        "appliesTo": "all registered rules",
        "example": {"ruleId": "tcp.retransmission", "baseCertainty": "observed", "finalCertainty": "possible",
                    "reason": "ACK stream missing - apparent retransmit at frame 6 may be an unseen-ACK artefact"}},
    "notes": "This is THE certainty-monotonicity unit-test fixture referenced in the frozen decisions.",
}, snaplen=96)

with open(os.path.join(os.path.dirname(OUT), "MANIFEST.json"), "w") as fh:
    json.dump({"generator": "test-corpus/generate.py", "captures": CORPUS}, fh, indent=2)
    fh.write("\n")

print(json.dumps(CORPUS, indent=1))
