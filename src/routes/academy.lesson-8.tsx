import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson8-hero.jpg";

export const Route = createFileRoute("/academy/lesson-8")({
  head: () =>
    toolHead({
      path: "/academy/lesson-8",
      title: "Lesson 8: CIDR Notation Explained (/24, /25, /26, /27) – Pulse Speed Academy",
      description:
        "Learn CIDR notation in plain English. Understand what /24, /25, /26 and /27 mean, how they relate to subnet masks, and when to use smaller subnets.",
      name: "Lesson 8 – CIDR Notation Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What does /24 mean in CIDR notation?",
          a: "/24 is a shorter way of writing the subnet mask 255.255.255.0. It means the first 24 bits identify the network and the remaining 8 bits identify hosts.",
        },
        {
          q: "Is a larger CIDR number a bigger or smaller network?",
          a: "A larger CIDR number means a smaller network. For example, /27 is smaller than /24 because fewer host addresses are available.",
        },
        {
          q: "How many usable IP addresses does /26 provide?",
          a: "/26 provides 62 usable IP addresses.",
        },
      ],
    }),
  component: Lesson8,
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

function Lesson8() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 08 · BEGINNER · 10 MIN READ
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
        CIDR Notation Explained (/24, /25, /26, /27) Without the Confusion
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Learn what the slash means after an IP address, how CIDR relates to subnet masks, and why modern networks use it instead of classes.
      </p>

      <img
        src={heroImg}
        alt="CIDR notation visualised as a pizza sliced into /24, /25, /26 and /27 subnets"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        If you've ever seen an IP address like <Code>192.168.1.0/24</Code>, you might have wondered: what does "/24" actually mean?
      </P>
      <P>
        The number after the slash is called <strong style={{ color: "#fff" }}>CIDR notation</strong> (Classless Inter-Domain Routing). It tells us how large or small a network is.
      </P>
      <P>
        Don't worry — you don't need to understand binary to understand CIDR. By the end of this lesson, you'll know exactly what /24, /25, /26 and /27 mean.
      </P>

      <H2>What is CIDR?</H2>
      <P>
        CIDR (Classless Inter-Domain Routing) is a short way of writing a subnet mask.
      </P>
      <P>
        Instead of writing <Code>255.255.255.0</Code>, we simply write <Code>/24</Code>. Both represent the same subnet mask.
      </P>
      <Table
        head={["CIDR", "Subnet Mask"]}
        rows={[
          ["/24", "255.255.255.0"],
          ["/25", "255.255.255.128"],
          ["/26", "255.255.255.192"],
          ["/27", "255.255.255.224"],
        ]}
      />
      <P>
        CIDR is shorter, easier to read, and is the standard format used in networking today.
      </P>

      <H2>Think of CIDR Like a Pizza 🍕</H2>
      <P>
        Imagine you order one whole pizza.
      </P>
      <Callout tone="info" title="/24 — THE WHOLE PIZZA">
        You keep the whole pizza for one group. <Code>🍕 = 254 usable IP addresses</Code>.
      </Callout>
      <Callout tone="info" title="/25 — 2 SLICES">
        You cut the pizza into 2 equal slices. Each slice gets <Code>🍕 = 126 usable IP addresses</Code>.
      </Callout>
      <Callout tone="info" title="/26 — 4 SLICES">
        Cut each slice in half. Now you have 4 smaller slices. Each network has <Code>🍕 = 62 usable IP addresses</Code>.
      </Callout>
      <Callout tone="info" title="/27 — 8 SLICES">
        Cut again. Now you have 8 slices. Each network contains <Code>🍕 = 30 usable IP addresses</Code>.
      </Callout>
      <P>
        As the CIDR number gets larger, the network becomes smaller, with fewer available IP addresses.
      </P>

      <H2>CIDR Sizes at a Glance</H2>
      <Table
        head={["CIDR", "Subnet Mask", "Usable IP Addresses", "Typical Use"]}
        rows={[
          ["/24", "255.255.255.0", "254", "Office floor"],
          ["/25", "255.255.255.128", "126", "Large department"],
          ["/26", "255.255.255.192", "62", "Small office"],
          ["/27", "255.255.255.224", "30", "Meeting room, lab, branch office"],
          ["/28", "255.255.255.240", "14", "Small network"],
          ["/29", "255.255.255.248", "6", "Point-to-point or network equipment"],
        ]}
      />

      <H2>Real-World Example</H2>
      <P>
        Imagine a company has one network: <Code>192.168.1.0/24</Code>. This network supports up to 254 usable devices.
      </P>
      <P>
        Now the company grows and creates four departments:
      </P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Finance</li>
        <li>HR</li>
        <li>IT</li>
        <li>Sales</li>
      </ul>
      <P>
        Instead of one large network, the administrator divides it into four /26 subnets.
      </P>
      <Table
        head={["Department", "Network"]}
        rows={[
          ["Finance", "192.168.1.0/26"],
          ["HR", "192.168.1.64/26"],
          ["IT", "192.168.1.128/26"],
          ["Sales", "192.168.1.192/26"],
        ]}
      />
      <P>
        Each department now has its own subnet with 62 usable IP addresses.
      </P>

      <H2>Why Use Smaller Networks?</H2>
      <P>Smaller networks provide several advantages:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✅ Less broadcast traffic</li>
        <li>✅ Better security</li>
        <li>✅ Easier troubleshooting</li>
        <li>✅ Better performance</li>
      </ul>
      <P>
        That's why enterprises rarely place hundreds of devices into a single /24 network.
      </P>

      <H2>Easy Rule to Remember</H2>
      <Table
        head={["CIDR", "Usable Devices"]}
        rows={[
          ["/24", "254"],
          ["/25", "126"],
          ["/26", "62"],
          ["/27", "30"],
          ["/28", "14"],
          ["/29", "6"],
          ["/30", "2"],
        ]}
      />
      <P>
        <strong style={{ color: "#fff" }}>Simple memory trick:</strong> every time the CIDR number increases by 1, the number of networks doubles and the number of usable IP addresses roughly halves.
      </P>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ BIGGER CIDR MEANS A BIGGER NETWORK">
        It's actually the opposite. /27 is smaller than /24.
      </Callout>
      <Callout tone="warn" title="❌ CIDR REPLACES THE IP ADDRESS">
        CIDR doesn't replace the IP address — it simply describes the size of the network.
      </Callout>
      <Callout tone="warn" title="❌ EVERY COMPANY USES /24">
        Many organisations use /25, /26, /27, or even smaller subnets depending on the number of devices they need.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ CIDR is a shorter way of writing a subnet mask.</li>
        <li>✔ /24 is the same as 255.255.255.0.</li>
        <li>✔ A larger CIDR number means a smaller network.</li>
        <li>✔ Smaller subnets improve performance, security, and network management.</li>
        <li>✔ Modern networks use CIDR instead of class-based addressing.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <TryItCard
        to="/subnet"
        title="🧮 Subnet Calculator"
        body="Try 192.168.1.0/24, /25, /26 and /27 and watch the usable hosts change."
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
      <Callout tone="info" title="💡 CLOUD PROVIDERS USE CIDR">
        Cloud providers such as AWS, Microsoft Azure, and Google Cloud all use CIDR notation when creating Virtual Private Clouds (VPCs) and subnets. Understanding CIDR is therefore an essential skill for both network engineers and cloud engineers.
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
          <Link to="/academy/lesson-7" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 7: Understanding Subnet Masks
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
      q: "Which CIDR provides the most usable IP addresses?",
      options: ["/24", "/25", "/26", "/27"],
      answer: 0,
    },
    {
      q: "What does CIDR replace?",
      options: ["IP Address", "Subnet Mask", "MAC Address", "DNS"],
      answer: 1,
    },
    {
      q: "Which subnet is the smallest?",
      options: ["/24", "/25", "/26", "/27"],
      answer: 3,
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
