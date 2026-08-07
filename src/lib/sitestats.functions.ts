import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type SiteStats = {
  totalHits: number;
  totalVisitors: number;
  todayHits: number;
  todayVisitors: number;
  last7dHits: number;
  since: string | null;
  daily: { day: string; hits: number; visitors: number }[];
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function publicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Records one page view (and, when a visitor id is supplied, one unique visitor for today). */
export const recordSiteHit = createServerFn({ method: "POST" })
  .inputValidator((input: { visitorId?: string } | undefined) => ({
    visitorId:
      typeof input?.visitorId === "string" && input.visitorId.length <= 128
        ? input.visitorId
        : undefined,
  }))
  .handler(async ({ data }) => {
    const hash = data.visitorId ? await sha256Hex(`pulse-speed:${data.visitorId}`) : null;
    const { error } = await publicClient().rpc("record_site_hit" as never, {
      _visitor_hash: hash,
    } as never);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

const EMPTY: SiteStats = {
  totalHits: 0,
  totalVisitors: 0,
  todayHits: 0,
  todayVisitors: 0,
  last7dHits: 0,
  since: null,
  daily: [],
};

/** Aggregated, non-personal usage numbers for the public stats widget. */
export const getSiteStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteStats> => {
    const { data, error } = await publicClient().rpc("get_site_stats" as never);
    if (error || !data) return EMPTY;
    const s = data as unknown as SiteStats;
    return {
      totalHits: Number(s.totalHits ?? 0),
      totalVisitors: Number(s.totalVisitors ?? 0),
      todayHits: Number(s.todayHits ?? 0),
      todayVisitors: Number(s.todayVisitors ?? 0),
      last7dHits: Number(s.last7dHits ?? 0),
      since: s.since ?? null,
      daily: (s.daily ?? []).map((d) => ({
        day: d.day,
        hits: Number(d.hits ?? 0),
        visitors: Number(d.visitors ?? 0),
      })),
    };
  },
);
