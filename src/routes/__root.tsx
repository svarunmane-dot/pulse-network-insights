import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pulse Speed – Internet Speed Test, Ping & Latency Checker" },
      {
        name: "description",
        content:
          "Test your internet speed, ping, jitter and latency instantly with Pulse Speed. Fast, accurate and lightweight internet performance testing platform.",
      },
      {
        name: "keywords",
        content:
          "internet speed test, ping test, latency checker, jitter test, broadband speed, wifi speed, upload speed, download speed, Mbps test, network test",
      },
      { name: "author", content: "Arun – Network Architect" },
      { name: "theme-color", content: "#0A0E1A" },
      { property: "og:site_name", content: "Pulse Speed" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://pulse-speed.com/" },
      { property: "og:image", content: "https://pulse-speed.com/favicon.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@pulsespeed" },
      // Analytics placeholders – replace IDs when ready
      // { name: "google-site-verification", content: "REPLACE_ME" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Pulse Speed",
          url: "https://pulse-speed.com/",
          logo: "https://pulse-speed.com/favicon.png",
          founder: { "@type": "Person", name: "Arun" },
          description:
            "Pulse Speed is a lightweight internet performance testing platform built by a network architect.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </QueryClientProvider>
  );
}

function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        background: "rgba(10,14,26,0.7)",
        borderBottom: "1px solid #1f2740",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "#fff",
          }}
          aria-label="Pulse Speed home"
        >
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#04150f",
            }}
          >
            ⚡
          </span>
          <span style={{ fontWeight: 700, letterSpacing: "-0.3px" }}>Pulse Speed</span>
        </Link>
        <nav
          aria-label="Primary"
          style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
        >
          {[
            { to: "/", label: "Speed Test" },
            { to: "/ping", label: "Ping a Friend" },
            { to: "/global", label: "Global Latency" },
            { to: "/subnet", label: "Subnet Calculator" },
            { to: "/dnslookup", label: "DNS Lookup" },
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              activeProps={{ style: { color: "#00D4AA" } }}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                color: "#c8d0e0",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: 60,
        borderTop: "1px solid #1f2740",
        background: "#0a0e1a",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "40px 24px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 8 }}>Pulse Speed</div>
          <p style={{ fontSize: 13, color: "#6b7794", lineHeight: 1.6, margin: 0 }}>
            Built by Arun – Network Architect &amp; Infrastructure Specialist. Fast, accurate
            and lightweight internet performance testing.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { to: "/", label: "Speed Test" },
            { to: "/ping", label: "Ping a Friend" },
            { to: "/subnet", label: "Subnet Calculator" },
            { to: "/dnslookup", label: "DNS Lookup" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Service" },
          ]}
        />
        <div>
          <div style={{ fontWeight: 600, color: "#fff", marginBottom: 10, fontSize: 13 }}>
            Follow
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["X", "in", "GH"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={`Social link ${s}`}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid #1f2740",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c8d0e0",
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid #1f2740",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 12,
          color: "#6b7794",
        }}
      >
        © {new Date().getFullYear()} Pulse Speed. Built by Arun – Network Architect &amp;
        Infrastructure Specialist.
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: "#fff", marginBottom: 10, fontSize: 13 }}>
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              style={{ color: "#c8d0e0", fontSize: 13, textDecoration: "none" }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
