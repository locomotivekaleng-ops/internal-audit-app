-- ============================================================
-- Migration: RLS policies for all data tables
-- Allows authenticated users to CRUD data via REST API
-- ============================================================

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'audit_plannings',
    'audit_results',
    'audit_actions',
    'fds_cases',
    'wbs_cases',
    'outlets',
    'brands',
    'fraud_categories',
    'provinces',
    'departments',
    'auditors'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_all" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_all" ON %I
       FOR ALL
       USING (auth.role() = ''authenticated'')
       WITH CHECK (auth.role() = ''authenticated'');',
      t
    );
  END LOOP;
END $$;
