import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson9-hero.jpg";

export const Route = createFileRoute("/academy/network-broadcast-usable-ip")({
  head: () =>
    toolHead({
      path: "/academy/network-broadcast-usable-ip",
      title: "Lesson 9: Network, Broadcast & Usable IP Range – Pulse Speed Academy",
      description:
        "Learn how to calculate the network address, broadcast address, and usable IP range for any IPv4 subnet. Essential skill for CCNA and network engineers.",
      name: "Lesson 9 – Network, Broadcast & Usable IP Range",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is the network address in a subnet?",
          a: "The network address is the first address in a subnet. It identifies the network itself and cannot be assigned to a device.",
        },
        {
          q: "What is the broadcast address used for?",
          a: "The broadcast address is the last address in a subnet. Traffic sent to it is delivered to every device on that subnet.",
        },
        {
          q: "How do you find the usable IP range?",
          a: "The usable IP range is everything between the network address and the broadcast address. For 192.168.1.0/24, the usable range is 192.168.1.1 to 192.168.1.254.",
        },
      ],
    }),
  component: Lesson9,
});

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: "#fff", fontSize: 24, marginTop: 40, letterSpacing: "-0.3px" }}>
    {children}
  </h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.75, margin: "10px 0" }}>
    {children}
  </p>
);
const Code = ({ children }: { children: React.ReactNode }) => (
  <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>{children}</code>
);

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 12, overflow: "hidden", margin: "14px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead style={{ background: "#0f1422" }}>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#fff", fontWeight: 600, borderBottom: "1px solid #1f2740" }}>
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
                    fontFamily: /\d+\.\d+\.\d+|^\/\d+$/.test(c) ? "monospace" : undefined,
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
      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        🧪 TRY IT NOW
      </div>
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

function Lesson9() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 09 · BEGINNER · 12 MIN READ
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
        How to Calculate Network Address, Broadcast Address, and Usable IP Range
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Every subnet has four important values. Learn how to find them quickly and why they matter for routers, switches, and certification exams.
      </p>

      <img
        src={heroImg}
        alt="Subnet address range visualised as a street from 0 to 255 showing network, usable, and broadcast addresses"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        Every subnet has four important values that every network engineer should know:
      </P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>🌐 Network Address</li>
        <li>📢 Broadcast Address</li>
        <li>🟢 First Usable IP</li>
        <li>🔴 Last Usable IP</li>
      </ul>
      <P>
        These values help routers, switches, and computers know where a network starts, where it ends, and which IP addresses can be assigned to devices.
      </P>

      <H2>The Four Key Addresses</H2>
      <P>
        Imagine a street with 256 house numbers.
      </P>
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 16,
          background: "#0f1422",
          fontFamily: "monospace",
          color: "#c8d0e0",
          textAlign: "center",
          margin: "14px 0",
        }}
      >
        <div style={{ color: "#6b7794", fontSize: 12, marginBottom: 8 }}>
          Street Starts ← ———————————————————————— → Street Ends
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: "#00D4AA" }}>Network Address</span>
          <span style={{ color: "#9B8FE8" }}>Broadcast Address</span>
        </div>
      </div>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>The first address identifies the network.</li>
        <li>The last address is used to send messages to every device.</li>
        <li>Everything in between can be assigned to computers, phones, printers, and servers.</li>
      </ul>

      <H2>Example Network</H2>
      <P>
        Let's use the most common network:
      </P>
      <Callout tone="info" title="192.168.1.0/24">
        The most commonly used home and small-office network.
      </Callout>
      <Table
        head={["Address Type", "Value"]}
        rows={[
          ["Network Address", "192.168.1.0"],
          ["First Usable IP", "192.168.1.1"],
          ["Last Usable IP", "192.168.1.254"],
          ["Broadcast Address", "192.168.1.255"],
        ]}
      />

      <H2>What is the Network Address?</H2>
      <P>
        The <strong style={{ color: "#fff" }}>Network Address</strong> is the first address in the subnet.
      </P>
      <P>
        It identifies the network itself. You cannot assign this address to a device.
      </P>
      <Callout tone="info" title="EXAMPLE">
        <Code>192.168.1.0</Code> — think of it as the name of the street, not a house.
      </Callout>

      <H2>What is the Broadcast Address?</H2>
      <P>
        The <strong style={{ color: "#fff" }}>Broadcast Address</strong> is the last address in the subnet.
      </P>
      <P>
        When a device sends data to this address, every device on that subnet receives it. Like making an announcement over a loudspeaker that everyone in the building can hear.
      </P>
      <Callout tone="info" title="EXAMPLE">
        <Code>192.168.1.255</Code> — one message reaches every device on 192.168.1.0/24.
      </Callout>

      <H2>What is the Usable IP Range?</H2>
      <P>
        The usable IP range is everything between the Network Address and the Broadcast Address.
      </P>
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 16,
          background: "#0f1422",
          fontFamily: "monospace",
          color: "#c8d0e0",
          margin: "14px 0",
        }}
      >
        <div>Network Address      192.168.1.0</div>
        <div style={{ color: "#00D4AA" }}>First Usable IP      192.168.1.1</div>
        <div style={{ color: "#00D4AA" }}>Last Usable IP       192.168.1.254</div>
        <div>Broadcast Address    192.168.1.255</div>
      </div>
      <P>
        Devices such as laptops, servers, printers, IP phones, and cameras receive addresses from this range.
      </P>

      <H2>Visual Example</H2>
      <P>
        <Code>192.168.1.0/24</Code>
      </P>
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 16,
          background: "#0f1422",
          fontFamily: "monospace",
          color: "#c8d0e0",
          margin: "14px 0",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>0 ——————————————————————————————————————— 255</div>
        <div style={{ textAlign: "center", color: "#00D4AA", marginBottom: 8 }}>|           Usable Addresses                |</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#00D4AA" }}>0<br />Network</span>
          <span>1<br />First IP</span>
          <span>254<br />Last IP</span>
          <span style={{ color: "#9B8FE8" }}>255<br />Broadcast</span>
        </div>
      </div>

      <H2>Example 1 — /24 Network</H2>
      <P>
        <Code>192.168.10.0/24</Code>
      </P>
      <Table
        head={["Item", "Value"]}
        rows={[
          ["Network", "192.168.10.0"],
          ["First Host", "192.168.10.1"],
          ["Last Host", "192.168.10.254"],
          ["Broadcast", "192.168.10.255"],
        ]}
      />
      <Callout tone="info" title="SUPPORTS">
        ✅ 254 usable devices
      </Callout>

      <H2>Example 2 — /26 Network</H2>
      <P>
        <Code>192.168.1.64/26</Code>
      </P>
      <Table
        head={["Item", "Value"]}
        rows={[
          ["Network", "192.168.1.64"],
          ["First Host", "192.168.1.65"],
          ["Last Host", "192.168.1.126"],
          ["Broadcast", "192.168.1.127"],
        ]}
      />
      <Callout tone="info" title="SUPPORTS">
        ✅ 62 usable devices
      </Callout>

      <H2>Example 3 — /27 Network</H2>
      <P>
        <Code>192.168.20.96/27</Code>
      </P>
      <Table
        head={["Item", "Value"]}
        rows={[
          ["Network", "192.168.20.96"],
          ["First Host", "192.168.20.97"],
          ["Last Host", "192.168.20.126"],
          ["Broadcast", "192.168.20.127"],
        ]}
      />
      <Callout tone="info" title="SUPPORTS">
        ✅ 30 usable devices
      </Callout>

      <H2>Easy Way to Remember</H2>
      <P>
        For any subnet:
      </P>
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 16,
          background: "#0f1422",
          color: "#c8d0e0",
          margin: "14px 0",
          lineHeight: 1.8,
        }}
      >
        <div>First Address → <strong style={{ color: "#00D4AA" }}>Network Address</strong></div>
        <div>Second Address → <strong style={{ color: "#00D4AA" }}>First Usable IP</strong></div>
        <div>Last Address → <strong style={{ color: "#9B8FE8" }}>Broadcast Address</strong></div>
        <div>One Before Last → <strong style={{ color: "#00D4AA" }}>Last Usable IP</strong></div>
      </div>
      <P>
        This simple rule works for every subnet.
      </P>

      <H2>Why Are These Addresses Important?</H2>
      <P>
        Network engineers use them to:
      </P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✅ Assign IP addresses correctly.</li>
        <li>✅ Configure routers and switches.</li>
        <li>✅ Create VLANs.</li>
        <li>✅ Design enterprise networks.</li>
        <li>✅ Troubleshoot connectivity issues.</li>
      </ul>
      <P>
        Using the wrong network or broadcast address can prevent devices from communicating properly.
      </P>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ ASSIGNING THE NETWORK ADDRESS TO A DEVICE">
        Wrong: <Code>192.168.1.0</Code><br />
        Correct: <Code>192.168.1.1</Code>
      </Callout>
      <Callout tone="warn" title="❌ ASSIGNING THE BROADCAST ADDRESS">
        Wrong: <Code>192.168.1.255</Code><br />
        Broadcast addresses are reserved and should not be assigned to hosts.
      </Callout>
      <Callout tone="warn" title="❌ FORGETTING THE SUBNET MASK">
        The same IP address can belong to different networks depending on the subnet mask. Always consider both the IP address and the CIDR/subnet mask together.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ Every subnet has a Network Address and a Broadcast Address.</li>
        <li>✔ Devices receive IP addresses from the usable range between those two addresses.</li>
        <li>✔ The Network Address identifies the subnet.</li>
        <li>✔ The Broadcast Address sends traffic to all devices on that subnet.</li>
        <li>✔ Understanding these values is essential for configuring and troubleshooting networks.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <P>
        Open the Pulse-Speed Subnet Calculator and enter:
      </P>
      <Table
        head={["Network", "Verify"]}
        rows={[
          ["192.168.1.0/24", "Network, Broadcast, First/Last Host"],
          ["192.168.10.64/26", "Network and Broadcast"],
          ["10.10.10.128/25", "Usable IP range"],
          ["172.16.5.96/27", "Number of usable hosts"],
        ]}
      />
      <TryItCard
        to="/subnet-calculator"
        title="🧮 Subnet Calculator"
        body="Enter any IP and CIDR to instantly see the network, broadcast, and usable host range."
      />
      <TryItCard
        to="/ping"
        title="📡 Ping Tool"
        body="Test whether devices inside a usable range are reachable."
      />

      <H2>Did You Know?</H2>
      <Callout tone="info" title="💡 CERTIFICATION EXAMS LOVE THIS TOPIC">
        Many networking certification exams, such as Cisco CCNA, ask you to identify the Network Address, Broadcast Address, and usable host range from an IP address and subnet mask. Mastering these calculations is one of the most valuable networking skills you can develop.
      </Callout>

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
          <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>
            PREVIOUS LESSON
          </div>
          <Link to="/academy/cidr-notation" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 8: CIDR Notation Explained
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
      q: "Which address identifies the network?",
      options: ["Network Address", "Broadcast Address", "Gateway", "DNS"],
      answer: 0,
    },
    {
      q: "Which address cannot be assigned to a computer?",
      options: ["First Usable IP", "Last Usable IP", "Broadcast Address", "Default Gateway"],
      answer: 2,
    },
    {
      q: "In 192.168.1.0/24, what is the first usable IP?",
      options: ["192.168.1.0", "192.168.1.1", "192.168.1.254", "192.168.1.255"],
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

function QuizItem({
  q,
  options,
  answer,
  index,
}: {
  q: string;
  options: string[];
  answer: number;
  index: number;
}) {
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
