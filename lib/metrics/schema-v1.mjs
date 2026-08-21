import { EVENT_TYPES, FINDING_ID_RE, GIT_BLOB_FINGERPRINT_RE, MAX_FINDING_TITLE, RETENTION_TERMINAL_LIMIT, RUN_ID_RE, SCHEMA_VERSION, TASK_ID_RE } from './constants.mjs';

const REASON = /^[A-Z][A-Z0-9_]{0,63}$/;
const FP = GIT_BLOB_FINGERPRINT_RE;
const PATH = /^(?!\/)(?![A-Za-z]:)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/:-]+$/;
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const RUN_FIELDS = ['schema_version', 'run_id', 'workflow', 'feature', 'plan_path', 'initial_plan_fingerprint', 'created_at'];
const EVENT_FIELDS = ['schema_version', 'event_id', 'run_id', 'sequence', 'timestamp', 'workflow', 'event_type', 'feature', 'plan_path', 'plan_fingerprint', 'payload'];
const contract = (allowed, required, enums = {}) => Object.freeze({
  allowed: Object.freeze(allowed), required: Object.freeze(required), optional: Object.freeze(allowed.filter(key => !required.includes(key))),
  enums: Object.freeze(Object.fromEntries(Object.entries(enums).map(([key, values]) => [key, Object.freeze(values)]))),
});
export const PAYLOAD_CONTRACTS = Object.freeze({
  run_started: contract(['trigger'], ['trigger'], { trigger: ['NEW_PLAN', 'MANUAL_START'] }),
  run_resumed: contract(['previous_outcome', 'reason_code'], ['previous_outcome', 'reason_code'], { previous_outcome: ['BLOCKED', 'INCOMPLETE'] }),
  plan_registered: contract(['task_count'], ['task_count']),
  preflight_completed: contract(['result', 'diagnostic_codes'], ['result', 'diagnostic_codes'], { result: ['PASS', 'FAIL'] }),
  task_registered: contract(['task_id', 'ordinal', 'title', 'origin'], ['task_id', 'ordinal', 'title', 'origin'], { origin: ['INITIAL', 'ADDED'] }),
  plan_task_added: contract(['task_id', 'ordinal', 'title', 'origin', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], ['task_id', 'ordinal', 'title', 'origin', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], { origin: ['INITIAL', 'ADDED'] }),
  plan_task_changed: contract(['task_id', 'ordinal', 'title', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], ['task_id', 'ordinal', 'title', 'previous_fingerprint', 'new_fingerprint', 'reason_code']),
  plan_task_superseded: contract(['task_id', 'replacement_task_ids', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], ['task_id', 'replacement_task_ids', 'previous_fingerprint', 'new_fingerprint', 'reason_code']),
  task_dispatched: contract(['task_id', 'dispatch_id', 'attempt', 'dispatch_kind'], ['task_id', 'dispatch_id', 'attempt', 'dispatch_kind'], { dispatch_kind: ['IMPLEMENTATION', 'FIX', 'TAKEOVER'] }),
  task_implementation_completed: contract(['task_id', 'status', 'commit_ids'], ['task_id', 'status', 'commit_ids'], { status: ['DONE', 'DONE_WITH_CONCERNS'] }),
  task_test_result: contract(['task_id', 'result', 'evidence_kind', 'passed', 'total'], ['task_id', 'result', 'evidence_kind'], { result: ['PASS', 'FAIL', 'UNKNOWN'], evidence_kind: ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'] }),
  task_implementation_review_result: contract(['task_id', 'review_id', 'reviewer_verdict', 'gate_verdict', 'cannot_verify_count', 'resolved_cannot_verify_count'], ['task_id', 'review_id', 'reviewer_verdict', 'gate_verdict', 'cannot_verify_count', 'resolved_cannot_verify_count'], { reviewer_verdict: ['PASS', 'FAIL', 'CANNOT_VERIFY'], gate_verdict: ['PASS', 'FAIL'] }),
  task_quality_review_result: contract(['task_id', 'review_id', 'verdict'], ['task_id', 'review_id', 'verdict'], { verdict: ['APPROVED', 'NEEDS_FIXES'] }),
  finding_raised: contract(['finding_id', 'scope', 'category', 'severity', 'title', 'task_id', 'location'], ['finding_id', 'scope', 'category', 'severity', 'title'], { scope: ['TASK', 'FINAL'], category: ['SPEC', 'QUALITY'], severity: ['CRITICAL', 'IMPORTANT', 'MINOR'] }),
  finding_resolved: contract(['finding_id', 'resolution_code', 'fix_round'], ['finding_id', 'resolution_code', 'fix_round']),
  finding_parked: contract(['finding_id', 'ruling_code', 'task_id'], ['finding_id', 'ruling_code', 'task_id']),
  fix_round_started: contract(['task_id', 'round', 'finding_ids', 'dispatch_id'], ['task_id', 'round', 'finding_ids', 'dispatch_id']),
  fix_round_completed: contract(['task_id', 'round', 'review_id', 'finding_results'], ['task_id', 'round', 'review_id', 'finding_results'], { 'finding_results[].verdict': ['ADDRESSED', 'NOT_ADDRESSED'] }),
  task_accepted: contract(['task_id', 'acceptance_basis'], ['task_id', 'acceptance_basis']),
  task_blocked: contract(['task_id', 'reason_code', 'required_human_input'], ['task_id', 'reason_code', 'required_human_input']),
  human_intervention_required: contract(['intervention_id', 'affected_task_ids', 'reason_code'], ['intervention_id', 'affected_task_ids', 'reason_code']),
  human_intervention_completed: contract(['intervention_id', 'resolution_code'], ['intervention_id', 'resolution_code']),
  final_review_result: contract(['result', 'review_id', 'finding_ids'], ['result', 'review_id', 'finding_ids'], { result: ['PASS', 'FAIL'] }),
  final_test_result: contract(['result', 'evidence_kind', 'passed', 'total'], ['result', 'evidence_kind'], { result: ['PASS', 'FAIL', 'UNKNOWN'], evidence_kind: ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'] }),
  run_passed: contract(['basis'], ['basis']),
  run_blocked: contract(['reason_code', 'task_ids'], ['reason_code']),
  run_incomplete: contract(['reason_code'], ['reason_code']),
});

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
let activePayloadContract = null;
const iso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && value.length <= 64;
const diag = (code, message, line, sequence) => ({ code, message, ...(line === undefined ? {} : { line }), ...(sequence === undefined ? {} : { sequence }) });
const exactKeys = (obj, allowed, required, out, line, sequence, prefix = 'PAYLOAD') => {
  if (prefix === 'PAYLOAD' && activePayloadContract) return;
  for (const key of Object.keys(obj ?? {})) if (!allowed.includes(key)) out.push(diag(`${prefix}_UNKNOWN_FIELD`, `Unknown field: ${key}`, line, sequence));
  for (const key of required) if (!(key in (obj ?? {}))) out.push(diag(`${prefix}_${key.toUpperCase()}_REQUIRED`, `Missing field: ${key}`, line, sequence));
};
const stringField = (obj, key, code, out, line, sequence, max = 128) => {
  if (key in obj && (typeof obj[key] !== 'string' || obj[key].length === 0 || obj[key].length > max)) out.push(diag(code, `Invalid ${key}`, line, sequence));
};
const enumField = (obj, key, values, out, line, sequence) => {
  if (activePayloadContract) return;
  if (key in obj && !values.includes(obj[key])) out.push(diag(`${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};
const integerField = (obj, key, out, line, sequence, min = 0) => {
  if (key in obj && (!Number.isSafeInteger(obj[key]) || obj[key] < min)) out.push(diag(`${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};
const arrayField = (obj, key, isItem, out, line, sequence) => {
  if (key in obj && (!Array.isArray(obj[key]) || obj[key].length > 100 || obj[key].some(item => !isItem(item)))) out.push(diag(`${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};

export function validateRunMetadata(input) {
  const diagnostics = [];
  if (!isObject(input)) return { value: null, diagnostics: [diag('RUN_NOT_OBJECT', 'Run metadata must be an object')] };
  exactKeys(input, RUN_FIELDS, RUN_FIELDS, diagnostics, undefined, undefined, 'RUN');
  if (input.schema_version !== SCHEMA_VERSION) diagnostics.push(diag('RUN_SCHEMA_VERSION_UNSUPPORTED', 'Unsupported schema version'));
  if (typeof input.run_id !== 'string' || !RUN_ID_RE.test(input.run_id)) diagnostics.push(diag('RUN_ID_INVALID', 'Invalid run id'));
  if (input.workflow !== 'sdd') diagnostics.push(diag('RUN_WORKFLOW_INVALID', 'Workflow must be sdd'));
  stringField(input, 'feature', 'RUN_FEATURE_INVALID', diagnostics);
  if (typeof input.plan_path !== 'string' || !PATH.test(input.plan_path)) diagnostics.push(diag('RUN_PLAN_PATH_INVALID', 'Invalid plan path'));
  if (typeof input.initial_plan_fingerprint !== 'string' || !FP.test(input.initial_plan_fingerprint)) diagnostics.push(diag('RUN_FINGERPRINT_INVALID', 'Invalid plan fingerprint'));
  if (!iso(input.created_at)) diagnostics.push(diag('RUN_CREATED_AT_INVALID', 'Invalid created_at'));
  return { value: diagnostics.length ? null : input, diagnostics };
}

const payloadObject = (payload, line, sequence, diagnostics) => {
  if (isObject(payload)) return true;
  diagnostics.push(diag('PAYLOAD_NOT_OBJECT', 'Payload must be an object', line, sequence));
  return false;
};
const patternField = (obj, key, re, out, line, sequence) => {
  if (key in obj && (typeof obj[key] !== 'string' || !re.test(obj[key]))) out.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};
const booleanField = (obj, key, out, line, sequence) => {
  if (key in obj && typeof obj[key] !== 'boolean') out.push(diag(`PAYLOAD_${key.toUpperCase()}_INVALID`, `Invalid ${key}`, line, sequence));
};
const countPair = (obj, out, line, sequence) => {
  if (('passed' in obj || 'total' in obj) && (!(Number.isSafeInteger(obj.passed) && Number.isSafeInteger(obj.total) && obj.passed >= 0 && obj.total >= obj.passed))) out.push(diag('PAYLOAD_COUNTS_INVALID', 'Invalid test counts', line, sequence));
};
const evidenceCounts = (obj, out, line, sequence) => {
  const hasCounts = 'passed' in obj || 'total' in obj;
  if (obj.evidence_kind === 'COUNTS' && (!('passed' in obj) || !('total' in obj))) out.push(diag('PAYLOAD_COUNTS_REQUIRED', 'Counts evidence requires passed and total', line, sequence));
  if (['EXIT_STATUS', 'UNINTERPRETABLE'].includes(obj.evidence_kind) && hasCounts) out.push(diag('PAYLOAD_COUNTS_FORBIDDEN', 'Non-count evidence must omit passed and total', line, sequence));
  countPair(obj, out, line, sequence);
};
const findingResults = (obj, out, line, sequence) => {
  const verdicts = PAYLOAD_CONTRACTS.fix_round_completed.enums['finding_results[].verdict'];
  if ('finding_results' in obj && (!Array.isArray(obj.finding_results) || obj.finding_results.length > 100 || obj.finding_results.some(item => !isObject(item) || !FINDING_ID_RE.test(item.finding_id) || !verdicts.includes(item.verdict)))) out.push(diag('PAYLOAD_FINDING_RESULTS_INVALID', 'Invalid finding results', line, sequence));
};
const validatePayloadContract = (eventType, payload, line, sequence, diagnostics) => {
  if (!payloadObject(payload, line, sequence, diagnostics)) return false;
  const definition = PAYLOAD_CONTRACTS[eventType];
  exactKeys(payload, definition.allowed, definition.required, diagnostics, line, sequence);
  for (const [key, values] of Object.entries(definition.enums)) {
    if (!key.includes('[]')) enumField(payload, key, values, diagnostics, line, sequence);
  }
  return true;
};

function validateRunStartedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['trigger'], ['trigger'], diagnostics, line, sequence);
  enumField(payload, 'trigger', ['NEW_PLAN', 'MANUAL_START'], diagnostics, line, sequence);
}
function validateRunResumedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['previous_outcome', 'reason_code'], ['previous_outcome', 'reason_code'], diagnostics, line, sequence);
  enumField(payload, 'previous_outcome', ['BLOCKED', 'INCOMPLETE'], diagnostics, line, sequence);
  patternField(payload, 'reason_code', REASON, diagnostics, line, sequence);
}
function validatePlanRegisteredPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_count'], ['task_count'], diagnostics, line, sequence);
  integerField(payload, 'task_count', diagnostics, line, sequence, 1);
}
function validatePreflightCompletedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['result', 'diagnostic_codes'], ['result', 'diagnostic_codes'], diagnostics, line, sequence);
  enumField(payload, 'result', ['PASS', 'FAIL'], diagnostics, line, sequence);
  arrayField(payload, 'diagnostic_codes', item => typeof item === 'string', diagnostics, line, sequence);
}
function validateTaskRegisteredPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'ordinal', 'title', 'origin'], ['task_id', 'ordinal', 'title', 'origin'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); integerField(payload, 'ordinal', diagnostics, line, sequence); stringField(payload, 'title', 'PAYLOAD_TITLE_INVALID', diagnostics, line, sequence); enumField(payload, 'origin', ['INITIAL', 'ADDED'], diagnostics, line, sequence);
}
function validatePlanTaskAddedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'ordinal', 'title', 'origin', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], ['task_id', 'ordinal', 'title', 'origin', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); integerField(payload, 'ordinal', diagnostics, line, sequence); stringField(payload, 'title', 'PAYLOAD_TITLE_INVALID', diagnostics, line, sequence); enumField(payload, 'origin', ['INITIAL', 'ADDED'], diagnostics, line, sequence); patternField(payload, 'previous_fingerprint', FP, diagnostics, line, sequence); patternField(payload, 'new_fingerprint', FP, diagnostics, line, sequence); patternField(payload, 'reason_code', REASON, diagnostics, line, sequence);
}
function validatePlanTaskChangedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'ordinal', 'title', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], ['task_id', 'ordinal', 'title', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); integerField(payload, 'ordinal', diagnostics, line, sequence); stringField(payload, 'title', 'PAYLOAD_TITLE_INVALID', diagnostics, line, sequence); patternField(payload, 'previous_fingerprint', FP, diagnostics, line, sequence); patternField(payload, 'new_fingerprint', FP, diagnostics, line, sequence); patternField(payload, 'reason_code', REASON, diagnostics, line, sequence);
}
function validatePlanTaskSupersededPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'replacement_task_ids', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], ['task_id', 'replacement_task_ids', 'previous_fingerprint', 'new_fingerprint', 'reason_code'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); arrayField(payload, 'replacement_task_ids', item => typeof item === 'string', diagnostics, line, sequence); patternField(payload, 'previous_fingerprint', FP, diagnostics, line, sequence); patternField(payload, 'new_fingerprint', FP, diagnostics, line, sequence); patternField(payload, 'reason_code', REASON, diagnostics, line, sequence);
}
function validateTaskDispatchedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'dispatch_id', 'attempt', 'dispatch_kind'], ['task_id', 'dispatch_id', 'attempt', 'dispatch_kind'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); stringField(payload, 'dispatch_id', 'PAYLOAD_DISPATCH_ID_INVALID', diagnostics, line, sequence); integerField(payload, 'attempt', diagnostics, line, sequence); enumField(payload, 'dispatch_kind', ['IMPLEMENTATION', 'FIX', 'TAKEOVER'], diagnostics, line, sequence);
}
function validateTaskImplementationCompletedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'status', 'commit_ids'], ['task_id', 'status', 'commit_ids'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); enumField(payload, 'status', ['DONE', 'DONE_WITH_CONCERNS'], diagnostics, line, sequence); arrayField(payload, 'commit_ids', item => typeof item === 'string', diagnostics, line, sequence);
}
function validateTaskTestResultPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'result', 'evidence_kind', 'passed', 'total'], ['task_id', 'result', 'evidence_kind'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); enumField(payload, 'result', ['PASS', 'FAIL', 'UNKNOWN'], diagnostics, line, sequence); enumField(payload, 'evidence_kind', ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'], diagnostics, line, sequence); integerField(payload, 'passed', diagnostics, line, sequence); integerField(payload, 'total', diagnostics, line, sequence); evidenceCounts(payload, diagnostics, line, sequence);
}
function validateTaskImplementationReviewResultPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'review_id', 'reviewer_verdict', 'gate_verdict', 'cannot_verify_count', 'resolved_cannot_verify_count'], ['task_id', 'review_id', 'reviewer_verdict', 'gate_verdict', 'cannot_verify_count', 'resolved_cannot_verify_count'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); stringField(payload, 'review_id', 'PAYLOAD_REVIEW_ID_INVALID', diagnostics, line, sequence); enumField(payload, 'reviewer_verdict', ['PASS', 'FAIL', 'CANNOT_VERIFY'], diagnostics, line, sequence); enumField(payload, 'gate_verdict', ['PASS', 'FAIL'], diagnostics, line, sequence); integerField(payload, 'cannot_verify_count', diagnostics, line, sequence); integerField(payload, 'resolved_cannot_verify_count', diagnostics, line, sequence);
}
function validateTaskQualityReviewResultPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'review_id', 'verdict'], ['task_id', 'review_id', 'verdict'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); stringField(payload, 'review_id', 'PAYLOAD_REVIEW_ID_INVALID', diagnostics, line, sequence); enumField(payload, 'verdict', ['APPROVED', 'NEEDS_FIXES'], diagnostics, line, sequence);
}
function validateFindingRaisedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['finding_id', 'scope', 'task_id', 'category', 'severity', 'title', 'location'], ['finding_id', 'scope', 'category', 'severity', 'title'], diagnostics, line, sequence);
  patternField(payload, 'finding_id', FINDING_ID_RE, diagnostics, line, sequence); enumField(payload, 'scope', ['TASK', 'FINAL'], diagnostics, line, sequence); patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); enumField(payload, 'category', ['SPEC', 'QUALITY'], diagnostics, line, sequence); enumField(payload, 'severity', ['CRITICAL', 'IMPORTANT', 'MINOR'], diagnostics, line, sequence); stringField(payload, 'title', 'FINDING_TITLE_TOO_LONG', diagnostics, line, sequence, MAX_FINDING_TITLE); patternField(payload, 'location', PATH, diagnostics, line, sequence);
}
function validateFindingResolvedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['finding_id', 'resolution_code', 'fix_round'], ['finding_id', 'resolution_code', 'fix_round'], diagnostics, line, sequence);
  patternField(payload, 'finding_id', FINDING_ID_RE, diagnostics, line, sequence); patternField(payload, 'resolution_code', REASON, diagnostics, line, sequence); integerField(payload, 'fix_round', diagnostics, line, sequence, 1);
}
function validateFindingParkedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['finding_id', 'ruling_code', 'task_id'], ['finding_id', 'ruling_code', 'task_id'], diagnostics, line, sequence);
  patternField(payload, 'finding_id', FINDING_ID_RE, diagnostics, line, sequence); patternField(payload, 'ruling_code', REASON, diagnostics, line, sequence); patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence);
}
function validateFixRoundStartedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'round', 'finding_ids', 'dispatch_id'], ['task_id', 'round', 'finding_ids', 'dispatch_id'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); integerField(payload, 'round', diagnostics, line, sequence, 1); arrayField(payload, 'finding_ids', item => typeof item === 'string' && FINDING_ID_RE.test(item), diagnostics, line, sequence); stringField(payload, 'dispatch_id', 'PAYLOAD_DISPATCH_ID_INVALID', diagnostics, line, sequence);
}
function validateFixRoundCompletedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'round', 'review_id', 'finding_results'], ['task_id', 'round', 'review_id', 'finding_results'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); integerField(payload, 'round', diagnostics, line, sequence, 1); stringField(payload, 'review_id', 'PAYLOAD_REVIEW_ID_INVALID', diagnostics, line, sequence); findingResults(payload, diagnostics, line, sequence);
}
function validateTaskAcceptedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'acceptance_basis'], ['task_id', 'acceptance_basis'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); patternField(payload, 'acceptance_basis', REASON, diagnostics, line, sequence);
}
function validateTaskBlockedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['task_id', 'reason_code', 'required_human_input'], ['task_id', 'reason_code', 'required_human_input'], diagnostics, line, sequence);
  patternField(payload, 'task_id', TASK_ID_RE, diagnostics, line, sequence); patternField(payload, 'reason_code', REASON, diagnostics, line, sequence); booleanField(payload, 'required_human_input', diagnostics, line, sequence);
}
function validateHumanInterventionRequiredPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['intervention_id', 'affected_task_ids', 'reason_code'], ['intervention_id', 'affected_task_ids', 'reason_code'], diagnostics, line, sequence);
  stringField(payload, 'intervention_id', 'PAYLOAD_INTERVENTION_ID_INVALID', diagnostics, line, sequence); arrayField(payload, 'affected_task_ids', item => typeof item === 'string' && TASK_ID_RE.test(item), diagnostics, line, sequence); patternField(payload, 'reason_code', REASON, diagnostics, line, sequence);
}
function validateHumanInterventionCompletedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['intervention_id', 'resolution_code'], ['intervention_id', 'resolution_code'], diagnostics, line, sequence);
  stringField(payload, 'intervention_id', 'PAYLOAD_INTERVENTION_ID_INVALID', diagnostics, line, sequence); patternField(payload, 'resolution_code', REASON, diagnostics, line, sequence);
}
function validateFinalReviewResultPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['result', 'review_id', 'finding_ids'], ['result', 'review_id', 'finding_ids'], diagnostics, line, sequence);
  enumField(payload, 'result', ['PASS', 'FAIL'], diagnostics, line, sequence); stringField(payload, 'review_id', 'PAYLOAD_REVIEW_ID_INVALID', diagnostics, line, sequence); arrayField(payload, 'finding_ids', item => typeof item === 'string' && FINDING_ID_RE.test(item), diagnostics, line, sequence);
}
function validateFinalTestResultPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['result', 'evidence_kind', 'passed', 'total'], ['result', 'evidence_kind'], diagnostics, line, sequence);
  enumField(payload, 'result', ['PASS', 'FAIL', 'UNKNOWN'], diagnostics, line, sequence); enumField(payload, 'evidence_kind', ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'], diagnostics, line, sequence); integerField(payload, 'passed', diagnostics, line, sequence); integerField(payload, 'total', diagnostics, line, sequence); evidenceCounts(payload, diagnostics, line, sequence);
}
function validateRunPassedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['basis'], ['basis'], diagnostics, line, sequence);
  patternField(payload, 'basis', REASON, diagnostics, line, sequence);
}
function validateRunBlockedPayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['reason_code', 'task_ids'], ['reason_code'], diagnostics, line, sequence);
  patternField(payload, 'reason_code', REASON, diagnostics, line, sequence); arrayField(payload, 'task_ids', item => typeof item === 'string' && TASK_ID_RE.test(item), diagnostics, line, sequence);
}
function validateRunIncompletePayload(payload, line, sequence, diagnostics) {
  if (!payloadObject(payload, line, sequence, diagnostics)) return;
  exactKeys(payload, ['reason_code'], ['reason_code'], diagnostics, line, sequence);
  patternField(payload, 'reason_code', REASON, diagnostics, line, sequence);
}
const PAYLOAD_VALIDATORS = {
  run_started: validateRunStartedPayload, run_resumed: validateRunResumedPayload, plan_registered: validatePlanRegisteredPayload,
  preflight_completed: validatePreflightCompletedPayload, task_registered: validateTaskRegisteredPayload,
  plan_task_added: validatePlanTaskAddedPayload, plan_task_changed: validatePlanTaskChangedPayload,
  plan_task_superseded: validatePlanTaskSupersededPayload, task_dispatched: validateTaskDispatchedPayload,
  task_implementation_completed: validateTaskImplementationCompletedPayload, task_test_result: validateTaskTestResultPayload,
  task_implementation_review_result: validateTaskImplementationReviewResultPayload,
  task_quality_review_result: validateTaskQualityReviewResultPayload, finding_raised: validateFindingRaisedPayload,
  finding_resolved: validateFindingResolvedPayload, finding_parked: validateFindingParkedPayload,
  fix_round_started: validateFixRoundStartedPayload, fix_round_completed: validateFixRoundCompletedPayload,
  task_accepted: validateTaskAcceptedPayload, task_blocked: validateTaskBlockedPayload,
  human_intervention_required: validateHumanInterventionRequiredPayload,
  human_intervention_completed: validateHumanInterventionCompletedPayload,
  final_review_result: validateFinalReviewResultPayload, final_test_result: validateFinalTestResultPayload,
  run_passed: validateRunPassedPayload, run_blocked: validateRunBlockedPayload, run_incomplete: validateRunIncompletePayload,
};

export function validateEvent(input, lineNumber = undefined) {
  const diagnostics = [];
  if (!isObject(input)) return { value: null, diagnostics: [diag('EVENT_NOT_OBJECT', 'Event must be an object', lineNumber)] };
  exactKeys(input, EVENT_FIELDS, EVENT_FIELDS, diagnostics, lineNumber, input.sequence, 'EVENT');
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
  if (Object.prototype.hasOwnProperty.call(PAYLOAD_VALIDATORS, input.event_type)) {
    const validatedContract = validatePayloadContract(input.event_type, input.payload, lineNumber, input.sequence, diagnostics);
    if (validatedContract) {
      activePayloadContract = PAYLOAD_CONTRACTS[input.event_type];
      PAYLOAD_VALIDATORS[input.event_type](input.payload, lineNumber, input.sequence, diagnostics);
      activePayloadContract = null;
    }
  }
  return { value: diagnostics.length ? null : input, diagnostics };
}
