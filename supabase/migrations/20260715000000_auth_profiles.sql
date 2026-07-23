-- ============================================================
-- Migration: Supabase Auth + Profiles
-- Replaces the custom `users` table with auth.users + profiles
-- ============================================================

-- ── 1. Profiles Table ─────────────────────────────────────

CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL DEFAULT '',
  role             TEXT NOT NULL DEFAULT 'auditor'
                     CHECK (role IN ('superadmin', 'head', 'auditor', 'division')),
  department       TEXT REFERENCES departments(id),
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'inactive')),
  pic_department   TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Auto-create Profile on Auth Signup ────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role, department, status)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'auditor'),
    NULL,
    'active'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 3. RPC: Admin Reset Password ─────────────────────────

CREATE OR REPLACE FUNCTION admin_reset_password(target_id UUID, new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'extensions, public, auth'
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  WHERE id = target_id;
END;
$$;

-- ── 4. RPC: Admin Delete User ────────────────────────────

CREATE OR REPLACE FUNCTION admin_delete_user(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- ── 5. RLS on profiles ───────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (true);

-- ── 6. Permissions ───────────────────────────────────────

GRANT ALL ON profiles TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_reset_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user TO anon, authenticated;
