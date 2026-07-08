import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toolHead } from "@/lib/seo";

/* ============================================================
   IP SUBNET CALCULATOR
   ============================================================ */

const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const SURFACE = "#131829";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let val = 0;
  for (let i = 0; i < 4; i++) {
    const n = parseInt(parts[i], 10);
    if (Number.isNaN(n) || n < 0 || n > 255) return null;
    val = (val << 8) | n;
  }
  return val >>> 0;
}

function intToIp(val: number): string {
  return [
    (val >>> 24) & 0xff,
    (val >>> 16) & 0xff,
    (val >>> 8) & 0xff,
    val & 0xff,
  ].join(".");
}

function cidrToMask(cidr: number): number {
  return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
}

function maskToCidr(mask: number): number {
  let cidr = 0;
  let m = mask >>> 0;
  while (m & 0x80000000) {
    cidr++;
    m <<= 1;
  }
  return cidr;
}

function isValidMask(mask: number): boolean {
  const m = mask >>> 0;
  let foundZero = false;
  for (let i = 31; i >= 0; i--) {
    const bit = (m >>> i) & 1;
    if (bit === 0) foundZero = true;
    if (foundZero && bit === 1) return false;
  }
  return true;
}

function intToBinary(val: number): string {
  const b = (val >>> 0).toString(2).padStart(32, "0");
  return `${b.slice(0, 8)}.${b.slice(8, 16)}.${b.slice(16, 24)}.${b.slice(24, 32)}`;
}

interface SubnetResult {
  ip: string;
  cidr: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  ipBinary: string;
  maskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
}

function calculateSubnet(ipStr: string, maskStr: string): SubnetResult | { error: string } {
  const ipVal = ipToInt(ipStr);
  if (ipVal === null) return { error: "Invalid IP address format. Use x.x.x.x" };

  let cidr = 0;
  let maskVal = 0;

  if (maskStr.startsWith("/")) {
    const n = parseInt(maskStr.slice(1), 10);
    if (Number.isNaN(n) || n < 0 || n > 32) return { error: "Invalid CIDR. Use /0 to /32." };
    cidr = n;
    maskVal = cidrToMask(cidr);
  } else {
    const m = ipToInt(maskStr);
    if (m === null) return { error: "Invalid subnet mask. Use x.x.x.x or /n notation." };
    if (!isValidMask(m)) return { error: "Invalid subnet mask. Bits must be contiguous." };
    maskVal = m >>> 0;
    cidr = maskToCidr(maskVal);
  }

  const networkVal = (ipVal & maskVal) >>> 0;
  const broadcastVal = (ipVal | (~maskVal >>> 0)) >>> 0;

  let firstUsableVal = networkVal;
  let lastUsableVal = broadcastVal;
  let usableHosts = 0;

  if (cidr === 32) {
    usableHosts = 1;
    firstUsableVal = ipVal;
    lastUsableVal = ipVal;
  } else if (cidr === 31) {
    usableHosts = 2;
    firstUsableVal = networkVal;
    lastUsableVal = broadcastVal;
  } else {
    usableHosts = Math.max(0, Math.pow(2, 32 - cidr) - 2);
    firstUsableVal = (networkVal + 1) >>> 0;
    lastUsableVal = (broadcastVal - 1) >>> 0;
  }

  const totalHosts = Math.pow(2, 32 - cidr);

  const firstOctet = (ipVal >>> 24) & 0xff;
  let ipClass = "";
  if (firstOctet >= 1 && firstOctet <= 126) ipClass = "A";
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = "B";
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = "C";
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = "D (Multicast)";
  else if (firstOctet >= 240 && firstOctet <= 255) ipClass = "E (Reserved)";
  else ipClass = "—";

  return {
    ip: intToIp(ipVal),
    cidr,
    mask: intToIp(maskVal),
    wildcard: intToIp(~maskVal >>> 0),
    network: intToIp(networkVal),
    broadcast: intToIp(broadcastVal),
    firstUsable: intToIp(firstUsableVal),
    lastUsable: intToIp(lastUsableVal),
    totalHosts,
    usableHosts,
    ipClass,
    ipBinary: intToBinary(ipVal),
    maskBinary: intToBinary(maskVal),
    networkBinary: intToBinary(networkVal),
    broadcastBinary: intToBinary(broadcastVal),
  };
}

/* ============================================================
   COMPONENT
   ============================================================ */
export const Route = createFileRoute("/subnet")({
  component: SubnetPage,
  head: () =>
    toolHead({
      path: "/subnet",
      name: "IP Subnet Calculator",
      title: "IP Subnet Calculator — CIDR, Mask & Host Range Tool",
      description:
        "Free IPv4 subnet calculator. Enter any IP and CIDR to get the network address, broadcast, usable host range, wildcard mask and total hosts.",
      faqs: [
        {
          q: "What does the subnet calculator return?",
          a: "Network address, broadcast address, usable host range, wildcard mask, total and usable host count, plus binary representations for the given IP and CIDR mask.",
        },
        {
          q: "Does it support CIDR notation?",
          a: "Yes. You can enter a mask as CIDR (for example /24) or as a dotted mask (255.255.255.0).",
        },
      ],
    }),
});

function SubnetPage() {
  const [ip, setIp] = useState("192.168.1.0");
  const [mask, setMask] = useState("/24");
  const [result, setResult] = useState<SubnetResult | { error: string } | null>(null);
  const [showBinary, setShowBinary] = useState(false);

  const compute = useCallback(() => {
    setResult(calculateSubnet(ip, mask));
  }, [ip, mask]);

  const quickCidr = (c: number) => {
    setMask(`/${c}`);
    setResult(null);
  };

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
          IP Subnet Calculator
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 15, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Enter an IP address and subnet mask (or CIDR) to instantly compute the network address, broadcast
          address, usable IP range, and maximum number of hosts.
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
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
              IP Address
            </label>
            <input
              type="text"
              value={ip}
              onChange={(e) => {
                setIp(e.target.value);
                setResult(null);
              }}
              placeholder="192.168.1.0"
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
              }}
              onKeyDown={(e) => e.key === "Enter" && compute()}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 6, fontWeight: 600 }}>
              Subnet Mask (CIDR or dotted)
            </label>
            <input
              type="text"
              value={mask}
              onChange={(e) => {
                setMask(e.target.value);
                setResult(null);
              }}
              placeholder="/24  or  255.255.255.0"
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
              }}
              onKeyDown={(e) => e.key === "Enter" && compute()}
            />
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, marginRight: 4 }}>Quick CIDR:</span>
          {[8, 16, 24, 25, 26, 27, 28, 29, 30].map((c) => (
            <button
              key={c}
              onClick={() => quickCidr(c)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
                background: mask === `/${c}` ? "rgba(0,212,170,0.15)" : "transparent",
                color: mask === `/${c}` ? TEAL : TEXT_SEC,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              /{c}
            </button>
          ))}
        </div>

        <button
          onClick={compute}
          style={{
            marginTop: 18,
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Calculate Subnet
        </button>
      </div>

      {/* Result */}
      {result && "error" in result && (
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

      {result && !("error" in result) && (
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "24px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <ResultCard label="IP Address" value={result.ip} mono />
            <ResultCard label="Subnet Mask" value={result.mask} mono />
            <ResultCard label="CIDR" value={`/${result.cidr}`} mono />
            <ResultCard label="Wildcard Mask" value={result.wildcard} mono />
            <ResultCard label="Network Address" value={result.network} mono highlight />
            <ResultCard label="Broadcast Address" value={result.broadcast} mono highlight />
            <ResultCard label="Usable Host Range" value={`${result.firstUsable} – ${result.lastUsable}`} mono />
            <ResultCard label="Total Hosts" value={result.totalHosts.toLocaleString()} />
            <ResultCard label="Usable Hosts" value={result.usableHosts.toLocaleString()} />
            <ResultCard label="IP Class" value={result.ipClass} />
          </div>

          <div style={{ marginTop: 20, borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
            <button
              onClick={() => setShowBinary((s) => !s)}
              style={{
                background: "transparent",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "8px 14px",
                color: TEXT_SEC,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {showBinary ? "Hide Binary" : "Show Binary"}
            </button>
            {showBinary && (
              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                <BinaryRow label="IP Address" binary={result.ipBinary} />
                <BinaryRow label="Subnet Mask" binary={result.maskBinary} />
                <BinaryRow label="Network" binary={result.networkBinary} />
                <BinaryRow label="Broadcast" binary={result.broadcastBinary} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.7 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>How it works</h2>
        <p>
          A subnet divides a larger network into smaller, manageable sections. The subnet mask defines which
          portion of an IP address represents the network and which part identifies individual hosts. Enter any
          valid IPv4 address with a subnet mask (CIDR notation like{" "}
          <code style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>/24</code> or dotted decimal like{" "}
          <code style={{ color: TEAL, fontFamily: "'DM Mono', monospace" }}>255.255.255.0</code>) and the
          calculator instantly returns the network address, broadcast address, usable IP range, and maximum
          number of hosts.
        </p>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "#0f1422",
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          color: highlight ? TEAL : "#fff",
          fontWeight: 600,
          fontFamily: mono ? "'DM Mono', monospace" : undefined,
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BinaryRow({ label, binary }: { label: string; binary: string }) {
  return (
    <div
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        color: TEXT_SEC,
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 12px",
        alignItems: "center",
      }}
    >
      <span style={{ color: TEXT_MUTED, minWidth: 90 }}>{label}</span>
      <span style={{ letterSpacing: 1 }}>
        {binary.split("").map((ch, i) => (
          <span key={i} style={{ color: ch === "." ? TEXT_MUTED : i < binary.indexOf("0", binary.lastIndexOf("1")) ? TEAL : PURPLE }}>
            {ch}
          </span>
        ))}
      </span>
    </div>
  );
}
