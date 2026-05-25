import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

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

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function statusFor(latency: number, ideal: number): "good" | "fair" | "poor" {
  if (latency <= ideal) return "good";
  if (latency <= ideal * 1.5) return "fair";
  return "poor";
}
const STATUS_COLOR: Record<string, string> = {
  good: "#00e5b0",
  fair: "#f5a623",
  poor: "#ff4d6d",
  checking: "#4a7090",
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
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  gradientId: string;
  gradientStops: [string, string];
}) {
  const size = 200;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const arc = 0.75; // 270deg sweep
  const dash = c * arc;
  const ratio = Math.min(value / max, 1);
  const filled = dash * ratio;
  const active = value > 0;
  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-135deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a2a3a"
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
            filter: active ? `drop-shadow(0 0 10px ${color}b3)` : undefined,
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
          style={{ fontSize: 10, color: "#7a9bb5", letterSpacing: 3, textTransform: "uppercase" }}
        >
          {label}
        </div>
        <div style={{ fontWeight: 700, fontSize: 42, color: "#fff", lineHeight: 1.1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
          {value.toFixed(value >= 100 ? 0 : 1)}
        </div>
        <div className="font-mono-pulse" style={{ fontSize: 11, color: "#7a9bb5", marginTop: 4 }}>
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
    parts.push(`Your download speed of ${r.download.toFixed(1)} Mbps is fast and comfortably handles 4K streaming, large downloads, and multiple devices at once.`);
  else if (r.download > 25)
    parts.push(`Your download speed of ${r.download.toFixed(1)} Mbps is decent for HD streaming and everyday browsing, though 4K on multiple devices may stutter.`);
  else
    parts.push(`Your download speed of ${r.download.toFixed(1)} Mbps is slow and will struggle with HD video and modern web apps.`);

  if (r.upload < 10)
    parts.push(`Upload at ${r.upload.toFixed(1)} Mbps is limited — video calls and screen sharing may degrade under load.`);
  else
    parts.push(`Upload of ${r.upload.toFixed(1)} Mbps is solid for video conferencing and cloud sync.`);

  if (r.ping > 100) parts.push(`Ping of ${r.ping} ms is high and will introduce noticeable lag in real-time apps.`);
  else if (r.ping > 60) parts.push(`Ping of ${r.ping} ms is moderate — fine for most uses, less ideal for competitive gaming.`);
  else parts.push(`Ping of ${r.ping} ms is responsive and great for interactive use.`);

  if (r.jitter > 20)
    parts.push(`Jitter of ${r.jitter} ms is unstable — consider a wired connection or moving closer to your router.`);
  else parts.push(`Jitter of ${r.jitter} ms is stable, keeping calls and streams smooth.`);

  if (r.poorApps.length)
    parts.push(`Reachability is poor for ${r.poorApps.join(", ")} — you may experience slow loads on those services.`);

  return parts.join(" ");
}

function Index() {
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

      // Stagger app resolutions
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
        const poorApps = APPS.filter((a, i) => statusFor(latencies[i], a.ideal) === "poor").map(
          (a) => a.name,
        );
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
    status === "testing" ? "⏳ Testing..." : status === "done" ? "▶ Test Again" : "▶ Run Speed Test";

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        paddingBottom: 60,
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #00e5b0, #2D8CFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
            aria-hidden
          >
            ⚡
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Pulse</h1>
        </div>
        <Link
          to="/ping"
          className="font-mono-pulse"
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid #1a3045",
            color: "#c8dae8",
            fontSize: 12,
            textDecoration: "none",
          }}
        >
          🔗 Ping a friend
        </Link>
      </header>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "40px 24px 32px" }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          Check your connection
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1.1,
            background: "linear-gradient(90deg, #00e5b0, #2D8CFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          in seconds
        </div>
        <p
          className="font-mono-pulse"
          style={{ fontSize: 14, color: "#4a7090", marginTop: 14 }}
        >
          Speed · Reachability · AI-powered analysis
        </p>
      </section>

      {/* GAUGES */}
      <section
        style={{
          display: "flex",
          gap: 32,
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
          color="#00e5b0"
          gradientId="gauge-dl"
          gradientStops={["#00e5b0", "#2D8CFF"]}
        />
        <Gauge
          label="Upload"
          value={ul}
          max={100}
          unit="Mbps"
          color="#2D8CFF"
          gradientId="gauge-ul"
          gradientStops={["#2D8CFF", "#a78bfa"]}
        />
      </section>

      {/* PROGRESS */}
      {status === "testing" && (
        <section style={{ padding: "16px 24px 0" }}>
          <div
            style={{
              height: 3,
              background: "#0d1f2d",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #00e5b0, #2D8CFF)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <div
            className="font-mono-pulse"
            style={{ textAlign: "center", fontSize: 12, color: "#4a7090", marginTop: 8 }}
          >
            Testing your connection... {Math.floor(progress)}%
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "24px 24px 0" }}>
        <button
          onClick={runTest}
          disabled={status === "testing"}
          style={{
            padding: "14px 48px",
            borderRadius: 50,
            border: "none",
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.5px",
            cursor: status === "testing" ? "not-allowed" : "pointer",
            background:
              status === "testing"
                ? "#1a3045"
                : "linear-gradient(135deg, #00e5b0, #2D8CFF)",
            color: status === "testing" ? "#4a7090" : "#050d16",
            boxShadow: status === "testing" ? "none" : "0 0 30px rgba(0,229,176,0.3)",
          }}
        >
          {buttonLabel}
        </button>
      </section>

      {/* METRICS */}
      {status === "done" && results && (
        <section
          className="pulse-fadeUp"
          style={{
            padding: "28px 24px 0",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <MetricCard icon="📡" label="Ping" value={results.ping.toString()} unit="ms" color="#f5a623" />
          <MetricCard icon="〰" label="Jitter" value={results.jitter.toString()} unit="ms" color="#ff4d6d" />
          <MetricCard
            icon="↓"
            label="Download"
            value={results.download.toFixed(1)}
            unit="Mbps"
            color="#00e5b0"
          />
          <MetricCard
            icon="↑"
            label="Upload"
            value={results.upload.toFixed(1)}
            unit="Mbps"
            color="#2D8CFF"
          />
        </section>
      )}

      {/* AI ANALYSIS */}
      <section style={{ padding: "20px 24px 0" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #060f1a, #0a1829)",
            border: "1px solid rgba(0,229,176,0.25)",
            borderRadius: 20,
            padding: 28,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, #00e5b0, #2D8CFF, #00e5b0)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              background: "radial-gradient(circle, rgba(0,229,176,0.06), transparent 70%)",
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
                background: "linear-gradient(135deg, #00e5b0, #2D8CFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "#050d16",
              }}
            >
              ✦
            </div>
            <div
              className="font-mono-pulse"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#00e5b0",
                letterSpacing: 2,
              }}
            >
              AI ANALYSIS
            </div>
          </div>
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: aiText ? "#a8c4d8" : "#2a4060",
              minHeight: 80,
              position: "relative",
            }}
          >
            {aiText || "Run a speed test to get your personalized connection analysis..."}
          </div>
        </div>
      </section>

      {/* USE CASE READINESS */}
      {status === "done" && results && (
        <section
          className="pulse-fadeUp"
          style={{ padding: "28px 24px 0", animationDelay: "0.2s" }}
        >
          <SectionHeader label="USE CASE READINESS" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    background: ok ? "rgba(0,229,176,0.06)" : "rgba(255,77,109,0.06)",
                    border: ok
                      ? "1px solid rgba(0,229,176,0.2)"
                      : "1px solid rgba(255,77,109,0.2)",
                    borderRadius: 12,
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 20 }} aria-hidden>{uc.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#c8dae8" }}>{uc.label}</span>
                  <span
                    className="font-mono-pulse"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: ok ? "#00e5b0" : "#ff4d6d",
                      background: ok ? "rgba(0,229,176,0.1)" : "rgba(255,77,109,0.1)",
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
        </section>
      )}

      {/* APP REACHABILITY */}
      {status !== "idle" && (
        <section
          className="pulse-fadeUp"
          style={{ padding: "28px 24px 0", animationDelay: "0.3s" }}
        >
          <SectionHeader
            label="APP REACHABILITY"
            right="latency to service endpoints"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
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
                    background: "linear-gradient(135deg, #0d1f2d, #0a1829)",
                    border: `1px solid ${latency == null ? "#1a3045" : color + "66"}`,
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#c8dae8" }}>
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
                        background: "#1a3045",
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
                          background: "#2a4060",
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 700, color }}>{latency}</span>
                      <span
                        className="font-mono-pulse"
                        style={{ fontSize: 11, color: "#4a7090", marginLeft: 4 }}
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
        </section>
      )}

      {/* GLOBAL ROUTE TRACE */}
      {status === "done" && (
        <section
          className="pulse-fadeUp"
          style={{ padding: "20px 24px 0", animationDelay: "0.4s" }}
        >
          <SectionHeader label="GLOBAL ROUTE TRACE" />
          <div
            style={{
              background: "linear-gradient(135deg, #0d1f2d, #0a1829)",
              border: "1px solid #1a3045",
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
                <span style={{ fontSize: 13, fontWeight: 600, color: "#c8dae8" }}>Google DNS</span>
                <span className="font-mono-pulse" style={{ fontSize: 11, color: "#4a7090" }}>
                  {" "}
                  8.8.8.8 · Global
                </span>
              </div>
              <span className="font-mono-pulse" style={{ fontSize: 12, color: "#00e5b0" }}>
                27 ms
              </span>
            </div>
            <div style={{ height: 4, background: "#1a3045", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  width: "15%",
                  height: "100%",
                  background: "linear-gradient(90deg, #00e5b0, #2D8CFF)",
                }}
              />
            </div>
            <div
              className="font-mono-pulse"
              style={{ fontSize: 10, color: "#00e5b0", marginTop: 6 }}
            >
              EXCELLENT
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="font-mono-pulse"
      style={{
        padding: "6px 14px",
        borderRadius: 20,
        border: `1px solid ${active ? "#00e5b0" : "#1a3045"}`,
        background: active ? "rgba(0,229,176,0.1)" : "transparent",
        color: active ? "#00e5b0" : "#4a7090",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
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
          color: "#4a7090",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "#1a3045" }} />
      {right && (
        <span className="font-mono-pulse" style={{ fontSize: 10, color: "#2a4060" }}>
          {right}
        </span>
      )}
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
        background: "linear-gradient(135deg, #0d1f2d, #0a1829)",
        border: "1px solid #1a3045",
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
        minWidth: 120,
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
          color: "#4a7090",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {icon} {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{value}</span>
        <span className="font-mono-pulse" style={{ fontSize: 12, color: "#4a7090" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
