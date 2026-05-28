import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy – Pulse Speed" },
      {
        name: "description",
        content:
          "How Pulse Speed handles your data. We are privacy focused: no accounts, no tracking beyond aggregate analytics.",
      },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px", color: "#c8d0e0", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0 }}>Privacy Policy</h1>
      <p>Last updated: {new Date().getFullYear()}</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Data we collect</h2>
      <p>Pulse Speed runs entirely in your browser. Speed and latency measurements are computed locally and are not stored on our servers unless you opt in to share them. Your public IP and ISP are looked up from a third-party API (ipapi.co) for display only.</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Cookies & analytics</h2>
      <p>We may use lightweight, privacy-respecting analytics (such as Cloudflare Web Analytics) to understand aggregate usage. No personal profiles are built.</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Third parties</h2>
      <p>Network info lookups call ipapi.co. Their privacy terms apply to that request.</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Contact</h2>
      <p>Questions about privacy? Email hello@pulsespeed.app.</p>
    </article>
  );
}