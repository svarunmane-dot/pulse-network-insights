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
  | { type: "detect-format"; id: number; head: ArrayBuffer };

export type WorkerResponse =
  | { type: "pong"; id: number }
  | {
      type: "isolation-report";
      id: number;
      sealed: { name: string; value: "undefined" | "present"; redefinable: boolean }[];
    }
  | { type: "format"; id: number; result: unknown }
  | { type: "error"; id: number; message: string };

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
