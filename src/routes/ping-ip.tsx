import { createFileRoute } from "@tanstack/react-router";
import ShareResult from "@/components/ShareResult";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import { pingHost } from "@/lib/nettools.functions";
import { toolHead } from "@/lib/seo";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

type PingResult = Awaited<ReturnType<typeof pingHost>>;

export const Route = createFileRoute("/ping-ip")({
  component: PingIpPage,
  head: () =>
    toolHead({
      path: "/ping-ip",
      name: "Ping IP",
      title: "Ping IP — Test Reachability & Latency of a Public IP",
      description:
        "Free online ping tool. Check if a public IPv4 or hostname is reachable from our edge and measure round-trip latency to it in milliseconds.",
      faqs: [
        {
          q: "How does the online ping work?",
          a: "Because browsers cannot send ICMP echo packets, Pulse Speed opens a TCP connection to the target from our edge and measures how long the handshake takes.",
        },
        {
          q: "Can I ping any IP or hostname?",
          a: "You can ping any public IPv4 address or hostname. Private, reserved and loopback addresses are blocked to prevent abuse.",
        },
      ],
    }),
});

function PingIpPage() {
  const ping = useServerFn(pingHost);
  const [target, setTarget] = useState("");
  const [port, setPort] = useState(443);
  const [mode, setMode] = useState<"tcp" | "icmp">("tcp");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await ping({ data: { target: target.trim(), port, mode } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ping failed");
    } finally {
      setLoading(false);
    }
  }, [ping, target, port, mode]);

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
          Ping a Public IP
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Test if a public IP or hostname is reachable from our edge network. We use TCP handshakes
          (default port 443) to measure latency since browsers cannot send ICMP echoes.
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
              {m === "tcp" ? "TCP handshake (edge)" : "ICMP (via private tunnel)"}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
              IP or Hostname
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="8.8.8.8 or google.com"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
              {mode === "icmp" ? "Port (n/a)" : "Port"}
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value, 10) || 0)}
              style={inputStyle}
              min={1}
              max={65535}
              disabled={mode === "icmp"}
            />
          </div>
        </div>
        <button onClick={run} disabled={loading || !target.trim()} style={btnStyle(loading || !target.trim())}>
          {loading ? "Pinging…" : mode === "icmp" ? "ICMP Ping" : "TCP Ping"}
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 12 }}>
            Result for <span style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>{result.target}:{result.port}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 16 }}>
            <Stat label="Sent" value={String(result.sent)} />
            <Stat label="Received" value={String(result.received)} />
            <Stat label="Loss" value={`${result.loss}%`} />
            <Stat label="Min" value={result.min != null ? `${result.min} ms` : "—"} />
            <Stat label="Avg" value={result.avg != null ? `${result.avg} ms` : "—"} />
            <Stat label="Max" value={result.max != null ? `${result.max} ms` : "—"} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {result.probes.map((p, i) => (
              <div
                key={i}
                style={{
                  background: "#0f1422",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  color: p.ok ? TEAL : "#ff4d6d",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Probe #{i + 1}</span>
                <span>{p.ok ? `${p.ms} ms` : p.error || "failed"}</span>
              </div>
            ))}
          </div>
          <ShareResult
            title="TCP Ping Test"
            subtitle={`${result.target}:${result.port}`}
            fileName={`pulse-speed-ping-${result.target}`}
            stats={[
              { label: "Sent", value: String(result.sent) },
              { label: "Received", value: String(result.received) },
              { label: "Loss", value: `${result.loss}%` },
              { label: "Min", value: result.min != null ? `${result.min} ms` : "—" },
              { label: "Avg", value: result.avg != null ? `${result.avg} ms` : "—" },
              { label: "Max", value: result.max != null ? `${result.max} ms` : "—" },
            ]}
          />
        </div>
      )}

      <Explainer
        title="How it works"
        body={
          <>
            <p style={{ marginBottom: 10 }}>
              Traditional ICMP ping is not available from web browsers or most edge runtimes. Instead, we open a
              <strong style={{ color: TEXT_SEC }}> TCP connection</strong> to the target IP on the chosen port (443 by
              default) and measure the time it takes to complete the handshake.
            </p>
            <p>
              A successful response means the host is online <em>and</em> accepting connections on that port. Use port
              80 for plain HTTP, 22 for SSH, 25 for SMTP, etc.
            </p>
          </>
        }
      />
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

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
    color: "#04150f",
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#0f1422", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#fff", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  );
}

function Explainer({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7, marginTop: 24 }}>
      <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</h2>
      {body}
    </div>
  );
}