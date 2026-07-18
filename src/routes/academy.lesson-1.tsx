import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson1-hero.jpg";
import networksImg from "@/assets/academy-lesson1-networks.jpg";
import flowImg from "@/assets/academy-lesson1-flow.jpg";

export const Route = createFileRoute("/academy/lesson-1")({
  head: () =>
    toolHead({
      path: "/academy/lesson-1",
      title: "Lesson 1: What is a Computer Network? – Pulse Speed Academy",
      description:
        "Learn what a computer network is, its components (switch, router, firewall, AP), types (PAN, LAN, MAN, WAN) and how data travels — with hands-on practice.",
      name: "Lesson 1 – What is a Computer Network?",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is a computer network?",
          a: "A computer network is a group of devices connected together — over Ethernet, Wi-Fi, fibre or the Internet — so they can communicate and share information.",
        },
        {
          q: "What is the difference between a switch and a router?",
          a: "A switch connects devices within the same local network. A router connects different networks together, such as your home network to the Internet.",
        },
        {
          q: "What are PAN, LAN, MAN and WAN?",
          a: "PAN covers one person (e.g. Bluetooth). LAN covers a home or office. MAN covers a city. WAN covers a country or the world — the Internet is a WAN.",
        },
      ],
    }),
  component: Lesson1,
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

function Lesson1() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 01 · BEGINNER · 8 MIN READ
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
        What is a Computer Network?
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        A computer network is a group of devices connected together so they can
        communicate and share information.
      </p>

      <img
        src={heroImg}
        alt="Devices connected in a computer network — laptops, printer, camera, router"
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

      <P>These devices can include:</P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>💻 Computers</li>
        <li>📱 Smartphones</li>
        <li>🖨 Printers</li>
        <li>🖥 Servers</li>
        <li>📷 IP Cameras</li>
        <li>🌐 Routers</li>
        <li>🔀 Switches</li>
      </ul>
      <P>
        Networks can use Ethernet cables, Wi-Fi, fibre optics, or the Internet to
        connect devices.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong> When you send a WhatsApp
        message or browse a website, your device is using a computer network.
      </P>

      <H2>Why Do We Need Networks?</H2>
      <P>Imagine an office with 100 computers.</P>
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
            border: "1px solid #3a1f2a",
            background: "rgba(233,69,96,0.06)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: "#ff6b8a", fontWeight: 700, marginBottom: 6 }}>
            Without a network
          </div>
          <ul style={{ color: "#c8d0e0", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Everyone works independently</li>
            <li>Files can't be shared easily</li>
            <li>Every PC needs its own printer</li>
            <li>Internet access is hard to manage</li>
          </ul>
        </div>
        <div
          style={{
            border: "1px solid #143a2f",
            background: "rgba(0,212,170,0.08)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ color: "#00D4AA", fontWeight: 700, marginBottom: 6 }}>
            With a network
          </div>
          <ul style={{ color: "#c8d0e0", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Shared Internet connection</li>
            <li>Shared printers</li>
            <li>Files stored centrally</li>
            <li>Fast communication and central IT management</li>
          </ul>
        </div>
      </div>

      <H2>Main Components of a Network</H2>
      <P>
        <strong style={{ color: "#fff" }}>💻 End Devices</strong> — Laptops, desktops,
        phones, servers and printers that users interact with.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>🔀 Switch</strong> — Connects devices within
        the same local network. Think of it as the traffic controller inside an
        office.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>🌐 Router</strong> — Connects different
        networks together. Your home router connects your home network to your
        Internet Service Provider (ISP).
      </P>
      <pre
        style={{
          background: "#0a0e1a",
          border: "1px solid #1f2740",
          padding: 14,
          borderRadius: 10,
          color: "#c8d0e0",
          fontSize: 13,
          lineHeight: 1.6,
          overflowX: "auto",
        }}
      >{`Laptop
   │
Switch
   │
Router
   │
Internet`}</pre>
      <P>
        <strong style={{ color: "#fff" }}>📶 Wireless Access Point</strong> — Lets
        devices connect over Wi-Fi instead of Ethernet.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>🔒 Firewall</strong> — Protects your network
        by allowing legitimate traffic and blocking unauthorized access.
      </P>

      <TryItCard
        to="/ap-planning"
        title="Plan wireless access points on a floor plan"
        body="Upload a floor plan and see optimal AP placement with our AP Planning tool."
      />

      <H2>Types of Networks</H2>
      <img
        src={networksImg}
        alt="PAN, LAN, MAN, WAN — the four main types of networks"
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
      <Table
        head={["Type", "Covers", "Example"]}
        rows={[
          ["PAN", "One person", "Bluetooth headphones"],
          ["LAN", "Home or office", "Home Wi-Fi"],
          ["MAN", "City", "University campus"],
          ["WAN", "Country or world", "The Internet"],
        ]}
      />

      <H2>How Data Travels Across a Network</H2>
      <img
        src={flowImg}
        alt="Data traveling from a laptop through a router to a cloud server"
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
      <P>Imagine you open www.google.com. Here's what happens:</P>
      <ol style={{ color: "#c8d0e0", lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Your laptop sends a request</li>
        <li>Your router forwards the request</li>
        <li>Your ISP receives it</li>
        <li>DNS finds Google's IP address</li>
        <li>The request travels across multiple networks</li>
        <li>Google's servers respond</li>
        <li>The webpage loads</li>
      </ol>
      <P>This process usually happens in less than a second.</P>

      <TryItCard
        to="/dnslookup"
        title="See DNS in action"
        body="Look up any domain and reveal the IP address behind it using our DNS Lookup tool."
      />

      <H2>Real-Life Example</H2>
      <P>
        In an office, when you print a document, join a Teams meeting, access a
        shared folder or browse the Internet — you're using the company network. A
        typical office network includes Internet, firewall, router, switches,
        wireless access points, servers and employee devices, all working together
        to provide secure and reliable connectivity.
      </P>

      <H2>Benefits of Networking</H2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Share files easily</li>
        <li>Share Internet access</li>
        <li>Use shared printers</li>
        <li>Access cloud applications</li>
        <li>Improve collaboration and remote work</li>
        <li>Centralize data storage</li>
        <li>Enhance security</li>
      </ul>

      <H2>Common Networking Terms</H2>
      <Table
        head={["Term", "Meaning"]}
        rows={[
          ["IP Address", "Identifies a device on a network"],
          ["MAC Address", "Unique hardware address of a device"],
          ["Router", "Connects different networks"],
          ["Switch", "Connects devices within the same network"],
          ["DNS", "Converts website names into IP addresses"],
          ["DHCP", "Automatically assigns IP addresses"],
          ["Firewall", "Protects the network from unwanted traffic"],
        ]}
      />

      <TryItCard
        to="/whoisip"
        title="Find your public IP"
        body="Use the Whose IP tool to see the public IP your network shows to the internet."
      />

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Try It Yourself</H2>
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
          { to: "/whoisip", label: "🌍 What's My IP" },
          { to: "/dnslookup", label: "📡 DNS Lookup" },
          { to: "/pingip", label: "📶 Ping IP" },
          { to: "/subnet", label: "🧮 Subnet Calculator" },
          { to: "/", label: "⚡ Speed Test" },
          { to: "/ap-planning", label: "📐 AP Planning" },
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
          <Link to="/academy/lesson-2" style={{ color: "#00D4AA", textDecoration: "none" }}>
            Lesson 2: LAN vs WAN vs MAN vs PAN Explained →
          </Link>
        </li>
        <li>Lesson 3: What is an IP Address?</li>
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
      q: "What does a router do?",
      options: [
        "Stores files",
        "Connects different networks",
        "Prints documents",
        "Increases Wi-Fi speed",
      ],
      answer: 1,
    },
    {
      q: "Which device connects computers inside an office?",
      options: ["Switch", "Router", "Firewall", "Modem"],
      answer: 0,
    },
    {
      q: "Which network type is your home Wi-Fi?",
      options: ["WAN", "MAN", "LAN", "PAN"],
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
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div
      style={{
        border: "1px solid #1f2740",
        borderRadius: 12,
        padding: 14,
        background: "#0f1422",
      }}
    >
      <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>
        {index}. {q}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {options.map((o, i) => {
          const isPicked = picked === i;
          const isCorrect = i === answer;
          const show = picked !== null;
          const bg = show
            ? isCorrect
              ? "rgba(0,212,170,0.15)"
              : isPicked
                ? "rgba(233,69,96,0.15)"
                : "#0a0e1a"
            : "#0a0e1a";
          const border = show
            ? isCorrect
              ? "#00D4AA"
              : isPicked
                ? "#ff6b8a"
                : "#1f2740"
            : "#1f2740";
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(i)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: bg,
                color: "#c8d0e0",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {String.fromCharCode(65 + i)}) {o}{" "}
              {show && isCorrect ? " ✅" : show && isPicked ? " ❌" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}