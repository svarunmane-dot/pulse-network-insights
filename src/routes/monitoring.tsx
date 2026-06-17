import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createMonitor,
  deleteMonitor,
  listEvents,
  listMonitors,
  adminListUsers,
  adminSetUserLimit,
  getMyLimits,
} from "@/lib/monitor.functions";

export const Route = createFileRoute("/monitoring")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "WAN Monitoring – Continuous Public IP Uptime Monitor | Pulse Speed" },
      {
        name: "description",
        content:
          "Register a free Pulse Speed account to monitor WAN / public IPs every minute. TCP probe uptime checks, latency, status history and incident timeline.",
      },
      { property: "og:title", content: "WAN Monitoring – Pulse Speed" },
      {
        property: "og:description",
        content:
          "Continuous WAN IP monitoring with 1-minute TCP probes, latency tracking, and incident history. Free for registered users.",
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
  probe_type: "tcp" | "icmp" | string;
  enabled: boolean;
  last_status: string | null;
  last_latency_ms: number | null;
  last_checked_at: string | null;
  last_status_change_at: string | null;
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
          WAN <span style={{ color: "#00D4AA" }}>Monitoring</span>
        </h1>
        <p style={{ color: "#8b94b0", maxWidth: 680, marginTop: 12, lineHeight: 1.6 }}>
          Add your WAN / public IPs and Pulse Speed will TCP-probe them every minute,
          tracking uptime, latency and state changes. Perfect for keeping an eye on
          firewalls, routers, VPN endpoints, branch circuits and self-hosted services.
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
          <li>TCP probe every 1 minute (default port 443, configurable)</li>
          <li>Up / down status, latency and last-checked timestamp</li>
          <li>Incident timeline showing every state change</li>
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
    mutationFn: (input: { label: string; host: string; port: number; probe_type: "tcp" | "icmp" }) =>
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
  const [probeType, setProbeType] = useState<"tcp" | "icmp">("tcp");
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
      { label, host, port: p, probe_type: probeType },
      {
        onSuccess: () => {
          setLabel("");
          setHost("");
          setPort("443");
          setProbeType("tcp");
        },
      },
    );
  }

  const monitors = (monitorsQ.data?.monitors ?? []) as Monitor[];
  const isAdmin = !!monitorsQ.data?.isAdmin;

  const myLimitsQ = useQuery({
    queryKey: ["my-limits"],
    queryFn: () => getMyLimits(),
  });

  return (
    <Shell>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 30, margin: 0, color: "#fff", letterSpacing: "-0.4px" }}>
            WAN Monitoring {isAdmin && <span style={badge}>ADMIN</span>}
          </h1>
          <p style={{ color: "#8b94b0", margin: "6px 0 0" }}>{email}{isAdmin ? " · viewing all users’ monitors" : ""}</p>
          {!isAdmin && myLimitsQ.data && (
            <p style={{ color: "#8b94b0", margin: "4px 0 0", fontSize: 12 }}>
              Your plan: up to <strong style={{ color: "#c8d0e0" }}>{myLimitsQ.data.max_monitors}</strong> monitor{myLimitsQ.data.max_monitors === 1 ? "" : "s"}, auto-removed after <strong style={{ color: "#c8d0e0" }}>{myLimitsQ.data.retention_days}</strong> day{myLimitsQ.data.retention_days === 1 ? "" : "s"}. Contact admin to increase.
            </p>
          )}
        </div>
        <button onClick={signOut} style={ghostBtn}>Sign out</button>
      </header>

      <form onSubmit={submit} style={{ ...panel, display: "grid", gridTemplateColumns: "1fr 1fr 110px 120px auto", gap: 10, alignItems: "end" }}>
        <Field label="Label">
          <input value={label} required maxLength={80} onChange={(e) => setLabel(e.target.value)} style={input} placeholder="HQ firewall" />
        </Field>
        <Field label="Public IP / host">
          <input value={host} required onChange={(e) => setHost(e.target.value)} style={input} placeholder="203.0.113.5" />
        </Field>
        <Field label="Port">
          <input value={port} required onChange={(e) => setPort(e.target.value)} style={input} inputMode="numeric" disabled={probeType === "icmp"} />
        </Field>
        <Field label="Probe">
          <select
            value={probeType}
            onChange={(e) => setProbeType(e.target.value as "tcp" | "icmp")}
            style={input}
          >
            <option value="tcp">TCP handshake</option>
            <option value="icmp">ICMP (via tunnel)</option>
          </select>
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
            No monitors yet. Add a public IP above to start checking it every minute.
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
        Checks run server-side from our Cloudflare edge every minute via a TCP handshake. ICMP ping is not used.
      </p>

      {isAdmin && <AdminPanel />}
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
  const probe = (m.probe_type ?? "tcp").toUpperCase();
  const probeColor = m.probe_type === "icmp" ? "#9B8FE8" : "#00D4AA";
  return (
    <div style={panel}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: dot, boxShadow: status === "up" ? "0 0 10px rgba(0,212,170,0.6)" : undefined }} />
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ color: "#fff", fontWeight: 600 }}>
            {m.label}{" "}
            <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 5, background: `${probeColor}22`, color: probeColor, letterSpacing: 1, verticalAlign: "middle" }}>
              {probe}
            </span>
          </div>
          <div style={{ color: "#8b94b0", fontSize: 12, fontFamily: "DM Mono, monospace" }}>
            {m.host}{m.probe_type === "icmp" ? "" : `:${m.port}`}
          </div>
          {m.expires_at && (
            <div style={{ color: "#8b94b0", fontSize: 11, marginTop: 2 }}>
              Auto-removes in {fmtUntil(m.expires_at)}
            </div>
          )}
        </div>
        <Stat label="Status" value={statusLabel} color={dot} />
        <Stat label="Latency" value={m.last_latency_ms != null ? `${m.last_latency_ms} ms` : "—"} />
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
function fmtUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "any moment";
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))}m`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h`;
  return `${Math.round(diff / 86_400_000)}d`;
}

// ---- Admin panel ----

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  max_monitors: number;
  retention_days: number;
  monitor_count: number;
};

function AdminPanel() {
  const qc = useQueryClient();
  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
  });
  const save = useMutation({
    mutationFn: (v: { user_id: string; max_monitors: number; retention_days: number }) =>
      adminSetUserLimit({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["monitors"] });
    },
  });

  return (
    <section style={{ marginTop: 36 }}>
      <h2 style={{ color: "#fff", fontSize: 22, margin: "0 0 12px" }}>
        Admin · user limits
      </h2>
      <p style={{ color: "#8b94b0", fontSize: 13, margin: "0 0 14px" }}>
        Defaults are 1 monitor and 1-day retention per user. Increase below for specific users.
      </p>
      {usersQ.isLoading && <p style={{ color: "#8b94b0" }}>Loading users…</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {(usersQ.data as AdminUser[] | undefined)?.map((u) => (
          <AdminUserRow
            key={u.id}
            user={u}
            onSave={(max_monitors, retention_days) =>
              save.mutate({ user_id: u.id, max_monitors, retention_days })
            }
            saving={save.isPending && save.variables?.user_id === u.id}
          />
        ))}
      </div>
      {save.error instanceof Error && (
        <div style={{ color: "#ffb4b4", fontSize: 13, marginTop: 8 }}>{save.error.message}</div>
      )}
    </section>
  );
}

function AdminUserRow({
  user,
  onSave,
  saving,
}: {
  user: AdminUser;
  onSave: (max: number, days: number) => void;
  saving: boolean;
}) {
  const [max, setMax] = useState(String(user.max_monitors));
  const [days, setDays] = useState(String(user.retention_days));
  return (
    <div
      style={{
        ...panel,
        display: "grid",
        gridTemplateColumns: "1fr 90px 90px auto",
        gap: 10,
        alignItems: "end",
      }}
    >
      <div>
        <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
          {user.email} {user.is_admin && <span style={badge}>ADMIN</span>}
        </div>
        <div style={{ color: "#8b94b0", fontSize: 11, marginTop: 2 }}>
          {user.monitor_count} active monitor{user.monitor_count === 1 ? "" : "s"}
        </div>
      </div>
      <Field label="Max IPs">
        <input
          value={max}
          inputMode="numeric"
          onChange={(e) => setMax(e.target.value)}
          style={input}
          disabled={user.is_admin}
        />
      </Field>
      <Field label="Days">
        <input
          value={days}
          inputMode="numeric"
          onChange={(e) => setDays(e.target.value)}
          style={input}
          disabled={user.is_admin}
        />
      </Field>
      <button
        type="button"
        onClick={() => onSave(parseInt(max, 10), parseInt(days, 10))}
        disabled={saving || user.is_admin}
        style={{ ...primaryBtn, opacity: user.is_admin ? 0.4 : 1 }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
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
const badge: React.CSSProperties = {
  display: "inline-block",
  marginLeft: 10,
  fontSize: 11,
  padding: "2px 8px",
  borderRadius: 6,
  background: "rgba(155,143,232,0.18)",
  color: "#c9bfff",
  verticalAlign: "middle",
  letterSpacing: 1,
};
