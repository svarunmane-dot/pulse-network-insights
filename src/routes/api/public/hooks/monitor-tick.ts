import { createFileRoute } from "@tanstack/react-router";

// Runs every minute (pg_cron). Probes all enabled monitors via TCP and
// records check + state-change events. Bypasses RLS via service-role admin.

export const Route = createFileRoute("/api/public/hooks/monitor-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Light auth: require apikey header matches the project's anon key.
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const got = request.headers.get("apikey");
        if (!expected || got !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { tcpProbe } = await import("@/lib/monitor-probe.server");

        const { data: monitors, error } = await supabaseAdmin
          .from("wan_monitors")
          .select("id, host, port, last_status")
          .eq("enabled", true);
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        let checked = 0;
        let changes = 0;
        const now = new Date().toISOString();

        await Promise.all(
          (monitors ?? []).map(async (m) => {
            checked++;
            const r = await tcpProbe(m.host, m.port, 4000);
            const status = r.ok ? "up" : "down";
            const latency = r.ok ? r.ms ?? null : null;
            const err = r.ok ? null : r.error ?? "down";

            // history (best-effort)
            await supabaseAdmin.from("monitor_checks").insert({
              monitor_id: m.id,
              status,
              latency_ms: latency,
              error: err,
              checked_at: now,
            });

            const changed = m.last_status !== null && m.last_status !== status;
            const update: Record<string, unknown> = {
              last_status: status,
              last_latency_ms: latency,
              last_checked_at: now,
            };
            if (m.last_status === null || changed) {
              update.last_status_change_at = now;
            }
            await supabaseAdmin.from("wan_monitors").update(update).eq("id", m.id);

            if (changed) {
              changes++;
              await supabaseAdmin.from("monitor_events").insert({
                monitor_id: m.id,
                from_status: m.last_status,
                to_status: status,
                latency_ms: latency,
                error: err,
                created_at: now,
              });
            }
          }),
        );

        return Response.json({ ok: true, checked, changes });
      },
    },
  },
});
