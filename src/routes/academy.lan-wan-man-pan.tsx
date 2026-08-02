import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import networkTypesImg from "@/assets/academy-lesson2-network-types.jpg";
import realWorldImg from "@/assets/academy-lesson2-realworld.jpg";

export const Route = createFileRoute("/academy/lan-wan-man-pan")({
  head: () =>
    toolHead({
      path: "/academy/lan-wan-man-pan",
      title: "Lesson 2: LAN vs WAN vs MAN vs PAN Explained – Pulse Speed Academy",
      description:
        "Learn the differences between PAN, LAN, MAN and WAN network types with real-world examples, comparison tables and a quick quiz — plus hands-on practice tools.",
      name: "Lesson 2 – LAN vs WAN vs MAN vs PAN Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is the difference between LAN and WAN?",
          a: "A LAN connects devices in a limited area such as a home or office. A WAN connects networks across cities, countries or the world — the Internet is the largest WAN.",
        },
        {
          q: "What is a PAN and where is it used?",
          a: "A Personal Area Network covers a very short range, usually around one person. Common examples are Bluetooth headphones, smartwatches and wireless keyboards.",
        },
        {
          q: "Is a city-wide university network a MAN or WAN?",
          a: "It is a MAN (Metropolitan Area Network). A MAN connects multiple LANs across a city or large campus, larger than a LAN but smaller than a WAN.",
        },
      ],
    }),
  component: Lesson2,
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

function Lesson2() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 02 · BEGINNER · 10 MIN READ
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
        LAN vs WAN vs MAN vs PAN Explained
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Networks are classified by the area they cover. The four main types are
        PAN, LAN, MAN and WAN — and you probably use all four every day.
      </p>

      <img
        src={networkTypesImg}
        alt="Diagram showing PAN, LAN, MAN and WAN network coverage areas"
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

      <H2>Quick Comparison</H2>
      <Table
        head={["Network Type", "Full Name", "Coverage Area", "Typical Example"]}
        rows={[
          ["PAN", "Personal Area Network", "1–10 metres", "Bluetooth headphones"],
          ["LAN", "Local Area Network", "Home, office, school", "Home Wi-Fi"],
          ["MAN", "Metropolitan Area Network", "City or large campus", "University network"],
          ["WAN", "Wide Area Network", "Country or worldwide", "The Internet"],
        ]}
      />

      <H2>1. PAN (Personal Area Network)</H2>
      <P>
        A Personal Area Network connects devices used by one person over a short
        distance.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Common examples:</strong>
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Smartphone connected to Bluetooth earbuds</li>
        <li>Smartwatch connected to your phone</li>
        <li>Wireless keyboard and mouse</li>
        <li>Fitness tracker</li>
      </ul>
      <P>
        <strong style={{ color: "#fff" }}>Coverage:</strong> Around 1 to 10 metres
      </P>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          margin: "14px 0",
        }}
      >
        <div
          style={{
            border: "1px solid #143a2f",
            background: "rgba(0,212,170,0.08)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: "#00D4AA", fontWeight: 700, marginBottom: 6 }}>Advantages</div>
          <ul style={{ color: "#c8d0e0", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Easy to set up</li>
            <li>Low power consumption</li>
            <li>No cables required</li>
            <li>Ideal for personal devices</li>
          </ul>
        </div>
        <div
          style={{
            border: "1px solid #3a1f2a",
            background: "rgba(233,69,96,0.06)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: "#ff6b8a", fontWeight: 700, marginBottom: 6 }}>Limitations</div>
          <ul style={{ color: "#c8d0e0", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Short range</li>
            <li>Limited number of devices</li>
            <li>Lower speeds than Ethernet</li>
          </ul>
        </div>
      </div>

      <H2>2. LAN (Local Area Network)</H2>
      <P>
        A Local Area Network connects devices within a limited area such as a home,
        office, school or small business.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong> Your home Wi-Fi network
        includes your laptop, smart TV, mobile phone, printer and gaming console —
        all communicating over the same local network.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Typical devices:</strong>
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Switches</li>
        <li>Routers</li>
        <li>Wireless Access Points</li>
        <li>PCs, servers and printers</li>
      </ul>
      <P>
        <strong style={{ color: "#fff" }}>Coverage:</strong> One building or campus
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Advantages:</strong> High speed, low
        latency, easy file sharing and a shared Internet connection.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Real-life example:</strong> An office
        with 100 employees connected to the same network.
      </P>

      <TryItCard
        to="/"
        title="Test your LAN and Internet speed"
        body="Run the Pulse Speed Internet Speed Test to see how fast your local and Internet connections are."
      />

      <H2>3. MAN (Metropolitan Area Network)</H2>
      <P>
        A Metropolitan Area Network connects multiple LANs across a city or large
        metropolitan area.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Examples:</strong>
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>A university with several campuses connected through a MAN</li>
        <li>A local council connecting offices around the city</li>
        <li>City-wide fibre networks</li>
      </ul>
      <P>
        <strong style={{ color: "#fff" }}>Coverage:</strong> Up to 50 km or more
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Advantages:</strong> Connects multiple
        sites, uses high-speed fibre links and enables centralised management.
      </P>

      <H2>4. WAN (Wide Area Network)</H2>
      <P>
        A Wide Area Network connects networks across countries or even the entire
        world. The Internet is the largest WAN ever built.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Examples:</strong>
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>A company connecting offices in London, New York and Singapore</li>
        <li>Banks connecting branches nationwide</li>
        <li>Cloud services like Microsoft Azure and AWS</li>
      </ul>
      <P>
        <strong style={{ color: "#fff" }}>Technologies used:</strong>
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Fibre</li>
        <li>MPLS</li>
        <li>SD-WAN</li>
        <li>VPN</li>
        <li>Satellite</li>
        <li>4G / 5G</li>
      </ul>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          margin: "14px 0",
        }}
      >
        <div
          style={{
            border: "1px solid #143a2f",
            background: "rgba(0,212,170,0.08)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: "#00D4AA", fontWeight: 700, marginBottom: 6 }}>Advantages</div>
          <ul style={{ color: "#c8d0e0", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Connects global offices</li>
            <li>Supports remote workers</li>
            <li>Enables cloud connectivity</li>
          </ul>
        </div>
        <div
          style={{
            border: "1px solid #3a1f2a",
            background: "rgba(233,69,96,0.06)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: "#ff6b8a", fontWeight: 700, marginBottom: 6 }}>Challenges</div>
          <ul style={{ color: "#c8d0e0", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Higher cost</li>
            <li>Greater latency</li>
            <li>More complex to manage</li>
          </ul>
        </div>
      </div>

      <TryItCard
        to="/ping-ip"
        title="Measure latency across a WAN"
        body="Use the Ping tool to see how long packets take to reach remote servers over the Internet."
      />

      <H2>Real-World Scenario</H2>
      <img
        src={realWorldImg}
        alt="Real-world network scenario showing PAN, LAN, MAN and WAN connections"
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
      <P>
        Imagine a company called <strong style={{ color: "#fff" }}>TechSolutions Ltd</strong>.
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <strong style={{ color: "#fff" }}>Employee's desk:</strong> Your laptop
          connects to Wi-Fi — <strong style={{ color: "#00D4AA" }}>LAN</strong>.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Office building:</strong> All
          employees, printers and servers are connected together — still a{" "}
          <strong style={{ color: "#00D4AA" }}>LAN</strong>.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Head office and branches:</strong> The
          London office communicates with Manchester and Glasgow — a{" "}
          <strong style={{ color: "#9B8FE8" }}>WAN</strong>.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Bluetooth devices:</strong> You connect
          your wireless headset to your laptop — a{" "}
          <strong style={{ color: "#00D4AA" }}>PAN</strong>.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>University network:</strong> Several
          campuses are connected across one city — a{" "}
          <strong style={{ color: "#9B8FE8" }}>MAN</strong>.
        </li>
      </ul>

      <H2>Comparison Table</H2>
      <Table
        head={["Feature", "PAN", "LAN", "MAN", "WAN"]}
        rows={[
          ["Coverage", "1–10 m", "Building", "City", "Worldwide"],
          ["Speed", "Medium", "Very High", "High", "Varies"],
          ["Cost", "Low", "Low", "Medium", "High"],
          ["Typical Users", "Individuals", "Homes & Businesses", "Universities", "Enterprises & ISPs"],
          ["Example", "Bluetooth", "Home Wi-Fi", "City Fibre Network", "Internet"],
        ]}
      />

      <H2>Which Network Do You Use Every Day?</H2>
      <P>You probably use all four:</P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Bluetooth headphones → PAN</li>
        <li>Home Wi-Fi → LAN</li>
        <li>University or city fibre network → MAN</li>
        <li>Internet → WAN</li>
      </ul>
      <P>
        Without realising it, you switch between these networks throughout the day.
      </P>

      <TryItCard
        to="/whose-ip"
        title="Find the public IP your ISP gives you"
        body="Use the Whose IP tool to see the IP address your WAN connection uses on the Internet."
      />

      <H2>Quick Quiz</H2>
      <Quiz />

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
          { to: "/", label: "⚡ Speed Test" },
          { to: "/ping-ip", label: "📶 Ping IP" },
          { to: "/dns-lookup", label: "📡 DNS Lookup" },
          { to: "/whose-ip", label: "🌍 What's My IP" },
          { to: "/subnet-calculator", label: "🧮 Subnet Calculator" },
          { to: "/app-monitoring", label: "📊 App Monitoring" },
        ].map((t) => (
          <Link
            key={t.to}
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
          <Link to="/academy/what-is-a-computer-network" style={{ color: "#00D4AA", textDecoration: "none" }}>
            ← Lesson 1: What is a Computer Network?
          </Link>
        </li>
        <li>
          <Link to="/academy/ip-addressing" style={{ color: "#00D4AA", textDecoration: "none" }}>
            Lesson 3: What is an IP Address? →
          </Link>
        </li>
        <li>Lesson 4: IPv4 vs IPv6</li>
        <li>Lesson 5: Understanding the OSI Model</li>
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
      q: "Which network connects your Bluetooth headphones?",
      options: ["LAN", "PAN", "WAN", "MAN"],
      answer: 1,
    },
    {
      q: "Which network usually connects devices in a home?",
      options: ["LAN", "PAN", "MAN", "WAN"],
      answer: 0,
    },
    {
      q: "Which is the world's largest WAN?",
      options: ["A university network", "The Internet", "A home Wi-Fi", "Bluetooth"],
      answer: 1,
    },
    {
      q: "A network connecting several campuses across one city is best described as a:",
      options: ["PAN", "LAN", "MAN", "WAN"],
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
