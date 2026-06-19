// Server-only helper for calling the private Cloudflare Tunnel that
// exposes the local ICMP/traceroute service on the laptop.
// All calls are authenticated with a Cloudflare Access service token.

function tunnelBase(): string | null {
  const h = (process.env.TUNNEL_HOSTNAME ?? "laptop.pulse-speed.com").trim();
  if (!h) return null;
  return h.startsWith("http") ? h.replace(/\/+$/, "") : `https://${h.replace(/\/+$/, "")}`;
}

export function tunnelConfigStatus() {
  const hostname = (process.env.TUNNEL_HOSTNAME ?? "laptop.pulse-speed.com").trim();
  const accessId = (process.env.CF_ACCESS_CLIENT_ID ?? "d7c97dbcff050cef96c5c079c86582ca.access").trim();
  const accessSecret = process.env.CF_ACCESS_CLIENT_SECRET?.trim() ?? "";
  const hasAccessId = !!accessId;
  const hasAccessSecret = !!accessSecret;
  return {
    hostname,
    hasAccessId,
    hasAccessSecret,
    accessIdSuffix: hasAccessId ? accessId.slice(-10) : null,
    accessSecretLength: accessSecret.length,
    configured: !!hostname && hasAccessId && hasAccessSecret,
  };
}

function tunnelHeaders(): Record<string, string> {
  const accessId = (process.env.CF_ACCESS_CLIENT_ID ?? "d7c97dbcff050cef96c5c079c86582ca.access").trim();
  const accessSecret = process.env.CF_ACCESS_CLIENT_SECRET?.trim() ?? "";
  return {
    "Content-Type": "application/json",
    "CF-Access-Client-Id": accessId,
    "CF-Access-Client-Secret": accessSecret,
  };
}

function tunnelError(res: Response, body: string): string {
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  const code = text.match(/error code:\s*(\d+)/i)?.[1];
  if (res.status === 530 && code === "1016") {
    return "Tunnel DNS error 1016: the tunnel hostname is not resolving to an active Cloudflare Tunnel public hostname.";
  }
  return `Tunnel HTTP ${res.status}${text ? `: ${text}` : ""}`;
}

export interface IcmpPingResult {
  ok: boolean;
  status?: "UP" | "DOWN" | string;
  latency?: number | null;
  packetLoss?: number | null;
  error?: string;
}

export async function icmpPing(ip: string, timeoutMs = 6000): Promise<IcmpPingResult> {
  const base = tunnelBase();
  if (!base) return { ok: false, error: "Tunnel not configured" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/ping`, {
      method: "POST",
      headers: tunnelHeaders(),
      body: JSON.stringify({ ip }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: tunnelError(res, body) };
    }
    const json = (await res.json()) as {
      status?: string;
      latency?: number;
      packetLoss?: number;
    };
    const up = (json.status ?? "").toUpperCase() === "UP";
    return {
      ok: true,
      status: up ? "UP" : "DOWN",
      latency: typeof json.latency === "number" ? json.latency : null,
      packetLoss: typeof json.packetLoss === "number" ? json.packetLoss : null,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "tunnel call failed" };
  } finally {
    clearTimeout(t);
  }
}

export interface IcmpTraceResult {
  ok: boolean;
  status?: string;
  hops?: Array<Record<string, unknown>>;
  error?: string;
}

export async function icmpTraceroute(ip: string, timeoutMs = 30000): Promise<IcmpTraceResult> {
  const base = tunnelBase();
  if (!base) return { ok: false, error: "Tunnel not configured" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/traceroute`, {
      method: "POST",
      headers: tunnelHeaders(),
      body: JSON.stringify({ ip }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: tunnelError(res, body) };
    }
    const json = (await res.json()) as { status?: string; hops?: Array<Record<string, unknown>> };
    return { ok: true, status: json.status, hops: json.hops ?? [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "tunnel call failed" };
  } finally {
    clearTimeout(t);
  }
}

export async function tunnelHealth(): Promise<{ ok: boolean; error?: string }> {
  const base = tunnelBase();
  if (!base) return { ok: false, error: "Tunnel not configured" };
  try {
    const res = await fetch(`${base}/health`, { headers: tunnelHeaders() });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: tunnelError(res, body) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "tunnel unreachable" };
  }
}