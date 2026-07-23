-- ============================================================
-- Migration: Allow anon role to SELECT master reference tables
-- This ensures dropdowns and init() work before login
-- ============================================================

CREATE POLICY "master_select_anon" ON brands FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "master_select_anon" ON provinces FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "master_select_anon" ON departments FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "master_select_anon" ON fraud_categories FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "master_select_anon" ON outlets FOR SELECT USING (auth.role() = 'anon');

