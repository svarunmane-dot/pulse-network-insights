import { createServerFn } from "@tanstack/react-start";

/* ============================================================
   NETWORK TOOLS – server functions
   - pingHost: TCP handshake timing (3 probes) via cloudflare:sockets
   - portCheck: single TCP connect with timeout
   - traceHost: HackerTarget with 3 fallback endpoints (quota resilient)
   - whoisIp: proxy ip-api.com (CORS-safe via server)
   ============================================================ */

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

async function tcpConnectTime(
  hostname: string,
  port: number,
  timeoutMs: number,
): Promise<{ ok: boolean; ms?: number; error?: string }> {
  // Dynamic import so build-time tooling doesn't crash on the virtual module.
  let mod: { connect: (...args: unknown[]) => { opened: Promise<unknown>; close: () => Promise<void> } };
  try {
    // @ts-expect-error cloudflare:sockets is a Worker runtime virtual module
    mod = (await import(/* @vite-ignore */ "cloudflare:sockets")) as typeof mod;
  } catch {
    return { ok: false, error: "TCP sockets not available in this runtime" };
  }
  const start = Date.now();
  let socket: { opened: Promise<unknown>; close: () => Promise<void> } | null = null;
  try {
    socket = mod.connect(
      { hostname, port },
      { secureTransport: "off", allowHalfOpen: false },
    );
    await Promise.race([
      socket.opened,
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), timeoutMs)),
    ]);
    const ms = Date.now() - start;
    try {
      await socket.close();
    } catch {
      /* noop */
    }
    return { ok: true, ms };
  } catch (e) {
    try {
      if (socket) await socket.close();
    } catch {
      /* noop */
    }
    return { ok: false, error: e instanceof Error ? e.message : "connect failed" };
  }
}

export const pingHost = createServerFn({ method: "POST" })
  .inputValidator((d: { target: string; port?: number }) => {
    if (!isValidHostOrIp(d.target)) throw new Error("Invalid host or IP");
    const port = d.port ?? 443;
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port");
    return { target: d.target.trim(), port };
  })
  .handler(async ({ data }) => {
    const probes: Array<{ ok: boolean; ms?: number; error?: string }> = [];
    for (let i = 0; i < 4; i++) {
      probes.push(await tcpConnectTime(data.target, data.port, 4000));
    }
    const successes = probes.filter((p) => p.ok && typeof p.ms === "number");
    const times = successes.map((p) => p.ms!);
    const min = times.length ? Math.min(...times) : null;
    const max = times.length ? Math.max(...times) : null;
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    return {
      target: data.target,
      port: data.port,
      sent: probes.length,
      received: successes.length,
      loss: Math.round(((probes.length - successes.length) / probes.length) * 100),
      min,
      max,
      avg,
      probes,
    };
  });

export const portCheck = createServerFn({ method: "POST" })
  .inputValidator((d: { target: string; port: number }) => {
    if (!isValidHostOrIp(d.target)) throw new Error("Invalid host or IP");
    if (!Number.isInteger(d.port) || d.port < 1 || d.port > 65535) throw new Error("Invalid port");
    return { target: d.target.trim(), port: d.port };
  })
  .handler(async ({ data }) => {
    const r = await tcpConnectTime(data.target, data.port, 5000);
    return { target: data.target, port: data.port, ...r };
  });

export const traceHost = createServerFn({ method: "POST" })
  .inputValidator((d: { target: string }) => {
    if (!isValidHostOrIp(d.target)) throw new Error("Invalid host or IP");
    return { target: d.target.trim() };
  })
  .handler(async ({ data }) => {
    const failures: string[] = [];

    // Provider 1: HackerTarget with API key
    const apiKey = process.env.HACKERTARGET_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.hackertarget.com/mtr/?q=${encodeURIComponent(data.target)}&apikey=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url);
        const text = (await res.text()).trim();
        const lower = text.toLowerCase();

        const quotaHit =
          lower.includes("api count exceeded") ||
          lower.includes("increase quota") ||
          lower.includes("rate limit");

        if (res.ok && !quotaHit && text.length > 0) {
          return { target: data.target, ok: true, output: text, provider: "hackertarget-key" };
        }
        failures.push("HackerTarget: " + (quotaHit ? "quota exceeded" : `HTTP ${res.status}`));
      } catch (e) {
        failures.push("HackerTarget: " + (e instanceof Error ? e.message : "failed"));
      }
    }

    // Provider 2: HackerTarget free (no API key)
    try {
      const url = `https://api.hackertarget.com/mtr/?q=${encodeURIComponent(data.target)}`;
      const res = await fetch(url);
      const text = (await res.text()).trim();
      const lower = text.toLowerCase();

      const quotaHit =
        lower.includes("api count exceeded") ||
        lower.includes("increase quota") ||
        lower.includes("rate limit") ||
        lower.includes("daily") ||
        lower.includes("monthly");

      if (res.ok && !quotaHit && text.length > 0) {
        return { target: data.target, ok: true, output: text, provider: "hackertarget-free" };
      }
      failures.push("HackerTarget-Free: " + (quotaHit ? "quota exceeded" : `HTTP ${res.status}`));
    } catch (e) {
      failures.push("HackerTarget-Free: " + (e instanceof Error ? e.message : "failed"));
    }

    // Provider 3: HackerTarget nping (alternate endpoint)
    try {
      const url = `https://api.hackertarget.com/nping/?q=${encodeURIComponent(data.target)}`;
      const res = await fetch(url);
      const text = (await res.text()).trim();
      const lower = text.toLowerCase();

      const quotaHit =
        lower.includes("api count exceeded") ||
        lower.includes("increase quota") ||
        lower.includes("rate limit") ||
        lower.includes("daily");

      if (res.ok && !quotaHit && text.length > 0) {
        return { target: data.target, ok: true, output: text, provider: "hackertarget-nping" };
      }
      failures.push("nping: " + (quotaHit ? "quota exceeded" : `HTTP ${res.status}`));
    } catch (e) {
      failures.push("nping: " + (e instanceof Error ? e.message : "failed"));
    }

    // All providers failed
    const hasQuotaError = failures.some((f) => f.includes("quota"));
    const errorMsg = hasQuotaError
      ? "Traceroute service quota exceeded. Try again later, or add HACKERTARGET_API_KEY in Backend → Secrets."
      : `Traceroute services unavailable. ${failures.join(" | ")}`;

    return {
      target: data.target,
      ok: false,
      error: errorMsg,
    };
  });

export const whoisIp = createServerFn({ method: "POST" })
  .inputValidator((d: { ip: string }) => {
    const v = d.ip.trim();
    if (!isValidIPv4(v)) throw new Error("Please enter a valid public IPv4 address");
    return { ip: v };
  })
  .handler(async ({ data }) => {
    const url = `http://ip-api.com/json/${encodeURIComponent(data.ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lookup failed: HTTP ${res.status}`);
    const json = (await res.json()) as {
      status: string;
      message?: string;
      country?: string;
      countryCode?: string;
      region?: string;
      regionName?: string;
      city?: string;
      zip?: string;
      lat?: number;
      lon?: number;
      timezone?: string;
      isp?: string;
      org?: string;
      as?: string;
      asname?: string;
      reverse?: string;
      mobile?: boolean;
      proxy?: boolean;
      hosting?: boolean;
      query?: string;
    };
    if (json.status !== "success") {
      throw new Error(json.message || "Lookup failed");
    }
    return json;
  });
