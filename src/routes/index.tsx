import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

/* ============================================================
   SPEED TEST ENGINE (user-supplied logic, unchanged)
   ============================================================ */

// High-bandwidth, CORS-friendly asset for download testing
const DOWNLOAD_URL = "https://wikimedia.org";

// 1. Latency (Ping) Test
const runPingTest = async (): Promise<number> => {
  const startTime = performance.now();
  await fetch(`${DOWNLOAD_URL}?nocache=${Math.random()}`, { method: "HEAD" });
  return performance.now() - startTime;
};

// 2. Download Speed Test
const runDownloadTest = async (): Promise<number> => {
  const startTime = performance.now();
  const response = await fetch(`${DOWNLOAD_URL}?nocache=${Math.random()}`);
  const blob = await response.blob();
  const endTime = performance.now();

  const durationInSeconds = (endTime - startTime) / 1000;
  const fileSizeInBits = blob.size * 8;
  const speedMbps = fileSizeInBits / durationInSeconds / (1024 * 1024);
  return parseFloat(speedMbps.toFixed(2));
};

// 3. Upload Speed Test (Cloudflare-native, bypasses CORS/WAF)
const runUploadTest = async (): Promise<number> => {
  const dummyData = new Uint8Array(1024 * 1024); // 1 MB payload
  const startTime = performance.now();

  await fetch("/cdn-cgi/ping", {
    method: "POST",
    body: dummyData,
  });

  const endTime = performance.now();
  const durationInSeconds = (endTime - startTime) / 1000;
  const fileSizeInBits = dummyData.length * 8;
  const speedMbps = fileSizeInBits / durationInSeconds / (1024 * 1024);
  return parseFloat(speedMbps.toFixed(2));
};

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
          "Test your internet speed, ping and latency instantly with Pulse Speed. Fast, accurate and lightweight internet performance testing.",
      },
      {
        name: "keywords",
        content:
          "internet speed test, ping test, latency checker, broadband speed, wifi speed, upload speed, download speed, Mbps test, network test",
      },
      { property: "og:title", content: "Pulse Speed – Internet Speed Test & Ping Checker" },
      {
        property: "og:description",
        content:
          "Measure download speed, upload speed, ping and latency instantly. Free, accurate and lightweight.",
      },
      { property: "og:url", content: "https://pulse-speed.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Pulse Speed – Internet Speed Test & Ping Checker" },
      {
        name: "twitter:description",
        content: "Measure download speed, upload speed, ping and latency instantly.",
      },
    ],
    links: [{ rel: "canonical", href: "https://pulse-speed.com/" }],
  }),
});

/* ============================================================
   DESIGN TOKENS (match Pulse Speed brand)
   ============================================================ */
const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const AMBER = "#f5a623";
const SURFACE = "#131829";
const SURFACE2 = "#0f1422";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

type Status = "idle" | "pinging" | "downloading" | "uploading" | "complete";

const SEO_SECTIONS = [
  {
    h: "What Is Internet Speed?",
    body: "Internet speed measures how quickly data moves between your device and the internet. Download speed determines how fast you can pull data (streaming, browsing, downloads), while upload speed governs how fast you can send data (video calls, cloud sync, gaming). Both are measured in megabits per second (Mbps).",
  },
  {
    h: "What Is Ping and Latency?",
    body: "Ping is the round-trip time for a small packet to reach a server and return, expressed in milliseconds (ms). Latency is the underlying delay that ping measures. Gamers care about low ping because every millisecond delays their actions in competitive play.",
  },
  {
    h: "What Affects Internet Speed?",
    body: "Several factors influence real-world speed: WiFi interference, ISP congestion during peak hours, VPN routing through distant servers, the quality and age of your router, and the physical distance between you and the test server.",
  },
  {
    h: "How to Improve Internet Speed",
    body: "Use Ethernet for stationary devices, upgrade to Wi-Fi 6 or mesh on larger homes, place your router centrally and elevated, separate 2.4 GHz and 5 GHz SSIDs, restart equipment monthly, and run firmware updates.",
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
    q: "Why is WiFi slower than Ethernet?",
    a: "Wi-Fi shares airtime, suffers interference, and weakens with distance. Ethernet provides a dedicated, full-duplex link with consistent latency.",
  },
  {
    q: "How accurate is Pulse Speed?",
    a: "Pulse Speed measures real network performance from your browser using lightweight probes. Results closely match ISP-grade tools for everyday diagnostics.",
  },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
function Index() {
  const [status, setStatus] = useState<Status>("idle");
  const [ping, setPing] = useState<number | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);

  const startSpeedTest = async () => {
    try {
      setPing(null);
      setDownload(null);
      setUpload(null);

      setStatus("pinging");
      const pingResult = await runPingTest();
      setPing(Math.round(pingResult));

      setStatus("downloading");
      const downloadResult = await runDownloadTest();
      setDownload(downloadResult);

      setStatus("uploading");
      const uploadResult = await runUploadTest();
      setUpload(uploadResult);

      setStatus("complete");
    } catch (error) {
      console.error("Speed test execution error:", error);
      setStatus("idle");
      alert(
        "The speed test timed out or was interrupted. Please check your internet connection and try again.",
      );
    }
  };

  const isRunning =
    status === "pinging" || status === "downloading" || status === "uploading";

  const statusMessage =
    status === "pinging"
      ? "Analysing connection latency…"
      : status === "downloading"
        ? "Calculating download throughput…"
        : status === "uploading"
          ? "Calculating upload throughput…"
          : status === "complete"
            ? "Test completed successfully"
            : "System ready";

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 20px 60px",
      }}
    >
      {/* Hero */}
      <section style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-1.2px",
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
            fontSize: 15,
            color: TEXT_SEC,
            marginTop: 14,
            lineHeight: 1.6,
            padding: "0 8px",
          }}
        >
          Measure your download speed, upload speed and ping instantly — fast,
          accurate and lightweight.
        </p>
      </section>

      {/* Speed test card */}
      <section
        aria-label="Network speed test"
        style={{
          marginTop: 36,
          background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
          border: `1px solid ${BORDER}`,
          borderRadius: 24,
          padding: "clamp(20px, 4vw, 36px)",
          maxWidth: 760,
          marginInline: "auto",
          boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px ${BORDER} inset`,
        }}
      >
        {/* Metric grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          <MetricCard
            label="Ping"
            value={ping !== null ? `${ping}` : "--"}
            unit="ms"
            color={PURPLE}
            active={status === "pinging"}
          />
          <MetricCard
            label="Download"
            value={download !== null ? `${download}` : "--"}
            unit="Mbps"
            color={TEAL}
            active={status === "downloading"}
          />
          <MetricCard
            label="Upload"
            value={upload !== null ? `${upload}` : "--"}
            unit="Mbps"
            color={AMBER}
            active={status === "uploading"}
          />
        </div>

        {/* Status message */}
        <div
          className="font-mono-pulse"
          aria-live="polite"
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 12,
            color: TEXT_MUTED,
            letterSpacing: 2,
            textTransform: "uppercase",
            minHeight: 18,
          }}
        >
          {statusMessage}
        </div>

        {/* Progress shimmer */}
        <div
          aria-hidden
          style={{
            marginTop: 12,
            height: 3,
            borderRadius: 2,
            overflow: "hidden",
            background: SURFACE2,
            position: "relative",
          }}
        >
          {isRunning && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${TEAL}, ${PURPLE}, transparent)`,
                width: "40%",
                animation: "pulse-shimmer 1.2s infinite",
              }}
            />
          )}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <button
            onClick={startSpeedTest}
            disabled={isRunning}
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "14px 32px",
              borderRadius: 50,
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.3px",
              cursor: isRunning ? "not-allowed" : "pointer",
              background: isRunning
                ? BORDER
                : `linear-gradient(135deg, ${TEAL}, #00b894)`,
              color: isRunning ? TEXT_MUTED : "#04150f",
              boxShadow: isRunning
                ? "none"
                : `0 0 40px ${TEAL}55, 0 8px 24px ${TEAL}33`,
              transition: "all 0.2s",
            }}
          >
            {isRunning
              ? "⏳ Testing Network…"
              : status === "complete"
                ? "▶ Run Test Again"
                : "▶ Run Speed Test"}
          </button>
        </div>
      </section>

      {/* SEO content */}
      <section
        aria-labelledby="learn-heading"
        style={{ padding: "60px 4px 0", maxWidth: 900, margin: "0 auto" }}
      >
        <h2
          id="learn-heading"
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px",
            color: "#fff",
          }}
        >
          Understand your connection
        </h2>
        <p style={{ color: TEXT_MUTED, marginTop: 8, fontSize: 14 }}>
          A quick primer on the numbers behind your speed test.
        </p>
        <div style={{ display: "grid", gap: 14, marginTop: 22 }}>
          {SEO_SECTIONS.map((s) => (
            <article
              key={s.h}
              style={{
                background: `linear-gradient(135deg, ${SURFACE}, ${SURFACE2})`,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "20px 22px",
              }}
            >
              <h3 style={{ fontSize: 17, margin: 0, color: "#fff", fontWeight: 700 }}>
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
        style={{ padding: "60px 4px 0", maxWidth: 900, margin: "0 auto" }}
      >
        <h2
          id="faq-heading"
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px",
            color: "#fff",
          }}
        >
          Frequently asked questions
        </h2>
        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "14px 18px",
              }}
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
    </div>
  );
}

/* ============================================================
   METRIC CARD
   ============================================================ */
function MetricCard({
  label,
  value,
  unit,
  color,
  active,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: SURFACE2,
        border: `1px solid ${active ? color : BORDER}`,
        borderRadius: 16,
        padding: "18px 16px",
        textAlign: "center",
        transition: "border-color 0.3s",
        boxShadow: active ? `0 0 24px ${color}55` : "none",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: active ? 1 : 0.5,
        }}
      />
      <div
        className="font-mono-pulse"
        style={{
          fontSize: 10,
          color: TEXT_MUTED,
          letterSpacing: 2.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        className="font-num-pulse"
        style={{
          marginTop: 8,
          fontSize: "clamp(26px, 5vw, 34px)",
          fontWeight: 700,
          color: value === "--" ? TEXT_MUTED : color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        className="font-mono-pulse"
        style={{ marginTop: 4, fontSize: 11, color: TEXT_MUTED }}
      >
        {unit}
      </div>
    </div>
  );
}
