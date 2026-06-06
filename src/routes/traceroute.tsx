import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import { traceHost } from "@/lib/nettools.functions";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_MUTED = "#6b7794";

export const Route = createFileRoute("/traceroute")({
  component: TracerouteePage,
  head: () => ({
    meta: [
      { title: "Traceroute – Trace Network Path to a Public IP | Pulse Speed" },
      {
        name: "description",
        content:
          "Free online traceroute tool. Trace the network path (hop by hop) from our edge to any public IP or hostname and inspect latency at every router along the way.",
      },
      {
        name: "keywords",
        content: "traceroute, tracert, mtr, online traceroute, network path, hop latency, routing test, network tools",
      },
      { property: "og:title", content: "Traceroute – Trace Network Path to a Public IP | Pulse Speed" },
      { property: "og:description", content: "Trace the network path to any public IP and inspect hop-by-hop latency." },
      { property: "og:url", content: "https://pulse-speed.com/traceroute" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-speed.com/traceroute" }],
  }),
});

function TracerouteePage() {
  const trace = useServerFn(traceHost);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!target.trim()) return;
    setLoading(true);
    setOutput(null);
    setError(null);
    try {
      const res = await trace({ data: { target: target.trim() } });
      if (res.ok) setOutput(res.output);
      else setError(res.error || "Traceroute failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traceroute failed");
    } finally {
      setLoading(false);
    }
  }, [trace, target]);

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
          Trace the network path from our backbone to any public IP or hostname. See every router hop and the latency
          between them — helpful for diagnosing where packet loss or slowdowns occur.
        </p>
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
          IP or Hostname
        </label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="8.8.8.8 or cloudflare.com"
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
          onKeyDown={(e) => e.key === "Enter" && run()}
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
          {loading ? "Tracing… (may take up to 30s)" : "Run Traceroute"}
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

      {output && (
        <pre
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 18,
            color: TEAL,
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            overflowX: "auto",
            whiteSpace: "pre",
            margin: 0,
          }}
        >
          {output}
        </pre>
      )}

      <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7, marginTop: 24 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>About traceroute</h2>
        <p>
          Traceroute reveals each router (hop) a packet passes through on its way to a destination, along with the
          round-trip latency at every hop. Sudden jumps in latency or timeouts (<code>* * *</code>) help pinpoint where
          network problems occur. This tool uses MyTraceroute (MTR) from a public backbone.
        </p>
      </div>
    </div>
  );
}