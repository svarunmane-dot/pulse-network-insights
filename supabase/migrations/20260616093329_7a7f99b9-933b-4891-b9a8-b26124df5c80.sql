
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Signup trigger: profile + role assignment (admin if hardcoded email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  IF lower(NEW.email) = 'pulse.speeed@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- WAN Monitors
CREATE TABLE public.wan_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 443,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_status TEXT,           -- 'up' | 'down' | null
  last_latency_ms INTEGER,
  last_checked_at TIMESTAMPTZ,
  last_status_change_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wan_monitors TO authenticated;
GRANT ALL ON public.wan_monitors TO service_role;
ALTER TABLE public.wan_monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own monitors all" ON public.wan_monitors FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wan_monitors_user ON public.wan_monitors(user_id);
CREATE INDEX idx_wan_monitors_enabled ON public.wan_monitors(enabled);

-- Monitor checks history (rolling)
CREATE TABLE public.monitor_checks (
  id BIGSERIAL PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES public.wan_monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL,        -- 'up' | 'down'
  latency_ms INTEGER,
  error TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.monitor_checks TO authenticated;
GRANT ALL ON public.monitor_checks TO service_role;
ALTER TABLE public.monitor_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own checks" ON public.monitor_checks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wan_monitors m WHERE m.id = monitor_id
                 AND (m.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE INDEX idx_monitor_checks_monitor_time ON public.monitor_checks(monitor_id, checked_at DESC);

-- Monitor state-change events
CREATE TABLE public.monitor_events (
  id BIGSERIAL PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES public.wan_monitors(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.monitor_events TO authenticated;
GRANT ALL ON public.monitor_events TO service_role;
ALTER TABLE public.monitor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own events" ON public.monitor_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wan_monitors m WHERE m.id = monitor_id
                 AND (m.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE INDEX idx_monitor_events_monitor_time ON public.monitor_events(monitor_id, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_wan_monitors_updated
BEFORE UPDATE ON public.wan_monitors
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
