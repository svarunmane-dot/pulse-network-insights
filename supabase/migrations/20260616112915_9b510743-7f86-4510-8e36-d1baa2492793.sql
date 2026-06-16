
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  is_admin boolean,
  max_monitors int,
  retention_days int,
  monitor_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.created_at,
    public.has_role(p.id, 'admin') AS is_admin,
    COALESCE(ul.max_monitors, 1) AS max_monitors,
    COALESCE(ul.retention_days, 1) AS retention_days,
    COALESCE((SELECT count(*) FROM public.wan_monitors wm WHERE wm.user_id = p.id), 0) AS monitor_count
  FROM public.profiles p
  LEFT JOIN public.user_limits ul ON ul.user_id = p.id
  ORDER BY p.created_at ASC;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
