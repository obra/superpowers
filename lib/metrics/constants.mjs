export const SCHEMA_VERSION = 1;
export const RETENTION_TERMINAL_LIMIT = 5;
export const MAX_FINDING_TITLE = 240;
export const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
export const TASK_ID_RE = /^task-[1-9][0-9]*$/;
export const FINDING_ID_RE = /^F-[0-9]{3,}$/;
export const EVENT_TYPES = Object.freeze([
  'run_started', 'run_resumed', 'plan_registered', 'preflight_completed',
  'task_registered', 'plan_task_added', 'plan_task_changed', 'plan_task_superseded',
  'task_dispatched', 'task_implementation_completed', 'task_test_result',
  'task_implementation_review_result', 'task_quality_review_result', 'finding_raised',
  'finding_resolved', 'finding_parked', 'fix_round_started', 'fix_round_completed',
  'task_accepted', 'task_blocked', 'human_intervention_required',
  'human_intervention_completed', 'final_review_result', 'final_test_result',
  'run_passed', 'run_blocked', 'run_incomplete',
]);
