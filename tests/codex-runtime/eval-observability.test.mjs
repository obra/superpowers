import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { getEvalDir } from '../evals/helpers/eval-observability.mjs';
import {
  REPO_ROOT,
  readUtf8,
} from './helpers/markdown-test-helpers.mjs';

const MINIMUM_EVENT_FIELDS = [
  'event_kind',
  'timestamp',
  'execution_run_id',
  'authoritative_sequence',
  'source_plan_path',
  'source_plan_revision',
  'harness_phase',
  'chunk_id',
  'evaluator_kind',
  'active_contract_fingerprint',
  'evaluation_report_fingerprint',
  'handoff_fingerprint',
  'command_name',
  'gate_name',
  'failure_class',
  'reason_codes',
];

const MINIMUM_REASON_CODES = [
  'waiting_on_required_evaluator',
  'required_evaluator_failed',
  'required_evaluator_blocked',
  'handoff_required',
  'repair_within_budget',
  'pivot_threshold_exceeded',
  'blocked_on_plan_revision',
  'write_authority_conflict',
  'repo_state_drift',
  'stale_provenance',
  'recovering_incomplete_authoritative_mutation',
  'missing_required_evidence',
  'invalid_evidence_satisfaction_rule',
];

const REQUIRED_GATES = [
  'gate-contract',
  'gate-evaluator',
  'gate-handoff',
  'gate-review',
  'gate-finish',
];

const REQUIRED_PAIRED_FAMILIES = {
  phase_transition: ['prev_next', 'trigger_detail'],
  proposal_policy: ['proposal', 'acceptance'],
  blocked_state: ['entry', 'exit'],
  write_authority: ['conflict', 'reclaim'],
  replay_outcome: ['accepted', 'replay_conflict'],
  repo_state_drift: ['detected', 'reconciled'],
};

const REQUIRED_SINGLE_FAMILIES = [
  'artifact_integrity_mismatch',
  'partial_authoritative_mutation_recovery',
  'downstream_gate_rejection',
  'dependency_index_pruning_skip',
];

const RUNTIME_EVENT_KIND_BY_CASE = {
  'phase_transition:prev_next': ['phase_transition'],
  'phase_transition:trigger_detail': ['phase_transition'],
  'proposal_policy:proposal': ['recommendation_proposed'],
  'proposal_policy:acceptance': ['policy_accepted'],
  'gate_result:gate-contract': ['gate_result'],
  'gate_result:gate-evaluator': ['gate_result'],
  'gate_result:gate-handoff': ['gate_result'],
  'gate_result:gate-review': ['gate_result'],
  'gate_result:gate-finish': ['gate_result'],
  'blocked_state:entry': ['blocked_state_entered'],
  'blocked_state:exit': ['blocked_state_cleared'],
  'write_authority:conflict': ['write_authority_conflict'],
  'write_authority:reclaim': ['write_authority_reclaimed'],
  'replay_outcome:accepted': ['replay_accepted'],
  'replay_outcome:replay_conflict': ['replay_conflict'],
  'repo_state_drift:detected': ['repo_state_drift_detected'],
  'repo_state_drift:reconciled': ['repo_state_reconciled'],
  'artifact_integrity_mismatch:mismatch': ['integrity_mismatch_detected'],
  'partial_authoritative_mutation_recovery:recovery': ['partial_mutation_recovered', 'authoritative_mutation_recorded'],
  'downstream_gate_rejection:rejection': ['downstream_gate_rejected'],
  'dependency_index_pruning_skip:pruning_skip': ['authoritative_mutation_recorded', 'ordering_gap_detected'],
};

const REQUIRED_TELEMETRY_COUNTER_FIELDS = [
  'phase_transition_count',
  'blocked_state_entries_by_reason',
  'gate_failures_by_gate',
  'retry_count',
  'pivot_count',
  'authoritative_mutation_count',
  'evaluator_outcomes',
  'ordering_gap_count',
  'replay_accepted_count',
  'replay_conflict_count',
  'write_authority_conflict_count',
  'write_authority_reclaim_count',
  'repo_state_drift_count',
  'integrity_mismatch_count',
  'partial_mutation_recovery_count',
  'downstream_gate_rejection_count',
];
const TELEMETRY_CONCEPT_RUNTIME_COUNTERS = {
  phase_transitions: ['phase_transition_count'],
  blocked_state_entries_by_reason: ['blocked_state_entries_by_reason'],
  authoritative_mutation_counts: ['authoritative_mutation_count'],
  gate_failures: ['gate_failures_by_gate'],
  retry_and_pivot_counts: ['retry_count', 'pivot_count'],
  evaluator_outcomes: ['evaluator_outcomes'],
  ordering_gaps: ['ordering_gap_count'],
  replay_outcomes: ['replay_accepted_count', 'replay_conflict_count'],
  write_authority_conflicts_and_reclaims: ['write_authority_conflict_count', 'write_authority_reclaim_count'],
  drift: ['repo_state_drift_count'],
  integrity_mismatches: ['integrity_mismatch_count'],
  recovery: ['partial_mutation_recovery_count'],
  pruning_outcomes: ['authoritative_mutation_count'],
};
const TELEMETRY_FAMILY_REQUIRED_COUNTER_FIELDS = {
  phase_transition: ['phase_transition_count'],
  proposal_policy: ['retry_count', 'pivot_count', 'authoritative_mutation_count'],
  gate_result: ['gate_failures_by_gate', 'evaluator_outcomes'],
  blocked_state: ['blocked_state_entries_by_reason'],
  write_authority: ['write_authority_conflict_count', 'write_authority_reclaim_count'],
  replay_outcome: ['replay_accepted_count', 'replay_conflict_count', 'ordering_gap_count'],
  repo_state_drift: ['repo_state_drift_count'],
  artifact_integrity_mismatch: ['integrity_mismatch_count'],
  partial_authoritative_mutation_recovery: ['partial_mutation_recovery_count', 'authoritative_mutation_count'],
  downstream_gate_rejection: ['downstream_gate_rejection_count', 'gate_failures_by_gate'],
  dependency_index_pruning_skip: ['authoritative_mutation_count'],
};
const TELEMETRY_CONCEPT_FAMILY_MATRIX = {
  phase_transitions: ['phase_transition'],
  blocked_state_entries_by_reason: ['blocked_state'],
  authoritative_mutation_counts: ['proposal_policy', 'partial_authoritative_mutation_recovery', 'dependency_index_pruning_skip'],
  gate_failures: ['gate_result', 'downstream_gate_rejection'],
  retry_and_pivot_counts: ['proposal_policy'],
  evaluator_outcomes: ['gate_result'],
  ordering_gaps: ['replay_outcome', 'dependency_index_pruning_skip'],
  replay_outcomes: ['replay_outcome'],
  write_authority_conflicts_and_reclaims: ['write_authority'],
  drift: ['repo_state_drift'],
  integrity_mismatches: ['artifact_integrity_mismatch'],
  recovery: ['partial_authoritative_mutation_recovery'],
  pruning_outcomes: ['dependency_index_pruning_skip'],
};
const EVENT_KIND_STRUCTURED_DISCRIMINATOR_FIELDS = ['harness_phase', 'command_name', 'gate_name', 'failure_class'];

const RUNTIME_OBSERVABILITY_PATH = path.join(REPO_ROOT, 'src/execution/observability.rs');
const HARNESS_OBSERVABILITY_SEAM_EXPECTATION_PATHS = [
  path.join(REPO_ROOT, 'tests/contracts_execution_harness.rs'),
  path.join(REPO_ROOT, 'tests/execution_harness_state.rs'),
  path.join(REPO_ROOT, 'tests/workflow_runtime.rs'),
  path.join(REPO_ROOT, 'tests/codex-runtime/workflow-fixtures.test.mjs'),
  path.join(REPO_ROOT, 'tests/codex-runtime/fixtures/workflow-artifacts/harness/observability-seam-event-kinds.json'),
];
const HARNESS_OBSERVABILITY_PLANNING_README_PATH = path.join(
  REPO_ROOT,
  'tests/codex-runtime/fixtures/workflow-artifacts/README.md',
);
const HARNESS_OBSERVABILITY_PLANNING_EXPECTATION_PATHS = [HARNESS_OBSERVABILITY_PLANNING_README_PATH];

const OBSERVABILITY_CASES = [
  {
    name: 'phase-transition prev/next events',
    family: 'phase_transition',
    variant: 'prev_next',
    details: {
      harness_phase: 'contract_approved',
      command_name: 'record-contract',
      gate_name: null,
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['phase_transition:prev_next'],
  },
  {
    name: 'phase-transition trigger-detail events',
    family: 'phase_transition',
    variant: 'trigger_detail',
    details: {
      harness_phase: 'evaluating',
      command_name: 'record-evaluation',
      gate_name: null,
      transition_trigger_detail: 'required_evaluator_failed',
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['phase_transition:trigger_detail'],
  },
  {
    name: 'recommendation proposal events',
    family: 'proposal_policy',
    variant: 'proposal',
    details: {
      harness_phase: 'execution_preflight',
      command_name: 'recommend',
      gate_name: null,
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['proposal_policy:proposal'],
  },
  {
    name: 'policy-acceptance events',
    family: 'proposal_policy',
    variant: 'acceptance',
    details: {
      harness_phase: 'execution_preflight',
      command_name: 'preflight',
      gate_name: null,
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['proposal_policy:acceptance'],
  },
  {
    name: 'gate-result events for gate-contract',
    family: 'gate_result',
    variant: 'gate-contract',
    details: {
      command_name: 'gate-contract',
      gate_name: 'gate-contract',
      failure_class: 'ContractMismatch',
    },
    reasonCodes: ['missing_required_evidence'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['gate_result:gate-contract'],
  },
  {
    name: 'gate-result events for gate-evaluator',
    family: 'gate_result',
    variant: 'gate-evaluator',
    details: {
      command_name: 'gate-evaluator',
      gate_name: 'gate-evaluator',
      failure_class: 'EvaluationMismatch',
    },
    reasonCodes: ['repair_within_budget'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['gate_result:gate-evaluator'],
  },
  {
    name: 'gate-result events for gate-handoff',
    family: 'gate_result',
    variant: 'gate-handoff',
    details: {
      command_name: 'gate-handoff',
      gate_name: 'gate-handoff',
      failure_class: 'MissingRequiredHandoff',
    },
    reasonCodes: ['handoff_required'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['gate_result:gate-handoff'],
  },
  {
    name: 'gate-result events for gate-review',
    family: 'gate_result',
    variant: 'gate-review',
    details: {
      command_name: 'gate-review',
      gate_name: 'gate-review',
      failure_class: 'StaleProvenance',
    },
    reasonCodes: ['stale_provenance'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['gate_result:gate-review'],
  },
  {
    name: 'gate-result events for gate-finish',
    family: 'gate_result',
    variant: 'gate-finish',
    details: {
      command_name: 'gate-finish',
      gate_name: 'gate-finish',
      failure_class: 'StaleProvenance',
    },
    reasonCodes: ['stale_provenance'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['gate_result:gate-finish'],
  },
  {
    name: 'blocked-state entry events',
    family: 'blocked_state',
    variant: 'entry',
    details: {
      harness_phase: 'handoff_required',
      command_name: 'record-evaluation',
      gate_name: 'gate-evaluator',
    },
    reasonCodes: ['required_evaluator_blocked'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['blocked_state:entry'],
  },
  {
    name: 'blocked-state exit events',
    family: 'blocked_state',
    variant: 'exit',
    details: {
      harness_phase: 'executing',
      command_name: 'record-handoff',
      gate_name: 'gate-handoff',
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['blocked_state:exit'],
  },
  {
    name: 'write-authority conflict events',
    family: 'write_authority',
    variant: 'conflict',
    details: {
      command_name: 'record-contract',
      gate_name: 'gate-contract',
      failure_class: 'ConcurrentWriterConflict',
    },
    reasonCodes: ['write_authority_conflict'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['write_authority:conflict'],
  },
  {
    name: 'write-authority reclaim events',
    family: 'write_authority',
    variant: 'reclaim',
    details: {
      command_name: 'preflight',
      gate_name: null,
      failure_class: null,
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['write_authority:reclaim'],
  },
  {
    name: 'accepted replay events',
    family: 'replay_outcome',
    variant: 'accepted',
    details: {
      command_name: 'record-contract',
      gate_name: 'gate-contract',
      failure_class: null,
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['replay_outcome:accepted'],
  },
  {
    name: 'replay-conflict events',
    family: 'replay_outcome',
    variant: 'replay_conflict',
    details: {
      command_name: 'record-contract',
      gate_name: 'gate-contract',
      failure_class: 'IdempotencyConflict',
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['replay_outcome:replay_conflict'],
  },
  {
    name: 'repo-state drift detection events',
    family: 'repo_state_drift',
    variant: 'detected',
    details: {
      command_name: 'gate-finish',
      gate_name: 'gate-finish',
      failure_class: 'RepoStateDrift',
    },
    reasonCodes: ['repo_state_drift'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['repo_state_drift:detected'],
  },
  {
    name: 'repo-state drift reconciliation events',
    family: 'repo_state_drift',
    variant: 'reconciled',
    details: {
      command_name: 'preflight',
      gate_name: null,
      failure_class: null,
    },
    reasonCodes: [],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['repo_state_drift:reconciled'],
  },
  {
    name: 'artifact-integrity mismatch events',
    family: 'artifact_integrity_mismatch',
    variant: 'mismatch',
    details: {
      command_name: 'gate-review',
      gate_name: 'gate-review',
      failure_class: 'ArtifactIntegrityMismatch',
    },
    reasonCodes: ['stale_provenance'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['artifact_integrity_mismatch:mismatch'],
  },
  {
    name: 'partial-authoritative-mutation recovery events',
    family: 'partial_authoritative_mutation_recovery',
    variant: 'recovery',
    details: {
      command_name: 'preflight',
      gate_name: null,
      failure_class: 'PartialAuthoritativeMutation',
    },
    reasonCodes: ['recovering_incomplete_authoritative_mutation'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['partial_authoritative_mutation_recovery:recovery'],
  },
  {
    name: 'downstream gate rejection events',
    family: 'downstream_gate_rejection',
    variant: 'rejection',
    details: {
      command_name: 'gate-finish',
      gate_name: 'gate-finish',
      failure_class: 'NonHarnessProvenance',
    },
    reasonCodes: ['stale_provenance'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['downstream_gate_rejection:rejection'],
  },
  {
    name: 'dependency-index pruning-skip events',
    family: 'dependency_index_pruning_skip',
    variant: 'pruning_skip',
    details: {
      command_name: 'preflight',
      gate_name: null,
      failure_class: 'DependencyIndexMismatch',
    },
    reasonCodes: ['stale_provenance'],
    eventKinds: RUNTIME_EVENT_KIND_BY_CASE['dependency_index_pruning_skip:pruning_skip'],
  },
];

test('getEvalDir defaults to the featureforge state root', () => {
  const originalFeatureForgeStateDir = process.env.FEATUREFORGE_STATE_DIR;

  delete process.env.FEATUREFORGE_STATE_DIR;

  try {
    assert.equal(getEvalDir(), path.join(os.homedir(), '.featureforge', 'evals'));
  } finally {
    restoreEnv('FEATUREFORGE_STATE_DIR', originalFeatureForgeStateDir);
  }
});

test('getEvalDir honors FEATUREFORGE_STATE_DIR', () => {
  const originalFeatureForgeStateDir = process.env.FEATUREFORGE_STATE_DIR;

  process.env.FEATUREFORGE_STATE_DIR = '/tmp/featureforge-state';

  try {
    assert.equal(getEvalDir(), '/tmp/featureforge-state/evals');
  } finally {
    restoreEnv('FEATUREFORGE_STATE_DIR', originalFeatureForgeStateDir);
  }
});

test('observability case payloads allow variant-specific structured details while preserving envelope ownership', () => {
  const envelopeOwnedFields = new Set(['event_kind', 'timestamp', 'reason_codes']);
  let sawVariantSpecificPayload = false;
  for (const observabilityCase of OBSERVABILITY_CASES) {
    const detailFields = Object.keys(observabilityCase.details);
    const envelopeConflicts = detailFields.filter((field) => envelopeOwnedFields.has(field));
    assert.deepEqual(
      envelopeConflicts,
      [],
      `${observabilityCase.name} should keep envelope-owned fields out of family-specific details`,
    );
    if (detailFields.some((field) => !MINIMUM_EVENT_FIELDS.includes(field))) {
      sawVariantSpecificPayload = true;
    }

    for (const reasonCode of observabilityCase.reasonCodes) {
      assert.equal(
        MINIMUM_REASON_CODES.includes(reasonCode),
        true,
        `${observabilityCase.name} should use only the stable minimum reason-code vocabulary`,
      );
    }
  }

  assert.equal(
    sawVariantSpecificPayload,
    true,
    'observability fixtures should include at least one variant-specific structured payload field beyond the common envelope',
  );
});

test('observability case matrix covers required families and gate results', () => {
  const gateCases = OBSERVABILITY_CASES.filter((observabilityCase) => observabilityCase.family === 'gate_result');
  const observedGates = new Set(gateCases.map((observabilityCase) => observabilityCase.details.gate_name));
  const missingGates = REQUIRED_GATES.filter((gateName) => !observedGates.has(gateName));
  assert.deepEqual(missingGates, [], 'gate-result coverage should include every required gate');

  for (const [family, variants] of Object.entries(REQUIRED_PAIRED_FAMILIES)) {
    const observedVariants = new Set(
      OBSERVABILITY_CASES.filter((observabilityCase) => observabilityCase.family === family).map(
        (observabilityCase) => observabilityCase.variant,
      ),
    );
    const missingVariants = variants.filter((variant) => !observedVariants.has(variant));
    assert.deepEqual(
      missingVariants,
      [],
      `observability matrix should include all required paired variants for ${family}`,
    );
  }

  for (const family of REQUIRED_SINGLE_FAMILIES) {
    assert.equal(
      OBSERVABILITY_CASES.some((observabilityCase) => observabilityCase.family === family),
      true,
      `observability matrix should include ${family} coverage`,
    );
  }
});

test('observability case matrix uses runtime-owned event_kind vocabulary and structured discrimination', () => {
  const runtimeObservability = parseRuntimeObservabilityContract();
  const missingEventKinds = [];
  const unknownEventKindCases = [];
  const caseKeysByEventKindAndStructure = new Map();

  for (const observabilityCase of OBSERVABILITY_CASES) {
    const caseKey = `${observabilityCase.family}:${observabilityCase.variant}`;
    const eventKinds = normalizeEventKinds(observabilityCase.eventKinds);
    if (eventKinds.length === 0) {
      missingEventKinds.push(caseKey);
      continue;
    }

    const unsupportedEventKinds = eventKinds.filter((eventKind) => !runtimeObservability.stableEventKinds.has(eventKind));
    if (unsupportedEventKinds.length > 0) {
      unknownEventKindCases.push({ caseKey, unsupportedEventKinds });
      continue;
    }

    for (const eventKind of eventKinds) {
      if (!caseKeysByEventKindAndStructure.has(eventKind)) {
        caseKeysByEventKindAndStructure.set(eventKind, new Map());
      }
      const structuredDiscriminator = canonicalStructuredDiscriminator(observabilityCase);
      const structuredCaseKeys = caseKeysByEventKindAndStructure.get(eventKind);
      if (!structuredCaseKeys.has(structuredDiscriminator)) {
        structuredCaseKeys.set(structuredDiscriminator, new Set());
      }
      structuredCaseKeys.get(structuredDiscriminator).add(caseKey);
    }
  }

  const indistinguishableStructuredCollisions = [];
  for (const [eventKind, structuredCaseKeys] of caseKeysByEventKindAndStructure.entries()) {
    for (const caseKeys of structuredCaseKeys.values()) {
      if (caseKeys.size > 1) {
        indistinguishableStructuredCollisions.push({ eventKind, caseKeys: [...caseKeys].sort() });
      }
    }
  }

  missingEventKinds.sort();
  unknownEventKindCases.sort((left, right) => left.caseKey.localeCompare(right.caseKey));
  indistinguishableStructuredCollisions.sort((left, right) => left.eventKind.localeCompare(right.eventKind));

  assert.deepEqual(
    missingEventKinds,
    [],
    'every observability case should declare at least one runtime-owned event_kind candidate',
  );
  assert.deepEqual(
    unknownEventKindCases,
    [],
    'observability cases should use only runtime-owned stable event_kind values from src/execution/observability.rs',
  );
  assert.deepEqual(
    indistinguishableStructuredCollisions,
    [],
    'shared event_kind usage across cases must remain discriminated by additional structured details',
  );
});

test('minimum reason-code vocabulary stays aligned with runtime-owned stable reason codes', () => {
  const runtimeObservability = parseRuntimeObservabilityContract();
  const expectedReasonCodes = [...MINIMUM_REASON_CODES].sort();
  const runtimeReasonCodes = [...runtimeObservability.stableReasonCodes].sort();

  assert.deepEqual(
    runtimeReasonCodes,
    expectedReasonCodes,
    'minimum reason-code coverage in this slice should match the runtime-owned stable vocabulary exactly',
  );
});

test('minimum event payload fields stay aligned with runtime HarnessObservabilityEvent', () => {
  const runtimeObservability = parseRuntimeObservabilityContract();
  const missingFields = MINIMUM_EVENT_FIELDS.filter((field) => !runtimeObservability.eventFieldTypes.has(field));
  const eventKindType = runtimeObservability.eventFieldTypes.get('event_kind');
  const timestampType = runtimeObservability.eventFieldTypes.get('timestamp');
  const reasonCodesType = runtimeObservability.eventFieldTypes.get('reason_codes');

  assert.deepEqual(
    missingFields,
    [],
    'minimum observability payload field coverage should stay aligned with runtime-owned HarnessObservabilityEvent fields',
  );
  assert.equal(
    eventKindType?.startsWith('Option<'),
    false,
    'event_kind should remain required in the runtime-owned observability envelope',
  );
  assert.equal(
    timestampType?.startsWith('Option<'),
    false,
    'timestamp should remain required in the runtime-owned observability envelope',
  );
  assert.equal(
    reasonCodesType,
    'Vec<String>',
    'reason_codes should remain a machine-readable string array in the runtime-owned observability envelope',
  );
});

test('telemetry concept matrix maps to runtime-owned counter vocabulary', () => {
  const runtimeObservability = parseRuntimeObservabilityContract();
  const missingCounterFields = REQUIRED_TELEMETRY_COUNTER_FIELDS.filter(
    (counterField) => !runtimeObservability.telemetryCounterFields.has(counterField),
  );

  const missingConceptCounterMappings = [];
  for (const [telemetryConcept, counterFields] of Object.entries(TELEMETRY_CONCEPT_RUNTIME_COUNTERS)) {
    const missingCounters = counterFields.filter((counterField) => !runtimeObservability.telemetryCounterFields.has(counterField));
    if (missingCounters.length > 0) {
      missingConceptCounterMappings.push({ telemetryConcept, missingCounters });
    }
  }

  const missingFamilyCounterCoverage = [];
  for (const [family, counterFields] of Object.entries(TELEMETRY_FAMILY_REQUIRED_COUNTER_FIELDS)) {
    const missingCounters = counterFields.filter((counterField) => !runtimeObservability.telemetryCounterFields.has(counterField));
    if (missingCounters.length > 0) {
      missingFamilyCounterCoverage.push({ family, missingCounters });
    }
  }

  const missingConceptFamilyCoverage = [];
  for (const [telemetryConcept, families] of Object.entries(TELEMETRY_CONCEPT_FAMILY_MATRIX)) {
    const missingFamilies = families.filter(
      (family) => !OBSERVABILITY_CASES.some((observabilityCase) => observabilityCase.family === family),
    );
    if (missingFamilies.length > 0) {
      missingConceptFamilyCoverage.push({ telemetryConcept, missingFamilies });
    }
  }

  missingConceptCounterMappings.sort((left, right) => left.telemetryConcept.localeCompare(right.telemetryConcept));
  missingFamilyCounterCoverage.sort((left, right) => left.family.localeCompare(right.family));
  missingConceptFamilyCoverage.sort((left, right) => left.telemetryConcept.localeCompare(right.telemetryConcept));

  assert.deepEqual(
    missingCounterFields,
    [],
    'required telemetry concepts should map only to runtime-owned counter fields in src/execution/observability.rs',
  );
  assert.deepEqual(
    missingConceptCounterMappings,
    [],
    'each telemetry concept should map to runtime-owned counter fields without invented key names',
  );
  assert.deepEqual(
    missingFamilyCounterCoverage,
    [],
    'each observability family should map to runtime-owned telemetry counters',
  );
  assert.deepEqual(
    missingConceptFamilyCoverage,
    [],
    'telemetry concept matrix should reference only observability families represented in the case matrix',
  );
});

test('runtime seam expectation corpus excludes README planning literals', () => {
  assert.equal(
    HARNESS_OBSERVABILITY_SEAM_EXPECTATION_PATHS.includes(HARNESS_OBSERVABILITY_PLANNING_README_PATH),
    false,
    'README planning-only coverage must not be treated as runtime seam coverage',
  );
});

test('harness fixture/runtime output expectations should pin observability vocabulary at the runtime seam', () => {
  const seamExpectationCorpus = HARNESS_OBSERVABILITY_SEAM_EXPECTATION_PATHS
    .map((filePath) => readUtf8(filePath))
    .join('\n');
  const planningExpectationCorpus = HARNESS_OBSERVABILITY_PLANNING_EXPECTATION_PATHS
    .map((filePath) => readUtf8(filePath))
    .join('\n');

  const requiredEventKinds = [...collectRequiredEventKindsFromCases()].sort();
  const missingEventKindSeamCoverage = missingEventKindTokenCoverageInSeamCorpus(requiredEventKinds, seamExpectationCorpus);
  const seamBackedEventKinds = requiredEventKinds.filter(
    (eventKind) => !missingEventKindSeamCoverage.includes(eventKind),
  );
  const plannedEventKinds = requiredEventKinds.filter((eventKind) =>
    tokenCoveredInCorpus(eventKind, planningExpectationCorpus),
  );
  const missingEnvelopeFieldExpectations = missingLiteralTokenCoverage(MINIMUM_EVENT_FIELDS, seamExpectationCorpus);
  const missingTelemetryCounterExpectations = missingLiteralTokenCoverage(
    REQUIRED_TELEMETRY_COUNTER_FIELDS,
    seamExpectationCorpus,
  );

  assert.notDeepEqual(
    seamBackedEventKinds,
    [],
    'runtime seam expectations should include at least one event_kind literal in event_kind-specific contexts',
  );
  assert.deepEqual(
    missingEventKindSeamCoverage,
    [],
    `runtime seam expectations should cover every required stable event_kind without README fallback; missing seam coverage: ${missingEventKindSeamCoverage.join(', ')}`,
  );
  assert.notDeepEqual(
    plannedEventKinds,
    [],
    'README planning slice should document at least one planned event_kind literal',
  );
  assert.deepEqual(
    missingEnvelopeFieldExpectations,
    [],
    'runtime output expectations should pin minimum observability envelope fields at the harness seam',
  );
  assert.deepEqual(
    missingTelemetryCounterExpectations,
    [],
    'runtime output expectations should pin runtime-owned telemetry counter vocabulary at the harness seam',
  );
});

function parseRuntimeObservabilityContract() {
  const source = readUtf8(RUNTIME_OBSERVABILITY_PATH);
  return {
    stableEventKinds: new Set(extractRustStableConstArrayValues(source, 'STABLE_EVENT_KINDS')),
    stableReasonCodes: new Set(extractRustStableConstArrayValues(source, 'STABLE_REASON_CODES')),
    eventFieldTypes: extractRustStructFieldMap(source, 'HarnessObservabilityEvent'),
    telemetryCounterFields: new Set(extractRustStructFieldMap(source, 'HarnessTelemetryCounters').keys()),
  };
}

function extractRustStableConstArrayValues(source, arrayName) {
  const arrayMatch = source.match(new RegExp(`pub const ${arrayName}: \\[&str;\\s*\\d+\\s*\\] = \\[([\\s\\S]*?)\\];`));
  assert.ok(arrayMatch, `runtime observability source should expose ${arrayName}`);
  const referencedConstNames = [...arrayMatch[1].matchAll(/\b([A-Z0-9_]+)\b/g)]
    .map((entry) => entry[1])
    .filter((name) => name !== arrayName);

  return referencedConstNames.map((constName) => {
    const constMatch = source.match(new RegExp(`pub const ${constName}: &str\\s*=\\s*"([^"]+)"\\s*;`));
    assert.ok(constMatch, `runtime observability source should expose ${constName}`);
    return constMatch[1];
  });
}

function extractRustStructFieldMap(source, structName) {
  const match = source.match(new RegExp(`pub struct ${structName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `runtime observability source should expose ${structName}`);
  const fieldTypes = new Map();
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('pub ')) {
      continue;
    }
    const declaration = trimmed.slice(4).replace(/,$/, '');
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }
    const fieldName = declaration.slice(0, colonIndex).trim();
    const fieldType = declaration.slice(colonIndex + 1).trim();
    fieldTypes.set(fieldName, fieldType);
  }
  return fieldTypes;
}

function normalizeEventKinds(eventKinds) {
  if (!Array.isArray(eventKinds)) {
    return [];
  }
  return eventKinds
    .map((eventKind) => normalizeEventKindDiscriminator(eventKind))
    .filter((eventKind) => eventKind !== null);
}

function normalizeEventKindDiscriminator(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}

function canonicalStructuredDiscriminator(observabilityCase) {
  const discriminator = {};
  for (const field of EVENT_KIND_STRUCTURED_DISCRIMINATOR_FIELDS) {
    discriminator[field] = observabilityCase.details[field] ?? null;
  }
  discriminator.reason_codes = [...observabilityCase.reasonCodes];
  discriminator.case_details = Object.fromEntries(
    Object.entries(observabilityCase.details).sort(([left], [right]) => left.localeCompare(right)),
  );
  return stableStringify(discriminator);
}

function collectRequiredEventKindsFromCases() {
  const eventKinds = new Set();
  for (const observabilityCase of OBSERVABILITY_CASES) {
    for (const eventKind of normalizeEventKinds(observabilityCase.eventKinds)) {
      eventKinds.add(eventKind);
    }
  }
  return eventKinds;
}

function missingLiteralTokenCoverage(tokens, corpus) {
  return tokens
    .filter((token) => !tokenCoveredInCorpus(token, corpus))
    .sort();
}

function missingEventKindTokenCoverageInSeamCorpus(tokens, seamCorpus) {
  return tokens
    .filter((token) => !eventKindTokenCoveredInSeamCorpus(token, seamCorpus))
    .sort();
}

function tokenCoveredInCorpus(token, corpus) {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenRegex = new RegExp(`\\b${escapedToken}\\b`);
  return tokenRegex.test(corpus);
}

function eventKindTokenCoveredInSeamCorpus(token, seamCorpus) {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const quotedToken = `"${escapedToken}"`;
  const eventKindContextPatterns = [
    new RegExp(`"event_kind"[\\s\\S]{0,240}${quotedToken}`),
    new RegExp(`${quotedToken}[\\s\\S]{0,240}"event_kind"`),
    new RegExp(`event[_-]?kinds?[\\s\\S]{0,240}${quotedToken}`, 'i'),
    new RegExp(`HarnessEventKind[\\s\\S]{0,240}${quotedToken}`),
  ];
  return eventKindContextPatterns.some((pattern) => pattern.test(seamCorpus));
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
