#[path = "support/files.rs"]
mod files_support;
#[path = "support/process.rs"]
mod process_support;

use featureforge::contracts::evidence::read_execution_evidence;
use featureforge::contracts::harness::{
    BlockingEvidenceReference, DowngradeReasonClass, ExecutionTopologyDowngradeRecord,
    WorktreeLease, WorktreeLeaseState, read_evaluation_report, read_evidence_artifact,
    read_execution_contract, read_execution_handoff,
};
use featureforge::contracts::packet::{
    TaskPacket, build_harness_contract_provenance, build_task_packet_with_timestamp,
};
use featureforge::contracts::plan::parse_plan_file;
use featureforge::contracts::spec::parse_spec_file;
use featureforge::execution::observability::HarnessTelemetryCounters;
use featureforge::execution::observability::validate_execution_topology_downgrade_record;
use files_support::write_file;
use process_support::run_checked;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tempfile::TempDir;

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-25-featureforge-execution-harness.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md";
const EXPECTED_TELEMETRY_COUNTER_KEYS: &[&str] = &[
    "phase_transition_count",
    "blocked_state_entries_by_reason",
    "gate_failures_by_gate",
    "retry_count",
    "pivot_count",
    "authoritative_mutation_count",
    "evaluator_outcomes",
    "ordering_gap_count",
    "replay_accepted_count",
    "replay_conflict_count",
    "write_authority_conflict_count",
    "write_authority_reclaim_count",
    "repo_state_drift_count",
    "integrity_mismatch_count",
    "partial_mutation_recovery_count",
    "downstream_gate_rejection_count",
];

fn sha256_hex(contents: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(contents.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn init_repo(name: &str) -> (TempDir, TempDir) {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let repo = repo_dir.path();

    run_checked(
        {
            let mut command = Command::new("git");
            command.arg("init").current_dir(repo);
            command
        },
        "git init",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["config", "user.name", "FeatureForge Test"])
                .current_dir(repo);
            command
        },
        "git config user.name",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["config", "user.email", "featureforge-tests@example.com"])
                .current_dir(repo);
            command
        },
        "git config user.email",
    );

    write_file(&repo.join("README.md"), &format!("# {name}\n"));

    run_checked(
        {
            let mut command = Command::new("git");
            command.args(["add", "README.md"]).current_dir(repo);
            command
        },
        "git add README",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command.args(["commit", "-m", "init"]).current_dir(repo);
            command
        },
        "git commit init",
    );

    (repo_dir, state_dir)
}

fn write_approved_spec(repo: &Path) {
    write_file(
        &repo.join(SPEC_REL),
        r#"# Execution Harness Design

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for execution-harness artifact regression coverage.

## Requirement Index

- [REQ-001][behavior] Approved-work provenance must stay exact.
- [REQ-002][behavior] Harness artifacts must keep authoritative ordering.
"#,
    );
}

fn write_approved_plan(repo: &Path) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Execution Harness Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1

## Task 1: Harness artifact contracts

**Spec Coverage:** REQ-001, REQ-002
**Task Outcome:** The runtime can validate artifact provenance and traceability.
**Plan Constraints:**
- Keep the slice focused on artifact contracts.
- Preserve source-plan and source-spec traceability fields.
**Open Questions:** none

**Files:**
- Test: `tests/contracts_execution_harness.rs`

- [ ] **Step 1: Validate contract, evaluation, handoff, and evidence artifacts**
- [ ] **Step 2: Cover minimum schema and satisfaction-rule semantics**
"#
        ),
    );
}

fn task_packet(repo: &Path) -> String {
    let spec = parse_spec_file(repo.join(SPEC_REL)).expect("spec should parse");
    let plan = parse_plan_file(repo.join(PLAN_REL)).expect("plan should parse");
    build_task_packet_with_timestamp(&spec, &plan, 1, "2026-03-25T12:00:00Z")
        .expect("task packet should build")
        .packet_fingerprint
}

fn task_packet_document(repo: &Path) -> TaskPacket {
    let spec = parse_spec_file(repo.join(SPEC_REL)).expect("spec should parse");
    let plan = parse_plan_file(repo.join(PLAN_REL)).expect("plan should parse");
    build_task_packet_with_timestamp(&spec, &plan, 1, "2026-03-25T12:00:00Z")
        .expect("task packet should build")
}

fn git_head_sha(repo: &Path) -> String {
    let output = run_checked(
        {
            let mut command = Command::new("git");
            command.args(["rev-parse", "HEAD"]).current_dir(repo);
            command
        },
        "git rev-parse HEAD",
    );
    String::from_utf8(output.stdout)
        .expect("HEAD sha should be utf-8")
        .trim()
        .to_owned()
}

fn markdown_field(path: &Path, label: &str) -> String {
    let contents = fs::read_to_string(path).expect("artifact should be readable");
    let prefix = format!("**{label}:** ");
    contents
        .lines()
        .find_map(|line| line.strip_prefix(&prefix))
        .unwrap_or_else(|| panic!("missing {label} field in {}", path.display()))
        .trim_matches('`')
        .to_owned()
}

fn markdown_list(values: &[&str]) -> String {
    if values.is_empty() {
        String::from("[]")
    } else {
        values
            .iter()
            .map(|value| format!("- {value}"))
            .collect::<Vec<_>>()
            .join("\n")
    }
}

fn blocking_evidence_reference(value: &str) -> BlockingEvidenceReference {
    BlockingEvidenceReference::try_new(value).expect("valid blocking evidence reference")
}

fn replace_section_between_markers(
    source: &str,
    start_marker: &str,
    end_marker: &str,
    replacement: &str,
) -> String {
    let (before, rest) = source
        .split_once(start_marker)
        .unwrap_or_else(|| panic!("missing start marker `{start_marker}`"));
    let (_, after) = rest
        .split_once(end_marker)
        .unwrap_or_else(|| panic!("missing end marker `{end_marker}`"));
    format!("{before}{start_marker}\n{replacement}\n{end_marker}{after}")
}

fn rewrite_contract_verifiers(contract_path: &Path, verifiers: &[&str]) {
    let source = fs::read_to_string(contract_path).expect("contract should be readable");
    let rewritten = replace_section_between_markers(
        &source,
        "**Verifiers:**",
        "**Evidence Requirements:**",
        &markdown_list(verifiers),
    );
    write_file(contract_path, &rewritten);
}

fn rewrite_first_contract_criterion_verifier_types(contract_path: &Path, verifier_types: &[&str]) {
    let source = fs::read_to_string(contract_path).expect("contract should be readable");
    let rewritten = replace_section_between_markers(
        &source,
        "**Verifier Types:**",
        "**Threshold:**",
        &markdown_list(verifier_types),
    );
    write_file(contract_path, &rewritten);
}

enum ContractArtifactFixture {
    Valid,
    EmptyScope,
    EmptyCriteria,
    EmptyVerifiers,
    UnsupportedSatisfactionRule,
    EmptyEvidenceRequirements,
}

fn write_contract_artifact(
    state_dir: &Path,
    repo: &Path,
    packet_fingerprint: &str,
    fixture: ContractArtifactFixture,
) -> PathBuf {
    let path = state_dir.join(match fixture {
        ContractArtifactFixture::Valid => "artifacts/valid-contract.md",
        ContractArtifactFixture::EmptyScope => "artifacts/invalid-contract-empty-scope.md",
        ContractArtifactFixture::EmptyCriteria => "artifacts/invalid-contract-empty-criteria.md",
        ContractArtifactFixture::EmptyVerifiers => "artifacts/invalid-contract-empty-verifiers.md",
        ContractArtifactFixture::UnsupportedSatisfactionRule => {
            "artifacts/invalid-contract-unsupported-satisfaction-rule.md"
        }
        ContractArtifactFixture::EmptyEvidenceRequirements => {
            "artifacts/valid-contract-empty-evidence-requirements.md"
        }
    });

    let body = match fixture {
        ContractArtifactFixture::Valid => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let spec_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable"),
            );
            format!(
                r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
- Task 1 Step 2
**Requirement IDs:**
- REQ-001
- REQ-002
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Preserve provenance
**Description:** Approved-work provenance remains traceable.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Minimal criterion for the red slice.

### Criterion 2
**Criterion ID:** criterion-2
**Title:** Preserve ordering
**Description:** Harness artifacts remain monotonic.
**Requirement IDs:**
- REQ-002
**Covered Steps:**
- Task 1 Step 2
**Verifier Types:**
- code_quality
**Threshold:** all
**Notes:** Ordering is tracked explicitly.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance
- code_quality

**Evidence Requirements:**
### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** repo
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** All listed evidence is required.

### Evidence Requirement 2
**Evidence Requirement ID:** evidence-2
**Kind:** repo
**Requirement IDs:**
- REQ-002
**Covered Steps:**
- Task 1 Step 2
**Satisfaction Rule:** any_of
**Notes:** Any listed evidence can satisfy the rule.

### Evidence Requirement 3
**Evidence Requirement ID:** evidence-3
**Kind:** repo
**Requirement IDs:**
- REQ-001
- REQ-002
**Covered Steps:**
- Task 1 Step 1
- Task 1 Step 2
**Satisfaction Rule:** per_step
**Notes:** Each covered step needs its own matching evidence.

**Retry Budget:** 2
**Pivot Threshold:** 1
**Reset Policy:** adaptive
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                spec_fingerprint = spec_fingerprint,
            )
        }
        ContractArtifactFixture::EmptyScope => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let spec_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable"),
            );
            format!(
                r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 18
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-empty-scope
**Chunking Strategy:** single_chunk
**Covered Steps:**
[]
**Requirement IDs:**
 - REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Preserve provenance
**Description:** Criterion remains present while scope is empty.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Scope is intentionally empty for operational-empty coverage.
**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** repo
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Supported rule while scope remains empty.

**Retry Budget:** 1
**Pivot Threshold:** 1
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                spec_fingerprint = spec_fingerprint,
            )
        }
        ContractArtifactFixture::EmptyCriteria => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let spec_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable"),
            );
            format!(
                r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 18
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-empty-criteria
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
[]
**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** repo
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Criteria are intentionally empty.

**Retry Budget:** 1
**Pivot Threshold:** 1
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                spec_fingerprint = spec_fingerprint,
            )
        }
        ContractArtifactFixture::EmptyVerifiers => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let spec_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable"),
            );
            format!(
                r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 18
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-empty-verifiers
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Preserve provenance
**Description:** Verifier declarations are intentionally empty.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Verifier declarations are intentionally empty.
**Non Goals:**
- none

**Verifiers:**
[]

**Evidence Requirements:**
### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** repo
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Verifier declarations are intentionally empty.

**Retry Budget:** 1
**Pivot Threshold:** 1
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                spec_fingerprint = spec_fingerprint,
            )
        }
        ContractArtifactFixture::UnsupportedSatisfactionRule => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let spec_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable"),
            );
            format!(
                r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 18
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-unsupported-rule
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Preserve provenance
**Description:** Rule vocabulary is validated directly.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Rule vocabulary is validated directly.
**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
### Evidence Requirement 1
**Evidence Requirement ID:** evidence-unsupported
**Kind:** repo
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** maybe_one
**Notes:** Unsupported on purpose.

**Retry Budget:** 1
**Pivot Threshold:** 1
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                spec_fingerprint = spec_fingerprint,
            )
        }
        ContractArtifactFixture::EmptyEvidenceRequirements => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let spec_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(SPEC_REL)).expect("spec should be readable"),
            );
            format!(
                r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 2
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-empty-evidence
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Preserve provenance
**Description:** Contract remains valid with no extra evidence requirements.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Explicit empty-list handling is required.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
[]

**Retry Budget:** 2
**Pivot Threshold:** 1
**Reset Policy:** adaptive
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                spec_fingerprint = spec_fingerprint,
            )
        }
    };

    let contract_fingerprint = sha256_hex(&body.replace("__CONTRACT_FINGERPRINT__", ""));
    let content = body.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint);
    write_file(&path, &content);
    path
}

enum EvaluationArtifactFixture {
    Valid,
    UnsupportedVersion,
}

fn write_evaluation_artifact(
    state_dir: &Path,
    repo: &Path,
    contract_fingerprint: &str,
    packet_fingerprint: &str,
    fixture: EvaluationArtifactFixture,
) -> PathBuf {
    let path = state_dir.join(match fixture {
        EvaluationArtifactFixture::Valid => "artifacts/valid-evaluation.md",
        EvaluationArtifactFixture::UnsupportedVersion => "artifacts/invalid-evaluation.md",
    });
    let body = match fixture {
        EvaluationArtifactFixture::Valid => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            let evidence_ref_fingerprint = sha256_hex("valid evaluation evidence ref");
            format!(
                r#"# Evaluation Report

**Report Version:** 1
**Authoritative Sequence:** 19
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Contract Fingerprint:** `{contract_fingerprint}`
**Evaluator Kind:** spec_compliance
**Verdict:** pass
**Criterion Results:**
### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Provenance fields are present.
**Evidence Refs:**
- `{evidence_ref_fingerprint}`
**Severity:** low

**Affected Steps:**
[]
**Evidence Refs:**
### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** artifact_ref
**Source:** artifact:{packet_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
[]
**Summary:** The report points at a durable artifact reference.

**Recommended Action:** continue
**Summary:** The evaluation remains within the active contract.
**Generated By:** featureforge:spec_compliance
**Generated At:** 2026-03-25T12:00:00Z
**Report Fingerprint:** __REPORT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
                evidence_ref_fingerprint = evidence_ref_fingerprint,
            )
        }
        EvaluationArtifactFixture::UnsupportedVersion => {
            let plan_fingerprint = sha256_hex(
                &fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable"),
            );
            format!(
                r#"# Evaluation Report

**Report Version:** 99
**Authoritative Sequence:** 20
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Contract Fingerprint:** `{contract_fingerprint}`
**Evaluator Kind:** spec_compliance
**Verdict:** pass
**Criterion Results:**
### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Unsupported version on purpose.
**Evidence Refs:**
- missing-source
**Severity:** medium

**Affected Steps:**
- Task 1 Step 1
**Evidence Refs:**
### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** artifact_ref
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-1
**Summary:** Missing source and version mismatch are deliberate.

**Recommended Action:** continue
**Summary:** The invalid fixture should fail closed.
**Generated By:** featureforge:spec_compliance
**Generated At:** 2026-03-25T12:00:00Z
**Report Fingerprint:** __REPORT_FINGERPRINT__
"#,
                plan_fingerprint = plan_fingerprint,
            )
        }
    };

    let report_fingerprint = sha256_hex(&body.replace("__REPORT_FINGERPRINT__", ""));
    let content = body.replace("__REPORT_FINGERPRINT__", &report_fingerprint);
    write_file(&path, &content);
    path
}

fn write_handoff_artifact(
    state_dir: &Path,
    _repo: &Path,
    contract_fingerprint: &str,
    valid: bool,
) -> PathBuf {
    let path = state_dir.join(if valid {
        "artifacts/valid-handoff.md"
    } else {
        "artifacts/invalid-handoff.md"
    });
    let body = if valid {
        format!(
            r#"# Execution Handoff

**Handoff Version:** 1
**Authoritative Sequence:** 21
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Contract Fingerprint:** `{contract_fingerprint}`
**Harness Phase:** handoff_required
**Chunk ID:** chunk-1
**Satisfied Criteria:**
- criterion-1
**Open Criteria:**
[]
**Open Findings:**
[]
**Files Touched:**
- tests/contracts_execution_harness.rs
- docs/featureforge/plans/2026-03-25-featureforge-execution-harness.md
**Next Action:** Resume Task 1 Step 2.
**Workspace Notes:** The run can resume without losing provenance.
**Commands Run:**
- cargo test --test contracts_execution_harness
**Risks:**
- none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Handoff Fingerprint:** __HANDOFF_FINGERPRINT__
"#
        )
    } else {
        format!(
            r#"# Execution Handoff

**Handoff Version:** 1
**Authoritative Sequence:** 22
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Contract Fingerprint:** `{contract_fingerprint}`
**Harness Phase:** handoff_required
**Chunk ID:** chunk-1
**Satisfied Criteria:**
- criterion-1
**Open Criteria:**
- criterion-2
**Open Findings:**
- The fixture is missing the concrete next action.
**Files Touched:**
- tests/contracts_execution_harness.rs
**Next Action:**
**Workspace Notes:** This handoff is intentionally malformed.
**Commands Run:**
- cargo test --test contracts_execution_harness
**Risks:**
- next action is blank on purpose
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Handoff Fingerprint:** __HANDOFF_FINGERPRINT__
"#
        )
    };

    let handoff_fingerprint = sha256_hex(&body.replace("__HANDOFF_FINGERPRINT__", ""));
    let content = body.replace("__HANDOFF_FINGERPRINT__", &handoff_fingerprint);
    write_file(&path, &content);
    path
}

fn write_evidence_artifact(state_dir: &Path, repo: &Path, valid: bool) -> PathBuf {
    let path = state_dir.join(if valid {
        "artifacts/valid-evidence.md"
    } else {
        "artifacts/invalid-evidence.md"
    });
    let head_sha = git_head_sha(repo);
    let captured_content = if valid {
        "TRACE: durable reread snapshot\n- task 1 step 1\n- task 1 step 2\n"
    } else {
        "TRACE: invalid durable reread snapshot\n"
    };
    let captured_content_fingerprint = sha256_hex(captured_content);
    let worktree_fingerprint = sha256_hex(&format!("{head_sha}:{captured_content_fingerprint}"));
    let body = if valid {
        format!(
            r#"# Evidence Artifact

**Evidence Artifact Version:** 1
**Evidence Artifact Fingerprint:** __EVIDENCE_ARTIFACT_FINGERPRINT__
**Evidence Kind:** repo
**Source Locator:** repo:tests/contracts_execution_harness.rs#L1
**Repo State Baseline Head SHA:** {head_sha}
**Repo State Baseline Worktree Fingerprint:** {worktree_fingerprint}
**Relative Path:** tests/contracts_execution_harness.rs
**Captured Content Fingerprint:** {captured_content_fingerprint}
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z

## Captured Content

{captured_content}
"#
        )
    } else {
        format!(
            r#"# Evidence Artifact

**Evidence Artifact Version:** 99
**Evidence Artifact Fingerprint:** __EVIDENCE_ARTIFACT_FINGERPRINT__
**Evidence Kind:** repo
**Source Locator:** repo:tests/contracts_execution_harness.rs#L1
**Repo State Baseline Head SHA:** {head_sha}
**Repo State Baseline Worktree Fingerprint:** {worktree_fingerprint}
**Relative Path:** tests/contracts_execution_harness.rs
**Captured Content Fingerprint:** {captured_content_fingerprint}
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z

## Captured Content

{captured_content}
"#
        )
    };

    let evidence_fingerprint = sha256_hex(&body.replace("__EVIDENCE_ARTIFACT_FINGERPRINT__", ""));
    let content = body.replace("__EVIDENCE_ARTIFACT_FINGERPRINT__", &evidence_fingerprint);
    write_file(&path, &content);
    path
}

fn harness_fixture(name: &str) -> (TempDir, TempDir, String) {
    let (repo_dir, state_dir) = init_repo(name);
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_approved_plan(repo);
    let packet_fingerprint = task_packet(repo);
    (repo_dir, state_dir, packet_fingerprint)
}

#[test]
fn contract_parser_preserves_provenance_sequence_and_supported_satisfaction_rules() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-valid-contract");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let contract =
        read_execution_contract(&contract_path).expect("valid contract artifact should parse");
    let json = serde_json::to_value(contract).expect("contract should be serializable");

    assert_eq!(json["authoritative_sequence"], Value::from(17));
    assert_eq!(json["source_spec_path"], Value::String(SPEC_REL.to_owned()));
    assert_eq!(json["source_plan_path"], Value::String(PLAN_REL.to_owned()));
    assert_eq!(
        json["source_task_packet_fingerprints"],
        Value::Array(vec![Value::String(packet_fingerprint)])
    );

    let rules = json["evidence_requirements"]
        .as_array()
        .expect("evidence_requirements should be an array")
        .iter()
        .map(|entry| {
            entry["satisfaction_rule"]
                .as_str()
                .expect("satisfaction_rule should serialize as string")
        })
        .collect::<Vec<_>>();
    assert_eq!(rules, vec!["all_of", "any_of", "per_step"]);
}

#[test]
fn contract_parser_rejects_operationally_empty_scope() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-empty-scope");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::EmptyScope,
    );
    let error =
        read_execution_contract(&contract_path).expect_err("empty-scope contract should fail");
    assert!(
        error.message().contains("empty scope"),
        "operationally empty scope should be rejected explicitly"
    );
}

#[test]
fn contract_parser_rejects_operationally_empty_criteria() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-empty-criteria");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::EmptyCriteria,
    );
    let error =
        read_execution_contract(&contract_path).expect_err("empty-criteria contract should fail");
    assert!(
        error.message().contains("empty criteria"),
        "operationally empty criteria should be rejected explicitly"
    );
}

#[test]
fn contract_parser_rejects_operationally_empty_verifiers() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-empty-verifiers");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::EmptyVerifiers,
    );
    let error =
        read_execution_contract(&contract_path).expect_err("empty-verifiers contract should fail");
    assert!(
        error.message().contains("empty verifier"),
        "operationally empty verifier declarations should be rejected explicitly"
    );
}

#[test]
fn contract_parser_rejects_unsupported_top_level_verifier_kind() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-unsupported-verifier-kind");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    rewrite_contract_verifiers(&contract_path, &["spec_compliance", "invented_evaluator"]);

    let error = read_execution_contract(&contract_path)
        .expect_err("unsupported verifier kind should fail parser validation");
    assert!(
        error.message().contains("unsupported evaluator"),
        "unsupported top-level verifiers should fail closed with an explicit evaluator-kind error"
    );
}

#[test]
fn contract_parser_rejects_criterion_verifier_kind_not_declared_top_level() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-undeclared-verifier-kind");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    rewrite_contract_verifiers(&contract_path, &["code_quality"]);

    let error = read_execution_contract(&contract_path)
        .expect_err("undeclared criterion verifier kind should fail parser validation");
    assert!(
        error.message().contains("undeclared"),
        "criterion verifier kinds not declared in top-level verifiers should fail closed"
    );
}

#[test]
fn contract_parser_rejects_criterion_with_multiple_verifier_owners() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-shared-criterion");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    rewrite_first_contract_criterion_verifier_types(
        &contract_path,
        &["spec_compliance", "code_quality"],
    );

    let error = read_execution_contract(&contract_path)
        .expect_err("shared criterion verifier ownership should fail parser validation");
    assert!(
        error
            .message()
            .contains("invalid_criterion_verifier_owner_count"),
        "criterion verifier ownership must be exactly one evaluator kind"
    );
}

#[test]
fn contract_parser_rejects_criterion_with_empty_verifier_owners() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-ownerless-criterion");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    rewrite_first_contract_criterion_verifier_types(&contract_path, &[]);

    let error = read_execution_contract(&contract_path)
        .expect_err("ownerless criterion verifier ownership should fail parser validation");
    assert!(
        error
            .message()
            .contains("invalid_criterion_verifier_owner_count"),
        "criterion verifier ownership must be exactly one evaluator kind"
    );
}

#[test]
fn contract_parser_preserves_explicit_empty_evidence_requirements_list() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-contract-empty-evidence-requirements");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::EmptyEvidenceRequirements,
    );
    let contract = read_execution_contract(&contract_path)
        .expect("contract with explicit empty evidence_requirements should parse");
    let json = serde_json::to_value(contract).expect("contract should be serializable");

    assert_eq!(json["evidence_requirements"], json!([]));
}

#[test]
fn contract_parser_rejects_unsupported_satisfaction_rule_with_reason_mapping() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-contract-unsupported-rule");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::UnsupportedSatisfactionRule,
    );
    let error = read_execution_contract(&contract_path)
        .expect_err("unsupported satisfaction_rule should fail parser validation");

    assert!(
        error
            .message()
            .contains("invalid_evidence_satisfaction_rule"),
        "unsupported satisfaction_rule should map to the stable machine-readable reason"
    );
}

#[test]
fn evaluation_parser_preserves_authoritative_sequence_and_explicit_empty_lists() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-valid-evaluation");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let contract_fingerprint = markdown_field(&contract_path, "Contract Fingerprint");
    let report_path = write_evaluation_artifact(
        state,
        repo,
        &contract_fingerprint,
        &packet_fingerprint,
        EvaluationArtifactFixture::Valid,
    );
    let report =
        read_evaluation_report(&report_path).expect("valid evaluation artifact should parse");
    let json = serde_json::to_value(report).expect("evaluation should be serializable");

    assert_eq!(json["authoritative_sequence"], Value::from(19));
    assert_eq!(json["affected_steps"], json!([]));
    assert_eq!(
        json["evidence_refs"][0]["evidence_requirement_ids"],
        json!([])
    );
}

#[test]
fn evaluation_parser_rejects_unsupported_report_version() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-evaluation");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let contract_fingerprint = markdown_field(&contract_path, "Contract Fingerprint");
    let report_path = write_evaluation_artifact(
        state,
        repo,
        &contract_fingerprint,
        &packet_fingerprint,
        EvaluationArtifactFixture::UnsupportedVersion,
    );
    let error = read_evaluation_report(&report_path)
        .expect_err("unsupported report_version should fail parser validation");

    assert!(
        error.message().contains("report_version"),
        "unsupported report versions should fail with report_version diagnostics"
    );
}

#[test]
fn handoff_parser_preserves_authoritative_sequence_and_explicit_empty_lists() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-valid-handoff");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let contract_fingerprint = markdown_field(&contract_path, "Contract Fingerprint");
    let handoff_path = write_handoff_artifact(state, repo, &contract_fingerprint, true);
    let handoff = read_execution_handoff(&handoff_path).expect("valid handoff should parse");
    let json = serde_json::to_value(handoff).expect("handoff should be serializable");

    assert_eq!(json["authoritative_sequence"], Value::from(21));
    assert_eq!(json["open_criteria"], json!([]));
    assert_eq!(json["open_findings"], json!([]));
    assert_eq!(
        json["commands_run"][0],
        Value::String(String::from(
            "cargo test --test contracts_execution_harness"
        ))
    );
}

#[test]
fn handoff_parser_rejects_missing_concrete_next_action() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-handoff");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let contract_fingerprint = markdown_field(&contract_path, "Contract Fingerprint");
    let handoff_path = write_handoff_artifact(state, repo, &contract_fingerprint, false);
    let error = read_execution_handoff(&handoff_path)
        .expect_err("handoff with blank next_action should fail parser validation");

    assert!(
        error.message().contains("next action"),
        "missing concrete next action should be rejected explicitly"
    );
}

#[test]
fn evidence_artifact_parser_preserves_repo_state_traceability_fields() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-valid-evidence");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let _contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let evidence_path = write_evidence_artifact(state, repo, true);
    let evidence =
        read_evidence_artifact(&evidence_path).expect("valid evidence artifact should parse");
    let json = serde_json::to_value(evidence).expect("evidence should be serializable");

    assert_eq!(json["evidence_artifact_version"], Value::from(1));
    assert_eq!(
        json["source_locator"],
        Value::String(String::from("repo:tests/contracts_execution_harness.rs#L1"))
    );
    assert_eq!(
        json["relative_path"],
        Value::String(String::from("tests/contracts_execution_harness.rs"))
    );
    assert!(
        json["repo_state_baseline_head_sha"]
            .as_str()
            .expect("head sha should be a string")
            .len()
            >= 40
    );
    assert!(
        json["repo_state_baseline_worktree_fingerprint"]
            .as_str()
            .expect("worktree fingerprint should be a string")
            .len()
            >= 64
    );
}

#[test]
fn evidence_artifact_parser_rejects_unsupported_version() {
    let (repo_dir, state_dir, packet_fingerprint) =
        harness_fixture("contracts-harness-invalid-evidence");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let _contract_path = write_contract_artifact(
        state,
        repo,
        &packet_fingerprint,
        ContractArtifactFixture::Valid,
    );
    let evidence_path = write_evidence_artifact(state, repo, false);
    let error = read_evidence_artifact(&evidence_path)
        .expect_err("unsupported evidence_artifact_version should fail parser validation");

    assert!(
        error.message().contains("evidence_artifact_version"),
        "unsupported evidence artifact versions should fail with evidence_artifact_version diagnostics"
    );
}

#[test]
fn execution_evidence_parser_preserves_harness_provenance_fields_when_present() {
    let (repo_dir, state_dir, _packet_fingerprint) =
        harness_fixture("contracts-harness-execution-evidence-harness-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let evidence_path = state.join("artifacts/valid-execution-evidence.md");
    let head_sha = git_head_sha(repo);
    let worktree_fingerprint = sha256_hex("harness-worktree-provenance");

    write_file(
        &evidence_path,
        &format!(
            r#"# Execution Evidence: execution-harness

**Plan Path:** {PLAN_REL}
**Plan Revision:** 1
**Source Spec Path:** {SPEC_REL}
**Source Spec Revision:** 2

## Step Evidence

### Task 1 Step 1
**Status:** Completed
**Claim:** Harness provenance is attached to execution evidence.
**Source Contract Path:** artifacts/contract-17.md
**Source Contract Fingerprint:** `contract-fingerprint-17`
**Source Evaluation Report Fingerprint:** `evaluation-fingerprint-19`
**Evaluator Verdict:** fail
**Failing Criterion IDs:**
- criterion-1
- criterion-2
**Source Handoff Fingerprint:** `handoff-fingerprint-21`
**Repo State Baseline Head SHA:** {head_sha}
**Repo State Baseline Worktree Fingerprint:** {worktree_fingerprint}
"#
        ),
    );

    let evidence =
        read_execution_evidence(&evidence_path).expect("execution evidence should parse");
    let step = evidence
        .steps
        .first()
        .expect("execution evidence should contain one step");

    assert_eq!(
        step.source_contract_path.as_deref(),
        Some("artifacts/contract-17.md")
    );
    assert_eq!(
        step.source_contract_fingerprint.as_deref(),
        Some("contract-fingerprint-17")
    );
    assert_eq!(
        step.source_evaluation_report_fingerprint.as_deref(),
        Some("evaluation-fingerprint-19")
    );
    assert_eq!(step.evaluator_verdict.as_deref(), Some("fail"));
    assert_eq!(
        step.failing_criterion_ids,
        vec![String::from("criterion-1"), String::from("criterion-2")]
    );
    assert_eq!(
        step.source_handoff_fingerprint.as_deref(),
        Some("handoff-fingerprint-21")
    );
    assert_eq!(
        step.repo_state_baseline_head_sha.as_deref(),
        Some(head_sha.as_str())
    );
    assert_eq!(
        step.repo_state_baseline_worktree_fingerprint.as_deref(),
        Some(worktree_fingerprint.as_str())
    );
}

#[test]
fn task_packet_helper_builds_harness_contract_provenance_for_matching_packets() {
    let (repo_dir, _state_dir, _packet_fingerprint) =
        harness_fixture("contracts-harness-packet-provenance-helper");
    let packet = task_packet_document(repo_dir.path());
    let expected_fingerprint = packet.packet_fingerprint.clone();

    let provenance = build_harness_contract_provenance(&[packet])
        .expect("matching packet provenance should build for harness contracts");

    assert_eq!(provenance.source_plan_path, PLAN_REL);
    assert_eq!(provenance.source_spec_path, SPEC_REL);
    assert_eq!(
        provenance.source_task_packet_fingerprints,
        vec![expected_fingerprint]
    );
}

#[test]
fn task_packet_helper_rejects_mismatched_plan_or_spec_provenance() {
    let (repo_dir, _state_dir, _packet_fingerprint) =
        harness_fixture("contracts-harness-packet-provenance-mismatch");
    let first = task_packet_document(repo_dir.path());
    let mut mismatched = first.clone();
    mismatched.source_spec_revision += 1;

    let error = build_harness_contract_provenance(&[first, mismatched])
        .expect_err("mismatched packet provenance should fail closed");

    assert!(
        error.message().contains("task packet provenance"),
        "mismatched packet provenance should return a clear provenance mismatch diagnostic"
    );
}

#[test]
fn telemetry_counters_default_serialization_matches_exact_counter_key_vocabulary() {
    let counters_json = serde_json::to_value(HarnessTelemetryCounters::default())
        .expect("HarnessTelemetryCounters should serialize");
    let counter_object = counters_json
        .as_object()
        .expect("HarnessTelemetryCounters should serialize to a JSON object");

    let mut serialized_keys: Vec<String> = counter_object.keys().cloned().collect();
    serialized_keys.sort_unstable();
    let mut expected_keys: Vec<String> = EXPECTED_TELEMETRY_COUNTER_KEYS
        .iter()
        .map(|key| (*key).to_owned())
        .collect();
    expected_keys.sort_unstable();

    assert_eq!(
        serialized_keys, expected_keys,
        "HarnessTelemetryCounters serialized key vocabulary drifted from src/execution/observability.rs"
    );
}

#[test]
fn worktree_lease_contract_exposes_closed_lifecycle_vocabulary() {
    let lifecycle_states = WorktreeLeaseState::ALL
        .iter()
        .copied()
        .map(WorktreeLeaseState::as_str)
        .collect::<Vec<_>>();

    assert_eq!(
        lifecycle_states,
        vec![
            "open",
            "review_passed_pending_reconcile",
            "reconciled",
            "cleaned"
        ]
    );
    assert_eq!(
        serde_json::to_value(WorktreeLeaseState::ReviewPassedPendingReconcile)
            .expect("lease state should serialize"),
        Value::String(String::from("review_passed_pending_reconcile"))
    );
}

#[test]
fn worktree_lease_contract_rejects_unknown_lifecycle_state() {
    let lease = json!({
        "lease_version": 1,
        "authoritative_sequence": 21,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_unit_id": "unit-a",
        "source_branch": "feature/task-5",
        "authoritative_integration_branch": "main",
        "worktree_path": "/tmp/task5-worktree",
        "repo_state_baseline_head_sha": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "repo_state_baseline_worktree_fingerprint": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "lease_state": "transitioning",
        "cleanup_state": "pending",
        "reviewed_checkpoint_commit_sha": "cccccccccccccccccccccccccccccccccccccccc",
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T21:15:21Z",
        "lease_fingerprint": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
    });

    assert!(
        serde_json::from_value::<WorktreeLease>(lease).is_err(),
        "unknown lease states must fail closed during deserialization"
    );
}

#[test]
fn worktree_lease_contract_rejects_terminal_state_without_reviewed_checkpoint() {
    for lease_state in ["reconciled", "cleaned"] {
        let lease = json!({
            "lease_version": 1,
            "authoritative_sequence": 21,
            "source_plan_path": PLAN_REL,
            "source_plan_revision": 1,
            "execution_unit_id": "unit-a",
            "source_branch": "feature/task-5",
            "authoritative_integration_branch": "main",
            "worktree_path": "/tmp/task5-worktree",
            "repo_state_baseline_head_sha": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "repo_state_baseline_worktree_fingerprint": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "lease_state": lease_state,
            "cleanup_state": "pending",
            "generated_by": "featureforge:executing-plans",
            "generated_at": "2026-03-27T21:15:21Z",
            "lease_fingerprint": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
        });

        assert!(
            serde_json::from_value::<WorktreeLease>(lease).is_err(),
            "terminal leases must fail closed without reviewed checkpoint provenance"
        );
    }
}

#[test]
fn downgrade_record_contract_exposes_closed_reason_class_vocabulary() {
    let reason_classes = DowngradeReasonClass::ALL
        .iter()
        .copied()
        .map(DowngradeReasonClass::as_str)
        .collect::<Vec<_>>();

    assert_eq!(
        reason_classes,
        vec![
            "write_scope_overlap",
            "dependency_mismatch",
            "workspace_unavailable",
            "reconcile_conflict",
            "baseline_drift",
            "policy_safety_block"
        ]
    );
}

#[test]
fn downgrade_record_contract_rejects_unknown_reason_class() {
    let downgrade = json!({
        "record_version": 1,
        "authoritative_sequence": 88,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_context_key": "dm/todos-task5-lease-lane:main",
        "primary_reason_class": "made_up_reason",
        "detail": {
            "trigger_summary": "parallel execution became unsafe",
            "affected_units": ["task-a"],
            "blocking_evidence": {
                "summary": "conflict observed during reconcile",
                "references": ["artifact:lease-1"]
            },
            "operator_impact": {
                "severity": "warning",
                "changed_or_blocked_stage": "execution",
                "expected_response": "downgrade the slice"
            }
        },
        "rerun_guidance_superseded": false,
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T21:15:21Z",
        "record_fingerprint": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    });

    assert!(
        serde_json::from_value::<ExecutionTopologyDowngradeRecord>(downgrade).is_err(),
        "unknown downgrade reason classes must fail closed during deserialization"
    );
}

#[test]
fn downgrade_record_contract_rejects_unknown_operator_impact_severity() {
    let downgrade = json!({
        "record_version": 1,
        "authoritative_sequence": 88,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_context_key": "dm/todos-task5-lease-lane:main",
        "primary_reason_class": "reconcile_conflict",
        "detail": {
            "trigger_summary": "parallel execution became unsafe",
            "affected_units": ["task-a"],
            "blocking_evidence": {
                "summary": "conflict observed during reconcile",
                "references": ["artifact:lease-1"]
            },
            "operator_impact": {
                "severity": "critical",
                "changed_or_blocked_stage": "execution",
                "expected_response": "downgrade the slice"
            }
        },
        "rerun_guidance_superseded": false,
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T21:15:21Z",
        "record_fingerprint": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    });

    assert!(
        serde_json::from_value::<ExecutionTopologyDowngradeRecord>(downgrade).is_err(),
        "unknown operator impact severity values must fail closed during deserialization"
    );
}

#[test]
fn downgrade_record_contract_rejects_missing_blocking_evidence_summary() {
    let downgrade = ExecutionTopologyDowngradeRecord {
        record_version: 1,
        authoritative_sequence: 88,
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_context_key: String::from("dm/todos-task5-lease-lane:main"),
        primary_reason_class: DowngradeReasonClass::ReconcileConflict,
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("parallel execution became unsafe"),
            affected_units: vec![String::from("task-a")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::new(),
                references: vec![blocking_evidence_reference("artifact:lease-1")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity:
                    featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Warning,
                changed_or_blocked_stage: String::from("execution"),
                expected_response: String::from("downgrade the slice"),
            },
            notes: vec![],
        },
        rerun_guidance_superseded: false,
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        record_fingerprint: String::from(
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        ),
    };

    let error = validate_execution_topology_downgrade_record(&downgrade)
        .expect_err("downgrade records missing blocking evidence summary should fail");
    assert!(
        error.message.contains("blocking_evidence.summary"),
        "structured evidence validation should surface the missing summary field"
    );
}

#[test]
fn downgrade_record_contract_rejects_empty_changed_or_blocked_stage() {
    let downgrade = ExecutionTopologyDowngradeRecord {
        record_version: 1,
        authoritative_sequence: 88,
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_context_key: String::from("dm/todos-task5-lease-lane:main"),
        primary_reason_class: DowngradeReasonClass::ReconcileConflict,
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("parallel execution became unsafe"),
            affected_units: vec![String::from("task-a")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::from("conflict observed during reconcile"),
                references: vec![blocking_evidence_reference("artifact:lease-1")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity:
                    featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Warning,
                changed_or_blocked_stage: String::new(),
                expected_response: String::from("downgrade the slice"),
            },
            notes: vec![],
        },
        rerun_guidance_superseded: false,
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        record_fingerprint: String::from(
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        ),
    };

    let error = validate_execution_topology_downgrade_record(&downgrade)
        .expect_err("downgrade records missing changed_or_blocked_stage should fail");
    assert!(
        error
            .message
            .contains("operator_impact.changed_or_blocked_stage"),
        "structured operator-impact validation should surface the missing stage field"
    );
}

#[test]
fn downgrade_record_contract_rejects_empty_expected_response() {
    let downgrade = ExecutionTopologyDowngradeRecord {
        record_version: 1,
        authoritative_sequence: 88,
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_context_key: String::from("dm/todos-task5-lease-lane:main"),
        primary_reason_class: DowngradeReasonClass::ReconcileConflict,
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("parallel execution became unsafe"),
            affected_units: vec![String::from("task-a")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::from("conflict observed during reconcile"),
                references: vec![blocking_evidence_reference("artifact:lease-1")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity:
                    featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Warning,
                changed_or_blocked_stage: String::from("execution"),
                expected_response: String::new(),
            },
            notes: vec![],
        },
        rerun_guidance_superseded: false,
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        record_fingerprint: String::from(
            "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        ),
    };

    let error = validate_execution_topology_downgrade_record(&downgrade)
        .expect_err("downgrade records missing expected_response should fail");
    assert!(
        error.message.contains("operator_impact.expected_response"),
        "structured operator-impact validation should surface the missing response field"
    );
}

#[test]
fn downgrade_record_contract_rejects_malformed_blocking_evidence_reference() {
    let downgrade = json!({
        "record_version": 1,
        "authoritative_sequence": 88,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_context_key": "dm/todos-task5-lease-lane:main",
        "primary_reason_class": "reconcile_conflict",
        "detail": {
            "trigger_summary": "parallel execution became unsafe",
            "affected_units": ["task-a"],
            "blocking_evidence": {
                "summary": "conflict observed during reconcile",
                "references": ["not-a-locator"]
            },
            "operator_impact": {
                "severity": "warning",
                "changed_or_blocked_stage": "execution",
                "expected_response": "downgrade the slice"
            },
            "notes": []
        },
        "rerun_guidance_superseded": false,
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T21:15:21Z",
        "record_fingerprint": "9999999999999999999999999999999999999999999999999999999999999999"
    });

    assert!(
        serde_json::from_value::<ExecutionTopologyDowngradeRecord>(downgrade).is_err(),
        "malformed evidence locators must fail closed during deserialization"
    );
}
