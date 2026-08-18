export const RUN_ID = '20260818T120000Z-a1b2c3d4e5f6-7f31c9ab';
export const PLAN_PATH = 'docs/superpowers/plans/foo.md';
export const FINGERPRINT = `git-blob:${'a'.repeat(40)}`;
export const SECOND_FINGERPRINT = `git-blob:${'b'.repeat(40)}`;

export function makeRun(overrides = {}) {
  return {
    schema_version: 1, run_id: RUN_ID, workflow: 'sdd', feature: 'foo',
    plan_path: PLAN_PATH, initial_plan_fingerprint: FINGERPRINT,
    created_at: '2026-08-18T12:00:00.000Z', ...overrides,
  };
}

export function makeStoredRun(overrides = {}) {
  const metadata = makeRun(overrides);
  return {
    runDir: `/tmp/superpowers-metrics/.superpowers/metrics/${metadata.plan_path.slice(0, -3)}/${metadata.run_id}`,
    metadata,
    eventLines: [],
  };
}

export function makeEvent(sequence, event_type, payload = {}, overrides = {}) {
  return {
    schema_version: 1, event_id: `${RUN_ID}:${sequence}`, run_id: RUN_ID,
    sequence, timestamp: `2026-08-18T12:${String(sequence).padStart(2, '0')}:00.000Z`,
    workflow: 'sdd', event_type, feature: 'foo', plan_path: PLAN_PATH,
    plan_fingerprint: FINGERPRINT, payload, ...overrides,
  };
}

export const toLines = events => events.map((event, index) => ({
  lineNumber: index + 1,
  text: JSON.stringify(event),
}));

export const numberLines = lines => lines.map((text, index) => ({ lineNumber: index + 1, text }));

export const validTaskDispatchPayload = () => ({
  task_id: 'task-1', dispatch_id: 'dispatch-2', attempt: 2, dispatch_kind: 'IMPLEMENTATION',
});

export function activeRunEvents() {
  return [
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' }),
    makeEvent(4, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }),
  ];
}

export function blockedRunEvents() {
  const events = activeRunEvents();
  events.push(makeEvent(5, 'run_blocked', { reason_code: 'IMPLEMENTATION_BLOCKED', task_ids: ['task-1'] }));
  return events;
}

export function passingRunEvents() {
  const events = activeRunEvents();
  events.push(
    makeEvent(5, 'final_review_result', { result: 'PASS', review_id: 'final-review-1', finding_ids: [] }),
    makeEvent(6, 'final_test_result', { result: 'PASS', evidence_kind: 'COUNTS', passed: 1, total: 1 }),
    makeEvent(7, 'run_passed', { basis: 'FINAL_TEST_AND_REVIEW_PASS' }),
  );
  return events;
}

export const MINIMAL_PAYLOADS = {
  run_started: { trigger: 'NEW_PLAN' },
  run_resumed: { previous_outcome: 'BLOCKED', reason_code: 'WORKFLOW_RESUMED' },
  plan_registered: { task_count: 1 },
  preflight_completed: { result: 'PASS', diagnostic_codes: [] },
  task_registered: { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' },
  plan_task_added: { task_id: 'task-2', ordinal: 2, title: 'Added task', origin: 'ADDED', previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' },
  plan_task_changed: { task_id: 'task-1', ordinal: 1, title: 'Changed task', previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' },
  plan_task_superseded: { task_id: 'task-1', replacement_task_ids: ['task-2'], previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' },
  task_dispatched: { task_id: 'task-1', dispatch_id: 'dispatch-1', attempt: 1, dispatch_kind: 'IMPLEMENTATION' },
  task_implementation_completed: { task_id: 'task-1', status: 'DONE', commit_ids: ['abcdef0'] },
  task_test_result: { task_id: 'task-1', result: 'PASS', evidence_kind: 'COUNTS', passed: 1, total: 1 },
  task_implementation_review_result: { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 },
  task_quality_review_result: { task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED' },
  finding_raised: { finding_id: 'F-001', scope: 'TASK', task_id: 'task-1', category: 'QUALITY', severity: 'IMPORTANT', title: 'Missing boundary check', location: 'lib/example.mjs:10' },
  finding_resolved: { finding_id: 'F-001', resolution_code: 'FIX_VERIFIED', fix_round: 1 },
  finding_parked: { finding_id: 'F-001', ruling_code: 'DEFERRED_NON_BLOCKING', task_id: 'task-1' },
  fix_round_started: { task_id: 'task-1', round: 1, finding_ids: ['F-001'], dispatch_id: 'dispatch-fix-1' },
  fix_round_completed: { task_id: 'task-1', round: 1, review_id: 'review-fix-1', finding_results: [{ finding_id: 'F-001', verdict: 'ADDRESSED' }] },
  task_accepted: { task_id: 'task-1', acceptance_basis: 'REVIEW_CLEAN' },
  task_blocked: { task_id: 'task-1', reason_code: 'IMPLEMENTATION_BLOCKED', required_human_input: false },
  human_intervention_required: { intervention_id: 'intervention-1', affected_task_ids: ['task-1'], reason_code: 'SECURITY_SENSITIVE_ACTION' },
  human_intervention_completed: { intervention_id: 'intervention-1', resolution_code: 'HUMAN_DECISION_RECEIVED' },
  final_review_result: { result: 'PASS', review_id: 'final-review-1', finding_ids: [] },
  final_test_result: { result: 'PASS', evidence_kind: 'COUNTS', passed: 146, total: 146 },
  run_passed: { basis: 'FINAL_TEST_AND_REVIEW_PASS' },
  run_blocked: { reason_code: 'FINAL_TEST_FAILED', task_ids: [] },
  run_incomplete: { reason_code: 'EVIDENCE_INVALID' },
};
