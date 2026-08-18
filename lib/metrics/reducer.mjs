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
    if (event.event_type === 'plan_registered') context.latestPlanFingerprint = event.plan_fingerprint;
    if (['plan_task_added', 'plan_task_changed', 'plan_task_superseded'].includes(event.event_type)) {
      context.latestPlanFingerprint = event.payload.new_fingerprint;
    }
  }

  return {
    events: context.events,
    state: context.state,
    tasks: context.tasks,
    findings: context.findings,
    interventions: context.interventions,
    latestPlanFingerprint: context.latestPlanFingerprint,
    diagnostics: context.diagnostics,
  };
}
