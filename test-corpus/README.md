# Pulse-Speed PCAP Troubleshooter — Phase 0 synthetic corpus

Standalone test data only. Nothing here is imported by the site, no route,
navigation, dependency, or existing file was touched.

```
test-corpus/
  generate.py                  deterministic generator (stdlib only, no deps)
  MANIFEST.json                file list, frame counts, byte sizes
  captures/                    21 synthetic .pcap / .pcapng fixtures
  golden/                      one *.golden.json per capture (human-authored
                               prediction of correct engine output)
  reference/                   tshark 4.6.3 ground truth for diffing
```

## Golden JSON schema

```jsonc
{
  "corpusItem": 4,
  "file": "04-tcp-retransmission-rto.pcap",
  "description": "...",
  "frameCount": 7,
  "captureQuality": { ... expected pre-pass values ... },
  "mustReport":   [{ "ruleId", "severity", "certainty", "evidenceFrames", "detail" }],
  "mustNotReport": ["ruleId", ...],          // false-positive contract
  "certaintyGovernance": { ... },            // item 23 only
  "notes": "grading guidance / discrimination rules"
}
```

`evidenceFrames` are **0-based SoA row indices** (tshark frame numbers minus 1).

## Reference / verification

`reference/*.tshark.csv` holds per-frame ground truth
(`frame.number, frame.time_epoch, cap_len, len, interface_id, ip/ipv6 src+dst,
ports, tcp.flags, seq_raw, ack_raw, window, vlan.id`) produced by
`tshark 4.6.3`. `reference/capinfos.txt` holds frame counts and byte totals.

Regenerate / re-verify:

```bash
python3 test-corpus/generate.py
nix shell nixpkgs#wireshark-cli -c tshark -r test-corpus/captures/04-tcp-retransmission-rto.pcap
```

## Coverage

| # | File | Purpose |
|---|------|---------|
| 1 | clean-baseline-tcp-http | false-positive guard: zero findings allowed |
| 2 | syn-no-synack | SYN retransmit + incomplete handshake |
| 3 | syn-rst-refused | connection refused |
| 4 | tcp-retransmission-rto | timer-based retransmission |
| 5 | dup-acks-fast-retransmit | 3 dup-ACKs + fast retransmit |
| 6 | tcp-out-of-order | reordering vs retransmission discrimination |
| 7 | tcp-zero-window | receiver-side stall + window update |
| 8 | tcp-window-full | sender-side window exhaustion |
| 9 | tcp-midstream-reset | RST on an established flow |
| 10 | tcp-high-rtt | latency without loss |
| 11 | dns-nxdomain-and-timeout | NXDOMAIN + unanswered query + retries |
| 12 | dns-slow-response | 2.45 s resolver latency + fast control txn |
| 13 | dhcp-discover-no-offer | DISCOVER backoff, no OFFER |
| 14 | arp-conflict-and-scan | duplicate address + ARP sweep |
| 17 | icmp-unreachable-and-ttl | port unreachable, frag-needed, TTL exceeded |
| 18 | vlan-tagged-802.1q | 802.1Q VLAN 10/20, flow-key correctness |
| 19 | ipv6-tcp-tls | IPv6 interning correctness + SNI |
| 20 | tls-handshake-failure-alert | fatal alert 40 |
| 21 | http-500-and-slow-response | app slowness must not be called network latency |
| 22 | pcapng-two-interfaces | pcapng multi-IDB, SPAN duplication trap |
| 23 | asymmetric-truncated-capture | certainty-monotonicity fixture (snaplen 96) |

Items 15, 16 and 24 (real Wi-Fi monitor-mode, real mixed enterprise, real
100 MB) are intentionally absent — they must come from real captures.

## Phase 0b — real captures (items 15, 16, realism half of 24)

```
test-corpus/
  captures/real/               6 real captures (committed)
  reference/real/              tshark 4.6.3 CSV + capinfos + protocol hierarchy
  golden/15-...  15b-...  15c-...  16-...  24a-...  25-...  26-...
```

| Item | File | Committed | Covers |
|------|------|-----------|--------|
| 15 | real/wpa-Induction.pcap | yes | retry rate 3.2% (35/1093), Disassoc reason code 8, radiotap dB signal / rate / channel (no dBm, no MCS) |
| 15b | real/wpa-test-decode-mgmt.pcap | yes | PMF-protected Deauth/Disassoc — reason code must be reported unavailable, never defaulted |
| 15c | real/pmkid-not-recognized.cap | yes (1.4 MB, md5 `602dc0711a472e2144034e5c260ad8c5`) | deauth storm: 6,153 Deauth over 378.6 s, reason code 7 dominant (6,145), 29 Disassoc, retry 3.3% (663/20,056), raw 802.11 with **no radiotap** |
| 16 | real/wpa-test-decode.pcap | yes | EAPOL M1/M2 only at 0-based indices 15–16 of 4,274 frames; verified nothing after |
| 24a | nitroba.pcap | **no** (56 MB, md5 `9981827f11968773ff815e39f5458ec8`) | realism half only: 94,410 frames, 579 B avg, TCP/HTTP/TLS/DNS/SSDP/SIP/ARP/ICMP mix, aggregation + false-positive calibration |
| 25 | real/arp-storm.pcap | yes | bonus: 622 unanswered ARP requests from one MAC in 29 s |
| 26 | real/wpa-eap-tls.pcap | yes | bonus: clean 802.1X/EAP-TLS success — zero findings expected |

Notes:
- Item 15 has three halves: 15 (radiotap/signal + retry baseline), 15b (reason code
  withheld under PMF), 15c (reason-code decoding + deauth volume, no radiotap).
- `pmkid-not-recognized.cap` reads 20,056 complete frames; capinfos reports the file
  was cut short mid-record on the final packet. That is a file-integrity note, not
  per-frame snaplen truncation — `capture.truncated` must NOT fire.

- `nitroba.pcap` is deliberately not committed. Ground truth for it lives in
  `reference/real/nitroba.tshark.csv.gz` (per-frame, gzipped) and
  `reference/real/nitroba.phs.txt`. Verify the md5 before use.

## Phase 0c — item 24b, the memory-stress half

```
test-corpus/
  generate-stress.py           deterministic generator (stdlib only, ~6 s)
  reference/stress/            capinfos (+SHA-256), protocol hierarchy,
                               gzipped per-frame CSV of the first 20k frames
  golden/24b-ack-storm-memory-stress.golden.json
```

| Item | File | Committed | Covers |
|------|------|-----------|--------|
| 24b | 24-ack-storm-memory-stress.pcap | **no** (102 MB, md5 `0aaa00d5e3e662a9984e599c5d376de3`) | 1,450,000 frames / 54.5 B avg / 290 s / 200 TCP conversations — peak frames-per-megabyte, zero findings expected |

Regenerate with:

```bash
python3 test-corpus/generate-stress.py
```

Notes:
- Each conversation alternates a 1-byte server segment (55 B frame) with a
  54-byte pure client ACK whose ack number strictly advances by 1. tshark 4.6.3
  reports **0** frames matching `tcp.analysis.flags` and **0** bad IPv4/TCP
  checksums, so the golden contract is zero findings.
- A capture of pure zero-length ACKs is deliberately not used: acknowledging
  data that never appears on the wire flags every frame as "ACKed unseen
  segment", which is a genuine finding and would break the zero-findings gate.
- No SYN appears (mid-stream capture). `tcp.handshake-incomplete` must not fire.

Phase 0 is complete: 21 synthetic fixtures, 6 real captures, and the
memory-stress fixture, each with tshark 4.6.3 ground truth and a golden JSON.

