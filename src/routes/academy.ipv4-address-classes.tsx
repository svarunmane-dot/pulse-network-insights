import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson4-hero.jpg";
import classesImg from "@/assets/academy-lesson4-classes.jpg";

export const Route = createFileRoute("/academy/ipv4-address-classes")({
  head: () =>
    toolHead({
      path: "/academy/ipv4-address-classes",
      title: "Lesson 4: IPv4 Classes (A, B, C, D & E) Explained – Pulse Speed Academy",
      description:
        "Learn the five IPv4 address classes, their ranges, default subnet masks, private ranges and real-world examples. Includes a quick quiz and hands-on practice tools.",
      name: "Lesson 4 – IPv4 Classes (A, B, C, D & E) Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What are the five classes of IPv4 addresses?",
          a: "IPv4 addresses are divided into Class A (1–126), Class B (128–191), Class C (192–223), Class D (224–239) for multicast, and Class E (240–255) for experimental use.",
        },
        {
          q: "What is the default subnet mask for Class A, B and C?",
          a: "Class A uses 255.0.0.0 (/8), Class B uses 255.255.0.0 (/16), and Class C uses 255.255.255.0 (/24).",
        },
        {
          q: "Is 127.0.0.1 part of Class A?",
          a: "Although 127 falls in the Class A range, it is reserved for loopback testing and is not used as a normal Class A network address.",
        },
      ],
    }),
  component: Lesson4,
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

function TryItCard({
  to,
  title,
  body,
}: {
  to: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(0,212,170,0.4)",
        background:
          "linear-gradient(135deg, rgba(0,212,170,0.10), rgba(155,143,232,0.08))",
        textDecoration: "none",
      }}
    >
      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        🧪 TRY IT NOW
      </div>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 4 }}>
        {title}
      </div>
      <div style={{ color: "#c8d0e0", fontSize: 13, marginTop: 4 }}>{body}</div>
    </Link>
  );
}

function Table({
  head,
  rows,
}: {
  head: string[];
  rows: string[][];
}) {
  return (
    <div
      style={{
        border: "1px solid #1f2740",
        borderRadius: 12,
        overflow: "hidden",
        margin: "14px 0",
      }}
    >
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

function Lesson4() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 04 · BEGINNER · 10 MIN READ
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
        IPv4 Classes (A, B, C, D & E) Explained
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Not all IPv4 addresses are the same. Learn how the first octet decides the
        class, what each class is used for, and why it still matters today.
      </p>

      <img
        src={heroImg}
        alt="Diagram showing the five IPv4 address classes A, B, C, D and E"
        width={1024}
        height={1024}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 16,
          border: "1px solid #1f2740",
          margin: "24px 0",
        }}
      />

      <H2>Introduction</H2>
      <P>
        To make network management easier, IPv4 addresses were originally divided into
        five classes: <strong style={{ color: "#fff" }}>Class A</strong>,{" "}
        <strong style={{ color: "#fff" }}>Class B</strong>,{" "}
        <strong style={{ color: "#fff" }}>Class C</strong>,{" "}
        <strong style={{ color: "#fff" }}>Class D</strong>, and{" "}
        <strong style={{ color: "#fff" }}>Class E</strong>.
      </P>
      <P>
        Although modern networks mostly use CIDR (Classless Inter-Domain Routing),
        understanding IP classes is still important for networking interviews,
        certifications like CCNA, and understanding legacy systems.
      </P>

      <H2>What Are IPv4 Classes?</H2>
      <P>
        IPv4 addresses contain 32 bits, divided into four sections called octets.
        Each octet ranges from 0 to 255.
      </P>
      <div
        style={{
          background: "#0f1422",
          border: "1px solid #1f2740",
          borderRadius: 12,
          padding: "16px 20px",
          margin: "14px 0",
        }}
      >
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          192.168.1.100
        </div>
        <div style={{ color: "#6b7794", fontSize: 13, marginTop: 6 }}>
          Four octets separated by dots
        </div>
      </div>
      <P>Originally, the first octet determined the IP address class.</P>

      <H2>IPv4 Class Overview</H2>
      <Table
        head={["Class", "First Octet Range", "Default Subnet Mask", "Typical Use"]}
        rows={[
          ["A", "1 – 126", "255.0.0.0 (/8)", "Very large networks"],
          ["B", "128 – 191", "255.255.0.0 (/16)", "Medium-sized organisations"],
          ["C", "192 – 223", "255.255.255.0 (/24)", "Small businesses and homes"],
          ["D", "224 – 239", "N/A", "Multicast"],
          ["E", "240 – 255", "N/A", "Experimental"],
        ]}
      />
      <P>
        <strong style={{ color: "#fff" }}>Note:</strong> 127.x.x.x is reserved for
        loopback and is not part of Class A for normal network use.
      </P>

      <H2>Class A</H2>
      <P>
        <strong style={{ color: "#fff" }}>Range:</strong> 1.0.0.0 – 126.255.255.255
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Default mask:</strong> 255.0.0.0
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong> 10.20.30.40
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Supports millions of devices.</li>
        <li>Used by very large organisations.</li>
        <li>The first octet identifies the network.</li>
      </ul>

      <H2>Class B</H2>
      <P>
        <strong style={{ color: "#fff" }}>Range:</strong> 128.0.0.0 – 191.255.255.255
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Default mask:</strong> 255.255.0.0
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong> 172.16.25.10
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Suitable for medium-sized organisations.</li>
        <li>Two octets identify the network.</li>
        <li>The remaining octets identify devices.</li>
      </ul>

      <H2>Class C</H2>
      <P>
        <strong style={{ color: "#fff" }}>Range:</strong> 192.0.0.0 – 223.255.255.255
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Default mask:</strong> 255.255.255.0
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong> 192.168.1.25
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Most common in homes and small businesses.</li>
        <li>Supports up to 254 usable devices per subnet.</li>
        <li>Widely used for local area networks.</li>
      </ul>

      <TryItCard
        to="/subnet-calculator"
        title="Explore subnet masks in action"
        body="Enter 192.168.1.0/24 in the Subnet Calculator to see the network, broadcast and usable range."
      />

      <H2>Class D</H2>
      <P>
        <strong style={{ color: "#fff" }}>Range:</strong> 224.0.0.0 – 239.255.255.255
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Purpose:</strong> Used for multicast
        communication. Instead of sending data to one device, multicast allows one
        sender to communicate with multiple devices simultaneously.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example uses:</strong>
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>IPTV</li>
        <li>Live video streaming</li>
        <li>Routing protocol updates</li>
      </ul>

      <H2>Class E</H2>
      <P>
        <strong style={{ color: "#fff" }}>Range:</strong> 240.0.0.0 – 255.255.255.255
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Purpose:</strong> Reserved for experimental
        and research purposes. These addresses are not normally assigned to end
        devices.
      </P>

      <img
        src={classesImg}
        alt="Visual summary of IPv4 class ranges and private address ranges"
        loading="lazy"
        width={1024}
        height={1024}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 16,
          border: "1px solid #1f2740",
          margin: "12px 0",
        }}
      />

      <H2>Private IP Address Ranges</H2>
      <P>
        Certain IPv4 ranges are reserved for private networks. These addresses are
        commonly used in homes and businesses and are not routable on the public
        Internet.
      </P>
      <Table
        head={["Private Range", "Class"]}
        rows={[
          ["10.0.0.0 – 10.255.255.255", "A"],
          ["172.16.0.0 – 172.31.255.255", "B"],
          ["192.168.0.0 – 192.168.255.255", "C"],
        ]}
      />
      <P>
        <strong style={{ color: "#fff" }}>Common mistake:</strong> Not every
        172.x.x.x address is private. Only 172.16.0.0 to 172.31.255.255 are private.
      </P>

      <H2>Special IPv4 Addresses</H2>
      <Table
        head={["Address", "Purpose"]}
        rows={[
          ["127.0.0.1", "Loopback (localhost)"],
          ["255.255.255.255", "Broadcast"],
          ["0.0.0.0", "Default / unspecified address"],
          ["169.254.x.x", "APIPA (Automatic Private IP Addressing)"],
        ]}
      />

      <H2>Real-World Examples</H2>
      <Table
        head={["Network", "Example IP", "Class"]}
        rows={[
          ["Home Network", "192.168.1.10", "Class C"],
          ["Corporate Network", "10.25.30.100", "Class A Private"],
          ["University Network", "172.20.10.15", "Class B Private"],
        ]}
      />

      <TryItCard
        to="/whose-ip"
        title="Check your public IP range"
        body="Use the What's My IP tool to see whether your public IP is in a known range."
      />

      <H2>Do IP Classes Still Matter?</H2>
      <P>
        Modern networking uses CIDR, which allows more flexible subnet sizes than the
        original class-based system.
      </P>
      <P>However, IP classes are still useful because they:</P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Help beginners understand IPv4 addressing.</li>
        <li>Appear in networking certifications.</li>
        <li>Help identify common private IP ranges quickly.</li>
        <li>Provide historical context for how IPv4 evolved.</li>
      </ul>

      <H2>Common Mistakes</H2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <strong style={{ color: "#fff" }}>Assuming every 172.x.x.x address is private.</strong>{" "}
          Only 172.16.0.0 to 172.31.255.255 are private.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Thinking 127.0.0.1 connects to the Internet.</strong>{" "}
          It always refers to your own device.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Believing Class D is for normal computers.</strong>{" "}
          Class D is used only for multicast traffic.
        </li>
      </ul>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>IPv4 addresses were originally divided into five classes.</li>
        <li>Class A is designed for very large networks.</li>
        <li>Class B suits medium-sized organisations.</li>
        <li>Class C is the most common for homes and small businesses.</li>
        <li>Class D is used for multicast.</li>
        <li>Class E is reserved for experimental use.</li>
        <li>Today, CIDR has largely replaced class-based networking, but understanding classes remains valuable.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <P>Reinforce these concepts with free Pulse Speed tools:</P>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
          gap: 10,
          marginTop: 8,
        }}
      >
        {[
          { to: "/subnet-calculator", label: "🧮 Subnet Calculator" },
          { to: "/whose-ip", label: "🌍 What's My IP" },
          { to: "/ping-ip", label: "📡 Ping Tool" },
          { to: "/whose-ip", label: "🔍 WHOIS Lookup" },
          { to: "/dns-lookup", label: "🌐 DNS Lookup" },
        ].map((t) => (
          <Link
            key={t.to + t.label}
            to={t.to}
            style={{
              padding: "12px 14px",
              border: "1px solid #1f2740",
              borderRadius: 10,
              color: "#c8d0e0",
              textDecoration: "none",
              background: "#0f1422",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <H2>What's Next?</H2>
      <P>Continue your networking journey with upcoming lessons:</P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <Link to="/academy/ip-addressing" style={{ color: "#00D4AA", textDecoration: "none" }}>
            ← Lesson 3: What is an IP Address?
          </Link>
        </li>
        <li>
          <Link to="/academy/lan-wan-man-pan" style={{ color: "#00D4AA", textDecoration: "none" }}>
            ← Lesson 2: LAN vs WAN vs MAN vs PAN Explained
          </Link>
        </li>
        <li>
          <Link to="/academy/what-is-a-computer-network" style={{ color: "#00D4AA", textDecoration: "none" }}>
            ← Lesson 1: What is a Computer Network?
          </Link>
        </li>
        <li>
          <Link to="/academy/public-vs-private-ip" style={{ color: "#00D4AA", textDecoration: "none" }}>
            → Lesson 5: Public vs Private IP Addresses
          </Link>
        </li>
      </ul>

      <div style={{ marginTop: 32 }}>
        <Link
          to="/academy"
          style={{
            display: "inline-block",
            padding: "12px 18px",
            border: "1px solid #1f2740",
            borderRadius: 10,
            color: "#c8d0e0",
            textDecoration: "none",
          }}
        >
          ← All Lessons
        </Link>
      </div>
    </article>
  );
}

function Quiz() {
  const questions: {
    q: string;
    options: string[];
    answer: number;
  }[] = [
    {
      q: "Which class does 192.168.1.100 belong to?",
      options: ["Class A", "Class B", "Class C", "Class D"],
      answer: 2,
    },
    {
      q: "Which address is used for testing your own computer?",
      options: ["8.8.8.8", "127.0.0.1", "192.168.1.1", "224.0.0.1"],
      answer: 1,
    },
    {
      q: "Which class is used for multicast?",
      options: ["Class A", "Class B", "Class C", "Class D"],
      answer: 3,
    },
    {
      q: "What is the default subnet mask for Class B?",
      options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "No default mask"],
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
    <div
      style={{
        border: "1px solid #1f2740",
        borderRadius: 12,
        padding: 16,
        background: "#0f1422",
      }}
    >
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
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: correct ? "#00D4AA" : "#ff6b8a",
            fontWeight: 600,
          }}
        >
          {correct ? "✅ Correct!" : "❌ Not quite. The correct answer is highlighted above."}
        </div>
      )}
    </div>
  );
}
