import { createFileRoute } from "@tanstack/react-router";
import ShareResult from "@/components/ShareResult";
import { useState, useCallback } from "react";
import { toolHead } from "@/lib/seo";

/* ============================================================
   DNS LOOKUP TOOL
   Forward lookup: domain -> IP (A / AAAA records)
   Reverse lookup: IP -> hostname (PTR record)
   Uses Cloudflare DNS-over-HTTPS (CORS-friendly)
   ============================================================ */

const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return String(n) === p && n >= 0 && n <= 255;
  });
}

function reverseIPv4(ip: string): string {
  return ip.trim().split(".").reverse().join(".") + ".in-addr.arpa";
}

interface DNSRecord {
  type: number;
  typeName: string;
  data: string;
  ttl: number;
}

interface DNSResult {
  domain?: string;
  ip?: string;
  records: DNSRecord[];
  error?: string;
}

const TYPE_NAMES: Record<number, string> = {
  1: "A",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

async function queryDOH(name: string, type: string): Promise<{ Answer?: Array<{ type: number; data: string; TTL: number }>; Status: number; Comment?: string }> {
  // Use Google's DoH JSON API — no custom headers required (avoids CORS preflight).
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DNS query failed: ${res.status}`);
  return res.json();
}

async function lookupDomain(domain: string): Promise<DNSResult> {
  const clean = domain.trim().replace(/^(https?:\/\/)/, "").replace(/\/.*$/, "");
  const [aRes, aaaaRes] = await Promise.all([
    queryDOH(clean, "A").catch(() => ({ Status: 2, Answer: [] })),
    queryDOH(clean, "AAAA").catch(() => ({ Status: 2, Answer: [] })),
  ]);

  const records: DNSRecord[] = [];
  (aRes.Answer || []).forEach((r) =>
    records.push({ type: r.type, typeName: TYPE_NAMES[r.type] || String(r.type), data: r.data, ttl: r.TTL }),
  );
  (aaaaRes.Answer || []).forEach((r) =>
    records.push({ type: r.type, typeName: TYPE_NAMES[r.type] || String(r.type), data: r.data, ttl: r.TTL }),
  );

  if (!records.length) {
    return { domain: clean, records: [], error: "No A or AAAA records found for this domain." };
  }

  return { domain: clean, records };
}

async function reverseLookup(ip: string): Promise<DNSResult> {
  const ptrName = reverseIPv4(ip);
  const res = await queryDOH(ptrName, "PTR");
  const answers = res.Answer || [];
  const records: DNSRecord[] = answers.map((r) => ({
    type: r.type,
    typeName: TYPE_NAMES[r.type] || String(r.type),
    data: r.data.replace(/\.$/, ""),
    ttl: r.TTL,
  }));

  if (!records.length) {
    return { ip, records: [], error: "No PTR record found for this IP address." };
  }

  return { ip, records };
}

export const Route = createFileRoute("/dns-lookup")({
  component: DnsLookupPage,
  head: () =>
    toolHead({
      path: "/dns-lookup",
      name: "DNS Lookup",
      title: "DNS Lookup — Domain to IP & Reverse DNS Resolver Tool",
      description:
        "Free DNS lookup tool. Resolve any domain to its A and AAAA records, or reverse-lookup a public IPv4 address to its hostname in seconds.",
      faqs: [
        {
          q: "What record types does the DNS lookup support?",
          a: "Forward lookups return A (IPv4) and AAAA (IPv6) records. Reverse lookups return PTR records for a public IPv4 address.",
        },
        {
          q: "Which DNS resolver is used?",
          a: "Queries run against Google Public DNS over HTTPS so results are fast, encrypted and independent of your local resolver.",
        },
      ],
    }),
});

function DnsLookupPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DNSResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = useCallback(async () => {
    const raw = input.trim();
    if (!raw) return;
    setLoading(true);
    setResult(null);
    try {
      if (isValidIPv4(raw)) {
        const res = await reverseLookup(raw);
        setResult(res);
      } else {
        const res = await lookupDomain(raw);
        setResult(res);
      }
    } catch (e) {
      setResult({ records: [], error: e instanceof Error ? e.message : "Lookup failed." });
    } finally {
      setLoading(false);
    }
  }, [input]);

  const examples = [
    { label: "google.com", type: "domain" },
    { label: "1.1.1.1", type: "ip" },
    { label: "cloudflare.com", type: "domain" },
    { label: "8.8.8.8", type: "ip" },
  ];

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
          DNS Lookup
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Enter a domain name to find its IP address (forward DNS), or enter a public IP to find its hostname
          (reverse DNS / PTR lookup).
        </p>
      </div>

      {/* Input Card */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
          Domain Name or IP Address
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          placeholder="e.g. google.com  or  8.8.8.8"
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
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
        />

        <div style={{ marginBottom: 14, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, marginRight: 4 }}>Try:</span>
          {examples.map((ex) => (
            <button
              key={ex.label}
              onClick={() => {
                setInput(ex.label);
                setResult(null);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
                background: input === ex.label ? "rgba(0,212,170,0.15)" : "transparent",
                color: input === ex.label ? TEAL : TEXT_SEC,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleLookup}
          disabled={loading || !input.trim()}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Looking up…" : "Lookup DNS"}
        </button>
      </div>

      {/* Result */}
      {result?.error && (
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
          {result.error}
        </div>
      )}

      {result && !result.error && result.records.length > 0 && (
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "24px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 4 }}>
            {result.domain ? `Domain: ${result.domain}` : result.ip ? `IP: ${result.ip}` : ""}
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            DNS Records
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {result.records.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "#0f1422",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px 16px",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    background: r.typeName === "A" || r.typeName === "AAAA" ? "rgba(0,212,170,0.15)" : "rgba(155,143,232,0.15)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  {r.typeName}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 14,
                    color: r.typeName === "A" || r.typeName === "AAAA" ? TEAL : r.typeName === "PTR" ? PURPLE : "#fff",
                    fontWeight: 600,
                    wordBreak: "break-all",
                  }}
                >
                  {r.data}
                </span>
                <span style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: "auto" }}>TTL {r.ttl}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>How it works</h2>
        <p style={{ marginBottom: 10 }}>
          <strong style={{ color: TEXT_SEC }}>Forward DNS lookup</strong> converts a human-readable domain name (like{" "}
          <code style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>google.com</code>) into an IP address that
          computers use to connect. When you enter a domain, the tool queries A (IPv4) and AAAA (IPv6) records.
        </p>
        <p>
          <strong style={{ color: TEXT_SEC }}>Reverse DNS lookup</strong> does the opposite — it takes a public IP
          address and finds the associated hostname via PTR records. This is useful for verifying server identity,
          troubleshooting email delivery, and network diagnostics.
        </p>
      </div>
    </div>
  );
}
