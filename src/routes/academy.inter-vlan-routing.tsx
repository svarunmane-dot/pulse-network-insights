import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson17-hero.jpg";

export const Route = createFileRoute("/academy/inter-vlan-routing")({
  head: () =>
    toolHead({
      path: "/academy/inter-vlan-routing",
      title: "Lesson 17: Inter-VLAN Routing Explained | Pulse Speed Academy",
      description:
        "Learn how different VLANs communicate: router-on-a-stick, Layer 3 switch SVIs, firewall-based routing, default gateways and security policies — with an interactive Inter-VLAN routing simulator.",
      name: "Lesson 17 – Inter-VLAN Routing Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is inter-VLAN routing?",
          a: "Inter-VLAN routing is the process of routing traffic between different VLANs. Because VLANs are separate Layer 2 broadcast domains and separate IP subnets, a Layer 3 device — a router, Layer 3 switch or firewall — is required for them to communicate.",
        },
        {
          q: "What is an SVI?",
          a: "SVI stands for Switched Virtual Interface. It is a logical Layer 3 interface associated with a VLAN on a Layer 3 switch, for example 'interface vlan 10' with the IP address 192.168.10.1, which becomes the default gateway for that VLAN.",
        },
        {
          q: "What is router-on-a-stick?",
          a: "Router-on-a-stick is a design where one physical router interface connects to a switch over an 802.1Q trunk, and the router uses logical subinterfaces (such as G0/0.10 and G0/0.20) — one per VLAN — to route between them.",
        },
        {
          q: "Do VLANs provide security by themselves?",
          a: "No. VLANs provide segmentation, but once inter-VLAN routing exists, traffic can potentially flow between them. Firewall rules or ACLs must control which VLANs are allowed to communicate.",
        },
      ],
    }),
  component: Lesson17,
});

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: "#fff", fontSize: 24, marginTop: 40, letterSpacing: "-0.3px" }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.75, margin: "10px 0" }}>{children}</p>
);
const B = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: "#fff" }}>{children}</strong>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>{children}</ul>
);

function Pre({ children }: { children: string }) {
  return (
    <pre
      style={{
        border: "1px solid #1f2740",
        borderRadius: 12,
        padding: 18,
        background: "#0f1422",
        color: "#c8d0e0",
        fontFamily: "monospace",
        fontSize: 13.5,
        lineHeight: 1.6,
        overflowX: "auto",
        margin: "14px 0",
      }}
    >
      {children}
    </pre>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 12, overflow: "hidden", margin: "14px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead style={{ background: "#0f1422" }}>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  color: "#fff",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2740",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    color: "#c8d0e0",
                    borderTop: i === 0 ? "none" : "1px solid #1f2740",
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TryItCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(0,212,170,0.4)",
        background: "linear-gradient(135deg, rgba(0,212,170,0.10), rgba(155,143,232,0.08))",
        textDecoration: "none",
      }}
    >
      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>🧪 TRY IT NOW</div>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 4 }}>{title}</div>
      <div style={{ color: "#c8d0e0", fontSize: 13, marginTop: 4 }}>{body}</div>
    </Link>
  );
}

function Callout({ tone, title, children }: { tone: "info" | "warn"; title: string; children: React.ReactNode }) {
  const teal = tone === "info";
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${teal ? "rgba(0,212,170,0.35)" : "rgba(255,180,80,0.35)"}`,
        background: teal ? "rgba(0,212,170,0.06)" : "rgba(255,180,80,0.06)",
      }}
    >
      <div style={{ color: teal ? "#00D4AA" : "#ffb450", fontWeight: 700, fontSize: 13, letterSpacing: 0.4 }}>
        {title}
      </div>
      <div style={{ color: "#c8d0e0", fontSize: 15, lineHeight: 1.7, marginTop: 6 }}>{children}</div>
    </div>
  );
}

/* ---------------- Interactive Inter-VLAN Routing Simulator ---------------- */

type VlanId = 10 | 20 | 30;

const VLANS: { id: VlanId; name: string; subnet: string; gw: string; host: string; color: string }[] = [
  { id: 10, name: "Users", subnet: "192.168.10.0/24", gw: "192.168.10.1", host: "192.168.10.20", color: "#00D4AA" },
  { id: 20, name: "Servers", subnet: "192.168.20.0/24", gw: "192.168.20.1", host: "192.168.20.20", color: "#9B8FE8" },
  { id: 30, name: "Guest", subnet: "192.168.30.0/24", gw: "192.168.30.1", host: "192.168.30.20", color: "#ffb450" },
];

const vlanMeta = (id: VlanId) => VLANS.find((v) => v.id === id)!;

type PolicyKey = `${VlanId}->${VlanId}`;
const POLICY_KEYS: PolicyKey[] = ["10->20", "10->30", "20->10", "20->30", "30->10", "30->20"];
const DEFAULT_POLICY: Record<PolicyKey, boolean> = {
  "10->20": true,
  "10->30": true,
  "20->10": true,
  "20->30": true,
  "30->10": false,
  "30->20": false,
};

type SimResult = {
  ok: boolean;
  headline: string;
  journey: { label: string; blocked?: boolean }[];
};

function InterVlanSimulator() {
  const [routing, setRouting] = useState(true);
  const [policy, setPolicy] = useState<Record<PolicyKey, boolean>>(DEFAULT_POLICY);
  const [src, setSrc] = useState<VlanId>(10);
  const [dst, setDst] = useState<VlanId>(20);
  const [result, setResult] = useState<SimResult | null>(null);

  const test = () => {
    const s = vlanMeta(src);
    const d = vlanMeta(dst);
    if (src === dst) {
      setResult({
        ok: true,
        headline: `✅ Allowed — same VLAN ${src} (${s.name})`,
        journey: [
          { label: `Source ${s.host} (VLAN ${src})` },
          { label: "Layer 2 switch forwards directly — no router needed" },
          { label: `Destination ${d.host} (VLAN ${dst})` },
        ],
      });
      return;
    }
    if (!routing) {
      setResult({
        ok: false,
        headline: `❌ Blocked — no Layer 3 device present`,
        journey: [
          { label: `Source ${s.host} (VLAN ${src}, ${s.subnet})` },
          { label: `PC checks: ${d.host} is outside ${s.subnet} → send to gateway` },
          { label: "No router / SVI exists — packet has nowhere to go", blocked: true },
        ],
      });
      return;
    }
    const allowed = policy[`${src}->${dst}`];
    const journey: SimResult["journey"] = [
      { label: `Source ${s.host} (VLAN ${src})` },
      { label: `Default gateway ${s.gw} (SVI VLAN ${src})` },
      { label: "Layer 3 routing — destination IP unchanged, new L2 frame" },
    ];
    if (allowed) {
      journey.push({ label: `VLAN ${dst} (${d.subnet})` }, { label: `Destination ${d.host} ✅` });
    } else {
      journey.push({ label: `Firewall / ACL policy: ${s.name} → ${d.name} = DENY`, blocked: true });
    }
    setResult({
      ok: allowed,
      headline: allowed
        ? `✅ Routed — VLAN ${src} (${s.name}) can reach VLAN ${dst} (${d.name})`
        : `🛡️ Routed but BLOCKED — security policy denies ${s.name} → ${d.name}`,
      journey,
    });
  };

  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 14, background: "#0f1422", padding: 18, marginTop: 16 }}>
      <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>🧪 Inter-VLAN Routing Simulator</div>
      <div style={{ color: "#6b7794", fontSize: 13, marginTop: 4 }}>
        Pick a source and destination VLAN, toggle Layer 3 routing and firewall policies, then trace the packet
        journey.
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 14,
          background: "#0b0f1a",
        }}
      >
        <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
          LAYER 3 SWITCH (SVIs)
        </div>
        <div
          style={{
            border: "1px solid #1f2740",
            borderRadius: 10,
            padding: 10,
            textAlign: "center",
            color: routing ? "#fff" : "#6b7794",
            background: routing ? "rgba(155,143,232,0.10)" : "#0f1422",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {routing
            ? VLANS.map((v) => `VLAN ${v.id} → ${v.gw}`).join("   ·   ")
            : "Routing disabled — no SVIs configured"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {VLANS.map((v) => (
            <div
              key={v.id}
              style={{ border: `1px solid ${v.color}55`, background: `${v.color}12`, borderRadius: 10, padding: 10 }}
            >
              <div style={{ color: v.color, fontWeight: 700, fontSize: 13 }}>
                VLAN {v.id} · {v.name}
              </div>
              <div style={{ color: "#c8d0e0", fontSize: 12, marginTop: 4 }}>{v.subnet}</div>
              <div style={{ color: "#6b7794", fontSize: 12 }}>GW {v.gw}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 16 }}>
        <label style={{ color: "#c8d0e0", fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>Source VLAN</div>
          <select
            value={src}
            onChange={(e) => {
              setSrc(Number(e.target.value) as VlanId);
              setResult(null);
            }}
            style={{ background: "#0b0f1a", color: "#c8d0e0", border: "1px solid #1f2740", borderRadius: 8, padding: "8px 10px" }}
          >
            {VLANS.map((v) => (
              <option key={v.id} value={v.id}>
                VLAN {v.id} – {v.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ color: "#c8d0e0", fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>Destination VLAN</div>
          <select
            value={dst}
            onChange={(e) => {
              setDst(Number(e.target.value) as VlanId);
              setResult(null);
            }}
            style={{ background: "#0b0f1a", color: "#c8d0e0", border: "1px solid #1f2740", borderRadius: 8, padding: "8px 10px" }}
          >
            {VLANS.map((v) => (
              <option key={v.id} value={v.id}>
                VLAN {v.id} – {v.name}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={test}
          style={{
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Test connectivity
        </button>
        <button
          onClick={() => {
            setRouting(true);
            setPolicy(DEFAULT_POLICY);
            setSrc(10);
            setDst(20);
            setResult(null);
          }}
          style={{
            background: "#0b0f1a",
            color: "#c8d0e0",
            border: "1px solid #1f2740",
            padding: "10px 16px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, color: "#c8d0e0", fontSize: 14, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={routing}
          onChange={(e) => {
            setRouting(e.target.checked);
            setResult(null);
          }}
        />
        Enable <B>Layer 3 routing</B> (SVIs on the switch)
      </label>

      <div style={{ marginTop: 14 }}>
        <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
          FIREWALL / ACL POLICIES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
          {POLICY_KEYS.map((k) => {
            const [a, b] = k.split("->") as unknown as [VlanId, VlanId];
            const allowed = policy[k];
            return (
              <button
                key={k}
                onClick={() => {
                  setPolicy((p) => ({ ...p, [k]: !p[k] }));
                  setResult(null);
                }}
                style={{
                  border: `1px solid ${allowed ? "rgba(0,212,170,0.45)" : "rgba(255,107,138,0.45)"}`,
                  background: allowed ? "rgba(0,212,170,0.08)" : "rgba(233,69,96,0.08)",
                  color: allowed ? "#00D4AA" : "#ff6b8a",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {vlanMeta(a).name} → {vlanMeta(b).name}: {allowed ? "ALLOW ✅" : "DENY ❌"}
              </button>
            );
          })}
        </div>
      </div>

      {result && (
        <div
          style={{
            marginTop: 16,
            border: `1px solid ${result.ok ? "rgba(0,212,170,0.45)" : "rgba(255,107,138,0.45)"}`,
            background: result.ok ? "rgba(0,212,170,0.08)" : "rgba(233,69,96,0.08)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: result.ok ? "#00D4AA" : "#ff6b8a", fontWeight: 700, fontSize: 15 }}>
            {result.headline}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
              PACKET JOURNEY
            </div>
            {result.journey.map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div
                  style={{
                    border: `1px solid ${step.blocked ? "rgba(255,107,138,0.5)" : "#1f2740"}`,
                    background: "#0b0f1a",
                    color: step.blocked ? "#ff6b8a" : "#c8d0e0",
                    borderRadius: 8,
                    padding: "7px 12px",
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                >
                  {step.label}
                </div>
                {i < result.journey.length - 1 && <div style={{ color: "#6b7794", padding: "2px 14px" }}>↓</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Practice challenge ---------------- */

function RevealItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 12, padding: 14, background: "#0f1422" }}>
      <div style={{ color: "#fff", fontWeight: 600 }}>{q}</div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          marginTop: 8,
          background: "#0b0f1a",
          border: "1px solid #1f2740",
          color: "#00D4AA",
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {open ? "Hide answer" : "Show answer"}
      </button>
      {open && <div style={{ color: "#c8d0e0", fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>{a}</div>}
    </div>
  );
}

/* ---------------- Lesson ---------------- */

function Lesson17() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 17 · BEGINNER · ⏱️ 12–15 MIN READ
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px", color: "#fff", lineHeight: 1.15, margin: "10px 0 14px" }}>
        Inter-VLAN Routing Explained – How Different VLANs Communicate
      </h1>
      <img
        src={heroImg}
        alt="Three VLAN networks connected through a central Layer 3 switch performing inter-VLAN routing"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "10px 0 6px" }}
      />

      <H2>Introduction</H2>
      <P>
        In the previous lesson, we learned that VLANs separate a network into different logical networks. For example:
      </P>
      <UL>
        <li>VLAN 10 → IT</li>
        <li>VLAN 20 → Finance</li>
        <li>VLAN 30 → HR</li>
        <li>VLAN 40 → Guest</li>
      </UL>
      <P>
        This separation is useful. But eventually we need to allow <B>some</B> devices in different VLANs to
        communicate. For example, an IT computer needs to access a server in the Server VLAN, or a Finance computer
        needs to access a printer in another VLAN. A Layer 2 switch cannot do this by itself — we need{" "}
        <B>Layer 3 routing</B>. This is called <B>Inter-VLAN Routing</B>.
      </P>

      <H2>What is Inter-VLAN Routing?</H2>
      <P>Inter-VLAN routing is the process of routing traffic between different VLANs:</P>
      <Pre>{`VLAN 10
IT
192.168.10.0/24
       │
       ▼
   Layer 3 Device
       │
       ▼
VLAN 20
Finance
192.168.20.0/24`}</Pre>
      <P>The Layer 3 device can be:</P>
      <UL>
        <li>A router</li>
        <li>A Layer 3 switch</li>
        <li>A firewall</li>
      </UL>

      <H2>Why Can't a Normal Switch Do It?</H2>
      <P>
        Remember what we learned in Lesson 15. A Layer 2 switch primarily forwards Ethernet frames using{" "}
        <B>MAC addresses</B>. VLANs create separate Layer 2 broadcast domains — therefore a normal Layer 2 switch
        doesn't automatically route between them. We need a Layer 3 device.
      </P>
      <Pre>{`VLAN 10
      ❌
VLAN 20`}</Pre>

      <H2>A Simple Example</H2>
      <P>Let's say:</P>
      <UL>
        <li>
          <B>PC1</B> — IP: 192.168.10.10, VLAN 10
        </li>
        <li>
          <B>PC2</B> — IP: 192.168.20.10, VLAN 20
        </li>
      </UL>
      <P>
        PC1 wants to communicate with PC2. The devices are on different IP networks (192.168.10.0/24 vs
        192.168.20.0/24). PC1 determines: <i>"PC2 isn't on my local subnet."</i> So PC1 sends the traffic to its{" "}
        <B>default gateway</B>.
      </P>

      <H2>The Default Gateway Is the Key</H2>
      <P>
        For VLAN 10 (192.168.10.0/24) the gateway is <B>192.168.10.1</B>. For VLAN 20 (192.168.20.0/24) the gateway
        is <B>192.168.20.1</B>. The Layer 3 device has an interface in each VLAN:
      </P>
      <Pre>{`             Layer 3 Device
          ┌──────────────────┐
          │ VLAN 10: .10.1   │
          │ VLAN 20: .20.1   │
          └────────┬─────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
     VLAN 10               VLAN 20
192.168.10.0/24         192.168.20.0/24`}</Pre>
      <P>These gateway addresses are the default gateways for the respective VLANs.</P>

      <H2>How Does the Traffic Actually Move?</H2>
      <P>Let's follow the packet from PC1 (192.168.10.10) to PC2 (192.168.20.10):</P>
      <P>
        <B>Step 1 — PC1 checks the destination.</B> PC1 checks its subnet. 192.168.20.10 is outside 192.168.10.0/24,
        so PC1 knows: "I need to send this to my default gateway."
      </P>
      <P>
        <B>Step 2 — PC1 finds the gateway's MAC.</B> PC1 uses ARP to discover the MAC address of 192.168.10.1.
      </P>
      <P>
        <B>Step 3 — PC1 sends the frame</B> toward the Layer 3 device:
      </P>
      <Pre>{`PC1
192.168.10.10
     │
     │ VLAN 10
     ▼
Switch
     │
     ▼
Gateway
192.168.10.1`}</Pre>
      <P>
        <B>Step 4 — The router/Layer 3 switch routes the packet.</B> It examines the destination IP 192.168.20.10,
        knows that 192.168.20.0/24 belongs to VLAN 20, and forwards the packet toward VLAN 20.
      </P>
      <P>
        <B>Step 5 — The destination receives the packet.</B> Communication is complete.
      </P>

      <Callout tone="info" title="💡 IMPORTANT CONCEPT">
        The IP destination stays the same — 192.168.20.10. But the Layer 2 Ethernet frame <B>changes</B> as the
        packet moves between networks. The router forwards the packet toward the destination network and creates the
        appropriate Layer 2 frame on the outgoing interface. This is one of the fundamental concepts of networking.
      </Callout>

      <H2>Three Common Ways to Do Inter-VLAN Routing</H2>

      <H2 style={{ fontSize: 19 }}>1️⃣ Router-on-a-Stick</H2>
      <P>Despite the funny name, this is a very useful concept:</P>
      <Pre>{`             Router
        ┌──────────────┐
        │ VLAN 10      │
        │ VLAN 20      │
        │ VLAN 30      │
        └──────┬───────┘
               │
             Trunk
               │
        ┌──────▼───────┐
        │    Switch    │
        └──────────────┘`}</Pre>
      <P>
        One physical router interface connects to the switch using a trunk. The router creates multiple logical
        subinterfaces — G0/0.10 → VLAN 10, G0/0.20 → VLAN 20, G0/0.30 → VLAN 30 — each with its own IP address:
      </P>
      <Pre>{`G0/0.10  →  192.168.10.1/24
G0/0.20  →  192.168.20.1/24
G0/0.30  →  192.168.30.1/24`}</Pre>
      <P>These become the default gateways for the VLANs.</P>

      <H2 style={{ fontSize: 19 }}>2️⃣ Layer 3 Switch</H2>
      <P>
        In larger networks, you will often use a Layer 3 switch instead. Instead of sending traffic to an external
        router, the switch itself performs the routing — generally much more efficient for routing between VLANs
        inside a LAN:
      </P>
      <Pre>{`             Layer 3 Switch
        ┌─────────────────────┐
        │ SVI VLAN 10         │
        │ 192.168.10.1        │
        │                     │
        │ SVI VLAN 20         │
        │ 192.168.20.1        │
        └─────────────────────┘
             │           │
          VLAN 10      VLAN 20`}</Pre>
      <P>
        <B>What is an SVI?</B> SVI = Switched Virtual Interface — a logical Layer 3 interface associated with a
        VLAN:
      </P>
      <Pre>{`interface vlan 10
 ip address 192.168.10.1 255.255.255.0

interface vlan 20
 ip address 192.168.20.1 255.255.255.0`}</Pre>
      <P>Now the Layer 3 switch can route between those networks.</P>

      <H2 style={{ fontSize: 19 }}>3️⃣ Firewall-Based Inter-VLAN Routing</H2>
      <P>In many enterprise networks, VLANs connect to a firewall:</P>
      <Pre>{`VLAN 10 ──┐
          │
VLAN 20 ──┼──► Firewall ──► Internet
          │
VLAN 30 ──┘`}</Pre>
      <P>
        This is particularly useful because the firewall can control communication. The firewall doesn't just route —
        it can also inspect and control the traffic:
      </P>
      <Pre>{`IT → Servers       ✅
Finance → Servers  ✅
Guest → Servers    ❌
Guest → Internet   ✅`}</Pre>

      <H2>Inter-VLAN Routing and Security</H2>
      <P>
        This is where VLANs become really powerful. Imagine VLAN 10 → Employees, VLAN 20 → Servers, VLAN 30 → Guest.
        You probably don't want Guest → Servers to be allowed, but you may want Guest → Internet to work. So you
        create security policies:
      </P>
      <Pre>{`Guest → Internet       ALLOW
Guest → Servers        DENY
Guest → Employees      DENY`}</Pre>
      <P>This provides segmentation plus controlled communication.</P>

      <Callout tone="warn" title="⚠️ VLANs ARE NOT A SECURITY BOUNDARY BY THEMSELVES">
        Creating VLAN 10 and VLAN 20 doesn't automatically mean traffic between them is securely controlled. Once
        Layer 3 routing exists, traffic can potentially move between the networks. Think: VLAN → Segmentation.
        Firewall / ACL → Traffic Control. Security policies need to determine what is allowed.
      </Callout>

      <H2>Real-World Example: A Small Office</H2>
      <UL>
        <li>
          <B>VLAN 10 — Users:</B> 192.168.10.0/24, Gateway: 192.168.10.1
        </li>
        <li>
          <B>VLAN 20 — Servers:</B> 192.168.20.0/24, Gateway: 192.168.20.1
        </li>
        <li>
          <B>VLAN 30 — Guest:</B> 192.168.30.0/24, Gateway: 192.168.30.1
        </li>
      </UL>
      <Pre>{`                     Firewall
                         │
                         │
                   Layer 3 Switch
                ┌────────┼────────┐
                │        │        │
             VLAN 10  VLAN 20  VLAN 30
             Users    Servers  Guest`}</Pre>
      <P>Security policy:</P>
      <Pre>{`Users  → Servers    ✅
Users  → Internet   ✅

Guest  → Internet   ✅
Guest  → Users      ❌
Guest  → Servers    ❌`}</Pre>
      <P>This is a very common enterprise design pattern.</P>

      <H2>Router-on-a-Stick vs Layer 3 Switch</H2>
      <Table
        head={["Feature", "Router-on-a-Stick", "Layer 3 Switch"]}
        rows={[
          ["Routing performed by", "Router", "Switch"],
          ["VLANs", "Multiple", "Multiple"],
          ["Trunk required", "Yes", "Depends on design"],
          ["Suitable for", "Small networks / labs", "Medium / large LANs"],
          ["Performance", "Lower", "Usually higher"],
          ["Common enterprise design", "Less common for large LANs", "Very common"],
        ]}
      />

      <H2>Inter-VLAN Routing Example</H2>
      <P>
        PC1 (IP 192.168.10.50, gateway 192.168.10.1, VLAN 10) wants to reach a server (IP 192.168.20.50, gateway
        192.168.20.1, VLAN 20). The journey is:
      </P>
      <Pre>{`PC1
192.168.10.50
     │
     ▼
Switch
     │
     ▼
Gateway
192.168.10.1
     │
     │ Routing
     ▼
VLAN 20
192.168.20.0/24
     │
     ▼
Server
192.168.20.50`}</Pre>

      <H2>💡 Pulse-Speed Interactive Lab</H2>
      <P>
        Can 192.168.10.20 reach 192.168.20.20? Try it — then toggle a firewall policy to DENY and watch the packet
        journey change. Routing decides where traffic <i>can</i> go; security policy decides whether it is{" "}
        <i>allowed</i> to go there.
      </P>
      <InterVlanSimulator />

      <H2>Common Troubleshooting Checklist</H2>
      <P>If two VLANs can't communicate, check:</P>
      <UL>
        <li>
          1. Are both VLANs present? (<code>show vlan brief</code>)
        </li>
        <li>
          2. Is the switch port in the correct VLAN? (<code>show interfaces switchport</code>)
        </li>
        <li>
          3. Is the trunk working? (<code>show interfaces trunk</code>)
        </li>
        <li>4. Does the VLAN have a gateway? (Check the SVI or router interface)</li>
        <li>
          5. Is the SVI up? (<code>show ip interface brief</code>)
        </li>
        <li>
          6. Is IP routing enabled? (On many Cisco Layer 3 switches: <code>ip routing</code>)
        </li>
        <li>7. Are ACLs or firewall policies blocking traffic?</li>
        <li>8. Are the endpoints using the correct default gateway?</li>
      </UL>
      <P>This checklist is extremely useful in real-world troubleshooting.</P>

      <H2>Practice Challenge 🧠</H2>
      <P>
        You have three VLANs: VLAN 10 → Users (192.168.10.0/24), VLAN 20 → Servers (192.168.20.0/24), VLAN 30 → Guest
        (192.168.30.0/24). Create the gateway addresses, then decide which traffic should be allowed.
      </P>
      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        <RevealItem
          q="What gateway addresses would you assign to VLAN 10, 20 and 30?"
          a="A common convention is the first usable address of each subnet: VLAN 10 → 192.168.10.1, VLAN 20 → 192.168.20.1, VLAN 30 → 192.168.30.1. These are configured as SVIs (or router subinterfaces) and set as the default gateway on each host."
        />
        <RevealItem
          q="Users → Servers: allow or block?"
          a="ALLOW. Users legitimately need to reach internal services such as file servers, applications and intranet sites."
        />
        <RevealItem
          q="Users → Internet: allow or block?"
          a="ALLOW. Staff need outbound Internet access for daily work, typically filtered and inspected by the firewall."
        />
        <RevealItem
          q="Guest → Internet: allow or block?"
          a="ALLOW. Guest Wi-Fi exists to give visitors Internet access — but nothing more."
        />
        <RevealItem
          q="Guest → Users and Guest → Servers: allow or block?"
          a="BLOCK both. Guest devices are untrusted, so they must never reach internal user machines or servers. Only Guest → Internet should be permitted — segmentation plus controlled communication."
        />
      </div>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <UL>
        <li>✔ VLANs separate Layer 2 networks.</li>
        <li>✔ Different VLANs cannot communicate through Layer 2 switching alone.</li>
        <li>✔ Inter-VLAN routing allows communication between VLANs.</li>
        <li>✔ A router, Layer 3 switch, or firewall can perform the routing.</li>
        <li>✔ An SVI provides a Layer 3 interface for a VLAN on a Layer 3 switch.</li>
        <li>✔ The default gateway is the device/interface used by hosts to reach other networks.</li>
        <li>✔ Firewall rules and ACLs can control which VLANs are allowed to communicate.</li>
      </UL>

      <TryItCard
        to="/network-diagram"
        title="🔀 Network Diagram Builder"
        body="Model the small-office design from this lesson: three VLAN zones, a Layer 3 switch and a firewall, with labelled SVI gateways."
      />

      <div
        style={{
          marginTop: 40,
          padding: 20,
          borderRadius: 14,
          border: "1px solid #1f2740",
          background: "#0f1422",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>PREVIOUS LESSON</div>
          <Link to="/academy/vlans" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 16: VLANs Explained
          </Link>
        </div>
        <Link
          to="/academy"
          style={{
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to Academy →
        </Link>
      </div>
    </article>
  );
}

function Quiz() {
  const questions = [
    {
      q: "What is Inter-VLAN Routing?",
      options: [
        "Connecting two switches",
        "Routing traffic between different VLANs",
        "Assigning VLAN IDs",
        "Encrypting VLAN traffic",
      ],
      answer: 1,
    },
    {
      q: "What is required for communication between different VLANs?",
      options: ["DNS", "DHCP", "Layer 3 routing", "Another MAC address"],
      answer: 2,
    },
    {
      q: "What is an SVI?",
      options: [
        "Secure VLAN Internet",
        "Switched Virtual Interface",
        "Static VLAN Identifier",
        "Switch Virtual Internet",
      ],
      answer: 1,
    },
    {
      q: "Which device can perform Inter-VLAN Routing?",
      options: ["Layer 3 switch", "Router", "Firewall", "All of the above"],
      answer: 3,
    },
    {
      q: "What is the default gateway for a VLAN?",
      options: [
        "The switch's MAC address",
        "The Layer 3 interface used by hosts to reach other networks",
        "The DNS server",
        "The DHCP server",
      ],
      answer: 1,
    },
  ];
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {questions.map((q, i) => (
        <QuizItem key={i} q={q.q} options={q.options} answer={q.answer} index={i + 1} />
      ))}
    </div>
  );
}

function QuizItem({ q, options, answer, index }: { q: string; options: string[]; answer: number; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected === answer;
  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 12, padding: 16, background: "#0f1422" }}>
      <div style={{ color: "#fff", fontWeight: 600, marginBottom: 10 }}>
        {index}. {q}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isAnswer = i === answer;
          let border = "1px solid #1f2740";
          let bg = "#0b0f1a";
          let color = "#c8d0e0";
          if (selected !== null) {
            if (isAnswer) {
              border = "1px solid #00D4AA";
              bg = "rgba(0,212,170,0.12)";
              color = "#00D4AA";
            } else if (isSelected) {
              border = "1px solid #ff6b8a";
              bg = "rgba(233,69,96,0.10)";
              color = "#ff6b8a";
            }
          }
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border,
                background: bg,
                color,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 10, fontSize: 13, color: correct ? "#00D4AA" : "#ff6b8a", fontWeight: 600 }}>
          {correct ? "✅ Correct!" : "❌ Not quite. The correct answer is highlighted above."}
        </div>
      )}
    </div>
  );
}
