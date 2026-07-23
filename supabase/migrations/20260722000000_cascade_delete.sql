-- Add ON DELETE CASCADE for child tables so deleting a parent
-- also removes children from the server automatically.

ALTER TABLE audit_results
  DROP CONSTRAINT IF EXISTS audit_results_planning_id_fkey,
  ADD CONSTRAINT audit_results_planning_id_fkey
    FOREIGN KEY (planning_id) REFERENCES audit_plannings(id) ON DELETE CASCADE;

ALTER TABLE audit_actions
  DROP CONSTRAINT IF EXISTS audit_actions_result_id_fkey,
  ADD CONSTRAINT audit_actions_result_id_fkey
    FOREIGN KEY (result_id) REFERENCES audit_results(id) ON DELETE CASCADE;

ALTER TABLE audit_actions
  DROP CONSTRAINT IF EXISTS audit_actions_planning_id_fkey,
  ADD CONSTRAINT audit_actions_planning_id_fkey
    FOREIGN KEY (planning_id) REFERENCES audit_plannings(id) ON DELETE CASCADE;
