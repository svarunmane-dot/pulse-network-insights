import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson7-hero.jpg";

export const Route = createFileRoute("/academy/subnet-masks")({
  head: () =>
    toolHead({
      path: "/academy/subnet-masks",
      title: "Lesson 7: Understanding Subnet Masks (255.255.255.0) | Pulse Speed Academy",
      description:
        "Learn what a subnet mask is, how 255.255.255.0 (/24) splits network and host portions, CIDR equivalents, usable host counts, real examples and a quiz.",
      name: "Lesson 7 – Understanding Subnet Masks",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is a subnet mask?",
          a: "A subnet mask is a number that tells a device which part of an IP address identifies the network and which part identifies the host.",
        },
        {
          q: "What is 255.255.255.0 in CIDR notation?",
          a: "255.255.255.0 is written as /24 in CIDR notation. It provides 254 usable host addresses.",
        },
        {
          q: "Can 192.168.1.10 and 192.168.2.20 communicate directly with a /24 mask?",
          a: "No. With a /24 mask they are on different networks (192.168.1.0 and 192.168.2.0), so traffic must pass through a router or Layer 3 switch.",
        },
      ],
    }),
  component: Lesson7,
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

const preStyle: React.CSSProperties = {
  background: "#0f1422",
  border: "1px solid #1f2740",
  borderRadius: 12,
  padding: 16,
  color: "#c8d0e0",
  fontFamily: "monospace",
  fontSize: 13,
  overflowX: "auto",
  lineHeight: 1.6,
};

function Lesson7() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 07 · BEGINNER · 10 MIN READ
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
        Understanding Subnet Masks (255.255.255.0) Made Simple
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        A subnet mask draws the boundary between the network part and the host
        part of an IP address. Here's how it works, in plain English.
      </p>

      <img
        src={heroImg}
        alt="Diagram showing IP address 192.168.1.25 split into network portion 192.168.1 and host portion 25 by subnet mask 255.255.255.0 (/24)"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        You've learned what an IP address is and why subnetting is important.
        Now it's time to answer a common question: what is a subnet mask?
      </P>
      <P>A subnet mask works together with an IP address to identify:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Which part is the network</li>
        <li>Which part is the device (host)</li>
      </ul>
      <P>
        Without a subnet mask, devices wouldn't know whether another device is
        on the same local network or somewhere else on the Internet.
      </P>

      <H2>What is a Subnet Mask?</H2>
      <P>
        A subnet mask is a number that tells a device which part of an IP
        address identifies the network and which part identifies the host.
        Think of it as a boundary line.
      </P>
      <pre style={preStyle}>{`IP Address:     192.168.1.25
Subnet Mask:    255.255.255.0

192.168.1  =  Network
       25  =  Device (Host)`}</pre>

      <H2>Why Do We Need a Subnet Mask?</H2>
      <P>
        Imagine a city. Every house has a street name and a house number — for
        example, <Code>25, Oxford Street</Code>. Oxford Street is the network
        and 25 is the house. A subnet mask tells devices where the "street name"
        ends and the "house number" begins.
      </P>

      <H2>The Most Common Subnet Mask</H2>
      <P>
        The subnet mask you'll see most often is <Code>255.255.255.0</Code>,
        also written as <Code>/24</Code>. These two notations mean exactly the
        same thing.
      </P>
      <Table
        head={["Subnet Mask", "CIDR"]}
        rows={[
          ["255.255.255.0", "/24"],
          ["255.255.255.128", "/25"],
          ["255.255.255.192", "/26"],
          ["255.255.255.224", "/27"],
        ]}
      />
      <P>
        You'll often see CIDR notation in modern networking because it's shorter
        and easier to read.
      </P>

      <H2>How Does It Work?</H2>
      <P>Suppose two computers have these addresses, both using 255.255.255.0:</P>
      <Table
        head={["Device", "IP Address"]}
        rows={[
          ["PC 1", "192.168.1.10"],
          ["PC 2", "192.168.1.50"],
        ]}
      />
      <P>
        Both devices belong to the same network — <Code>192.168.1.0</Code>.
        Since they're on the same network, they can communicate directly through
        a switch.
      </P>

      <H2>Different Network Example</H2>
      <P>
        Now imagine another computer at <Code>192.168.2.25</Code>. Even though
        the addresses look similar, this device belongs to a different network:{" "}
        <Code>192.168.2.0</Code>. Communication between these two networks
        requires a router.
      </P>

      <H2>Common Subnet Masks</H2>
      <Table
        head={["CIDR", "Subnet Mask", "Usable IP Addresses"]}
        rows={[
          ["/24", "255.255.255.0", "254"],
          ["/25", "255.255.255.128", "126"],
          ["/26", "255.255.255.192", "62"],
          ["/27", "255.255.255.224", "30"],
          ["/28", "255.255.255.240", "14"],
        ]}
      />
      <P>
        Don't worry about memorising these yet — the Subnet Calculator can help,
        and you'll learn how these numbers are calculated in later lessons.
      </P>

      <H2>Real-World Example</H2>
      <P>Imagine a company with two departments:</P>
      <Table
        head={["Department", "Network"]}
        rows={[
          ["Finance", "192.168.10.0/24"],
          ["HR", "192.168.20.0/24"],
        ]}
      />
      <P>
        Although both departments use the same subnet mask, they belong to
        different networks. If Finance needs to communicate with HR, the traffic
        passes through a router or Layer 3 switch.
      </P>

      <H2>Why Is This Important?</H2>
      <P>Subnet masks help devices answer a simple question:</P>
      <Callout tone="info" title="❓ THE DECISION EVERY PACKET TRIGGERS">
        "Is the destination on my local network, or do I need to send the
        traffic to a router?" If the destination is local, send directly. If
        it's on another network, send it to the default gateway (router). This
        happens every time you browse the Internet or access another device.
      </Callout>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ THINKING THE SUBNET MASK IS ANOTHER IP ADDRESS">
        It isn't. A subnet mask only defines the network boundary.
      </Callout>
      <Callout tone="warn" title="❌ ASSUMING EVERY NETWORK USES 255.255.255.0">
        Many businesses use different subnet masks depending on the number of
        devices they need.
      </Callout>
      <Callout tone="warn" title="❌ BELIEVING SIMILAR IPS ARE ALWAYS ON THE SAME NETWORK">
        The subnet mask determines the network — not just the IP address.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ A subnet mask divides an IP address into a network portion and a host portion.</li>
        <li>✔ The most common subnet mask is 255.255.255.0 (/24).</li>
        <li>✔ Devices on the same subnet can usually communicate directly.</li>
        <li>✔ Devices on different subnets require a router or Layer 3 switch.</li>
        <li>✔ Understanding subnet masks is the foundation for learning subnetting.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <TryItCard
        to="/subnet-calculator"
        title="🧮 Subnet Calculator"
        body="Enter 192.168.1.0/24 and experiment with /25, /26 and /27."
      />
      <TryItCard
        to="/global"
        title="🌍 What's My IP"
        body="Compare your IP address with your network's subnet."
      />
      <TryItCard
        to="/ping"
        title="📡 Ping Tool"
        body="Test connectivity between devices on different networks."
      />

      <H2>Did You Know?</H2>
      <Callout tone="info" title="💡 YOUR HOME ROUTER">
        Your home router usually uses 192.168.1.1/24 or 192.168.0.1/24 as its
        default network. That means it can support up to 254 usable devices —
        more than enough for most homes.
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
          <Link to="/academy/subnetting" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 6: What is Subnetting?
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
      q: "What does a subnet mask do?",
      options: [
        "Connects to the Internet",
        "Identifies the network and host portions of an IP address",
        "Assigns IP addresses",
        "Encrypts traffic",
      ],
      answer: 1,
    },
    {
      q: "Which subnet mask is equivalent to /24?",
      options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.128"],
      answer: 2,
    },
    {
      q: "If two devices have IPs 192.168.1.10 and 192.168.2.20 with a /24 subnet mask, can they communicate directly?",
      options: ["Yes", "No, they need a router"],
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