import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson12-hero.jpg";

export const Route = createFileRoute("/academy/what-is-dns")({
  head: () =>
    toolHead({
      path: "/academy/what-is-dns",
      title: "Lesson 12: DNS Explained – How the Internet Finds Websites | Pulse Speed Academy",
      description:
        "Learn what DNS is, how domain names are translated into IP addresses, how a DNS lookup works step by step, and which public DNS servers you can use.",
      name: "Lesson 12 – DNS Explained",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What does DNS stand for?",
          a: "DNS stands for Domain Name System. It translates human-friendly website names such as google.com into IP addresses that computers use to communicate.",
        },
        {
          q: "What are the best public DNS servers?",
          a: "Popular public DNS servers include Google Public DNS (8.8.8.8 and 8.8.4.4), Cloudflare DNS (1.1.1.1 and 1.0.0.1) and Quad9 (9.9.9.9 and 149.112.112.112).",
        },
        {
          q: "Does a faster DNS server make my Internet faster?",
          a: "A faster DNS server can shorten the time it takes to look up a website's IP address, but it does not increase your connection speed or download bandwidth.",
        },
      ],
    }),
  component: Lesson12,
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

function Flow({ steps }: { steps: string[] }) {
  return (
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
      {steps.map((s, i) => (
        <div key={s}>
          <div style={{ color: i === steps.length - 1 ? "#00D4AA" : "#c8d0e0" }}>{s}</div>
          {i < steps.length - 1 && <div style={{ color: "#6b7794" }}>│<br />▼</div>}
        </div>
      ))}
    </div>
  );
}

function Lesson12() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 12 · BEGINNER · ⏱️ 12 MIN READ
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
        DNS Explained – How the Internet Finds Websites
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        DNS is the phone book of the Internet. Learn how domain names become IP addresses, and what happens
        behind the scenes every time you open a website.
      </p>

      <img
        src={heroImg}
        alt="DNS diagram showing a browser requesting a domain name and a DNS server returning an IP address"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>Have you ever wondered what happens when you type <Code>www.google.com</Code> into your browser?</P>
      <P>Your computer doesn't actually understand website names. It only communicates using IP addresses, such as <Code>142.250.190.78</Code>.</P>
      <P>So how does your computer know which IP address belongs to Google? The answer is <strong style={{ color: "#fff" }}>DNS</strong>.</P>
      <P>DNS is one of the most important services on the Internet. Without it, you would have to remember the IP address of every website you visit.</P>

      <H2>What is DNS?</H2>
      <P>
        <strong style={{ color: "#fff" }}>DNS (Domain Name System)</strong> translates human-friendly website
        names into IP addresses that computers can understand.
      </P>
      <Callout tone="info" title="Simple Definition">
        Think of DNS as the <strong style={{ color: "#fff" }}>phone book of the Internet</strong>. Instead of
        remembering <Code>142.250.190.78</Code>, you simply type <Code>www.google.com</Code> and DNS finds the
        correct IP address for you.
      </Callout>

      <H2>A Simple Example</H2>
      <P>Imagine you want to call a friend. You know their name — <strong style={{ color: "#fff" }}>John Smith</strong> — but your phone needs <Code>+44 7XXX XXX XXX</Code>. Your contacts app finds the phone number.</P>
      <P>DNS works exactly the same way.</P>
      <Table
        head={["You Type", "DNS Finds"]}
        rows={[
          ["google.com", "142.x.x.x"],
          ["microsoft.com", "20.x.x.x"],
          ["pulse-speed.com", "Website IP"],
        ]}
      />

      <H2>How DNS Works</H2>
      <P>Let's say you visit <Code>www.pulse-speed.com</Code>. The process looks like this:</P>
      <Flow
        steps={[
          "Your Computer",
          "DNS Server",
          "Find Website IP Address",
          "Return IP Address",
          "Connect to Website",
        ]}
      />
      <P>The whole process usually takes just a few milliseconds.</P>

      <H2>Step-by-Step Example</H2>
      <P><strong style={{ color: "#fff" }}>Step 1</strong> — You enter <Code>www.google.com</Code>.</P>
      <P><strong style={{ color: "#fff" }}>Step 2</strong> — Your computer asks the configured DNS server: "What is the IP address for www.google.com?"</P>
      <P><strong style={{ color: "#fff" }}>Step 3</strong> — The DNS server replies: <Code>142.250.xxx.xxx</Code>.</P>
      <P><strong style={{ color: "#fff" }}>Step 4</strong> — Your computer connects directly to that IP address, and Google's homepage loads.</P>

      <H2>Where Does DNS Come From?</H2>
      <P>Most devices automatically receive DNS server addresses from your router via DHCP. Common public DNS servers include:</P>
      <Table
        head={["Provider", "Primary DNS", "Secondary DNS"]}
        rows={[
          ["Google Public DNS", "8.8.8.8", "8.8.4.4"],
          ["Cloudflare DNS", "1.1.1.1", "1.0.0.1"],
          ["Quad9", "9.9.9.9", "149.112.112.112"],
        ]}
      />
      <P>Many people switch to public DNS services for performance, privacy features, or additional security.</P>

      <H2>What Happens if DNS Stops Working?</H2>
      <P>Imagine trying to visit <Code>www.youtube.com</Code>. If your DNS server cannot resolve the name, ❌ the website won't load.</P>
      <P>
        However, if you already know the website's IP address, you may still be able to connect directly
        (although many modern websites rely on the correct hostname and may not work fully by IP alone).
      </P>
      <P>DNS problems often produce messages such as:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li><Code>DNS_PROBE_FINISHED_NXDOMAIN</Code></li>
        <li>"Server not found"</li>
        <li>"This site can't be reached"</li>
      </ul>

      <H2>DNS vs IP Address</H2>
      <Table
        head={["DNS", "IP Address"]}
        rows={[
          ["Human-readable name", "Numeric address"],
          ["Example: google.com", "Example: 142.250.x.x"],
          ["Easy to remember", "Difficult to remember"],
          ["Converted into an IP", "Used for communication"],
        ]}
      />

      <H2>Real-World Example</H2>
      <P>You're at home with this network:</P>
      <Table
        head={["Device / Role", "IP Address"]}
        rows={[
          ["Laptop", "192.168.1.25"],
          ["Router", "192.168.1.1"],
          ["DNS Server", "1.1.1.1"],
        ]}
      />
      <P>You open <Code>www.bbc.co.uk</Code>. Your laptop:</P>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>Sends a DNS request.</li>
        <li>Receives the website's IP address.</li>
        <li>Connects to the BBC website.</li>
        <li>Displays the page in your browser.</li>
      </ul>

      <H2>Common Mistakes</H2>
      <Callout tone="warn" title="❌ DNS is the Internet">
        DNS only translates names into IP addresses. It does not transfer website data.
      </Callout>
      <Callout tone="warn" title="❌ DNS stores websites">
        DNS does not host websites. It simply tells your computer where to find them.
      </Callout>
      <Callout tone="warn" title="❌ Faster DNS means faster Internet">
        A faster DNS server can reduce the time it takes to look up a website's IP address, but it does not
        increase your Internet connection speed or download bandwidth.
      </Callout>

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>
        <li>✔ DNS stands for Domain Name System.</li>
        <li>✔ DNS converts domain names into IP addresses.</li>
        <li>✔ Computers communicate using IP addresses, not website names.</li>
        <li>✔ DNS lookups happen automatically whenever you visit a website.</li>
        <li>✔ Without DNS, browsing the web would be much less convenient.</li>
      </ul>

      <H2>Practice What You've Learned</H2>
      <P>Try these tools on Pulse-Speed:</P>
      <TryItCard
        to="/dns-lookup"
        title="🔍 DNS Lookup"
        body="Enter a domain such as google.com or cloudflare.com and view its DNS records."
      />
      <TryItCard
        to="/whose-ip"
        title="🌍 What's My IP"
        body="Compare your own IP address with the IP addresses returned by DNS."
      />
      <TryItCard
        to="/ping-ip"
        title="📡 Ping IP"
        body="Ping the resolved IP address to verify connectivity."
      />

      <Callout tone="info" title="Did You Know?">
        Every time you open a website, send an email, or use many mobile apps, a DNS lookup is usually
        performed behind the scenes. Modern devices also cache DNS responses, so if you visit the same website
        again shortly afterwards, the lookup is often much faster.
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
          <Link to="/academy/what-is-a-default-gateway" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 11: What is a Default Gateway?
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
      q: "What does DNS stand for?",
      options: ["Data Network Service", "Domain Name System", "Digital Network Service", "Domain Number Service"],
      answer: 1,
    },
    {
      q: "What is DNS used for?",
      options: ["Assign IP addresses", "Convert domain names into IP addresses", "Encrypt Internet traffic", "Store websites"],
      answer: 1,
    },
    {
      q: "Which is a valid public DNS server?",
      options: ["8.8.8.8", "255.255.255.0", "192.168.1.255", "127.0.0.1"],
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
