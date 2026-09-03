import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShareResult from "@/components/ShareResult";
import { toolHead } from "@/lib/seo";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";
const RED = "#ff5d73";
const AMBER = "#ffb648";

const STORAGE_KEY = "pulse-speed:stability-24h";
const DAY_MS = 24 * 60 * 60 * 1000;

/** One sample per second: [epoch ms, latency ms | -1 for loss] */
type Sample = [number, number];

type Stored = { startedAt: number; samples: Sample[] };

export const Route = createFileRoute("/stability-test")({
  component: StabilityTestPage,
  head: () =>
    toolHead({
      path: "/stability-test",
      name: "24 Hour Network Stability Test",
      title: "24 Hour Network Stability Test — Latency, Jitter & Packet Loss",
      description:
        "Record internet stability for a full 24 hours, one sample every second. Track latency spikes, jitter, packet loss and downtime gaps privately in your own browser.",
      faqs: [
        {
          q: "Where is my 24 hour stability data stored?",
          a: "Every sample stays in this browser on this machine using local storage. Nothing is uploaded to our servers, so only the person with this page open can see the results.",
        },
        {
          q: "How is jitter calculated?",
          a: "Jitter is the mean absolute difference between consecutive successful latency samples. A high value means the connection latency varies a lot second to second.",
        },
        {
          q: "Does the test need to stay open for 24 hours?",
          a: "Yes. The browser tab must stay open and the machine awake for the full run. If you close the tab the recording pauses and resumes with the saved history when you return.",
        },
      ],
    }),
});

function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || !Array.isArray(parsed.samples)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function fmtMs(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ms`;
}

function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function StabilityTestPage() {
  const [running, setRunning] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const samplesRef = useRef<Sample[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Restore any previous recording from this machine.
  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      const cutoff = Date.now() - DAY_MS;
      const kept = stored.samples.filter((s) => s[0] >= cutoff);
      samplesRef.current = kept;
      setSamples(kept);
      setStartedAt(stored.startedAt);
    }
  }, []);

  const persist = useCallback((start: number) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ startedAt: start, samples: samplesRef.current } satisfies Stored),
      );
    } catch {
      /* quota — keep recording in memory */
    }
  }, []);

  // Sampling loop: one probe every second.
  useEffect(() => {
    if (!running || startedAt === null) return;
    let cancelled = false;

    const probe = async () => {
      const t0 = performance.now();
      let latency = -1;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(`/favicon.png?stability=${Date.now()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) latency = Math.round((performance.now() - t0) * 10) / 10;
      } catch {
        latency = -1;
      }
      if (cancelled) return;
      const cutoff = Date.now() - DAY_MS;
      const next = [...samplesRef.current, [Date.now(), latency] as Sample].filter(
        (s) => s[0] >= cutoff,
      );
      samplesRef.current = next;
      setSamples(next);
      if (next.length % 5 === 0) persist(startedAt);
      if (Date.now() - startedAt >= DAY_MS) setRunning(false);
    };

    void probe();
    const id = setInterval(probe, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
      persist(startedAt);
    };
  }, [running, startedAt, persist]);

  // Ticking clock for elapsed/remaining display.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const ok = samples.filter((s) => s[1] >= 0).map((s) => s[1]);
    const lost = samples.length - ok.length;
    const avg = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
    const min = ok.length ? Math.min(...ok) : null;
    const max = ok.length ? Math.max(...ok) : null;
    let jitterSum = 0;
    let jitterN = 0;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1][1];
      const b = samples[i][1];
      if (a >= 0 && b >= 0) {
        jitterSum += Math.abs(b - a);
        jitterN++;
      }
    }
    const jitter = jitterN ? jitterSum / jitterN : null;
    const loss = samples.length ? (lost / samples.length) * 100 : 0;
    const spikes = avg !== null ? ok.filter((v) => v > Math.max(avg * 2, avg + 50)).length : 0;

    // Outage windows: runs of consecutive failed samples.
    const outages: Array<{ from: number; to: number; seconds: number }> = [];
    let runStart: number | null = null;
    let runEnd = 0;
    for (const [t, v] of samples) {
      if (v < 0) {
        if (runStart === null) runStart = t;
        runEnd = t;
      } else if (runStart !== null) {
        outages.push({ from: runStart, to: runEnd, seconds: Math.round((runEnd - runStart) / 1000) + 1 });
        runStart = null;
      }
    }
    if (runStart !== null)
      outages.push({ from: runStart, to: runEnd, seconds: Math.round((runEnd - runStart) / 1000) + 1 });

    return {
      count: samples.length,
      ok: ok.length,
      lost,
      avg,
      min,
      max,
      jitter,
      loss,
      spikes,
      uptime: samples.length ? (ok.length / samples.length) * 100 : 100,
      outages: outages.reverse(),
    };
  }, [samples]);

  // Timeline chart.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#0d1120";
    ctx.fillRect(0, 0, w, h);

    const start = startedAt ?? (samples.length ? samples[0][0] : Date.now());
    const end = start + DAY_MS;
    const okVals = samples.filter((s) => s[1] >= 0).map((s) => s[1]);
    const maxY = Math.max(50, okVals.length ? Math.max(...okVals) * 1.15 : 100);

    // Grid + hour marks
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "10px system-ui, sans-serif";
    for (let i = 0; i <= 4; i++) {
      const y = (h - 18) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(maxY * (1 - i / 4))} ms`, 4, y + 11);
    }
    for (let hIdx = 0; hIdx <= 24; hIdx += 3) {
      const x = (w * hIdx) / 24;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 18);
      ctx.stroke();
      ctx.fillText(`${hIdx}h`, Math.min(x + 3, w - 20), h - 5);
    }

    if (!samples.length) return;
    const xOf = (t: number) => ((t - start) / (end - start)) * w;
    const yOf = (v: number) => (h - 18) * (1 - Math.min(v, maxY) / maxY);

    // Loss markers
    ctx.fillStyle = RED;
    for (const [t, v] of samples) {
      if (v < 0) ctx.fillRect(Math.max(0, xOf(t) - 0.5), 0, 1.5, h - 18);
    }

    // Latency line
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    let pen = false;
    for (const [t, v] of samples) {
      if (v < 0) {
        pen = false;
        continue;
      }
      const x = xOf(t);
      const y = yOf(v);
      if (!pen) {
        ctx.moveTo(x, y);
        pen = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [samples, startedAt]);

  const start = useCallback(() => {
    const t = Date.now();
    samplesRef.current = [];
    setSamples([]);
    setStartedAt(t);
    setRunning(true);
    persist(t);
  }, [persist]);

  const resume = useCallback(() => setRunning(true), []);

  const stop = useCallback(() => {
    setRunning(false);
    if (startedAt !== null) persist(startedAt);
  }, [persist, startedAt]);

  const reset = useCallback(() => {
    setRunning(false);
    samplesRef.current = [];
    setSamples([]);
    setStartedAt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const exportCsv = useCallback(() => {
    const csv = [
      "timestamp_iso,latency_ms,status",
      ...samples.map(
        ([t, v]) => `${new Date(t).toISOString()},${v < 0 ? "" : v},${v < 0 ? "loss" : "ok"}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-speed-stability-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [samples]);

  const elapsed = startedAt ? Math.min(now - startedAt, DAY_MS) : 0;
  const remaining = startedAt ? Math.max(0, DAY_MS - (now - startedAt)) : DAY_MS;
  const progress = (elapsed / DAY_MS) * 100;

  const verdict =
    stats.count === 0
      ? "Not started"
      : stats.loss > 1 || (stats.jitter ?? 0) > 30
        ? "Unstable — investigate congestion or link quality"
        : stats.loss > 0 || (stats.jitter ?? 0) > 12
          ? "Mostly stable with occasional variance"
          : "Stable connection";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 10,
          }}
        >
          24 Hour Network Stability Test
        </h1>
        <p
          style={{
            color: TEXT_MUTED,
            fontSize: 15,
            maxWidth: 720,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Measure and record internet stability over a full 24 hours with one probe every second.
          Track latency spikes, jitter and packet loss. Everything is recorded and shown only on
          this machine in this browser — nothing is uploaded or shared.
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!running && (
            <button onClick={startedAt ? resume : start} style={btn(true)}>
              {startedAt ? "Resume recording" : "Start 24 hour test"}
            </button>
          )}
          {running && (
            <button onClick={stop} style={btn(false)}>
              Pause
            </button>
          )}
          {startedAt && (
            <>
              <button onClick={start} style={btn(false)}>
                Restart
              </button>
              <button onClick={reset} style={btn(false)}>
                Clear data
              </button>
              <button onClick={exportCsv} style={btn(false)} disabled={!samples.length}>
                Export CSV
              </button>
            </>
          )}
        </div>
        <div style={{ color: TEXT_SEC, fontSize: 13, textAlign: "right" }}>
          <div>
            <span style={{ color: TEXT_MUTED }}>Elapsed</span> {fmtDuration(elapsed)} /{" "}
            <span style={{ color: TEXT_MUTED }}>left</span> {fmtDuration(remaining)}
          </div>
          <div style={{ color: running ? TEAL : TEXT_MUTED, fontWeight: 600 }}>
            {running ? "● Recording every second" : startedAt ? "Paused" : "Idle"}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 6,
          borderRadius: 6,
          background: "#0d1120",
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
          marginBottom: 22,
        }}
      >
        <div style={{ width: `${progress}%`, height: "100%", background: TEAL }} />
      </div>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <Metric label="Average latency" value={fmtMs(stats.avg)} />
        <Metric label="Min / Max" value={`${fmtMs(stats.min)} / ${fmtMs(stats.max)}`} />
        <Metric
          label="Jitter"
          value={fmtMs(stats.jitter)}
          color={(stats.jitter ?? 0) > 30 ? RED : (stats.jitter ?? 0) > 12 ? AMBER : TEAL}
        />
        <Metric
          label="Packet loss"
          value={`${stats.loss.toFixed(2)}%`}
          color={stats.loss > 1 ? RED : stats.loss > 0 ? AMBER : TEAL}
        />
        <Metric label="Uptime" value={`${stats.uptime.toFixed(3)}%`} />
        <Metric label="Samples recorded" value={stats.count.toLocaleString()} />
      </div>

      {/* Timeline */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT_SEC, margin: 0 }}>
            24 hour latency timeline
          </h2>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>
            <span style={{ color: TEAL }}>■</span> latency &nbsp;
            <span style={{ color: RED }}>■</span> packet loss / dropout
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", height: 240, display: "block" }} />
      </div>

      {/* Outages */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 22,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT_SEC, marginTop: 0 }}>
          Dropouts &amp; downtime
        </h2>
        {stats.outages.length === 0 ? (
          <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>
            No dropouts recorded so far. Every second-by-second probe succeeded.
          </p>
        ) : (
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {stats.outages.slice(0, 100).map((o) => (
              <div
                key={o.from}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: TEXT_SEC,
                  padding: "6px 0",
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                <span>{new Date(o.from).toLocaleTimeString()}</span>
                <span style={{ color: RED, fontWeight: 600 }}>{o.seconds}s dropout</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.count > 0 && (
        <ShareResult
          title="24 Hour Network Stability Test"
          subtitle={`${fmtDuration(elapsed)} recorded · ${stats.count.toLocaleString()} samples`}
          stats={[
            { label: "Avg latency", value: fmtMs(stats.avg) },
            { label: "Jitter", value: fmtMs(stats.jitter) },
            { label: "Packet loss", value: `${stats.loss.toFixed(2)}%` },
            { label: "Uptime", value: `${stats.uptime.toFixed(3)}%` },
            { label: "Max latency", value: fmtMs(stats.max) },
            { label: "Dropouts", value: String(stats.outages.length) },
          ]}
          rows={[
            { label: "Latency spikes", value: String(stats.spikes) },
            { label: "Successful probes", value: stats.ok.toLocaleString() },
            { label: "Failed probes", value: stats.lost.toLocaleString() },
          ]}
          note={verdict}
          fileName="pulse-speed-24h-stability"
        />
      )}

      <section style={{ marginTop: 34, color: TEXT_SEC, fontSize: 14, lineHeight: 1.7 }}>
        <h2 style={{ fontSize: 20, color: "#fff" }}>What this 24 hour stability test measures</h2>
        <p>
          <strong style={{ color: TEAL }}>Latency (ping)</strong> — spikes in milliseconds indicate
          network congestion or server strain. A healthy broadband line stays flat; repeated spikes
          usually point to a saturated uplink, Wi-Fi interference or an overloaded ISP hop.
        </p>
        <p>
          <strong style={{ color: TEAL }}>Packet loss / uptime</strong> — gaps in the timeline show
          total dropouts or downtime. Red bars mark seconds where the probe never came back, which
          is what causes calls to freeze and sessions to reconnect.
        </p>
        <p>
          <strong style={{ color: TEAL }}>Jitter</strong> — high variance between consecutive pings
          indicates an unstable connection. Under 12 ms is good for voice and video, over 30 ms will
          be audible as choppy audio.
        </p>
        <p style={{ color: TEXT_MUTED }}>
          Keep this tab open for the full 24 hours and stop the machine from sleeping. Results are
          written to this browser's local storage, so only the person using this machine can see
          them.
        </p>
      </section>
    </div>
  );
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: "10px 16px",
    borderRadius: 10,
    border: `1px solid ${primary ? TEAL : BORDER}`,
    background: primary ? TEAL : "transparent",
    color: primary ? "#04121a" : TEXT_SEC,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color ?? "#fff", marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}
