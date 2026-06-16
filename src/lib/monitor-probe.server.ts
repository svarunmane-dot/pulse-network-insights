// Server-only TCP probe helper for WAN monitoring.
// Runs in the Cloudflare Worker SSR runtime via cloudflare:sockets.

export interface ProbeResult {
  ok: boolean;
  ms?: number;
  error?: string;
}

export async function tcpProbe(
  hostname: string,
  port: number,
  timeoutMs = 4000,
): Promise<ProbeResult> {
  let mod: {
    connect: (
      ...args: unknown[]
    ) => { opened: Promise<unknown>; close: () => Promise<void> };
  };
  try {
    // @ts-expect-error virtual Worker module
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
