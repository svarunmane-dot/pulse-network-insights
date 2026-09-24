import { useEffect, useRef, useState } from "react";

import { DETECTION_MIN_BYTES } from "@/pcap/format-detect";
import type { CaptureFormat } from "@/pcap/format-detect";
import type { ParseSummary, ProgressMessage, WorkerResponse } from "@/pcap/pcap.worker";

type IsolationRow = { name: string; value: string; redefinable: boolean };
type LongTaskReport = { count: number; maxMs: number; over50: number };

const card: React.CSSProperties = {
  border: "1px solid #1f2740",
  background: "#0f1422",
  borderRadius: 14,
  padding: 18,
};

const pre: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  background: "#0a0e1a",
  border: "1px solid #1f2740",
  fontSize: 12,
  overflowX: "auto",
};

export default function PcapAnalyzerPanel() {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(1);
  const longTasksRef = useRef<LongTaskReport>({ count: 0, maxMs: 0, over50: 0 });
  const [isolation, setIsolation] = useState<IsolationRow[] | null>(null);
  const [format, setFormat] = useState<CaptureFormat | null>(null);
  const [summary, setSummary] = useState<ParseSummary | null>(null);
  const [progress, setProgress] = useState<ProgressMessage | null>(null);
  const [cancelled, setCancelled] = useState<{ latencyMs: number; bytesRead: number } | null>(
    null,
  );
  const [longTasks, setLongTasks] = useState<LongTaskReport | null>(null);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Long-task detection: works without cross-origin isolation.
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const r = longTasksRef.current;
          r.count++;
          r.maxMs = Math.max(r.maxMs, Math.round(entry.duration));
          if (entry.duration > 50) r.over50++;
        }
      });
      observer.observe({ type: "longtask", buffered: false });
    } catch {
      observer = null;
    }

    const worker = new Worker(new URL("../pcap/pcap.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "isolation-report") setIsolation(msg.sealed);
      if (msg.type === "format") setFormat(msg.result as CaptureFormat);
      if (msg.type === "progress") setProgress(msg);
      if (msg.type === "parse-result") {
        setSummary(msg.summary);
        setLongTasks({ ...longTasksRef.current });
        setParsing(false);
      }
      if (msg.type === "cancelled") {
        setCancelled({ latencyMs: msg.latencyMs, bytesRead: msg.bytesRead });
        setLongTasks({ ...longTasksRef.current });
        setParsing(false);
      }
      if (msg.type === "error") {
        setError(msg.message);
        setParsing(false);
      }
    };
    worker.postMessage({ type: "verify-isolation", id: idRef.current++ });
    return () => {
      observer?.disconnect();
      worker.terminate();
    };
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setFormat(null);
    setSummary(null);
    setProgress(null);
    setCancelled(null);
    setLongTasks(null);
    longTasksRef.current = { count: 0, maxMs: 0, over50: 0 };
    setFileName(file.name);
    const head = await file.slice(0, Math.max(DETECTION_MIN_BYTES, 64)).arrayBuffer();
    workerRef.current?.postMessage({ type: "detect-format", id: idRef.current++, head }, [head]);
    setParsing(true);
    workerRef.current?.postMessage({ type: "parse-file", id: idRef.current++, file });
  };

  const onCancel = () => {
    workerRef.current?.postMessage({ type: "cancel", id: idRef.current++ });
  };

  const pct =
    progress && progress.totalBytes > 0
      ? Math.round((progress.bytesRead / progress.totalBytes) * 100)
      : 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px", color: "#c8d0e0" }}>
      <h1 style={{ color: "#fff", fontSize: 28, margin: 0 }}>PCAP Troubleshooter</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        Captures are read entirely inside your browser, in an isolated worker with all network APIs
        removed. Nothing is uploaded. Phase 1c: streaming parse with progress, cancellation and
        performance instrumentation.
      </p>

      <div style={{ ...card, marginTop: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
          Choose a capture file
          <input
            type="file"
            accept=".pcap,.pcapng,.cap"
            onChange={(e) => void onFile(e.target.files?.[0])}
            style={{ display: "block", marginTop: 10, fontSize: 13, maxWidth: "100%" }}
          />
        </label>
        {fileName && (
          <p style={{ fontSize: 12, marginTop: 10 }}>
            Selected: <strong style={{ color: "#00D4AA" }}>{fileName}</strong>
          </p>
        )}
        {error && <p style={{ fontSize: 12, color: "#ff8080" }}>{error}</p>}
        {format && <pre style={pre}>{JSON.stringify(format, null, 2)}</pre>}

        {parsing && (
          <div style={{ marginTop: 12 }} data-testid="pcap-progress">
            <div
              style={{ height: 8, borderRadius: 4, background: "#1f2740", overflow: "hidden" }}
            >
              <div style={{ width: `${pct}%`, height: "100%", background: "#00D4AA" }} />
            </div>
            <p style={{ fontSize: 12, marginTop: 6 }}>
              {progress
                ? `${progress.phase} — ${pct}% · ${progress.packetCount.toLocaleString()} packets · ${(progress.elapsedMs / 1000).toFixed(1)} s`
                : "Starting…"}
            </p>
            <button
              type="button"
              onClick={onCancel}
              style={{
                marginTop: 4,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #ff8080",
                background: "transparent",
                color: "#ff8080",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {cancelled && (
          <p style={{ fontSize: 12, marginTop: 10 }} data-testid="pcap-cancelled">
            Cancelled after {cancelled.bytesRead.toLocaleString()} bytes — took effect in{" "}
            {cancelled.latencyMs} ms. All parser memory released.
          </p>
        )}

        {summary && (
          <pre style={pre} data-testid="pcap-summary">
            {JSON.stringify(
              {
                packetCount: summary.packetCount,
                elapsedMs: summary.elapsedMs,
                packetsPerSecond: summary.packetsPerSecond,
                bytesPerFrame: summary.bytesPerFrame,
                typedArrayBytesComputed: summary.typedArrayBytesComputed,
                typedArrayBytesAllocated: summary.typedArrayBytesAllocated,
                chunkAllocations: summary.chunkAllocations,
                progressEvents: summary.progressEvents,
                maxProgressGapMs: summary.maxProgressGapMs,
                longTasks,
                ipv6AddressCount: summary.ipv6AddressCount,
                stats: summary.stats,
              },
              null,
              2,
            )}
          </pre>
        )}
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
          Worker isolation check
        </div>
        {!isolation && <p style={{ fontSize: 12 }}>Checking…</p>}
        {isolation && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, display: "grid", gap: 4 }}>
            {isolation.map((row) => (
              <li key={row.name}>
                <code>{row.name}</code>: {row.value},{" "}
                {row.redefinable ? (
                  <span style={{ color: "#ff8080" }}>restorable — FAIL</span>
                ) : (
                  <span style={{ color: "#00D4AA" }}>sealed (redefinition throws)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
