import { createServerFn } from "@tanstack/react-start";

export type SiteStats = {
  totalHits: number;
  totalVisitors: number;
  todayHits: number;
  todayVisitors: number;
  last7dHits: number;
  since: string | null;
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = data.visitorId ? await sha256Hex(`pulse-speed:${data.visitorId}`) : null;
    const { error } = await supabaseAdmin.rpc("record_site_hit" as never, {
      _visitor_hash: hash,
    } as never);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

/** Aggregated, non-personal usage numbers for the public stats widget. */
export const getSiteStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [daysRes, totalVisitorsRes, todayVisitorsRes] = await Promise.all([
      (supabaseAdmin.from("site_hit_days" as never) as never as {
        select: (c: string) => Promise<{ data: { day: string; hits: number }[] | null }>;
      }).select("day, hits"),
      (supabaseAdmin.from("site_visitor_days" as never) as never as {
        select: (c: string, o: unknown) => Promise<{ count: number | null }>;
      }).select("visitor_hash", { count: "exact", head: true }),
      (supabaseAdmin.from("site_visitor_days" as never) as never as {
        select: (
          c: string,
          o: unknown,
        ) => { eq: (c: string, v: string) => Promise<{ count: number | null }> };
      })
        .select("visitor_hash", { count: "exact", head: true })
        .eq("day", today),
    ]);

    const rows = (daysRes.data ?? []).slice().sort((a, b) => (a.day < b.day ? -1 : 1));
    const sum = (f: (r: { day: string; hits: number }) => boolean) =>
      rows.filter(f).reduce((a, r) => a + Number(r.hits ?? 0), 0);

    return {
      totalHits: sum(() => true),
      totalVisitors: totalVisitorsRes.count ?? 0,
      todayHits: sum((r) => r.day === today),
      todayVisitors: todayVisitorsRes.count ?? 0,
      last7dHits: sum((r) => r.day >= weekAgo),
      since: rows[0]?.day ?? null,
    };
  },
);