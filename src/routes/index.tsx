import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Pulse — Internet Speed Test & Connection Analysis" },
      {
        name: "description",
        content:
          "Pulse is a premium speed test with AI-powered analysis of your download, upload, ping, jitter, and app reachability.",
      },
    ],
  }),
});

type Status = "idle" | "testing" | "done";
type ViewMode = "web" | "mobile";

const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const BG = "#0A0E1A";
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
  const ratio = Math.min(value / max, 1);
  const filled = dash * ratio;
  const active = value > 0;
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
            transition: "stroke-dasharray 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: active ? `drop-shadow(0 0 14px ${color}cc)` : undefined,
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

function useCountUp(target: number, run: boolean, duration = 1800) {
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
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
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
    parts.push(`Ping of ${r.ping} ms is responsive and great for interactive use.`);

  if (r.jitter > 20)
    parts.push(
      `Jitter of ${r.jitter} ms is unstable — consider a wired connection or moving closer to your router.`,
    );
  else parts.push(`Jitter of ${r.jitter} ms is stable, keeping calls and streams smooth.`);

  if (r.poorApps.length)
    parts.push(
      `Reachability is poor for ${r.poorApps.join(", ")} — you may experience slow loads on those services.`,
    );

  return parts.join(" ");
}

function Index() {
  const [viewMode, setViewMode] = useState<ViewMode>("web");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
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

  const runTest = () => {
    if (status === "testing") return;
    setStatus("testing");
    setProgress(0);
    setResults(null);
    setAppLatencies(APPS.map(() => null));
    setAiText("");
    if (aiTimerRef.current) window.clearInterval(aiTimerRef.current);

    const start = performance.now();
    const dur = 3200;
    const tick = () => {
      const p = Math.min((performance.now() - start) / dur, 1);
      setProgress(p * 95);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    window.setTimeout(() => {
      const r = {
        download: rand(80, 160) + Math.random(),
        upload: rand(5, 35) + Math.random(),
        ping: rand(30, 110),
        jitter: rand(5, 25),
      };
      setResults(r);
      setProgress(100);
      setStatus("done");

      const latencies = APPS.map(() => rand(20, 200));
      APPS.forEach((_, i) => {
        window.setTimeout(() => {
          setAppLatencies((prev) => {
            const next = [...prev];
            next[i] = latencies[i];
            return next;
          });
        }, 400 + i * 350);
      });

      const aiStartDelay = 400 + APPS.length * 350 + 200;
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
      }, aiStartDelay);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) window.clearInterval(aiTimerRef.current);
    };
  }, []);

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
              transition: "width 0.1s linear",
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
          Testing your connection... {Math.floor(progress)}%
        </div>
      </div>
    ) : null;

  return (
    <main
      style={{
        maxWidth: viewMode === "web" ? 1180 : 480,
        margin: "0 auto",
        paddingBottom: 80,
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          padding: viewMode === "web" ? "24px 32px" : "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: `linear-gradient(135deg, ${TEAL}, ${PURPLE})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#04150f",
              fontWeight: 800,
              boxShadow: `0 0 20px ${TEAL}40`,
            }}
            aria-hidden
          >
            ⚡
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
            Pulse
          </h1>
        </div>

        <ViewSwitcher value={viewMode} onChange={setViewMode} />

        <Link
          to="/ping"
          className="font-mono-pulse"
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: `1px solid ${BORDER}`,
            color: TEXT_SEC,
            fontSize: 12,
            textDecoration: "none",
            background: SURFACE2,
          }}
        >
          🔗 Ping a friend
        </Link>
      </header>

      {viewMode === "web" ? (
        <WebLayout
          status={status}
          results={results}
          dl={dl}
          ul={ul}
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
          dl={dl}
          ul={ul}
          progress={progress}
          appLatencies={appLatencies}
          aiText={aiText}
          ctaButton={ctaButton}
          progressBar={progressBar}
        />
      )}
    </main>
  );
}

/* ============ VIEW SWITCHER ============ */
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

/* ============ SHARED PANELS ============ */

type PanelProps = {
  status: Status;
  results: { download: number; upload: number; ping: number; jitter: number } | null;
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
    <div style={{ textAlign: centered ? "center" : "left" }}>
      <div
        style={{
          fontSize: centered ? 44 : 36,
          fontWeight: 700,
          letterSpacing: "-1.5px",
          lineHeight: 1.05,
          color: "#fff",
        }}
      >
        Check your connection
      </div>
      <div
        style={{
          fontSize: centered ? 44 : 36,
          fontWeight: 700,
          letterSpacing: "-1.5px",
          lineHeight: 1.05,
          background: `linear-gradient(90deg, ${TEAL}, ${PURPLE})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        in seconds
      </div>
      <p
        className="font-mono-pulse"
        style={{
          fontSize: 13,
          color: TEXT_MUTED,
          marginTop: 14,
          letterSpacing: 1,
        }}
      >
        SPEED · REACHABILITY · AI ANALYSIS
      </p>
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
          style={{ fontSize: 13, fontWeight: 600, color: TEAL, letterSpacing: 2 }}
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
        {aiText || "Run a speed test to get your personalized connection analysis..."}
      </div>
    </div>
  );
}

function UseCases({
  results,
}: {
  results: { download: number; upload: number; ping: number; jitter: number };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionHeader label="USE CASE READINESS" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 8,
        }}
      >
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
              <span style={{ flex: 1, fontSize: 13, color: TEXT_SEC }}>{uc.label}</span>
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
          const st = latency == null ? "checking" : statusFor(latency, app.ideal);
          const color = STATUS_COLOR[st];
          return (
            <div
              key={app.name}
              style={{
                position: "relative",
                overflow: "hidden",
                background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
                border: `1px solid ${latency == null ? BORDER : color + "66"}`,
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
                    boxShadow: latency == null ? "none" : `0 0 8px ${color}`,
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
                    style={{ fontSize: 22, fontWeight: 600, color }}
                  >
                    {latency}
                  </span>
                  <span
                    className="font-mono-pulse"
                    style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 4 }}
                  >
                    ms
                  </span>
                  <div
                    className="font-mono-pulse"
                    style={{ fontSize: 10, color, marginTop: 2 }}
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
        <div
          style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}
        >
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
      } catch (e) {
        if (!cancelled) setError("Could not detect your network details.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: { label: string; value?: string }[] = [
    { label: "PUBLIC IP", value: info?.ip },
    { label: "ISP / ORG", value: info?.org },
    { label: "ASN", value: info?.asn },
    {
      label: "LOCATION",
      value: info
        ? [info.city, info.region, info.country].filter(Boolean).join(", ")
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
          <div
            className="font-mono-pulse"
            style={{ fontSize: 12, color: TEXT_MUTED }}
          >
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
                  style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: 2 }}
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
        <span className="font-mono-pulse" style={{ fontSize: 12, color: TEXT_MUTED }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
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

/* ============ WEB (DESKTOP) LAYOUT ============ */
function WebLayout(p: PanelProps) {
  const { status, results, dl, ul, progress, appLatencies, aiText, ctaButton, progressBar } = p;
  return (
    <>
      {/* Hero band */}
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

      {/* Dashboard: gauges + stats strip */}
      <section
        style={{
          margin: "0 32px",
          padding: "32px",
          background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
          border: `1px solid ${BORDER}`,
          borderRadius: 24,
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.6)`,
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

        {/* Stats strip */}
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

      {/* AI + Use cases two columns */}
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

      {/* App reachability */}
      {status !== "idle" && (
        <section className="pulse-fadeUp" style={{ padding: "28px 32px 0" }}>
          <AppGrid appLatencies={appLatencies} columns={4} />
        </section>
      )}

      {/* Route trace */}
      {status === "done" && (
        <section className="pulse-fadeUp" style={{ padding: "24px 32px 0" }}>
          <RouteTrace />
        </section>
      )}
    </>
  );
}

/* ============ MOBILE LAYOUT ============ */
function MobileLayout(p: PanelProps) {
  const { status, results, dl, ul, progress, appLatencies, aiText, ctaButton, progressBar } = p;
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

      <section style={{ textAlign: "center", padding: "24px 24px 0" }}>{ctaButton}</section>

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
          <MetricCard icon="📡" label="Ping" value={results.ping.toString()} unit="ms" color={AMBER} />
          <MetricCard icon="〰" label="Jitter" value={results.jitter.toString()} unit="ms" color={RED} />
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
    </>
  );
}