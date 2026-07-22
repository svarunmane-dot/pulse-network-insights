import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toolHead } from "@/lib/seo";
import { hashLookup } from "@/lib/hashlookup.functions";

/* ============================================================
   BLACKLIST CHECK
   Queries multiple public DNSBL zones for an IPv4 or domain via
   Google DNS-over-HTTPS. Returns per-list status + response code.
   ============================================================ */

const TEAL = "#00D4AA";
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

function isValidDomain(s: string): boolean {
  const v = s.trim();
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) && v.length <= 253;
}

function reverseIPv4(ip: string): string {
  return ip.trim().split(".").reverse().join(".");
}

interface DNSBL {
  zone: string;
  name: string;
  description: string;
  supports: "ip" | "domain" | "both";
}

const LISTS: DNSBL[] = [
  // Spamhaus family
  { zone: "zen.spamhaus.org", name: "Spamhaus ZEN", description: "Combined SBL, XBL, and PBL — spam sources, exploits, and dynamic IPs.", supports: "ip" },
  { zone: "sbl.spamhaus.org", name: "Spamhaus SBL", description: "Verified spam sources including spam gangs.", supports: "ip" },
  { zone: "xbl.spamhaus.org", name: "Spamhaus XBL", description: "Exploited hosts — open proxies, worms, trojans.", supports: "ip" },
  { zone: "pbl.spamhaus.org", name: "Spamhaus PBL", description: "Dynamic / end-user IPs that shouldn't send mail directly.", supports: "ip" },
  { zone: "dbl.spamhaus.org", name: "Spamhaus DBL", description: "Domains observed in spam, phishing, or malware campaigns.", supports: "domain" },
  // Major IP DNSBLs
  { zone: "b.barracudacentral.org", name: "Barracuda BRBL", description: "Barracuda Reputation Block List — spam senders.", supports: "ip" },
  { zone: "bl.spamcop.net", name: "SpamCop SCBL", description: "IPs reported by SpamCop users for sending unsolicited email.", supports: "ip" },
  { zone: "dnsbl.sorbs.net", name: "SORBS DNSBL", description: "Aggregated abuse list — spam, proxies, dynamic ranges.", supports: "ip" },
  { zone: "spam.dnsbl.sorbs.net", name: "SORBS Spam", description: "SORBS confirmed spam sources.", supports: "ip" },
  { zone: "http.dnsbl.sorbs.net", name: "SORBS HTTP", description: "SORBS open HTTP proxies.", supports: "ip" },
  { zone: "socks.dnsbl.sorbs.net", name: "SORBS SOCKS", description: "SORBS open SOCKS proxies.", supports: "ip" },
  { zone: "misc.dnsbl.sorbs.net", name: "SORBS Misc", description: "SORBS miscellaneous open proxies.", supports: "ip" },
  { zone: "smtp.dnsbl.sorbs.net", name: "SORBS SMTP", description: "SORBS open SMTP relays.", supports: "ip" },
  { zone: "web.dnsbl.sorbs.net", name: "SORBS Web", description: "IPs with vulnerable web-app exploits.", supports: "ip" },
  { zone: "zombie.dnsbl.sorbs.net", name: "SORBS Zombie", description: "Hijacked networks / zombies.", supports: "ip" },
  { zone: "dul.dnsbl.sorbs.net", name: "SORBS DUL", description: "Dynamic IP ranges.", supports: "ip" },
  { zone: "cbl.abuseat.org", name: "CBL / Abuseat", description: "Composite Blocking List — malware, botnets, open proxies.", supports: "ip" },
  { zone: "dnsbl-1.uceprotect.net", name: "UCEPROTECT L1", description: "Single IPs caught sending abuse in the last 7 days.", supports: "ip" },
  { zone: "dnsbl-2.uceprotect.net", name: "UCEPROTECT L2", description: "Networks with repeat offenders.", supports: "ip" },
  { zone: "dnsbl-3.uceprotect.net", name: "UCEPROTECT L3", description: "Entire ISPs hosting persistent abuse.", supports: "ip" },
  { zone: "psbl.surriel.com", name: "PSBL", description: "Passive Spam Block List — automated spamtrap listings.", supports: "ip" },
  { zone: "spam.dnsbl.anonmails.de", name: "AnonMails DNSBL", description: "Spam sources reported by anonymous mail operators.", supports: "ip" },
  { zone: "ix.dnsbl.manitu.net", name: "Heise IX Manitu", description: "German NiX Spam trap feed.", supports: "ip" },
  { zone: "bl.mailspike.net", name: "Mailspike BL", description: "IPs actively involved in spam attacks.", supports: "ip" },
  { zone: "z.mailspike.net", name: "Mailspike Z", description: "Mailspike reputation zone.", supports: "ip" },
  { zone: "bl.blocklist.de", name: "Blocklist.de", description: "Fail2Ban-reported abusive IPs (SSH, mail, web).", supports: "ip" },
  { zone: "all.s5h.net", name: "s5h.net", description: "General spam and abuse block list.", supports: "ip" },
  { zone: "spamsources.fabel.dk", name: "Fabel Sources", description: "Known spam sources (Fabel).", supports: "ip" },
  { zone: "bl.score.senderscore.com", name: "SenderScore BL", description: "Validity SenderScore reputation network.", supports: "ip" },
  { zone: "hostkarma.junkemailfilter.com", name: "HostKarma", description: "Junk Email Filter reputation (white/black/yellow).", supports: "ip" },
  { zone: "rbl.interserver.net", name: "InterServer RBL", description: "InterServer spam block list.", supports: "ip" },
  { zone: "bl.suomispam.net", name: "Suomispam BL", description: "Finnish spam reputation list.", supports: "ip" },
  { zone: "backscatter.spameatingmonkey.net", name: "SEM Backscatter", description: "Spam Eating Monkey backscatter sources.", supports: "ip" },
  { zone: "bl.spameatingmonkey.net", name: "SEM Black", description: "Spam Eating Monkey block list.", supports: "ip" },
  { zone: "netbl.spameatingmonkey.net", name: "SEM NetBL", description: "SEM network-level block list.", supports: "ip" },
  { zone: "truncate.gbudb.net", name: "GBUdb Truncate", description: "Message Sniffer truncated spam sources.", supports: "ip" },
  { zone: "dnsbl.dronebl.org", name: "DroneBL", description: "IRC drones, proxies, and worms.", supports: "ip" },
  { zone: "ubl.unsubscore.com", name: "LASHBACK UBL", description: "IPs sending to unsubscribed addresses.", supports: "ip" },
  { zone: "dnsbl.kempt.net", name: "KEMPTBL", description: "Kempt.net spam block list.", supports: "ip" },
  { zone: "combined.rbl.msrbl.net", name: "MSRBL Combined", description: "MSRBL aggregated block list.", supports: "ip" },
  { zone: "spam.rbl.msrbl.net", name: "MSRBL Spam", description: "MSRBL spam sources.", supports: "ip" },
  { zone: "phishing.rbl.msrbl.net", name: "MSRBL Phishing", description: "MSRBL phishing sources.", supports: "ip" },
  { zone: "virus.rbl.msrbl.net", name: "MSRBL Virus", description: "MSRBL virus/malware sources.", supports: "ip" },
  { zone: "images.rbl.msrbl.net", name: "MSRBL Images", description: "MSRBL image spam sources.", supports: "ip" },
  { zone: "web.rbl.msrbl.net", name: "MSRBL Web", description: "MSRBL web-based spam sources.", supports: "ip" },
  { zone: "0spam.fusionzero.com", name: "0SPAM", description: "0Spam Project block list.", supports: "ip" },
  { zone: "rbl.0spam.org", name: "0SPAM RBL", description: "0Spam realtime block list.", supports: "ip" },
  { zone: "torexit.dan.me.uk", name: "DAN TorExit", description: "Active Tor exit nodes (Dan Pool).", supports: "ip" },
  { zone: "tor.dan.me.uk", name: "DAN Tor", description: "All Tor nodes (Dan Pool).", supports: "ip" },
  { zone: "bogons.cymru.com", name: "Team Cymru Bogons", description: "Bogon (unallocated) IP ranges.", supports: "ip" },
  { zone: "korea.services.net", name: "Korea Services", description: "Blocks all South Korean IP ranges.", supports: "ip" },
  { zone: "zapbl.net", name: "ZapBL", description: "General abuse and spam block list.", supports: "ip" },
  { zone: "dnsbl.zapbl.net", name: "ZapBL DNSBL", description: "ZapBL DNS-based block list.", supports: "ip" },
  { zone: "dnsbl.spfbl.net", name: "SPFBL", description: "SPFBL DNSBL — reputation and SPF-based.", supports: "ip" },
  { zone: "spam.spamrats.com", name: "SpamRats Spam", description: "SpamRats confirmed spam sources.", supports: "ip" },
  { zone: "dyna.spamrats.com", name: "SpamRats Dyna", description: "SpamRats dynamic IP list.", supports: "ip" },
  { zone: "noptr.spamrats.com", name: "SpamRats NoPtr", description: "SpamRats IPs without reverse DNS.", supports: "ip" },
  { zone: "auth.spamrats.com", name: "SpamRats Auth", description: "SpamRats authentication abuse.", supports: "ip" },
  { zone: "virbl.dnsbl.bit.nl", name: "VirBL", description: "IPs sending viruses.", supports: "ip" },
  { zone: "wormrbl.imp.ch", name: "IMP WORM", description: "Worm-infected hosts.", supports: "ip" },
  { zone: "spamrbl.imp.ch", name: "IMP SPAM", description: "IMP spam sources.", supports: "ip" },
  { zone: "rbl.megarbl.net", name: "MegaRBL", description: "MegaRBL block list.", supports: "ip" },
  { zone: "cblplus.anti-spam.org.cn", name: "CBLplus (CN)", description: "China anti-spam CBL+.", supports: "ip" },
  { zone: "cdl.anti-spam.org.cn", name: "CDL (CN)", description: "China anti-spam confirmed drone list.", supports: "ip" },
  { zone: "rbl.rbldns.ru", name: "RBLDNS.ru", description: "Russian spam block list.", supports: "ip" },
  // Domain / URI blacklists
  { zone: "multi.surbl.org", name: "SURBL Multi", description: "Domains found in unsolicited messages across many feeds.", supports: "domain" },
  { zone: "uribl.spameatingmonkey.net", name: "SEM URIBL", description: "URIs seen in spam messages.", supports: "domain" },
  { zone: "fresh.spameatingmonkey.net", name: "SEM Fresh", description: "Newly registered domains observed in spam.", supports: "domain" },
  { zone: "urired.spameatingmonkey.net", name: "SEM URIRED", description: "Redirector URIs abused in spam.", supports: "domain" },
  { zone: "rhsbl.sorbs.net", name: "SORBS RHSBL", description: "SORBS right-hand-side domain block list.", supports: "domain" },
  { zone: "nomail.rhsbl.sorbs.net", name: "SORBS RHSBL NoMail", description: "Domains that never send mail.", supports: "domain" },
  { zone: "badconf.rhsbl.sorbs.net", name: "SORBS RHSBL BadConf", description: "Domains with bad mail configuration.", supports: "domain" },
  { zone: "uribl.swinog.ch", name: "SWINOG URIBL", description: "Swiss network operator URI blacklist.", supports: "domain" },
  { zone: "dbl.suomispam.net", name: "Suomispam Domain", description: "Finnish spam domain list.", supports: "domain" },
  { zone: "rhsbl.zapbl.net", name: "ZapBL RHSBL", description: "ZapBL domain block list.", supports: "domain" },
];

interface CheckResult {
  list: DNSBL;
  status: "listed" | "clean" | "error";
  code?: string;
  error?: string;
}

async function dohA(name: string): Promise<{ Status: number; Answer?: Array<{ data: string }> }> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function checkList(query: string, list: DNSBL): Promise<CheckResult> {
  try {
    const r = await dohA(`${query}.${list.zone}`);
    if (r.Answer && r.Answer.length > 0) {
      const codes = r.Answer.map((a) => a.data);
      const loopback = codes.find((d) => /^127\.\d+\.\d+\.\d+$/.test(d));
      // Only 127.0.0.0/8 responses are valid DNSBL "listed" signals.
      // A non-loopback answer means the zone is dead / parked / hijacked.
      if (!loopback) {
        return { list, status: "error", error: `zone returned non-DNSBL address (${codes[0]}) — feed likely retired` };
      }
      // 127.255.255.255 conventionally means "query blocked / quota exceeded / not authorised"
      // (used by Spamhaus, SORBS, SenderScore etc.), not an actual listing.
      if (loopback === "127.255.255.255" || loopback === "127.255.255.254") {
        return { list, status: "error", error: "query blocked / quota exceeded by feed" };
      }
      return { list, status: "listed", code: loopback };
    }
    return { list, status: "clean" };
  } catch (e) {
    return { list, status: "error", error: e instanceof Error ? e.message : "query failed" };
  }
}

function isHexHash(s: string): "md5" | "sha1" | "sha256" | null {
  const v = s.trim();
  if (!/^[a-fA-F0-9]+$/.test(v)) return null;
  if (v.length === 32) return "md5";
  if (v.length === 40) return "sha1";
  if (v.length === 64) return "sha256";
  return null;
}

type HashResult = Awaited<ReturnType<typeof hashLookup>>;

export const Route = createFileRoute("/blacklist")({
  component: BlacklistPage,
  head: () =>
    toolHead({
      path: "/blacklist",
      name: "Blacklist Check",
      title: "Blacklist Check — DNSBL & IP Reputation Lookup Tool",
      description:
        "Free blacklist check tool. Instantly test if an IP address or domain is listed on major DNSBL / RBL threat feeds like Spamhaus, Barracuda, SpamCop and more.",
      faqs: [
        {
          q: "What is a DNSBL blacklist check?",
          a: "A DNSBL (DNS-based Blackhole List) is a database of IPs or domains flagged for spam, malware, or abuse. This tool queries several major public lists in parallel and returns the per-list status.",
        },
        {
          q: "Does it work for domains too?",
          a: "Yes. Enter an IPv4 address to query IP-based lists (Spamhaus ZEN, Barracuda, SpamCop, SORBS, CBL, UCEPROTECT, PSBL, AnonMails). Enter a domain to query domain lists (Spamhaus DBL, SURBL).",
        },
        {
          q: "What do the 127.0.0.x return codes mean?",
          a: "DNSBLs answer with a loopback A-record like 127.0.0.2 or 127.0.0.3 when the asset is listed. The exact octet identifies the abuse category defined by the vendor.",
        },
      ],
    }),
});

function BlacklistPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [queried, setQueried] = useState<{ kind: "ip" | "domain"; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hashResult, setHashResult] = useState<HashResult | null>(null);

  const runCheck = useCallback(async () => {
    const raw = input.trim();
    setError(null);
    setResults(null);
    setHashResult(null);
    setQueried(null);
    if (!raw) return;

    // Hash detection takes priority
    const hashType = isHexHash(raw);
    if (hashType) {
      setLoading(true);
      try {
        const r = await hashLookup({ data: { hash: raw } });
        setHashResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hash lookup failed");
      }
      setLoading(false);
      return;
    }

    let kind: "ip" | "domain";
    let query: string;
    let applicable: DNSBL[];

    if (isValidIPv4(raw)) {
      kind = "ip";
      query = reverseIPv4(raw);
      applicable = LISTS.filter((l) => l.supports === "ip" || l.supports === "both");
    } else {
      const clean = raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
      if (!isValidDomain(clean)) {
        setError("Enter a valid IPv4 address, domain name, or file hash (MD5 / SHA-1 / SHA-256).");
        return;
      }
      kind = "domain";
      query = clean;
      applicable = LISTS.filter((l) => l.supports === "domain" || l.supports === "both");
    }

    setQueried({ kind, value: kind === "ip" ? raw : query });
    setLoading(true);
    const out = await Promise.all(applicable.map((l) => checkList(query, l)));
    setResults(out);
    setLoading(false);
  }, [input]);

  const listedCount = results?.filter((r) => r.status === "listed").length ?? 0;
  const totalCount = results?.length ?? 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
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
          Blacklist Check
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
          Check an IPv4 address or domain against major public DNSBL / RBL reputation feeds — Spamhaus,
          Barracuda, SpamCop, SORBS, CBL and more — in one click.
        </p>
      </div>

      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
          IP Address, Domain or File Hash
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResults(null);
            setHashResult(null);
            setError(null);
          }}
          placeholder="e.g. 8.8.8.8, example.com, or 64-char SHA-256"
          onKeyDown={(e) => e.key === "Enter" && runCheck()}
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
        />
        <div style={{ marginBottom: 14, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, marginRight: 4 }}>Try:</span>
          {[
            "8.8.8.8",
            "1.1.1.1",
            "127.0.0.2",
            "spamhaus.org",
            "094fd325049b8a9cf6d3e5ef2a6d4cc6a567d7d49c35f8bb8dd9e3c6acf3d78d",
          ].map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setInput(ex);
                setResults(null);
                setHashResult(null);
                setError(null);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
                background: input === ex ? "rgba(0,212,170,0.15)" : "transparent",
                color: input === ex ? TEAL : TEXT_SEC,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ex.length > 24 ? `${ex.slice(0, 10)}…${ex.slice(-6)}` : ex}
            </button>
          ))}
        </div>
        <button
          onClick={runCheck}
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
          {loading ? "Checking lists…" : "Check Blacklists"}
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

      {loading && (
        <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 56,
                borderRadius: 10,
                background: "linear-gradient(90deg,#131829,#1a2038,#131829)",
                backgroundSize: "200% 100%",
                animation: "pulseShimmer 1.4s ease-in-out infinite",
                border: `1px solid ${BORDER}`,
              }}
            />
          ))}
          <style>{`@keyframes pulseShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {results && queried && !loading && (
        <>
          {null}
          {/* DNSBL results below */}
          <div
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
                {queried.kind === "ip" ? "IP" : "Domain"}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#fff", fontWeight: 600 }}>
                {queried.value}
              </div>
            </div>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                background:
                  listedCount > 0 ? "rgba(255,77,109,0.15)" : "rgba(0,212,170,0.15)",
                color: listedCount > 0 ? "#ff4d6d" : TEAL,
                border: `1px solid ${
                  listedCount > 0 ? "rgba(255,77,109,0.35)" : "rgba(0,212,170,0.35)"
                }`,
              }}
            >
              {listedCount} / {totalCount} lists flagged
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 32 }}>
            {results.map((r) => (
              <div
                key={r.list.zone}
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{r.list.name}</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{r.list.description}</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                    {r.list.zone}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  {r.status === "listed" && (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(255,77,109,0.15)",
                          border: "1px solid rgba(255,77,109,0.35)",
                          color: "#ff4d6d",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        🔴 Listed
                      </span>
                      {r.code && (
                        <div style={{ color: TEXT_MUTED, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                          {r.code}
                        </div>
                      )}
                    </>
                  )}
                  {r.status === "clean" && (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(0,212,170,0.15)",
                        border: "1px solid rgba(0,212,170,0.35)",
                        color: TEAL,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      🟢 Clean
                    </span>
                  )}
                  {r.status === "error" && (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(255,193,7,0.12)",
                          border: "1px solid rgba(255,193,7,0.35)",
                          color: "#ffc107",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        ⚠️ Error
                      </span>
                      {r.error && (
                        <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 4 }}>{r.error}</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>How it works</h2>
        <p style={{ marginBottom: 10 }}>
          Each DNSBL (DNS-based Blackhole List) is queried by sending a specially crafted DNS A-record
          request. For an IP like <code style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>192.0.2.1</code>,
          the octets are reversed and the vendor zone appended — e.g.{" "}
          <code style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>1.2.0.192.zen.spamhaus.org</code>.
          A response of <code style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>127.0.0.2</code> or
          similar means the asset is listed for a specific abuse category.
        </p>
        <p>
          Queries are executed in parallel over Google Public DNS (DoH) so results return in a second or two,
          with no server-side rate limits or API keys required.
        </p>
      </div>
    </div>
  );
}
