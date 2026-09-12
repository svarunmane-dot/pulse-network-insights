import { useEffect, useRef, useState } from "react";

import { DETECTION_MIN_BYTES } from "@/pcap/format-detect";
import type { CaptureFormat } from "@/pcap/format-detect";
import type { WorkerResponse } from "@/pcap/pcap.worker";

type IsolationRow = { name: string; value: string; redefinable: boolean };

const card: React.CSSProperties = {
  border: "1px solid #1f2740",
  background: "#0f1422",
  borderRadius: 14,
  padding: 18,
};

export default function PcapAnalyzerPanel() {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(1);
  const [isolation, setIsolation] = useState<IsolationRow[] | null>(null);
  const [format, setFormat] = useState<CaptureFormat | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../pcap/pcap.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "isolation-report") setIsolation(msg.sealed);
      if (msg.type === "format") setFormat(msg.result as CaptureFormat);
      if (msg.type === "error") setError(msg.message);
    };
    worker.postMessage({ type: "verify-isolation", id: idRef.current++ });
    return () => worker.terminate();
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setFormat(null);
    setFileName(file.name);
    const head = await file.slice(0, Math.max(DETECTION_MIN_BYTES, 64)).arrayBuffer();
    workerRef.current?.postMessage({ type: "detect-format", id: idRef.current++, head }, [head]);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px", color: "#c8d0e0" }}>
      <h1 style={{ color: "#fff", fontSize: 28, margin: 0 }}>PCAP Troubleshooter</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        Captures are read entirely inside your browser, in an isolated worker with all network
        APIs removed. Nothing is uploaded. Phase 1a: format detection only.
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
        {format && (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: "#0a0e1a",
              border: "1px solid #1f2740",
              fontSize: 12,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(format, null, 2)}
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
