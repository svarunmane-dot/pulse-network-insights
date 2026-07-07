import { createServerFn } from "@tanstack/react-start";

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

/**
 * Public, unauthenticated one-shot TCP probe used by the browser-side
 * session-only App Monitoring page. No persistence, no rate control
 * beyond a per-call 4s timeout — the client polls at most one monitor
 * per user per minute.
 */
export const probeTcp = createServerFn({ method: "POST" })
  .inputValidator((d: { host: string; port: number }) => {
    const host = (d.host ?? "").trim();
    const port = Number(d.port);
    if (!isValidHostOrIp(host)) throw new Error("Invalid host or IP");
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error("Invalid port");
    return { host, port };
  })
  .handler(async ({ data }) => {
    const { tcpProbe } = await import("@/lib/monitor-probe.server");
    const r = await tcpProbe(data.host, data.port, 4000);
    return {
      status: (r.ok ? "up" : "down") as "up" | "down",
      latency_ms: r.ok ? r.ms ?? null : null,
      error: r.ok ? null : r.error ?? "down",
      checked_at: new Date().toISOString(),
    };
  });