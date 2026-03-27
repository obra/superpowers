import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT,
  readUtf8,
} from './helpers/markdown-test-helpers.mjs';

const FIXTURE_ROOT = path.join(REPO_ROOT, 'tests/codex-runtime/fixtures/workflow-artifacts');

const SPEC_FIXTURES = [
  'specs/2026-01-22-document-review-system-design.md',
  'specs/2026-01-22-document-review-system-design-v2.md',
  'specs/2026-02-19-visual-brainstorming-refactor-design.md',
  'specs/2026-03-11-zero-dep-brainstorm-server-design.md',
  'specs/2026-03-22-runtime-integration-hardening-design.md',
];

const PLAN_FIXTURES = [
  'plans/2026-01-22-document-review-system.md',
  'plans/2026-02-19-visual-brainstorming-refactor.md',
  'plans/2026-03-11-zero-dep-brainstorm-server.md',
  'plans/2026-03-22-runtime-integration-hardening.md',
];

const STALE_PATH_PLAN_FIXTURE = 'plans/2026-01-22-document-review-system-stale-path.md';
const REQUIRED_HARNESS_AWARE_DOWNSTREAM_PHASES = [
  'final_review_pending',
  'qa_pending',
  'document_release_pending',
  'ready_for_branch_completion',
];
const REQUIRED_DOWNSTREAM_FRESHNESS_FIELDS = [
  'final_review_state',
  'browser_qa_state',
  'release_docs_state',
  'last_final_review_artifact_fingerprint',
  'last_browser_qa_artifact_fingerprint',
  'last_release_docs_artifact_fingerprint',
];
const REQUIRED_EVALUATOR_VISIBILITY_FIELDS = [
  'last_evaluation_evaluator_kind',
  'required_evaluator_kinds',
  'completed_evaluator_kinds',
  'pending_evaluator_kinds',
  'non_passing_evaluator_kinds',
];
const ACTIVE_DOC_PATHS = [
  'RELEASE-NOTES.md',
  'TODOS.md',
  'docs/README.codex.md',
  'docs/README.copilot.md',
  'docs/testing.md',
  'docs/test-suite-enhancement-plan.md',
  'tests/evals/README.md',
];
const TASK8_HARNESS_MATRIX_FIXTURES = [
  'harness/pivot-required-status.json',
  'harness/handoff-required-status.json',
  'harness/candidate-execution-contract.md',
  'harness/candidate-evaluation-report.md',
  'harness/candidate-execution-handoff.md',
  'harness/stale-execution-contract.md',
  'harness/stale-evaluation-report.md',
  'harness/repo-state-drift-status.json',
  'harness/partial-authoritative-mutation-status.json',
  'harness/dependency-index-mismatch-status.json',
  'harness/dependency-index-clean.json',
  'harness/dependency-index-stale.json',
  'harness/dependency-index-malformed.json',
  'harness/non-harness-review-artifact.md',
  'harness/indexed-final-review-artifact.md',
  'harness/indexed-browser-qa-artifact.md',
  'harness/indexed-release-doc-artifact.md',
  'harness/retention-prunable-stale-artifact.md',
  'harness/retention-active-authoritative-artifact.md',
];
const DEPENDENCY_INDEX_STATUS_FIXTURES = [
  'harness/dependency-index-mismatch-status.json',
  'harness/dependency-index-clean.json',
  'harness/dependency-index-stale.json',
  'harness/dependency-index-malformed.json',
];
const REQUIRED_DEPENDENCY_INDEX_STATES = new Set([
  'healthy',
  'missing',
  'malformed',
  'inconsistent',
  'recovering',
]);
const OBSERVABILITY_SEAM_EVENT_KINDS_FIXTURE = 'harness/observability-seam-event-kinds.json';
const REQUIRED_ADVANCED_RUNTIME_EVENT_KINDS = [
  'authoritative_mutation_recorded',
  'blocked_state_cleared',
  'blocked_state_entered',
  'integrity_mismatch_detected',
  'ordering_gap_detected',
  'partial_mutation_recovered',
  'replay_accepted',
  'replay_conflict',
  'repo_state_drift_detected',
  'repo_state_reconciled',
  'write_authority_conflict',
  'write_authority_reclaimed',
];

function retiredProductName() {
  const readme = readUtf8(path.join(REPO_ROOT, 'README.md'));
  const provenanceLine = readme
    .split('\n')
    .find((line) => line.startsWith('FeatureForge began from upstream '));
  assert.ok(provenanceLine, 'README.md should keep the provenance attribution line');
  const match = provenanceLine.match(/upstream ([A-Za-z]+):/);
  assert.ok(match, 'README.md provenance line should expose the retired product name');
  return match[1].toLowerCase();
}

const RETIRED_PRODUCT = retiredProductName();
const LEGACY_ACTIVE_DOC_PATTERN = new RegExp(
  `${RETIRED_PRODUCT}|using_${RETIRED_PRODUCT}_skill|using-${RETIRED_PRODUCT}|\\.${RETIRED_PRODUCT}|${RETIRED_PRODUCT.toUpperCase()}_`,
  'i',
);

function getExactHeaderLine(content, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^\\*\\*${escaped}:\\*\\* .+$`, 'm'));
  return match ? match[0] : null;
}

test('all workflow fixture files exist', () => {
  for (const relPath of [...SPEC_FIXTURES, ...PLAN_FIXTURES, STALE_PATH_PLAN_FIXTURE]) {
    const filePath = path.join(FIXTURE_ROOT, relPath);
    assert.equal(true, readUtf8(filePath).length > 0, `${relPath} should exist`);
  }
});

test('task 8 harness fixture matrix files exist by exact filename before runtime assertions run', () => {
  for (const relPath of TASK8_HARNESS_MATRIX_FIXTURES) {
    const filePath = path.join(FIXTURE_ROOT, relPath);
    assert.equal(true, fs.existsSync(filePath), `${relPath} should exist`);
  }
});

test('task 8 dependency-index fixtures pin minimum status key and canonical state vocabulary', () => {
  for (const relPath of DEPENDENCY_INDEX_STATUS_FIXTURES) {
    const filePath = path.join(FIXTURE_ROOT, relPath);
    assert.equal(true, fs.existsSync(filePath), `${relPath} should exist`);

    const payload = JSON.parse(readUtf8(filePath));
    assert.equal(typeof payload, 'object', `${relPath} should contain a JSON object`);
    assert.notEqual(payload, null, `${relPath} should not be null`);
    assert.equal(
      typeof payload.dependency_index_state,
      'string',
      `${relPath} should include dependency_index_state`,
    );
    assert.equal(
      REQUIRED_DEPENDENCY_INDEX_STATES.has(payload.dependency_index_state),
      true,
      `${relPath} should use canonical dependency_index_state vocabulary`,
    );
  }
});

test('observability seam fixture pins advanced runtime event_kind vocabulary', () => {
  const fixturePath = path.join(FIXTURE_ROOT, OBSERVABILITY_SEAM_EVENT_KINDS_FIXTURE);
  const payload = JSON.parse(readUtf8(fixturePath));
  assert.equal(Array.isArray(payload.observability_event_examples), true);

  const observedEventKinds = payload.observability_event_examples
    .map((entry) => entry?.event_kind)
    .filter((eventKind) => typeof eventKind === 'string' && eventKind.length > 0);
  const missingEventKinds = REQUIRED_ADVANCED_RUNTIME_EVENT_KINDS.filter(
    (eventKind) => !observedEventKinds.includes(eventKind),
  );

  assert.deepEqual(
    missingEventKinds,
    [],
    'observability seam fixture should include advanced runtime-stable event_kind literals',
  );
});

test('spec fixtures carry the required workflow headers', () => {
  for (const relPath of SPEC_FIXTURES) {
    const content = readUtf8(path.join(FIXTURE_ROOT, relPath));
    assert.equal(getExactHeaderLine(content, 'Workflow State'), '**Workflow State:** CEO Approved', `${relPath} should use the exact approved-spec workflow state line`);
    assert.equal(getExactHeaderLine(content, 'Spec Revision'), '**Spec Revision:** 1', `${relPath} should use the exact spec revision line`);
    assert.equal(getExactHeaderLine(content, 'Last Reviewed By'), '**Last Reviewed By:** plan-ceo-review', `${relPath} should use the exact spec reviewer line`);
  }
});

test('plan fixtures carry the required workflow headers', () => {
  const happyPathSpecs = [
    'specs/2026-01-22-document-review-system-design.md',
    'specs/2026-02-19-visual-brainstorming-refactor-design.md',
    'specs/2026-03-11-zero-dep-brainstorm-server-design.md',
    'specs/2026-03-22-runtime-integration-hardening-design.md',
  ];
  for (const [index, relPath] of PLAN_FIXTURES.entries()) {
    const content = readUtf8(path.join(FIXTURE_ROOT, relPath));
    assert.equal(getExactHeaderLine(content, 'Workflow State'), '**Workflow State:** Engineering Approved', `${relPath} should use the exact approved-plan workflow state line`);
    assert.equal(
      getExactHeaderLine(content, 'Source Spec'),
      `**Source Spec:** \`tests/codex-runtime/fixtures/workflow-artifacts/${happyPathSpecs[index]}\``,
      `${relPath} should point at the matching spec fixture`,
    );
    assert.equal(getExactHeaderLine(content, 'Source Spec Revision'), '**Source Spec Revision:** 1', `${relPath} should use the exact source revision line`);
    assert.equal(getExactHeaderLine(content, 'Last Reviewed By'), '**Last Reviewed By:** plan-eng-review', `${relPath} should use the exact plan reviewer line`);
  }
});

test('stale-path plan fixture preserves the source-spec path mismatch case', () => {
  const content = readUtf8(path.join(FIXTURE_ROOT, STALE_PATH_PLAN_FIXTURE));
  assert.equal(getExactHeaderLine(content, 'Workflow State'), '**Workflow State:** Engineering Approved');
  assert.equal(
    getExactHeaderLine(content, 'Source Spec'),
    '**Source Spec:** `tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-01-22-document-review-system-design.md`',
  );
  assert.equal(getExactHeaderLine(content, 'Source Spec Revision'), '**Source Spec Revision:** 1');
  assert.equal(getExactHeaderLine(content, 'Last Reviewed By'), '**Last Reviewed By:** plan-eng-review');
});

test('full-contract route-time fixture preserves plan revision, execution mode, and canonical task shape', () => {
  const content = readUtf8(path.join(FIXTURE_ROOT, 'plans/2026-03-22-runtime-integration-hardening.md'));
  assert.equal(getExactHeaderLine(content, 'Plan Revision'), '**Plan Revision:** 1');
  assert.equal(getExactHeaderLine(content, 'Execution Mode'), '**Execution Mode:** none');
  assert.match(content, /## Requirement Coverage Matrix/);
  assert.match(content, /## Task 1: Harden route-time workflow validation/);
  assert.match(content, /\*\*Files:\*\*/);
});

test('fixture README documents provenance and intent', () => {
  const content = readUtf8(path.join(FIXTURE_ROOT, 'README.md'));
  assert.match(content, /108c0e8/);
  assert.match(content, /ce106d0/);
  assert.match(content, /header contract/i);
  assert.match(content, /stale source-spec path/i);
  assert.match(content, /full approved-plan-contract pair/i);
});

test('runtime fixture coverage points at the fixture directory', () => {
  const content = readUtf8(path.join(REPO_ROOT, 'tests/runtime_instruction_contracts.rs'));
  assert.match(content, /tests\/codex-runtime\/fixtures\/workflow-artifacts/);
});

test('public workflow rust smoke coverage exercises the canonical featureforge CLI', () => {
  const content = readUtf8(path.join(REPO_ROOT, 'tests/workflow_shell_smoke.rs'));
  assert.match(content, /standalone_binary_has_no_separate_workflow_wrapper_files/);
  assert.match(content, /workflow_help_outside_repo_mentions_the_public_surfaces/);
  assert.match(content, /workflow_status_summary_matches_json_semantics_for_ready_plans/);
});

test('workflow runtime coverage retains argv0 alias and public operator parity', () => {
  const content = readUtf8(path.join(REPO_ROOT, 'tests/workflow_runtime.rs'));
  assert.match(content, /workflow_status_argv0_alias_dispatches_to_canonical_tree/);
  assert.match(content, /canonical_workflow_public_json_commands_work_for_ready_plan/);
});

test('workflow fixture coverage pins harness-aware downstream phase/freshness/operator surfaces', () => {
  const runtime = readUtf8(path.join(REPO_ROOT, 'tests/workflow_runtime.rs'));
  const shellSmoke = readUtf8(path.join(REPO_ROOT, 'tests/workflow_shell_smoke.rs'));

  for (const phase of REQUIRED_HARNESS_AWARE_DOWNSTREAM_PHASES) {
    assert.match(
      runtime,
      new RegExp(`"${phase}"`),
      `workflow runtime coverage should exercise harness-aware downstream phase ${phase}`,
    );
  }
  assert.doesNotMatch(
    runtime,
    /"review_blocked"/,
    'workflow runtime coverage should stop using the legacy review_blocked public phase label',
  );

  for (const field of REQUIRED_DOWNSTREAM_FRESHNESS_FIELDS) {
    assert.match(
      runtime,
      new RegExp(`"${field}"`),
      `workflow runtime coverage should expose downstream freshness/status field ${field}`,
    );
  }

  for (const field of REQUIRED_EVALUATOR_VISIBILITY_FIELDS) {
    assert.match(
      runtime,
      new RegExp(`"${field}"`),
      `workflow runtime coverage should expose evaluator-kind surface ${field}`,
    );
  }

  assert.match(runtime, /"next_action"/, 'workflow runtime coverage should keep next_action visible');
  assert.match(runtime, /"reason_codes"/, 'workflow runtime coverage should keep reason_codes visible');
  assert.match(
    runtime,
    /write_authority_holder/,
    'workflow runtime coverage should keep write-authority metadata visible',
  );
  assert.match(
    runtime,
    /write_authority_conflict/,
    'workflow runtime coverage should keep writer conflict visible through metadata and reason codes',
  );
  assert.doesNotMatch(
    runtime,
    /writer_conflict_pending|writer_conflict_phase|phase.*writer_conflict/,
    'workflow runtime coverage should not introduce a dedicated writer-conflict public phase',
  );

  assert.match(
    shellSmoke,
    /workflow_phase_text_and_json_surfaces_match_harness_downstream_freshness/,
    'workflow shell smoke coverage should pin phase text/JSON parity for harness downstream freshness',
  );
  assert.match(
    shellSmoke,
    /workflow_handoff_and_doctor_text_and_json_surfaces_match_harness_evaluator_and_reason_metadata/,
    'workflow shell smoke coverage should pin handoff/doctor text/JSON parity for evaluator and reason metadata',
  );
});

test('active docs reserve legacy attribution to the README provenance section only', () => {
  const readme = readUtf8(path.join(REPO_ROOT, 'README.md'));
  const provenanceStart = readme.indexOf('## Provenance');
  const nextSectionStart = readme.indexOf('## How It Works');

  assert.notEqual(provenanceStart, -1, 'README.md should define a Provenance section');
  assert.notEqual(nextSectionStart, -1, 'README.md should define the next section after Provenance');
  assert.ok(nextSectionStart > provenanceStart, 'README.md should keep Provenance before How It Works');

  const readmeOutsideProvenance = `${readme.slice(0, provenanceStart)}${readme.slice(nextSectionStart)}`;
  assert.doesNotMatch(readmeOutsideProvenance, LEGACY_ACTIVE_DOC_PATTERN, 'README.md should keep legacy naming inside the Provenance section only');

  for (const relativePath of ACTIVE_DOC_PATHS) {
    const content = readUtf8(path.join(REPO_ROOT, relativePath));
    assert.doesNotMatch(content, LEGACY_ACTIVE_DOC_PATTERN, `${relativePath} should not mention the legacy product in active docs`);
  }
});

test('repo-local config and historical docs use the featureforge archive layout', () => {
  assert.equal(fs.existsSync(path.join(REPO_ROOT, '.featureforge/config.yaml')), true, '.featureforge/config.yaml should exist');
  assert.equal(fs.existsSync(path.join(REPO_ROOT, `.${RETIRED_PRODUCT}/config.yaml`)), false, `.${RETIRED_PRODUCT}/config.yaml should be removed from the active repo`);

  const archiveRoot = path.join(REPO_ROOT, 'docs/archive', RETIRED_PRODUCT);
  assert.equal(fs.existsSync(path.join(archiveRoot, 'specs/2026-03-22-runtime-integration-hardening-design.md')), true, `archived historical specs should move under docs/archive/${RETIRED_PRODUCT}/specs`);
  assert.equal(fs.existsSync(path.join(archiveRoot, 'plans/2026-03-22-runtime-integration-hardening.md')), true, `archived historical plans should move under docs/archive/${RETIRED_PRODUCT}/plans`);
  assert.equal(fs.existsSync(path.join(archiveRoot, 'execution-evidence/2026-03-22-runtime-integration-hardening-r1-evidence.md')), true, `archived historical execution evidence should move under docs/archive/${RETIRED_PRODUCT}/execution-evidence`);
  assert.equal(fs.existsSync(path.join(REPO_ROOT, 'docs', RETIRED_PRODUCT)), false, `docs/${RETIRED_PRODUCT} should be removed after the archive move`);
});
