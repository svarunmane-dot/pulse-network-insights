import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import { whoisIp } from "@/lib/nettools.functions";
import { toolHead } from "@/lib/seo";

const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

type WhoisResult = Awaited<ReturnType<typeof whoisIp>>;

export const Route = createFileRoute("/whose-ip")({
  component: WhoisIpPage,
  head: () =>
    toolHead({
      path: "/whose-ip",
      name: "Whose IP",
      title: "Whose IP — Free IP Geolocation, ISP & ASN Lookup Tool",
      description:
        "Free IP lookup tool. Find the country, city, ISP, organisation, ASN, reverse DNS and hosting flags behind any public IPv4 address instantly.",
      faqs: [
        {
          q: "What does the Whose IP tool return?",
          a: "Country, region, city, coordinates, timezone, ISP, organisation, ASN, reverse DNS, plus flags for mobile, proxy/VPN and hosting/datacentre networks.",
        },
        {
          q: "How accurate is IP geolocation?",
          a: "Country and ISP accuracy is high. City-level results are approximate because IP-to-location mapping is based on operator-reported ranges.",
        },
      ],
    }),
});

function WhoisIpPage() {
  const lookup = useServerFn(whoisIp);
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhoisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await lookup({ data: { ip: ip.trim() } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, [lookup, ip]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
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
          Whose IP?
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Enter any public IPv4 address to find its country, city, ISP, organisation, ASN and more.
        </p>
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
          Public IPv4 Address
        </label>
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="8.8.8.8"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            background: "#0f1422",
            color: "#fff",
            fontSize: 15,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            marginBottom: 14,
          }}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button
          onClick={run}
          disabled={loading || !ip.trim()}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading || !ip.trim() ? "not-allowed" : "pointer",
            opacity: loading || !ip.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Looking up…" : "Lookup IP"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,77,109,0.08)",
            border: "1px solid rgba(255,77,109,0.25)",
            borderRadius: 12,
            padding: "16px 20px",
            color: "#ff4d6d",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 4 }}>IP</div>
          <div style={{ fontFamily: "'DM Mono', monospace", color: TEAL, fontSize: 22, fontWeight: 700, marginBottom: 18 }}>
            {result.query}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
            <Field label="Country" value={`${result.country || "—"}${result.countryCode ? ` (${result.countryCode})` : ""}`} />
            <Field label="Region" value={result.regionName || "—"} />
            <Field label="City" value={result.city || "—"} />
            <Field label="Postal" value={result.zip || "—"} />
            <Field label="Timezone" value={result.timezone || "—"} />
            <Field
              label="Coordinates"
              value={result.lat != null && result.lon != null ? `${result.lat}, ${result.lon}` : "—"}
            />
            <Field label="ISP" value={result.isp || "—"} highlight />
            <Field label="Organisation" value={result.org || "—"} />
            <Field label="ASN" value={result.as || "—"} />
            <Field label="Reverse DNS" value={result.reverse || "—"} />
            <Field
              label="Flags"
              value={
                [
                  result.mobile && "Mobile",
                  result.proxy && "Proxy/VPN",
                  result.hosting && "Hosting/Datacenter",
                ]
                  .filter(Boolean)
                  .join(", ") || "None"
              }
            />
          </div>
        </div>
      )}

      <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7, marginTop: 24 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>About IP geolocation</h2>
        <p>
          IP geolocation maps a public IP address to the country, region, city and ISP that announces it. Accuracy is
          high at the country and ISP level but city-level data is approximate. The ASN (Autonomous System Number)
          identifies the network operator that owns the IP block.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: "#0f1422", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: highlight ? PURPLE : TEXT_SEC,
          fontWeight: highlight ? 700 : 500,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}