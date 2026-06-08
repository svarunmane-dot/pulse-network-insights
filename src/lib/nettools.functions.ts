import { createServerFn } from "@tanstack/react-start";

/* ============================================================
   NETWORK TOOLS – server functions
   - pingHost: TCP handshake timing (3 probes) via cloudflare:sockets
   - portCheck: single TCP connect with timeout
   - traceHost: proxy HackerTarget MTR API (returns text)
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
    const apiKey = process.env.HACKERTARGET_API_KEY;
    
    // Provider 1: ViewDNS (free, no quota, simple API)
    const tryViewDNS = async (): Promise<{ ok: true; output: string } | { ok: false; error: string }> => {
      try {
        const url = `https://viewdns.info/api/traceroute/?domain=${encodeURIComponent(data.target)}&output=json`;
        const res = await fetch(url);
        if (!res.ok) return { ok: false, error: `ViewDNS HTTP ${res.status}` };
        
        const json = (await res.json()) as {
          hops?: Array<{ hop: number; ip: string; hostname: string; rtt1: string; rtt2: string; rtt3: string }>;
          response_code?: string;
        };
        
        if (json.response_code !== "200" || !json.hops || json.hops.length === 0) {
          return { ok: false, error: "ViewDNS: No hops returned" };
        }
        
        // Format as traceroute output
        const output = json.hops
          .map((hop) => {
            const rtts = [hop.rtt1, hop.rtt2, hop.rtt3]
              .filter((r) => r && r !== "*")
              .map((r) => `${r}ms`)
              .join("  ");
            const host = hop.hostname && hop.hostname !== hop.ip ? `${hop.hostname} (${hop.ip})` : hop.ip;
            return `${hop.hop}  ${host}  ${rtts || "* * *"}`;
          })
          .join("\n");
        
        return { ok: true, output };
      } catch (e) {
        return { ok: false, error: `ViewDNS: ${e instanceof Error ? e.message : "request failed"}` };
      }
    };

    // Provider 2: HackerTarget (if API key provided, or as secondary)
    const tryHackerTarget = async (): Promise<{ ok: true; output: string } | { ok: false; error: string }> => {
      if (!apiKey) return { ok: false, error: "HackerTarget: no API key" };
      
      try {
        const url = `https://api.hackertarget.com/mtr/?q=${encodeURIComponent(data.target)}&apikey=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url);
        const text = (await res.text()).trim();
        const lower = text.toLowerCase();
        
        const quotaHit =
          lower.includes("api count exceeded") ||
          lower.includes("increase quota") ||
          lower.includes("rate limit");
        
        if (!res.ok || quotaHit || text.length === 0) {
          return { ok: false, error: `HackerTarget: ${text || `HTTP ${res.status}`}` };
        }
        
        return { ok: true, output: text };
      } catch (e) {
        return { ok: false, error: `HackerTarget: ${e instanceof Error ? e.message : "request failed"}` };
      }
    };

    // Try providers in order
    const result1 = await tryViewDNS();
    if (result1.ok) {
      return { target: data.target, ok: true, output: result1.output, provider: "viewdns" };
    }

    const result2 = await tryHackerTarget();
    if (result2.ok) {
      return { target: data.target, ok: true, output: result2.output, provider: "hackertarget" };
    }

    // Both failed
    return {
      target: data.target,
      ok: false,
      error: `Traceroute services unavailable. ${result1.error} | ${result2.error}`,
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
