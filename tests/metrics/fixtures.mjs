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

const task = (task_id, ordinal, title = `Task ${ordinal}`) =>
  ({ task_id, ordinal, title, origin: 'INITIAL' });

const preflight = events => events.concat(makeEvent(events.length + 1, 'preflight_completed', {
  result: 'PASS', diagnostic_codes: [],
}));

const numbered = events => toLines(events);

export function validBatchedTaskEvents() {
  return numbered(preflight([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 2 }),
    makeEvent(3, 'task_registered', task('task-1', 1)),
    makeEvent(4, 'task_registered', task('task-2', 2)),
  ]).concat([
    makeEvent(6, 'task_dispatched', { ...validTaskDispatchPayload(), task_id: 'task-1', dispatch_id: 'dispatch-a', attempt: 1 }),
    makeEvent(7, 'task_dispatched', { ...validTaskDispatchPayload(), task_id: 'task-2', dispatch_id: 'dispatch-a', attempt: 1 }),
  ]));
}

export function validAdjustedPlanEvents() {
  return numbered([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 2 }),
    makeEvent(3, 'task_registered', task('task-1', 1)),
    makeEvent(4, 'task_registered', task('task-2', 2)),
    makeEvent(5, 'plan_task_added', { task_id: 'task-3', ordinal: 3, title: 'Added task', origin: 'ADDED', previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' }),
    makeEvent(6, 'plan_task_superseded', { task_id: 'task-1', replacement_task_ids: ['task-3'], previous_fingerprint: SECOND_FINGERPRINT, new_fingerprint: FINGERPRINT, reason_code: 'PLAN_CORRECTION' }),
  ]);
}

export function invalidPostDispatchChange() {
  return numbered(preflight([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', task('task-1', 1)),
  ]).concat([
    makeEvent(5, 'task_dispatched', validTaskDispatchPayload()),
    makeEvent(6, 'plan_task_changed', { task_id: 'task-1', ordinal: 1, title: 'Too late', previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' }),
  ]));
}

const reviewedTask = () => preflight([
  makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 1 }),
  makeEvent(3, 'task_registered', task('task-1', 1)),
]).concat([
  makeEvent(5, 'task_dispatched', validTaskDispatchPayload()),
  makeEvent(6, 'task_implementation_completed', { task_id: 'task-1', status: 'DONE', commit_ids: [] }),
]);

export function missingQualityReview() {
  return numbered(reviewedTask().concat(makeEvent(7, 'task_implementation_review_result', {
    task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0,
  })));
}

export function unresolvedCannotVerify() {
  return numbered(reviewedTask().concat([
    makeEvent(7, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'CANNOT_VERIFY', gate_verdict: 'FAIL', cannot_verify_count: 1, resolved_cannot_verify_count: 0 }),
    makeEvent(8, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'NEEDS_FIXES' }),
  ]));
}

const taskWithFinding = () => reviewedTask().concat([
  makeEvent(7, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }),
  makeEvent(8, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED' }),
  makeEvent(9, 'finding_raised', MINIMAL_PAYLOADS.finding_raised),
]);

export function findingAcrossRereviews() {
  return numbered(taskWithFinding().concat([
    makeEvent(10, 'fix_round_started', MINIMAL_PAYLOADS.fix_round_started),
    makeEvent(11, 'fix_round_completed', MINIMAL_PAYLOADS.fix_round_completed),
    makeEvent(12, 'fix_round_started', { ...MINIMAL_PAYLOADS.fix_round_started, round: 2, dispatch_id: 'dispatch-fix-2' }),
    makeEvent(13, 'fix_round_completed', { ...MINIMAL_PAYLOADS.fix_round_completed, round: 2, review_id: 'review-fix-2', finding_results: [{ finding_id: 'F-001', verdict: 'NOT_ADDRESSED' }] }),
  ]));
}

export function sixFixRounds() {
  const events = taskWithFinding();
  for (let round = 1; round <= 6; round += 1) {
    const sequence = 9 + ((round - 1) * 2) + 1;
    events.push(makeEvent(sequence, 'fix_round_started', { ...MINIMAL_PAYLOADS.fix_round_started, round, dispatch_id: `dispatch-fix-${round}` }));
    events.push(makeEvent(sequence + 1, 'fix_round_completed', { ...MINIMAL_PAYLOADS.fix_round_completed, round, review_id: `review-fix-${round}` }));
  }
  return numbered(events);
}

export function taskChangedBeforeDispatch() {
  return numbered([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', task('task-1', 1)),
    makeEvent(4, 'plan_task_changed', { task_id: 'task-1', ordinal: 1, title: 'Changed before dispatch', previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' }),
  ]);
}

export function supersededAcceptedTask() {
  return numbered(reviewedTask().concat([
    makeEvent(7, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }),
    makeEvent(8, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED' }),
    makeEvent(9, 'task_accepted', MINIMAL_PAYLOADS.task_accepted),
    makeEvent(10, 'plan_task_added', { task_id: 'task-2', ordinal: 2, title: 'Replacement', origin: 'ADDED', previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' }),
    makeEvent(11, 'plan_task_superseded', { task_id: 'task-1', replacement_task_ids: ['task-2'], previous_fingerprint: SECOND_FINGERPRINT, new_fingerprint: FINGERPRINT, reason_code: 'PLAN_CORRECTION' }),
  ]));
}

export function findingDetailConflict() {
  return numbered(taskWithFinding().concat(makeEvent(10, 'finding_raised', { ...MINIMAL_PAYLOADS.finding_raised, title: 'Different title' })));
}

export function resolveBeforeRaise() {
  return numbered(reviewedTask().concat(makeEvent(7, 'finding_resolved', MINIMAL_PAYLOADS.finding_resolved)));
}

export function parkedAndResolvedConflict() {
  return numbered(taskWithFinding().concat([
    makeEvent(10, 'finding_resolved', MINIMAL_PAYLOADS.finding_resolved),
    makeEvent(11, 'finding_parked', MINIMAL_PAYLOADS.finding_parked),
  ]));
}

export function blockedThenResumedAndAccepted() {
  return numbered(reviewedTask().concat([
    makeEvent(7, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }),
    makeEvent(8, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED' }),
    makeEvent(9, 'task_blocked', MINIMAL_PAYLOADS.task_blocked),
    makeEvent(10, 'run_blocked', { reason_code: 'IMPLEMENTATION_BLOCKED', task_ids: ['task-1'] }),
    makeEvent(11, 'run_resumed', { previous_outcome: 'BLOCKED', reason_code: 'WORKFLOW_RESUMED' }),
    makeEvent(12, 'task_accepted', MINIMAL_PAYLOADS.task_accepted),
  ]));
}

export function interventionForNamedTask() {
  return numbered(preflight([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 2 }),
    makeEvent(3, 'task_registered', task('task-1', 1)), makeEvent(4, 'task_registered', task('task-2', 2)),
  ]).concat(makeEvent(6, 'human_intervention_required', MINIMAL_PAYLOADS.human_intervention_required)));
}

export function openBlockingFindingAccepted() {
  return numbered(taskWithFinding().concat(makeEvent(10, 'task_accepted', MINIMAL_PAYLOADS.task_accepted)));
}

export function failedReviewsAccepted() {
  return numbered(reviewedTask().concat([
    makeEvent(7, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'FAIL', gate_verdict: 'FAIL', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }),
    makeEvent(8, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'NEEDS_FIXES' }),
    makeEvent(9, 'task_accepted', MINIMAL_PAYLOADS.task_accepted),
  ]));
}

export function invalidTaskTransitions() {
  return numbered(preflight([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', task('task-1', 1)),
  ]).concat([
    makeEvent(5, 'task_implementation_completed', { task_id: 'task-1', status: 'DONE', commit_ids: [] }),
    makeEvent(6, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }),
    makeEvent(7, 'task_dispatched', { ...validTaskDispatchPayload(), dispatch_id: 'dispatch-a', attempt: 1 }),
    makeEvent(8, 'task_dispatched', { ...validTaskDispatchPayload(), dispatch_id: 'dispatch-b', attempt: 2 }),
  ]));
}

export function invalidFixRoundCompletion() {
  return numbered([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 2 }),
    makeEvent(3, 'task_registered', task('task-1', 1)), makeEvent(4, 'task_registered', task('task-2', 2)),
    makeEvent(5, 'finding_raised', MINIMAL_PAYLOADS.finding_raised),
    makeEvent(6, 'finding_raised', { ...MINIMAL_PAYLOADS.finding_raised, finding_id: 'F-002', task_id: 'task-2', title: 'Other task finding' }),
    makeEvent(7, 'fix_round_started', MINIMAL_PAYLOADS.fix_round_started),
    makeEvent(8, 'fix_round_completed', { ...MINIMAL_PAYLOADS.fix_round_completed, finding_results: [{ finding_id: 'F-001', verdict: 'ADDRESSED' }, { finding_id: 'F-002', verdict: 'ADDRESSED' }] }),
  ]);
}

export function resumePreservesReviewState() {
  return numbered(reviewedTask().concat([
    makeEvent(7, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }),
    makeEvent(8, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED' }),
    makeEvent(9, 'task_blocked', MINIMAL_PAYLOADS.task_blocked),
    makeEvent(10, 'run_blocked', { reason_code: 'IMPLEMENTATION_BLOCKED', task_ids: ['task-1'] }),
    makeEvent(11, 'run_resumed', MINIMAL_PAYLOADS.run_resumed),
  ]));
}

export function mixedInterventionTasks() {
  return numbered(preflight([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }), makeEvent(2, 'plan_registered', { task_count: 2 }),
    makeEvent(3, 'task_registered', task('task-1', 1)), makeEvent(4, 'task_registered', task('task-2', 2)),
  ]).concat(makeEvent(6, 'human_intervention_required', {
    intervention_id: 'intervention-1', affected_task_ids: ['task-1', 'task-9'], reason_code: 'SECURITY_SENSITIVE_ACTION',
  })));
}
