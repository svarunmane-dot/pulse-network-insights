import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import { portCheck } from "@/lib/nettools.functions";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_MUTED = "#6b7794";

type PortResult = Awaited<ReturnType<typeof portCheck>>;

const COMMON_PORTS = [
  { p: 21, label: "FTP" },
  { p: 22, label: "SSH" },
  { p: 25, label: "SMTP" },
  { p: 53, label: "DNS" },
  { p: 80, label: "HTTP" },
  { p: 443, label: "HTTPS" },
  { p: 3306, label: "MySQL" },
  { p: 3389, label: "RDP" },
  { p: 5432, label: "Postgres" },
  { p: 6379, label: "Redis" },
];

export const Route = createFileRoute("/portcheck")({
  component: PortCheckPage,
  head: () => ({
    meta: [
      { title: "Port Check – Test if a TCP Port is Open on a Public IP | Pulse Speed" },
      {
        name: "description",
        content:
          "Free online port checker. Test whether a TCP port (HTTP 80, HTTPS 443, SSH 22, RDP 3389, etc.) is open and listening on any public IP or hostname.",
      },
      {
        name: "keywords",
        content:
          "port check, open port checker, tcp port test, is port open, firewall test, port scanner online, network tools",
      },
      { property: "og:title", content: "Port Check – Test if a TCP Port is Open on a Public IP | Pulse Speed" },
      { property: "og:description", content: "Test if a TCP port is open and responding on any public IP or hostname." },
      { property: "og:url", content: "https://pulse-speed.com/portcheck" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-speed.com/portcheck" }],
  }),
});

function PortCheckPage() {
  const check = useServerFn(portCheck);
  const [target, setTarget] = useState("");
  const [port, setPort] = useState(443);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await check({ data: { target: target.trim(), port } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }, [check, target, port]);

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
          Port Check
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Test whether a TCP port is open and accepting connections on a public IP or hostname.
        </p>
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
              IP or Hostname
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="1.1.1.1 or example.com"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
              Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value, 10) || 0)}
              style={inputStyle}
              min={1}
              max={65535}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, marginRight: 4, alignSelf: "center" }}>Common:</span>
          {COMMON_PORTS.map((cp) => (
            <button
              key={cp.p}
              onClick={() => setPort(cp.p)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
                background: port === cp.p ? "rgba(0,212,170,0.15)" : "transparent",
                color: port === cp.p ? TEAL : "#c8d0e0",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {cp.p} {cp.label}
            </button>
          ))}
        </div>

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
          {loading ? "Checking…" : "Check Port"}
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
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", color: "#fff" }}>{result.target}:{result.port}</span>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: result.ok ? TEAL : "#ff4d6d",
              marginBottom: 8,
            }}
          >
            {result.ok ? "OPEN" : "CLOSED / FILTERED"}
          </div>
          {result.ok && result.ms != null && (
            <div style={{ color: TEXT_MUTED, fontSize: 13 }}>
              Connected in <strong style={{ color: "#fff" }}>{result.ms} ms</strong>
            </div>
          )}
          {!result.ok && result.error && (
            <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{result.error}</div>
          )}
        </div>
      )}

      <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7, marginTop: 24 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>About port checking</h2>
        <p>
          A port is "open" when a service on the target host accepts TCP connections on it. A "closed/filtered" result
          means either nothing is listening on that port or a firewall is dropping the connection. This is a common
          first step when troubleshooting why a website, game server or database is unreachable.
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: "#0f1422",
  color: "#fff",
  fontSize: 15,
  fontFamily: "'DM Mono', monospace",
  outline: "none",
};