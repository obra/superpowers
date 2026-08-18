const percentage = (numerator, denominator, decimals = 1) => {
  if (denominator === 0) {
    return {
      value: null,
      display: 'UNKNOWN',
      unavailable_reason: 'NO_ELIGIBLE_TASKS',
    };
  }
  const value = (numerator / denominator) * 100;
  return {
    value,
    display: `${value.toFixed(decimals)}%`,
    unavailable_reason: null,
  };
};

const ratio = (numerator, denominator) => {
  if (denominator === 0) {
    return {
      value: null,
      display: 'UNKNOWN',
      unavailable_reason: 'NO_REVIEWED_TASKS',
    };
  }
  const value = numerator / denominator;
  return { value, display: value.toFixed(2), unavailable_reason: null };
};

function finalTestHeadline(finalTest) {
  if (finalTest.result === 'FAIL') return { ...finalTest, display: 'FAIL' };
  if (finalTest.result !== 'PASS') return { ...finalTest, display: 'UNKNOWN' };
  if (finalTest.evidence_kind === 'COUNTS'
    && Number.isSafeInteger(finalTest.passed)
    && Number.isSafeInteger(finalTest.total)) {
    return { ...finalTest, display: `${finalTest.passed}/${finalTest.total}` };
  }
  if (finalTest.evidence_kind === 'EXIT_STATUS') return { ...finalTest, display: 'PASS' };
  return { ...finalTest, display: 'UNKNOWN' };
}

const sortTasks = tasks => [...tasks].sort((left, right) =>
  (left.ordinal - right.ordinal) || left.task_id.localeCompare(right.task_id));

function outcomeFor(reduction, effectiveTasks) {
  const { diagnostics, interventions, state } = reduction;
  if (diagnostics.length > 0 || state.explicit_outcome === 'INCOMPLETE') return 'INCOMPLETE';

  const hasOpenIntervention = [...interventions.values()].some(intervention => intervention.state === 'REQUIRED');
  const hasBlockedTask = effectiveTasks.some(task => task.state === 'BLOCKED');
  if (state.explicit_outcome === 'BLOCKED'
    || state.final_test.result === 'FAIL'
    || state.final_review === 'FAIL'
    || hasOpenIntervention
    || hasBlockedTask) return 'BLOCKED';

  const allAccepted = effectiveTasks.every(task => task.state === 'ACCEPTED');
  if (state.explicit_outcome === 'PASS'
    && allAccepted
    && state.final_review === 'PASS'
    && state.final_test.result === 'PASS') return 'PASS';
  return 'INCOMPLETE';
}

export function buildReducedModel(reduction, { currentPlanFingerprint = null } = {}) {
  const tasks = sortTasks(reduction.tasks.values());
  const effectiveTasks = tasks.filter(task => task.effective);
  const findings = [...reduction.findings.values()];
  const reviewedTasks = effectiveTasks.filter(task => task.reached_review);
  const completedTasks = effectiveTasks.filter(task => task.state === 'ACCEPTED');
  const firstPassTasks = completedTasks.filter(task => task.fix_rounds === 0);
  const autonomousTasks = completedTasks.filter(task => !task.human_intervention_required);
  const fixRounds = effectiveTasks.reduce((total, task) => total + task.fix_rounds, 0);
  const final_test = finalTestHeadline(reduction.state.final_test);
  const warnings = currentPlanFingerprint !== null
    && currentPlanFingerprint !== reduction.latestPlanFingerprint
    ? [{
      code: 'PLAN_FINGERPRINT_MISMATCH',
      message: 'Current plan fingerprint differs from the latest recorded fingerprint',
      recorded_fingerprint: reduction.latestPlanFingerprint,
      current_fingerprint: currentPlanFingerprint,
    }]
    : [];

  return {
    schema_version: 1,
    run: reduction.run
      ? {
        run_id: reduction.run.run_id,
        workflow: reduction.run.workflow,
        feature: reduction.run.feature,
        plan_path: reduction.run.plan_path,
        initial_plan_fingerprint: reduction.run.initial_plan_fingerprint,
        created_at: reduction.run.created_at,
      }
      : null,
    lifecycle_state: reduction.state.lifecycle_state,
    outcome: outcomeFor(reduction, effectiveTasks),
    metrics: {
      tasks: effectiveTasks.length,
      completed: completedTasks.length,
      first_pass_success: percentage(firstPassTasks.length, reviewedTasks.length),
      autonomous_completion: percentage(autonomousTasks.length, effectiveTasks.length),
      fix_rounds: fixRounds,
      fix_rounds_per_task: ratio(fixRounds, reviewedTasks.length),
      critical_findings: findings.filter(finding => finding.severity === 'CRITICAL').length,
      important_findings: findings.filter(finding => finding.severity === 'IMPORTANT').length,
      blocked_tasks: effectiveTasks.filter(task => task.state === 'BLOCKED').length,
      parked_findings: findings.filter(finding => finding.disposition === 'PARKED').length,
    },
    tasks,
    findings,
    final_review: reduction.state.final_review,
    final_test,
    warnings,
    diagnostics: reduction.diagnostics,
    latest_plan_fingerprint: reduction.latestPlanFingerprint,
  };
}
