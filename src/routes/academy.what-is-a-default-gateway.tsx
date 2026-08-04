import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson11-hero.jpg";

export const Route = createFileRoute("/academy/what-is-a-default-gateway")({
  head: () =>
    toolHead({
      path: "/academy/what-is-a-default-gateway",
      title: "Lesson 11: What is a Default Gateway? | Pulse Speed Academy",
      description:
        "Learn what a default gateway is, how your computer reaches the Internet, and how to find your gateway on Windows, macOS and Linux.",
      name: "Lesson 11 – What is a Default Gateway?",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is a default gateway in simple terms?",
          a: "A default gateway is the device (usually a router) that forwards traffic from your local network to other networks, including the Internet.",
        },
        {
          q: "How do I find my default gateway?",
          a: "On Windows, run ipconfig and look for 'Default Gateway'. On macOS, use netstat -nr or route get default. On Linux, run ip route.",
        },
        {
          q: "What happens if I don't have a default gateway?",
          a: "Without a default gateway, your device can only communicate with other devices on the same local network. Internet access will not work.",
        },
      ],
    }),
  component: Lesson11,
});

const H2 = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <h2 style={{ color: "#fff", fontSize: 24, marginTop: 40, letterSpacing: "-0.3px", ...style }}>
    {children}
  </h2>
);
const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.75, margin: "10px 0", ...style }}>
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

function Lesson11() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 11 · BEGINNER · 10–12 MIN READ
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
        What is a Default Gateway? How Your Computer Reaches the Internet
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        A default gateway is the exit door from your local network. Learn how it forwards your traffic to the Internet and why you can't browse without it.
      </p>

      <img
        src={heroImg}
        alt="Default gateway diagram showing a router connecting local devices to the Internet"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        Imagine you're sending a letter to a friend who lives in another city.
      </P>
      <P>
        You don't deliver it yourself — you take it to the local post office, and it forwards the letter to the correct destination.
      </P>
      <P>
        A <strong style={{ color: "#fff" }}>Default Gateway</strong> works in a similar way.
      </P>
      <P>
        When your computer needs to communicate with a device outside of its local network, it sends the data to the Default Gateway, which is usually your router.
      </P>
      <P>
        Without a Default Gateway, your computer could only communicate with devices on the same local network.
      </P>

      <H2>What is a Default Gateway?</H2>
      <P>
        A Default Gateway is the device that forwards traffic from your local network to other networks, such as the Internet.
      </P>
      <P>
        In most home and office networks, the default gateway is the router.
      </P>
      <Callout tone="info" title="Simple Definition">
        Think of the Default Gateway as the <strong style={{ color: "#fff" }}>exit door</strong> from your network.
      </Callout>

      <H2>A Simple Example</H2>
      <P>Imagine your home Wi-Fi network:</P>
      <Table
        head={["Device", "IP Address"]}
        rows={[
          ["Laptop", "192.168.1.10"],
          ["Mobile Phone", "192.168.1.20"],
          ["Printer", "192.168.1.30"],
          ["Router (Default Gateway)", "192.168.1.1"],
        ]}
      />
      <P>
        All these devices are on the same network: <Code>192.168.1.0/24</Code>.
      </P>
      <P>
        The laptop can communicate directly with the phone and printer.
      </P>
      <P>
        But what happens when you open <Code>www.google.com</Code>?
      </P>
      <P>
        Google's servers are not on your home network. Your laptop sends the traffic to:
      </P>
      <Callout tone="info" title="Default Gateway">
        <Code>192.168.1.1</Code>
      </Callout>
      <P>
        The router then forwards the traffic to the Internet.
      </P>

      <H2>Visual Diagram</H2>
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 20,
          background: "#0f1422",
          fontFamily: "monospace",
          color: "#c8d0e0",
          margin: "14px 0",
          lineHeight: 1.9,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#6b7794" }}>Internet</div>
        <div style={{ color: "#6b7794" }}>│</div>
        <div style={{ color: "#6b7794" }}>│</div>
        <div style={{ color: "#00D4AA" }}>┌─────────────────┐</div>
        <div style={{ color: "#00D4AA" }}>│     Router      │</div>
        <div style={{ color: "#00D4AA" }}>│ 192.168.1.1     │</div>
        <div style={{ color: "#00D4AA" }}>│ Default Gateway │</div>
        <div style={{ color: "#00D4AA" }}>└────────┬────────┘</div>
        <div style={{ color: "#6b7794" }}>│</div>
        <div style={{ color: "#6b7794" }}>┌──────────┼──────────┐</div>
        <div style={{ color: "#6b7794" }}>│          │          │</div>
        <div>Laptop  Smartphone  Printer</div>
        <div>192.168.1.10  192.168.1.20  192.168.1.30</div>
      </div>
      <P>
        Every device knows that if the destination isn't on the local network, it should send the traffic to the router.
      </P>

      <H2>How Does Your Computer Decide?</H2>
      <P>
        When you try to access another device, your computer asks:
      </P>
      <Callout tone="info" title="Question 1: Is the destination on my local network?">
        <P style={{ margin: 0 }}>
          My IP: <Code>192.168.1.10</Code>
          <br />
          Destination: <Code>192.168.1.50</Code>
          <br />
          Same subnet? <strong style={{ color: "#00D4AA" }}>✅ Yes</strong> → Send directly.
        </P>
      </Callout>
      <Callout tone="info" title="Question 2: Is the destination on my local network?">
        <P style={{ margin: 0 }}>
          Destination: <Code>8.8.8.8</Code>
          <br />
          Same subnet? <strong style={{ color: "#ff6b8a" }}>❌ No</strong> → Send to <Code>192.168.1.1</Code> (Default Gateway).
        </P>
      </Callout>

      <H2>Why Is a Default Gateway Important?</H2>
      <P>Without a Default Gateway:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✅ You can communicate with local devices.</li>
        <li>❌ You cannot access websites.</li>
        <li>❌ You cannot access cloud services.</li>
        <li>❌ You cannot access email, online games, video streaming, or remote servers.</li>
      </ul>
      <P>
        Your Internet connection effectively stops at your local network.
      </P>

      <H2>How to Find Your Default Gateway</H2>

      <H2 style={{ fontSize: 18, marginTop: 24 }}>Windows</H2>
      <P>Open Command Prompt and run:</P>
      <Callout tone="info" title="Command">
        <Code>ipconfig</Code>
      </Callout>
      <P>Example output:</P>
      <div
        style={{
          background: "#0b0f1a",
          border: "1px solid #1f2740",
          borderRadius: 10,
          padding: 14,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#c8d0e0",
          lineHeight: 1.7,
        }}
      >
        <div>Ethernet adapter:</div>
        <div>IPv4 Address . . . . . : 192.168.1.25</div>
        <div>Subnet Mask . . . . . : 255.255.255.0</div>
        <div style={{ color: "#00D4AA" }}>Default Gateway . . . : 192.168.1.1</div>
      </div>

      <H2 style={{ fontSize: 18, marginTop: 24 }}>macOS</H2>
      <P>Open Terminal:</P>
      <Callout tone="info" title="Command">
        <Code>netstat -nr</Code>
      </Callout>
      <P>Or:</P>
      <Callout tone="info" title="Command">
        <Code>route get default</Code>
      </Callout>

      <H2 style={{ fontSize: 18, marginTop: 24 }}>Linux</H2>
      <P>Open a terminal and run:</P>
      <Callout tone="info" title="Command">
        <Code>ip route</Code>
      </Callout>
      <P>Example:</P>
      <div
        style={{
          background: "#0b0f1a",
          border: "1px solid #1f2740",
          borderRadius: 10,
          padding: 14,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#c8d0e0",
          lineHeight: 1.7,
        }}
      >
        <div style={{ color: "#00D4AA" }}>default via 192.168.1.1 dev eth0</div>
      </div>

      <H2>Real-World Example</H2>
      <P>
        A company has two networks:
      </P>
      <Table
        head={["Department", "Network"]}
        rows={[
          ["Finance", "192.168.10.0/24"],
          ["HR", "192.168.20.0/24"],
        ]}
      />
      <P>
        A Finance PC wants to access an HR file server.
      </P>
      <P>
        It cannot communicate directly because the networks are different.
      </P>
      <P>
        Instead, it sends the traffic to the Default Gateway, which routes the data to the HR network.
      </P>

      <H2>Common Default Gateway Addresses</H2>
      <P>
        Many home routers use one of these private IP addresses:
      </P>
      <Table
        head={["Manufacturer", "Common Gateway"]}
        rows={[
          ["TP-Link", "192.168.0.1"],
          ["Netgear", "192.168.1.1"],
          ["ASUS", "192.168.1.1"],
          ["Linksys", "192.168.1.1"],
          ["D-Link", "192.168.0.1"],
        ]}
      />
      <P>
        Your network may use a different address depending on its configuration.
      </P>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ Thinking the Default Gateway is the Internet">
        The gateway is not the Internet. It is simply the first device that forwards your traffic to other networks.
      </Callout>
      <Callout tone="warn" title="❌ Leaving the Default Gateway Blank">
        Without a configured gateway, local communication works but Internet access does not.
      </Callout>
      <Callout tone="warn" title="❌ Using the Wrong Gateway">
        If the gateway IP is incorrect, websites won't load and remote servers won't be reachable.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ A Default Gateway connects your local network to other networks.</li>
        <li>✔ It is usually your router.</li>
        <li>✔ Devices on the same subnet communicate directly.</li>
        <li>✔ Devices on different networks send traffic to the Default Gateway.</li>
        <li>✔ Without a Default Gateway, you cannot access the Internet or remote networks.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <P>
        Try these tools on Pulse-Speed:
      </P>
      <TryItCard
        to="/whose-ip"
        title="🌍 What's My IP"
        body="Find your current public IP address."
      />
      <TryItCard
        to="/ping-ip"
        title="📡 Ping IP"
        body="Test connectivity to your router (e.g., 192.168.1.1) and then to a public IP such as 8.8.8.8."
      />
      <TryItCard
        to="/dns-lookup"
        title="🔍 DNS Lookup"
        body="See how domain names are translated into IP addresses after traffic leaves your local network."
      />

      <Callout tone="info" title="Did You Know?">
        When you type www.google.com, your computer first checks whether the destination is on the local network. Since it isn't, the traffic is sent to your Default Gateway, which forwards it through your Internet Service Provider (ISP) and across the Internet until it reaches Google's servers. This entire process usually takes only a fraction of a second.
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
          <Link to="/academy/subnetting-made-easy" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 10: Subnetting Made Easy
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
      q: "What is the primary role of a Default Gateway?",
      options: ["Assign IP addresses", "Forward traffic to other networks", "Store websites", "Resolve domain names"],
      answer: 1,
    },
    {
      q: "Which device is usually the Default Gateway in a home network?",
      options: ["Switch", "Laptop", "Router", "Printer"],
      answer: 2,
    },
    {
      q: "If your destination is on the same subnet, where is the traffic sent?",
      options: ["Directly to the destination device", "To the Internet", "To the DNS server", "Always to the Default Gateway"],
      answer: 0,
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
