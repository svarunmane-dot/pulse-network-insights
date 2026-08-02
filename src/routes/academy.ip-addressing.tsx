import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson3-hero.jpg";
import howItWorksImg from "@/assets/academy-lesson3-howitworks.jpg";

export const Route = createFileRoute("/academy/ip-addressing")({
  head: () =>
    toolHead({
      path: "/academy/ip-addressing",
      title: "Lesson 3: What is an IP Address? IPv4 Explained – Pulse",
      description:
        "Learn what an IP address is, how IPv4 works, the difference between public and private IPs, static vs dynamic addresses, and test your knowledge with a quick quiz.",
      name: "Lesson 3 – What is an IP Address? IPv4 Explained for Beginners",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is an IP address in simple terms?",
          a: "An IP address is a unique numerical label assigned to every device on a network. It works like a postal address, letting devices know where to send and receive data.",
        },
        {
          q: "What is the difference between a public and private IP address?",
          a: "A public IP address is assigned by your ISP and identifies your network on the Internet. A private IP address is used only inside your home or office and is not reachable directly from the Internet.",
        },
        {
          q: "What does an IPv4 address look like?",
          a: "An IPv4 address is four numbers between 0 and 255 separated by dots, for example 192.168.1.25.",
        },
      ],
    }),
  component: Lesson3,
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

function Lesson3() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 03 · BEGINNER · 10 MIN READ
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
        What is an IP Address? IPv4 Explained for Beginners
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Every device on a network needs a way to be identified. An IP address is
        that identifier — the postal address of the digital world.
      </p>

      <img
        src={heroImg}
        alt="Home network diagram showing devices connected through a router to the Internet"
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
        Every device connected to a network needs a way to be identified. Just as
        every house has a postal address, every device on a network has an IP
        (Internet Protocol) address.
      </P>
      <P>
        Without IP addresses, your computer would not know where to send or receive
        data. Whether you are browsing websites, streaming video, or sending emails,
        IP addresses are working behind the scenes.
      </P>

      <H2>What is an IP Address?</H2>
      <P>
        An IP address is a unique numerical identifier assigned to every device
        connected to a network. It allows devices to send data, receive data,
        identify each other, and communicate over a network.
      </P>
      <P>Think of it as the home address for your computer.</P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong> When your laptop
        requests a website, it sends data from your IP address to the server&apos;s IP
        address — just like sending a parcel from your address to someone else&apos;s.
      </P>

      <H2>What Does an IPv4 Address Look Like?</H2>
      <P>
        An IPv4 address consists of four numbers separated by dots. Each number
        ranges from 0 to 255.
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
          192.168.1.25
        </div>
        <div style={{ color: "#6b7794", fontSize: 13, marginTop: 6 }}>
          Example of a typical IPv4 address
        </div>
      </div>
      <P>Other valid examples include:</P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>10.0.0.15</li>
        <li>172.16.20.100</li>
        <li>8.8.8.8</li>
        <li>1.1.1.1</li>
      </ul>

      <H2>Public vs Private IP Address</H2>
      <P>There are two main types of IP addresses you will encounter.</P>
      <Table
        head={["Type", "Assigned by", "Used where", "Example" ]}
        rows={[
          ["Public IP", "Your ISP", "On the Internet", "81.156.25.101"],
          ["Private IP", "Your router", "Inside home / office", "192.168.1.25"],
        ]}
      />
      <P>
        <strong style={{ color: "#fff" }}>Public IP address:</strong> A public IP is
        assigned by your Internet Service Provider (ISP). It identifies your home or
        business on the Internet, and every website you visit sees it.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Private IP address:</strong> Private IP
        addresses are used inside homes and offices. They are not accessible
        directly from the Internet. Common private ranges are:
      </P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>192.168.x.x</li>
        <li>10.x.x.x</li>
        <li>172.16.x.x – 172.31.x.x</li>
      </ul>

      <H2>Real-Life Example: Your Home Network</H2>
      <P>
        Imagine your home network. Your router gives each connected device its own
        private IP, while your router uses one public IP to communicate with the
        Internet.
      </P>
      <Table
        head={["Device", "Private IP" ]}
        rows={[
          ["Laptop", "192.168.1.10"],
          ["Phone", "192.168.1.20"],
          ["Printer", "192.168.1.30"],
          ["Smart TV", "192.168.1.40"],
        ]}
      />
      <TryItCard
        to="/whose-ip"
        title="Discover your public IP address"
        body="Use the What's My IP tool to see the public IP your ISP has assigned to your connection."
      />

      <H2>How Does an IP Address Work?</H2>
      <P>Here is what happens when you open a website such as www.google.com:</P>
      <ol style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Your computer asks DNS for Google&apos;s IP address.</li>
        <li>DNS replies with an IP address.</li>
        <li>Your router sends the request.</li>
        <li>The request travels across the Internet.</li>
        <li>Google&apos;s server responds.</li>
        <li>The webpage loads.</li>
      </ol>
      <P>Every step is routed using IP addresses.</P>
      <img
        src={howItWorksImg}
        alt="Diagram showing a laptop requesting a website through DNS, router, and Internet to a server"
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
      <TryItCard
        to="/dns-lookup"
        title="Resolve a domain to its IP address"
        body="Use the DNS Lookup tool to see the IP addresses behind any domain name."
      />

      <H2>Static vs Dynamic IP Addresses</H2>
      <Table
        head={["Feature", "Static IP", "Dynamic IP" ]}
        rows={[
          ["Changes?", "Never changes", "Changes automatically"],
          ["Common uses", "Servers, CCTV, firewalls", "Home broadband"],
          ["Assigned by", "ISP or admin", "ISP via DHCP"],
        ]}
      />
      <P>
        A <strong style={{ color: "#fff" }}>static IP</strong> never changes. It is
        commonly used for servers, CCTV systems, business Internet, and firewalls.
      </P>
      <P>
        A <strong style={{ color: "#fff" }}>dynamic IP</strong> changes automatically.
        Most home broadband connections use dynamic IP addresses — your ISP assigns
        one whenever your router connects.
      </P>

      <H2>IPv4 Address Structure</H2>
      <P>
        An IPv4 address contains 32 bits. It is divided into a network portion and a
        host portion. You will learn exactly how this works in the subnetting lesson.
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
        <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16 }}>
          192.168.1.10
        </div>
        <div style={{ color: "#6b7794", fontSize: 13, marginTop: 8 }}>
          Network portion + Host portion
        </div>
      </div>

      <H2>Why Are IP Addresses Important?</H2>
      <P>Without IP addresses, modern networking would not work:</P>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>Websites would not load.</li>
        <li>Emails could not be delivered.</li>
        <li>Online games would not work.</li>
        <li>Video calls would fail.</li>
        <li>Cloud applications could not communicate.</li>
      </ul>
      <P>Every device on every network relies on IP addressing.</P>

      <H2>Common Examples</H2>
      <Table
        head={["Device / Service", "Example IP" ]}
        rows={[
          ["Home Router", "192.168.1.1"],
          ["Laptop", "192.168.1.15"],
          ["Office PC", "10.0.5.25"],
          ["Google DNS", "8.8.8.8"],
          ["Cloudflare DNS", "1.1.1.1"],
        ]}
      />

      <H2>Common Mistakes</H2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <strong style={{ color: "#fff" }}>Thinking an IP identifies a person.</strong>{" "}
          It identifies a device or network connection, not an individual.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Believing every IP is public.</strong>{" "}
          Most devices in homes and businesses use private IP addresses.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>Assuming IPs never change.</strong>{" "}
          Many home Internet connections use dynamic IP addresses, which can change
          periodically.
        </li>
      </ul>

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
          { to: "/whose-ip", label: "🌍 What's My IP" },
          { to: "/subnet-calculator", label: "🧮 Subnet Calculator" },
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
          <Link to="/academy/ipv4-address-classes" style={{ color: "#00D4AA", textDecoration: "none" }}>
            Lesson 4: IPv4 Classes (A, B, C, D & E) Explained →
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
      q: "What does IP stand for?",
      options: ["Internet Provider", "Internet Protocol", "Internal Program", "Information Process"],
      answer: 1,
    },
    {
      q: "Which of these is a private IP address?",
      options: ["8.8.8.8", "192.168.1.25", "104.18.12.5", "151.101.1.69"],
      answer: 1,
    },
    {
      q: "Who usually assigns your public IP address?",
      options: ["Google", "Your Internet Service Provider (ISP)", "Microsoft", "Your laptop"],
      answer: 1,
    },
    {
      q: "How many numbers are in an IPv4 address?",
      options: ["2", "4", "6", "8"],
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
