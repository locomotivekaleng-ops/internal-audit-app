-- ============================================================
-- Migration: DB Quality — dates, updated_at, indexes, cleanup
-- #3  Drop legacy users references
-- #5  TEXT → DATE for date columns
-- #6  updated_at triggers
-- #7  Composite indexes
-- ============================================================

-- ── #3. Drop users table if still present ──────────────────
DROP TABLE IF EXISTS users CASCADE;

-- Remove FK on auditors.user_id (column kept as nullable text)
ALTER TABLE auditors DROP CONSTRAINT IF EXISTS auditors_user_id_fkey;

-- ── #5. TEXT → DATE / TIMESTAMP ────────────────────────────
-- audit_plannings (drop defaults first to avoid empty-string cast errors)
ALTER TABLE audit_plannings ALTER COLUMN planning_date     DROP DEFAULT;
ALTER TABLE audit_plannings ALTER COLUMN audit_date_from   DROP DEFAULT;
ALTER TABLE audit_plannings ALTER COLUMN audit_date_to     DROP DEFAULT;
ALTER TABLE audit_plannings ALTER COLUMN report_sent_date  DROP DEFAULT;
ALTER TABLE audit_plannings ALTER COLUMN planning_date     TYPE date      USING planning_date::date;
ALTER TABLE audit_plannings ALTER COLUMN audit_date_from   TYPE date      USING audit_date_from::date;
ALTER TABLE audit_plannings ALTER COLUMN audit_date_to     TYPE date      USING audit_date_to::date;
ALTER TABLE audit_plannings ALTER COLUMN report_sent_date  TYPE date      USING report_sent_date::date;
ALTER TABLE audit_plannings ALTER COLUMN planning_date     SET DEFAULT NULL;
ALTER TABLE audit_plannings ALTER COLUMN audit_date_from   SET DEFAULT NULL;
ALTER TABLE audit_plannings ALTER COLUMN audit_date_to     SET DEFAULT NULL;

-- audit_results (finding_date has DEFAULT '' → drop first)
ALTER TABLE audit_results  ALTER COLUMN finding_date       DROP DEFAULT;
ALTER TABLE audit_results  ALTER COLUMN finding_date       TYPE date      USING finding_date::date;
ALTER TABLE audit_results  ALTER COLUMN finding_date       SET DEFAULT NULL;

-- audit_actions (due_date has DEFAULT '' → drop first; completed_at is nullable)
ALTER TABLE audit_actions  ALTER COLUMN due_date           DROP DEFAULT;
ALTER TABLE audit_actions  ALTER COLUMN due_date           TYPE date      USING due_date::date;
ALTER TABLE audit_actions  ALTER COLUMN completed_at       DROP DEFAULT;
ALTER TABLE audit_actions  ALTER COLUMN completed_at       TYPE timestamp USING completed_at::timestamp;
ALTER TABLE audit_actions  ALTER COLUMN due_date           SET DEFAULT NULL;

-- auditors (join_date has DEFAULT '' → drop first)
ALTER TABLE auditors       ALTER COLUMN join_date          DROP DEFAULT;
ALTER TABLE auditors       ALTER COLUMN join_date          TYPE date      USING join_date::date;
ALTER TABLE auditors       ALTER COLUMN join_date          SET DEFAULT NULL;

-- fds_cases (detection_date has DEFAULT '' → drop first)
ALTER TABLE fds_cases      ALTER COLUMN detection_date     DROP DEFAULT;
ALTER TABLE fds_cases      ALTER COLUMN detection_date     TYPE date      USING detection_date::date;
ALTER TABLE fds_cases      ALTER COLUMN detection_date     SET DEFAULT NULL;

-- wbs_cases (report_date has DEFAULT '' → drop first; resolved_date has no default)
ALTER TABLE wbs_cases      ALTER COLUMN report_date        DROP DEFAULT;
ALTER TABLE wbs_cases      ALTER COLUMN report_date        TYPE date      USING report_date::date;
ALTER TABLE wbs_cases      ALTER COLUMN resolved_date      TYPE date      USING resolved_date::date;
ALTER TABLE wbs_cases      ALTER COLUMN report_date        SET DEFAULT NULL;

-- ── #6. updated_at trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to transactional tables
ALTER TABLE wbs_cases         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE fds_cases         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE audit_plannings   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE audit_results     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE audit_actions     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE auditors          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE brands            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE departments       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE fraud_categories  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE outlets           ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE provinces         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER trg_wbs_cases_updated_at
  BEFORE UPDATE ON wbs_cases FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fds_cases_updated_at
  BEFORE UPDATE ON fds_cases FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_plannings_updated_at
  BEFORE UPDATE ON audit_plannings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_results_updated_at
  BEFORE UPDATE ON audit_results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_actions_updated_at
  BEFORE UPDATE ON audit_actions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_auditors_updated_at
  BEFORE UPDATE ON auditors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fraud_categories_updated_at
  BEFORE UPDATE ON fraud_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_outlets_updated_at
  BEFORE UPDATE ON outlets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_provinces_updated_at
  BEFORE UPDATE ON provinces FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── #7. Composite indexes ─────────────────────────────────
DROP INDEX IF EXISTS idx_wbs_cases_status;
DROP INDEX IF EXISTS idx_wbs_cases_brand;
DROP INDEX IF EXISTS idx_fds_cases_status;
DROP INDEX IF EXISTS idx_audit_plannings_status;

CREATE INDEX idx_wbs_cases_brand_status       ON wbs_cases(brand, status);
CREATE INDEX idx_fds_cases_brand_status       ON fds_cases(brand, status);
CREATE INDEX idx_audit_plannings_brand_status ON audit_plannings(brand, status);
CREATE INDEX idx_audit_results_planning_status ON audit_results(planning_id, status);
CREATE INDEX idx_audit_actions_planning_status ON audit_actions(planning_id, status);
