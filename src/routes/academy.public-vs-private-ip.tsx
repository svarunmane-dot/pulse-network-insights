import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson5-hero.jpg";

export const Route = createFileRoute("/academy/public-vs-private-ip")({
  head: () =>
    toolHead({
      path: "/academy/public-vs-private-ip",
      title: "Lesson 5: Public vs Private IP Addresses | Pulse Speed Academy",
      description:
        "Learn the difference between public and private IP addresses, the reserved private ranges, and how NAT lets many devices share one Internet connection. Includes a quick quiz and interactive 'Public or Private?' game.",
      name: "Lesson 5 – Public vs Private IP Addresses",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What is a public IP address?",
          a: "A public IP address is assigned by your ISP and is visible on the Internet. It identifies your home or business network to the rest of the world.",
        },
        {
          q: "What are the private IPv4 ranges?",
          a: "10.0.0.0–10.255.255.255, 172.16.0.0–172.31.255.255, and 192.168.0.0–192.168.255.255 are reserved for private networks and are not routable on the public Internet.",
        },
        {
          q: "Can two networks use the same private IP?",
          a: "Yes. Millions of homes use 192.168.1.x because private addresses are only valid inside each local network. NAT translates them to a shared public IP when reaching the Internet.",
        },
      ],
    }),
  component: Lesson5,
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
                <td key={j} style={{ padding: "10px 12px", color: "#c8d0e0", borderTop: i === 0 ? "none" : "1px solid #1f2740" }}>
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

function Lesson5() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 05 · BEGINNER · 8–10 MIN READ
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
        Public vs Private IP Addresses – What's the Difference?
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Your device has a private IP on your local Wi-Fi, but the Internet sees a
        different public IP. Learn what each one means and how they work together.
      </p>

      <img
        src={heroImg}
        alt="Home network diagram showing a public IP on the router and private IPs on connected devices"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>
        When you connect your laptop or smartphone to Wi-Fi, it receives an IP address.
        But your home network also has another IP address that the rest of the Internet
        sees. That's because there are two types of IP addresses:{" "}
        <strong style={{ color: "#fff" }}>Public</strong> and{" "}
        <strong style={{ color: "#fff" }}>Private</strong>.
      </P>

      <H2>What is a Public IP Address?</H2>
      <P>
        A public IP address is visible on the Internet. It is assigned by your Internet
        Service Provider (ISP) and allows your home or business to communicate with
        websites and online services. Think of it as the main address of your house.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong>{" "}
        <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>81.145.220.45</code>
      </P>
      <P>When you visit Google or YouTube, the site sees your public IP address.</P>

      <H2>What is a Private IP Address?</H2>
      <P>
        A private IP address is used inside a local network such as your home or office.
        Private IP addresses are not accessible directly from the Internet. Think of them
        as room numbers inside a building — the building itself has one public address.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Example:</strong>{" "}
        <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>192.168.1.25</code>
      </P>
      <P>Your laptop, printer, phone, and smart TV all have different private IPs.</P>

      <H2>Public vs Private IP Address</H2>
      <Table
        head={["Feature", "Public IP", "Private IP"]}
        rows={[
          ["Visible on the Internet", "✅ Yes", "❌ No"],
          ["Assigned by", "ISP", "Router (DHCP)"],
          ["Can be reused by others", "❌ No", "✅ Yes"],
          ["Used for", "Internet communication", "Local network communication"],
          ["Example", "81.145.220.45", "192.168.1.25"],
        ]}
      />

      <H2>Private IP Address Ranges</H2>
      <P>Only these three IPv4 ranges are reserved for private networks:</P>
      <Table
        head={["Range", "Class"]}
        rows={[
          ["10.0.0.0 – 10.255.255.255", "A"],
          ["172.16.0.0 – 172.31.255.255", "B"],
          ["192.168.0.0 – 192.168.255.255", "C"],
        ]}
      />
      <P>If you see an address outside these ranges, it is likely a public IP address.</P>

      <H2>Real-Life Example</H2>
      <P>Imagine your home network:</P>
      <Table
        head={["Device", "Private IP"]}
        rows={[
          ["Laptop", "192.168.1.10"],
          ["Phone", "192.168.1.11"],
          ["Smart TV", "192.168.1.12"],
          ["Printer", "192.168.1.13"],
        ]}
      />
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
      >{`Public IP
81.145.220.45
        │
     Router
        │
────────────────────────
192.168.1.10  Laptop
192.168.1.11  Phone
192.168.1.12  TV
192.168.1.13  Printer`}</pre>
      <P>Every device shares the same public IP when accessing the Internet.</P>

      <H2>Why Don't We Give Every Device a Public IP?</H2>
      <P>
        There are billions of devices connected to the Internet. IPv4 has a limited
        number of addresses, so private IPs allow thousands of devices to share one
        public IP using <strong style={{ color: "#fff" }}>Network Address Translation
        (NAT)</strong>. We'll cover NAT in a later lesson.
      </P>

      <H2>How to Find Your IP Addresses</H2>
      <P>
        <strong style={{ color: "#fff" }}>Public IP:</strong> use the What's My IP tool
        on Pulse Speed.
      </P>
      <TryItCard
        to="/whose-ip"
        title="Find your public IP now"
        body="See the exact public IP the Internet uses to reach your network, plus location and ISP details."
      />
      <P>
        <strong style={{ color: "#fff" }}>Private IP (Windows):</strong> open Command
        Prompt and run <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>ipconfig</code>.
        Look for <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>IPv4 Address</code>.
      </P>
      <P>
        <strong style={{ color: "#fff" }}>Private IP (macOS/Linux):</strong> open Terminal
        and run <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>ifconfig</code>{" "}
        or <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>ip addr</code>.
      </P>

      <H2>Common Misconceptions</H2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <strong style={{ color: "#fff" }}>"My laptop has a public IP."</strong> Usually
          not — laptops on home Wi-Fi have a private IP; the router holds the public one.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>"Public IPs never change."</strong> Many
          residential ISPs use dynamic public IPs. Businesses often pay for a static one.
        </li>
        <li>
          <strong style={{ color: "#fff" }}>"Two people can't have the same private IP."</strong>{" "}
          They can — millions of homes use 192.168.1.x. Private addresses are only valid inside each local network.
        </li>
      </ul>

      <H2>Public or Private? – Interactive Game</H2>
      <PublicPrivateGame />

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>A public IP identifies your network on the Internet.</li>
        <li>A private IP identifies devices within your local network.</li>
        <li>Your router typically has one public IP and manages multiple private IPs.</li>
        <li>Private IP addresses can be reused across millions of networks.</li>
        <li>NAT lets many private devices share a single public IP address.</li>
      </ul>

      <H2>Did You Know?</H2>
      <P>
        Every time you connect to your home Wi-Fi, your router assigns a private IP to
        your device using a service called DHCP. When you browse the web, the router
        translates that private IP into its public IP using NAT, allowing multiple
        devices to share a single Internet connection.
      </P>

      <H2>Practice What You've Learned</H2>
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
          { to: "/ping-ip", label: "📡 Ping Tool" },
          { to: "/whose-ip", label: "🔍 WHOIS Lookup" },
          { to: "/subnet-calculator", label: "🧮 Subnet Calculator" },
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
      <ul style={{ color: "#c8d0e0", lineHeight: 1.9, paddingLeft: 20 }}>
        <li>
          <Link to="/academy/ipv4-address-classes" style={{ color: "#00D4AA", textDecoration: "none" }}>
            ← Lesson 4: IPv4 Classes (A, B, C, D & E) Explained
          </Link>
        </li>
        <li>Lesson 6: What is Subnetting? A Beginner's Guide to Dividing Networks</li>
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

/* ============ Public or Private Game ============ */

type GameIP = { ip: string; isPrivate: boolean; why: string };

const IP_POOL: GameIP[] = [
  { ip: "192.168.10.15", isPrivate: true, why: "Inside 192.168.0.0/16 — reserved for private networks (Class C)." },
  { ip: "8.8.8.8", isPrivate: false, why: "Google Public DNS — routable on the public Internet." },
  { ip: "10.25.4.100", isPrivate: true, why: "Inside 10.0.0.0/8 — reserved for private networks (Class A)." },
  { ip: "172.20.5.10", isPrivate: true, why: "Inside 172.16.0.0 – 172.31.255.255 — private range (Class B)." },
  { ip: "151.101.65.69", isPrivate: false, why: "Public IP owned by Fastly CDN — routable on the Internet." },
  { ip: "172.32.0.1", isPrivate: false, why: "172.32.x.x is OUTSIDE the private range (only 172.16–172.31 is private)." },
  { ip: "192.169.1.1", isPrivate: false, why: "Not 192.168.x.x — 192.169.x.x is a public range." },
  { ip: "104.26.10.5", isPrivate: false, why: "Public IP in Cloudflare's range." },
  { ip: "10.0.0.1", isPrivate: true, why: "Common home-router private IP inside 10.0.0.0/8." },
  { ip: "192.168.1.1", isPrivate: true, why: "Default gateway of most home routers — private (Class C)." },
  { ip: "1.1.1.1", isPrivate: false, why: "Cloudflare Public DNS — routable on the Internet." },
  { ip: "172.16.100.20", isPrivate: true, why: "Inside 172.16.0.0/12 — private (Class B)." },
];

function randomIP(exclude?: string): GameIP {
  let pick = IP_POOL[Math.floor(Math.random() * IP_POOL.length)];
  if (exclude) {
    let tries = 0;
    while (pick.ip === exclude && tries < 5) {
      pick = IP_POOL[Math.floor(Math.random() * IP_POOL.length)];
      tries++;
    }
  }
  return pick;
}

function PublicPrivateGame() {
  const [current, setCurrent] = useState<GameIP>(() => randomIP());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<null | { correct: boolean; chose: "public" | "private" }>(null);
  const totalRounds = 10;
  const done = round > totalRounds;

  const answer = (chose: "public" | "private") => {
    if (answered || done) return;
    const correct = (chose === "private") === current.isPrivate;
    if (correct) setScore((s) => s + 1);
    setAnswered({ correct, chose });
  };

  const next = () => {
    if (round >= totalRounds) {
      setRound(round + 1);
      setAnswered(null);
      return;
    }
    setRound((r) => r + 1);
    setAnswered(null);
    setCurrent(randomIP(current.ip));
  };

  const reset = () => {
    setRound(1);
    setScore(0);
    setAnswered(null);
    setCurrent(randomIP());
  };

  const scoreColor = useMemo(() => {
    const pct = (score / totalRounds) * 100;
    if (pct >= 80) return "#00D4AA";
    if (pct >= 50) return "#9B8FE8";
    return "#ff6b8a";
  }, [score]);

  if (done) {
    return (
      <div
        style={{
          border: "1px solid #1f2740",
          borderRadius: 14,
          padding: 22,
          background: "#0f1422",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
          GAME COMPLETE
        </div>
        <div style={{ color: scoreColor, fontSize: 40, fontWeight: 800, marginTop: 6 }}>
          {score} / {totalRounds}
        </div>
        <div style={{ color: "#c8d0e0", fontSize: 14, marginTop: 6 }}>
          {score === totalRounds
            ? "Perfect score! You've mastered public vs private IPs."
            : score >= 8
            ? "Great job — you clearly know your ranges."
            : score >= 5
            ? "Not bad — review the private ranges and try again."
            : "Keep practising — remember the three private ranges: 10.x, 172.16–31.x, 192.168.x."}
        </div>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Play again
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 14, padding: 20, background: "#0f1422" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
          ROUND {round} / {totalRounds}
        </div>
        <div style={{ color: "#c8d0e0", fontSize: 13 }}>
          Score: <strong style={{ color: "#fff" }}>{score}</strong>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          padding: "24px 12px",
          borderRadius: 12,
          border: "1px solid #1f2740",
          background: "#0b0f1a",
          marginBottom: 14,
        }}
      >
        <div style={{ color: "#6b7794", fontSize: 12, marginBottom: 6 }}>Is this IP…</div>
        <div style={{ color: "#fff", fontSize: 32, fontWeight: 800, fontFamily: "monospace", letterSpacing: 0.5 }}>
          {current.ip}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          onClick={() => answer("public")}
          disabled={!!answered}
          style={{
            padding: "14px",
            borderRadius: 10,
            border: "1px solid #1f2740",
            background:
              answered?.chose === "public"
                ? answered.correct
                  ? "rgba(0,212,170,0.15)"
                  : "rgba(255,107,138,0.12)"
                : "#0b0f1a",
            color: "#fff",
            fontWeight: 700,
            cursor: answered ? "default" : "pointer",
          }}
        >
          🌍 Public
        </button>
        <button
          onClick={() => answer("private")}
          disabled={!!answered}
          style={{
            padding: "14px",
            borderRadius: 10,
            border: "1px solid #1f2740",
            background:
              answered?.chose === "private"
                ? answered.correct
                  ? "rgba(0,212,170,0.15)"
                  : "rgba(255,107,138,0.12)"
                : "#0b0f1a",
            color: "#fff",
            fontWeight: 700,
            cursor: answered ? "default" : "pointer",
          }}
        >
          🏠 Private
        </button>
      </div>
      {answered && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              color: answered.correct ? "#00D4AA" : "#ff6b8a",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {answered.correct ? "✅ Correct!" : `❌ Not quite — it's ${current.isPrivate ? "Private" : "Public"}.`}
          </div>
          <div style={{ color: "#c8d0e0", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
            {current.why}
          </div>
          <button
            onClick={next}
            style={{
              marginTop: 12,
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
              color: "#04150f",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {round >= totalRounds ? "See results" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ============ Quiz ============ */

function Quiz() {
  const questions = [
    {
      q: "Which IP address is visible on the Internet?",
      options: ["Private IP", "Public IP"],
      answer: 1,
    },
    {
      q: "Which device usually assigns private IP addresses in a home network?",
      options: ["ISP", "Router (DHCP)", "Google", "Microsoft"],
      answer: 1,
    },
    {
      q: "Which of these is a private IP?",
      options: ["8.8.8.8", "104.26.10.5", "192.168.1.50", "151.101.1.69"],
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