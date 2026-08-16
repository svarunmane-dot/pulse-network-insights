import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson14-hero.jpg";

export const Route = createFileRoute("/academy/mac-addresses")({
  head: () =>
    toolHead({
      path: "/academy/mac-addresses",
      title: "Lesson 14: MAC Addresses & ARP Explained | Pulse Speed Academy",
      description:
        "Learn what a MAC address is, how it differs from an IP address, how ARP resolves IPv4 to MAC, how switches use MAC tables — with an interactive ARP simulator.",
      name: "Lesson 14 – MAC Addresses Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What does MAC stand for?",
          a: "MAC stands for Media Access Control. A MAC address is a 48-bit Layer 2 identifier associated with a network interface, usually written as six hexadecimal pairs such as 00:1A:2B:3C:4D:5E.",
        },
        {
          q: "What is the difference between a MAC address and an IP address?",
          a: "An IP address is a logical Layer 3 address used to reach a device across networks. A MAC address is a Layer 2 identifier used to deliver an Ethernet frame on the local network segment.",
        },
        {
          q: "What protocol maps an IP address to a MAC address?",
          a: "ARP (Address Resolution Protocol) discovers the MAC address associated with an IPv4 address on the local network, and the result is stored in the ARP cache.",
        },
      ],
    }),
  component: Lesson14,
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
                    fontFamily: /[0-9A-F]{2}:[0-9A-F]{2}|\d+\.\d+\.\d+/i.test(c) ? "monospace" : undefined,
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

/* ---------------- Interactive ARP simulator ---------------- */

const ARP_STEPS = [
  {
    label: "1️⃣ ARP REQUEST (broadcast)",
    from: "laptop" as const,
    text: 'Laptop → FF:FF:FF:FF:FF:FF — "Who has 192.168.1.1? Tell 192.168.1.10"',
  },
  {
    label: "2️⃣ SWITCH FLOODS THE FRAME",
    from: "switch" as const,
    text: "The switch has no entry for the broadcast address, so it forwards the frame out of every port in the broadcast domain.",
  },
  {
    label: "3️⃣ ARP REPLY (unicast)",
    from: "router" as const,
    text: 'Router → AA:AA:AA:AA:AA:01 — "192.168.1.1 is me. My MAC is BB:BB:BB:BB:BB:02"',
  },
  {
    label: "4️⃣ ARP CACHE UPDATED",
    from: "laptop" as const,
    text: "192.168.1.1 → BB:BB:BB:BB:BB:02 is stored in the ARP cache, and the Ethernet frame is finally sent.",
  },
];

function ArpSimulator() {
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const done = step >= ARP_STEPS.length;
  const CORRECT = "BB:BB:BB:BB:BB:02";

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
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 4 }}>ARP Simulator</div>
      <p style={{ color: "#c8d0e0", fontSize: 14, margin: "6px 0 14px" }}>
        Your laptop wants to reach <B>192.168.1.1</B>. Which MAC address should the Ethernet frame be sent to?
      </p>

      <Pre>{`Laptop                     Switch                     Router
192.168.1.10   ─────────►   [ ]   ─────────►   192.168.1.1
AA:AA:AA:AA:AA:01                              BB:BB:BB:BB:BB:02`}</Pre>

      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {["AA:AA:AA:AA:AA:01", "BB:BB:BB:BB:BB:02", "FF:FF:FF:FF:FF:FF", "192.168.1.1"].map((opt) => {
          const picked = guess === opt;
          const isRight = opt === CORRECT;
          let border = "1px solid #1f2740";
          let bg = "#0b0f1a";
          let color = "#c8d0e0";
          if (guess !== null) {
            if (isRight) {
              border = "1px solid #00D4AA";
              bg = "rgba(0,212,170,0.12)";
              color = "#00D4AA";
            } else if (picked) {
              border = "1px solid #ff6b8a";
              bg = "rgba(233,69,96,0.10)";
              color = "#ff6b8a";
            }
          }
          return (
            <button
              key={opt}
              onClick={() => setGuess(opt)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border,
                background: bg,
                color,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "monospace",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {guess !== null && (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: guess === CORRECT ? "#00D4AA" : "#ff6b8a",
            fontWeight: 600,
          }}
        >
          {guess === CORRECT
            ? "✅ Correct — but the laptop has to learn that MAC address first. Run the ARP exchange below."
            : "❌ Not quite. The frame must go to the router's own MAC address. Run the ARP exchange below to see why."}
        </div>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        {ARP_STEPS.slice(0, step).map((m) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              justifyContent: m.from === "router" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                border: `1px solid ${m.from === "router" ? "rgba(0,212,170,0.4)" : "#1f2740"}`,
                background: m.from === "router" ? "rgba(0,212,170,0.10)" : "#0f1422",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  color: m.from === "router" ? "#00D4AA" : "#9B8FE8",
                }}
              >
                {m.from === "laptop" ? "💻 LAPTOP" : m.from === "switch" ? "🔀 SWITCH" : "🌐 ROUTER"} · {m.label}
              </div>
              <div style={{ color: "#c8d0e0", fontSize: 14, marginTop: 4, fontFamily: "monospace" }}>{m.text}</div>
            </div>
          </div>
        ))}
        {step === 0 && (
          <div style={{ color: "#6b7794", fontSize: 14, fontFamily: "monospace", textAlign: "center", padding: 12 }}>
            ARP cache empty · destination MAC unknown
          </div>
        )}
        {done && (
          <div style={{ marginTop: 4 }}>
            <div style={{ color: "#00D4AA", fontWeight: 700, fontSize: 14 }}>✅ Ethernet frame sent</div>
            <Table
              head={["IP Address", "MAC Address", "State"]}
              rows={[["192.168.1.1", "BB:BB:BB:BB:BB:02", "REACHABLE"]]}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {!done && (
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
            {step === 0 ? "Start ARP exchange →" : "Next step →"}
          </button>
        )}
        {(step > 0 || guess !== null) && (
          <button
            onClick={() => {
              setStep(0);
              setGuess(null);
            }}
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

function Lesson14() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 14 · BEGINNER · ⏱️ 12 MIN READ
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
        MAC Addresses Explained – How Devices Identify Each Other on a Network
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Underneath every IP address there is a second address doing the real local delivery work. Meet the MAC
        address and the ARP protocol that finds it.
      </p>

      <img
        src={heroImg}
        alt="Laptop and printer connected through a switch with MAC address labels and ARP arrows"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>You now know that devices use IP addresses to communicate across networks. But there's another address hiding underneath the IP address: the <B>MAC address</B>.</P>
      <P>When your laptop communicates with another device on the same local network, IP addresses alone aren't enough. Your network needs to know which physical network interface should receive the Ethernet frame. That's where MAC addresses come in.</P>

      <H2>What is a MAC Address?</H2>
      <P>MAC stands for <B>Media Access Control</B>. A MAC address is a unique identifier associated with a network interface.</P>
      <Pre>{`00:1A:2B:3C:4D:5E     (colon notation — Linux, macOS)
00-1A-2B-3C-4D-5E     (hyphen notation — Windows)
001A.2B3C.4D5E        (dotted notation — Cisco)`}</Pre>
      <P>The formatting varies between operating systems and vendors, but it is always the same 48-bit value.</P>

      <H2>IP Address vs MAC Address</H2>
      <P>This is one of the most important distinctions in networking.</P>
      <Table
        head={["IP Address", "MAC Address"]}
        rows={[
          ["Logical address", "Link-layer identifier"],
          ["Used for communication between networks", "Used for local network delivery"],
          ["Can change", "Usually stays with the interface"],
          ["192.168.1.25", "00:1A:2B:3C:4D:5E"],
          ["Works at Layer 3", "Works at Layer 2"],
        ]}
      />
      <Callout tone="info" title="A simple way to remember">
        <B>IP</B> tells you <em>where</em> the device is on the network. <B>MAC</B> identifies <em>which</em> network
        interface on the local network should receive the frame.
      </Callout>

      <H2>Think of an IP Address Like a House Address</H2>
      <Pre>{`IP Address
    ↓
City + Street + House`}</Pre>
      <P>The IP address helps determine where the packet needs to go. The MAC address is more like the local delivery identifier used to hand the Ethernet frame over on the current network segment.</P>
      <Pre>{`IP  = Where?
MAC = Which local interface?`}</Pre>

      <H2>Where Do MAC Addresses Matter?</H2>
      <P>MAC addresses are primarily important on the local network.</P>
      <Pre>{`Laptop
192.168.1.10
MAC: AA:AA:AA:AA:AA:01

       │
       │ Ethernet / Wi-Fi
       ▼

Printer
192.168.1.20
MAC: BB:BB:BB:BB:BB:02`}</Pre>
      <P>The laptop wants to communicate with the printer. It knows the printer's IP address — <B>192.168.1.20</B> — but it needs to discover the corresponding MAC address. That's where ARP comes in.</P>

      <H2>What is ARP?</H2>
      <P>ARP stands for <B>Address Resolution Protocol</B>. In IPv4 networks, ARP allows a device to discover the MAC address associated with an IPv4 address on the local network.</P>
      <P>Imagine your laptop asking: <em>"Who has 192.168.1.20?"</em> The device with that IP responds: <em>"192.168.1.20 is me. My MAC address is BB:BB:BB:BB:BB:02."</em> The laptop can then send the Ethernet frame to that MAC address.</P>
      <Pre>{`Laptop
192.168.1.10
     │
     │ ARP Request:
     │ "Who has 192.168.1.20?"
     ▼
Local Network
     │
     ▼
Printer
192.168.1.20
     │
     │ ARP Reply:
     │ "I am BB:BB:BB:BB:BB:02"
     ▼
Laptop`}</Pre>

      <H2>Try the ARP Simulator</H2>
      <ArpSimulator />

      <H2>ARP Cache</H2>
      <P>Your computer doesn't need to ask this question every time. It stores recently learned IP-to-MAC mappings in an <B>ARP cache</B>, which makes communication far more efficient.</P>
      <Table
        head={["IP Address", "MAC Address"]}
        rows={[
          ["192.168.1.1", "AA:BB:CC:11:22:33"],
          ["192.168.1.20", "BB:BB:BB:BB:BB:02"],
          ["192.168.1.30", "CC:CC:CC:CC:CC:03"],
        ]}
      />

      <H2>How to View Your ARP Cache</H2>
      <P><B>Windows</B> — open Command Prompt:</P>
      <Pre>{`arp -a

Interface: 192.168.1.25

Internet Address      Physical Address
192.168.1.1           aa-bb-cc-11-22-33
192.168.1.20          bb-bb-bb-bb-bb-02`}</Pre>
      <P>The <B>Physical Address</B> column is the MAC address.</P>
      <P><B>Linux</B>:</P>
      <Pre>{`ip neigh

192.168.1.1 dev eth0 lladdr aa:bb:cc:11:22:33 REACHABLE`}</Pre>

      <H2>What Happens When You Access the Internet?</H2>
      <P>Suppose your laptop is <B>192.168.1.25</B>, your router is <B>192.168.1.1</B>, and you want to reach <B>8.8.8.8</B>. Your laptop determines that 8.8.8.8 isn't on its local subnet, so it sends the traffic to the default gateway.</P>
      <P>But the Ethernet frame still needs a destination MAC address — so your laptop needs the <B>router's</B> MAC address, not Google's.</P>
      <Pre>{`Laptop
192.168.1.25
     │
     │ Destination MAC =
     │ Router's MAC
     ▼
Router
192.168.1.1
     │
     ▼
Internet
     │
     ▼
8.8.8.8`}</Pre>
      <Callout tone="info" title="Key concept">
        MAC addresses are used for the <B>local network hop</B>. IP addresses identify the <B>overall destination</B>.
      </Callout>

      <H2>What Does a Network Switch Do?</H2>
      <P>A switch primarily uses MAC addresses to decide where to forward Ethernet frames.</P>
      <Pre>{`              Switch
          ┌─────┼─────┐
          │     │     │
        PC 1   PC 2  Printer`}</Pre>
      <P>The switch learns which MAC address is reachable through which physical port and builds a MAC address table:</P>
      <Table
        head={["MAC Address", "Port"]}
        rows={[
          ["AA:AA:AA:AA:AA:01", "Port 1"],
          ["BB:BB:BB:BB:BB:02", "Port 2"],
          ["CC:CC:CC:CC:CC:03", "Port 3"],
        ]}
      />
      <P>When a frame arrives, the switch checks the destination MAC address and forwards the frame toward the appropriate port. This is why switches are associated with Layer 2 networking.</P>

      <H2>Are MAC Addresses Really Permanent?</H2>
      <P>Not necessarily. Although MAC addresses are normally assigned to network interfaces, modern operating systems can use MAC address randomisation or spoofing. Wi-Fi devices often use a randomized MAC address when connecting to different networks for privacy.</P>
      <Callout tone="warn" title="Better mental model">
        A MAC address is an identifier for a network interface at Layer 2 — not a permanently unchangeable identity.
      </Callout>

      <H2>MAC Address Structure</H2>
      <P>A traditional MAC address contains <B>48 bits</B>, normally displayed as six hexadecimal pairs, each pair representing 8 bits.</P>
      <Pre>{`00 : 1A : 2B : 3C : 4D : 5E
│      │
└──────┴── 6 hexadecimal groups`}</Pre>
      <P>The first part has historically been associated with the manufacturer or vendor, although modern addressing and randomisation mean you shouldn't assume that every MAC address reveals the actual hardware manufacturer.</P>

      <H2>Unicast, Multicast and Broadcast</H2>
      <UL>
        <li><B>Unicast</B> — one sender → one destination (<code style={{ color: "#00D4AA", fontFamily: "monospace" }}>PC ─────► Server</code>)</li>
        <li><B>Broadcast</B> — one sender → everyone in the local broadcast domain (<code style={{ color: "#00D4AA", fontFamily: "monospace" }}>FF:FF:FF:FF:FF:FF</code>)</li>
        <li><B>Multicast</B> — one sender → a selected group of devices</li>
      </UL>
      <P>This distinction becomes increasingly important as you move into switching, VLANs, and network troubleshooting.</P>

      <H2>MAC Address vs IP Address: Real Example</H2>
      <Table
        head={["Device", "IP Address", "MAC Address"]}
        rows={[
          ["Laptop", "192.168.1.25", "AA:AA:AA:AA:AA:01"],
          ["Router", "192.168.1.1", "BB:BB:BB:BB:BB:02"],
        ]}
      />
      <P>The laptop accesses a website on the Internet. The IP destination is a public server — but on the first local Ethernet/Wi-Fi hop, the frame's destination MAC is the router's MAC. The router then builds a brand new Layer 2 frame for the next network.</P>

      <H2>Common Mistakes</H2>
      <UL>
        <li>❌ <B>"MAC addresses route traffic across the Internet."</B> Routers forward packets between networks using Layer 3 information; the Layer 2 frame is rebuilt for each local link.</li>
        <li>❌ <B>"A MAC address is the same as an IP address."</B> They're completely different identifiers serving different purposes.</li>
        <li>❌ <B>"Your router needs Google's MAC address."</B> No — your computer only needs the MAC address of the next-hop device on its local network.</li>
        <li>❌ <B>"MAC addresses can never change."</B> They can be changed, spoofed, or randomized by software.</li>
      </UL>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <UL>
        <li>✔ A MAC address identifies a network interface at Layer 2.</li>
        <li>✔ MAC addresses are primarily relevant to the local network/link.</li>
        <li>✔ IPv4 uses ARP to discover the MAC address of a local IPv4 address.</li>
        <li>✔ Switches use MAC address tables to forward Ethernet frames.</li>
        <li>✔ Traffic to another network is sent to the default gateway's MAC address.</li>
        <li>✔ MAC addresses and IP addresses serve different purposes.</li>
      </UL>

      <H2>Practice What You've Learned</H2>
      <P>On Windows, run:</P>
      <Pre>{`ipconfig /all      → find "Physical Address"
arp -a             → compare IP addresses to MAC addresses`}</Pre>
      <P>Ask yourself: <em>which MAC address belongs to my default gateway?</em> That's the address your computer uses whenever it needs to send traffic to another network.</P>

      <TryItCard
        to="/ping-ip"
        title="📡 Ping IP"
        body="Ping your default gateway, then run arp -a and watch its MAC address appear in your ARP cache."
      />
      <TryItCard
        to="/subnet-calculator"
        title="🧮 IP Subnet Calculator"
        body="Check whether a destination is on your local subnet — that decides whether ARP resolves the host or the gateway."
      />
      <TryItCard
        to="/whose-ip"
        title="🌍 Whose IP"
        body="See who owns a public IP address that your traffic reaches beyond the local Layer 2 hop."
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
          <Link to="/academy/what-is-dhcp" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 13: DHCP Explained
          </Link>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>NEXT LESSON</div>
          <Link to="/academy/network-switches" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            Lesson 15: How Network Switches Work →
          </Link>
        </div>
      </div>
      <Link
        to="/academy"
        style={{
          marginTop: 14,
          display: "inline-block",
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
    </article>
  );
}

function Quiz() {
  const questions = [
    {
      q: "What does MAC stand for?",
      options: [
        "Machine Access Control",
        "Media Access Control",
        "Media Address Configuration",
        "Machine Address Control",
      ],
      answer: 1,
    },
    {
      q: "Which device primarily uses MAC addresses to forward Ethernet frames?",
      options: ["Router", "Switch", "DNS Server", "DHCP Server"],
      answer: 1,
    },
    {
      q: "What protocol maps an IPv4 address to a MAC address on a local network?",
      options: ["DNS", "DHCP", "ARP", "HTTP"],
      answer: 2,
    },
    {
      q: "What is the Ethernet broadcast MAC address?",
      options: ["00:00:00:00:00:00", "127.0.0.1", "FF:FF:FF:FF:FF:FF", "255.255.255.255"],
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
