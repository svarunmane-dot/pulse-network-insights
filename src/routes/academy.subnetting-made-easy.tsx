import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson10-hero.jpg";

export const Route = createFileRoute("/academy/subnetting-made-easy")({
  head: () =>
    toolHead({
      path: "/academy/subnetting-made-easy",
      title: "Lesson 10: Subnetting Made Easy – Divide Networks Step by Step | Pulse Speed Academy",
      description:
        "Master subnetting in 15 minutes. Learn how to divide a network into smaller subnets using CIDR, block sizes, and usable IP ranges with real-world examples.",
      name: "Lesson 10 – Subnetting Made Easy",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is subnetting in simple terms?",
          a: "Subnetting is the process of dividing one large network into smaller, more manageable networks called subnets.",
        },
        {
          q: "How do you calculate the block size of a subnet?",
          a: "Subtract the subnet mask's last octet value from 256. For example, a /26 subnet uses mask 255.255.255.192, so the block size is 256 - 192 = 64.",
        },
        {
          q: "Why should you avoid assigning the network and broadcast addresses to devices?",
          a: "The network address identifies the subnet itself, and the broadcast address is reserved for traffic sent to all devices on the subnet.",
        },
      ],
    }),
  component: Lesson10,
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

function Lesson10() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 10 · BEGINNER · 15 MIN READ
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
        Subnetting Made Easy – Learn to Divide Networks Step by Step
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Subnetting is one of the most valuable skills for network engineers. Follow this simple six-step process and divide networks without binary math.
      </p>

      <img
        src={heroImg}
        alt="Subnetting visual showing one network divided into four smaller subnets"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        Subnetting is one of the most valuable skills for network engineers.
      </P>
      <P>
        At first, it can seem complicated, but once you understand a simple step-by-step process, it becomes much easier.
      </P>
      <P>
        In this lesson, you'll learn how to divide a network into smaller networks using CIDR notation—without needing to understand binary.
      </P>

      <H2>Why Do We Divide Networks?</H2>
      <P>
        Imagine you have a company with 200 employees.
      </P>
      <P>
        Instead of placing everyone on one large network:
      </P>
      <Callout tone="info" title="Single Large Network">
        <Code>192.168.1.0/24</Code>
      </Callout>
      <P>You create separate networks for:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>💼 Finance</li>
        <li>👥 HR</li>
        <li>🖥 IT</li>
        <li>📈 Sales</li>
      </ul>
      <P>Benefits include:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>🚀 Better performance</li>
        <li>🔒 Better security</li>
        <li>🛠 Easier troubleshooting</li>
        <li>📈 Easier expansion</li>
      </ul>

      <H2>Step 1: Know Your Starting Network</H2>
      <P>Let's begin with:</P>
      <Callout tone="info" title="Starting Network">
        <Code>192.168.1.0/24</Code>
      </Callout>
      <P>This network contains:</P>
      <Table
        head={["Item", "Value"]}
        rows={[
          ["Total Addresses", "256"],
          ["Usable Addresses", "254"],
          ["Network Address", "192.168.1.0"],
          ["Broadcast Address", "192.168.1.255"],
        ]}
      />

      <H2>Step 2: Decide How Many Subnets You Need</H2>
      <P>Suppose you need 4 departments.</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Finance</li>
        <li>HR</li>
        <li>IT</li>
        <li>Sales</li>
      </ul>
      <P>
        You need: <strong style={{ color: "#fff" }}>4 separate networks</strong>.
      </P>

      <H2>Step 3: Choose the Correct CIDR</H2>
      <P>Starting network:</P>
      <Callout tone="info" title="Original Prefix">
        <Code>/24</Code>
      </Callout>
      <P>
        To create four equal-sized networks, <strong style={{ color: "#fff" }}>increase the CIDR by 2 bits</strong>.
      </P>
      <Callout tone="info" title="New Prefix">
        <Code>/26</Code>
      </Callout>
      <P>
        A /24 divided into four /26 subnets gives you four networks with 62 usable IP addresses each.
      </P>

      <H2>Step 4: Find the Block Size</H2>
      <P>For a /26 subnet, the subnet mask is:</P>
      <Callout tone="info" title="Subnet Mask">
        <Code>255.255.255.192</Code>
      </Callout>
      <P>
        <Code>256 - 192 = 64</Code>
      </P>
      <P>
        The <strong style={{ color: "#fff" }}>block size is 64</strong>. This means each new subnet starts every 64 IP addresses.
      </P>

      <H2>Step 5: List the Subnets</H2>
      <Table
        head={["Subnet", "Network Address", "Broadcast Address"]}
        rows={[
          ["1", "192.168.1.0", "192.168.1.63"],
          ["2", "192.168.1.64", "192.168.1.127"],
          ["3", "192.168.1.128", "192.168.1.191"],
          ["4", "192.168.1.192", "192.168.1.255"],
        ]}
      />

      <H2>Step 6: Calculate the Usable Range</H2>
      <P>Each subnet's usable range sits between its network and broadcast addresses.</P>
      <Table head={["Item", "Value"]} rows={[["Network", "192.168.1.0"], ["First Host", "192.168.1.1"], ["Last Host", "192.168.1.62"], ["Broadcast", "192.168.1.63"]]} />
      <Table head={["Item", "Value"]} rows={[["Network", "192.168.1.64"], ["First Host", "192.168.1.65"], ["Last Host", "192.168.1.126"], ["Broadcast", "192.168.1.127"]]} />
      <Table head={["Item", "Value"]} rows={[["Network", "192.168.1.128"], ["First Host", "192.168.1.129"], ["Last Host", "192.168.1.190"], ["Broadcast", "192.168.1.191"]]} />
      <Table head={["Item", "Value"]} rows={[["Network", "192.168.1.192"], ["First Host", "192.168.1.193"], ["Last Host", "192.168.1.254"], ["Broadcast", "192.168.1.255"]]} />

      <H2>Visual Representation</H2>
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 16,
          background: "#0f1422",
          fontFamily: "monospace",
          color: "#c8d0e0",
          margin: "14px 0",
          lineHeight: 1.8,
        }}
      >
        <div>192.168.1.0/24</div>
        <div style={{ color: "#6b7794" }}>|----------------------256 Addresses----------------------|</div>
        <div style={{ color: "#00D4AA" }}>|----Subnet 1----|</div>
        <div>0               63</div>
        <div style={{ color: "#9B8FE8" }}>|----Subnet 2----|</div>
        <div>64             127</div>
        <div style={{ color: "#00D4AA" }}>|----Subnet 3----|</div>
        <div>128            191</div>
        <div style={{ color: "#9B8FE8" }}>|----Subnet 4----|</div>
        <div>192            255</div>
      </div>

      <H2>Real-World Example</H2>
      <P>A company has four departments:</P>
      <Table
        head={["Department", "Network"]}
        rows={[
          ["Finance", "192.168.1.0/26"],
          ["HR", "192.168.1.64/26"],
          ["IT", "192.168.1.128/26"],
          ["Sales", "192.168.1.192/26"],
        ]}
      />
      <P>Each department now has:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>62 usable IP addresses</li>
        <li>Its own broadcast domain</li>
        <li>Better security</li>
        <li>Reduced network congestion</li>
      </ul>

      <H2>Easy Memory Trick</H2>
      <P>Follow these six steps every time:</P>
      <ol style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.9, paddingLeft: 22 }}>
        <li>Identify the starting network.</li>
        <li>Decide how many subnets you need.</li>
        <li>Choose the new CIDR.</li>
        <li>Calculate the block size.</li>
        <li>List each subnet.</li>
        <li>Find the usable IP range.</li>
      </ol>
      <P>If you can follow these six steps, you can solve most basic subnetting problems.</P>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ Forgetting the Network Address">
        Never assign the network address to a device.
      </Callout>
      <Callout tone="warn" title="❌ Using the Broadcast Address">
        The broadcast address is reserved and should not be assigned to hosts.
      </Callout>
      <Callout tone="warn" title="❌ Choosing the Wrong CIDR">
        Always choose a subnet that provides enough usable IP addresses for the number of devices you expect.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ Subnetting divides one large network into smaller, manageable networks.</li>
        <li>✔ The block size tells you where each subnet begins.</li>
        <li>✔ A /24 network can be divided into four /26 subnets.</li>
        <li>✔ Every subnet has a Network Address, usable IP range, and Broadcast Address.</li>
        <li>✔ Subnetting improves performance, security, and scalability.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <P>Use the Pulse-Speed Subnet Calculator and try these challenges:</P>
      <Table
        head={["Network", "Task"]}
        rows={[
          ["192.168.1.0/24", "Divide into 2 subnets"],
          ["192.168.1.0/24", "Divide into 4 subnets"],
          ["10.10.0.0/24", "Find the /26 subnets"],
          ["172.16.20.0/24", "Calculate all usable IP ranges"],
        ]}
      />
      <TryItCard
        to="/subnet-calculator"
        title="🧮 Subnet Calculator"
        body="Enter any IP and CIDR to instantly see networks, broadcast addresses, and usable host ranges."
      />

      <H2>Pro Tip 💡</H2>
      <Callout tone="info" title="Memorise Common Block Sizes">
        Knowing these values allows experienced network engineers to calculate subnet ranges mentally.
      </Callout>
      <Table
        head={["CIDR", "Block Size"]}
        rows={[
          ["/25", "128"],
          ["/26", "64"],
          ["/27", "32"],
          ["/28", "16"],
          ["/29", "8"],
          ["/30", "4"],
        ]}
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
          <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>
            PREVIOUS LESSON
          </div>
          <Link to="/academy/network-broadcast-usable-ip" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 9: Network, Broadcast & Usable IP Range
          </Link>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>
            NEXT LESSON
          </div>
          <Link to="/academy/what-is-a-default-gateway" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            Lesson 11: What is a Default Gateway? →
          </Link>
        </div>
      </div>
    </article>
  );
}

function Quiz() {
  const questions = [
    {
      q: "How many /26 subnets can be created from one /24 network?",
      options: ["2", "4", "8", "16"],
      answer: 1,
    },
    {
      q: "What is the block size for a /26 subnet?",
      options: ["32", "64", "128", "256"],
      answer: 1,
    },
    {
      q: "What is the first usable IP address in 192.168.1.64/26?",
      options: ["192.168.1.64", "192.168.1.65", "192.168.1.66", "192.168.1.127"],
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
