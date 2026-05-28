import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service – Pulse Speed" },
      {
        name: "description",
        content: "Terms governing your use of Pulse Speed.",
      },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px", color: "#c8d0e0", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0 }}>Terms of Service</h1>
      <p>Last updated: {new Date().getFullYear()}</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Use of the service</h2>
      <p>Pulse Speed is provided as-is for personal and professional diagnostic use. You agree not to abuse, overload or attempt to disrupt the service.</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>No warranty</h2>
      <p>Results are estimates. We make no guarantees about accuracy, availability or fitness for any particular purpose.</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Liability</h2>
      <p>Pulse Speed and its author are not liable for any direct or indirect damages arising from use of the service.</p>
      <h2 style={{ color: "#fff", marginTop: 28 }}>Changes</h2>
      <p>We may update these terms at any time. Continued use constitutes acceptance.</p>
    </article>
  );
}