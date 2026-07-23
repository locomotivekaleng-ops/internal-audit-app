-- ============================================================
-- Migration: Add missing columns to audit_actions
-- Frontend sends amount/recovery/unrecovered/completion_date
-- but these columns were never added to the DB schema.
-- ============================================================

ALTER TABLE audit_actions
  ADD COLUMN IF NOT EXISTS amount          BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery        BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unrecovered     BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_date DATE,
  ADD COLUMN IF NOT EXISTS description     TEXT NOT NULL DEFAULT '';
