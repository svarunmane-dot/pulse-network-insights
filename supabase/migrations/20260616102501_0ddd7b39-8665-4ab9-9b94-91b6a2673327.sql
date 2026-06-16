-- Per-user limits for WAN monitoring + auto-expiry of monitors

CREATE TABLE public.user_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  max_monitors int NOT NULL DEFAULT 1,
  retention_days int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_limits TO authenticated;
GRANT ALL ON public.user_limits TO service_role;

ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_limits read own or admin"
  ON public.user_limits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_limits admin manage"
  ON public.user_limits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_limits_touch
  BEFORE UPDATE ON public.user_limits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add expiry column to wan_monitors
ALTER TABLE public.wan_monitors ADD COLUMN expires_at timestamptz;

-- Effective limit for a user (defaults: 1 monitor, 1 day)
CREATE OR REPLACE FUNCTION public.get_user_limits(_user_id uuid)
RETURNS TABLE(max_monitors int, retention_days int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE((SELECT ul.max_monitors FROM public.user_limits ul WHERE ul.user_id = _user_id), 1) AS max_monitors,
    COALESCE((SELECT ul.retention_days FROM public.user_limits ul WHERE ul.user_id = _user_id), 1) AS retention_days;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_limits(uuid) TO authenticated, anon, service_role;

-- Set expires_at on insert (admins never expire)
CREATE OR REPLACE FUNCTION public.set_monitor_expiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE days int;
BEGIN
  IF NEW.expires_at IS NULL THEN
    IF public.has_role(NEW.user_id, 'admin') THEN
      NEW.expires_at := NULL;
    ELSE
      SELECT retention_days INTO days FROM public.get_user_limits(NEW.user_id);
      NEW.expires_at := COALESCE(NEW.created_at, now()) + make_interval(days => days);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER set_monitor_expiry_trg
  BEFORE INSERT ON public.wan_monitors
  FOR EACH ROW EXECUTE FUNCTION public.set_monitor_expiry();

-- Enforce per-user monitor count cap (admins unlimited)
CREATE OR REPLACE FUNCTION public.enforce_monitor_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cap int; cnt int;
BEGIN
  IF public.has_role(NEW.user_id, 'admin') THEN
    RETURN NEW;
  END IF;
  SELECT max_monitors INTO cap FROM public.get_user_limits(NEW.user_id);
  SELECT count(*) INTO cnt FROM public.wan_monitors WHERE user_id = NEW.user_id;
  IF cnt >= cap THEN
    RAISE EXCEPTION 'You have reached your monitor limit (%). Contact an admin to increase it.', cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER enforce_monitor_limit_trg
  BEFORE INSERT ON public.wan_monitors
  FOR EACH ROW EXECUTE FUNCTION public.enforce_monitor_limit();

-- Backfill expires_at on existing rows for non-admin owners (1 day from created_at)
UPDATE public.wan_monitors m
SET expires_at = m.created_at + make_interval(days => 1)
WHERE m.expires_at IS NULL
  AND NOT public.has_role(m.user_id, 'admin');