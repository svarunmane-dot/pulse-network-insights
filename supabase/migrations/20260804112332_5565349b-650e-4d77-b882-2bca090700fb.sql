CREATE TABLE public.site_hit_days (
  day date PRIMARY KEY,
  hits bigint NOT NULL DEFAULT 0
);
GRANT ALL ON public.site_hit_days TO service_role;
ALTER TABLE public.site_hit_days ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_visitor_days (
  day date NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, visitor_hash)
);
GRANT ALL ON public.site_visitor_days TO service_role;
ALTER TABLE public.site_visitor_days ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_site_hit(_visitor_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.site_hit_days (day, hits)
  VALUES (current_date, 1)
  ON CONFLICT (day) DO UPDATE SET hits = public.site_hit_days.hits + 1;

  IF _visitor_hash IS NOT NULL THEN
    INSERT INTO public.site_visitor_days (day, visitor_hash)
    VALUES (current_date, _visitor_hash)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_site_hit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_site_hit(text) TO service_role;