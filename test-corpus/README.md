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
