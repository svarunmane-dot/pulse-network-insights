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
  .inputValidator((d: { label: string; host: string; port?: number }) => {
    const label = (d.label ?? "").trim();
    const host = (d.host ?? "").trim();
    const port = d.port ?? 443;
    if (label.length < 1 || label.length > 80) throw new Error("Label must be 1-80 chars");
    if (!isValidHostOrIp(host)) throw new Error("Invalid host or IP");
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port");
    return { label, host, port };
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("wan_monitors")
      .insert({
        user_id: context.userId,
        label: data.label,
        host: data.host,
        port: data.port,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
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
