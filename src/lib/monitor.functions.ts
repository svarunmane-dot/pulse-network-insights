import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return String(n) === p && n >= 0 && n <= 255;
  });
}
function isValidHostOrIp(s: string): boolean {
  const v = s.trim();
  if (!v || v.length > 253) return false;
  if (isValidIPv4(v)) return true;
  return /^[a-zA-Z0-9.-]+$/.test(v) && v.includes(".");
}

export const listMonitors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wan_monitors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    return { monitors: data ?? [], isAdmin, userId: context.userId };
  });

export const createMonitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { label: string; host: string; port?: number; probe_type?: string }) => {
    const label = (d.label ?? "").trim();
    const host = (d.host ?? "").trim();
    const port = d.port ?? 443;
    const probe_type = (d.probe_type ?? "tcp").toLowerCase();
    if (label.length < 1 || label.length > 80) throw new Error("Label must be 1-80 chars");
    if (!isValidHostOrIp(host)) throw new Error("Invalid host or IP");
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port");
    if (probe_type !== "tcp" && probe_type !== "icmp") throw new Error("Invalid probe type");
    return { label, host, port, probe_type: probe_type as "tcp" | "icmp" };
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("wan_monitors")
      .insert({
        user_id: context.userId,
        label: data.label,
        host: data.host,
        port: data.port,
        probe_type: data.probe_type,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    // Fire an immediate probe so the user sees up/down within seconds.
    try {
      let status: "up" | "down";
      let latency: number | null;
      let err: string | null;
      if (data.probe_type === "icmp") {
        const { icmpPing } = await import("@/lib/tunnel.server");
        const r = await icmpPing(row.host, 6000);
        const up = r.ok && r.status === "UP";
        status = up ? "up" : "down";
        latency = up ? r.latency ?? null : null;
        err = up ? null : r.error ?? "down";
      } else {
        const { tcpProbe } = await import("@/lib/monitor-probe.server");
        const r = await tcpProbe(row.host, row.port, 4000);
        status = r.ok ? "up" : "down";
        latency = r.ok ? r.ms ?? null : null;
        err = r.ok ? null : r.error ?? "down";
      }
      const now = new Date().toISOString();
      await context.supabase.from("monitor_checks").insert({
        monitor_id: row.id,
        status,
        latency_ms: latency,
        error: err,
        checked_at: now,
      });
      const { data: updated } = await context.supabase
        .from("wan_monitors")
        .update({
          last_status: status,
          last_latency_ms: latency,
          last_checked_at: now,
          last_status_change_at: now,
          last_error: err,
        })
        .eq("id", row.id)
        .select("*")
        .single();
      if (updated) return updated;
    } catch {
      /* best-effort */
    }
    return row;
  });

export const deleteMonitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("Missing id");
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("wan_monitors")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { monitorId: string; limit?: number }) => ({
    monitorId: d.monitorId,
    limit: Math.min(d.limit ?? 25, 100),
  }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("monitor_events")
      .select("*")
      .eq("monitor_id", data.monitorId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---- Admin: per-user limits management ----

type AuthCtx = { supabase: any; userId: string };

async function assertAdmin(context: AuthCtx) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const isAdmin = (data ?? []).some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden: admin only");
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.rpc("admin_list_users");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: {
      id: string;
      email: string;
      created_at: string;
      is_admin: boolean;
      max_monitors: number;
      retention_days: number;
      monitor_count: number | string;
    }) => ({
      id: r.id,
      email: r.email,
      created_at: r.created_at,
      is_admin: r.is_admin,
      max_monitors: r.max_monitors,
      retention_days: r.retention_days,
      monitor_count: Number(r.monitor_count),
    }));
  });

export const adminSetUserLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; max_monitors: number; retention_days: number }) => {
    if (!d.user_id) throw new Error("Missing user_id");
    const max_monitors = Number(d.max_monitors);
    const retention_days = Number(d.retention_days);
    if (!Number.isInteger(max_monitors) || max_monitors < 1 || max_monitors > 1000)
      throw new Error("max_monitors must be 1-1000");
    if (!Number.isInteger(retention_days) || retention_days < 1 || retention_days > 3650)
      throw new Error("retention_days must be 1-3650");
    return { user_id: d.user_id, max_monitors, retention_days };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("user_limits")
      .upsert(
        {
          user_id: data.user_id,
          max_monitors: data.max_monitors,
          retention_days: data.retention_days,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyLimits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .rpc("get_user_limits", { _user_id: context.userId });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      max_monitors: row?.max_monitors ?? 1,
      retention_days: row?.retention_days ?? 1,
    };
  });
