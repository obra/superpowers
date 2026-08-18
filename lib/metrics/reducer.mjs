import { validateEvent, validateRunMetadata } from './schema-v1.mjs';

const diagnostic = (code, message, line, sequence) => ({
  code,
  message,
  ...(line === undefined ? {} : { line }),
  ...(sequence === undefined ? {} : { sequence }),
});

const canonicalJson = value => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

const newState = () => ({
  lifecycle_state: 'ACTIVE',
  explicit_outcome: null,
  final_review: 'NOT_RUN',
  final_test: { result: 'UNKNOWN', evidence_kind: null, passed: null, total: null },
});

function transitionDiagnostic(context, event, code, message) {
  context.diagnostics.push(diagnostic(code, message, event.lineNumber, event.sequence));
}

function applyRunStarted(context, event) {
  if (context.started) return transitionDiagnostic(context, event, 'RUN_STARTED_DUPLICATE', 'run_started may occur only once');
  context.started = true;
}

function applyRunResumed(context, event) {
  if (context.phase === 'PASSED') return transitionDiagnostic(context, event, 'RUN_PASS_IMMUTABLE', 'A passed run cannot resume');
  if (context.phase !== 'BLOCKED' && context.phase !== 'INCOMPLETE' && context.phase !== 'PREFLIGHT_FAILED') return transitionDiagnostic(context, event, 'RUN_RESUME_INVALID', 'run_resumed requires a blocked or incomplete run');
  context.phase = 'ACTIVE';
  context.state.lifecycle_state = 'ACTIVE';
  context.state.explicit_outcome = null;
}

function applyTaskDispatched(context, event) {
  if (context.preflight !== 'PASS') transitionDiagnostic(context, event, 'PREFLIGHT_PASS_REQUIRED', 'task_dispatched requires a passing preflight');
}

const taskState = payload => ({
  task_id: payload.task_id,
  ordinal: payload.ordinal,
  title: payload.title,
  effective: true,
  state: 'REGISTERED',
  reached_review: false,
  initial_spec_gate: null,
  initial_quality: null,
  fix_rounds: 0,
  human_intervention_required: false,
  dispatch_id: null,
  dispatched: false,
  implementation_completed: false,
  initial_spec_review_id: null,
  initial_quality_review_id: null,
  cannot_verify_open: 0,
  active_fix_round: null,
  state_before_block: null,
});

function knownTask(context, event, taskId) {
  const task = context.tasks.get(taskId);
  if (!task) transitionDiagnostic(context, event, 'TASK_UNKNOWN', `Unknown task: ${taskId}`);
  return task;
}

function reviewPairComplete(task) {
  return task.initial_spec_review_id !== null
    && task.initial_spec_review_id === task.initial_quality_review_id;
}

function applyPlanAdjustment(context, event) {
  const payload = event.payload;
  if (event.event_type === 'plan_task_added') {
    if (context.tasks.has(payload.task_id)) return transitionDiagnostic(context, event, 'PLAN_TASK_DUPLICATE', `Task already exists: ${payload.task_id}`);
    context.tasks.set(payload.task_id, taskState(payload));
    return;
  }

  const task = knownTask(context, event, payload.task_id);
  if (!task) return;
  if (event.event_type === 'plan_task_changed') {
    if (task.dispatched) return transitionDiagnostic(context, event, 'PLAN_TASK_CHANGE_AFTER_DISPATCH', 'plan_task_changed is allowed only before dispatch');
    task.ordinal = payload.ordinal;
    task.title = payload.title;
    return;
  }
  if (event.event_type === 'plan_task_superseded') {
    task.effective = false;
    task.state = 'SUPERSEDED';
  }
}

function applyTaskEvent(context, event) {
  const payload = event.payload;
  if (event.event_type === 'task_registered') {
    if (context.tasks.has(payload.task_id)) return transitionDiagnostic(context, event, 'TASK_REGISTERED_DUPLICATE', `Task already exists: ${payload.task_id}`);
    context.tasks.set(payload.task_id, taskState(payload));
    return;
  }
  if (event.event_type === 'run_resumed') {
    for (const task of context.tasks.values()) {
      if (task.state === 'BLOCKED') {
        task.state = task.state_before_block ?? (task.dispatched ? 'DISPATCHED' : 'REGISTERED');
        task.state_before_block = null;
      }
    }
    return;
  }
  if (![
    'task_dispatched', 'task_implementation_completed', 'task_test_result',
    'task_implementation_review_result', 'task_quality_review_result',
    'fix_round_started', 'fix_round_completed', 'task_accepted', 'task_blocked',
  ].includes(event.event_type)) return;

  const task = knownTask(context, event, payload.task_id);
  if (!task) return;
  if (event.event_type === 'task_dispatched') {
    if (context.preflight !== 'PASS') return;
    if (task.dispatched) return transitionDiagnostic(context, event, 'TASK_DISPATCH_INVALID', 'task_dispatched may occur only once');
    task.dispatched = true;
    task.dispatch_id = payload.dispatch_id;
    task.state = 'DISPATCHED';
    return;
  }
  if (event.event_type === 'task_implementation_completed') {
    if (!task.dispatched) return transitionDiagnostic(context, event, 'TASK_IMPLEMENTATION_DISPATCH_REQUIRED', 'task_implementation_completed requires task_dispatched');
    task.implementation_completed = true;
    task.state = 'IMPLEMENTED';
    return;
  }
  if (event.event_type === 'task_test_result') return;
  if (event.event_type === 'task_implementation_review_result') {
    if (!task.implementation_completed) return transitionDiagnostic(context, event, 'TASK_REVIEW_IMPLEMENTATION_REQUIRED', 'Initial reviews require task_implementation_completed');
    task.reached_review = true;
    task.initial_spec_review_id = payload.review_id;
    task.initial_spec_gate = payload.gate_verdict;
    task.cannot_verify_open = Math.max(0, payload.cannot_verify_count - payload.resolved_cannot_verify_count);
    task.state = 'UNDER_REVIEW';
    return;
  }
  if (event.event_type === 'task_quality_review_result') {
    if (!task.implementation_completed) return transitionDiagnostic(context, event, 'TASK_REVIEW_IMPLEMENTATION_REQUIRED', 'Initial reviews require task_implementation_completed');
    task.reached_review = true;
    task.initial_quality_review_id = payload.review_id;
    task.initial_quality = payload.verdict;
    task.state = 'UNDER_REVIEW';
    return;
  }
  if (event.event_type === 'fix_round_started') {
    if (payload.round > 5) return transitionDiagnostic(context, event, 'FIX_ROUND_LIMIT_EXCEEDED', 'A task may have at most five fix rounds');
    if (task.active_fix_round !== null || payload.round !== task.fix_rounds + 1) return transitionDiagnostic(context, event, 'FIX_ROUND_START_INVALID', 'fix_round_started must start the next inactive round');
    task.active_fix_round = payload.round;
    task.state = 'FIXING';
    return;
  }
  if (event.event_type === 'fix_round_completed') {
    if (payload.round > 5) return;
    if (task.active_fix_round !== payload.round) return transitionDiagnostic(context, event, 'FIX_ROUND_COMPLETION_WITHOUT_START', 'fix_round_completed requires a matching start');
    const invalidFinding = payload.finding_results.some(result => {
      const finding = context.findings.get(result.finding_id);
      return !finding || finding.task_id !== task.task_id;
    });
    if (invalidFinding) return transitionDiagnostic(context, event, 'FIX_ROUND_FINDING_INVALID', 'fix_round_completed findings must exist and belong to its task');
    task.active_fix_round = null;
    task.fix_rounds += 1;
    task.state = 'UNDER_REVIEW';
    for (const result of payload.finding_results) {
      const finding = context.findings.get(result.finding_id);
      finding.disposition = result.verdict === 'ADDRESSED' ? 'ADDRESSED' : 'OPEN';
    }
    return;
  }
  if (event.event_type === 'task_blocked') {
    if (task.state !== 'BLOCKED') task.state_before_block = task.state;
    task.state = 'BLOCKED';
    return;
  }
  if (event.event_type === 'task_accepted') {
    if (!reviewPairComplete(task)) return transitionDiagnostic(context, event, 'TASK_REVIEW_PAIR_INCOMPLETE', 'task_accepted requires paired implementation and quality reviews');
    if (task.cannot_verify_open > 0) return transitionDiagnostic(context, event, 'TASK_REVIEW_CANNOT_VERIFY_OPEN', 'task_accepted requires resolved cannot-verify items');
    if (task.initial_spec_gate !== 'PASS' || task.initial_quality !== 'APPROVED') return transitionDiagnostic(context, event, 'TASK_ACCEPTANCE_REVIEW_NOT_APPROVED', 'task_accepted requires passing implementation and approved quality reviews');
    const openBlockingFinding = [...context.findings.values()].some(finding => finding.task_id === task.task_id
      && ['CRITICAL', 'IMPORTANT'].includes(finding.severity) && finding.disposition === 'OPEN');
    if (openBlockingFinding) return transitionDiagnostic(context, event, 'TASK_ACCEPTANCE_OPEN_BLOCKING_FINDING', 'task_accepted requires no open Critical or Important finding');
    task.state = 'ACCEPTED';
  }
}

function applyFindingEvent(context, event) {
  if (!['finding_raised', 'finding_resolved', 'finding_parked'].includes(event.event_type)) return;
  const payload = event.payload;
  const existing = context.findings.get(payload.finding_id);
  if (event.event_type === 'finding_raised') {
    if (existing) {
      const details = ['scope', 'task_id', 'category', 'severity', 'title', 'location'];
      if (details.some(key => existing[key] !== (payload[key] ?? null))) transitionDiagnostic(context, event, 'FINDING_DETAIL_CONFLICT', `Finding details conflict: ${payload.finding_id}`);
      return;
    }
    if (payload.scope === 'TASK' && !knownTask(context, event, payload.task_id)) return;
    context.findings.set(payload.finding_id, {
      finding_id: payload.finding_id,
      scope: payload.scope,
      task_id: payload.task_id ?? null,
      category: payload.category,
      severity: payload.severity,
      title: payload.title,
      location: payload.location ?? null,
      disposition: 'OPEN',
    });
    return;
  }
  if (!existing) return transitionDiagnostic(context, event, event.event_type === 'finding_resolved' ? 'FINDING_RESOLVE_BEFORE_RAISE' : 'FINDING_PARK_BEFORE_RAISE', `Finding must be raised first: ${payload.finding_id}`);
  if (event.event_type === 'finding_resolved') {
    if (existing.disposition === 'PARKED') return transitionDiagnostic(context, event, 'FINDING_RESOLVE_PARKED_CONFLICT', 'A parked finding cannot be resolved');
    existing.disposition = 'RESOLVED';
    return;
  }
  if (existing.disposition === 'RESOLVED') return transitionDiagnostic(context, event, 'FINDING_PARKED_RESOLVED_CONFLICT', 'A resolved finding cannot be parked');
  if (payload.task_id !== existing.task_id) return transitionDiagnostic(context, event, 'FINDING_TASK_CONFLICT', 'Finding task does not match raised finding');
  existing.disposition = 'PARKED';
}

function applyInterventionEvent(context, event) {
  if (!['human_intervention_required', 'human_intervention_completed'].includes(event.event_type)) return;
  const payload = event.payload;
  if (event.event_type === 'human_intervention_required') {
    if (context.interventions.has(payload.intervention_id)) return transitionDiagnostic(context, event, 'INTERVENTION_DUPLICATE', `Intervention already exists: ${payload.intervention_id}`);
    if (payload.affected_task_ids.some(taskId => !context.tasks.has(taskId))) return transitionDiagnostic(context, event, 'INTERVENTION_TASK_UNKNOWN', 'human_intervention_required names an unknown task');
    for (const taskId of payload.affected_task_ids) context.tasks.get(taskId).human_intervention_required = true;
    context.interventions.set(payload.intervention_id, { ...payload, state: 'REQUIRED' });
    return;
  }
  const intervention = context.interventions.get(payload.intervention_id);
  if (!intervention) return transitionDiagnostic(context, event, 'INTERVENTION_COMPLETION_UNKNOWN', `Unknown intervention: ${payload.intervention_id}`);
  intervention.state = 'COMPLETED';
  intervention.resolution_code = payload.resolution_code;
}

function finalizeTaskReviews(context) {
  for (const task of context.tasks.values()) {
    if (!task.effective || !task.reached_review) continue;
    if (!reviewPairComplete(task)) transitionDiagnostic(context, { lineNumber: undefined, sequence: undefined }, 'TASK_REVIEW_PAIR_INCOMPLETE', 'Implementation and quality reviews must be paired');
    else if (task.cannot_verify_open > 0) transitionDiagnostic(context, { lineNumber: undefined, sequence: undefined }, 'TASK_REVIEW_CANNOT_VERIFY_OPEN', 'Cannot-verify items must be resolved');
  }
}

function applyPreflightCompleted(context, event) {
  context.preflight = event.payload.result;
  if (event.payload.result === 'FAIL') {
    context.phase = 'PREFLIGHT_FAILED';
    context.state.lifecycle_state = 'RESUMABLE';
  }
}

function applyFinalReview(context, event) {
  context.state.final_review = event.payload.result;
}

function applyFinalTest(context, event) {
  context.state.final_test = {
    result: event.payload.result,
    evidence_kind: event.payload.evidence_kind,
    passed: event.payload.passed ?? null,
    total: event.payload.total ?? null,
  };
}

function applyRunPassed(context, event) {
  if (context.preflight !== 'PASS' || context.state.final_review !== 'PASS' || context.state.final_test.result !== 'PASS') {
    return transitionDiagnostic(context, event, 'RUN_PASS_PREREQUISITES_MISSING', 'run_passed requires passing final review and final test');
  }
  context.phase = 'PASSED';
  context.state.lifecycle_state = 'TERMINAL';
  context.state.explicit_outcome = 'PASS';
}

function applyRunBlocked(context) {
  context.phase = 'BLOCKED';
  context.state.lifecycle_state = 'RESUMABLE';
  context.state.explicit_outcome = 'BLOCKED';
}

function applyRunIncomplete(context) {
  context.phase = 'INCOMPLETE';
  context.state.lifecycle_state = 'RESUMABLE';
  context.state.explicit_outcome = 'INCOMPLETE';
}

const EVENT_REDUCERS = {
  run_started: applyRunStarted,
  run_resumed: applyRunResumed,
  preflight_completed: applyPreflightCompleted,
  task_dispatched: applyTaskDispatched,
  final_review_result: applyFinalReview,
  final_test_result: applyFinalTest,
  run_passed: applyRunPassed,
  run_blocked: applyRunBlocked,
  run_incomplete: applyRunIncomplete,
};

function canApplyEvent(context, event) {
  if (context.phase === 'PASSED') {
    transitionDiagnostic(context, event, 'RUN_PASS_IMMUTABLE', 'A passed run cannot receive more events');
    return false;
  }
  if ((context.phase === 'BLOCKED' || context.phase === 'INCOMPLETE') && event.event_type !== 'run_resumed') {
    transitionDiagnostic(context, event, 'RUN_RESUME_REQUIRED', 'A blocked or incomplete run requires run_resumed');
    return false;
  }
  if (context.phase === 'PREFLIGHT_FAILED' && !['run_resumed', 'run_blocked', 'run_incomplete'].includes(event.event_type)) {
    transitionDiagnostic(context, event, 'RUN_RESUME_REQUIRED', 'A failed preflight requires run_resumed');
    return false;
  }
  if (!context.started && event.event_type !== 'run_started') {
    transitionDiagnostic(context, event, 'RUN_STARTED_REQUIRED', 'run_started must be first event');
    return false;
  }
  return true;
}

export function reduceRun(metadata, eventLines) {
  const metadataValidation = validateRunMetadata(metadata);
  const context = {
    diagnostics: [...metadataValidation.diagnostics],
    run: metadataValidation.value ? Object.freeze({ ...metadataValidation.value }) : null,
    events: [],
    state: newState(),
    tasks: new Map(),
    findings: new Map(),
    interventions: new Map(),
    latestPlanFingerprint: metadata?.initial_plan_fingerprint ?? null,
    nextSequence: 1,
    eventJsonById: new Map(),
    eventIdBySequence: new Map(),
    started: false,
    phase: 'ACTIVE',
    preflight: 'NOT_RUN',
  };

  if (!metadataValidation.value) return {
    run: context.run,
    events: context.events,
    state: context.state,
    tasks: context.tasks,
    findings: context.findings,
    interventions: context.interventions,
    latestPlanFingerprint: context.latestPlanFingerprint,
    diagnostics: context.diagnostics,
  };

  for (const line of eventLines ?? []) {
    let parsed;
    try {
      parsed = JSON.parse(line.text);
    } catch {
      context.diagnostics.push(diagnostic('EVENT_JSON_INVALID', 'Event line is not valid JSON', line.lineNumber));
      continue;
    }

    const eventId = parsed?.event_id;
    const sequence = parsed?.sequence;
    const serialized = canonicalJson(parsed);
    if (typeof eventId === 'string' && context.eventJsonById.has(eventId)) {
      if (context.eventJsonById.get(eventId) !== serialized) context.diagnostics.push(diagnostic('EVENT_ID_CONFLICT', 'Event id has conflicting content', line.lineNumber, sequence));
      continue;
    }
    if (Number.isSafeInteger(sequence) && context.eventIdBySequence.has(sequence)) {
      context.diagnostics.push(diagnostic('SEQUENCE_CONFLICT', 'Sequence belongs to another event', line.lineNumber, sequence));
      continue;
    }

    const validation = validateEvent(parsed, line.lineNumber);
    if (validation.diagnostics.length) {
      context.diagnostics.push(...validation.diagnostics);
      continue;
    }
    if (parsed.run_id !== metadata?.run_id) {
      context.diagnostics.push(diagnostic('EVENT_RUN_ID_MISMATCH', 'Event run_id differs from metadata', line.lineNumber, parsed.sequence));
      continue;
    }
    if (parsed.sequence !== context.nextSequence) {
      const code = context.nextSequence === 1 ? 'SEQUENCE_INITIAL_INVALID' : 'SEQUENCE_GAP';
      context.diagnostics.push(diagnostic(code, `Expected sequence ${context.nextSequence}`, line.lineNumber, parsed.sequence));
      continue;
    }

    context.eventJsonById.set(parsed.event_id, serialized);
    context.eventIdBySequence.set(parsed.sequence, parsed.event_id);
    context.nextSequence += 1;
    const event = { ...parsed, lineNumber: line.lineNumber };
    context.events.push(event);
    if (!canApplyEvent(context, event)) continue;
    EVENT_REDUCERS[event.event_type]?.(context, event);
    if (event.event_type === 'task_registered' || event.event_type === 'run_resumed' || event.event_type.startsWith('task_') || event.event_type.startsWith('fix_round_')) applyTaskEvent(context, event);
    if (event.event_type.startsWith('finding_')) applyFindingEvent(context, event);
    if (event.event_type.startsWith('human_intervention_')) applyInterventionEvent(context, event);
    if (['plan_task_added', 'plan_task_changed', 'plan_task_superseded'].includes(event.event_type)) applyPlanAdjustment(context, event);
    if (event.event_type === 'plan_registered') context.latestPlanFingerprint = event.plan_fingerprint;
    if (['plan_task_added', 'plan_task_changed', 'plan_task_superseded'].includes(event.event_type)) {
      context.latestPlanFingerprint = event.payload.new_fingerprint;
    }
  }

  finalizeTaskReviews(context);

  return {
    run: context.run,
    events: context.events,
    state: context.state,
    tasks: context.tasks,
    findings: context.findings,
    interventions: context.interventions,
    latestPlanFingerprint: context.latestPlanFingerprint,
    diagnostics: context.diagnostics,
  };
}
