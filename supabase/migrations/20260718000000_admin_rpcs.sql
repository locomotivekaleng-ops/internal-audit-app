-- ============================================================
-- Migration: Admin RPCs (gantikan service_role key di client)
-- ============================================================

-- 1. Admin Create User
CREATE OR REPLACE FUNCTION admin_create_user(
  email TEXT, password TEXT, user_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
  new_user_id UUID;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('superadmin', 'head') THEN
    RAISE EXCEPTION 'Only superadmin or head can create users';
  END IF;
  new_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, instance_id, aud, role
  ) VALUES (
    new_user_id,
    email,
    extensions.crypt(password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    user_metadata || jsonb_build_object('email_verified', true),
    now(), now(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated'
  );
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', email),
    'email',
    now(), now(), now()
  );
  RETURN jsonb_build_object('id', new_user_id);
END;
$$;

-- 2. Admin List Users
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
  result JSONB;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('superadmin', 'head') THEN
    RAISE EXCEPTION 'Only superadmin or head can list users';
  END IF;
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'name', p.name,
      'email', p.email,
      'role', p.role,
      'department', p.department,
      'status', p.status,
      'created_at', p.created_at,
      'last_sign_in_at', au.last_sign_in_at
    ) ORDER BY p.created_at DESC
  ) INTO result
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 3. Admin Update User
CREATE OR REPLACE FUNCTION admin_update_user(
  target_id UUID, attrs JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('superadmin', 'head') THEN
    RAISE EXCEPTION 'Only superadmin or head can update users';
  END IF;
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || attrs
  WHERE id = target_id;
END;
$$;

-- 4. Fix existing RPC grants — revoke from anon, keep authenticated
REVOKE EXECUTE ON FUNCTION admin_reset_password FROM anon;
REVOKE EXECUTE ON FUNCTION admin_delete_user FROM anon;
GRANT EXECUTE ON FUNCTION admin_reset_password TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user TO authenticated;

-- Grant new RPCs to authenticated only
GRANT EXECUTE ON FUNCTION admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user TO authenticated;
