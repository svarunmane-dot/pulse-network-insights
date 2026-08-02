import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://pulse-speed.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/ping", changefreq: "monthly", priority: "0.8" },
          { path: "/pingip", changefreq: "monthly", priority: "0.8" },
          { path: "/global", changefreq: "monthly", priority: "0.8" },
          { path: "/traceroute", changefreq: "monthly", priority: "0.8" },
          { path: "/subnet", changefreq: "monthly", priority: "0.8" },
          { path: "/dnslookup", changefreq: "monthly", priority: "0.8" },
          { path: "/whoisip", changefreq: "monthly", priority: "0.8" },
          { path: "/portcheck", changefreq: "monthly", priority: "0.8" },
          { path: "/blacklist", changefreq: "monthly", priority: "0.8" },
          { path: "/monitoring", changefreq: "weekly", priority: "0.8" },
          { path: "/ap-planning", changefreq: "monthly", priority: "0.8" },
          { path: "/cyber-news", changefreq: "hourly", priority: "0.9" },
          { path: "/academy", changefreq: "daily", priority: "0.9" },
          { path: "/academy/lesson-1", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-2", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-3", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-4", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-5", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-6", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-7", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-8", changefreq: "monthly", priority: "0.7" },
          { path: "/academy/lesson-9", changefreq: "monthly", priority: "0.7" },
          { path: "/about", changefreq: "yearly", priority: "0.6" },
          { path: "/contact", changefreq: "yearly", priority: "0.5" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});