import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { probeTcp } from "@/lib/monitor-public.functions";
import { toolHead } from "@/lib/seo";

export const Route = createFileRoute("/monitoring")({
  ssr: false,
  head: () =>
    toolHead({
      path: "/monitoring",
      name: "Application Monitoring",
      title: "App Monitoring — Free TCP Port Uptime Checker Online",
      description:
        "Free, no-signup TCP port monitor. Check that any public host and port stays online with live latency tracking and incident history in your browser.",
      faqs: [
        {
          q: "Is application monitoring really free?",
          a: "Yes. Monitors run entirely from your browser session, require no account and store history locally so there is no cost or sign-up.",
        },
        {
          q: "What can I monitor?",
          a: "Any public host and TCP port — for example a website on port 443, an SSH server on 22 or a game server on a custom port.",
        },
      ],
    }),
  component: MonitoringPage,
});

type LocalMonitor = {
  id: string;
  label: string;
  host: string;
  port: number;
  createdAt: string;
  lastStatus: "up" | "down" | null;
  lastLatency: number | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  events: { at: string; from: "up" | "down" | null; to: "up" | "down"; error: string | null }[];
};

const STORAGE_KEY = "pulse-speed:monitors:v1";
const POLL_MS = 60_000;

function loadMonitors(): LocalMonitor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveMonitors(list: LocalMonitor[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded — ignore */
  }
}

function MonitoringPage() {
  const [monitors, setMonitors] = useState<LocalMonitor[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<LocalMonitor[]>([]);

  useEffect(() => {
    const list = loadMonitors();
    setMonitors(list);
    stateRef.current = list;
  }, []);

  const persist = useCallback((next: LocalMonitor[]) => {
    stateRef.current = next;
    setMonitors(next);
    saveMonitors(next);
  }, []);

  const probe = useCallback(
    async (id: string) => {
      const current = stateRef.current.find((m) => m.id === id);
      if (!current) return;
      try {
        const r = await probeTcp({ data: { host: current.host, port: current.port } });
        const next = stateRef.current.map((m) => {
          if (m.id !== id) return m;
          const changed = m.lastStatus !== r.status;
          const events =
            changed && m.lastStatus !== null
              ? [{ at: r.checked_at, from: m.lastStatus, to: r.status, error: r.error }, ...m.events].slice(0, 50)
              : m.lastStatus === null
                ? [{ at: r.checked_at, from: null, to: r.status, error: r.error }, ...m.events].slice(0, 50)
                : m.events;
          return {
            ...m,
            lastStatus: r.status,
            lastLatency: r.latency_ms,
            lastCheckedAt: r.checked_at,
            lastError: r.error,
            events,
          };
        });
        persist(next);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "probe failed";
        const next = stateRef.current.map((m) =>
          m.id === id
            ? {
                ...m,
                lastStatus: "down" as const,
                lastLatency: null,
                lastCheckedAt: new Date().toISOString(),
                lastError: msg,
              }
            : m,
        );
        persist(next);
      }
    },
    [persist],
  );

  // Poll every minute for every monitor while the tab is open.
  useEffect(() => {
    if (!monitors.length) return;
    const timer = window.setInterval(() => {
      stateRef.current.forEach((m) => probe(m.id));
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [monitors.length, probe]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = parseInt(port, 10);
    if (!label.trim()) return setError("Label is required");
    if (!host.trim()) return setError("Host is required");
    if (!Number.isInteger(p) || p < 1 || p > 65535) return setError("Port must be 1–65535");
    const m: LocalMonitor = {
      id: crypto.randomUUID(),
      label: label.trim().slice(0, 80),
      host: host.trim(),
      port: p,
      createdAt: new Date().toISOString(),
      lastStatus: null,
      lastLatency: null,
      lastCheckedAt: null,
      lastError: null,
      events: [],
    };
    const next = [m, ...stateRef.current];
    persist(next);
    setLabel("");
    setHost("");
    setPort("443");
    setAdding(true);
    await probe(m.id);
    setAdding(false);
  }

  function remove(id: string) {
    const next = stateRef.current.filter((m) => m.id !== id);
    persist(next);
    if (expanded === id) setExpanded(null);
  }

  function clearAll() {
    if (!confirm("Clear all monitors from this browser?")) return;
    persist([]);
  }

  return (
    <Shell>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, margin: 0, color: "#fff", letterSpacing: "-0.4px" }}>
          Application <span style={{ color: "#00D4AA" }}>Monitoring</span>
        </h1>
        <p style={{ color: "#8b94b0", maxWidth: 720, marginTop: 10, lineHeight: 1.6 }}>
          Free TCP port uptime checker — no account needed. Add any public host and
          port, and Pulse Speed will probe it once a minute while this tab is open,
          tracking status, latency, and state changes. Monitors live in your browser only.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        style={{
          ...panel,
          display: "grid",
          gridTemplateColumns: "minmax(180px, 1.1fr) minmax(220px, 1.5fr) 110px 150px",
          gap: 14,
          alignItems: "end",
        }}
      >
        <Field label="Label">
          <input value={label} required maxLength={80} onChange={(e) => setLabel(e.target.value)} style={input} placeholder="Production API" />
        </Field>
        <Field label="Public IP / host">
          <input value={host} required onChange={(e) => setHost(e.target.value)} style={input} placeholder="api.example.com" />
        </Field>
        <Field label="Port">
          <input value={port} required onChange={(e) => setPort(e.target.value)} style={input} inputMode="numeric" placeholder="443" />
        </Field>
        <button type="submit" disabled={adding} style={primaryBtn}>
          {adding ? "Adding…" : "Add monitor"}
        </button>
        {error && (
          <div style={{ gridColumn: "1 / -1", color: "#ffb4b4", fontSize: 13 }}>{error}</div>
        )}
      </form>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ color: "#6b7794", fontSize: 12, margin: 0 }}>
          {monitors.length} monitor{monitors.length === 1 ? "" : "s"} · stored locally in this browser
        </p>
        {monitors.length > 0 && (
          <button onClick={clearAll} style={{ ...ghostBtn, color: "#ffb4b4", borderColor: "rgba(255,80,80,0.35)" }}>
            Clear all
          </button>
        )}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {monitors.length === 0 && (
          <div style={{ ...panel, textAlign: "center", color: "#8b94b0" }}>
            No monitors yet. Add a host and port above to start checking it every minute.
          </div>
        )}
        {monitors.map((m) => (
          <MonitorRow
            key={m.id}
            m={m}
            onDelete={() => remove(m.id)}
            onRecheck={() => probe(m.id)}
            expanded={expanded === m.id}
            onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
          />
        ))}
      </div>

      <p style={{ marginTop: 28, color: "#6b7794", fontSize: 12 }}>
        Probes run from Pulse Speed's edge as a TCP handshake to the configured port,
        triggered while this tab is open. Data never leaves your browser.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", color: "#e8ecf5" }}>
      {children}
    </div>
  );
}

function MonitorRow({
  m,
  onDelete,
  onRecheck,
  expanded,
  onToggle,
}: {
  m: LocalMonitor;
  onDelete: () => void;
  onRecheck: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = m.lastStatus;
  const dot = status === "up" ? "#00D4AA" : status === "down" ? "#ff5470" : "#6b7794";
  const statusLabel = status ? status.toUpperCase() : "PENDING";
  const latencyLabel = latencyQuality(m.lastLatency);
  return (
    <div style={panel}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: dot, boxShadow: status === "up" ? "0 0 10px rgba(0,212,170,0.6)" : undefined }} />
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ color: "#fff", fontWeight: 600 }}>
            {m.label}
          </div>
          <div style={{ color: "#8b94b0", fontSize: 12, fontFamily: "DM Mono, monospace" }}>
            {m.host}:{m.port}
          </div>
          {m.lastError && m.lastStatus === "down" && (
            <div style={{ color: "#ffb4b4", fontSize: 11, marginTop: 2 }}>
              TCP: {m.lastError}
            </div>
          )}
        </div>
        <Stat label="Status" value={statusLabel} color={dot} />
        <Stat
          label="Latency"
          value={m.lastLatency != null ? `${m.lastLatency} ms · ${latencyLabel.label}` : "—"}
          color={latencyLabel.color}
        />
        <Stat label="Last check" value={fmtRel(m.lastCheckedAt)} />
        <button onClick={onRecheck} style={ghostBtn}>Recheck</button>
        <button onClick={onToggle} style={ghostBtn}>{expanded ? "Hide" : "Events"}</button>
        <button onClick={onDelete} style={{ ...ghostBtn, color: "#ffb4b4", borderColor: "rgba(255,80,80,0.35)" }}>Delete</button>
      </div>
      {expanded && <Events events={m.events} />}
    </div>
  );
}

function latencyQuality(ms: number | null): { label: string; color: string } {
  if (ms == null) return { label: "—", color: "#8b94b0" };
  if (ms <= 50) return { label: "Excellent", color: "#00D4AA" };
  if (ms <= 100) return { label: "Good", color: "#7be0a4" };
  if (ms <= 300) return { label: "Fair", color: "#facc15" };
  if (ms <= 1000) return { label: "Poor", color: "#fb923c" };
  return { label: "Critical", color: "#ef4444" };
}

function Events({ events }: { events: LocalMonitor["events"] }) {
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid #1f2740", paddingTop: 12 }}>
      <div style={{ color: "#8b94b0", fontSize: 12, marginBottom: 8 }}>Recent state changes</div>
      {events.length === 0 && (
        <div style={{ color: "#6b7794", fontSize: 13 }}>No state changes recorded yet.</div>
      )}
      <div style={{ display: "grid", gap: 6 }}>
        {events.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, fontSize: 13, color: "#c8d0e0" }}>
            <span style={{ fontFamily: "DM Mono, monospace", color: "#8b94b0" }}>{fmtAbs(e.at)}</span>
            <span>
              {(e.from ?? "—").toString().toUpperCase()} → <strong style={{ color: e.to === "up" ? "#00D4AA" : "#ff5470" }}>{e.to.toUpperCase()}</strong>
            </span>
            {e.error && <span style={{ color: "#ffb4b4" }}>{e.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, color: "#c8d0e0", fontSize: 12 }}>
      {label}
      {children}
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", color: "#6b7794", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: "DM Mono, monospace", color: color ?? "#e8ecf5", fontSize: 13 }}>{value}</div>
    </div>
  );
}

function fmtRel(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}
function fmtAbs(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const panel: React.CSSProperties = {
  background: "#0f1426",
  border: "1px solid #1f2740",
  borderRadius: 14,
  padding: 18,
};
const input: React.CSSProperties = {
  background: "#0a0e1a",
  border: "1px solid #283054",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  width: "100%",
};
const primaryBtn: React.CSSProperties = {
  background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
  color: "#04150f",
  border: 0,
  padding: "10px 18px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
  height: 40,
};
const ghostBtn: React.CSSProperties = {
  background: "transparent",
  color: "#c8d0e0",
  border: "1px solid #283054",
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
};

