import { createFileRoute, Link, useLocation } from "@tanstack/react-router";

// Catch-all (splat) route: any URL that does not map to a real page lands
// here. It renders a clear 404 and marks itself noindex so search engines
// drop broken URLs instead of reporting soft-404s.
export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page Not Found | Pulse Speed" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "The page you are looking for does not exist on Pulse Speed.",
      },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  const location = useLocation();

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1,
          }}
        >
          404
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "16px 0 8px" }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 14, color: "#6b7794", lineHeight: 1.7, margin: "0 0 8px" }}>
          The page <code style={{ color: "#c8d0e0" }}>{location.pathname}</code> doesn&apos;t
          exist or may have been moved.
        </p>
        <p style={{ fontSize: 14, color: "#6b7794", lineHeight: 1.7, margin: "0 0 28px" }}>
          Try one of our free network tools instead — speed test, subnet calculator, DNS
          lookup and more.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              background: "#00D4AA",
              color: "#04150f",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            ← Back to Home
          </Link>
          <Link
            to="/subnet-calculator"
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "1px solid #1f2740",
              background: "#131829",
              color: "#c8d0e0",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Subnet Calculator
          </Link>
        </div>
      </div>
    </div>
  );
}
