import { EVENT_TYPES, FINDING_ID_RE, MAX_FINDING_TITLE, RETENTION_TERMINAL_LIMIT, RUN_ID_RE, SCHEMA_VERSION, TASK_ID_RE } from './constants.mjs';

const REASON = /^[A-Z][A-Z0-9_]{0,63}$/;
const FP = /^git-blob:[a-f0-9]{40}$/;
const PATH = /^(?!\/)(?![A-Za-z]:)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/:-]+$/;
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const RUN_FIELDS = ['schema_version', 'run_id', 'workflow', 'feature', 'plan_path', 'initial_plan_fingerprint', 'created_at'];
const EVENT_FIELDS = ['schema_version', 'event_id', 'run_id', 'sequence', 'timestamp', 'workflow', 'event_type', 'feature', 'plan_path', 'plan_fingerprint', 'payload'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const iso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && value.length <= 64;
const diag = (code, message, line, sequence) => ({ code, message, ...(line === undefined ? {} : { line }), ...(sequence === undefined ? {} : { sequence }) });
const unknown = (obj, fields, prefix, out, line, sequence) => {
  for (const key of Object.keys(obj ?? {})) if (!fields.includes(key)) out.push(diag(`${prefix}_UNKNOWN_FIELD`, `Unknown field: ${key}`, line, sequence));
};
const required = (obj, fields, prefix, out, line, sequence) => {
  for (const key of fields) if (!(key in (obj ?? {}))) out.push(diag(`${prefix}_${key.toUpperCase()}_REQUIRED`, `Missing field: ${key}`, line, sequence));
};
const stringField = (obj, key, code, out, line, sequence, max = 128) => {
  if (key in obj && (typeof obj[key] !== 'string' || obj[key].length === 0 || obj[key].length > max)) out.push(diag(code, `Invalid ${key}`, line, sequence));
};
const enumField = (obj, key, values, out, line, sequence) => {
  if (key in obj && !values.includes(obj[key])) out.push(diag(`${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};
const intField = (obj, key, out, line, sequence, min = 0) => {
  if (key in obj && (!Number.isSafeInteger(obj[key]) || obj[key] < min)) out.push(diag(`${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};
const ids = (obj, key, re, out, line, sequence) => {
  if (key in obj && (!Array.isArray(obj[key]) || obj[key].length > 100 || obj[key].some(x => typeof x !== 'string' || !re.test(x)))) out.push(diag(`${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};

export function validateRunMetadata(input) {
  const diagnostics = [];
  if (!isObject(input)) return { value: null, diagnostics: [diag('RUN_NOT_OBJECT', 'Run metadata must be an object')] };
  unknown(input, RUN_FIELDS, 'RUN', diagnostics);
  if (input.schema_version !== SCHEMA_VERSION) diagnostics.push(diag('RUN_SCHEMA_VERSION_UNSUPPORTED', 'Unsupported schema version'));
  if (typeof input.run_id !== 'string' || !RUN_ID_RE.test(input.run_id)) diagnostics.push(diag('RUN_ID_INVALID', 'Invalid run id'));
  if (input.workflow !== 'sdd') diagnostics.push(diag('RUN_WORKFLOW_INVALID', 'Workflow must be sdd'));
  stringField(input, 'feature', 'RUN_FEATURE_INVALID', diagnostics);
  if (typeof input.plan_path !== 'string' || !PATH.test(input.plan_path)) diagnostics.push(diag('RUN_PLAN_PATH_INVALID', 'Invalid plan path'));
  if (typeof input.initial_plan_fingerprint !== 'string' || !FP.test(input.initial_plan_fingerprint)) diagnostics.push(diag('RUN_FINGERPRINT_INVALID', 'Invalid plan fingerprint'));
  if (!iso(input.created_at)) diagnostics.push(diag('RUN_CREATED_AT_INVALID', 'Invalid created_at'));
  return { value: diagnostics.length ? null : input, diagnostics };
}

function validatePayloadSpec(spec, payload, line, sequence, diagnostics) {
  if (!isObject(payload)) { diagnostics.push(diag('PAYLOAD_NOT_OBJECT', 'Payload must be an object', line, sequence)); return; }
  const fields = spec.required.concat(spec.strings ?? [], spec.enums ? Object.keys(spec.enums) : [], spec.ints ?? [], spec.minInts ? Object.keys(spec.minInts) : [], spec.reasons ?? [], spec.fingerprints ?? [], spec.paths ?? [], spec.taskIds ?? [], spec.findingIds ?? [], spec.arrays ?? [], spec.findingArrays ?? [], spec.taskArrays ?? [], spec.bools ?? [], spec.countPair ? ['passed', 'total'] : [], spec.findingResults ? ['finding_results'] : []);
  unknown(payload, [...new Set(fields)], 'PAYLOAD', diagnostics, line, sequence);
  required(payload, spec.required, 'PAYLOAD', diagnostics, line, sequence);
  for (const key of spec.strings ?? []) {
    if (spec.findingTitle && key === 'title') continue;
    stringField(payload, key, `PAYLOAD_${key.toUpperCase()}_INVALID`, diagnostics, line, sequence);
  }
  for (const [key, values] of Object.entries(spec.enums ?? {})) enumField(payload, key, values, diagnostics, line, sequence);
  for (const key of spec.ints ?? []) intField(payload, key, diagnostics, line, sequence, spec.minInts?.[key] ?? 0);
  for (const [key, min] of Object.entries(spec.minInts ?? {})) intField(payload, key, diagnostics, line, sequence, min);
  for (const key of spec.reasons ?? []) if (key in payload && (typeof payload[key] !== 'string' || !REASON.test(payload[key]))) diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
  for (const key of spec.fingerprints ?? []) if (key in payload && (typeof payload[key] !== 'string' || !FP.test(payload[key]))) diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
  for (const key of spec.paths ?? []) if (key in payload && (typeof payload[key] !== 'string' || !PATH.test(payload[key]))) diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
  for (const key of spec.taskIds ?? []) if (key in payload && (typeof payload[key] !== 'string' || !TASK_ID_RE.test(payload[key]))) diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
  for (const key of spec.findingIds ?? []) if (key in payload && (typeof payload[key] !== 'string' || !FINDING_ID_RE.test(payload[key]))) diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
  for (const key of [...(spec.arrays ?? []), ...(spec.taskArrays ?? [])]) { if (key in payload && (!Array.isArray(payload[key]) || payload[key].length > 100 || payload[key].some(x => typeof x !== 'string'))) diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence)); }
  for (const key of spec.findingArrays ?? []) ids(payload, key, FINDING_ID_RE, diagnostics, line, sequence);
  if (spec.taskArrays) for (const key of spec.taskArrays) ids(payload, key, TASK_ID_RE, diagnostics, line, sequence);
  if (spec.bools) for (const key of spec.bools) if (key in payload && typeof payload[key] !== 'boolean') diagnostics.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
  if (spec.countPair && ('passed' in payload || 'total' in payload) && (!(Number.isSafeInteger(payload.passed) && Number.isSafeInteger(payload.total) && payload.passed >= 0 && payload.total >= payload.passed))) diagnostics.push(diag('PAYLOAD_COUNTS_INVALID', 'Invalid test counts', line, sequence));
  if (spec.findingTitle && 'title' in payload && (typeof payload.title !== 'string' || payload.title.length === 0 || payload.title.length > MAX_FINDING_TITLE)) diagnostics.push(diag('FINDING_TITLE_TOO_LONG', 'Finding title too long', line, sequence));
  if (spec.findingResults && ('finding_results' in payload) && (!Array.isArray(payload.finding_results) || payload.finding_results.length > 100 || payload.finding_results.some(x => !isObject(x) || !FINDING_ID_RE.test(x.finding_id) || !['ADDRESSED', 'NOT_ADDRESSED'].includes(x.verdict)))) diagnostics.push(diag('PAYLOAD_FINDING_RESULTS_INVALID', 'Invalid finding results', line, sequence));
}

const contract = (required, extra = {}) => ({ required, ...extra });
function validateRunStarted(payload, ...args) { return validatePayloadSpec(contract(['trigger'], { enums: { trigger: ['NEW_PLAN', 'MANUAL_START'] } }), payload, ...args); }
function validateRunResumed(payload, ...args) { return validatePayloadSpec(contract(['previous_outcome', 'reason_code'], { enums: { previous_outcome: ['BLOCKED', 'INCOMPLETE'] }, reasons: ['reason_code'] }), payload, ...args); }
function validatePlanRegistered(payload, ...args) { return validatePayloadSpec(contract(['task_count'], { ints: ['task_count'] }), payload, ...args); }
function validatePreflightCompleted(payload, ...args) { return validatePayloadSpec(contract(['result', 'diagnostic_codes'], { enums: { result: ['PASS', 'FAIL'] }, arrays: ['diagnostic_codes'] }), payload, ...args); }
function validateTaskRegistered(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'ordinal', 'title', 'origin'], { taskIds: ['task_id'], ints: ['ordinal'], strings: ['title'], enums: { origin: ['INITIAL', 'ADDED'] } }), payload, ...args); }
function validatePlanTaskAdded(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'ordinal', 'title', 'origin', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], { taskIds: ['task_id'], ints: ['ordinal'], strings: ['title'], fingerprints: ['previous_fingerprint', 'new_fingerprint'], reasons: ['reason_code'], enums: { origin: ['INITIAL', 'ADDED'] } }), payload, ...args); }
function validatePlanTaskChanged(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'ordinal', 'title', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], { taskIds: ['task_id'], ints: ['ordinal'], strings: ['title'], fingerprints: ['previous_fingerprint', 'new_fingerprint'], reasons: ['reason_code'] }), payload, ...args); }
function validatePlanTaskSuperseded(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'replacement_task_ids', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], { taskIds: ['task_id'], arrays: ['replacement_task_ids'], fingerprints: ['previous_fingerprint', 'new_fingerprint'], reasons: ['reason_code'] }), payload, ...args); }
function validateTaskDispatched(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'dispatch_id', 'attempt', 'dispatch_kind'], { taskIds: ['task_id'], strings: ['dispatch_id'], ints: ['attempt'], enums: { dispatch_kind: ['IMPLEMENTATION', 'FIX', 'TAKEOVER'] } }), payload, ...args); }
function validateTaskImplementationCompleted(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'status', 'commit_ids'], { taskIds: ['task_id'], arrays: ['commit_ids'], enums: { status: ['DONE', 'DONE_WITH_CONCERNS'] } }), payload, ...args); }
function validateTaskTestResult(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'result', 'evidence_kind'], { taskIds: ['task_id'], enums: { result: ['PASS', 'FAIL', 'UNKNOWN'], evidence_kind: ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'] }, ints: ['passed', 'total'], countPair: true }), payload, ...args); }
function validateTaskImplementationReviewResult(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'review_id', 'reviewer_verdict', 'gate_verdict', 'cannot_verify_count', 'resolved_cannot_verify_count'], { taskIds: ['task_id'], strings: ['review_id'], enums: { reviewer_verdict: ['PASS', 'FAIL', 'CANNOT_VERIFY'], gate_verdict: ['PASS', 'FAIL'] }, ints: ['cannot_verify_count', 'resolved_cannot_verify_count'] }), payload, ...args); }
function validateTaskQualityReviewResult(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'review_id', 'verdict'], { taskIds: ['task_id'], strings: ['review_id'], enums: { verdict: ['APPROVED', 'NEEDS_FIXES'] } }), payload, ...args); }
function validateFindingRaised(payload, ...args) { return validatePayloadSpec(contract(['finding_id', 'scope', 'category', 'severity', 'title'], { findingIds: ['finding_id'], taskIds: ['task_id'], strings: ['title'], enums: { scope: ['TASK', 'FINAL'], category: ['SPEC', 'QUALITY'], severity: ['CRITICAL', 'IMPORTANT', 'MINOR'] }, paths: ['location'], findingTitle: true }), payload, ...args); }
function validateFindingResolved(payload, ...args) { return validatePayloadSpec(contract(['finding_id', 'resolution_code', 'fix_round'], { findingIds: ['finding_id'], reasons: ['resolution_code'], ints: ['fix_round'], minInts: { fix_round: 1 } }), payload, ...args); }
function validateFindingParked(payload, ...args) { return validatePayloadSpec(contract(['finding_id', 'ruling_code', 'task_id'], { findingIds: ['finding_id'], taskIds: ['task_id'], reasons: ['ruling_code'] }), payload, ...args); }
function validateFixRoundStarted(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'round', 'finding_ids', 'dispatch_id'], { taskIds: ['task_id'], ints: ['round'], minInts: { round: 1 }, findingArrays: ['finding_ids'], strings: ['dispatch_id'] }), payload, ...args); }
function validateFixRoundCompleted(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'round', 'review_id', 'finding_results'], { taskIds: ['task_id'], ints: ['round'], minInts: { round: 1 }, strings: ['review_id'], findingResults: true }), payload, ...args); }
function validateTaskAccepted(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'acceptance_basis'], { taskIds: ['task_id'], reasons: ['acceptance_basis'] }), payload, ...args); }
function validateTaskBlocked(payload, ...args) { return validatePayloadSpec(contract(['task_id', 'reason_code', 'required_human_input'], { taskIds: ['task_id'], reasons: ['reason_code'], bools: ['required_human_input'] }), payload, ...args); }
function validateHumanInterventionRequired(payload, ...args) { return validatePayloadSpec(contract(['intervention_id', 'affected_task_ids', 'reason_code'], { strings: ['intervention_id'], taskArrays: ['affected_task_ids'], reasons: ['reason_code'] }), payload, ...args); }
function validateHumanInterventionCompleted(payload, ...args) { return validatePayloadSpec(contract(['intervention_id', 'resolution_code'], { strings: ['intervention_id'], reasons: ['resolution_code'] }), payload, ...args); }
function validateFinalReviewResult(payload, ...args) { return validatePayloadSpec(contract(['result', 'review_id', 'finding_ids'], { enums: { result: ['PASS', 'FAIL'] }, strings: ['review_id'], findingArrays: ['finding_ids'] }), payload, ...args); }
function validateFinalTestResult(payload, ...args) { return validatePayloadSpec(contract(['result', 'evidence_kind'], { enums: { result: ['PASS', 'FAIL', 'UNKNOWN'], evidence_kind: ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'] }, ints: ['passed', 'total'], countPair: true }), payload, ...args); }
function validateRunPassed(payload, ...args) { return validatePayloadSpec(contract(['basis'], { reasons: ['basis'] }), payload, ...args); }
function validateRunBlocked(payload, ...args) { return validatePayloadSpec(contract(['reason_code'], { reasons: ['reason_code'], taskArrays: ['task_ids'] }), payload, ...args); }
function validateRunIncomplete(payload, ...args) { return validatePayloadSpec(contract(['reason_code'], { reasons: ['reason_code'] }), payload, ...args); }
const PAYLOAD_VALIDATORS = {
  run_started: validateRunStarted, run_resumed: validateRunResumed, plan_registered: validatePlanRegistered,
  preflight_completed: validatePreflightCompleted, task_registered: validateTaskRegistered,
  plan_task_added: validatePlanTaskAdded, plan_task_changed: validatePlanTaskChanged,
  plan_task_superseded: validatePlanTaskSuperseded, task_dispatched: validateTaskDispatched,
  task_implementation_completed: validateTaskImplementationCompleted, task_test_result: validateTaskTestResult,
  task_implementation_review_result: validateTaskImplementationReviewResult,
  task_quality_review_result: validateTaskQualityReviewResult, finding_raised: validateFindingRaised,
  finding_resolved: validateFindingResolved, finding_parked: validateFindingParked,
  fix_round_started: validateFixRoundStarted, fix_round_completed: validateFixRoundCompleted,
  task_accepted: validateTaskAccepted, task_blocked: validateTaskBlocked,
  human_intervention_required: validateHumanInterventionRequired,
  human_intervention_completed: validateHumanInterventionCompleted,
  final_review_result: validateFinalReviewResult, final_test_result: validateFinalTestResult,
  run_passed: validateRunPassed, run_blocked: validateRunBlocked, run_incomplete: validateRunIncomplete,
};

export function validateEvent(input, lineNumber = undefined) {
  const diagnostics = [];
  if (!isObject(input)) return { value: null, diagnostics: [diag('EVENT_NOT_OBJECT', 'Event must be an object', lineNumber)] };
  unknown(input, EVENT_FIELDS, 'EVENT', diagnostics, lineNumber, input.sequence);
  if (input.schema_version !== SCHEMA_VERSION) diagnostics.push(diag('EVENT_SCHEMA_VERSION_UNSUPPORTED', 'Unsupported schema version', lineNumber, input.sequence));
  if (typeof input.event_type !== 'string' || !EVENT_TYPES.includes(input.event_type)) diagnostics.push(diag('EVENT_TYPE_UNSUPPORTED', 'Unsupported event type', lineNumber, input.sequence));
  if (typeof input.run_id !== 'string' || !RUN_ID_RE.test(input.run_id)) diagnostics.push(diag('EVENT_RUN_ID_INVALID', 'Invalid run id', lineNumber, input.sequence));
  if (!Number.isSafeInteger(input.sequence) || input.sequence < 1) diagnostics.push(diag('EVENT_SEQUENCE_INVALID', 'Invalid sequence', lineNumber, input.sequence));
  if (typeof input.event_id !== 'string' || input.event_id !== `${input.run_id}:${input.sequence}` || !SAFE.test(input.event_id.split(':')[0])) diagnostics.push(diag('EVENT_ID_INVALID', 'Event id must bind run id and sequence', lineNumber, input.sequence));
  if (!iso(input.timestamp)) diagnostics.push(diag('EVENT_TIMESTAMP_INVALID', 'Invalid timestamp', lineNumber, input.sequence));
  if (input.workflow !== 'sdd') diagnostics.push(diag('EVENT_WORKFLOW_INVALID', 'Workflow must be sdd', lineNumber, input.sequence));
  stringField(input, 'feature', 'EVENT_FEATURE_INVALID', diagnostics, lineNumber, input.sequence);
  if (typeof input.plan_path !== 'string' || !PATH.test(input.plan_path)) diagnostics.push(diag('EVENT_PLAN_PATH_INVALID', 'Invalid plan path', lineNumber, input.sequence));
  if (typeof input.plan_fingerprint !== 'string' || !FP.test(input.plan_fingerprint)) diagnostics.push(diag('EVENT_FINGERPRINT_INVALID', 'Invalid plan fingerprint', lineNumber, input.sequence));
  if (Object.prototype.hasOwnProperty.call(PAYLOAD_VALIDATORS, input.event_type)) PAYLOAD_VALIDATORS[input.event_type](input.payload, lineNumber, input.sequence, diagnostics);
  return { value: diagnostics.length ? null : input, diagnostics };
}
