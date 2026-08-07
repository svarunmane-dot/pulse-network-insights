CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT (current_date - i) AS day FROM generate_series(0, 29) i
  ),
  v AS (
    SELECT day, count(*)::bigint AS visitors FROM site_visitor_days GROUP BY day
  )
  SELECT jsonb_build_object(
    'totalHits', COALESCE((SELECT sum(hits) FROM site_hit_days), 0),
    'totalVisitors', COALESCE((SELECT count(*) FROM site_visitor_days), 0),
    'todayHits', COALESCE((SELECT sum(hits) FROM site_hit_days WHERE day = current_date), 0),
    'todayVisitors', COALESCE((SELECT count(*) FROM site_visitor_days WHERE day = current_date), 0),
    'last7dHits', COALESCE((SELECT sum(hits) FROM site_hit_days WHERE day >= current_date - 6), 0),
    'since', (SELECT min(day)::text FROM site_hit_days),
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', d.day::text,
        'hits', COALESCE(h.hits, 0),
        'visitors', COALESCE(v.visitors, 0)
      ) ORDER BY d.day)
      FROM days d
      LEFT JOIN site_hit_days h ON h.day = d.day
      LEFT JOIN v ON v.day = d.day
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_site_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_site_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_site_hit(text) TO anon, authenticated, service_role;