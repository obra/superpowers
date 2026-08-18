import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReducedModel } from '../../lib/metrics/model.mjs';
import { reduceRun } from '../../lib/metrics/reducer.mjs';
import {
  FINGERPRINT,
  SECOND_FINGERPRINT,
  makeRun,
  autonomousCompletionEvents,
  nineTaskPassEvents,
  outcomeEvents,
  reviewDenominatorEvents,
  toLines,
} from './fixtures.mjs';

const modelFor = events => buildReducedModel(reduceRun(makeRun(), toLines(events)), {
  currentPlanFingerprint: FINGERPRINT,
});

test('calculates approved headline metrics', () => {
  const model = buildReducedModel(reduceRun(makeRun(), nineTaskPassEvents()), {
    currentPlanFingerprint: FINGERPRINT,
  });

  assert.equal(model.outcome, 'PASS');
  assert.equal(model.metrics.tasks, 9);
  assert.equal(model.metrics.completed, 9);
  assert.equal(model.metrics.first_pass_success.display, '77.8%');
  assert.equal(model.metrics.autonomous_completion.display, '100.0%');
  assert.equal(model.metrics.fix_rounds, 3);
  assert.equal(model.metrics.fix_rounds_per_task.display, '0.33');
  assert.equal(model.metrics.critical_findings, 0);
  assert.equal(model.metrics.important_findings, 4);
  assert.equal(model.metrics.parked_findings, 1);
  assert.equal(model.final_test.display, '146/146');
});

test('carries validated run identity into reduced model', () => {
  const model = modelFor(outcomeEvents.emptyEvidence());

  assert.deepEqual(model.run, {
    run_id: '20260818T120000Z-a1b2c3d4e5f6-7f31c9ab',
    workflow: 'sdd',
    feature: 'foo',
    plan_path: 'docs/superpowers/plans/foo.md',
    initial_plan_fingerprint: FINGERPRINT,
    created_at: '2026-08-18T12:00:00.000Z',
  });
});

test('uses UNKNOWN for empty denominators and absent final verification', () => {
  const model = modelFor(outcomeEvents.emptyEvidence());

  assert.equal(model.metrics.first_pass_success.value, null);
  assert.equal(model.metrics.first_pass_success.display, 'UNKNOWN');
  assert.equal(model.metrics.fix_rounds_per_task.value, null);
  assert.equal(model.metrics.fix_rounds_per_task.display, 'UNKNOWN');
  assert.equal(model.final_test.display, 'UNKNOWN');
  assert.equal(model.final_review, 'NOT_RUN');
});

test('applies INCOMPLETE over BLOCKED over PASS precedence', () => {
  assert.equal(modelFor(outcomeEvents.malformedBlocked()).outcome, 'INCOMPLETE');
  assert.equal(modelFor(outcomeEvents.failedFinalTests()).outcome, 'BLOCKED');
  assert.equal(modelFor(outcomeEvents.failedFinalReview()).outcome, 'BLOCKED');
  assert.equal(modelFor(outcomeEvents.unresolvedWorkflowBlocker()).outcome, 'BLOCKED');
  assert.equal(modelFor(outcomeEvents.absenceOfFailureOnly()).outcome, 'INCOMPLETE');
});

test('keeps lifecycle state independent from incomplete active outcome', () => {
  const model = modelFor(outcomeEvents.absenceOfFailureOnly());
  assert.equal(model.outcome, 'INCOMPLETE');
  assert.equal(model.lifecycle_state, 'ACTIVE');
});

test('counts unique severities cumulatively and preserves stable entity ordering', () => {
  const model = modelFor(outcomeEvents.findingsAndOrdering());

  assert.equal(model.metrics.critical_findings, 1);
  assert.equal(model.metrics.important_findings, 1);
  assert.equal(model.metrics.parked_findings, 1);
  assert.deepEqual(model.tasks.map(task => task.task_id), ['task-1', 'task-2']);
  assert.deepEqual(model.findings.map(finding => finding.finding_id), ['F-002', 'F-001']);
});

test('uses latest task state and completed fix cycles only', () => {
  const model = modelFor(outcomeEvents.resumedAndOpenFixRound());

  assert.equal(model.metrics.blocked_tasks, 0);
  assert.equal(model.metrics.fix_rounds, 1);
});

test('uses only final verification for headline test evidence', () => {
  const model = modelFor(outcomeEvents.taskCountsAndFinalExitStatus());
  assert.equal(model.final_test.display, 'PASS');
});

test('warns on current fingerprint mismatch without changing outcome', () => {
  const reduction = reduceRun(makeRun(), nineTaskPassEvents());
  const model = buildReducedModel(reduction, { currentPlanFingerprint: SECOND_FINGERPRINT });

  assert.equal(model.outcome, 'PASS');
  assert.deepEqual(model.warnings.map(warning => warning.code), ['PLAN_FINGERPRINT_MISMATCH']);
});

test('calculates first-pass and fix-round denominators from reviewed tasks', () => {
  const model = buildReducedModel(reduceRun(makeRun(), reviewDenominatorEvents()), {
    currentPlanFingerprint: FINGERPRINT,
  });

  assert.equal(model.metrics.first_pass_success.display, '66.7%');
  assert.equal(model.metrics.fix_rounds, 2);
  assert.equal(model.metrics.fix_rounds_per_task.display, '0.67');
});

test('calculates autonomous completion against all effective tasks', () => {
  const model = buildReducedModel(reduceRun(makeRun(), autonomousCompletionEvents()), {
    currentPlanFingerprint: FINGERPRINT,
  });

  assert.equal(model.metrics.tasks, 6);
  assert.equal(model.metrics.completed, 4);
  assert.equal(model.metrics.autonomous_completion.display, '50.0%');
});
