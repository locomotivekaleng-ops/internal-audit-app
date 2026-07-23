-- ============================================================
-- Migration: Granular RLS per role per tabel
-- ============================================================

-- Helper function: cek apakah user adalah superadmin atau head
CREATE OR REPLACE FUNCTION public._is_admin_or_head()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('superadmin', 'head')
  );
$$;

-- Helper function: dapatkan department user yang login
CREATE OR REPLACE FUNCTION public._user_department()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT department FROM public.profiles WHERE id = auth.uid();
$$;

-- ── 1. Profiles ──────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id OR public._is_admin_or_head());

-- ── 2. Master Data ───────────────────────────────────────

-- Brands, Provinces, Departments, Fraud Categories: semua authenticated bisa SELECT

CREATE POLICY "master_select" ON brands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "master_insert" ON brands FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "master_update" ON brands FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "master_delete" ON brands FOR DELETE USING (public._is_admin_or_head());

CREATE POLICY "master_select" ON provinces FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "master_insert" ON provinces FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "master_update" ON provinces FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "master_delete" ON provinces FOR DELETE USING (public._is_admin_or_head());

CREATE POLICY "master_select" ON departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "master_insert" ON departments FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "master_update" ON departments FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "master_delete" ON departments FOR DELETE USING (public._is_admin_or_head());

CREATE POLICY "master_select" ON fraud_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "master_insert" ON fraud_categories FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "master_update" ON fraud_categories FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "master_delete" ON fraud_categories FOR DELETE USING (public._is_admin_or_head());

CREATE POLICY "master_select" ON outlets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "master_insert" ON outlets FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "master_update" ON outlets FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "master_delete" ON outlets FOR DELETE USING (public._is_admin_or_head());

-- ── 3. Auditors ──────────────────────────────────────────

CREATE POLICY "auditors_select" ON auditors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auditors_insert" ON auditors FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "auditors_update" ON auditors FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "auditors_delete" ON auditors FOR DELETE USING (public._is_admin_or_head());

-- ── 4. WBS Cases ─────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_all" ON wbs_cases;
DROP POLICY IF EXISTS "wbs_cases_all" ON wbs_cases;

CREATE POLICY "wbs_select" ON wbs_cases FOR SELECT USING (
  public._is_admin_or_head()
  OR assigned_to IN (
    SELECT id FROM public.auditors
    WHERE department = public._user_department()
  )
);
CREATE POLICY "wbs_insert" ON wbs_cases FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "wbs_update" ON wbs_cases FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "wbs_delete" ON wbs_cases FOR DELETE USING (public._is_admin_or_head());

-- ── 5. FDS Cases ─────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_all" ON fds_cases;
DROP POLICY IF EXISTS "fds_cases_all" ON fds_cases;

CREATE POLICY "fds_select" ON fds_cases FOR SELECT USING (
  public._is_admin_or_head()
  OR assigned_to IN (
    SELECT id FROM public.auditors
    WHERE department = public._user_department()
  )
);
CREATE POLICY "fds_insert" ON fds_cases FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "fds_update" ON fds_cases FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "fds_delete" ON fds_cases FOR DELETE USING (public._is_admin_or_head());

-- ── 6. Audit Plannings ───────────────────────────────────

DROP POLICY IF EXISTS "authenticated_all" ON audit_plannings;
DROP POLICY IF EXISTS "audit_plannings_all" ON audit_plannings;

CREATE POLICY "planning_select" ON audit_plannings FOR SELECT USING (
  public._is_admin_or_head()
  OR department = public._user_department()
);
CREATE POLICY "planning_insert" ON audit_plannings FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "planning_update" ON audit_plannings FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "planning_delete" ON audit_plannings FOR DELETE USING (public._is_admin_or_head());

-- ── 7. Audit Results ─────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_all" ON audit_results;
DROP POLICY IF EXISTS "audit_results_all" ON audit_results;

CREATE POLICY "results_select" ON audit_results FOR SELECT USING (
  public._is_admin_or_head()
  OR planning_id IN (
    SELECT id FROM public.audit_plannings
    WHERE department = public._user_department()
  )
);
CREATE POLICY "results_insert" ON audit_results FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "results_update" ON audit_results FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "results_delete" ON audit_results FOR DELETE USING (public._is_admin_or_head());

-- ── 8. Audit Actions ─────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_all" ON audit_actions;
DROP POLICY IF EXISTS "audit_actions_all" ON audit_actions;

CREATE POLICY "actions_select" ON audit_actions FOR SELECT USING (
  public._is_admin_or_head()
  OR planning_id IN (
    SELECT id FROM public.audit_plannings
    WHERE department = public._user_department()
  )
);
CREATE POLICY "actions_insert" ON audit_actions FOR INSERT WITH CHECK (public._is_admin_or_head());
CREATE POLICY "actions_update" ON audit_actions FOR UPDATE USING (public._is_admin_or_head());
CREATE POLICY "actions_delete" ON audit_actions FOR DELETE USING (public._is_admin_or_head());
