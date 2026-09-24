// ---------------------------------------------------------------------------
// NETWORK NEUTERING — MUST REMAIN THE FIRST EXECUTABLE LINES IN THIS FILE.
// Nothing above this block. No static imports above it: every dependency is
// loaded through dynamic import() after the boundary is sealed, so no imported
// module can ever observe a live network primitive.
// Each property is redefined as non-configurable/non-writable undefined, so any
// later attempt to restore it throws a TypeError.
// ---------------------------------------------------------------------------
{
  const scope = self as unknown as Record<string, unknown>;
  for (const name of [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "importScripts",
    "sendBeacon",
  ]) {
    try {
      Object.defineProperty(scope, name, {
        value: undefined,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    } catch {
      /* already non-configurable: nothing to do */
    }
  }
  const nav = (self as unknown as { navigator?: Record<string, unknown> }).navigator;
  if (nav) {
    try {
      Object.defineProperty(nav, "sendBeacon", {
        value: undefined,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    } catch {
      /* sealed already */
    }
  }
}

export type WorkerRequest =
  | { type: "ping"; id: number }
  | { type: "verify-isolation"; id: number }
  | { type: "detect-format"; id: number; head: ArrayBuffer }
  | { type: "parse-file"; id: number; file: Blob }
  | { type: "cancel"; id: number };

export type ParseSummary = {
  stats: unknown;
  packetCount: number;
  bytesPerFrame: number;
  ipv6AddressCount: number;
  allocation: { column: string; pages: number; bytesPerElement: number }[];
  elapsedMs: number;
  /** packetCount / (elapsedMs / 1000). */
  packetsPerSecond: number;
  /** packetCount x 52 B — logical column bytes, computed without any memory API. */
  typedArrayBytesComputed: number;
  /** Actual page bytes allocated (pages x 65,536 x element size). */
  typedArrayBytesAllocated: number;
  chunkAllocations: number;
  progressEvents: number;
  maxProgressGapMs: number;
};

export type ProgressMessage = {
  type: "progress";
  id: number;
  phase: "reading" | "finalising";
  bytesRead: number;
  totalBytes: number;
  packetCount: number;
  elapsedMs: number;
};

export type WorkerResponse =
  | { type: "pong"; id: number }
  | {
      type: "isolation-report";
      id: number;
      sealed: { name: string; value: "undefined" | "present"; redefinable: boolean }[];
    }
  | { type: "format"; id: number; result: unknown }
  | { type: "parse-result"; id: number; summary: ParseSummary }
  | ProgressMessage
  | { type: "cancelled"; id: number; latencyMs: number; bytesRead: number }
  | { type: "error"; id: number; message: string };

/** Set by a "cancel" message; checked by the reader between chunks. */
let cancelRequestedAt: number | null = null;
let lastBytesRead = 0;

const SEALED = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "importScripts",
  "sendBeacon",
];

function isolationReport() {
  const scope = self as unknown as Record<string, unknown>;
  return SEALED.map((name) => {
    let redefinable = false;
    try {
      Object.defineProperty(scope, name, { value: () => undefined, configurable: true });
      redefinable = true;
    } catch {
      redefinable = false;
    }
    return {
      name,
      value: (scope[name] === undefined ? "undefined" : "present") as "undefined" | "present",
      redefinable,
    };
  });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === "ping") {
      post({ type: "pong", id: msg.id });
      return;
    }
    if (msg.type === "verify-isolation") {
      post({ type: "isolation-report", id: msg.id, sealed: isolationReport() });
      return;
    }
    if (msg.type === "detect-format") {
      const { detectCaptureFormat } = await import("./format-detect");
      post({
        type: "format",
        id: msg.id,
        result: detectCaptureFormat(new Uint8Array(msg.head)),
      });
      return;
    }
    if (msg.type === "cancel") {
      cancelRequestedAt = performance.now();
      return;
    }
    if (msg.type === "parse-file") {
      const [{ parseCapture, fileChunkSource, ParseCancelled }, { BYTES_PER_FRAME }] =
        await Promise.all([import("./reader"), import("./columnar")]);
      cancelRequestedAt = null;
      lastBytesRead = 0;
      const started = performance.now();
      let progressEvents = 0;
      let lastProgressAt = started;
      let maxProgressGapMs = 0;
      try {
        const { stats, store, ipv6Table, metrics } = await parseCapture(fileChunkSource(msg.file), {
          progressIntervalMs: 400,
          shouldCancel: () => cancelRequestedAt !== null,
          onProgress: (p) => {
            const now = performance.now();
            maxProgressGapMs = Math.max(maxProgressGapMs, now - lastProgressAt);
            lastProgressAt = now;
            progressEvents++;
            lastBytesRead = p.bytesRead;
            post({ type: "progress", id: msg.id, ...p });
          },
        });
        const elapsedMs = performance.now() - started;
        post({
          type: "parse-result",
          id: msg.id,
          summary: {
            stats,
            packetCount: store.count,
            bytesPerFrame: BYTES_PER_FRAME,
            ipv6AddressCount: ipv6Table.size,
            allocation: store.allocationReport(),
            elapsedMs: Math.round(elapsedMs),
            packetsPerSecond: Math.round(store.count / Math.max(elapsedMs / 1000, 1e-6)),
            typedArrayBytesComputed: store.count * BYTES_PER_FRAME,
            typedArrayBytesAllocated: store.allocatedBytes(),
            chunkAllocations: metrics.chunkAllocations,
            progressEvents,
            maxProgressGapMs: Math.round(maxProgressGapMs),
          },
        });
      } catch (error) {
        if (error instanceof ParseCancelled) {
          const latencyMs = performance.now() - (cancelRequestedAt ?? performance.now());
          cancelRequestedAt = null;
          post({
            type: "cancelled",
            id: msg.id,
            latencyMs: Math.round(latencyMs),
            bytesRead: lastBytesRead,
          });
          return;
        }
        throw error;
      }
      return;
    }
  } catch (error) {
    post({
      type: "error",
      id: (msg as { id: number }).id,
      message: error instanceof Error ? error.message : "Unknown worker error",
    });
  }
};

function post(message: WorkerResponse) {
  (self as unknown as { postMessage: (m: WorkerResponse) => void }).postMessage(message);
}
