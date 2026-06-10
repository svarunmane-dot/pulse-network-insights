"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Monitoring tab for Pulse Speed
 * ------------------------------
 * Drop this file into your project (e.g. app/monitoring/page.tsx for Next.js
 * App Router, or pages/monitoring.tsx for Pages Router). Tailwind CSS is
 * required. No external dependencies.
 *
 * What it does:
 *  - Lets a visitor add public IPs / hostnames to a monitoring list (stored
 *    in localStorage so it survives refreshes).
 *  - Pings each target every 30s using a lightweight HTTPS reachability
 *    probe from the browser (HEAD with no-cors) and records latency + status.
 *  - Shows uptime %, last check, and latency sparkline-style bars.
 *  - Visual style matches Pulse Speed (dark bg + emerald/teal accents).
 */

type Target = {
  id: string;
  label: string;
  host: string; // e.g. 1.1.1.1 or https://example.com
};

type Sample = { t: number; ok: boolean; ms: number | null };

const STORAGE_KEY = "pulse-monitoring-targets-v1";
const SAMPLES_KEY = "pulse-monitoring-samples-v1";
const INTERVAL_MS = 30_000;
const MAX_SAMPLES = 40;

const DEFAULT_TARGETS: Target[] = [
  { id: "cf", label: "Cloudflare DNS", host: "https://1.1.1.1" },
  { id: "google", label: "Google", host: "https://www.google.com" },
];

function normalizeUrl(host: string): string {
  if (/^https?:\/\//i.test(host)) return host;
  return `https://${host}`;
}

async function probe(host: string): Promise<Sample> {
  const url = normalizeUrl(host);
  const start = performance.now();
  try {
    // no-cors lets us measure reachability for arbitrary hosts; we cannot
    // read the response, but a resolved fetch means the TCP+TLS handshake
    // completed.
    await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" });
    return { t: Date.now(), ok: true, ms: Math.round(performance.now() - start) };
  } catch {
    return { t: Date.now(), ok: false, ms: null };
  }
}

export default function Monitoring() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [samples, setSamples] = useState<Record<string, Sample[]>>({});
  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [running, setRunning] = useState(true);

  // Load persisted state
  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_KEY);
      const s = localStorage.getItem(SAMPLES_KEY);
      setTargets(t ? JSON.parse(t) : DEFAULT_TARGETS);
      setSamples(s ? JSON.parse(s) : {});
    } catch {
      setTargets(DEFAULT_TARGETS);
    }
  }, []);

  useEffect(() => {
    if (targets.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
  }, [targets]);
  useEffect(() => {
    localStorage.setItem(SAMPLES_KEY, JSON.stringify(samples));
  }, [samples]);

  // Polling loop
  useEffect(() => {
    if (!running || targets.length === 0) return;

    const tick = async () => {
      const results = await Promise.all(
        targets.map(async (t) => [t.id, await probe(t.host)] as const),
      );
      setSamples((prev) => {
        const next = { ...prev };
        for (const [id, sample] of results) {
          const list = [...(next[id] ?? []), sample];
          next[id] = list.slice(-MAX_SAMPLES);
        }
        return next;
      });
    };

    tick();
    const id = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(id);
  }, [targets, running]);

  const addTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) return;
    const id = crypto.randomUUID();
    setTargets((prev) => [
      ...prev,
      { id, label: label.trim() || host.trim(), host: host.trim() },
    ]);
    setLabel("");
    setHost("");
  };

  const removeTarget = (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setSamples((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            WAN <span className="text-emerald-400">Monitoring</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Continuously check WAN circuits, firewalls, routers and public IPs.
            Probes run from your browser every 30 seconds — no installation
            required.
          </p>
        </header>

        {/* Add target */}
        <form
          onSubmit={addTarget}
          className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1fr_2fr_auto]"
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
          />
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Host or URL (e.g. 8.8.8.8 or https://example.com)"
            className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Add monitor
          </button>
        </form>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {targets.length} target{targets.length === 1 ? "" : "s"} ·{" "}
            <span className={running ? "text-emerald-400" : "text-amber-400"}>
              {running ? "● Live" : "❚❚ Paused"}
            </span>
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>

        <div className="space-y-3">
          {targets.map((t) => (
            <MonitorRow
              key={t.id}
              target={t}
              samples={samples[t.id] ?? []}
              onRemove={() => removeTarget(t.id)}
            />
          ))}
          {targets.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              No monitors yet. Add a host above to get started.
            </div>
          )}
        </div>

        <p className="mt-10 text-xs text-slate-500">
          Note: Browser probes can only measure HTTPS reachability. For ICMP /
          TCP-port checks behind a firewall, deploy an agent on your network.
        </p>
      </div>
    </div>
  );
}

function MonitorRow({
  target,
  samples,
  onRemove,
}: {
  target: Target;
  samples: Sample[];
  onRemove: () => void;
}) {
  const last = samples[samples.length - 1];
  const uptime = useMemo(() => {
    if (!samples.length) return null;
    const ok = samples.filter((s) => s.ok).length;
    return Math.round((ok / samples.length) * 1000) / 10;
  }, [samples]);
  const avgMs = useMemo(() => {
    const okSamples = samples.filter((s) => s.ok && s.ms !== null);
    if (!okSamples.length) return null;
    return Math.round(
      okSamples.reduce((a, s) => a + (s.ms ?? 0), 0) / okSamples.length,
    );
  }, [samples]);

  const status = !last
    ? "pending"
    : last.ok
      ? "up"
      : "down";

  const statusColor =
    status === "up"
      ? "bg-emerald-400"
      : status === "down"
        ? "bg-rose-500"
        : "bg-slate-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-3 w-3 rounded-full ${statusColor} ${status === "up" ? "shadow-[0_0_12px_rgba(52,211,153,0.7)]" : ""}`} />
          <div className="min-w-0">
            <div className="truncate font-medium">{target.label}</div>
            <div className="truncate text-xs text-slate-500">{target.host}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <Stat label="Status" value={status.toUpperCase()} accent={status === "up" ? "text-emerald-400" : status === "down" ? "text-rose-400" : "text-slate-400"} />
          <Stat label="Uptime" value={uptime !== null ? `${uptime}%` : "—"} />
          <Stat label="Avg" value={avgMs !== null ? `${avgMs} ms` : "—"} />
          <Stat label="Last" value={last?.ms != null ? `${last.ms} ms` : last ? "fail" : "—"} />
          <button
            onClick={onRemove}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-rose-300"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Latency bars */}
      <div className="mt-4 flex h-10 items-end gap-1">
        {Array.from({ length: MAX_SAMPLES }).map((_, i) => {
          const s = samples[samples.length - MAX_SAMPLES + i];
          if (!s) return <div key={i} className="flex-1 rounded-sm bg-white/[0.04]" style={{ height: "20%" }} />;
          const h = s.ok ? Math.min(100, Math.max(15, (s.ms ?? 0) / 5)) : 100;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${s.ok ? "bg-emerald-400/70" : "bg-rose-500/70"}`}
              style={{ height: `${h}%` }}
              title={`${new Date(s.t).toLocaleTimeString()} — ${s.ok ? `${s.ms} ms` : "down"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-mono text-sm ${accent ?? "text-slate-200"}`}>{value}</div>
    </div>
  );
}
