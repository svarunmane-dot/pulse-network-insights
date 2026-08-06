import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteStats } from "@/lib/sitestats.functions";

function fmt(n: number) {
  return n.toLocaleString();
}

type Point = { day: string; hits: number; visitors: number };

function Chart({ data }: { data: Point[] }) {
  const W = 720;
  const H = 180;
  const pad = { l: 34, r: 8, t: 10, b: 22 };
  const max = Math.max(4, ...data.map((d) => Math.max(d.hits, d.visitors)));
  const x = (i: number) =>
    pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const line = (key: "hits" | "visitors") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");
  const area = `${line("hits")} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, Math.round(max / 2), max];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label="Daily page views and unique visitors over the last 30 days"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#1f2740" />
          <text x={0} y={y(t) + 4} fill="#5f6b85" fontSize="10">
            {t}
          </text>
        </g>
      ))}
      <path d={area} fill="rgba(0,212,170,0.14)" />
      <path d={line("hits")} fill="none" stroke="#00D4AA" strokeWidth="2" />
      <path d={line("visitors")} fill="none" stroke="#6aa9ff" strokeWidth="2" strokeDasharray="4 3" />
      {data.map((d, i) =>
        i % 6 === 0 || i === data.length - 1 ? (
          <text key={d.day} x={x(i)} y={H - 6} fill="#5f6b85" fontSize="10" textAnchor="middle">
            {d.day.slice(5)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function SiteUsageStats() {
  const fetchStats = useServerFn(getSiteStats);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["site-stats"],
    queryFn: () => fetchStats(),
    staleTime: 60_000,
  });

  const items = [
    { label: "Total page views", value: data ? fmt(data.totalHits) : "—" },
    { label: "Unique visitors", value: data ? fmt(data.totalVisitors) : "—" },
    { label: "Views last 7 days", value: data ? fmt(data.last7dHits) : "—" },
    { label: "Visitors today", value: data ? fmt(data.todayVisitors) : "—" },
  ];

  return (
    <section
      aria-labelledby="usage-stats-heading"
      style={{
        marginTop: 40,
        padding: 20,
        borderRadius: 14,
        border: "1px solid #1f2740",
        background: "#0f1422",
      }}
    >
      <h2
        id="usage-stats-heading"
        style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}
      >
        Pulse Speed usage
      </h2>
      <p style={{ color: "#8b95ad", fontSize: 13, marginTop: 6, marginBottom: 16 }}>
        {isError
          ? "Live usage numbers are temporarily unavailable."
          : isLoading
            ? "Loading live usage numbers…"
            : data?.since
              ? `Anonymous, aggregated counts since ${new Date(data.since).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}.`
              : "Anonymous, aggregated counts across all Pulse Speed tools."}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((i) => (
          <div
            key={i.label}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #1f2740",
              background: "#0a0e1a",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#00D4AA",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {i.value}
            </div>
            <div style={{ fontSize: 12, color: "#8b95ad", marginTop: 4 }}>{i.label}</div>
          </div>
        ))}
      </div>

      {data?.daily?.length ? (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 12,
              color: "#8b95ad",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "#00D4AA" }}>— Page views</span>
            <span style={{ color: "#6aa9ff" }}>-- Unique visitors</span>
            <span style={{ marginLeft: "auto" }}>Last 30 days</span>
          </div>
          <Chart data={data.daily} />
        </div>
      ) : null}
    </section>
  );
}