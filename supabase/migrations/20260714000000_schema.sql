-- ============================================================
-- Migration: Full Schema for Audit Assignment App
-- snake_case convention (PostgreSQL standard)
-- JS adapter transforms to camelCase on read
-- ============================================================

-- ── 1. Reference / Master Tables ──────────────────────────

CREATE TABLE brands (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3b82f6',
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE provinces (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

CREATE TABLE departments (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  code  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE fraud_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#64748b',
  description TEXT NOT NULL DEFAULT '',
  nature      TEXT NOT NULL DEFAULT 'Fraud' CHECK (nature IN ('Fraud', 'Administrative'))
);

-- ── 2. Entity Tables ─────────────────────────────────────

CREATE TABLE outlets (
  code                TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  brand               TEXT NOT NULL REFERENCES brands(code),
  province            TEXT REFERENCES provinces(id),
  outlet_manager      TEXT NOT NULL DEFAULT '',
  multi_unit_manager  TEXT NOT NULL DEFAULT '',
  area_manager        TEXT NOT NULL DEFAULT '',
  distrik_manager     TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE,
  password        TEXT NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'auditor' CHECK (role IN ('superadmin', 'head', 'auditor', 'division')),
  department      TEXT REFERENCES departments(id),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  pic_department  TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auditors (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id),
  name        TEXT NOT NULL,
  nik         TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL DEFAULT '',
  department  TEXT REFERENCES departments(id),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  join_date   TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Case Tables (WBS & FDS) ──────────────────────────

CREATE TABLE wbs_cases (
  id                    TEXT PRIMARY KEY,
  case_no               TEXT NOT NULL UNIQUE,
  report_date           TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL REFERENCES fraud_categories(id),
  brand                 TEXT NOT NULL REFERENCES brands(code),
  outlet_code           TEXT NOT NULL REFERENCES outlets(code),
  province              TEXT REFERENCES provinces(id),
  status                TEXT NOT NULL DEFAULT 'Investigation' CHECK (status IN ('Open', 'Investigation', 'Closed', 'Hold', 'Dismissed', 'Planned')),
  severity              TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  estimated_fraud       BIGINT NOT NULL DEFAULT 0,
  description           TEXT NOT NULL DEFAULT '',
  initial_indication    TEXT NOT NULL DEFAULT '',
  assigned_to           TEXT REFERENCES auditors(id),
  resolved_date         TEXT,
  linked_planning_id    TEXT,
  notes                 TEXT NOT NULL DEFAULT '',
  pic_department        TEXT NOT NULL DEFAULT '',
  outlet_manager        TEXT NOT NULL DEFAULT '',
  multi_unit_manager    TEXT NOT NULL DEFAULT '',
  area_manager          TEXT NOT NULL DEFAULT '',
  distrik_manager       TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fds_cases (
  id                    TEXT PRIMARY KEY,
  case_no               TEXT NOT NULL UNIQUE,
  detection_date        TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL REFERENCES fraud_categories(id),
  brand                 TEXT NOT NULL REFERENCES brands(code),
  outlet_code           TEXT NOT NULL REFERENCES outlets(code),
  province              TEXT REFERENCES provinces(id),
  status                TEXT NOT NULL DEFAULT 'Investigation' CHECK (status IN ('Open', 'Investigation', 'Closed', 'Hold', 'Dismissed', 'Planned')),
  estimated_fraud       BIGINT NOT NULL DEFAULT 0,
  description           TEXT NOT NULL DEFAULT '',
  assigned_to           TEXT REFERENCES auditors(id),
  linked_planning_id    TEXT,
  notes                 TEXT NOT NULL DEFAULT '',
  pic_department        TEXT NOT NULL DEFAULT '',
  outlet_manager        TEXT NOT NULL DEFAULT '',
  multi_unit_manager    TEXT NOT NULL DEFAULT '',
  area_manager          TEXT NOT NULL DEFAULT '',
  distrik_manager       TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Audit Planning ────────────────────────────────────

CREATE TABLE audit_plannings (
  id                  TEXT PRIMARY KEY,
  report_no           TEXT NOT NULL UNIQUE,
  planning_date       TEXT NOT NULL DEFAULT '',
  audit_date_from     TEXT NOT NULL DEFAULT '',
  audit_date_to       TEXT NOT NULL DEFAULT '',
  trigger             TEXT NOT NULL DEFAULT 'Direct' CHECK (trigger IN ('WBS', 'FDS', 'Direct')),
  trigger_ref         TEXT,
  outlet_code         TEXT NOT NULL REFERENCES outlets(code),
  brand               TEXT NOT NULL REFERENCES brands(code),
  province            TEXT REFERENCES provinces(id),
  department          TEXT REFERENCES departments(id),
  audit_type          TEXT NOT NULL DEFAULT 'Fieldwork' CHECK (audit_type IN ('Fieldwork', 'Monitoring', 'Desk Review', 'Follow-up')),
  lead_auditor        TEXT REFERENCES auditors(id),
  auditor_team        JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope               TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'Plan' CHECK (status IN ('Plan', 'In Progress', 'Completed', 'Cancelled')),
  report_sent_date    TEXT,
  pic_department      TEXT NOT NULL DEFAULT '',
  outlet_manager      TEXT NOT NULL DEFAULT '',
  multi_unit_manager  TEXT NOT NULL DEFAULT '',
  area_manager        TEXT NOT NULL DEFAULT '',
  distrik_manager     TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Audit Results / Findings ──────────────────────────

CREATE TABLE audit_results (
  id                    TEXT PRIMARY KEY,
  planning_id           TEXT NOT NULL REFERENCES audit_plannings(id),
  finding_no            TEXT NOT NULL,
  finding_title         TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL REFERENCES fraud_categories(id),
  finding_date          TEXT NOT NULL DEFAULT '',
  description           TEXT NOT NULL DEFAULT '',
  total_loss            BIGINT NOT NULL DEFAULT 0,
  severity              TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status                TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Overdue')),
  nature                TEXT NOT NULL DEFAULT 'Fraud' CHECK (nature IN ('Fraud', 'Administrative', 'Operational', 'Compliance')),
  fraudster_name        TEXT NOT NULL DEFAULT '',
  fraudster_nik         TEXT NOT NULL DEFAULT '',
  fraudster_position    TEXT NOT NULL DEFAULT '',
  pic_department        TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (planning_id, finding_no)
);

-- ── 6. Audit Actions ─────────────────────────────────────

CREATE TABLE audit_actions (
  id              TEXT PRIMARY KEY,
  result_id       TEXT NOT NULL REFERENCES audit_results(id),
  planning_id     TEXT NOT NULL REFERENCES audit_plannings(id),
  action_no       TEXT NOT NULL,
  action_title    TEXT NOT NULL DEFAULT '',
  action_desc     TEXT NOT NULL DEFAULT '',
  pic_name        TEXT NOT NULL DEFAULT '',
  pic_department  TEXT NOT NULL DEFAULT '',
  due_date        TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed', 'Overdue', 'Cancelled')),
  priority        TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  notes           TEXT NOT NULL DEFAULT '',
  completed_at    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (result_id, action_no)
);

-- ── 7. Circular FK (wbs/fds → audit_plannings) ──────────

ALTER TABLE wbs_cases
  ADD CONSTRAINT wbs_cases_linked_planning_id_fkey
  FOREIGN KEY (linked_planning_id) REFERENCES audit_plannings(id);

ALTER TABLE fds_cases
  ADD CONSTRAINT fds_cases_linked_planning_id_fkey
  FOREIGN KEY (linked_planning_id) REFERENCES audit_plannings(id);

-- ── Indexes ──────────────────────────────────────────────

CREATE INDEX idx_wbs_cases_status ON wbs_cases(status);
CREATE INDEX idx_wbs_cases_brand ON wbs_cases(brand);
CREATE INDEX idx_wbs_cases_assigned_to ON wbs_cases(assigned_to);
CREATE INDEX idx_wbs_cases_outlet_code ON wbs_cases(outlet_code);
CREATE INDEX idx_fds_cases_status ON fds_cases(status);
CREATE INDEX idx_fds_cases_assigned_to ON fds_cases(assigned_to);
CREATE INDEX idx_audit_plannings_status ON audit_plannings(status);
CREATE INDEX idx_audit_plannings_lead_auditor ON audit_plannings(lead_auditor);
CREATE INDEX idx_audit_plannings_outlet_code ON audit_plannings(outlet_code);
CREATE INDEX idx_audit_results_planning_id ON audit_results(planning_id);
CREATE INDEX idx_audit_actions_result_id ON audit_actions(result_id);

-- ── Permissions ──────────────────────────────────────────

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;