import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createMonitor,
  deleteMonitor,
  listEvents,
  listMonitors,
} from "@/lib/monitor.functions";

export const Route = createFileRoute("/monitoring")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Application Monitoring – TCP Port Uptime Monitor | Pulse Speed" },
      {
        name: "description",
        content:
          "Monitor application availability via TCP port checks every minute. Track uptime, latency and incident history for any public host or port.",
      },
      { property: "og:title", content: "Application Monitoring – Pulse Speed" },
      {
        property: "og:description",
        content:
          "Application availability monitoring with 1-minute TCP probes, latency tracking, and incident history.",
      },
    ],
  }),
  component: MonitoringPage,
});

type Monitor = {
  id: string;
  user_id: string;
  label: string;
  host: string;
  port: number;
  enabled: boolean;
  last_status: string | null;
  last_latency_ms: number | null;
  last_checked_at: string | null;
  last_status_change_at: string | null;
  last_error?: string | null;
  created_at: string;
  expires_at: string | null;
};

function MonitoringPage() {
  const [session, setSession] = useState<null | { userId: string; email?: string }>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setSession(data.user ? { userId: data.user.id, email: data.user.email ?? undefined } : null);
      setLoadingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
        setSession(s?.user ? { userId: s.user.id, email: s.user.email ?? undefined } : null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loadingSession) {
    return <Shell><p style={{ color: "#8b94b0" }}>Loading…</p></Shell>;
  }

  if (!session) return <Landing />;
  return <Dashboard email={session.email} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", color: "#e8ecf5" }}>
      {children}
    </div>
  );
}

function Landing() {
  return (
    <Shell>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 40, margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>
          Application <span style={{ color: "#00D4AA" }}>Monitoring</span>
        </h1>
        <p style={{ color: "#8b94b0", maxWidth: 680, marginTop: 12, lineHeight: 1.6 }}>
          Add a public host and port and Pulse Speed will TCP-probe it every minute,
          tracking uptime, latency and state changes. Perfect for keeping an eye on
          web apps, APIs, VPN endpoints, mail servers and self-hosted services.
        </p>
      </header>

      <div style={panel}>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 20 }}>Registered users only</h2>
        <p style={{ color: "#c8d0e0", marginTop: 10, lineHeight: 1.6 }}>
          Monitoring is tied to your account so your hosts and incident history stay private.
          Accounts are protected with email + password and a one-time-password (TOTP)
          authenticator app — required on every sign-in.
        </p>
        <ul style={{ color: "#c8d0e0", lineHeight: 1.8, paddingLeft: 18, margin: "12px 0" }}>
          <li>TCP probe every 1 minute (port 443, 80 or any custom port)</li>
          <li>Up / down status, latency and last-checked timestamp</li>
          <li>24-hour incident timeline showing every state change</li>
          <li>Free, no credit card</li>
        </ul>
        <Link
          to="/auth"
          style={{
            display: "inline-block",
            marginTop: 8,
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            padding: "12px 22px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Create your free account →
        </Link>
      </div>
    </Shell>
  );
}

function Dashboard({ email }: { email?: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const monitorsQ = useQuery({
    queryKey: ["monitors"],
    queryFn: () => listMonitors(),
    refetchInterval: 30_000,
  });

  const create = useMutation({
    mutationFn: (input: { label: string; host: string; port: number }) =>
      createMonitor({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteMonitor({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  });

  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(port, 10);
    if (!Number.isInteger(p) || p < 1 || p > 65535) return;
    create.mutate(
      { label, host, port: p },
      {
        onSuccess: () => {
          setLabel("");
          setHost("");
          setPort("443");
        },
      },
    );
  }

  const monitors = (monitorsQ.data?.monitors ?? []) as Monitor[];

  return (
    <Shell>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 30, margin: 0, color: "#fff", letterSpacing: "-0.4px" }}>
            Application Monitoring
          </h1>
          <p style={{ color: "#8b94b0", margin: "6px 0 0" }}>{email}</p>
        </div>
        <button onClick={signOut} style={ghostBtn}>Sign out</button>
      </header>

      <form
        onSubmit={submit}
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
        <button type="submit" disabled={create.isPending} style={primaryBtn}>
          {create.isPending ? "Adding…" : "Add monitor"}
        </button>
        {create.error instanceof Error && (
          <div style={{ gridColumn: "1 / -1", color: "#ffb4b4", fontSize: 13 }}>{create.error.message}</div>
        )}
      </form>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        {monitorsQ.isLoading && <p style={{ color: "#8b94b0" }}>Loading monitors…</p>}
        {monitorsQ.data && monitors.length === 0 && (
          <div style={{ ...panel, textAlign: "center", color: "#8b94b0" }}>
            No monitors yet. Add a host and port above to start checking it every minute.
          </div>
        )}
        {monitors.map((m) => (
          <MonitorRow
            key={m.id}
            m={m}
            onDelete={() => del.mutate(m.id)}
            deleting={del.isPending && del.variables === m.id}
            expanded={expanded === m.id}
            onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
          />
        ))}
      </div>

      <p style={{ marginTop: 28, color: "#6b7794", fontSize: 12 }}>
        Checks run server-side every minute via a TCP handshake to the configured port.
      </p>
    </Shell>
  );
}

function MonitorRow({
  m,
  onDelete,
  deleting,
  expanded,
  onToggle,
}: {
  m: Monitor;
  onDelete: () => void;
  deleting: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = m.last_status;
  const dot = status === "up" ? "#00D4AA" : status === "down" ? "#ff5470" : "#6b7794";
  const statusLabel = status ? status.toUpperCase() : "PENDING";
  const latencyLabel = latencyQuality(m.last_latency_ms);
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
          {m.last_error && m.last_status === "down" && (
            <div style={{ color: "#ffb4b4", fontSize: 11, marginTop: 2 }}>
              TCP: {m.last_error}
            </div>
          )}
        </div>
        <Stat label="Status" value={statusLabel} color={dot} />
        <Stat
          label="Latency"
          value={m.last_latency_ms != null ? `${m.last_latency_ms} ms · ${latencyLabel.label}` : "—"}
          color={latencyLabel.color}
        />
        <Stat label="Last check" value={fmtRel(m.last_checked_at)} />
        <button onClick={onToggle} style={ghostBtn}>{expanded ? "Hide" : "Events"}</button>
        <button onClick={onDelete} disabled={deleting} style={{ ...ghostBtn, color: "#ffb4b4", borderColor: "rgba(255,80,80,0.35)" }}>
          {deleting ? "…" : "Delete"}
        </button>
      </div>
      {expanded && <Events monitorId={m.id} />}
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

function Events({ monitorId }: { monitorId: string }) {
  const q = useQuery({
    queryKey: ["events", monitorId],
    queryFn: () => listEvents({ data: { monitorId, limit: 25 } }),
  });
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid #1f2740", paddingTop: 12 }}>
      <div style={{ color: "#8b94b0", fontSize: 12, marginBottom: 8 }}>Recent state changes</div>
      {q.isLoading && <div style={{ color: "#8b94b0", fontSize: 13 }}>Loading…</div>}
      {q.data && q.data.length === 0 && (
        <div style={{ color: "#6b7794", fontSize: 13 }}>No state changes recorded yet.</div>
      )}
      <div style={{ display: "grid", gap: 6 }}>
        {(q.data ?? []).map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 12, fontSize: 13, color: "#c8d0e0" }}>
            <span style={{ fontFamily: "DM Mono, monospace", color: "#8b94b0" }}>{fmtAbs(e.created_at)}</span>
            <span>
              {(e.from_status ?? "—").toUpperCase()} → <strong style={{ color: e.to_status === "up" ? "#00D4AA" : "#ff5470" }}>{e.to_status.toUpperCase()}</strong>
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

