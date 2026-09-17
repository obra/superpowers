import assert from 'node:assert/strict';
import test from 'node:test';
import { reduceRun } from '../../lib/metrics/reducer.mjs';
import {
  blockedThenResumedAndAccepted, findingAcrossRereviews, findingDetailConflict,
  invalidPostDispatchChange, makeRun, missingQualityReview, openBlockingFindingAccepted,
  parkedAndResolvedConflict, resolveBeforeRaise, sixFixRounds, supersededAcceptedTask,
  taskChangedBeforeDispatch, unresolvedCannotVerify, validAdjustedPlanEvents,
  validBatchedTaskEvents, interventionForNamedTask, failedReviewsAccepted,
  invalidTaskTransitions, invalidFixRoundCompletion, resumePreservesReviewState,
  mixedInterventionTasks,
} from './fixtures.mjs';
import { FINGERPRINT, SECOND_FINGERPRINT, makeEvent, toLines } from './fixtures.mjs';

const effectiveIds = events => [...reduceRun(makeRun(), events).tasks.values()]
  .filter(task => task.effective)
  .map(task => task.task_id);
const diagnosticCodes = events => reduceRun(makeRun(), events).diagnostics
  .map(diagnostic => diagnostic.code)
  .join(',');

test('keeps one state per task when a dispatch batches plan tasks', () => {
  const reduced = reduceRun(makeRun(), validBatchedTaskEvents());
  assert.deepEqual([...reduced.tasks.keys()], ['task-1', 'task-2']);
  assert.equal(reduced.tasks.get('task-1').dispatch_id, 'dispatch-a');
  assert.equal(reduced.tasks.get('task-2').dispatch_id, 'dispatch-a');
});

test('applies additions and supersession and rejects post-dispatch mutation', () => {
  assert.deepEqual(effectiveIds(validAdjustedPlanEvents()), ['task-2', 'task-3']);
  assert.equal(diagnosticCodes(invalidPostDispatchChange()), 'PLAN_TASK_CHANGE_AFTER_DISPATCH');
});

test('requires paired review results and resolved cannot-verify items', () => {
  assert.equal(diagnosticCodes(missingQualityReview()), 'TASK_REVIEW_PAIR_INCOMPLETE');
  assert.equal(diagnosticCodes(unresolvedCannotVerify()), 'TASK_REVIEW_CANNOT_VERIFY_OPEN');
});

test('counts a finding once across fix rereviews and enforces five-round cap', () => {
  const reduced = reduceRun(makeRun(), findingAcrossRereviews());
  assert.equal(reduced.findings.size, 1);
  assert.equal(reduced.tasks.get('task-1').fix_rounds, 2);
  assert.equal(diagnosticCodes(sixFixRounds()), 'FIX_ROUND_LIMIT_EXCEEDED');
});

test('allows a task change before dispatch and excludes a superseded accepted task', () => {
  const changed = reduceRun(makeRun(), taskChangedBeforeDispatch());
  assert.equal(changed.tasks.get('task-1').title, 'Changed before dispatch');
  assert.deepEqual(changed.diagnostics, []);
  assert.deepEqual(effectiveIds(supersededAcceptedTask()), ['task-2']);
});

test('keeps finding details stable and requires raising before resolving', () => {
  assert.equal(diagnosticCodes(findingDetailConflict()), 'FINDING_DETAIL_CONFLICT');
  assert.equal(diagnosticCodes(resolveBeforeRaise()), 'FINDING_RESOLVE_BEFORE_RAISE');
  assert.equal(diagnosticCodes(parkedAndResolvedConflict()), 'FINDING_PARKED_RESOLVED_CONFLICT');
});

test('allows a blocked task to resume and attributes intervention only to named tasks', () => {
  const resumed = reduceRun(makeRun(), blockedThenResumedAndAccepted());
  assert.equal(resumed.tasks.get('task-1').state, 'ACCEPTED');
  const intervention = reduceRun(makeRun(), interventionForNamedTask());
  assert.equal(intervention.tasks.get('task-1').human_intervention_required, true);
  assert.equal(intervention.tasks.get('task-2').human_intervention_required, false);
});

test('does not accept a task with an open Critical or Important finding', () => {
  assert.equal(diagnosticCodes(openBlockingFindingAccepted()), 'TASK_ACCEPTANCE_OPEN_BLOCKING_FINDING');
});

test('does not accept paired reviews unless both initial gates approve', () => {
  const reduced = reduceRun(makeRun(), failedReviewsAccepted());
  assert.equal(diagnosticCodes(failedReviewsAccepted()), 'TASK_ACCEPTANCE_REVIEW_NOT_APPROVED');
  assert.equal(reduced.tasks.get('task-1').state, 'UNDER_REVIEW');
});

test('rejects task transitions before prerequisites without resetting dispatch state', () => {
  const reduced = reduceRun(makeRun(), invalidTaskTransitions());
  assert.equal(diagnosticCodes(invalidTaskTransitions()), 'TASK_IMPLEMENTATION_DISPATCH_REQUIRED,TASK_REVIEW_IMPLEMENTATION_REQUIRED,TASK_DISPATCH_INVALID');
  assert.equal(reduced.tasks.get('task-1').state, 'DISPATCHED');
  assert.equal(reduced.tasks.get('task-1').dispatch_id, 'dispatch-a');
});

test('leaves fix state and findings unchanged when any completion result is invalid', () => {
  const reduced = reduceRun(makeRun(), invalidFixRoundCompletion());
  assert.equal(diagnosticCodes(invalidFixRoundCompletion()), 'FIX_ROUND_FINDING_INVALID');
  assert.equal(reduced.tasks.get('task-1').fix_rounds, 0);
  assert.equal(reduced.tasks.get('task-1').active_fix_round, 1);
  assert.equal(reduced.findings.get('F-001').disposition, 'OPEN');
});

test('restores exact task state when a blocked run resumes', () => {
  const reduced = reduceRun(makeRun(), resumePreservesReviewState());
  assert.equal(reduced.tasks.get('task-1').state, 'UNDER_REVIEW');
});

test('rejects mixed known and unknown intervention tasks without partial attribution', () => {
  const reduced = reduceRun(makeRun(), mixedInterventionTasks());
  assert.equal(diagnosticCodes(mixedInterventionTasks()), 'INTERVENTION_TASK_UNKNOWN');
  assert.equal(reduced.interventions.size, 0);
  assert.equal(reduced.tasks.get('task-1').human_intervention_required, false);
});

test('rejects every task attribution after supersession without mutation', () => {
  const adjustment = { previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION' };
  const events = [
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' }),
    makeEvent(4, 'plan_task_superseded', { task_id: 'task-1', replacement_task_ids: [], ...adjustment }),
    makeEvent(5, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(6, 'task_dispatched', { task_id: 'task-1', dispatch_id: 'dispatch-1', attempt: 1, dispatch_kind: 'IMPLEMENTATION' }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(7, 'task_implementation_completed', { task_id: 'task-1', status: 'DONE', commit_ids: [] }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(8, 'task_implementation_review_result', { task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS', gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0 }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(9, 'task_quality_review_result', { task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED' }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(10, 'fix_round_started', { task_id: 'task-1', round: 1, finding_ids: [], dispatch_id: 'dispatch-fix-1' }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(11, 'task_blocked', { task_id: 'task-1', reason_code: 'IMPLEMENTATION_BLOCKED', required_human_input: false }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(12, 'finding_raised', { finding_id: 'F-001', scope: 'TASK', task_id: 'task-1', category: 'QUALITY', severity: 'IMPORTANT', title: 'Stale task' }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(13, 'human_intervention_required', { intervention_id: 'intervention-1', affected_task_ids: ['task-1'], reason_code: 'SECURITY_SENSITIVE_ACTION' }, { plan_fingerprint: SECOND_FINGERPRINT }),
  ];
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.equal(reduced.tasks.get('task-1').state, 'SUPERSEDED');
  assert.equal(reduced.tasks.get('task-1').dispatched, false);
  assert.equal(reduced.findings.size, 0);
  assert.equal(reduced.interventions.size, 0);
  assert.equal(reduced.diagnostics.filter(diagnostic => diagnostic.code === 'TASK_SUPERSEDED_EXECUTION_INVALID').length, 6);
  assert.equal(reduced.diagnostics.filter(diagnostic => diagnostic.code === 'TASK_SUPERSEDED_ATTRIBUTION_INVALID').length, 2);
});
