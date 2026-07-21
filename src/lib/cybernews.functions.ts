import { createServerFn } from "@tanstack/react-start";

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string; // ISO
  source: string;
  description: string;
  categories: string[];
};

const FEEDS: { source: string; url: string }[] = [
  { source: "SANS ISC", url: "https://isc.sans.edu/rssfeed.xml" },
  { source: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
  { source: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { source: "SecurityWeek", url: "https://www.securityweek.com/feed/" },
];

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeEntities(m[1]).trim() : null;
}

function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(decodeEntities(m[1]).trim());
  return out;
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  // RSS <item> blocks
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  const entryRe = /<entry[\s>][\s\S]*?<\/entry>/gi;
  const blocks = xml.match(itemRe) ?? xml.match(entryRe) ?? [];
  for (const block of blocks) {
    const title = pick(block, "title") ?? "";
    let link = pick(block, "link") ?? "";
    if (!link) {
      const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (hrefMatch) link = hrefMatch[1];
    }
    const pubRaw =
      pick(block, "pubDate") ??
      pick(block, "published") ??
      pick(block, "updated") ??
      pick(block, "dc:date") ??
      "";
    let iso = "";
    const d = pubRaw ? new Date(pubRaw) : null;
    if (d && !isNaN(d.getTime())) iso = d.toISOString();
    const desc =
      pick(block, "description") ??
      pick(block, "summary") ??
      pick(block, "content:encoded") ??
      "";
    const categories = pickAll(block, "category")
      .map((c) => stripHtml(c))
      .filter(Boolean)
      .slice(0, 5);
    if (!title || !link) continue;
    items.push({
      title: stripHtml(title),
      link: stripHtml(link),
      pubDate: iso,
      source,
      description: stripHtml(desc).slice(0, 400),
      categories,
    });
  }
  return items;
}

async function fetchFeed(source: string, url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PulseSpeed-NewsAggregator/1.0 (+https://pulse-speed.com)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, source);
  } catch {
    return [];
  }
}

export const fetchCyberNews = createServerFn({ method: "GET" }).handler(async () => {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f.source, f.url)));
  const merged = results.flat();
  merged.sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
  return {
    items: merged.slice(0, 80),
    fetchedAt: new Date().toISOString(),
    sources: FEEDS.map((f) => f.source),
  };
});