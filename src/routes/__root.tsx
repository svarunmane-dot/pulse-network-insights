import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import appCss from "../styles.css?url";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Button } from "@/components/ui/button";

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

function ErrorComponent({ error, reset }: import("@tanstack/react-router").ErrorComponentProps) {
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
          "internet speed test, ping test, latency checker, jitter test, broadband speed, wifi speed, upload speed, download speed, Mbps test, network test, ip subnet calculator, dns lookup, reverse dns, domain to ip, ping ip, whose ip, ip geolocation, port check, open port checker, wan monitoring, uptime monitor, ip uptime, public ip monitor, network tools",
      },
      { name: "author", content: "Arun – Network Architect" },
      { name: "theme-color", content: "#0A0E1A" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Pulse Speed" },
      { property: "og:site_name", content: "Pulse Speed" },
      { property: "og:type", content: "website" },
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
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-7SQKFM1G4E",
      },
      {
        children:
          "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-7SQKFM1G4E', { send_page_view: false });",
      },
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
      <PageViewTracker />
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </QueryClientProvider>
  );
}

const HEADER_NAV_GROUPS = [
  {
    label: "Test",
    items: [
      {
        to: "/stability-test",
        label: "24h Stability",
        description: "Track connection quality and dropouts over 24 hours.",
      },
      {
        to: "/global",
        label: "Global Latency",
        description: "Compare network response times around the world.",
      },
      {
        to: "/ping",
        label: "Ping a Friend",
        description: "Compare latency with another person in real time.",
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        to: "/ping-ip",
        label: "Ping IP",
        description: "Check whether a public IP responds and measure delay.",
      },
      {
        to: "/traceroute",
        label: "Traceroute",
        description: "Follow the network path to a host, hop by hop.",
      },
      {
        to: "/dns-lookup",
        label: "DNS Lookup",
        description: "Inspect DNS records for any domain name.",
      },
      {
        to: "/subnet-calculator",
        label: "Subnet Calculator",
        description: "Calculate network ranges, masks, and usable addresses.",
      },
      {
        to: "/whose-ip",
        label: "Whose IP",
        description: "Identify an IP address owner and approximate location.",
      },
      {
        to: "/port-check",
        label: "Port Check",
        description: "Test whether a public TCP port is reachable.",
      },
      {
        to: "/blacklist-check",
        label: "Blacklist Check",
        description: "Check an IP against common reputation blocklists.",
      },
    ],
  },
  {
    label: "Plan",
    items: [
      {
        to: "/ap-planning",
        label: "AP Planning",
        description: "Estimate Wi-Fi access point coverage and placement.",
      },
      {
        to: "/network-diagram",
        label: "Diagram Builder",
        description: "Map a network with devices, links, and labels.",
      },
      {
        to: "/app-monitoring",
        label: "App Monitoring",
        description: "Watch website availability and response performance.",
      },
      {
        to: "/home-wifi",
        label: "Home Wi-Fi Fix",
        description: "Diagnose slow Wi-Fi, dropouts, and dead zones.",
      },
    ],
  },
  {
    label: "Learn",
    items: [
      {
        to: "/troubleshooting",
        label: "Troubleshooting Cookbook",
        description: "Find practical network commands and diagnostic steps.",
      },
      {
        to: "/academy",
        label: "Academy",
        description: "Build networking knowledge with guided lessons.",
      },
      {
        to: "/practice",
        label: "Cert Practice",
        description: "Prepare for certifications and technical interviews.",
      },
      {
        to: "/cyber-news",
        label: "Cyber News",
        description: "Follow current security and infrastructure stories.",
      },
      {
        to: "/password-generator",
        label: "Password Generator",
        description: "Create strong passwords and check breach exposure.",
      },
    ],
  },
] as const;

function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setDesktopOpen(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopOpen(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeAll = () => {
    setDesktopOpen(null);
    setMobileOpen(false);
  };

  return (
    <header ref={headerRef} className="pulse-site-header">
      <div className="pulse-header-inner">
        <Link
          to="/"
          className="pulse-brand"
          aria-label="Pulse Speed home"
          onClick={closeAll}
        >
          <span aria-hidden className="pulse-brand-mark">
            ⚡
          </span>
          <span className="pulse-brand-name">Pulse Speed</span>
        </Link>

        <nav aria-label="Primary" className="pulse-nav-desktop">
          <Link
            to="/"
            onClick={closeAll}
            activeOptions={{ exact: true }}
            className="pulse-nav-link"
            activeProps={{ className: "pulse-nav-link pulse-nav-link-active" }}
          >
            Speed Test
          </Link>
          {HEADER_NAV_GROUPS.map((group) => {
            const isOpen = desktopOpen === group.label;
            return (
              <div className="pulse-nav-group" key={group.label}>
                <Button
                  type="button"
                  variant="ghost"
                  className="pulse-nav-trigger"
                  aria-expanded={isOpen}
                  aria-controls={`desktop-${group.label.toLowerCase()}-menu`}
                  onClick={() => setDesktopOpen(isOpen ? null : group.label)}
                >
                  {group.label}
                  <ChevronDown aria-hidden className={isOpen ? "pulse-chevron-open" : ""} />
                </Button>
                {isOpen && (
                  <div
                    id={`desktop-${group.label.toLowerCase()}-menu`}
                    className="pulse-dropdown"
                  >
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="pulse-dropdown-item"
                        onClick={closeAll}
                      >
                        <span className="pulse-dropdown-label">{item.label}</span>
                        <span className="pulse-dropdown-description">{item.description}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="pulse-menu-btn"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="pulse-mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </Button>

        {mobileOpen && (
          <nav id="pulse-mobile-menu" aria-label="Mobile primary" className="pulse-mobile-menu">
            <Link
              to="/"
              onClick={closeAll}
              activeOptions={{ exact: true }}
              className="pulse-mobile-speed-link"
            >
              Speed Test
            </Link>
            {HEADER_NAV_GROUPS.map((group) => {
              const isOpen = mobileSection === group.label;
              return (
                <div className="pulse-mobile-section" key={group.label}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="pulse-mobile-section-trigger"
                    aria-expanded={isOpen}
                    aria-controls={`mobile-${group.label.toLowerCase()}-menu`}
                    onClick={() => setMobileSection(isOpen ? null : group.label)}
                  >
                    {group.label}
                    <ChevronDown aria-hidden className={isOpen ? "pulse-chevron-open" : ""} />
                  </Button>
                  {isOpen && (
                    <div
                      id={`mobile-${group.label.toLowerCase()}-menu`}
                      className="pulse-mobile-section-items"
                    >
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="pulse-dropdown-item"
                          onClick={closeAll}
                        >
                          <span className="pulse-dropdown-label">{item.label}</span>
                          <span className="pulse-dropdown-description">{item.description}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
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
            { to: "/stability-test", label: "24h Stability Test" },
            { to: "/subnet-calculator", label: "Subnet Calculator" },
            { to: "/dns-lookup", label: "DNS Lookup" },
            { to: "/ping-ip", label: "Ping IP" },
            { to: "/traceroute", label: "Traceroute" },
            { to: "/home-wifi", label: "Home Wi-Fi Fix" },
            { to: "/whose-ip", label: "Whose IP" },
            { to: "/port-check", label: "Port Check" },
            { to: "/blacklist-check", label: "Blacklist Check" },
            { to: "/password-generator", label: "Password Generator" },
            { to: "/app-monitoring", label: "App Monitoring" },
            { to: "/ap-planning", label: "AP Planning" },
            { to: "/network-diagram", label: "Diagram Builder" },
            { to: "/troubleshooting", label: "Troubleshooting Cookbook" },
            { to: "/academy", label: "Network Engineer Academy" },
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
