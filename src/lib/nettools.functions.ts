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

import { createServerFn } from "@tanstack/react-start";

/* ============================================================
   TRACEROUTE using Globalping (free, no quota limits)
   - Creates measurement request
   - Polls for results (5 attempts, 10s total timeout)
   - Returns formatted traceroute output
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

export const traceHost = createServerFn({ method: "POST" })
  .inputValidator((d: { target: string }) => {
    if (!isValidHostOrIp(d.target)) throw new Error("Invalid host or IP");
    return { target: d.target.trim() };
  })
  .handler(async ({ data }) => {
    try {
      // Step 1: Create measurement request with Globalping
      const createResponse = await fetch("https://api.globalping.io/v1/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: data.target,
          type: "traceroute",
          locations: [{ country: "GB" }], // Your location
          options: { timeout: 10 },
        }),
      });

      if (!createResponse.ok) {
        return {
          target: data.target,
          ok: false,
          error: `Globalping request failed: HTTP ${createResponse.status}`,
        };
      }

      const measurementData = (await createResponse.json()) as {
        id?: string;
        results?: Array<{ probe: { country: string }; result: { status: string; hops?: Array<{ hop: number; ip: string; host?: string; latency: number; timings?: Array<number> }> } }>;
      };

      const measurementId = measurementData.id;
      if (!measurementId) {
        return {
          target: data.target,
          ok: false,
          error: "Globalping: no measurement ID returned",
        };
      }

      // Step 2: Poll for results (5 attempts, ~2 second interval)
      let results = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls

        const statusResponse = await fetch(
          `https://api.globalping.io/v1/measurements/${measurementId}`,
        );

        if (!statusResponse.ok) continue;

        const statusData = (await statusResponse.json()) as {
          results?: Array<{
            probe: { country: string };
            result: {
              status: string;
              hops?: Array<{ hop: number; ip: string; host?: string; latency: number; timings?: Array<number> }>;
            };
          }>;
        };

        if (statusData.results && statusData.results.length > 0) {
          const firstResult = statusData.results[0];
          if (
            firstResult.result.status === "finished" ||
            (firstResult.result.hops && firstResult.result.hops.length > 0)
          ) {
            results = firstResult.result;
            break;
          }
        }
      }

      if (!results || !results.hops || results.hops.length === 0) {
        return {
          target: data.target,
          ok: false,
          error: "Globalping: no hops returned (target may be unreachable)",
        };
      }

      // Step 3: Format output as traceroute
      const output = results.hops
        .map((hop) => {
          const latency = hop.latency ? `${hop.latency.toFixed(2)}ms` : "*";
          const host = hop.host || hop.ip;
          return `${hop.hop}  ${host}  ${latency}`;
        })
        .join("\n");

      return { target: data.target, ok: true, output, provider: "globalping" };
    } catch (e) {
      return {
        target: data.target,
        ok: false,
        error: e instanceof Error ? e.message : "Traceroute failed",
      };
    }
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
