import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Pulse Speed – Built by a Network Architect" },
      {
        name: "description",
        content:
          "Pulse Speed is built by Arun, a network architect with 17+ years of experience in SD-WAN, enterprise networking and performance monitoring.",
      },
      { property: "og:title", content: "About Pulse Speed" },
      {
        property: "og:description",
        content:
          "Built by Arun – 17+ years in SD-WAN and enterprise networking. Our mission is accurate, lightweight internet testing.",
      },
      { property: "og:url", content: "https://pulse-speed.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-speed.com/about" }],
  }),
});

function AboutPage() {
  return (
    <article
      style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}
    >
      <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px", margin: 0 }}>
        About Pulse Speed
      </h1>
      <p style={{ color: "#c8d0e0", marginTop: 16, fontSize: 17, lineHeight: 1.7 }}>
        Pulse Speed is a focused internet performance tool built by{" "}
        <strong>Arun</strong>, a network architect with{" "}
        <strong>17+ years of experience</strong> designing and operating enterprise
        networks.
      </p>

      <h2 style={{ fontSize: 22, marginTop: 36, color: "#fff" }}>Expertise</h2>
      <ul style={{ color: "#c8d0e0", lineHeight: 1.8, paddingLeft: 20 }}>
        <li>SD-WAN design and deployment</li>
        <li>Enterprise networking and routing</li>
        <li>Network performance monitoring and observability</li>
        <li>Wi-Fi engineering, capacity planning and tuning</li>
      </ul>

      <h2 style={{ fontSize: 22, marginTop: 36, color: "#fff" }}>Our Mission</h2>
      <p style={{ color: "#c8d0e0", lineHeight: 1.7 }}>
        Most speed tests are bloated with ads, trackers and vague numbers. Pulse Speed
        exists to give you <strong>accurate, lightweight, transparent</strong> insight
        into your connection — no installs, no accounts, no fluff.
      </p>
    </article>
  );
}