import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { traceHost } from "@/lib/nettools.functions";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

type TraceResult = Awaited<ReturnType<typeof traceHost>>;

export const Route = createFileRoute("/traceroute")({
  component: TraceroutePage,
  head: () => ({
    meta: [
      { title: "Traceroute – Path to a Public IP | Pulse Speed" },
      {
        name: "description",
        content:
          "Trace the network path to any public IP or hostname. Choose between an edge-based traceroute or a real ICMP traceroute from a private tunnel.",
      },
      { property: "og:title", content: "Traceroute – Pulse Speed" },
      { property: "og:description", content: "Trace the path to a public IP or hostname (TCP or ICMP)." },
    ],
  }),
});

function TraceroutePage() {
  const trace = useServerFn(traceHost);
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"tcp" | "icmp">("tcp");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await trace({ data: { target: target.trim(), mode } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traceroute failed");
    } finally {
      setLoading(false);
    }
  }, [trace, target, mode]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 10,
          }}
        >
          Traceroute
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          See every hop between us and a public IP. TCP mode runs from our edge.
          ICMP mode runs a real traceroute through the private tunnel.
        </p>
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["tcp", "icmp"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${mode === m ? TEAL : BORDER}`,
                background: mode === m ? "rgba(0,212,170,0.08)" : "#0f1422",
                color: mode === m ? TEAL : TEXT_SEC,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {m === "tcp" ? "TCP (edge)" : "ICMP (tunnel)"}
            </button>
          ))}
        </div>
        <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
          IP or Hostname
        </label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="8.8.8.8 or google.com"
          onKeyDown={(e) => e.key === "Enter" && run()}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            background: "#0f1422",
            color: "#fff",
            fontSize: 15,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            marginBottom: 14,
          }}
        />
        <button
          onClick={run}
          disabled={loading || !target.trim()}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading || !target.trim() ? "not-allowed" : "pointer",
            opacity: loading || !target.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Tracing…" : "Run traceroute"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,77,109,0.08)",
            border: "1px solid rgba(255,77,109,0.25)",
            borderRadius: 12,
            padding: "16px 20px",
            color: "#ff4d6d",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 12 }}>
            Trace to <span style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>{result.target}</span>
            {"provider" in result && result.provider && (
              <span style={{ marginLeft: 10, color: TEXT_MUTED }}>· {result.provider}</span>
            )}
          </div>
          {!result.ok && (
            <div style={{ color: "#ff4d6d", fontSize: 14 }}>{"error" in result ? result.error : "Failed"}</div>
          )}
          {result.ok && "output" in result && (
            <pre
              style={{
                background: "#0f1422",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: 16,
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: TEXT_SEC,
                whiteSpace: "pre-wrap",
                overflow: "auto",
                margin: 0,
              }}
            >
              {result.output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}