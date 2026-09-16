/**
 * Phase 1b robustness + model harness (Bun).
 *
 *   bun test-corpus/validate-robustness.ts
 *
 * Covers: PCAPNG multi-section/ISB metadata, corrupt-file resync, classic
 * pcap truncated tail, hostile-input hang safety, chunk-boundary equivalence
 * and proof that the columnar store allocates in pages.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PacketStore } from "../src/pcap/columnar";
import { CaptureParser, parseCapture, type ChunkSource } from "../src/pcap/reader";

const CAP = join(new URL("..", import.meta.url).pathname, "test-corpus/captures");
const src = (b: Uint8Array): ChunkSource => ({
  size: b.length,
  async slice(s, e) {
    return b.subarray(s, e);
  },
});
const load = (f: string) => new Uint8Array(readFileSync(join(CAP, f)));

let fail = 0;
const check = (name: string, ok: boolean, detail: string) => {
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
};

// 1. Multi-section + ISB drop counters + binary if_tsresol
{
  const { stats } = await parseCapture(src(load("30-pcapng-multisection-isb.pcapng")));
  check(
    "pcapng multi-section",
    stats.pcapngSectionCount === 2 && stats.pcapngInterfaceCount === 2,
    `sections=${stats.pcapngSectionCount} interfaces=${stats.pcapngInterfaceCount}`,
  );
  check(
    "pcapng ISB drop counters",
    JSON.stringify(stats.pcapngDropCounters) ===
      JSON.stringify([
        { interfaceGlobalId: 0, ifDrop: 17, filterDrop: 3 },
        { interfaceGlobalId: 1, ifDrop: 5, filterDrop: 0 },
      ]),
    JSON.stringify(stats.pcapngDropCounters),
  );
  check(
    "binary if_tsresol (2^-20 s)",
    Math.abs(stats.interfaces[1].tsResolNs - 1e9 / 2 ** 20) < 1e-6,
    `${stats.interfaces[1].tsResolNs} ns/tick`,
  );
}

// 2. Corrupt PCAPNG resynchronises and still recovers frames
{
  const t0 = performance.now();
  const { stats } = await parseCapture(src(load("31-pcapng-corrupt-resync.pcapng")));
  check(
    "corrupt pcapng resync",
    stats.malformedRecordCount > 0 && stats.resyncCount > 0 && stats.packetCount > 0,
    `malformed=${stats.malformedRecordCount} resyncs=${stats.resyncCount} frames=${stats.packetCount} in ${(performance.now() - t0).toFixed(1)}ms`,
  );
}

// 3. Classic pcap truncated tail: recorded, not thrown
{
  const { stats } = await parseCapture(src(load("32-libpcap-truncated-tail.pcap")));
  check(
    "libpcap truncated tail",
    stats.truncatedFinalRecord && stats.packetCount === 9,
    `frames=${stats.packetCount} truncatedFinalRecord=${stats.truncatedFinalRecord} note="${stats.notes[0] ?? ""}"`,
  );
}

// 4. Hostile input: random bytes behind a valid PCAPNG SHB must terminate fast
{
  const good = load("22-pcapng-two-interfaces.pcapng");
  const hostile = new Uint8Array(4 * 1024 * 1024);
  hostile.set(good.subarray(0, 52), 0);
  let x = 123456789;
  for (let i = 52; i < hostile.length; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    hostile[i] = x & 0xff;
  }
  const t0 = performance.now();
  const { stats } = await parseCapture(src(hostile));
  const ms = performance.now() - t0;
  check(
    "hostile 4MB garbage terminates",
    ms < 10_000,
    `${ms.toFixed(0)}ms, malformed=${stats.malformedRecordCount}, abandonedAt=${stats.abandonedAtOffset}`,
  );
}

// 5. Chunk-boundary equivalence: tiny chunks must give identical results
{
  const bytes = load("22-pcapng-two-interfaces.pcapng");
  const whole = await parseCapture(src(bytes), 8 * 1024 * 1024);
  const tiny = await parseCapture(src(bytes), 7);
  check(
    "carry-over across 7-byte chunks",
    JSON.stringify(whole.stats) === JSON.stringify(tiny.stats),
    `${tiny.stats.packetCount} frames identical`,
  );
}

// 6. Paged allocation is genuinely paged
{
  const store = new PacketStore();
  const pagesAt = () => Math.max(...store.allocationReport().map((r) => r.pages), 0);
  const empty = pagesAt();
  const frame = {
    srcAddr32: 1,
    dstAddr32: 2,
    tsNanoLo: 0,
    tsNanoHi: 0,
    capLen: 54,
    origLen: 54,
    fileOffset: 0,
  } as unknown as Parameters<PacketStore["push"]>[0];
  for (let i = 0; i < 65_536; i++) store.push(frame);
  const onePage = pagesAt();
  store.push(frame);
  const twoPages = pagesAt();
  check(
    "paged allocation (65,536 frames/page)",
    empty === 0 && onePage === 1 && twoPages === 2,
    `pages: empty=${empty}, 65536 frames=${onePage}, 65537 frames=${twoPages}`,
  );
}

// 7. Monotonic progress guard exists even for a same-offset parse
{
  const parser = new CaptureParser(8);
  parser.feed(new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]));
  const { stats } = parser.finish();
  check(
    "unsupported magic rejected cleanly",
    stats.abandonedAtOffset === 0 && stats.packetCount === 0,
    stats.notes[0] ?? "",
  );
}

console.log(fail === 0 ? "\nALL ROBUSTNESS CHECKS PASS" : `\n${fail} CHECK(S) FAILED`);
