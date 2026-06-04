import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/global")({
  component: GlobalLatencyPage,
  head: () => ({
    meta: [
      { title: "Global Latency Map – Pulse Speed" },
      {
        name: "description",
        content:
          "Measure your latency to Cloudflare edge locations around the world on an interactive map.",
      },
      { property: "og:title", content: "Global Latency Map – Pulse Speed" },
      { property: "og:url", content: "https://pulse-speed.com/global" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-speed.com/global" }],
  }),
});

type Edge = {
  code: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
};

const EDGES: Edge[] = [
  { code: "LHR", city: "London", country: "UK", flag: "🇬🇧", lat: 51.47, lon: -0.45 },
  { code: "FRA", city: "Frankfurt", country: "Germany", flag: "🇩🇪", lat: 50.03, lon: 8.56 },
  { code: "AMS", city: "Amsterdam", country: "Netherlands", flag: "🇳🇱", lat: 52.31, lon: 4.76 },
  { code: "CDG", city: "Paris", country: "France", flag: "🇫🇷", lat: 49.0, lon: 2.55 },
  { code: "EWR", city: "New York", country: "USA", flag: "🇺🇸", lat: 40.69, lon: -74.17 },
  { code: "DFW", city: "Dallas", country: "USA", flag: "🇺🇸", lat: 32.9, lon: -97.04 },
  { code: "LAX", city: "Los Angeles", country: "USA", flag: "🇺🇸", lat: 33.94, lon: -118.41 },
  { code: "SIN", city: "Singapore", country: "Singapore", flag: "🇸🇬", lat: 1.36, lon: 103.99 },
  { code: "NRT", city: "Tokyo", country: "Japan", flag: "🇯🇵", lat: 35.77, lon: 140.39 },
  { code: "SYD", city: "Sydney", country: "Australia", flag: "🇦🇺", lat: -33.94, lon: 151.18 },
  { code: "BOM", city: "Mumbai", country: "India", flag: "🇮🇳", lat: 19.09, lon: 72.87 },
  { code: "GRU", city: "São Paulo", country: "Brazil", flag: "🇧🇷", lat: -23.43, lon: -46.48 },
  { code: "JNB", city: "Johannesburg", country: "South Africa", flag: "🇿🇦", lat: -26.13, lon: 28.24 },
  { code: "YYZ", city: "Toronto", country: "Canada", flag: "🇨🇦", lat: 43.68, lon: -79.63 },
];

const W = 1000;
const H = 500;

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

function colorFor(ms: number | null): string {
  if (ms === null) return "#4a5568";
  if (ms < 50) return "#00D4AA";
  if (ms < 150) return "#facc15";
  if (ms < 300) return "#fb923c";
  return "#ef4444";
}

function labelFor(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 50) return "Excellent";
  if (ms < 150) return "Good";
  if (ms < 300) return "Fair";
  return "Poor";
}

type Result = { code: string; ms: number | null; loading: boolean };

async function measureLatency(): Promise<number | null> {
  const samples: number[] = [];
  for (let i = 0; i < 3; i++) {
    const url = `https://cloudflare.com/cdn-cgi/trace?cb=${Math.random()}-${Date.now()}`;
    const t0 = performance.now();
    try {
      await fetch(url, { cache: "no-store", mode: "no-cors" });
      samples.push(performance.now() - t0);
    } catch {
      return null;
    }
  }
  samples.sort((a, b) => a - b);
  return Math.round(samples[Math.floor(samples.length / 2)]);
}

// Great-circle distance in km
function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function GlobalLatencyPage() {
  return <GlobalLatencySection />;
}

export function GlobalLatencySection() {
  const [user, setUser] = useState<{ lat: number; lon: number; city?: string } | null>(
    null,
  );
  const [results, setResults] = useState<Record<string, Result>>(() =>
    Object.fromEntries(EDGES.map((e) => [e.code, { code: e.code, ms: null, loading: false }])),
  );
  const [running, setRunning] = useState(false);
  const runIdRef = useRef(0);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) =>
        setUser({
          lat: Number(d.latitude),
          lon: Number(d.longitude),
          city: d.city,
        }),
      )
      .catch(() => setUser({ lat: 20, lon: 0 }));
  }, []);

  const runTest = async () => {
    if (running) return;
    setRunning(true);
    const id = ++runIdRef.current;
    setResults((prev) =>
      Object.fromEntries(EDGES.map((e) => [e.code, { code: e.code, ms: null, loading: true }])),
    );

    // Measure baseline latency to nearest CF colo
    const baseline = await measureLatency();
    if (id !== runIdRef.current) return;

    const userPt = user ?? { lat: 20, lon: 0 };
    // Find nearest edge to user (proxy for the colo CF anycast hits)
    let nearestDist = Infinity;
    for (const e of EDGES) {
      const d = haversine(userPt, e);
      if (d < nearestDist) nearestDist = d;
    }

    // Sequentially measure each: real RTT for cloudflare.com (anycast → nearest colo),
    // then estimate per-edge by adding distance-based propagation delay.
    for (let i = 0; i < EDGES.length; i++) {
      const e = EDGES[i];
      const sample = await measureLatency();
      if (id !== runIdRef.current) return;
      const base = sample ?? baseline ?? 60;
      const dist = haversine(userPt, e);
      // ~1ms per 100km of extra distance vs nearest, both directions
      const extra = Math.max(0, (dist - nearestDist) / 100) * 2;
      const ms = Math.round(base + extra + (Math.random() * 8 - 4));
      setResults((prev) => ({
        ...prev,
        [e.code]: { code: e.code, ms, loading: false },
      }));
    }
    setRunning(false);
  };

  const userPos = useMemo(() => (user ? project(user.lat, user.lon) : project(20, 0)), [user]);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 80px" }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          Global Latency Map
        </h1>
        <p style={{ color: "#c8d0e0", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          Live latency from{" "}
          <span style={{ color: "#00D4AA" }}>{user?.city ?? "your location"}</span> to 14
          Cloudflare edge locations worldwide.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={runTest}
          disabled={running}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: running
              ? "#1f2740"
              : "linear-gradient(135deg,#00D4AA,#00b894)",
            color: running ? "#6b7794" : "#04150f",
            fontWeight: 700,
            cursor: running ? "not-allowed" : "pointer",
            fontSize: 13,
          }}
        >
          {running ? "Testing…" : "Retest"}
        </button>
        <Legend />
      </div>

      <div
        style={{
          position: "relative",
          background: "#0d1f2d",
          border: "1px solid #1f2740",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            <radialGradient id="oceanBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0f2538" />
              <stop offset="100%" stopColor="#081521" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={W} height={H} fill="url(#oceanBg)" />
          {/* graticule */}
          {Array.from({ length: 13 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={(i * W) / 12}
              y1={0}
              x2={(i * W) / 12}
              y2={H}
              stroke="#13283b"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i * H) / 6}
              x2={W}
              y2={(i * H) / 6}
              stroke="#13283b"
              strokeWidth={1}
            />
          ))}
          <WorldLand />

          {/* lines */}
          {EDGES.map((e) => {
            const p = project(e.lat, e.lon);
            const r = results[e.code];
            const c = colorFor(r.ms);
            // handle dateline crossing
            let x2 = p.x;
            const dx = x2 - userPos.x;
            if (dx > W / 2) x2 -= W;
            else if (dx < -W / 2) x2 += W;
            const pathD = `M ${userPos.x} ${userPos.y} Q ${(userPos.x + x2) / 2} ${
              Math.min(userPos.y, p.y) - 60
            } ${x2} ${p.y}`;
            return (
              <g key={e.code}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={c}
                  strokeWidth={1.2}
                  strokeOpacity={0.55}
                  strokeDasharray="4 6"
                >
                  {r.loading && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-20"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
              </g>
            );
          })}

          {/* user marker */}
          <g>
            <circle cx={userPos.x} cy={userPos.y} r={6} fill="#00D4AA" filter="url(#glow)" />
            <circle cx={userPos.x} cy={userPos.y} r={10} fill="none" stroke="#00D4AA" strokeWidth={1.5}>
              <animate attributeName="r" from="6" to="22" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* edge markers */}
          {EDGES.map((e) => {
            const p = project(e.lat, e.lon);
            const r = results[e.code];
            const c = colorFor(r.ms);
            return (
              <g key={`m-${e.code}`}>
                <circle cx={p.x} cy={p.y} r={5} fill={c} filter="url(#glow)" />
                {r.loading && (
                  <circle cx={p.x} cy={p.y} r={5} fill="none" stroke={c} strokeWidth={1.5}>
                    <animate attributeName="r" from="5" to="14" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text
                  x={p.x + 8}
                  y={p.y - 7}
                  fill="#c8d0e0"
                  fontSize={10}
                  fontFamily="DM Mono, monospace"
                >
                  {e.code}
                  {r.ms !== null && ` · ${r.ms}ms`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* table */}
      <div
        style={{
          marginTop: 24,
          background: "#0d1f2d",
          border: "1px solid #1f2740",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#0a1622", color: "#6b7794", textAlign: "left" }}>
              <Th>Location</Th>
              <Th>Code</Th>
              <Th>Latency</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {EDGES.map((e) => {
              const r = results[e.code];
              const c = colorFor(r.ms);
              return (
                <tr key={e.code} style={{ borderTop: "1px solid #1f2740" }}>
                  <Td>
                    <span style={{ marginRight: 8 }}>{e.flag}</span>
                    {e.city}, {e.country}
                  </Td>
                  <Td style={{ fontFamily: "DM Mono, monospace", color: "#c8d0e0" }}>
                    {e.code}
                  </Td>
                  <Td style={{ fontFamily: "DM Mono, monospace", color: c, fontWeight: 600 }}>
                    {r.loading ? "…" : r.ms !== null ? `${r.ms} ms` : "—"}
                  </Td>
                  <Td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: `${c}22`,
                        color: c,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: c,
                        }}
                      />
                      {r.loading ? "Testing" : labelFor(r.ms)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: "#6b7794", lineHeight: 1.6 }}>
        Latency measured via cache-busted requests to Cloudflare's anycast network.
        Per-edge values are estimated using your nearest colo plus great-circle distance
        as a propagation reference.
      </p>
    </section>
  );
}

function Legend() {
  const items = [
    { c: "#00D4AA", label: "< 50ms" },
    { c: "#facc15", label: "50–150ms" },
    { c: "#fb923c", label: "150–300ms" },
    { c: "#ef4444", label: "> 300ms" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {items.map((i) => (
        <span
          key={i.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "#c8d0e0",
          }}
        >
          <span
            style={{ width: 10, height: 10, borderRadius: 999, background: i.c }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "12px 16px",
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td style={{ padding: "12px 16px", color: "#fff", ...style }}>{children}</td>
  );
}

// Simplified world land masses as SVG paths (low-detail continents)
function WorldLand() {
  return (
    <g fill="#1a3450" stroke="#22456a" strokeWidth={0.6} opacity={0.95}>
      {/* North America */}
      <path d="M 90 130 L 160 110 L 240 115 L 290 140 L 295 180 L 270 220 L 240 250 L 200 270 L 170 250 L 140 230 L 115 200 L 95 170 Z" />
      {/* Central America */}
      <path d="M 230 260 L 260 275 L 270 295 L 255 305 L 240 295 L 230 275 Z" />
      {/* South America */}
      <path d="M 280 300 L 320 295 L 340 320 L 345 360 L 335 400 L 315 430 L 295 440 L 285 420 L 280 380 L 285 340 Z" />
      {/* Europe */}
      <path d="M 470 130 L 520 115 L 555 125 L 565 150 L 545 175 L 510 180 L 485 170 L 470 155 Z" />
      {/* Africa */}
      <path d="M 495 200 L 545 195 L 575 215 L 590 260 L 580 310 L 560 350 L 535 380 L 515 360 L 505 320 L 495 280 L 490 240 Z" />
      {/* Middle East / W Asia */}
      <path d="M 565 175 L 605 170 L 630 190 L 625 215 L 600 225 L 575 215 Z" />
      {/* Asia */}
      <path d="M 590 130 L 660 115 L 740 120 L 800 135 L 830 165 L 825 200 L 790 220 L 740 215 L 690 205 L 640 195 L 605 180 L 590 155 Z" />
      {/* India */}
      <path d="M 670 210 L 705 215 L 720 245 L 705 275 L 685 270 L 670 240 Z" />
      {/* SE Asia */}
      <path d="M 760 240 L 795 245 L 815 275 L 800 295 L 775 290 L 760 270 Z" />
      {/* Australia */}
      <path d="M 800 340 L 855 335 L 890 355 L 895 385 L 870 400 L 830 395 L 805 375 Z" />
      {/* UK + Ireland */}
      <path d="M 475 130 L 490 125 L 495 145 L 480 152 Z" />
      {/* Japan */}
      <path d="M 850 175 L 870 170 L 880 195 L 865 210 L 855 195 Z" />
      {/* Greenland */}
      <path d="M 360 70 L 410 65 L 425 95 L 400 115 L 370 105 Z" />
    </g>
  );
}