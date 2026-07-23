-- Extend status CHECK constraints to accept all values used by the app
-- Union of: DB original values, WBS form values, FDS form values

ALTER TABLE wbs_cases DROP CONSTRAINT IF EXISTS wbs_cases_status_check;
ALTER TABLE wbs_cases ADD CONSTRAINT wbs_cases_status_check
  CHECK (status IN (
    'New', 'Planned', 'Open',
    'Investigation', 'In Progress',
    'On Hold', 'Hold',
    'Closed', 'Dismissed', 'Cancelled'
  ));

ALTER TABLE fds_cases DROP CONSTRAINT IF EXISTS fds_cases_status_check;
ALTER TABLE fds_cases ADD CONSTRAINT fds_cases_status_check
  CHECK (status IN (
    'New', 'Planned', 'Open',
    'Investigation', 'In Progress',
    'On Hold', 'Hold',
    'Closed', 'Dismissed', 'Cancelled'
  ));
