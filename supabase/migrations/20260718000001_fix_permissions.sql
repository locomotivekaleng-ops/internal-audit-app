-- ============================================================
-- Migration: Fix GRANT permissions — revoke ALL from anon
-- ============================================================

-- 1. Revoke all dari anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 2. Anon cuma bisa SELECT master data (untuk login page, dll)
GRANT SELECT ON brands, provinces, departments, fraud_categories TO anon;

-- 3. Authenticated users full akses (dibatasi sama RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Revoke previous GRANT on profiles
REVOKE ALL ON profiles FROM anon;
GRANT ALL ON profiles TO authenticated;
