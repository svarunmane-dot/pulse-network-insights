import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson16-hero.jpg";

export const Route = createFileRoute("/academy/vlans")({
  head: () =>
    toolHead({
      path: "/academy/vlans",
      title: "Lesson 16: VLANs Explained (802.1Q) | Pulse Speed Academy",
      description:
        "Learn how VLANs create multiple logical networks on one switch: access vs trunk ports, 802.1Q tagging, native VLAN and inter-VLAN routing — with a VLAN simulator.",
      name: "Lesson 16 – VLANs Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What does VLAN stand for?",
          a: "VLAN stands for Virtual Local Area Network. It divides a physical switch into separate logical Layer 2 networks so one switch can host multiple independent networks.",
        },
        {
          q: "What is the difference between an access port and a trunk port?",
          a: "An access port normally carries traffic for a single VLAN and connects end devices such as laptops, printers and IP phones. A trunk port carries traffic for multiple VLANs between network devices, usually using 802.1Q VLAN tagging.",
        },
        {
          q: "Can devices in different VLANs communicate?",
          a: "Not through Layer 2 switching alone. Traffic between VLANs requires a Layer 3 device such as a router, Layer 3 switch or firewall. This process is called inter-VLAN routing.",
        },
        {
          q: "What is the native VLAN on an 802.1Q trunk?",
          a: "The native VLAN is the VLAN whose traffic is sent untagged across an 802.1Q trunk. The native VLAN must be configured consistently on both ends of the trunk and deserves security attention in enterprise networks.",
        },
      ],
    }),
  component: Lesson16,
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

/* ---------------- Interactive VLAN Simulator ---------------- */

type VlanId = 10 | 20 | 30;

const VLANS: { id: VlanId; name: string; subnet: string; color: string }[] = [
  { id: 10, name: "IT", subnet: "192.168.10.0/24", color: "#00D4AA" },
  { id: 20, name: "Finance", subnet: "192.168.20.0/24", color: "#9B8FE8" },
  { id: 30, name: "HR", subnet: "192.168.30.0/24", color: "#ffb450" },
];

const vlanMeta = (id: VlanId) => VLANS.find((v) => v.id === id)!;

const DEFAULT_PORTS: VlanId[] = [10, 10, 20, 20, 30, 30, 10, 20];

type Result = {
  ok: boolean;
  headline: string;
  lines: string[];
};

function VlanSimulator() {
  const [ports, setPorts] = useState<VlanId[]>(DEFAULT_PORTS);
  const [routing, setRouting] = useState(false);
  const [srcPort, setSrcPort] = useState(1);
  const [dstPort, setDstPort] = useState(3);
  const [result, setResult] = useState<Result | null>(null);

  const setPortVlan = (index: number, vlan: VlanId) => {
    setPorts((prev) => prev.map((v, i) => (i === index ? vlan : v)));
    setResult(null);
  };

  const test = () => {
    if (srcPort === dstPort) {
      setResult({ ok: false, headline: "Pick two different ports", lines: ["A device can't ping itself here."] });
      return;
    }
    const sv = ports[srcPort - 1];
    const dv = ports[dstPort - 1];
    const s = vlanMeta(sv);
    const d = vlanMeta(dv);
    if (sv === dv) {
      setResult({
        ok: true,
        headline: `✅ Allowed at Layer 2 — same VLAN (${sv} ${s.name})`,
        lines: [
          `PC on Port ${srcPort} → PC on Port ${dstPort}`,
          `VLAN ${sv} → VLAN ${dv}`,
          `Both ports are in the same broadcast domain (${s.subnet}).`,
          "The switch forwards the frame directly — no router involved.",
        ],
      });
      return;
    }
    if (routing) {
      setResult({
        ok: true,
        headline: `✅ Allowed via inter-VLAN routing (VLAN ${sv} → VLAN ${dv})`,
        lines: [
          `PC on Port ${srcPort} (${s.subnet}) → PC on Port ${dstPort} (${d.subnet})`,
          "Different subnets, so the PC sends the frame to its default gateway.",
          "The Layer 3 device routes the packet between the two VLAN interfaces (SVIs).",
          "In a real network an ACL or firewall policy could still block this.",
        ],
      });
      return;
    }
    setResult({
      ok: false,
      headline: `❌ Blocked — VLAN ${sv} (${s.name}) cannot reach VLAN ${dv} (${d.name})`,
      lines: [
        `PC on Port ${srcPort} (${s.subnet}) → PC on Port ${dstPort} (${d.subnet})`,
        "Different VLANs = different Layer 2 broadcast domains and different subnets.",
        "A plain Layer 2 switch will not route between them.",
        "Enable the Layer 3 router below to allow inter-VLAN routing.",
      ],
    });
  };

  return (
    <div
      style={{
        border: "1px solid #1f2740",
        borderRadius: 14,
        background: "#0f1422",
        padding: 18,
        marginTop: 16,
      }}
    >
      <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>🧪 VLAN Network Simulator</div>
      <div style={{ color: "#6b7794", fontSize: 13, marginTop: 4 }}>
        Assign a VLAN to each of the 8 switch ports, then test connectivity between two ports.
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
          8-PORT SWITCH
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
          {ports.map((v, i) => {
            const meta = vlanMeta(v);
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${meta.color}55`,
                  background: `${meta.color}12`,
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Port {i + 1}</div>
                <div style={{ color: meta.color, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                  VLAN {v} · {meta.name}
                </div>
                <select
                  value={v}
                  onChange={(e) => setPortVlan(i, Number(e.target.value) as VlanId)}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    background: "#0b0f1a",
                    color: "#c8d0e0",
                    border: "1px solid #1f2740",
                    borderRadius: 8,
                    padding: "6px 8px",
                    fontSize: 12,
                  }}
                >
                  {VLANS.map((vl) => (
                    <option key={vl.id} value={vl.id}>
                      VLAN {vl.id} – {vl.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 16 }}>
        <label style={{ color: "#c8d0e0", fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>Source port</div>
          <select
            value={srcPort}
            onChange={(e) => {
              setSrcPort(Number(e.target.value));
              setResult(null);
            }}
            style={{
              background: "#0b0f1a",
              color: "#c8d0e0",
              border: "1px solid #1f2740",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            {ports.map((_, i) => (
              <option key={i} value={i + 1}>
                Port {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label style={{ color: "#c8d0e0", fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>Destination port</div>
          <select
            value={dstPort}
            onChange={(e) => {
              setDstPort(Number(e.target.value));
              setResult(null);
            }}
            style={{
              background: "#0b0f1a",
              color: "#c8d0e0",
              border: "1px solid #1f2740",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            {ports.map((_, i) => (
              <option key={i} value={i + 1}>
                Port {i + 1}
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
            setPorts(DEFAULT_PORTS);
            setRouting(false);
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

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 14,
          color: "#c8d0e0",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={routing}
          onChange={(e) => {
            setRouting(e.target.checked);
            setResult(null);
          }}
        />
        Add a Layer 3 router / SVIs and enable <B>inter-VLAN routing</B>
      </label>

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
          <ul style={{ color: "#c8d0e0", fontSize: 14, lineHeight: 1.7, margin: "8px 0 0", paddingLeft: 20 }}>
            {result.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Practice challenge ---------------- */

function PracticeLab() {
  const items = [
    { q: "Question 1: Which VLAN is Port 5 in?", a: "VLAN 10 — ports 1–8 are all assigned to VLAN 10 (IT)." },
    {
      q: "Question 2: Can a device on VLAN 10 directly communicate with VLAN 20?",
      a: "No. They are separate Layer 2 broadcast domains and separate subnets, so Layer 2 switching alone cannot deliver the traffic.",
    },
    { q: "Question 3: What type of port is Port 24?", a: "A trunk port — it carries multiple VLANs to another switch." },
    {
      q: "Question 4: What device would be required for VLAN 10 to communicate with VLAN 20?",
      a: "A Layer 3 device: a router, a Layer 3 switch, or a firewall performing inter-VLAN routing.",
    },
  ];
  return (
    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
      {items.map((it, i) => (
        <RevealItem key={i} q={it.q} a={it.a} />
      ))}
    </div>
  );
}

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

function Lesson16() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 16 · BEGINNER · ⏱️ 12–15 MIN READ
      </div>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: "-1px",
          margin: "8px 0 12px",
          color: "#fff",
          lineHeight: 1.1,
        }}
      >
        VLANs Explained – How to Create Multiple Networks on One Switch
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        One physical switch, many logical networks. Learn access ports, trunk ports, 802.1Q tagging and inter-VLAN
        routing — then build your own VLANs in the simulator.
      </p>

      <img
        src={heroImg}
        alt="One network switch split into colour-coded VLANs for IT, Finance, HR and Guest departments"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>Imagine a company has one 48-port switch. They want separate networks for:</P>
      <UL>
        <li>👨‍💻 IT</li>
        <li>💰 Finance</li>
        <li>👥 HR</li>
        <li>🧑‍💼 Management</li>
      </UL>
      <P>
        One option would be to buy four separate switches. But there's a better solution: <B>VLANs</B>. A VLAN lets you
        create multiple logical networks on the same physical switch.
      </P>

      <H2>What is a VLAN?</H2>
      <P>
        VLAN stands for <B>Virtual Local Area Network</B>. A VLAN divides a physical switch into separate logical Layer
        2 networks.
      </P>
      <Pre>{`                48-Port Switch
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    VLAN 10        VLAN 20       VLAN 30
      IT           Finance          HR`}</Pre>
      <P>
        Even though all devices are connected to the same physical switch, VLANs keep their Layer 2 traffic logically
        separated.
      </P>

      <H2>Why Do We Need VLANs?</H2>
      <P>Imagine an office with 100 employees. Without VLANs:</P>
      <Pre>{`                    Switch
                      │
       ┌──────────────┼──────────────┐
       │              │              │
      IT           Finance           HR`}</Pre>
      <P>Everyone is effectively part of the same Layer 2 broadcast domain. That can make the network:</P>
      <UL>
        <li>Harder to manage</li>
        <li>Less secure</li>
        <li>More difficult to troubleshoot</li>
        <li>Larger than necessary</li>
      </UL>
      <P>With VLANs:</P>
      <Pre>{`             One Physical Switch
                    │
       ┌────────────┼────────────┐
       │            │            │
    VLAN 10       VLAN 20      VLAN 30
       │            │            │
      IT         Finance         HR`}</Pre>
      <P>Now each VLAN represents a separate Layer 2 broadcast domain.</P>

      <H2>A Real-World Example</H2>
      <Table
        head={["Department", "VLAN", "Network"]}
        rows={[
          ["IT", "10", "192.168.10.0/24"],
          ["Finance", "20", "192.168.20.0/24"],
          ["HR", "30", "192.168.30.0/24"],
          ["Guest", "40", "192.168.40.0/24"],
        ]}
      />
      <P>You could have one physical switch:</P>
      <Pre>{`Port 1–10   → VLAN 10 → IT
Port 11–20  → VLAN 20 → Finance
Port 21–30  → VLAN 30 → HR
Port 31–40  → VLAN 40 → Guest`}</Pre>
      <P>The remaining ports could be used for other purposes.</P>

      <H2>VLANs Create Separate Broadcast Domains</H2>
      <P>This is one of the most important things to understand. Suppose IT is VLAN 10 (192.168.10.0/24) and Finance
        is VLAN 20 (192.168.20.0/24). If an IT computer sends an Ethernet broadcast to{" "}
        <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>FF:FF:FF:FF:FF:FF</code>, the switch forwards that
        broadcast within VLAN 10. It does not normally cross into VLAN 20.</P>
      <Pre>{`VLAN 10                    VLAN 20

PC ──► Broadcast            PC
 │                           │
 ├──► PC                     │ ❌
 ├──► PC                     │
 └──► PC                     │`}</Pre>
      <P>That's a major benefit of VLANs.</P>

      <H2>VLANs Are Logical, Not Physical</H2>
      <P>The devices don't have to be connected to separate physical switches.</P>
      <Pre>{`                ONE SWITCH

Port 1  → VLAN 10
Port 2  → VLAN 20
Port 3  → VLAN 10
Port 4  → VLAN 30
Port 5  → VLAN 20
Port 6  → VLAN 10`}</Pre>
      <P>The switch keeps the traffic logically separated.</P>

      <H2>Access Ports</H2>
      <P>A port connected to a normal end device is commonly configured as an access port.</P>
      <Pre>{`Laptop
   │
   │
Port 5
   │
Switch
VLAN 10`}</Pre>
      <P>
        The laptop normally doesn't need to know that VLAN 10 exists — the switch associates the port with VLAN 10.
      </P>
      <P>Example Cisco configuration:</P>
      <Pre>{`interface GigabitEthernet1/0/5
 switchport mode access
 switchport access vlan 10`}</Pre>
      <P>Now anything connected to that port belongs to VLAN 10.</P>

      <H2>Trunk Ports</H2>
      <P>Now imagine you have two switches, and VLAN 10 and VLAN 20 need to exist on both.</P>
      <Pre>{`      Switch 1
     /         \\
VLAN 10       VLAN 20
      \\         /
       ========
        Trunk
       ========
      /         \\
VLAN 10       VLAN 20
     Switch 2`}</Pre>
      <P>
        A normal access port carries traffic for one VLAN. A <B>trunk port</B> can carry traffic for multiple VLANs.
      </P>
      <Pre>{`Switch 1
   │
   │ Trunk
   │ VLAN 10,20,30
   ▼
Switch 2`}</Pre>

      <H2>Why Do We Need Trunks?</H2>
      <P>Imagine three floors in a building, each with its own switch, and you want the same VLANs on every floor.</P>
      <Pre>{`Floor 1 Switch
      │
      ▼
   Trunk Link
      │
      ▼
Floor 2 Switch
      │
      ▼
   Trunk Link
      │
      ▼
Floor 3 Switch`}</Pre>
      <P>The trunk carries traffic for multiple VLANs between the switches.</P>

      <H2>VLAN Tagging (802.1Q)</H2>
      <P>
        When multiple VLANs travel across a trunk, the network needs a way to identify which VLAN each Ethernet frame
        belongs to. A common standard for this is <B>IEEE 802.1Q</B>. A VLAN tag is inserted into the Ethernet frame.
      </P>
      <Pre>{`┌───────────┬───────────┬────────────┬─────────┐
│ Dest MAC  │ Source MAC│ VLAN Tag   │ Payload │
└───────────┴───────────┴────────────┴─────────┘`}</Pre>
      <P>The VLAN tag tells the receiving switch which VLAN the frame belongs to.</P>

      <H2>Access vs Trunk</H2>
      <Table
        head={["Access Port", "Trunk Port"]}
        rows={[
          ["Usually one VLAN", "Multiple VLANs"],
          ["Used for end devices", "Used between network devices"],
          ["Laptop, printer, IP phone", "Switch to switch, switch to router/firewall"],
          ["Usually untagged client traffic", "Carries VLAN-tagged traffic"],
        ]}
      />
      <P>There are exceptions and more advanced designs, but this is the right starting point.</P>

      <H2>Can Devices in Different VLANs Communicate?</H2>
      <P>Not through Layer 2 switching alone.</P>
      <Pre>{`VLAN 10
192.168.10.0/24

       ❌

VLAN 20
192.168.20.0/24`}</Pre>
      <P>You need a Layer 3 device — a router, a Layer 3 switch, or a firewall. This is called inter-VLAN routing.</P>

      <H2>Inter-VLAN Routing</H2>
      <Pre>{`VLAN 10                    VLAN 20
IT                         Finance

192.168.10.0/24           192.168.20.0/24
      │                         │
      └────────┐   ┌────────────┘
               ▼   ▼
             Router
               │
         Layer 3 Routing`}</Pre>
      <P>The router or Layer 3 switch can decide whether traffic between VLANs is allowed. For example:</P>
      <Pre>{`IT → Finance       ❌
IT → Server        ✅
Guest → Internet   ✅
Guest → Finance    ❌`}</Pre>
      <P>This is where VLANs become very useful for security and network policy.</P>

      <H2>VLANs and IP Subnets</H2>
      <P>
        VLANs and IP subnets are not technically the same thing, but in many designs they are mapped one-to-one.
      </P>
      <Pre>{`VLAN 10  →  192.168.10.0/24
VLAN 20  →  192.168.20.0/24
VLAN 30  →  192.168.30.0/24`}</Pre>
      <Callout tone="info" title="💡 BEGINNER RULE">
        One VLAN = one IP subnet is a very common design. But don't treat that as a universal law — advanced designs can
        differ.
      </Callout>
      <TryItCard
        to="/subnet-calculator"
        title="🧮 IP Subnet Calculator"
        body="Work out the network, broadcast and usable host range for each VLAN subnet in this lesson."
      />

      <H2>Example: Office Network</H2>
      <P>Let's design a small company network.</P>
      <Table
        head={["Department", "VLAN", "Subnet"]}
        rows={[
          ["IT", "10", "192.168.10.0/24"],
          ["Finance", "20", "192.168.20.0/24"],
          ["HR", "30", "192.168.30.0/24"],
          ["Guest Wi-Fi", "40", "192.168.40.0/24"],
        ]}
      />
      <Pre>{`                         Firewall/Router
                              │
                         Layer 3 Routing
                              │
                         Core Switch
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           VLAN 10         VLAN 20         VLAN 30
              │               │               │
             IT            Finance             HR

                              │
                           VLAN 40
                              │
                           Guests`}</Pre>
      <P>Now you can create policies such as:</P>
      <Pre>{`IT → Servers       ✅
Finance → Servers  ✅
HR → Servers       ✅
Guest → Internet   ✅
Guest → IT         ❌
Guest → Finance    ❌
Guest → HR         ❌`}</Pre>
      <P>That's much more manageable than putting everybody into one network.</P>

      <H2>VLAN IDs</H2>
      <P>VLANs are identified by a VLAN ID. The exact numbering is up to the network design.</P>
      <Pre>{`10 = IT
20 = Finance
30 = HR
40 = Guest
50 = Servers
60 = Voice`}</Pre>
      <P>Using a consistent numbering scheme makes large networks much easier to troubleshoot.</P>

      <H2>What is the Native VLAN?</H2>
      <P>
        On an 802.1Q trunk, one VLAN can be designated as the <B>native VLAN</B>. Traffic belonging to the native VLAN
        is typically sent untagged on the trunk.
      </P>
      <Pre>{`Trunk

VLAN 10 → Tagged
VLAN 20 → Tagged
VLAN 30 → Tagged
Native VLAN → Untagged`}</Pre>
      <Callout tone="warn" title="⚠️ SECURITY NOTE">
        Native VLAN configuration must be consistent across connected devices. In enterprise networks, native VLAN
        design also deserves security attention.
      </Callout>

      <H2>Common VLAN Mistakes</H2>
      <UL>
        <li>
          ❌ <B>"VLANs are just different IP ranges."</B> A VLAN is Layer 2 logical segmentation; IP subnets operate at
          Layer 3. They are often paired, but they aren't the same thing.
        </li>
        <li>
          ❌ <B>"A trunk means Internet."</B> A trunk is simply a link capable of carrying traffic for multiple VLANs.
        </li>
        <li>
          ❌ <B>"Devices in different VLANs can communicate automatically."</B> Traffic between VLANs requires Layer 3
          routing.
        </li>
        <li>
          ❌ <B>"Every port on a switch has to be in VLAN 1."</B> Ports can be assigned to different VLANs according to
          the design.
        </li>
      </UL>

      <H2>💡 Pulse-Speed Interactive Lab</H2>
      <P>
        Here's your virtual 8-port switch. Assign VLANs to the ports, then test whether two devices can talk. Turn on
        the Layer 3 router to see inter-VLAN routing in action.
      </P>
      <VlanSimulator />

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <UL>
        <li>✔ VLAN stands for Virtual Local Area Network.</li>
        <li>✔ VLANs allow one physical switch to host multiple logical networks.</li>
        <li>✔ Each VLAN represents a separate Layer 2 broadcast domain.</li>
        <li>✔ Access ports are commonly used for end devices.</li>
        <li>✔ Trunk ports carry multiple VLANs between network devices.</li>
        <li>✔ 802.1Q is commonly used for VLAN tagging.</li>
        <li>✔ Devices in different VLANs require Layer 3 routing to communicate.</li>
        <li>✔ VLANs are widely used for segmentation, security and network organisation.</li>
      </UL>

      <H2>Practice What You've Learned</H2>
      <P>Imagine you have a 24-port switch. Design the following:</P>
      <Pre>{`Ports 1–8    → VLAN 10 → IT
Ports 9–14   → VLAN 20 → Finance
Ports 15–19  → VLAN 30 → HR
Ports 20–23  → VLAN 40 → Guest
Port 24      → Trunk to another switch`}</Pre>
      <P>Now answer these four questions — if you can, you've understood the core concept.</P>
      <PracticeLab />

      <TryItCard
        to="/network-diagram"
        title="🔀 Network Diagram Builder"
        body="Draw VLAN zones, drop in switches and a router, and label uplink interfaces to model the office design from this lesson."
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
          <Link to="/academy/network-switches" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 15: How Network Switches Work
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
      q: "What does VLAN stand for?",
      options: [
        "Virtual Local Access Network",
        "Virtual Local Area Network",
        "Virtual Layer Access Network",
        "Variable Local Area Network",
      ],
      answer: 1,
    },
    {
      q: "What does a VLAN primarily create?",
      options: [
        "A new Internet connection",
        "A separate Layer 2 broadcast domain",
        "A new DNS server",
        "A new physical switch",
      ],
      answer: 1,
    },
    {
      q: "Which port type normally connects an end device to a single VLAN?",
      options: ["Access port", "Trunk port", "Routed port", "WAN port"],
      answer: 0,
    },
    {
      q: "Which port type carries multiple VLANs?",
      options: ["Access", "Trunk", "Console", "Management"],
      answer: 1,
    },
    {
      q: "What is required for communication between VLAN 10 and VLAN 20?",
      options: ["DNS", "DHCP", "Layer 3 routing", "Another MAC address"],
      answer: 2,
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
