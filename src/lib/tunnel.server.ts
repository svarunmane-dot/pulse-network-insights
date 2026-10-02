// Server-only helper for calling the external ICMP probe service.
// Auth: X-Probe-Secret header. Endpoints: POST /ping, POST /traceroute, GET /health.

function probeBase(): string | null {
  // Do NOT fall back to TUNNEL_HOSTNAME — on the Cloudflare deployment it points at the old laptop tunnel.
  const h = (process.env.PROBE_HOSTNAME || "https://probe.pulse-speed.com").trim();
  if (!h) return null;
  const clean = h.replace(/\/+$/, "");
  return clean.startsWith("http") ? clean : `https://${clean}`;
}

function probeSecret(): string {
  return (process.env.PROBE_API_SECRET ?? "").trim();
}

export function tunnelConfigStatus() {
  const secret = probeSecret();
  return {
    hostname: probeBase(),
    hasSecret: !!secret,
    hasAccessId: true,
    hasAccessSecret: !!secret,
    accessIdSuffix: null as string | null,
    accessSecretLength: secret.length,
    configured: !!probeBase() && !!secret,
  };
}

function headers(): Record<string, string> {
  return { "Content-Type": "application/json", "X-Probe-Secret": probeSecret() };
}

// Never echo upstream bodies/hosts to users — keeps the probe origin private.
function statusError(status: number, _body: string): string {
  if (status === 401) return "Probe configuration error.";
  if (status === 429) return "Too many requests, try again shortly.";
  if (status === 400) return "Invalid or private target.";
  return "Probe unavailable";
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function tunnelHealth(): Promise<{ ok: boolean; error?: string }> {
  const base = probeBase();
  if (!base) return { ok: false, error: "Probe unavailable" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${base}/health`, { headers: headers(), signal: ctrl.signal });
    return res.ok ? { ok: true } : { ok: false, error: "Probe unavailable" };
  } catch {
    return { ok: false, error: "Probe unavailable" };
  } finally {
    clearTimeout(t);
  }
}

async function post(path: string, ip: string, timeoutMs: number): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  const base = probeBase();
  if (!base) return { ok: false, error: "Probe unavailable" };
  if (!probeSecret()) return { ok: false, error: "Probe configuration error: secret missing." };
  const health = await tunnelHealth();
  if (!health.ok) return { ok: false, error: "Probe unavailable" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ip }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: statusError(res.status, body) };
    }
    return { ok: true, json: (await res.json()) as Record<string, unknown> };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, error: aborted ? "Probe timed out" : "Probe unavailable" };
  } finally {
    clearTimeout(t);
  }
}

export interface IcmpPingResult {
  ok: boolean;
  status?: "UP" | "DOWN";
  latency?: number | null;
  minRtt?: number | null;
  maxRtt?: number | null;
  jitter?: number | null;
  packetLoss?: number | null;
  error?: string;
}

export async function icmpPing(ip: string, timeoutMs = 15000): Promise<IcmpPingResult> {
  const r = await post("/ping", ip, timeoutMs);
  if (!r.ok) return { ok: false, error: r.error };
  const j = r.json;
  return {
    ok: true,
    status: String(j.status ?? "").toUpperCase() === "UP" ? "UP" : "DOWN",
    latency: num(j.latency),
    minRtt: num(j.minRtt),
    maxRtt: num(j.maxRtt),
    jitter: num(j.jitter),
    packetLoss: num(j.packetLoss),
  };
}

export interface TraceHop {
  distance: number | null;
  address: string;
  avg_rtt: number | null;
  packetLoss: number | null;
}

export interface IcmpTraceResult {
  ok: boolean;
  hops?: TraceHop[];
  error?: string;
}

export async function icmpTraceroute(ip: string, timeoutMs = 45000): Promise<IcmpTraceResult> {
  const r = await post("/traceroute", ip, timeoutMs);
  if (!r.ok) return { ok: false, error: r.error };
  const raw = Array.isArray(r.json.hops) ? (r.json.hops as Record<string, unknown>[]) : [];
  return {
    ok: true,
    hops: raw.map((h) => ({
      distance: num(h.distance),
      address: typeof h.address === "string" && h.address ? h.address : "*",
      avg_rtt: num(h.avg_rtt),
      packetLoss: num(h.packetLoss),
    })),
  };
}
