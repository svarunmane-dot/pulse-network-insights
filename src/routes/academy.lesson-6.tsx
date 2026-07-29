import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson6-hero.jpg";

export const Route = createFileRoute("/academy/lesson-6")({
  head: () =>
    toolHead({
      path: "/academy/lesson-6",
      title: "Lesson 6: What is Subnetting? A Beginner's Guide – Pulse Speed Academy",
      description:
        "Learn subnetting basics: how dividing a large network into smaller subnets improves performance, security and scalability. Real-world examples, quiz and hands-on subnet calculator.",
      name: "Lesson 6 – What is Subnetting?",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is subnetting in simple terms?",
          a: "Subnetting is the process of dividing one large IP network into smaller networks called subnets, each with its own range of IP addresses.",
        },
        {
          q: "Why do we use subnetting?",
          a: "Subnetting improves network performance by reducing broadcast traffic, strengthens security by isolating groups, and makes networks easier to grow and troubleshoot.",
        },
        {
          q: "What does /24 mean?",
          a: "The /24 is the prefix length. It means the first 24 bits of the IP address identify the network, leaving 254 usable host addresses in that subnet.",
        },
      ],
    }),
  component: Lesson6,
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
                <td key={j} style={{ padding: "10px 12px", color: "#c8d0e0", borderTop: i === 0 ? "none" : "1px solid #1f2740", fontFamily: c.match(/\d+\.\d+\.\d+/) ? "monospace" : undefined }}>
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

function Lesson6() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 06 · BEGINNER · 10 MIN READ
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
        What is Subnetting? A Beginner's Guide to Dividing Networks
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Subnetting splits one large IP network into smaller, easier-to-manage
        pieces. Learn what a subnet is, why it matters and how real networks use it.
      </p>

      <img
        src={heroImg}
        alt="Office building diagram with Finance, HR and IT departments each on their own subnet connected through a core router"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        Imagine a school with 500 students all trying to enter through one door.
        It would be slow, crowded and difficult to manage. Now imagine the school
        has five separate entrances, each for different groups of students.
        Everyone gets in faster, and it's much easier to control.
      </P>
      <P>
        Subnetting works in a similar way. Instead of having one large network,
        subnetting divides it into smaller, more efficient networks.
      </P>

      <H2>What is Subnetting?</H2>
      <P>
        Subnetting is the process of dividing a large IP network into smaller
        networks called <strong style={{ color: "#fff" }}>subnets</strong>. Each
        subnet has its own range of IP addresses. This improves:
      </P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Network performance</li>
        <li>Security</li>
        <li>Traffic management</li>
        <li>Scalability</li>
      </ul>
      <P>Think of subnetting as creating separate rooms inside one large building.</P>

      <H2>Why Do We Need Subnetting?</H2>
      <P>Imagine an office with 300 computers. If they are all on the same network:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Every broadcast reaches every device.</li>
        <li>Network traffic increases.</li>
        <li>Troubleshooting becomes harder.</li>
        <li>Security is more difficult to manage.</li>
      </ul>
      <P>
        By creating smaller subnets, only the devices within each subnet receive
        local broadcast traffic.
      </P>

      <H2>Real-World Example</H2>
      <P>A company has three departments — Finance, HR and IT. Instead of putting everyone on one network like <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>192.168.1.0/24</code>, the network can be divided:</P>
      <Table
        head={["Department", "Network"]}
        rows={[
          ["Finance", "192.168.1.0/26"],
          ["HR", "192.168.1.64/26"],
          ["IT", "192.168.1.128/26"],
        ]}
      />
      <P>Each department has its own subnet, making the network easier to manage and more secure.</P>

      <H2>What is a Subnet?</H2>
      <P>A subnet is simply a smaller network created from a larger one. For example, the original network:</P>
      <pre
        style={{
          background: "#0f1422",
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: 16,
          color: "#c8d0e0",
          fontFamily: "monospace",
          fontSize: 13,
          overflowX: "auto",
          lineHeight: 1.6,
        }}
      >{`192.168.1.0/24

can be divided into:

192.168.1.0/26
192.168.1.64/26
192.168.1.128/26
192.168.1.192/26`}</pre>
      <P>Instead of one large network, you now have four smaller ones.</P>

      <H2>Benefits of Subnetting</H2>
      <Callout tone="info" title="🚀 BETTER PERFORMANCE">
        Smaller broadcast domains reduce unnecessary traffic across the network.
      </Callout>
      <Callout tone="info" title="🔒 IMPROVED SECURITY">
        Sensitive departments — Finance, HR, Guests — can be separated, and each
        subnet can have different firewall rules.
      </Callout>
      <Callout tone="info" title="📈 EASIER GROWTH">
        Need another department? Simply create another subnet without
        redesigning the whole network.
      </Callout>
      <Callout tone="info" title="🛠 EASIER TROUBLESHOOTING">
        When a problem occurs, it's easier to identify which subnet is affected.
      </Callout>

      <H2>Where is Subnetting Used?</H2>
      <P>Subnetting is everywhere — office networks, schools, hospitals, universities, data centres, cloud environments and enterprise networks. Even your home router uses subnetting, although you may not notice it.</P>

      <H2>Understanding "/24"</H2>
      <P>
        You may have seen addresses like <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>192.168.1.0/24</code>. The "/24" is called the <strong style={{ color: "#fff" }}>prefix length</strong>. It tells us how many bits are used for the network portion of the IP address.
      </P>
      <P>For beginners, just remember: <strong style={{ color: "#fff" }}>/24 is one of the most common subnet sizes and provides 254 usable IP addresses.</strong> We'll learn how to calculate subnet sizes in the next lesson.</P>

      <H2>Real-Life Scenario</H2>
      <P>Imagine a company with three floors — each department gets its own subnet:</P>
      <Table
        head={["Floor", "Department", "Subnet"]}
        rows={[
          ["Floor 1", "Finance", "192.168.10.0/24"],
          ["Floor 2", "Sales", "192.168.20.0/24"],
          ["Floor 3", "IT", "192.168.30.0/24"],
        ]}
      />
      <P>If there's a network issue on the Sales floor, it won't automatically affect Finance or IT.</P>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ BIGGER NETWORKS ARE ALWAYS BETTER">
        Large flat networks create more broadcast traffic and are harder to manage.
      </Callout>
      <Callout tone="warn" title="❌ EVERY SUBNET HAS THE SAME NUMBER OF DEVICES">
        Subnet sizes can be adjusted depending on the number of devices needed.
      </Callout>
      <Callout tone="warn" title="❌ SUBNETTING IS ONLY FOR LARGE COMPANIES">
        Even small businesses and home labs benefit from understanding subnetting.
      </Callout>

      <H2>Did You Know?</H2>
      <Callout tone="info" title="💡 VLANS + SUBNETS">
        Many companies use VLANs (Virtual LANs) together with subnetting. For
        example: VLAN 10 → Finance → 192.168.10.0/24, VLAN 20 → HR → 192.168.20.0/24,
        VLAN 30 → IT → 192.168.30.0/24. This combination improves both security
        and network management.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ Subnetting divides one large network into multiple smaller networks.</li>
        <li>✔ Smaller networks reduce broadcast traffic.</li>
        <li>✔ Subnetting improves performance, security and scalability.</li>
        <li>✔ Most businesses use subnetting to separate departments or locations.</li>
        <li>✔ Understanding subnetting is essential for anyone studying networking.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <TryItCard
        to="/subnet"
        title="🧮 Subnet Calculator"
        body="Enter 192.168.1.0/24 and explore the network address, broadcast, host range and more."
      />
      <TryItCard
        to="/global"
        title="🌍 What's My IP"
        body="Check your current public IP address and see how you appear on the Internet."
      />
      <TryItCard
        to="/ping"
        title="📡 Ping Tool"
        body="Test connectivity between devices and measure round-trip latency."
      />
      <TryItCard
        to="/dnslookup"
        title="🔍 DNS Lookup"
        body="See how devices translate friendly names into IP addresses."
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
          <Link to="/academy/lesson-5" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 5: Public vs Private IP Addresses
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
      q: "What is subnetting?",
      options: [
        "Connecting to the Internet",
        "Dividing a network into smaller networks",
        "Installing a firewall",
        "Assigning a MAC address",
      ],
      answer: 1,
    },
    {
      q: "Why do we subnet?",
      options: [
        "To increase broadcast traffic",
        "To improve performance and organisation",
        "To remove routers",
        "To slow down the network",
      ],
      answer: 1,
    },
    {
      q: "Which department might have its own subnet?",
      options: ["Finance", "HR", "IT", "All of the above"],
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