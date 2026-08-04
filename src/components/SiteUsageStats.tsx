import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteStats } from "@/lib/sitestats.functions";

function fmt(n: number) {
  return n.toLocaleString();
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
    </section>
  );
}