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
