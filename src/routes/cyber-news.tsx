import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCyberNews, type NewsItem } from "@/lib/cybernews.functions";
import { toolHead } from "@/lib/seo";

export const Route = createFileRoute("/cyber-news")({
  head: () =>
    toolHead({
      path: "/cyber-news",
      title: "Cyber Security News – Threats, CVEs & Breaches | Pulse Speed",
      description:
        "Latest cybersecurity news aggregated from SANS ISC, Krebs on Security, BleepingComputer and SecurityWeek. Threats, vulnerabilities, breaches, updates.",
      name: "Cyber Security News",
      category: "SecurityApplication",
    }),
  component: CyberNewsPage,
});

const SOURCE_COLORS: Record<string, string> = {
  "SANS ISC": "#06B6D4",
  "Krebs on Security": "#F97316",
  BleepingComputer: "#9B8FE8",
  SecurityWeek: "#00D4AA",
};

const REFRESH_MS = 4 * 60 * 60 * 1000; // 4h

function relTime(iso: string): string {
  if (!iso) return "Unknown";
  const t = Date.parse(iso);
  if (isNaN(t)) return "Unknown";
  const diff = Date.now() - t;
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
  return new Date(t).toLocaleDateString();
}

function isCritical(item: NewsItem): boolean {
  const s = `${item.title} ${item.description}`.toLowerCase();
  return /\b(critical|zero[- ]day|0-day|actively exploited|exploited in the wild|emergency|urgent)\b/.test(
    s,
  );
}
function isHigh(item: NewsItem): boolean {
  const s = `${item.title} ${item.description}`.toLowerCase();
  return /\b(vulnerability|cve-|breach|ransomware|malware|patch|advisory)\b/.test(s);
}

function CyberNewsPage() {
  const fetchNews = useServerFn(fetchCyberNews);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [pending, setPending] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [visible, setVisible] = useState(10);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const seenLinks = useRef<Set<string>>(new Set());

  const load = useCallback(
    async (background = false) => {
      if (!background) setLoading(true);
      setError(null);
      try {
        const res = await fetchNews();
        setSources(res.sources);
        setFetchedAt(res.fetchedAt);
        if (background && seenLinks.current.size > 0) {
          const newOnes = res.items.filter((i) => !seenLinks.current.has(i.link));
          if (newOnes.length > 0) {
            setPending(newOnes);
          }
        } else {
          setItems(res.items);
          seenLinks.current = new Set(res.items.map((i) => i.link));
        }
      } catch (e) {
        setError("Unable to fetch news. Try again later.");
      } finally {
        if (!background) setLoading(false);
      }
    },
    [fetchNews],
  );

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPending = () => {
    if (pending.length === 0) return;
    const merged = [...pending, ...items];
    setItems(merged);
    seenLinks.current = new Set(merged.map((i) => i.link));
    setPending([]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (sourceFilter !== "all" && i.source !== sourceFilter) return false;
      if (q && !`${i.title} ${i.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, sourceFilter, query]);

  const top = filtered[0];
  const topBannerColor = top
    ? isCritical(top)
      ? "#dc2626"
      : isHigh(top)
        ? "#F97316"
        : null
    : null;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.5px",
            }}
          >
            📰 Cyber Security News
          </h1>
          <p style={{ margin: "8px 0 0", color: "#c8d0e0", fontSize: 15 }}>
            Latest cybersecurity threats, vulnerabilities, and updates.
          </p>
          {fetchedAt && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7794" }}>
              Last updated: {relTime(fetchedAt)} · Sources: {sources.join(", ")}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => load(false)}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #06B6D4",
            background: loading ? "#0f1422" : "linear-gradient(135deg,#06B6D4,#00D4AA)",
            color: loading ? "#6b7794" : "#04150f",
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Refreshing…" : "Refresh Now"}
        </button>
      </div>

      {/* Top story banner */}
      {top && topBannerColor && (
        <a
          href={top.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginBottom: 20,
            padding: "14px 18px",
            borderRadius: 12,
            background: topBannerColor,
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.5px",
              marginRight: 10,
              textTransform: "uppercase",
            }}
          >
            {isCritical(top) ? "Critical" : "High Priority"}
          </span>
          {top.title}
        </a>
      )}

      {/* New articles notification */}
      {pending.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #06B6D4",
            background: "rgba(6,182,212,0.1)",
            color: "#c8d0e0",
            fontSize: 13,
          }}
        >
          <span>{pending.length} new article{pending.length > 1 ? "s" : ""} available</span>
          <button
            type="button"
            onClick={applyPending}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: "#06B6D4",
              color: "#04150f",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Load New Articles
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search news…"
          aria-label="Search news"
          style={{
            flex: "1 1 240px",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #1f2740",
            background: "#0f1422",
            color: "#fff",
            fontSize: 13,
          }}
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by source"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #1f2740",
            background: "#0f1422",
            color: "#fff",
            fontSize: 13,
          }}
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 12,
            border: "1px solid #dc2626",
            background: "rgba(220,38,38,0.1)",
            color: "#fecaca",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && items.length === 0 ? (
        <>
          <div style={{ color: "#6b7794", fontSize: 13, marginBottom: 12 }}>
            Fetching latest cybersecurity news…
          </div>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 180,
                  borderRadius: 12,
                  background:
                    "linear-gradient(90deg,#0f1422 0%,#1a2137 50%,#0f1422 100%)",
                  backgroundSize: "200% 100%",
                  animation: "pulse-skel 1.6s ease-in-out infinite",
                  border: "1px solid #1f2740",
                  borderLeft: "3px solid #F97316",
                }}
              />
            ))}
          </div>
          <style>{`@keyframes pulse-skel {0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            }}
          >
            {filtered.slice(0, visible).map((item) => (
              <NewsCard key={item.link} item={item} />
            ))}
          </div>

          {filtered.length === 0 && !loading && !error && (
            <div style={{ color: "#6b7794", fontSize: 14, padding: "24px 0" }}>
              No news matches your filters.
            </div>
          )}

          {visible < filtered.length && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setVisible((v) => v + 5)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid #1f2740",
                  background: "#0f1422",
                  color: "#c8d0e0",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Load More ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const [hover, setHover] = useState(false);
  const color = SOURCE_COLORS[item.source] ?? "#F97316";
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "16px 18px",
        borderRadius: 12,
        border: "1px solid #1f2740",
        borderLeft: `3px solid #F97316`,
        background: "#0f1422",
        color: "#c8d0e0",
        textDecoration: "none",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 12px 30px rgba(0,0,0,0.35)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "3px 8px",
            borderRadius: 6,
            background: `${color}22`,
            color,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.3px",
          }}
        >
          {item.source}
        </span>
        <span style={{ fontSize: 11, color: "#6b7794" }}>{relTime(item.pubDate)}</span>
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.35,
        }}
      >
        {item.title}
      </h2>
      {item.description && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#c8d0e0",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.description}
        </p>
      )}
      {item.categories.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {item.categories.slice(0, 3).map((c) => (
            <span
              key={c}
              style={{
                padding: "2px 6px",
                borderRadius: 5,
                background: "#1a2137",
                color: "#8fa0c0",
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}