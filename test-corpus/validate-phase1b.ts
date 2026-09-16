/**
 * Phase 1b validation harness (Bun).
 *
 * Parses each corpus fixture with the streaming reader and compares
 * frame count, first/last timestamp and byte totals against the
 * committed tshark reference CSVs.
 *
 *   bun test-corpus/validate-phase1b.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseCapture, type ChunkSource } from "../src/pcap/reader";

const ROOT = new URL("..", import.meta.url).pathname;
const CAPTURES = join(ROOT, "test-corpus/captures");
const REFERENCE = join(ROOT, "test-corpus/reference");

function source(path: string, bytes: Uint8Array): ChunkSource {
  return {
    size: bytes.length,
    async slice(start, end) {
      return bytes.subarray(start, end);
    },
  };
}

interface Ref {
  frames: number;
  firstEpoch: string;
  lastEpoch: string;
  capBytes: number;
  origBytes: number;
}

function readRef(csvPath: string): Ref {
  const lines = readFileSync(csvPath, "utf8").trim().split("\n");
  const header = lines[0].split(",");
  const iTime = header.indexOf("frame.time_epoch");
  const iCap = header.indexOf("frame.cap_len");
  const iLen = header.indexOf("frame.len");
  let capBytes = 0;
  let origBytes = 0;
  const rows = lines.slice(1).filter((l) => l.trim().length > 0);
  for (const row of rows) {
    const cols = row.split(",");
    capBytes += Number(cols[iCap]);
    origBytes += Number(cols[iLen]);
  }
  return {
    frames: rows.length,
    firstEpoch: rows[0].split(",")[iTime],
    lastEpoch: rows[rows.length - 1].split(",")[iTime],
    capBytes,
    origBytes,
  };
}

function epoch(ts: { sec: number; nsec: number } | null): string {
  if (!ts) return "-";
  return `${ts.sec}.${String(Math.round(ts.nsec)).padStart(9, "0")}`;
}

let failures = 0;

for (const csv of readdirSync(REFERENCE).filter((f) => f.endsWith(".tshark.csv")).sort()) {
  const base = csv.replace(".tshark.csv", "");
  const candidates = [`${base}.pcap`, `${base}.pcapng`].map((f) => join(CAPTURES, f));
  const capture = candidates.find((f) => {
    try {
      return statSync(f).isFile();
    } catch {
      return false;
    }
  });
  if (!capture) continue;

  const bytes = new Uint8Array(readFileSync(capture));
  const { stats } = await parseCapture(source(capture, bytes), 8 * 1024 * 1024);
  const ref = readRef(join(REFERENCE, csv));

  const checks: [string, unknown, unknown][] = [
    ["frames", stats.packetCount, ref.frames],
    ["first", epoch(stats.firstTimestamp), ref.firstEpoch],
    ["last", epoch(stats.lastTimestamp), ref.lastEpoch],
    ["capBytes", stats.capturedBytes, ref.capBytes],
    ["origBytes", stats.originalBytes, ref.origBytes],
  ];
  const bad = checks.filter(([, got, want]) => String(got) !== String(want));
  if (bad.length === 0) {
    console.log(
      `PASS ${base} (${stats.format}, ${stats.packetCount} frames, malformed=${stats.malformedRecordCount}, truncated=${stats.truncatedPacketCount})`,
    );
  } else {
    failures++;
    console.log(`FAIL ${base} (${stats.format})`);
    for (const [name, got, want] of bad) console.log(`   ${name}: got ${got} want ${want}`);
  }
}

console.log(failures === 0 ? "\nALL FIXTURES PASS" : `\n${failures} FIXTURE(S) FAILED`);
