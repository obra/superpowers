#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use featureforge::contracts::evidence::read_execution_evidence;
use featureforge::diagnostics::FailureClass;
use featureforge::execution::observability::{
    HarnessEventKind, HarnessObservabilityEvent, STABLE_EVENT_KINDS,
};
use featureforge::execution::state::{
    ExecutionRuntime, compute_packet_fingerprint, hash_contract_plan,
};
use featureforge::paths::{
    harness_authoritative_artifact_path, harness_dependency_index_path, harness_state_path,
};
use files_support::write_file;
use json_support::parse_json;
use schemars::schema_for;
use serde_json::{Value, json, to_value};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-25-execution-harness-state.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-25-execution-harness-state-design.md";

const EXPECTED_PUBLIC_HARNESS_PHASES: &[&str] = &[
    "implementation_handoff",
    "execution_preflight",
    "contract_drafting",
    "contract_pending_approval",
    "contract_approved",
    "executing",
    "evaluating",
    "repairing",
    "pivot_required",
    "handoff_required",
    "final_review_pending",
    "qa_pending",
    "document_release_pending",
    "ready_for_branch_completion",
];

const EXPECTED_REASON_CODES: &[&str] = &[
    "waiting_on_required_evaluator",
    "required_evaluator_failed",
    "required_evaluator_blocked",
    "handoff_required",
    "repair_within_budget",
    "pivot_threshold_exceeded",
    "blocked_on_plan_revision",
    "write_authority_conflict",
    "repo_state_drift",
    "stale_provenance",
    "recovering_incomplete_authoritative_mutation",
    "missing_required_evidence",
    "invalid_evidence_satisfaction_rule",
];

const EXPECTED_TASK3_FAILURE_CLASSES: &[&str] = &[
    "IllegalHarnessPhase",
    "StaleProvenance",
    "ContractMismatch",
    "EvaluationMismatch",
    "MissingRequiredHandoff",
    "NonHarnessProvenance",
    "BlockedOnPlanPivot",
    "ConcurrentWriterConflict",
    "UnsupportedArtifactVersion",
    "NonAuthoritativeArtifact",
    "IdempotencyConflict",
    "RepoStateDrift",
    "ArtifactIntegrityMismatch",
    "PartialAuthoritativeMutation",
    "AuthoritativeOrderingMismatch",
    "DependencyIndexMismatch",
];

const EXPECTED_OBSERVABILITY_EVENT_FIELDS: &[&str] = &[
    "event_kind",
    "timestamp",
    "execution_run_id",
    "authoritative_sequence",
    "source_plan_path",
    "source_plan_revision",
    "harness_phase",
    "chunk_id",
    "evaluator_kind",
    "active_contract_fingerprint",
    "evaluation_report_fingerprint",
    "handoff_fingerprint",
    "command_name",
    "gate_name",
    "failure_class",
    "reason_codes",
];

fn run(mut command: Command, context: &str) -> Output {
    command
        .output()
        .unwrap_or_else(|error| panic!("{context} should run: {error}"))
}

fn parse_failure_json(output: &Output, context: &str) -> Value {
    assert!(
        !output.status.success(),
        "{context} should fail closed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    serde_json::from_slice(payload)
        .unwrap_or_else(|error| panic!("{context} should emit valid failure json: {error}"))
}

fn run_checked_output(command: Command, context: &str) -> Output {
    let output = run(command, context);
    assert!(
        output.status.success(),
        "{context} should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    output
}

fn init_repo(name: &str) -> (TempDir, TempDir) {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let repo = repo_dir.path();

    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(repo);
    run_checked_output(git_init, "git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "FeatureForge Test"])
        .current_dir(repo);
    run_checked_output(git_config_name, "git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "featureforge-tests@example.com"])
        .current_dir(repo);
    run_checked_output(git_config_email, "git config user.email");

    write_file(&repo.join("README.md"), &format!("# {name}\n"));

    let mut git_add = Command::new("git");
    git_add.args(["add", "README.md"]).current_dir(repo);
    run_checked_output(git_add, "git add README");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(repo);
    run_checked_output(git_commit, "git commit init");

    (repo_dir, state_dir)
}

fn write_approved_spec(repo: &Path) {
    write_file(
        &repo.join(SPEC_REL),
        r#"# Execution Harness State Design

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for harness state regression coverage.
"#,
    );
}

fn write_plan(repo: &Path, execution_mode: &str) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Execution Harness State Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** {execution_mode}
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Harness state fixture

**Spec Coverage:** REQ-001
**Task Outcome:** Harness state and storage fields are visible before execution starts.
**Plan Constraints:**
- Keep the fixture focused on status and state surfaces.
**Open Questions:** none

**Files:**
- Test: `tests/execution_harness_state.rs`

- [ ] **Step 1: Verify the harness state surface**
"#,
        ),
    );
}

fn run_plan_execution_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    parse_json(&run_plan_execution(repo, state, args, context), context)
}

fn run_plan_execution(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(bin_support::compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    run(command, context)
}

fn harness_state_file_path(repo: &Path, state: &Path) -> PathBuf {
    let runtime = ExecutionRuntime::discover(repo)
        .expect("execution runtime should discover fixture repository");
    harness_state_path(state, &runtime.repo_slug, &runtime.branch_name)
}

fn repo_slug(repo: &Path) -> String {
    ExecutionRuntime::discover(repo)
        .expect("execution runtime should discover fixture repository")
        .repo_slug
}

fn branch_name(repo: &Path) -> String {
    ExecutionRuntime::discover(repo)
        .expect("execution runtime should discover fixture repository")
        .branch_name
}

fn write_harness_state_payload(repo: &Path, state: &Path, payload: &Value) {
    write_file(
        &harness_state_file_path(repo, state),
        &serde_json::to_string_pretty(payload)
            .expect("harness-state fixture payload should serialize"),
    );
}

fn git_head_sha(repo: &Path) -> String {
    let mut command = Command::new("git");
    command.args(["rev-parse", "HEAD"]).current_dir(repo);
    let output = run_checked_output(command, "git rev-parse HEAD");
    String::from_utf8(output.stdout)
        .expect("git rev-parse HEAD should emit utf8")
        .trim()
        .to_owned()
}

fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    format!("{digest:x}")
}

fn write_authoritative_contract_fixture(repo: &Path, state: &Path) -> (String, String) {
    let plan_source =
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable for contract");
    let source_spec_source =
        fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable for contract");
    let plan_fingerprint = hash_contract_plan(&plan_source);
    let source_spec_fingerprint = sha256_hex(source_spec_source.as_bytes());
    let packet_fingerprint = compute_packet_fingerprint(
        PLAN_REL,
        1,
        &plan_fingerprint,
        SPEC_REL,
        2,
        &source_spec_fingerprint,
        1,
        1,
    );

    let template = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 11
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{source_spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-contract-scope
**Title:** Preserve active approved-plan scope
**Description:** Contract fixture stays within the approved plan scope.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Fixture criterion for runtime gate validation.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
[]

**Retry Budget:** 2
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint = sha256_hex(template.replace("__CONTRACT_FINGERPRINT__", "").as_bytes());
    let contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(state, &repo_slug(repo), &branch_name(repo), &contract_file),
        &template.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    (contract_file, contract_fingerprint)
}

fn write_candidate_contract_fixture(repo: &Path, artifact_rel: &str) -> String {
    let plan_source =
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable for contract");
    let source_spec_source =
        fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable for contract");
    let plan_fingerprint = hash_contract_plan(&plan_source);
    let source_spec_fingerprint = sha256_hex(source_spec_source.as_bytes());
    let packet_fingerprint = compute_packet_fingerprint(
        PLAN_REL,
        1,
        &plan_fingerprint,
        SPEC_REL,
        2,
        &source_spec_fingerprint,
        1,
        1,
    );

    let template = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{source_spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-contract-scope
**Title:** Preserve active approved-plan scope
**Description:** Contract fixture stays within the approved plan scope.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Fixture criterion for runtime gate validation.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
[]

**Retry Budget:** 2
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint =
        sha256_hex(template.replace("__CONTRACT_FINGERPRINT__", "").as_bytes());
    write_file(
        &repo.join(artifact_rel),
        &template.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    contract_fingerprint
}

fn accept_execution_preflight(repo: &Path, state: &Path) {
    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", "execution-preflight-fixture"])
        .current_dir(repo);
    run_checked_output(checkout, "git checkout execution-preflight-fixture");

    let preflight = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "execution preflight acceptance for per-step provenance coverage",
    );
    assert_eq!(
        preflight["allowed"],
        Value::Bool(true),
        "execution preflight should allow begin/complete fixtures for per-step provenance coverage, got {preflight}"
    );
}

fn begin_and_complete_single_step(repo: &Path, state: &Path, claim: &str) -> Value {
    let before_begin = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before begin for per-step provenance coverage",
    );
    run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before_begin["execution_fingerprint"]
                .as_str()
                .expect("status should expose execution_fingerprint before begin"),
        ],
        "begin step 1 for per-step provenance coverage",
    );

    let before_complete = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before complete for per-step provenance coverage",
    );
    run_plan_execution_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            claim,
            "--manual-verify-summary",
            "Manual verification summary for per-step provenance coverage.",
            "--file",
            "README.md",
            "--expect-execution-fingerprint",
            before_complete["execution_fingerprint"]
                .as_str()
                .expect("status should expose execution_fingerprint before complete"),
        ],
        "complete step 1 for per-step provenance coverage",
    )
}

fn missing_string_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| object.get(*field).and_then(Value::as_str).is_none())
        .map(str::to_owned)
        .collect()
}

fn missing_or_empty_string_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| !match object.get(*field) {
            Some(Value::String(value)) => !value.is_empty(),
            _ => false,
        })
        .map(str::to_owned)
        .collect()
}

fn missing_or_invalid_nullable_string_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| !match object.get(*field) {
            Some(Value::Null) => true,
            Some(Value::String(value)) => !value.is_empty(),
            _ => false,
        })
        .map(str::to_owned)
        .collect()
}

fn missing_array_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| object.get(*field).and_then(Value::as_array).is_none())
        .map(str::to_owned)
        .collect()
}

fn missing_number_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| object.get(*field).and_then(Value::as_u64).is_none())
        .map(str::to_owned)
        .collect()
}

fn missing_bool_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| object.get(*field).and_then(Value::as_bool).is_none())
        .map(str::to_owned)
        .collect()
}

fn missing_null_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| !object.get(*field).is_some_and(Value::is_null))
        .map(str::to_owned)
        .collect()
}

fn assert_exact_public_harness_phase_set() {
    let spec = include_str!(
        "../docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md"
    );
    let public_harness_phases: Vec<String> = spec
        .lines()
        .scan(false, |in_phase_section, line| {
            let trimmed = line.trim();
            if trimmed == "### Public phase model" {
                *in_phase_section = true;
                return Some(None);
            }
            if *in_phase_section && trimmed.starts_with("### ") {
                *in_phase_section = false;
                return Some(None);
            }
            if *in_phase_section {
                return Some(
                    trimmed
                        .strip_prefix("- `")
                        .and_then(|value| value.strip_suffix('`'))
                        .map(str::to_owned),
                );
            }
            Some(None)
        })
        .flatten()
        .collect();

    assert_eq!(
        public_harness_phases,
        EXPECTED_PUBLIC_HARNESS_PHASES
            .iter()
            .map(|phase| (*phase).to_owned())
            .collect::<Vec<_>>(),
        "status should pin the exact public HarnessPhase vocabulary from the spec"
    );
}

fn assert_reason_code_minimum_vocabulary() {
    let spec = include_str!(
        "../docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md"
    );
    let req_040_line = spec
        .lines()
        .find(|line| line.contains("[REQ-040][behavior]"))
        .expect("spec should include REQ-040 minimum reason-code contract");
    let minimum_reason_code_clause = req_040_line
        .split("covering at least")
        .nth(1)
        .expect("REQ-040 should document the minimum reason-code set after 'covering at least'");
    let spec_minimum_reason_codes: Vec<_> = minimum_reason_code_clause
        .split('`')
        .skip(1)
        .step_by(2)
        .map(str::to_owned)
        .collect();
    let missing_in_spec: Vec<_> = EXPECTED_REASON_CODES
        .iter()
        .filter(|code| !spec_minimum_reason_codes.iter().any(|value| value == *code))
        .copied()
        .collect();
    let missing_in_expected: Vec<_> = spec_minimum_reason_codes
        .iter()
        .filter(|code| !EXPECTED_REASON_CODES.iter().any(|value| value == code))
        .cloned()
        .collect();
    assert!(
        missing_in_spec.is_empty() && missing_in_expected.is_empty(),
        "REQ-040 minimum reason-code vocabulary drifted between local expected set and spec; missing_in_spec: {missing_in_spec:?}; missing_in_expected: {missing_in_expected:?}"
    );
}

fn harness_event_kind_schema_literals() -> Vec<String> {
    fn collect_enum_literals(schema: &Value, literals: &mut Vec<String>) {
        if let Some(values) = schema.get("enum").and_then(Value::as_array) {
            literals.extend(
                values
                    .iter()
                    .map(|value| {
                        value
                            .as_str()
                            .expect("HarnessEventKind schema literals should be strings")
                            .to_owned()
                    })
                    .collect::<Vec<_>>(),
            );
        }
        for keyword in ["oneOf", "anyOf", "allOf"] {
            if let Some(variants) = schema.get(keyword).and_then(Value::as_array) {
                for variant in variants {
                    collect_enum_literals(variant, literals);
                }
            }
        }
    }

    let schema_json =
        to_value(schema_for!(HarnessEventKind)).expect("HarnessEventKind schema should serialize");
    let root_schema = schema_json.get("schema").unwrap_or(&schema_json);
    let mut literals = Vec::new();
    collect_enum_literals(root_schema, &mut literals);
    assert!(
        !literals.is_empty(),
        "HarnessEventKind schema should expose enum literals"
    );
    literals.sort_unstable();
    literals.dedup();
    literals
}

#[test]
fn observability_runtime_surface_matches_literal_event_kind_and_field_corpora() {
    let serialized_event_kinds = harness_event_kind_schema_literals();
    let mut stable_event_kinds: Vec<String> = STABLE_EVENT_KINDS
        .iter()
        .map(|kind| (*kind).to_owned())
        .collect();
    stable_event_kinds.sort_unstable();
    stable_event_kinds.dedup();

    assert_eq!(
        serialized_event_kinds, stable_event_kinds,
        "HarnessEventKind public schema literals drifted from the runtime stable event-kind table"
    );

    let serialized_event = to_value(HarnessObservabilityEvent::new(
        HarnessEventKind::PhaseTransition,
        "2026-03-25T12:00:00Z",
    ))
    .expect("HarnessObservabilityEvent should serialize");
    let event_object = serialized_event
        .as_object()
        .expect("HarnessObservabilityEvent should serialize to a JSON object");

    let mut serialized_fields: Vec<String> = event_object.keys().cloned().collect();
    serialized_fields.sort_unstable();
    let mut expected_fields: Vec<String> = EXPECTED_OBSERVABILITY_EVENT_FIELDS
        .iter()
        .map(|field| (*field).to_owned())
        .collect();
    expected_fields.sort_unstable();
    assert_eq!(
        serialized_fields, expected_fields,
        "HarnessObservabilityEvent field names drifted from the local observability parity corpus"
    );

    let mut nullable_fields: Vec<String> = event_object
        .iter()
        .filter_map(|(field, value)| value.is_null().then(|| field.to_owned()))
        .collect();
    nullable_fields.sort_unstable();
    let mut expected_nullable_fields: Vec<String> = EXPECTED_OBSERVABILITY_EVENT_FIELDS
        .iter()
        .copied()
        .filter(|field| !matches!(*field, "event_kind" | "timestamp" | "reason_codes"))
        .map(str::to_owned)
        .collect();
    expected_nullable_fields.sort_unstable();
    assert_eq!(
        nullable_fields, expected_nullable_fields,
        "HarnessObservabilityEvent required-vs-optional shape drifted in default serialization"
    );
    assert_eq!(
        event_object.get("event_kind").and_then(Value::as_str),
        Some("phase_transition"),
        "event_kind should remain required and snake_case serialized"
    );
    assert_eq!(
        event_object.get("timestamp").and_then(Value::as_str),
        Some("2026-03-25T12:00:00Z"),
        "timestamp should remain required in the serialized observability envelope"
    );
    assert!(
        event_object
            .get("reason_codes")
            .is_some_and(|value| value.as_array().is_some_and(|codes| codes.is_empty())),
        "reason_codes should remain a required machine-readable string array in the serialized observability envelope"
    );
}

#[test]
fn status_exposes_run_identity_policy_snapshot_and_authority_diagnostics_before_execution_starts() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    assert_exact_public_harness_phase_set();
    assert_reason_code_minimum_vocabulary();

    let status = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "plan execution status for harness state",
    );

    let harness_phase = status["harness_phase"]
        .as_str()
        .expect("status should expose harness_phase");
    assert_eq!(
        harness_phase, "implementation_handoff",
        "status should expose the exact pre-execution harness phase"
    );

    let missing_or_invalid_nullable_string_fields = missing_or_invalid_nullable_string_fields(
        &status,
        &[
            "last_final_review_artifact_fingerprint",
            "last_browser_qa_artifact_fingerprint",
            "last_release_docs_artifact_fingerprint",
            "write_authority_holder",
            "write_authority_worktree",
            "repo_state_baseline_head_sha",
            "repo_state_baseline_worktree_fingerprint",
        ],
    );
    assert!(
        missing_or_invalid_nullable_string_fields.is_empty(),
        "status should expose nullable preflight diagnostics as null or non-empty strings, missing/invalid: {missing_or_invalid_nullable_string_fields:?}"
    );

    let missing_non_empty_string_fields =
        missing_or_empty_string_fields(&status, &["chunk_id", "write_authority_state"]);
    assert!(
        missing_non_empty_string_fields.is_empty(),
        "status should expose chunk_id and write_authority_state as non-empty run-scoped strings, missing/invalid: {missing_non_empty_string_fields:?}"
    );

    let missing_string_fields = missing_string_fields(
        &status,
        &[
            "aggregate_evaluation_state",
            "repo_state_drift_state",
            "dependency_index_state",
            "final_review_state",
            "browser_qa_state",
            "release_docs_state",
        ],
    );
    assert!(
        missing_string_fields.is_empty(),
        "status should expose the run-scoped string fields, missing: {missing_string_fields:?}"
    );

    let missing_active_pointer_null_fields = missing_null_fields(
        &status,
        &[
            "active_contract_path",
            "active_contract_fingerprint",
            "last_evaluation_report_path",
            "last_evaluation_report_fingerprint",
            "last_evaluation_evaluator_kind",
        ],
    );
    assert!(
        missing_active_pointer_null_fields.is_empty(),
        "status should keep active pointers authoritative-only before execution starts, missing null fields: {missing_active_pointer_null_fields:?}"
    );

    let missing_array_fields = missing_array_fields(
        &status,
        &[
            "required_evaluator_kinds",
            "completed_evaluator_kinds",
            "pending_evaluator_kinds",
            "non_passing_evaluator_kinds",
            "open_failed_criteria",
            "reason_codes",
        ],
    );
    assert!(
        missing_array_fields.is_empty(),
        "status should expose the run-scoped arrays, missing: {missing_array_fields:?}"
    );

    let missing_prestart_null_fields = missing_null_fields(
        &status,
        &[
            "execution_run_id",
            "chunking_strategy",
            "evaluator_policy",
            "reset_policy",
            "last_evaluation_verdict",
            "review_stack",
        ],
    );
    assert!(
        missing_prestart_null_fields.is_empty(),
        "status should keep pre-start authority fields unset before preflight/evaluation, missing null fields: {missing_prestart_null_fields:?}"
    );

    let missing_number_fields = missing_number_fields(
        &status,
        &[
            "latest_authoritative_sequence",
            "current_chunk_retry_count",
            "current_chunk_retry_budget",
            "current_chunk_pivot_threshold",
        ],
    );
    assert!(
        missing_number_fields.is_empty(),
        "status should expose the run-scoped counters, missing: {missing_number_fields:?}"
    );

    let missing_bool_fields = missing_bool_fields(&status, &["handoff_required"]);
    assert!(
        missing_bool_fields.is_empty(),
        "status should expose the run-scoped booleans, missing: {missing_bool_fields:?}"
    );

    let reason_codes = status["reason_codes"]
        .as_array()
        .expect("status should expose stable reason_codes");
    let non_string_reason_codes: Vec<_> = reason_codes
        .iter()
        .filter(|value| value.as_str().is_none())
        .map(ToString::to_string)
        .collect();
    assert!(
        non_string_reason_codes.is_empty(),
        "status should expose machine-readable reason_codes entries, got non-strings: {non_string_reason_codes:?}"
    );
}

#[test]
fn status_projects_authoritative_state_for_write_repo_dependency_downstream_and_reason_codes() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state-authoritative-projection");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 17,
            "write_authority_state": "held_by_other",
            "write_authority_holder": "controller-B",
            "write_authority_worktree": "worktree-B",
            "repo_state_baseline_head_sha": "1111111111111111111111111111111111111111",
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "drifted",
            "dependency_index_state": "inconsistent",
            "final_review_state": "stale",
            "browser_qa_state": "missing",
            "release_docs_state": "fresh",
            "last_final_review_artifact_fingerprint": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "last_browser_qa_artifact_fingerprint": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "last_release_docs_artifact_fingerprint": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            "reason_codes": ["write_authority_conflict", "blocked_on_plan_revision"]
        }),
    );

    let status = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "plan execution status authoritative projection",
    );

    assert_eq!(status["write_authority_state"], "held_by_other");
    assert_eq!(status["write_authority_holder"], "controller-B");
    assert_eq!(status["write_authority_worktree"], "worktree-B");
    assert_eq!(
        status["repo_state_baseline_head_sha"],
        "1111111111111111111111111111111111111111"
    );
    assert_eq!(
        status["repo_state_baseline_worktree_fingerprint"],
        "2222222222222222222222222222222222222222222222222222222222222222"
    );
    assert_eq!(status["repo_state_drift_state"], "drifted");
    assert_eq!(status["dependency_index_state"], "inconsistent");
    assert_eq!(status["final_review_state"], "stale");
    assert_eq!(status["browser_qa_state"], "missing");
    assert_eq!(status["release_docs_state"], "fresh");
    assert_eq!(
        status["last_final_review_artifact_fingerprint"],
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    assert_eq!(
        status["last_browser_qa_artifact_fingerprint"],
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    assert_eq!(
        status["last_release_docs_artifact_fingerprint"],
        "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
    );
    assert_eq!(
        status["reason_codes"],
        json!(["write_authority_conflict", "blocked_on_plan_revision"])
    );
}

#[test]
fn record_contract_persists_dependency_index_with_authoritative_contract_node() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state-dependency-index-record-contract");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/dependency-index-record-contract.md";
    let contract_fingerprint = write_candidate_contract_fixture(repo, contract_rel);

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let record_json = run_plan_execution_json(
        repo,
        state,
        &["record-contract", "--plan", PLAN_REL, "--contract", contract_rel],
        "record-contract dependency-index persistence fixture",
    );
    assert_eq!(record_json["allowed"], Value::Bool(true));

    let dependency_index_path =
        harness_dependency_index_path(state, &repo_slug(repo), &branch_name(repo));
    assert!(
        dependency_index_path.is_file(),
        "record-contract should persist a durable dependency index at {}",
        dependency_index_path.display()
    );

    let dependency_index: Value = serde_json::from_str(
        &fs::read_to_string(&dependency_index_path)
            .expect("dependency index should be readable after record-contract"),
    )
    .expect("dependency index should remain valid json after record-contract");
    let nodes = dependency_index["nodes"]
        .as_array()
        .expect("dependency index should expose a nodes array");
    let has_authoritative_contract_node = nodes.iter().any(|node| {
        node["artifact_kind"] == "contract"
            && node["artifact_fingerprint"] == contract_fingerprint
            && node["authoritative"] == Value::Bool(true)
    });
    assert!(
        has_authoritative_contract_node,
        "record-contract should index an authoritative contract dependency node for {contract_fingerprint}, got {dependency_index}"
    );
}

#[test]
fn record_contract_persists_observability_event_and_authoritative_mutation_counter() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state-observability-record-contract");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/observability-record-contract.md";
    let contract_fingerprint = write_candidate_contract_fixture(repo, contract_rel);

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let record_json = run_plan_execution_json(
        repo,
        state,
        &["record-contract", "--plan", PLAN_REL, "--contract", contract_rel],
        "record-contract observability persistence fixture",
    );
    assert_eq!(record_json["allowed"], Value::Bool(true));

    let harness_root = harness_state_path(state, &repo_slug(repo), &branch_name(repo))
        .parent()
        .expect("harness state path should always live under a branch-scoped harness root")
        .to_path_buf();
    let events_path = harness_root.join("observability-events.jsonl");
    let telemetry_path = harness_root.join("telemetry-counters.json");

    assert!(
        events_path.is_file(),
        "record-contract should persist a branch-scoped observability event sink at {}",
        events_path.display()
    );
    assert!(
        telemetry_path.is_file(),
        "record-contract should persist branch-scoped telemetry counters at {}",
        telemetry_path.display()
    );

    let first_event_line = fs::read_to_string(&events_path)
        .expect("observability event sink should be readable after record-contract")
        .lines()
        .find(|line| !line.trim().is_empty())
        .map(str::to_owned)
        .expect("observability event sink should contain at least one structured event line");
    let event_json: Value = serde_json::from_str(&first_event_line)
        .expect("first observability event line should be valid json");
    assert_eq!(
        event_json["event_kind"],
        Value::String("authoritative_mutation_recorded".to_owned()),
        "record-contract should emit authoritative_mutation_recorded in the persisted sink"
    );
    assert_eq!(
        event_json["command_name"],
        Value::String("record-contract".to_owned()),
        "record-contract observability should keep command_name machine-readable"
    );
    assert_eq!(
        event_json["active_contract_fingerprint"],
        Value::String(contract_fingerprint),
        "record-contract observability should carry the active contract fingerprint"
    );

    let telemetry_json: Value = serde_json::from_str(
        &fs::read_to_string(&telemetry_path)
            .expect("telemetry counters sink should be readable after record-contract"),
    )
    .expect("telemetry counters sink should remain valid json after record-contract");
    assert_eq!(
        telemetry_json["authoritative_mutation_count"],
        Value::Number(1_u64.into()),
        "record-contract should increment authoritative_mutation_count exactly once"
    );
}

#[test]
fn status_fails_closed_on_malformed_authoritative_overlay_fields() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state-overlay-validation");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let harness_state = harness_state_file_path(repo, state);
    let malformed_cases = vec![
        (
            "unknown harness_phase value",
            serde_json::json!({
                "schema_version": 1,
                "harness_phase": "unknown_phase"
            }),
        ),
        (
            "malformed active_contract_path value",
            serde_json::json!({
                "schema_version": 1,
                "active_contract_path": "nested/contract-deadbeef.md",
                "active_contract_fingerprint": "deadbeef"
            }),
        ),
        (
            "unknown required evaluator kind",
            serde_json::json!({
                "schema_version": 1,
                "required_evaluator_kinds": ["spec_compliance", "invented_evaluator"]
            }),
        ),
        (
            "unknown last_evaluation_evaluator_kind value",
            serde_json::json!({
                "schema_version": 1,
                "last_evaluation_evaluator_kind": "invented_evaluator"
            }),
        ),
        (
            "unknown last_evaluation_verdict value",
            serde_json::json!({
                "schema_version": 1,
                "last_evaluation_verdict": "invented_verdict"
            }),
        ),
    ];

    for (case_name, payload) in malformed_cases {
        write_file(
            &harness_state,
            &serde_json::to_string_pretty(&payload)
                .expect("malformed overlay fixture should serialize"),
        );
        let output = run_plan_execution(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status malformed authoritative overlay",
        );
        let json = parse_failure_json(
            &output,
            &format!("status should fail closed for {case_name}"),
        );
        assert_eq!(
            json["error_class"],
            Value::String(String::from("MalformedExecutionState")),
            "status should classify {case_name} as malformed authoritative state, got {json}"
        );
    }
}

#[test]
fn diagnostics_exposes_the_minimum_task3_failure_class_taxonomy() {
    let observed = [
        FailureClass::IllegalHarnessPhase.as_str(),
        FailureClass::StaleProvenance.as_str(),
        FailureClass::ContractMismatch.as_str(),
        FailureClass::EvaluationMismatch.as_str(),
        FailureClass::MissingRequiredHandoff.as_str(),
        FailureClass::NonHarnessProvenance.as_str(),
        FailureClass::BlockedOnPlanPivot.as_str(),
        FailureClass::ConcurrentWriterConflict.as_str(),
        FailureClass::UnsupportedArtifactVersion.as_str(),
        FailureClass::NonAuthoritativeArtifact.as_str(),
        FailureClass::IdempotencyConflict.as_str(),
        FailureClass::RepoStateDrift.as_str(),
        FailureClass::ArtifactIntegrityMismatch.as_str(),
        FailureClass::PartialAuthoritativeMutation.as_str(),
        FailureClass::AuthoritativeOrderingMismatch.as_str(),
        FailureClass::DependencyIndexMismatch.as_str(),
    ];
    assert_eq!(
        observed, EXPECTED_TASK3_FAILURE_CLASSES,
        "diagnostics failure-class taxonomy drifted from the Task 3 minimum harness contract"
    );
}

#[test]
fn complete_writes_contract_evaluation_and_repo_state_provenance_into_step_evidence() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state-step-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    accept_execution_preflight(repo, state);

    let (contract_path, contract_fingerprint) = write_authoritative_contract_fixture(repo, state);
    let evaluation_fingerprint =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_owned();
    let failing_criterion_id = "criterion-contract-scope".to_owned();
    let head_sha = git_head_sha(repo);
    let worktree_fingerprint =
        "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc".to_owned();

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 11,
            "active_contract_path": contract_path,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": ["spec_compliance"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["spec_compliance"],
            "aggregate_evaluation_state": "fail",
            "last_evaluation_report_path": format!("evaluation-{evaluation_fingerprint}.md"),
            "last_evaluation_report_fingerprint": evaluation_fingerprint,
            "last_evaluation_evaluator_kind": "spec_compliance",
            "last_evaluation_verdict": "fail",
            "current_chunk_retry_count": 1,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": true,
            "open_failed_criteria": [failing_criterion_id],
            "repo_state_baseline_head_sha": head_sha,
            "repo_state_baseline_worktree_fingerprint": worktree_fingerprint
        }),
    );

    let complete_status = begin_and_complete_single_step(
        repo,
        state,
        "Completed step with expected contract/evaluation provenance.",
    );
    let evidence_path = repo.join(
        complete_status["evidence_path"]
            .as_str()
            .expect("complete status should expose evidence_path"),
    );
    let evidence = read_execution_evidence(&evidence_path)
        .expect("execution evidence should parse after complete");
    let step = evidence
        .steps
        .iter()
        .find(|step| step.task_number == 1 && step.step_number == 1)
        .expect("execution evidence should include task 1 step 1");

    let expected_head_sha = git_head_sha(repo);
    let mut missing_provenance_fields = Vec::new();
    if step.source_contract_path.as_deref() != Some(contract_path.as_str()) {
        missing_provenance_fields.push("source_contract_path");
    }
    if step.source_evaluation_report_fingerprint.as_deref() != Some(evaluation_fingerprint.as_str())
    {
        missing_provenance_fields.push("source_evaluation_report_fingerprint");
    }
    if step.evaluator_verdict.as_deref() != Some("fail") {
        missing_provenance_fields.push("evaluator_verdict");
    }
    if step.failing_criterion_ids != vec![failing_criterion_id] {
        missing_provenance_fields.push("failing_criterion_ids");
    }
    if step.repo_state_baseline_head_sha.as_deref() != Some(expected_head_sha.as_str()) {
        missing_provenance_fields.push("repo_state_baseline_head_sha");
    }
    if step.repo_state_baseline_worktree_fingerprint.as_deref()
        != Some(worktree_fingerprint.as_str())
    {
        missing_provenance_fields.push("repo_state_baseline_worktree_fingerprint");
    }
    assert!(
        missing_provenance_fields.is_empty(),
        "per-step execution evidence should include full contract/evaluation/failing-criterion/repo-state provenance; missing fields: {missing_provenance_fields:?}; parsed step: {step:?}"
    );
}

#[test]
fn reopen_preserves_source_handoff_fingerprint_when_provenance_is_applicable() {
    let (repo_dir, state_dir) = init_repo("execution-harness-state-handoff-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    accept_execution_preflight(repo, state);

    let complete_status = begin_and_complete_single_step(
        repo,
        state,
        "Seed completion before reopen provenance preservation check.",
    );
    let evidence_path = repo.join(
        complete_status["evidence_path"]
            .as_str()
            .expect("complete status should expose evidence_path"),
    );
    let source_handoff_fingerprint =
        "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd".to_owned();
    let seeded_source = fs::read_to_string(&evidence_path)
        .expect("seed execution evidence should be readable before provenance injection");
    let seeded_with_handoff = seeded_source.replace(
        "**Claim:** Seed completion before reopen provenance preservation check.",
        &format!(
            "**Claim:** Seed completion before reopen provenance preservation check.\n**Source Handoff Fingerprint:** `{source_handoff_fingerprint}`"
        ),
    );
    assert_ne!(
        seeded_source, seeded_with_handoff,
        "provenance-injection fixture should modify execution evidence before reopen"
    );
    write_file(&evidence_path, &seeded_with_handoff);

    let seeded_step = read_execution_evidence(&evidence_path)
        .expect("seeded execution evidence should parse before reopen")
        .steps
        .into_iter()
        .find(|step| step.task_number == 1 && step.step_number == 1)
        .expect("seeded execution evidence should include task 1 step 1");
    assert_eq!(
        seeded_step.source_handoff_fingerprint.as_deref(),
        Some(source_handoff_fingerprint.as_str()),
        "seed fixture should carry source handoff fingerprint before reopen"
    );

    let before_reopen = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before reopen provenance preservation check",
    );
    run_plan_execution_json(
        repo,
        state,
        &[
            "reopen",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Reopen fixture after handoff provenance was recorded.",
            "--expect-execution-fingerprint",
            before_reopen["execution_fingerprint"]
                .as_str()
                .expect("status should expose execution_fingerprint before reopen"),
        ],
        "reopen should preserve source handoff provenance when applicable",
    );

    let reopened_step = read_execution_evidence(&evidence_path)
        .expect("execution evidence should parse after reopen")
        .steps
        .into_iter()
        .find(|step| step.task_number == 1 && step.step_number == 1)
        .expect("execution evidence should include task 1 step 1 after reopen");
    assert_eq!(
        reopened_step.source_handoff_fingerprint.as_deref(),
        Some(source_handoff_fingerprint.as_str()),
        "reopen should preserve source handoff fingerprint provenance when applicable"
    );
}
