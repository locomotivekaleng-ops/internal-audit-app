-- ============================================================
-- FASE 1: Plug the Leaks (CRITICAL)
-- ============================================================

-- 1. Set NEW strong JWT secret (run manually in production: ALTER DATABASE postgres SET "app.settings.jwt_secret" TO '...');
-- Skipped in local dev because ALTER DATABASE requires superuser

-- 2. Revoke dangerous functions from anon (unauthenticated users)
REVOKE ALL ON FUNCTION public.admin_delete_user FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reset_password FROM anon, authenticated;

-- Recreate admin_delete_user with superadmin-only check
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only superadmin can delete users';
  END IF;
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- Recreate admin_reset_password with superadmin-only check
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_id UUID, new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only superadmin can reset passwords';
  END IF;
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  WHERE id = target_id;
END;
$$;

-- Grant ONLY to authenticated (NOT anon)
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_password TO authenticated;

-- 3. Fix RLS on profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_delete ON public.profiles;

-- Profiles SELECT: any authenticated user can view profiles
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Profiles INSERT: only self-registration via trigger or superadmin
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Profiles DELETE: only superadmin/head
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'head')
    )
  );

-- 4. Revoke net extension functions from anon + authenticated (SSRF prevention)
REVOKE ALL ON FUNCTION net.http_get FROM anon, authenticated;
REVOKE ALL ON FUNCTION net.http_post FROM anon, authenticated;
REVOKE ALL ON FUNCTION supabase_functions.http_request FROM anon, authenticated;

-- Grant only to service_role (for server-side use)
GRANT EXECUTE ON FUNCTION net.http_get TO service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO service_role;
GRANT EXECUTE ON FUNCTION supabase_functions.http_request TO service_role;

-- 5. Revoke excessive schema-level grants from anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Grant minimal SELECT on reference data only (public info, no sensitive data)
GRANT SELECT ON public.brands TO anon;
GRANT SELECT ON public.departments TO anon;
GRANT SELECT ON public.fraud_categories TO anon;
GRANT SELECT ON public.provinces TO anon;

-- Revoke dangerous privileges from authenticated (no TRUNCATE/TRIGGER/REFERENCES)
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM authenticated;


-- ============================================================
-- FASE 2: Hardening (HIGH)
-- ============================================================

-- 6. Secure handle_new_user: NEVER trust user-supplied role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role, department, status)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'auditor',
    NULL,
    'active'
  );
  RETURN NEW;
END;
$$;

-- 7. Helper function: check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- 8. App-level audit logging table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY audit_log_insert ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;

-- 9. Function to log audit events (callable from app code)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, details, ip_address)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details, p_ip_address)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
