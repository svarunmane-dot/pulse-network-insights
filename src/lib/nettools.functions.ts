import { createServerFn } from "@tanstack/react-start";

/* ============================================================
   NETWORK TOOLS – server functions
   - pingHost: TCP handshake timing (3 probes) via cloudflare:sockets
   - portCheck: single TCP connect with timeout
   - traceHost: ip.sb traceroute API (free, reliable, public)
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
  .inputValidator((d: { target: string; port?: number; mode?: string }) => {
    if (!isValidHostOrIp(d.target)) throw new Error("Invalid host or IP");
    const port = d.port ?? 443;
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port");
    const mode = (d.mode ?? "tcp").toLowerCase();
    if (mode !== "tcp" && mode !== "icmp") throw new Error("Invalid mode");
    return { target: d.target.trim(), port, mode: mode as "tcp" | "icmp" };
  })
  .handler(async ({ data }) => {
    if (data.mode === "icmp") {
      const { icmpPing } = await import("@/lib/tunnel.server");
      const probes: Array<{ ok: boolean; ms?: number; error?: string }> = [];
      for (let i = 0; i < 4; i++) {
        const r = await icmpPing(data.target, 6000);
        const up = r.ok && r.status === "UP";
        probes.push(
          up
            ? { ok: true, ms: r.latency ?? 0 }
            : { ok: false, error: r.error ?? "down" },
        );
      }
      const successes = probes.filter((p) => p.ok && typeof p.ms === "number");
      const times = successes.map((p) => p.ms!);
      return {
        target: data.target,
        port: data.port,
        mode: "icmp" as const,
        sent: probes.length,
        received: successes.length,
        loss: Math.round(((probes.length - successes.length) / probes.length) * 100),
        min: times.length ? Math.min(...times) : null,
        max: times.length ? Math.max(...times) : null,
        avg: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
        probes,
      };
    }
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
      mode: "tcp" as const,
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
  .inputValidator((d: { target: string; mode?: string }) => {
    if (!isValidHostOrIp(d.target)) throw new Error("Invalid host or IP");
    const mode = (d.mode ?? "tcp").toLowerCase();
    if (mode !== "tcp" && mode !== "icmp") throw new Error("Invalid mode");
    return { target: d.target.trim(), mode: mode as "tcp" | "icmp" };
  })
  .handler(async ({ data }) => {
    if (data.mode === "icmp") {
      const { icmpTraceroute } = await import("@/lib/tunnel.server");
      const r = await icmpTraceroute(data.target, 30000);
      if (!r.ok) return { target: data.target, ok: false, error: r.error };
      const lines = (r.hops ?? []).map((h, i) => {
        const obj = h as Record<string, unknown>;
        const ip = obj.ip ?? obj.host ?? obj.address ?? "*";
        const rtt = obj.rtt ?? obj.latency ?? obj.time ?? "";
        return `${String(i + 1).padStart(2, " ")}  ${ip}  ${rtt ? `${rtt} ms` : ""}`.trimEnd();
      });
      return {
        target: data.target,
        ok: true,
        output: lines.join("\n") || "no hops returned",
        provider: "tunnel (ICMP)",
      };
    }
    try {
      // Use ip.sb public traceroute API (free, reliable, no quota)
      const url = `https://ip.sb/api/traceroute/?host=${encodeURIComponent(data.target)}&lang=en`;
      
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!res.ok) {
        return {
          target: data.target,
          ok: false,
          error: `Traceroute API error (HTTP ${res.status})`,
        };
      }

      const html = await res.text();

      // Parse HTML response to extract traceroute data
      const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
      
      if (!match || !match[1]) {
        return {
          target: data.target,
          ok: false,
          error: "No traceroute data returned",
        };
      }

      // Clean HTML entities and tags
      let output = match[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/<[^>]*>/g, "")
        .trim();

      if (!output || output.length < 10) {
        return {
          target: data.target,
          ok: false,
          error: "Target unreachable or invalid",
        };
      }

      return { target: data.target, ok: true, output, provider: "ip.sb" };
    } catch (e) {
      return {
        target: data.target,
        ok: false,
        error: e instanceof Error ? e.message : "Traceroute failed - service unavailable",
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
