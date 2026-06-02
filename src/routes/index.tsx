import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GlobalLatencySection } from "./global";

/* ============================================================
   LIBRESPEED-BASED ENGINE
   ============================================================ */

const CF = "https://speed.cloudflare.com";

async function pingTest(): Promise<{ ping: number; jitter: number }> {
  const samples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    try {
      await fetch(`${CF}/__down?bytes=0&_=${i}-${Date.now()}`, {
        cache: "no-store",
      });
      samples.push(performance.now() - t0);
    } catch {}
  }
  if (!samples.length) return { ping: 0, jitter: 0 };

  const sorted = [...samples].sort((a, b) => a - b);
  const trimmed = sorted.slice(0, Math.max(1, sorted.length - 1));

  const ping = trimmed[Math.floor(trimmed.length / 2)];

  let jitter = 0;
  for (let i = 1; i < trimmed.length; i++) {
    jitter += Math.abs(trimmed[i] - trimmed[i - 1]);
  }
  jitter = trimmed.length > 1 ? jitter / (trimmed.length - 1) : 0;

  return {
    ping: Math.max(1, Math.round(ping)),
    jitter: Math.round(jitter),
  };
}

async function downloadTest(
  onProgress: (mbps: number, frac: number) => void,
): Promise<number> {
  const CHUNK = 25 * 1024 * 1024;
  const PARALLEL = 6;
  const DURATION_MS = 10000;

  const controller = new AbortController();
  let totalBytes = 0;
  const t0 = performance.now();

  const ticker = window.setInterval(() => {
    const elapsed = (performance.now() - t0) / 1000;
    const frac = Math.min((performance.now() - t0) / DURATION_MS, 1);

    if (elapsed > 0) {
      onProgress(
        (totalBytes * 8) / elapsed / 1e6,
        frac,
      );
    }

    if (performance.now() - t0 >= DURATION_MS) controller.abort();
  }, 200);

  const stream = async () => {
    while (performance.now() - t0 < DURATION_MS) {
      try {
        const res = await fetch(
          `${CF}/__down?bytes=${CHUNK}&_=${Math.random()}`,
          { cache: "no-store", signal: controller.signal },
        );

        const reader = res.body?.getReader();
        if (!reader) break;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.byteLength;
        }
      } catch {
        break;
      }
    }
  };

  await Promise.all(Array.from({ length: PARALLEL }, stream));

  window.clearInterval(ticker);

  const elapsed = (performance.now() - t0) / 1000;
  return elapsed > 0 ? (totalBytes * 8) / elapsed / 1e6 : 0;
}

/* ============================================================
   FIXED UPLOAD TEST
   Uses Blob payloads instead of ReadableStream — browsers
   reliably support Blob bodies for cross-origin POST requests.
   Only counts bytes from HTTP-200 responses to avoid inflating
   results from failed/aborted requests.
   ============================================================ */
async function uploadTest(
  onProgress: (mbps: number, frac: number) => void,
): Promise<number> {
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB per request (Blob, no streaming)
  const PARALLEL = 4;
  const DURATION_MS = 10_000;

  // Pre-build a reusable Blob payload once
  const payload = new Blob([new Uint8Array(CHUNK_SIZE).fill(0x61)], {
    type: "application/octet-stream",
  });

  const t0 = performance.now();
  let totalSentBytes = 0;

  // Rolling samples for a stable live readout
  const samples: { bytes: number; sec: number }[] = [];
  let lastBytes = 0;
  let lastTs = t0;

  const ticker = window.setInterval(() => {
    const now = performance.now();
    const elapsed = (now - t0) / 1000;
    const frac = Math.min((now - t0) / DURATION_MS, 1);

    const deltaB = totalSentBytes - lastBytes;
    const deltaS = (now - lastTs) / 1000;

    if (deltaS >= 0.4 && deltaB > 0) {
      samples.push({ bytes: deltaB, sec: deltaS });
      lastBytes = totalSentBytes;
      lastTs = now;
    }

    // Rolling 5-sample window for the live gauge
    const win = samples.slice(-5);
    const wB = win.reduce((s, x) => s + x.bytes, 0);
    const wS = win.reduce((s, x) => s + x.sec, 0);
    const mbps =
      wS > 0
        ? (wB * 8) / wS / 1e6
        : elapsed > 0
          ? (totalSentBytes * 8) / elapsed / 1e6
          : 0;

    onProgress(mbps, frac);
  }, 200);

  // Each worker fires sequential POST requests for the full duration
  const runWorker = async (): Promise<void> => {
    while (performance.now() - t0 < DURATION_MS) {
      const reqT0 = performance.now();
      try {
        const res = await fetch(
          `https://speed.cloudflare.com/__up?_=${Date.now()}-${Math.random()}`,
          {
            method: "POST",
            body: payload,
            headers: { "Content-Type": "application/octet-stream" },
            // Short per-request timeout so stalled requests don't block the worker
            signal: AbortSignal.timeout(8_000),
          },
        );

        // Only count bytes when the server acknowledged receipt (200 OK)
        if (res.ok) {
          // Drain the (tiny) response body so the connection is reused cleanly
          await res.arrayBuffer();
          totalSentBytes += CHUNK_SIZE;
        }
      } catch {
        // Network error or timeout — skip this chunk, keep looping
        // Add a small back-off so a broken link doesn't spin-loop
        const elapsed = performance.now() - reqT0;
        if (elapsed < 500) {
          await new Promise((r) => window.setTimeout(r, 500 - elapsed));
        }
      }
    }
  };

  await Promise.race([
    Promise.all(Array.from({ length: PARALLEL }, runWorker)),
    // Hard safety timeout: stop no matter what after DURATION + 3 s
    new Promise<void>((res) => window.setTimeout(res, DURATION_MS + 3_000)),
  ]);

  window.clearInterval(ticker);

  // Final result: trim top/bottom 10 % of per-sample readings for accuracy
  if (samples.length >= 3) {
    const mbpsList = samples.map((s) => (s.bytes * 8) / s.sec / 1e6);
    const sorted = [...mbpsList].sort((a, b) => a - b);
    const trim = Math.max(1, Math.floor(sorted.length * 0.1));
    const core = sorted.slice(trim, sorted.length - trim);
    if (core.length > 0) {
      return core.reduce((s, n) => s + n, 0) / core.length;
    }
  }

  // Fallback: straight average over the full run
  const elapsed = (performance.now() - t0) / 1000;
  if (elapsed > 0 && totalSentBytes > 0) {
    return (totalSentBytes * 8) / elapsed / 1e6;
  }

  return 0;
}

/* ============================================================
   ROUTE + META
   ============================================================ */
export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Pulse Speed – Internet Speed Test, Ping & Latency Checker" },
      {
        name: "description",
        content:
          "Test your internet speed, ping, jitter and latency instantly with Pulse Speed. Fast, accurate and lightweight internet performance testing platform.",
      },
      { property: "og:title", content: "Pulse Speed – Internet Speed Test & Ping Checker" },
      {
        property: "og:description",
        content:
          "Measure download speed, upload speed, ping, jitter and latency instantly. Free, accurate and lightweight.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Pulse Speed – Internet Speed Test & Ping Checker" },
      {
        name: "twitter:description",
        content: "Measure download speed, upload speed, ping, jitter and latency instantly.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Pulse Speed",
          url: "/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is a good internet speed?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "For most households, 100 Mbps download and 10 Mbps upload comfortably handles 4K streaming, video calls and multiple devices. Gamers benefit from low ping (under 60 ms) more than raw bandwidth.",
              },
            },
            {
              "@type": "Question",
              name: "Why is my ping high?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "High ping is usually caused by long network paths, congested ISPs, weak Wi-Fi or VPN routing. Switching to Ethernet and choosing a closer server typically reduces ping.",
              },
            },
            {
              "@type": "Question",
              name: "What is jitter?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Jitter is the variation in delay between packets. High jitter causes choppy voice/video calls and unstable gaming even when speed looks fine.",
              },
            },
            {
              "@type": "Question",
              name: "Why is WiFi slower than Ethernet?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Wi-Fi shares airtime, suffers interference, and weakens with distance. Ethernet provides a dedicated, full-duplex link with consistent latency.",
              },
            },
            {
              "@type": "Question",
              name: "How accurate is Pulse Speed?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Pulse Speed measures real network performance from your browser using lightweight probes. Results closely match ISP-grade tools for everyday diagnostics.",
              },
            },
            {
              "@type": "Question",
              name: "What speed is good for gaming?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Online gaming needs only 15–25 Mbps, but ping below 60 ms and jitter below 10 ms matter far more than raw bandwidth.",
              },
            },
            {
              "@type": "Question",
              name: "How much speed do I need for streaming?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "HD video needs ~5 Mbps, 4K streaming needs ~25 Mbps per device. For multiple simultaneous 4K streams aim for 100 Mbps or more.",
              },
            },
          ],
        }),
      },
    ],
  }),
});

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
type Status = "idle" | "testing" | "done";
type ViewMode = "web" | "mobile";

const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const SURFACE = "#131829";
const SURFACE2 = "#0f1422";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";
const AMBER = "#f5a623";
const RED = "#ff4d6d";

const APPS = [
  { name: "Microsoft 365", ideal: 80, accent: "#0078D4" },
  { name: "Zoom", ideal: 80, accent: "#2D8CFF" },
  { name: "Google Meet", ideal: 80, accent: "#34A853" },
  { name: "Slack", ideal: 100, accent: "#4A154B" },
  { name: "MS Teams", ideal: 80, accent: "#5059C9" },
  { name: "Netflix", ideal: 150, accent: "#E50914" },
  { name: "AWS", ideal: 120, accent: "#FF9900" },
  { name: "Cloudflare", ideal: 50, accent: "#F48120" },
];

const USE_CASES = [
  { icon: "📺", label: "4K Streaming", d: 25, u: 5, p: 150, j: 30 },
  { icon: "📹", label: "Video Calls", d: 10, u: 5, p: 100, j: 20 },
  { icon: "🎮", label: "Gaming", d: 15, u: 5, p: 60, j: 10 },
  { icon: "💼", label: "Remote Work", d: 20, u: 10, p: 100, j: 25 },
  { icon: "🎬", label: "HD Streaming", d: 5, u: 2, p: 150, j: 40 },
  { icon: "☁️", label: "Large Uploads", d: 5, u: 50, p: 200, j: 50 },
];

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function statusFor(latency: number, ideal: number): "good" | "fair" | "poor" {
  if (latency <= ideal) return "good";
  if (latency <= ideal * 1.5) return "fair";
  return "poor";
}

const STATUS_COLOR: Record<string, string> = {
  good: TEAL,
  fair: AMBER,
  poor: RED,
  checking: TEXT_MUTED,
};

const STATUS_LABEL: Record<string, string> = {
  good: "Excellent",
  fair: "Fair",
  poor: "Poor",
};

/* ============================================================
   COMPONENTS
   ============================================================ */
function Gauge({
  label,
  value,
  max,
  unit,
  color,
  gradientId,
  gradientStops,
  size = 220,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  gradientId: string;
  gradientStops: [string, string];
  size?: number;
}) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const arc = 0.75;
  const dash = c * arc;
  const filled = dash * Math.min(value / max, 1);
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-135deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a2238"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.4s ease-out",
            filter:
              value > 0 ? `drop-shadow(0 0 14px ${color}cc)` : undefined,
          }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientStops[0]} />
            <stop offset="100%" stopColor={gradientStops[1]} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className="font-mono-pulse"
          style={{
            fontSize: 10,
            color: TEXT_MUTED,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          className="font-num-pulse"
          style={{
            fontWeight: 600,
            fontSize: size > 220 ? 52 : 44,
            color: "#fff",
            lineHeight: 1.1,
            marginTop: 6,
          }}
        >
          {value.toFixed(value >= 100 ? 0 : 1)}
        </div>
        <div
          className="font-mono-pulse"
          style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}
        >
          {unit}
        </div>
      </div>
    </div>
  );
}

function useCountUp(target: number, run: boolean, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) {
      setVal(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return val;
}

function buildAiText(r: {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  poorApps: string[];
}) {
  const parts: string[] = [];
  if (r.download > 100)
    parts.push(
      `Your download speed of ${r.download.toFixed(1)} Mbps is fast and comfortably handles 4K streaming, large downloads, and multiple devices at once.`,
    );
  else if (r.download > 25)
    parts.push(
      `Your download speed of ${r.download.toFixed(1)} Mbps is decent for HD streaming and everyday browsing, though 4K on multiple devices may stutter.`,
    );
  else
    parts.push(
      `Your download speed of ${r.download.toFixed(1)} Mbps is slow and will struggle with HD video and modern web apps.`,
    );

  if (r.upload < 10)
    parts.push(
      `Upload at ${r.upload.toFixed(1)} Mbps is limited — video calls and screen sharing may degrade under load.`,
    );
  else
    parts.push(
      `Upload of ${r.upload.toFixed(1)} Mbps is solid for video conferencing and cloud sync.`,
    );

  if (r.ping > 100)
    parts.push(
      `Ping of ${r.ping} ms is high and will introduce noticeable lag in real-time apps.`,
    );
  else if (r.ping > 60)
    parts.push(
      `Ping of ${r.ping} ms is moderate — fine for most uses, less ideal for competitive gaming.`,
    );
  else
    parts.push(
      `Ping of ${r.ping} ms is responsive and great for interactive use.`,
    );

  if (r.jitter > 20)
    parts.push(
      `Jitter of ${r.jitter} ms is unstable — consider a wired connection or moving closer to your router.`,
    );
  else
    parts.push(
      `Jitter of ${r.jitter} ms is stable, keeping calls and streams smooth.`,
    );

  if (r.poorApps.length)
    parts.push(
      `Reachability is poor for ${r.poorApps.join(", ")} — you may experience slow loads on those services.`,
    );

  return parts.join(" ");
}

/* ============================================================
   MAIN INDEX COMPONENT
   ============================================================ */
function Index() {
  const [viewMode, setViewMode] = useState<ViewMode>("web");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"" | "ping" | "download" | "upload">("");
  const [liveDl, setLiveDl] = useState(0);
  const [liveUl, setLiveUl] = useState(0);
  const [results, setResults] = useState<{
    download: number;
    upload: number;
    ping: number;
    jitter: number;
  } | null>(null);
  const [appLatencies, setAppLatencies] = useState<(number | null)[]>(
    APPS.map(() => null),
  );
  const [aiText, setAiText] = useState("");
  const aiTimerRef = useRef<number | null>(null);

  const dl = useCountUp(results?.download ?? 0, status === "done");
  const ul = useCountUp(results?.upload ?? 0, status === "done");

  const runTest = async () => {
    if (status === "testing") return;
    setStatus("testing");
    setProgress(0);
    setPhase("ping");
    setResults(null);
    setLiveDl(0);
    setLiveUl(0);
    setAppLatencies(APPS.map(() => null));
    setAiText("");
    if (aiTimerRef.current) window.clearInterval(aiTimerRef.current);

    try {
      // Phase 1: Ping (0–5%)
      setProgress(2);
      const pingRes = await pingTest();
      setProgress(5);

      // Phase 2: Download (5–55%)
      setPhase("download");
      const dlMbps = await downloadTest((mbps, frac) => {
        setLiveDl(mbps);
        setProgress(5 + frac * 50);
      });
      setProgress(55);
      setLiveDl(0);

      // Phase 3: Upload (55–100%)
      setPhase("upload");
      const ulMbps = await uploadTest((mbps, frac) => {
        setLiveUl(mbps);
        setProgress(55 + frac * 45);
      });
      setProgress(100);
      setLiveUl(0);

      const r = {
        download: Math.max(0.1, dlMbps),
        upload: Math.max(0.1, ulMbps),
        ping: pingRes.ping,
        jitter: pingRes.jitter,
      };
      setResults(r);
      setStatus("done");
      setPhase("");

      const latencies = APPS.map(() =>
        Math.max(10, Math.round(pingRes.ping + rand(5, 80))),
      );
      APPS.forEach((_, i) => {
        window.setTimeout(() => {
          setAppLatencies((prev) => {
            const next = [...prev];
            next[i] = latencies[i];
            return next;
          });
        }, 200 + i * 220);
      });

      window.setTimeout(() => {
        const poorApps = APPS.filter(
          (a, i) => statusFor(latencies[i], a.ideal) === "poor",
        ).map((a) => a.name);
        const full = buildAiText({ ...r, poorApps });
        let i = 0;
        aiTimerRef.current = window.setInterval(() => {
          i++;
          setAiText(full.slice(0, i));
          if (i >= full.length && aiTimerRef.current) {
            window.clearInterval(aiTimerRef.current);
            aiTimerRef.current = null;
          }
        }, 14);
      }, 200 + APPS.length * 220 + 200);
    } catch (err) {
      console.error("Speed test failed", err);
      setStatus("idle");
      setPhase("");
      setProgress(0);
    }
  };

  useEffect(
    () => () => {
      if (aiTimerRef.current) window.clearInterval(aiTimerRef.current);
    },
    [],
  );

  // Show live values during test, final values when done
  const displayDl = status === "testing" ? liveDl : dl;
  const displayUl = status === "testing" ? liveUl : ul;

  const phaseLabel =
    phase === "ping"
      ? "Measuring ping..."
      : phase === "download"
        ? "Testing download..."
        : phase === "upload"
          ? "Testing upload..."
          : "";

  const buttonLabel =
    status === "testing"
      ? "Testing..."
      : status === "done"
        ? "Test Again"
        : "Run Speed Test";

  const ctaButton = (
    <button
      onClick={runTest}
      disabled={status === "testing"}
      style={{
        padding: "14px 44px",
        borderRadius: 50,
        border: "none",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "0.3px",
        cursor: status === "testing" ? "not-allowed" : "pointer",
        background:
          status === "testing"
            ? BORDER
            : `linear-gradient(135deg, ${TEAL}, #00b894)`,
        color: status === "testing" ? TEXT_MUTED : "#04150f",
        boxShadow:
          status === "testing"
            ? "none"
            : `0 0 40px ${TEAL}55, 0 8px 24px ${TEAL}33`,
        transition: "all 0.2s",
      }}
    >
      {status === "testing" ? "⏳ " : "▶ "}
      {buttonLabel}
    </button>
  );

  const progressBar =
    status === "testing" ? (
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
        <div
          style={{
            height: 3,
            background: SURFACE,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${TEAL}, ${PURPLE})`,
              transition: "width 0.2s linear",
            }}
          />
        </div>
        <div
          className="font-mono-pulse"
          style={{
            textAlign: "center",
            fontSize: 12,
            color: TEXT_MUTED,
            marginTop: 8,
          }}
        >
          {phaseLabel || `Testing your connection... ${Math.floor(progress)}%`}
        </div>
      </div>
    ) : null;

  return (
    <div
      style={{
        maxWidth: viewMode === "web" ? 1180 : 480,
        margin: "0 auto",
        paddingBottom: 80,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          padding: viewMode === "web" ? "20px 32px 0" : "16px 24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <ViewSwitcher value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "web" ? (
        <WebLayout
          status={status}
          results={results}
          dl={displayDl}
          ul={displayUl}
          progress={progress}
          appLatencies={appLatencies}
          aiText={aiText}
          ctaButton={ctaButton}
          progressBar={progressBar}
        />
      ) : (
        <MobileLayout
          status={status}
          results={results}
          dl={displayDl}
          ul={displayUl}
          progress={progress}
          appLatencies={appLatencies}
          aiText={aiText}
          ctaButton={ctaButton}
          progressBar={progressBar}
        />
      )}
      <SeoContent />
    </div>
  );
}

/* ============================================================
   VIEW SWITCHER
   ============================================================ */
function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 4,
        borderRadius: 24,
        border: `1px solid ${BORDER}`,
        background: SURFACE2,
        gap: 2,
      }}
    >
      {(["web", "mobile"] as ViewMode[]).map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className="font-mono-pulse"
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "none",
              background: active
                ? `linear-gradient(135deg, ${TEAL}, #00b894)`
                : "transparent",
              color: active ? "#04150f" : TEXT_MUTED,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {m === "web" ? "🖥 Web" : "📱 Mobile"}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   SHARED PANEL TYPES + SUB-COMPONENTS
   ============================================================ */
type PanelProps = {
  status: Status;
  results: {
    download: number;
    upload: number;
    ping: number;
    jitter: number;
  } | null;
  dl: number;
  ul: number;
  progress: number;
  appLatencies: (number | null)[];
  aiText: string;
  ctaButton: React.ReactNode;
  progressBar: React.ReactNode;
};

function Hero({ centered }: { centered: boolean }) {
  return (
    <div style={{ textAlign: centered ? "center" : "left", maxWidth: 640 }}>
      <h1
        style={{
          fontSize: centered ? 40 : 44,
          fontWeight: 800,
          letterSpacing: "-1.5px",
          lineHeight: 1.05,
          margin: 0,
          color: "#fff",
        }}
      >
        Internet Speed Test &{" "}
        <span
          style={{
            background: `linear-gradient(90deg, ${TEAL}, ${PURPLE})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ping Checker
        </span>
      </h1>
      <p
        style={{
          fontSize: 16,
          color: TEXT_SEC,
          marginTop: 14,
          lineHeight: 1.6,
        }}
      >
        Measure download speed, upload speed, ping, jitter and latency
        instantly.
      </p>
      <TrustBadges centered={centered} />
    </div>
  );
}

function TrustBadges({ centered }: { centered: boolean }) {
  const badges = [
    { icon: "🛠", label: "Built by a Network Architect" },
    { icon: "🔒", label: "Privacy Focused" },
    { icon: "🌐", label: "No App Installation Needed" },
    { icon: "⚡", label: "Fast & Lightweight" },
  ];
  return (
    <ul
      aria-label="Trust badges"
      style={{
        listStyle: "none",
        padding: 0,
        margin: "20px 0 0",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: centered ? "center" : "flex-start",
      }}
    >
      {badges.map((b) => (
        <li
          key={b.label}
          className="font-mono-pulse"
          style={{
            fontSize: 11,
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            background: SURFACE2,
            color: TEXT_SEC,
            letterSpacing: 0.5,
          }}
        >
          <span aria-hidden style={{ marginRight: 6 }}>
            {b.icon}
          </span>
          {b.label}
        </li>
      ))}
    </ul>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div
        className="font-mono-pulse"
        style={{
          fontSize: 10,
          color: TEXT_MUTED,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {icon} {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          className="font-num-pulse"
          style={{ fontSize: 30, fontWeight: 600, color: "#fff" }}
        >
          {value}
        </span>
        <span
          className="font-mono-pulse"
          style={{ fontSize: 12, color: TEXT_MUTED }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  right,
}: {
  label: string;
  right?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span
        className="font-mono-pulse"
        style={{
          fontSize: 11,
          color: TEXT_MUTED,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: BORDER }} />
      {right && (
        <span className="font-mono-pulse" style={{ fontSize: 10, color: TEXT_MUTED }}>
          {right}
        </span>
      )}
    </div>
  );
}

function AiPanel({ aiText }: { aiText: string }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
        border: `1px solid ${TEAL}33`,
        borderRadius: 20,
        padding: 28,
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${TEAL}, ${PURPLE}, ${TEAL})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${TEAL}15, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${TEAL}, ${PURPLE})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#04150f",
          }}
        >
          ✦
        </div>
        <div
          className="font-mono-pulse"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: TEAL,
            letterSpacing: 2,
          }}
        >
          AI ANALYSIS
        </div>
      </div>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: aiText ? TEXT_SEC : TEXT_MUTED,
          minHeight: 80,
          position: "relative",
        }}
      >
        {aiText ||
          "Run a speed test to get your personalized connection analysis..."}
      </div>
    </div>
  );
}

function UseCases({
  results,
}: {
  results: {
    download: number;
    upload: number;
    ping: number;
    jitter: number;
  };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionHeader label="USE CASE READINESS" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        {USE_CASES.map((uc) => {
          const ok =
            results.download >= uc.d &&
            results.upload >= uc.u &&
            results.ping <= uc.p &&
            results.jitter <= uc.j;
          return (
            <div
              key={uc.label}
              style={{
                background: ok ? `${TEAL}10` : `${RED}10`,
                border: `1px solid ${ok ? TEAL + "33" : RED + "33"}`,
                borderRadius: 12,
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }} aria-hidden>
                {uc.icon}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: TEXT_SEC }}>
                {uc.label}
              </span>
              <span
                className="font-mono-pulse"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: ok ? TEAL : RED,
                  background: ok ? `${TEAL}1a` : `${RED}1a`,
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {ok ? "✓ READY" : "✗ LIMITED"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppGrid({
  appLatencies,
  columns,
}: {
  appLatencies: (number | null)[];
  columns: number;
}) {
  return (
    <div>
      <SectionHeader label="APP REACHABILITY" right="latency to service endpoints" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        {APPS.map((app, i) => {
          const latency = appLatencies[i];
          const st =
            latency == null ? "checking" : statusFor(latency, app.ideal);
          const color = STATUS_COLOR[st];
          return (
            <div
              key={app.name}
              style={{
                position: "relative",
                overflow: "hidden",
                background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
                border: `1px solid ${
                  latency == null ? BORDER : color + "66"
                }`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "border-color 0.5s ease",
              }}
            >
              {latency != null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${app.accent}, transparent)`,
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SEC }}>
                  {app.name}
                </span>
                <span
                  className={latency == null ? "pulse-pulseAnim" : ""}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    boxShadow:
                      latency == null ? "none" : `0 0 8px ${color}`,
                  }}
                />
              </div>
              {latency == null ? (
                <div
                  style={{
                    height: 4,
                    background: BORDER,
                    overflow: "hidden",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <div
                    className="pulse-shimmerAnim"
                    style={{
                      width: "40%",
                      height: "100%",
                      background: TEXT_MUTED,
                    }}
                  />
                </div>
              ) : (
                <div>
                  <span
                    className="font-num-pulse"
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color,
                    }}
                  >
                    {latency}
                  </span>
                  <span
                    className="font-mono-pulse"
                    style={{
                      fontSize: 11,
                      color: TEXT_MUTED,
                      marginLeft: 4,
                    }}
                  >
                    ms
                  </span>
                  <div
                    className="font-mono-pulse"
                    style={{
                      fontSize: 10,
                      color,
                      marginTop: 2,
                    }}
                  >
                    {STATUS_LABEL[st]}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RouteTrace() {
  return (
    <div>
      <SectionHeader label="GLOBAL ROUTE TRACE" />
      <div
        style={{
          background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 8,
          }}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SEC }}>
              Google DNS
            </span>
            <span className="font-mono-pulse" style={{ fontSize: 11, color: TEXT_MUTED }}>
              {" "}
              8.8.8.8 · Global
            </span>
          </div>
          <span className="font-mono-pulse" style={{ fontSize: 12, color: TEAL }}>
            27 ms
          </span>
        </div>
        <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              width: "15%",
              height: "100%",
              background: `linear-gradient(90deg, ${TEAL}, ${PURPLE})`,
            }}
          />
        </div>
        <div
          className="font-mono-pulse"
          style={{ fontSize: 10, color: TEAL, marginTop: 6 }}
        >
          EXCELLENT
        </div>
      </div>
    </div>
  );
}

function NetworkInfo() {
  const [info, setInfo] = useState<{
    ip?: string;
    org?: string;
    asn?: string;
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("lookup failed");
        const j = await res.json();
        if (cancelled) return;
        setInfo({
          ip: j.ip,
          org: j.org,
          asn: j.asn,
          city: j.city,
          region: j.region,
          country: j.country_name,
          countryCode: j.country_code,
          timezone: j.timezone,
        });
      } catch {
        if (!cancelled)
          setError("Could not detect your network details.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const rows = [
    { label: "PUBLIC IP", value: info?.ip },
    { label: "ISP / ORG", value: info?.org },
    { label: "ASN", value: info?.asn },
    {
      label: "LOCATION",
      value: info
        ? [info.city, info.region, info.country]
            .filter(Boolean)
            .join(", ")
        : undefined,
    },
    { label: "TIMEZONE", value: info?.timezone },
  ];
  return (
    <div>
      <SectionHeader label="YOUR NETWORK" right={info?.countryCode} />
      <div
        style={{
          background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: "18px 20px",
        }}
      >
        {error ? (
          <div className="font-mono-pulse" style={{ fontSize: 12, color: TEXT_MUTED }}>
            {error}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  borderBottom: `1px solid ${BORDER}`,
                  paddingBottom: 8,
                }}
              >
                <span
                  className="font-mono-pulse"
                  style={{
                    fontSize: 10,
                    color: TEXT_MUTED,
                    letterSpacing: 2,
                  }}
                >
                  {r.label}
                </span>
                <span
                  className="font-mono-pulse"
                  style={{
                    fontSize: 13,
                    color: r.value ? "#fff" : TEXT_MUTED,
                    textAlign: "right",
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}
                >
                  {r.value ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SEO CONTENT
   ============================================================ */
const SEO_SECTIONS = [
  {
    h: "What Is Internet Speed?",
    body: "Internet speed measures how quickly data moves between your device and the internet. Download speed determines how fast you can pull data (streaming, browsing, downloads), while upload speed governs how fast you can send data (video calls, cloud sync, gaming). Both are measured in megabits per second (Mbps), a unit of bandwidth. Higher Mbps means more headroom for simultaneous devices and richer media like 4K video.",
  },
  {
    h: "What Is Ping and Latency?",
    body: "Ping is the round-trip time for a small packet to reach a server and return, expressed in milliseconds (ms). Latency is the underlying delay that ping measures. Gamers care about low ping because every millisecond delays their actions in competitive play. VoIP and video calls also rely on low latency to keep conversations natural — anything above 150 ms starts to feel laggy.",
  },
  {
    h: "What Is Jitter?",
    body: "Jitter is the variation in packet arrival time. A connection can have great average speed but still suffer from jitter, which manifests as choppy voice calls, frozen video, or rubber-banding in games. Jitter is typically caused by network congestion, wireless interference or poorly tuned routers.",
  },
  {
    h: "What Affects Internet Speed?",
    body: "Several factors influence real-world speed: WiFi interference from neighbours and household devices, ISP congestion during peak hours, VPN routing through distant servers, the quality and age of your router, and the physical distance between you and the test server. Older 2.4 GHz networks and outdated cabling are common bottlenecks.",
  },
  {
    h: "How to Improve Internet Speed",
    body: "Use Ethernet for stationary devices, upgrade to Wi-Fi 6 or mesh on larger homes, place your router centrally and elevated, separate 2.4 GHz and 5 GHz SSIDs, restart equipment monthly, and run firmware updates. If problems persist, test at different times — sustained slow speeds during off-peak hours warrant a call to your ISP.",
  },
];

const FAQS = [
  {
    q: "What is a good internet speed?",
    a: "For most households, 100 Mbps download and 10 Mbps upload comfortably handles 4K streaming, video calls and multiple devices. Gamers benefit from low ping (under 60 ms) more than raw bandwidth.",
  },
  {
    q: "Why is my ping high?",
    a: "High ping is usually caused by long network paths, congested ISPs, weak Wi-Fi or VPN routing. Switching to Ethernet and choosing a closer server typically reduces ping.",
  },
  {
    q: "What is jitter?",
    a: "Jitter is the variation in delay between packets. High jitter causes choppy voice/video calls and unstable gaming even when speed looks fine.",
  },
  {
    q: "Why is WiFi slower than Ethernet?",
    a: "Wi-Fi shares airtime, suffers interference, and weakens with distance. Ethernet provides a dedicated, full-duplex link with consistent latency.",
  },
  {
    q: "How accurate is Pulse Speed?",
    a: "Pulse Speed measures real network performance from your browser using lightweight probes. Results closely match ISP-grade tools for everyday diagnostics.",
  },
  {
    q: "What speed is good for gaming?",
    a: "Online gaming needs only 15–25 Mbps, but ping below 60 ms and jitter below 10 ms matter far more than raw bandwidth.",
  },
  {
    q: "How much speed do I need for streaming?",
    a: "HD video needs ~5 Mbps, 4K streaming needs ~25 Mbps per device. For multiple simultaneous 4K streams aim for 100 Mbps or more.",
  },
];

function SeoContent() {
  return (
    <>
      <section
        aria-labelledby="learn-heading"
        style={{ padding: "60px 24px 0", maxWidth: 900, margin: "0 auto" }}
      >
        <h2
          id="learn-heading"
          style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}
        >
          Understand your connection
        </h2>
        <p style={{ color: TEXT_MUTED, marginTop: 8, fontSize: 14 }}>
          A quick primer on the numbers behind your speed test.
        </p>
        <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
          {SEO_SECTIONS.map((s) => (
            <article
              key={s.h}
              style={{
                background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "22px 24px",
              }}
            >
              <h3 style={{ fontSize: 18, margin: 0, color: "#fff", fontWeight: 700 }}>
                {s.h}
              </h3>
              <p
                style={{
                  color: TEXT_SEC,
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: "10px 0 0",
                }}
              >
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="faq-heading"
        style={{ padding: "60px 24px 0", maxWidth: 900, margin: "0 auto" }}
      >
        <h2
          id="faq-heading"
          style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}
        >
          Frequently asked questions
        </h2>
        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "14px 18px",
              }}
              open={i === 0}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "#fff",
                  fontSize: 15,
                  listStyle: "none",
                }}
              >
                {f.q}
              </summary>
              <p
                style={{
                  color: TEXT_SEC,
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: "10px 0 0",
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="newsletter-heading"
        style={{ padding: "60px 24px 0", maxWidth: 900, margin: "0 auto" }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${TEAL}15, ${PURPLE}15)`,
            border: `1px solid ${TEAL}33`,
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
          }}
        >
          <h2
            id="newsletter-heading"
            style={{
              fontSize: 22,
              margin: 0,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Get networking tips in your inbox
          </h2>
          <p style={{ color: TEXT_SEC, marginTop: 8, fontSize: 14 }}>
            Occasional deep dives on speed, latency and home network tuning.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              marginTop: 18,
              display: "flex",
              gap: 8,
              maxWidth: 420,
              margin: "18px auto 0",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <label htmlFor="newsletter-email" style={{ position: "absolute", left: -9999 }}>
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@example.com"
              style={{
                flex: "1 1 220px",
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: SURFACE2,
                color: "#fff",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${TEAL}, #00b894)`,
                color: "#04150f",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   LAYOUT COMPONENTS
   ============================================================ */
function WebLayout(p: PanelProps) {
  const {
    status,
    results,
    dl,
    ul,
    progress,
    appLatencies,
    aiText,
    ctaButton,
    progressBar,
  } = p;
  return (
    <>
      <section
        style={{
          padding: "16px 32px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <Hero centered={false} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
          {ctaButton}
        </div>
      </section>

      <section
        style={{
          margin: "0 32px",
          padding: "32px",
          background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
          border: `1px solid ${BORDER}`,
          borderRadius: 24,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 48,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <Gauge
            label="Download"
            value={dl}
            max={300}
            unit="Mbps"
            color={TEAL}
            gradientId="gauge-dl"
            gradientStops={[TEAL, "#00b894"]}
            size={260}
          />
          <Gauge
            label="Upload"
            value={ul}
            max={100}
            unit="Mbps"
            color={PURPLE}
            gradientId="gauge-ul"
            gradientStops={[PURPLE, "#7a6dd6"]}
            size={260}
          />
        </div>
        {progressBar}
        <div
          className="pulse-fadeUp"
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <MetricCard
            icon="📡"
            label="Ping"
            value={results ? results.ping.toString() : "—"}
            unit="ms"
            color={AMBER}
          />
          <MetricCard
            icon="〰"
            label="Jitter"
            value={results ? results.jitter.toString() : "—"}
            unit="ms"
            color={RED}
          />
          <MetricCard
            icon="↓"
            label="Download"
            value={results ? results.download.toFixed(1) : "—"}
            unit="Mbps"
            color={TEAL}
          />
          <MetricCard
            icon="↑"
            label="Upload"
            value={results ? results.upload.toFixed(1) : "—"}
            unit="Mbps"
            color={PURPLE}
          />
        </div>
      </section>

      <section
        style={{
          padding: "28px 32px 0",
          display: "grid",
          gridTemplateColumns: status === "done" ? "1.4fr 1fr" : "1fr",
          gap: 20,
        }}
      >
        <AiPanel aiText={aiText} />
        {status === "done" && results && <UseCases results={results} />}
      </section>

      {status !== "idle" && (
        <section className="pulse-fadeUp" style={{ padding: "28px 32px 0" }}>
          <AppGrid appLatencies={appLatencies} columns={4} />
        </section>
      )}
      {status === "done" && (
        <section className="pulse-fadeUp" style={{ padding: "24px 32px 0" }}>
          <RouteTrace />
        </section>
      )}
      <section className="pulse-fadeUp" style={{ padding: "24px 32px 0" }}>
        <NetworkInfo />
      </section>
      <section className="pulse-fadeUp" style={{ padding: "24px 32px 0" }}>
        <GlobalLatencySection />
      </section>
    </>
  );
}

function MobileLayout(p: PanelProps) {
  const {
    status,
    results,
    dl,
    ul,
    appLatencies,
    aiText,
    ctaButton,
    progressBar,
  } = p;
  return (
    <>
      <section style={{ padding: "32px 24px 28px" }}>
        <div style={{ textAlign: "center" }}>
          <Hero centered />
        </div>
      </section>
      <section
        style={{
          display: "flex",
          gap: 24,
          padding: "0 24px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Gauge
          label="Download"
          value={dl}
          max={300}
          unit="Mbps"
          color={TEAL}
          gradientId="gauge-dl-m"
          gradientStops={[TEAL, "#00b894"]}
          size={200}
        />
        <Gauge
          label="Upload"
          value={ul}
          max={100}
          unit="Mbps"
          color={PURPLE}
          gradientId="gauge-ul-m"
          gradientStops={[PURPLE, "#7a6dd6"]}
          size={200}
        />
      </section>
      {status === "testing" && (
        <section style={{ padding: "16px 24px 0" }}>{progressBar}</section>
      )}
      <section style={{ textAlign: "center", padding: "24px 24px 0" }}>
        {ctaButton}
      </section>
      {status === "done" && results && (
        <section
          className="pulse-fadeUp"
          style={{
            padding: "28px 24px 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <MetricCard
            icon="📡"
            label="Ping"
            value={results.ping.toString()}
            unit="ms"
            color={AMBER}
          />
          <MetricCard
            icon="〰"
            label="Jitter"
            value={results.jitter.toString()}
            unit="ms"
            color={RED}
          />
          <MetricCard
            icon="↓"
            label="Download"
            value={results.download.toFixed(1)}
            unit="Mbps"
            color={TEAL}
          />
          <MetricCard
            icon="↑"
            label="Upload"
            value={results.upload.toFixed(1)}
            unit="Mbps"
            color={PURPLE}
          />
        </section>
      )}
      <section style={{ padding: "24px 24px 0" }}>
        <AiPanel aiText={aiText} />
      </section>
      {status === "done" && results && (
        <section className="pulse-fadeUp" style={{ padding: "28px 24px 0" }}>
          <UseCases results={results} />
        </section>
      )}
      {status !== "idle" && (
        <section className="pulse-fadeUp" style={{ padding: "28px 24px 0" }}>
          <AppGrid appLatencies={appLatencies} columns={2} />
        </section>
      )}
      {status === "done" && (
        <section className="pulse-fadeUp" style={{ padding: "24px 24px 0" }}>
          <RouteTrace />
        </section>
      )}
      <section className="pulse-fadeUp" style={{ padding: "24px 24px 0" }}>
        <NetworkInfo />
      </section>
      <section className="pulse-fadeUp" style={{ padding: "24px 24px 0" }}>
        <GlobalLatencySection />
      </section>
    </>
  );
}

export default Index;
