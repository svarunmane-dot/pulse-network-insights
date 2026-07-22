import { createFileRoute, Link } from "@tanstack/react-router";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson1-hero.jpg";

export const Route = createFileRoute("/academy/")({
  head: () =>
    toolHead({
      path: "/academy",
      title: "Network Engineer Academy – Learn Networking Daily",
      description:
        "Free daily networking lessons for engineers. Learn computer networks, IP, DNS, subnetting, routing and more with hands-on practice tools.",
      name: "Network Engineer Academy",
      category: "EducationalApplication",
      faqs: [
        {
          q: "Is the Network Engineer Academy free?",
          a: "Yes. Every lesson on Pulse Speed's Network Engineer Academy is free to read and practice with our built-in networking tools.",
        },
        {
          q: "How often are new lessons published?",
          a: "A new networking topic is published every day, ranging from basics to advanced enterprise networking concepts.",
        },
      ],
    }),
  component: AcademyIndex,
});

type Lesson = {
  n: number;
  slug: string;
  title: string;
  desc: string;
  status: "live" | "soon";
};

const LESSONS: Lesson[] = [
  {
    n: 1,
    slug: "/academy/lesson-1",
    title: "What is a Computer Network?",
    desc: "Devices, switches, routers, LAN vs WAN and how data travels across the internet.",
    status: "live",
  },
  {
    n: 2,
    slug: "/academy/lesson-2",
    title: "LAN vs WAN vs MAN vs PAN Explained",
    desc: "Compare the four network scopes with real-world examples.",
    status: "live",
  },
  {
    n: 3,
    slug: "/academy/lesson-3",
    title: "What is an IP Address?",
    desc: "Public vs private, static vs dynamic, and how IPs identify devices.",
    status: "live",
  },
  {
    n: 4,
    slug: "/academy/lesson-4",
    title: "IPv4 Classes (A, B, C, D & E) Explained",
    desc: "First octet ranges, default subnet masks, private ranges and real-world examples.",
    status: "live",
  },
  {
    n: 5,
    slug: "#",
    title: "Understanding the OSI Model",
    desc: "The 7 layers, what runs at each, and how to troubleshoot with them.",
    status: "soon",
  },
];

function AcademyIndex() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 80px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(0,212,170,0.12)",
              color: "#00D4AA",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.4,
            }}
          >
            NEW · DAILY LESSONS
          </div>
          <h1
            style={{
              fontSize: 44,
              lineHeight: 1.1,
              margin: "14px 0 12px",
              letterSpacing: "-1px",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            Network Engineer Academy
          </h1>
          <p style={{ color: "#c8d0e0", fontSize: 17, lineHeight: 1.65, margin: 0 }}>
            A new networking topic every day. Read the lesson, then jump into a real
            Pulse Speed tool to practice what you just learned — Learn → Practice →
            Understand.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link
              to="/academy/lesson-1"
              style={{
                background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
                color: "#04150f",
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Start Lesson 1 →
            </Link>
            <Link
              to="/"
              style={{
                border: "1px solid #1f2740",
                color: "#c8d0e0",
                padding: "12px 18px",
                borderRadius: 10,
                textDecoration: "none",
              }}
            >
              Explore Tools
            </Link>
          </div>
        </div>
        <img
          src={heroImg}
          alt="Network engineer academy — devices connected in a network"
          width={1024}
          height={1024}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: 16,
            border: "1px solid #1f2740",
          }}
        />
      </div>

      <h2 style={{ color: "#fff", marginTop: 56, fontSize: 24 }}>Curriculum</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
          marginTop: 16,
        }}
      >
        {LESSONS.map((l) => {
          const live = l.status === "live";
          const card = (
            <div
              style={{
                background: "#0f1422",
                border: "1px solid #1f2740",
                borderRadius: 14,
                padding: 18,
                height: "100%",
                opacity: live ? 1 : 0.65,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: live ? "#00D4AA" : "#6b7794",
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                LESSON {String(l.n).padStart(2, "0")} · {live ? "AVAILABLE" : "COMING SOON"}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#fff",
                  marginTop: 6,
                }}
              >
                {l.title}
              </div>
              <p style={{ color: "#c8d0e0", fontSize: 13, lineHeight: 1.55, margin: "8px 0 0" }}>
                {l.desc}
              </p>
            </div>
          );
          return live ? (
            <Link key={l.n} to={l.slug} style={{ textDecoration: "none" }}>
              {card}
            </Link>
          ) : (
            <div key={l.n}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}