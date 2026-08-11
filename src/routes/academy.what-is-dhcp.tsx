import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson13-hero.jpg";

export const Route = createFileRoute("/academy/what-is-dhcp")({
  head: () =>
    toolHead({
      path: "/academy/what-is-dhcp",
      title: "Lesson 13: DHCP Explained – How Devices Get an IP Address | Pulse Speed Academy",
      description:
        "Learn what DHCP is, how the DORA process (Discover, Offer, Request, Acknowledge) works, DHCP leases, pools, reservations and DHCP relay — with an interactive DORA simulator.",
      name: "Lesson 13 – DHCP Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What does DHCP stand for?",
          a: "DHCP stands for Dynamic Host Configuration Protocol. It automatically provides devices with an IP address, subnet mask, default gateway, DNS server and lease time when they join a network.",
        },
        {
          q: "What is the DORA process in DHCP?",
          a: "DORA stands for Discover, Offer, Request and Acknowledge — the four messages exchanged between a client and a DHCP server to assign an IP address.",
        },
        {
          q: "Why does my device get a 169.254.x.x address?",
          a: "A 169.254.x.x address is an APIPA address. It usually means the device could not reach a DHCP server and self-assigned an address, so normal network access will not work.",
        },
      ],
    }),
  component: Lesson13,
});

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: "#fff", fontSize: 24, marginTop: 40, letterSpacing: "-0.3px" }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.75, margin: "10px 0" }}>{children}</p>
);
const Code = ({ children }: { children: React.ReactNode }) => (
  <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>{children}</code>
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
                    fontFamily: /\d+\.\d+\.\d+/.test(c) ? "monospace" : undefined,
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

/* ---------------- Interactive DORA simulator ---------------- */

type Msg = { from: "client" | "server"; label: string; text: string };

const DORA: Msg[] = [
  { from: "client", label: "1️⃣ DHCP DISCOVER", text: "Is there a DHCP server available? (broadcast)" },
  { from: "server", label: "2️⃣ DHCP OFFER", text: "I can offer 192.168.1.25 with a 24 hour lease." },
  { from: "client", label: "3️⃣ DHCP REQUEST", text: "I would like to use 192.168.1.25 please." },
  { from: "server", label: "4️⃣ DHCP ACK", text: "Approved. The address is yours for 24 hours." },
];

function DoraSimulator() {
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const done = step >= DORA.length;

  const reset = () => {
    setStep(0);
    setFailed(false);
  };

  return (
    <div
      style={{
        border: "1px solid rgba(0,212,170,0.35)",
        borderRadius: 16,
        padding: 20,
        background: "linear-gradient(135deg, rgba(0,212,170,0.06), rgba(155,143,232,0.05))",
        margin: "16px 0",
      }}
    >
      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        💡 PULSE-SPEED INTERACTIVE LAB
      </div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 4 }}>DHCP DORA Simulator</div>
      <p style={{ color: "#c8d0e0", fontSize: 14, margin: "6px 0 14px" }}>
        Click through each stage and watch a laptop obtain its IP address — or simulate a DHCP failure.
      </p>

      {failed ? (
        <div>
          <div
            style={{
              border: "1px solid rgba(255,107,138,0.4)",
              background: "rgba(233,69,96,0.08)",
              borderRadius: 12,
              padding: 16,
              fontFamily: "monospace",
              color: "#ff6b8a",
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            DHCP Server ❌
            <br />
            <span style={{ color: "#6b7794" }}>│</span>
            <br />
            <span style={{ color: "#c8d0e0" }}>Client sends DISCOVER…</span>
            <br />
            <span style={{ color: "#6b7794" }}>▼</span>
            <br />
            No DHCP response
            <br />
            <span style={{ color: "#6b7794" }}>▼</span>
            <br />
            169.254.x.x (APIPA)
            <br />
            <span style={{ color: "#6b7794" }}>▼</span>
            <br />
            No normal network access
          </div>
          <Table
            head={["Symptom", "Result"]}
            rows={[
              ["IPv4 Address", "169.254.34.180"],
              ["Default Gateway", "(none)"],
              ["DNS", "Unavailable"],
              ["Internet", "❌ Not working"],
            ]}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {DORA.slice(0, step).map((m) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                justifyContent: m.from === "client" ? "flex-start" : "flex-end",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  border: `1px solid ${m.from === "client" ? "#1f2740" : "rgba(0,212,170,0.4)"}`,
                  background: m.from === "client" ? "#0f1422" : "rgba(0,212,170,0.10)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: m.from === "client" ? "#9B8FE8" : "#00D4AA",
                  }}
                >
                  {m.from === "client" ? "💻 LAPTOP" : "🖧 DHCP SERVER"} · {m.label}
                </div>
                <div style={{ color: "#c8d0e0", fontSize: 14, marginTop: 4 }}>{m.text}</div>
              </div>
            </div>
          ))}
          {step === 0 && (
            <div style={{ color: "#6b7794", fontSize: 14, fontFamily: "monospace", textAlign: "center", padding: 12 }}>
              Laptop connected to Wi-Fi · no IP address yet
            </div>
          )}
          {done && (
            <div style={{ marginTop: 4 }}>
              <div style={{ color: "#00D4AA", fontWeight: 700, fontSize: 14 }}>✅ IP configuration applied</div>
              <Table
                head={["Setting", "Value"]}
                rows={[
                  ["IP Address", "192.168.1.25"],
                  ["Subnet Mask", "255.255.255.0"],
                  ["Default Gateway", "192.168.1.1"],
                  ["DNS Server", "1.1.1.1"],
                  ["Lease Time", "24 hours"],
                ]}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {!failed && !done && (
          <button
            onClick={() => setStep((s) => s + 1)}
            style={{
              background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
              color: "#04150f",
              border: "none",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {step === 0 ? "Start DORA →" : `Next: ${DORA[step]!.label.replace(/^\S+\s/, "")} →`}
          </button>
        )}
        {!failed && (
          <button
            onClick={() => {
              setFailed(true);
              setStep(0);
            }}
            style={{
              border: "1px solid rgba(255,107,138,0.4)",
              background: "transparent",
              color: "#ff6b8a",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            What happens if DHCP fails?
          </button>
        )}
        {(failed || step > 0) && (
          <button
            onClick={reset}
            style={{
              border: "1px solid #1f2740",
              background: "#0f1422",
              color: "#c8d0e0",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↻ Reset
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Lesson ---------------- */

function Lesson13() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 13 · BEGINNER · ⏱️ 12 MIN READ
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
        DHCP Explained – How Your Devices Automatically Get an IP Address
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Learn how DHCP hands out IP addresses using the DORA process, what a lease is, and why a 169.254 address
        means something has gone wrong.
      </p>

      <img
        src={heroImg}
        alt="DHCP diagram showing a router assigning IP addresses to a laptop, phone and printer"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>You connect your laptop to Wi-Fi. Within seconds it can access the Internet, reach your printer, talk to your router and resolve websites through DNS.</P>
      <P>But how did your laptop get its IP address? You probably didn't manually configure any of this:</P>
      <Pre>{`IP Address:      192.168.1.25
Subnet Mask:     255.255.255.0
Default Gateway: 192.168.1.1
DNS Server:      1.1.1.1`}</Pre>
      <P>Something configured all of that automatically. That something is <strong style={{ color: "#fff" }}>DHCP</strong>.</P>

      <H2>What is DHCP?</H2>
      <P>DHCP stands for <strong style={{ color: "#fff" }}>Dynamic Host Configuration Protocol</strong>. It automatically provides network configuration to devices when they join a network.</P>
      <P>Instead of manually configuring every laptop, phone, printer or server, a DHCP server can provide:</P>
      <UL>
        <li>🌐 IP Address</li>
        <li>🧮 Subnet Mask</li>
        <li>🚪 Default Gateway</li>
        <li>🔍 DNS Server</li>
        <li>⏱️ Lease Time</li>
      </UL>
      <Callout tone="info" title="Think of DHCP like a hotel reception">
        You don't choose your own room number. Reception gives you room 205, floor 2, checkout Friday. DHCP says:
        "Here is your IP address, here is your network, here is your gateway and DNS server — you can use them for
        this amount of time."
      </Callout>

      <H2>DHCP in a Home Network</H2>
      <Pre>{`                 Internet
                    │
                    ▼
             ┌────────────┐
             │   Router   │
             │ DHCP Server│
             └─────┬──────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
      Laptop     Phone      Printer
   192.168.1.10   .20        .30`}</Pre>
      <P>Your home router usually performs several jobs at once: router, DHCP server, DNS forwarder, firewall and Wi-Fi access point.</P>

      <H2>How DHCP Works: DORA</H2>
      <P>DHCP commonly uses a four-step process known as <strong style={{ color: "#fff" }}>DORA</strong>.</P>
      <Table
        head={["Step", "Meaning"]}
        rows={[
          ["D", "Discover"],
          ["O", "Offer"],
          ["R", "Request"],
          ["A", "Acknowledge"],
        ]}
      />

      <H2>Try the DORA Simulator</H2>
      <DoraSimulator />

      <H2>Step by Step</H2>
      <P><strong style={{ color: "#fff" }}>1️⃣ DHCP Discover</strong> — your laptop joins the network with no IP address yet, so it broadcasts: "Is there a DHCP server available?" It must broadcast because it doesn't yet know where the server is.</P>
      <P><strong style={{ color: "#fff" }}>2️⃣ DHCP Offer</strong> — the server replies: "I can give you this IP address."</P>
      <Pre>{`IP Address:      192.168.1.25
Subnet Mask:     255.255.255.0
Gateway:         192.168.1.1
DNS:             1.1.1.1
Lease:           24 hours`}</Pre>
      <P><strong style={{ color: "#fff" }}>3️⃣ DHCP Request</strong> — the device accepts: "I'd like to use that IP address."</P>
      <P><strong style={{ color: "#fff" }}>4️⃣ DHCP Acknowledgement</strong> — the server confirms with a DHCP ACK, and the device configures its network interface.</P>
      <Pre>{`        Laptop                         DHCP Server

          │──── DHCP DISCOVER ────────►│
          │                            │
          │◄──── DHCP OFFER ───────────│
          │                            │
          │──── DHCP REQUEST ─────────►│
          │                            │
          │◄──── DHCP ACK ─────────────│
          ▼
     IP Configured`}</Pre>

      <H2>What Information Does DHCP Provide?</H2>
      <Table
        head={["Setting", "Example Value"]}
        rows={[
          ["IP Address", "192.168.1.25"],
          ["Subnet Mask", "255.255.255.0"],
          ["Default Gateway", "192.168.1.1"],
          ["DNS Server", "192.168.1.1"],
          ["Lease Time", "24 hours"],
        ]}
      />
      <P>Your device now knows who it is, which network it belongs to, where to send traffic outside its network, and which DNS server to use.</P>

      <H2>What is a DHCP Lease?</H2>
      <P>DHCP addresses are normally <strong style={{ color: "#fff" }}>leased</strong> rather than permanently assigned. After the lease period the device may renew its address, which lets networks reuse IP addresses efficiently.</P>
      <P>Imagine a coffee shop with 500 customers a day but only 100 available addresses. Not everyone needs an address permanently, so DHCP reuses them as devices come and go.</P>

      <H2>DHCP Pool</H2>
      <P>A DHCP server usually has a range of addresses available for clients:</P>
      <Pre>{`DHCP Pool:

192.168.1.100
      ↓
192.168.1.200

Laptop  → 192.168.1.100
Phone   → 192.168.1.101
Tablet  → 192.168.1.102
Printer → 192.168.1.103`}</Pre>

      <H2>DHCP Reservation</H2>
      <P>Sometimes you want a device to always receive the same address while still using DHCP. That's a <strong style={{ color: "#fff" }}>reservation</strong>.</P>
      <Table
        head={["Printer MAC Address", "Reserved IP"]}
        rows={[["AA:BB:CC:11:22:33", "192.168.1.50"]]}
      />
      <P>This is extremely useful for printers, CCTV cameras, network appliances, servers and IoT devices.</P>

      <H2>DHCP vs Static IP</H2>
      <P>With DHCP the flow is simply: device → DHCP server → IP configuration. It's automatic, easy to manage, centralised and ideal for large networks.</P>
      <P>With a static IP you configure everything manually:</P>
      <Pre>{`IP:       192.168.1.50
Mask:     255.255.255.0
Gateway:  192.168.1.1
DNS:      1.1.1.1`}</Pre>
      <P>That's useful for devices that need a predictable address.</P>

      <H2>DHCP vs DNS</H2>
      <Table
        head={["DHCP", "DNS"]}
        rows={[
          ["Gives devices network configuration", "Resolves names to IP addresses"],
          ["Provides IP addresses", "Finds IP addresses"],
          ["Configures the gateway", "Doesn't configure the gateway"],
          ["Configures the DNS server setting", "Doesn't assign IP addresses"],
        ]}
      />
      <P>Think of it this way: DHCP says "here is your network configuration"; DNS says "here is the IP address for that name."</P>

      <H2>What Happens if DHCP Stops Working?</H2>
      <P>If your laptop connects to Wi-Fi but cannot get an IP address, you may see an address like <Code>169.254.x.x</Code>. That's an <strong style={{ color: "#fff" }}>APIPA</strong> address in IPv4, and it usually means no DHCP server responded.</P>
      <UL>
        <li>❌ Internet may not work</li>
        <li>❌ Network communication may fail</li>
        <li>❌ DNS may not work correctly</li>
      </UL>

      <H2>How to Check DHCP on Windows</H2>
      <Pre>{`ipconfig /all

DHCP Enabled . . . . . . : Yes
IPv4 Address . . . . . . : 192.168.1.25
Subnet Mask  . . . . . . : 255.255.255.0
Default Gateway  . . . . : 192.168.1.1
DHCP Server  . . . . . . : 192.168.1.1
DNS Servers  . . . . . . : 192.168.1.1`}</Pre>
      <P>The <strong style={{ color: "#fff" }}>DHCP Server</strong> field tells you which device provided your network configuration.</P>

      <H2>Real-World Enterprise DHCP</H2>
      <P>Large organisations don't necessarily run DHCP on the user's local router:</P>
      <Pre>{`Client
   │
   ▼
Access Switch
   │
   ▼
VLAN
   │
   ▼
Layer 3 Gateway
   │
   ▼
DHCP Server`}</Pre>
      <Pre>{`VLAN 10 → 192.168.10.0/24
VLAN 20 → 192.168.20.0/24
VLAN 30 → 192.168.30.0/24`}</Pre>
      <P>Each VLAN can have its own DHCP scope — this is where DHCP becomes particularly important for network engineers.</P>

      <H2>What is DHCP Relay?</H2>
      <P>DHCP clients initially use broadcasts, and routers normally do not forward broadcasts between networks. So how can a DHCP server on another network provide an address? With a <strong style={{ color: "#fff" }}>DHCP relay</strong>.</P>
      <Pre>{`Client
192.168.10.25
     │
     ▼
Router / L3 Switch
     │
     │ DHCP Relay
     ▼
DHCP Server
192.168.100.10`}</Pre>
      <P>In Cisco networks you'll commonly see:</P>
      <Pre>{`ip helper-address 192.168.100.10`}</Pre>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ DHCP and DNS are the same thing">
        They aren't. DHCP configures your device; DNS resolves names.
      </Callout>
      <Callout tone="warn" title="❌ DHCP always gives the same IP">
        DHCP addresses are leased and can change. If you need predictable addressing, use a static IP or a DHCP
        reservation.
      </Callout>
      <Callout tone="warn" title="❌ DHCP is only used at home">
        Enterprise networks rely heavily on DHCP across multiple VLANs and subnets.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <UL>
        <li>✔ DHCP automatically configures network devices.</li>
        <li>✔ It commonly provides an IP address, subnet mask, gateway, DNS server and lease time.</li>
        <li>✔ The four main steps are Discover, Offer, Request, Acknowledge (DORA).</li>
        <li>✔ Leases allow IP addresses to be reused.</li>
        <li>✔ Reservations let devices consistently receive the same IP.</li>
        <li>✔ Enterprise networks often use DHCP relay to reach central DHCP servers.</li>
      </UL>

      <H2>Practice What You've Learned</H2>
      <P>
        On your own computer run <Code>ipconfig /all</Code> and find your IPv4 address, subnet mask, default
        gateway, DHCP server and DNS servers. Then answer: who gave my computer its IP address? That's your DHCP
        server.
      </P>
      <TryItCard
        to="/subnet-calculator"
        title="🧮 IP Subnet Calculator"
        body="Enter the IP and subnet mask DHCP gave you and see the network, broadcast and usable range."
      />
      <TryItCard
        to="/dns-lookup"
        title="🔍 DNS Lookup"
        body="Test the DNS server DHCP handed your device by resolving a domain name."
      />
      <TryItCard
        to="/ping-ip"
        title="📡 Ping IP"
        body="Ping your default gateway to confirm your DHCP-assigned configuration works."
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
          <Link to="/academy/what-is-dns" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 12: DNS Explained
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
      q: "What does DHCP stand for?",
      options: [
        "Dynamic Host Control Protocol",
        "Dynamic Host Configuration Protocol",
        "Digital Host Configuration Protocol",
        "Dynamic Hardware Control Protocol",
      ],
      answer: 1,
    },
    {
      q: "What does DORA represent?",
      options: [
        "Discover → Offer → Request → Acknowledge",
        "Discover → Open → Resolve → Accept",
        "DHCP → Offer → Route → Address",
        "Discover → Request → Offer → Acknowledge",
      ],
      answer: 0,
    },
    {
      q: "Which service automatically provides IP configuration?",
      options: ["DNS", "ARP", "DHCP", "HTTP"],
      answer: 2,
    },
    {
      q: "What does an address like 169.254.x.x often indicate?",
      options: [
        "Successful DHCP",
        "The device couldn't obtain an IPv4 address from DHCP",
        "DNS is working",
        "The device has a public IP",
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
