#[path = "../src/contracts/headers.rs"]
mod headers_support;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use std::time::{SystemTime, UNIX_EPOCH};

use assert_cmd::cargo::CommandCargoExt;
use featureforge::contracts::packet::write_contract_schemas;
use featureforge::contracts::plan::{
    ParallelWorktreeRequirement, PlanFidelityGateReport, PlanFidelityReceipt,
    PlanFidelityReviewerProvenance, PlanFidelityVerification, analyze_plan,
    evaluate_plan_fidelity_receipt_at_path, parse_plan_file, plan_fidelity_receipt_path_for_repo,
};
use featureforge::contracts::runtime::plan_fidelity_receipt_path;
use featureforge::contracts::spec::parse_spec_file;
use featureforge::git::discover_slug_identity;
use serde_json::Value;

const SPEC_REL: &str = "docs/featureforge/specs/2026-03-22-plan-contract-fixture-design.md";
const PLAN_REL: &str = "docs/featureforge/plans/2026-03-22-plan-contract-fixture.md";

fn unique_temp_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock should be after unix epoch")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("featureforge-{label}-{nanos}"));
    fs::create_dir_all(&dir).expect("temp dir should be created");
    dir
}

fn unique_temp_dir_under_docs(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock should be after unix epoch")
        .as_nanos();
    let dir = std::env::temp_dir()
        .join("docs")
        .join(format!("featureforge-{label}-{nanos}"));
    fs::create_dir_all(&dir).expect("temp dir under docs should be created");
    dir
}

fn repo_fixture_path(relative: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join(relative)
}

fn install_fixture(repo_root: &Path, fixture_name: &str, destination_rel: &str) {
    let destination = repo_root.join(destination_rel);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).expect("fixture parent directories should exist");
    }
    fs::copy(
        repo_fixture_path(&format!(
            "tests/codex-runtime/fixtures/plan-contract/{fixture_name}"
        )),
        destination,
    )
    .expect("fixture should copy");
}

fn install_valid_artifacts(repo_root: &Path) {
    install_fixture(repo_root, "valid-spec.md", SPEC_REL);
    install_fixture(repo_root, "valid-plan.md", PLAN_REL);
}

fn install_valid_draft_artifacts(repo_root: &Path) {
    install_valid_artifacts(repo_root);
    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "**Workflow State:** Engineering Approved",
        "**Workflow State:** Draft",
    );
    replace_in_file(
        &plan_path,
        "**Last Reviewed By:** plan-eng-review",
        "**Last Reviewed By:** writing-plans",
    );
}

fn write_plan_fidelity_receipt(path: &Path, receipt: &PlanFidelityReceipt) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("receipt parent directories should exist");
    }
    fs::write(
        path,
        serde_json::to_string_pretty(receipt).expect("receipt should serialize"),
    )
    .expect("receipt should write");
}

struct PlanFidelityReviewArtifactInput<'a> {
    artifact_rel: &'a str,
    plan_path: &'a str,
    plan_revision: u32,
    spec_path: &'a str,
    spec_revision: u32,
    review_verdict: &'a str,
    reviewer_source: &'a str,
    reviewer_id: &'a str,
    verified_surfaces: &'a [&'a str],
}

fn write_plan_fidelity_review_artifact(
    repo_root: &Path,
    input: PlanFidelityReviewArtifactInput<'_>,
) {
    let artifact_path = repo_root.join(input.artifact_rel);
    let plan_fingerprint = featureforge::git::sha256_hex(
        &fs::read(repo_root.join(input.plan_path)).expect("plan fixture should be readable"),
    );
    let spec_fingerprint = featureforge::git::sha256_hex(
        &fs::read(repo_root.join(input.spec_path)).expect("spec fixture should be readable"),
    );
    let verified_requirement_ids = parse_spec_file(repo_root.join(input.spec_path))
        .map(|spec| {
            spec.requirements
                .iter()
                .map(|requirement| requirement.id.clone())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    if let Some(parent) = artifact_path.parent() {
        fs::create_dir_all(parent).expect("review artifact parent directories should exist");
    }
    fs::write(
        artifact_path,
        format!(
            "## Plan Fidelity Review Summary\n\n**Review Stage:** featureforge:plan-fidelity-review\n**Review Verdict:** {review_verdict}\n**Reviewed Plan:** `{plan_path}`\n**Reviewed Plan Revision:** {plan_revision}\n**Reviewed Plan Fingerprint:** {plan_fingerprint}\n**Reviewed Spec:** `{spec_path}`\n**Reviewed Spec Revision:** {spec_revision}\n**Reviewed Spec Fingerprint:** {spec_fingerprint}\n**Reviewer Source:** {reviewer_source}\n**Reviewer ID:** {reviewer_id}\n**Distinct From Stages:** featureforge:writing-plans, featureforge:plan-eng-review\n**Verified Surfaces:** {}\n**Verified Requirement IDs:** {}\n",
            input.verified_surfaces.join(", "),
            verified_requirement_ids.join(", "),
            review_verdict = input.review_verdict,
            plan_path = input.plan_path,
            plan_revision = input.plan_revision,
            spec_path = input.spec_path,
            spec_revision = input.spec_revision,
            reviewer_source = input.reviewer_source,
            reviewer_id = input.reviewer_id,
        ),
    )
    .expect("review artifact should write");
}

fn seed_direct_plan_fidelity_review_artifact(repo_root: &Path) -> (String, String) {
    let artifact_rel = ".featureforge/reviews/plan-fidelity-direct.md";
    write_plan_fidelity_review_artifact(
        repo_root,
        PlanFidelityReviewArtifactInput {
            artifact_rel,
            plan_path: PLAN_REL,
            plan_revision: 1,
            spec_path: SPEC_REL,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-019d",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    let artifact_source = fs::read(repo_root.join(artifact_rel))
        .expect("direct review artifact should be readable after write");
    (
        artifact_rel.to_owned(),
        featureforge::git::sha256_hex(&artifact_source),
    )
}

fn build_matching_plan_fidelity_receipt(repo_root: &Path) -> PlanFidelityReceipt {
    let spec = parse_spec_file(repo_root.join(SPEC_REL)).expect("spec fixture should parse");
    let plan = parse_plan_file(repo_root.join(PLAN_REL)).expect("plan fixture should parse");
    let report = analyze_plan(repo_root.join(SPEC_REL), repo_root.join(PLAN_REL))
        .expect("report should build");
    let (review_artifact_path, review_artifact_fingerprint) =
        seed_direct_plan_fidelity_review_artifact(repo_root);

    PlanFidelityReceipt {
        schema_version: 2,
        receipt_kind: String::from("plan_fidelity_receipt"),
        verdict: String::from("pass"),
        spec_path: spec.path.clone(),
        spec_revision: spec.spec_revision,
        spec_fingerprint: report.spec_fingerprint,
        plan_path: plan.path.clone(),
        plan_revision: plan.plan_revision,
        plan_fingerprint: report.plan_fingerprint,
        review_artifact_path,
        review_artifact_fingerprint,
        reviewer_provenance: PlanFidelityReviewerProvenance {
            review_stage: String::from("featureforge:plan-fidelity-review"),
            reviewer_source: String::from("fresh-context-subagent"),
            reviewer_id: String::from("reviewer-019d"),
            distinct_from_stages: vec![
                String::from("featureforge:writing-plans"),
                String::from("featureforge:plan-eng-review"),
            ],
        },
        verification: PlanFidelityVerification {
            checked_surfaces: vec![
                String::from("requirement_index"),
                String::from("execution_topology"),
            ],
            verified_requirement_ids: spec
                .requirements
                .iter()
                .map(|requirement| requirement.id.clone())
                .collect(),
        },
    }
}

fn evaluate_plan_fidelity_gate(repo_root: &Path, receipt_path: &Path) -> PlanFidelityGateReport {
    let spec = parse_spec_file(repo_root.join(SPEC_REL)).expect("spec fixture should parse");
    let plan = parse_plan_file(repo_root.join(PLAN_REL)).expect("plan fixture should parse");
    evaluate_plan_fidelity_receipt_at_path(&spec, &plan, repo_root, receipt_path)
}

fn run(mut command: Command, context: &str) -> Output {
    command
        .output()
        .unwrap_or_else(|error| panic!("{context} should run: {error}"))
}

fn parse_success_json(output: &Output, context: &str) -> Value {
    assert!(
        output.status.success(),
        "{context} should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stdout)
        .unwrap_or_else(|error| panic!("{context} should emit valid success json: {error}"))
}

fn parse_failure_json(output: &Output, context: &str) -> Value {
    assert!(
        !output.status.success(),
        "{context} should fail, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stderr.is_empty() {
        &output.stdout
    } else {
        &output.stderr
    };
    serde_json::from_slice(payload)
        .unwrap_or_else(|error| panic!("{context} should emit valid failure json: {error}"))
}

fn packet_has_requirement_statement(packet: &Value, expected: &str) -> bool {
    packet["requirement_statements"]
        .as_array()
        .is_some_and(|requirements| {
            requirements
                .iter()
                .any(|requirement| requirement["statement"].as_str() == Some(expected))
        })
}

fn run_helper(repo_root: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
    command
        .current_dir(repo_root)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["plan", "contract"])
        .args(args);
    run(command, context)
}

fn run_rust(repo_root: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
    command
        .current_dir(repo_root)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["plan", "contract"])
        .args(args);
    run(command, context)
}

fn run_rust_from_dir(current_dir: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
    command
        .current_dir(current_dir)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["plan", "contract"])
        .args(args);
    run(command, context)
}

fn run_record_plan_fidelity(
    repo_root: &Path,
    state_dir: &Path,
    args: &[&str],
    context: &str,
) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
    command
        .current_dir(repo_root)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["workflow", "plan-fidelity"])
        .args(args);
    run(command, context)
}

fn replace_in_file(path: &Path, search: &str, replacement: &str) {
    let source = fs::read_to_string(path).expect("fixture should be readable");
    assert!(
        source.contains(search),
        "fixture should contain target text: {search}"
    );
    fs::write(path, source.replacen(search, replacement, 1)).expect("fixture should be writable");
}

fn inline_spec_with_fenced_requirement_index(repo_root: &Path) {
    let spec_path = repo_root.join(SPEC_REL);
    if let Some(parent) = spec_path.parent() {
        fs::create_dir_all(parent).expect("spec fixture parent should exist");
    }
    fs::write(
        spec_path,
        r#"# Plan Contract Fixture Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for plan-contract helper regression coverage.

## Proposed Design

Example:

```markdown
## Requirement Index

- [REQ-999][behavior] Example requirement only.
```

## Requirement Index

- [REQ-001][behavior] Execution-bound specs must include a parseable `Requirement Index`.
- [REQ-002][behavior] Implementation plans must include a parseable `Requirement Coverage Matrix` mapping every indexed requirement to one or more tasks.
- [REQ-003][behavior] FeatureForge must expose `featureforge plan contract` to lint traceability and build canonical task packets.
- [DEC-001][decision] Markdown artifacts remain authoritative and helper output must preserve exact approved statements rather than paraphrase them.
- [NONGOAL-001][non-goal] Do not introduce hidden workflow authority outside repo-visible markdown artifacts.
- [VERIFY-001][verification] Regression coverage must cover missing indexes, missing coverage, unknown IDs, unresolved open questions, malformed task structure, malformed `Files:` blocks, path traversal rejection, and stale packet handling.
"#,
    )
    .expect("inline spec fixture should write");
}

#[test]
fn parse_spec_headers_and_index_exactly() {
    let spec = parse_spec_file(repo_fixture_path(
        "tests/codex-runtime/fixtures/plan-contract/valid-spec.md",
    ))
    .expect("valid spec fixture should parse");

    assert_eq!(spec.workflow_state, "CEO Approved");
    assert_eq!(spec.spec_revision, 1);
    assert_eq!(spec.last_reviewed_by, "plan-ceo-review");
    assert_eq!(spec.requirements.len(), 6);
    assert_eq!(spec.requirements[0].id, "REQ-001");
    assert_eq!(spec.requirements[0].kind, "behavior");
}

#[test]
fn parse_spec_headers_and_index_with_trailing_ceo_review_summary() {
    let repo_root = unique_temp_dir("contract-parse-trailing-ceo-summary");
    install_valid_artifacts(&repo_root);

    let spec_path = repo_root.join(SPEC_REL);
    let source = fs::read_to_string(&spec_path).expect("valid spec fixture should read");
    fs::write(
        &spec_path,
        format!(
            "{source}\n\n## CEO Review Summary\n\n**Review Status:** clear\n**Reviewed At:** 2026-03-24T13:42:28Z\n**Review Mode:** hold_scope\n**Reviewed Spec Revision:** 1\n**Critical Gaps:** 0\n**UI Design Intent Required:** no\n**Outside Voice:** skipped\n"
        ),
    )
    .expect("spec fixture with trailing summary should write");

    let spec = parse_spec_file(&spec_path).expect("spec with trailing summary should parse");
    assert_eq!(spec.workflow_state, "CEO Approved");
    assert_eq!(spec.spec_revision, 1);
    assert_eq!(spec.last_reviewed_by, "plan-ceo-review");
    assert_eq!(spec.requirements.len(), 6);
    assert_eq!(spec.requirements[0].id, "REQ-001");
}

#[test]
fn parsed_artifact_paths_stay_repo_relative_even_when_parent_path_contains_docs() {
    let repo_root = unique_temp_dir_under_docs("contract-parse-repo-relative-paths");
    install_valid_artifacts(&repo_root);

    let spec = parse_spec_file(repo_root.join(SPEC_REL)).expect("spec should parse");
    let plan = parse_plan_file(repo_root.join(PLAN_REL)).expect("plan should parse");

    assert_eq!(spec.path, SPEC_REL);
    assert_eq!(plan.path, PLAN_REL);
}

#[test]
fn shared_header_helper_returns_exact_required_header_values() {
    let source = "\
# Example Artifact
\n\
**Workflow State:** CEO Approved
\n\
**Spec Revision:** 7
\n\
**Source Spec:** `docs/featureforge/specs/example.md`
";

    assert_eq!(
        headers_support::parse_required_header(source, "Workflow State"),
        Some(String::from("CEO Approved"))
    );
    assert_eq!(
        headers_support::parse_required_header(source, "Spec Revision"),
        Some(String::from("7"))
    );
    assert_eq!(
        headers_support::parse_required_header(source, "Source Spec"),
        Some(String::from("`docs/featureforge/specs/example.md`"))
    );
    assert_eq!(
        headers_support::parse_required_header(source, "Missing Header"),
        None
    );
}

#[test]
fn analyze_valid_contract_fixture_reports_clean_coverage() {
    let repo_root = unique_temp_dir("contract-analyze-valid");
    install_valid_artifacts(&repo_root);

    let report = analyze_plan(repo_root.join(SPEC_REL), repo_root.join(PLAN_REL))
        .expect("valid fixture should analyze");

    assert_eq!(report.contract_state, "valid");
    assert_eq!(report.spec_path, SPEC_REL);
    assert_eq!(report.spec_revision, 1);
    assert_eq!(report.plan_path, PLAN_REL);
    assert_eq!(report.plan_revision, 1);
    assert_eq!(report.task_count, 3);
    assert_eq!(report.packet_buildable_tasks, 3);
    assert!(report.coverage_complete);
    assert!(report.open_questions_resolved);
    assert!(report.task_structure_valid);
    assert!(report.files_blocks_valid);
    assert!(report.execution_strategy_present);
    assert!(report.dependency_diagram_present);
    assert!(report.execution_topology_valid);
    assert!(report.serial_hazards_resolved);
    assert!(report.parallel_lane_ownership_valid);
    assert!(report.parallel_workspace_isolation_valid);
    assert_eq!(report.parallel_worktree_groups, vec![vec![2, 3]]);
    assert_eq!(
        report.parallel_worktree_requirements,
        vec![ParallelWorktreeRequirement {
            tasks: vec![2, 3],
            declared_worktrees: 2,
            required_worktrees: 2,
        }]
    );
    assert!(report.reason_codes.is_empty());
    assert!(report.overlapping_write_scopes.is_empty());
    assert!(report.diagnostics.is_empty());
}

#[test]
fn analyze_plan_rejects_missing_execution_strategy() {
    let repo_root = unique_temp_dir("contract-analyze-missing-execution-strategy");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before packet-backed execution splits into lane-owned work.\n- After Task 1, create two worktrees and run Tasks 2 and 3 in parallel:\n  - Task 2 owns the CLI and packaged-binary surfaces for packet-backed execution.\n  - Task 3 owns the prompt and shell-proof surfaces for packet-backed execution.\n\n",
        "",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.execution_strategy_present);
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "missing_execution_strategy")
    );
}

#[test]
fn analyze_plan_rejects_missing_dependency_diagram() {
    let repo_root = unique_temp_dir("contract-analyze-missing-dependency-diagram");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "## Dependency Diagram\n\n```text\nTask 1\n  |\n  +--> Task 2\n  |\n  +--> Task 3\n```\n\n",
        "",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.dependency_diagram_present);
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "missing_dependency_diagram")
    );
}

#[test]
fn analyze_plan_rejects_dependency_diagram_that_lies_about_parallel_edges() {
    let repo_root = unique_temp_dir("contract-analyze-lying-dependency-diagram");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "Task 1\n  |\n  +--> Task 2\n  |\n  +--> Task 3\n",
        "Task 1\n  |\n  v\nTask 2\n",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "dependency_diagram_mismatch")
    );
}

#[test]
fn analyze_plan_rejects_dependency_diagram_with_extra_unplanned_edges() {
    let repo_root = unique_temp_dir("contract-analyze-extra-dependency-edge");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "Task 1\n  |\n  +--> Task 2\n  |\n  +--> Task 3\n",
        "Task 1\n  |\n  +--> Task 2\n  |\n  +--> Task 3\nTask 2 -> Task 3\n",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "dependency_diagram_mismatch")
    );
}

#[test]
fn analyze_plan_rejects_unjustified_serial_execution() {
    let repo_root = unique_temp_dir("contract-analyze-unjustified-serial");
    install_fixture(&repo_root, "valid-serialized-plan.md", PLAN_REL);
    install_fixture(&repo_root, "valid-spec.md", SPEC_REL);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "Both tasks revise the same contract boundary and the plan intentionally keeps that hotspot in one shared branch lane.",
        "",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.serial_hazards_resolved);
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "serial_execution_needs_reason")
    );
}

#[test]
fn analyze_plan_rejects_serial_by_default_topology_without_real_hazard() {
    let repo_root = unique_temp_dir("contract-analyze-serial-by-default");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before packet-backed execution splits into lane-owned work.\n- After Task 1, create two worktrees and run Tasks 2 and 3 in parallel:\n  - Task 2 owns the CLI and packaged-binary surfaces for packet-backed execution.\n  - Task 3 owns the prompt and shell-proof surfaces for packet-backed execution.\n\n",
        "## Execution Strategy\n\n- Execute Tasks 1, 2, and 3 serially. Keep the plan easy to follow in one lane.\n\n",
    );
    replace_in_file(
        &plan_path,
        "Task 1\n  |\n  +--> Task 2\n  |\n  +--> Task 3\n",
        "Task 1\n  |\n  v\nTask 2\n  |\n  v\nTask 3\n",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.serial_hazards_resolved);
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "serial_execution_unproven")
    );
}

#[test]
fn analyze_plan_rejects_parallel_lane_without_ownership_guidance() {
    let repo_root = unique_temp_dir("contract-analyze-missing-parallel-ownership");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "  - Task 3 owns the prompt and shell-proof surfaces for packet-backed execution.\n",
        "",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.parallel_lane_ownership_valid);
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "parallel_lane_missing_ownership")
    );
}

#[test]
fn analyze_plan_rejects_parallel_lane_without_per_task_worktrees() {
    let repo_root = unique_temp_dir("contract-analyze-shared-worktree");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "create two worktrees and run Tasks 2 and 3 in parallel",
        "create one worktree and run Tasks 2 and 3 in parallel",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.parallel_workspace_isolation_valid);
    assert!(!report.execution_topology_valid);
    assert_eq!(
        report.parallel_worktree_requirements,
        vec![ParallelWorktreeRequirement {
            tasks: vec![2, 3],
            declared_worktrees: 1,
            required_worktrees: 2,
        }]
    );
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "parallel_workspace_isolation_mismatch")
    );
}

#[test]
fn analyze_plan_rejects_fake_parallel_hotspots() {
    let repo_root = unique_temp_dir("contract-analyze-fake-parallel-hotspots");
    install_fixture(&repo_root, "fake-parallel-hotspot-plan.md", PLAN_REL);
    install_fixture(&repo_root, "valid-spec.md", SPEC_REL);

    let report = analyze_plan(repo_root.join(SPEC_REL), repo_root.join(PLAN_REL))
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "parallel_hotspot_conflict")
    );
}

#[test]
fn analyze_plan_rejects_invalid_path_traversal_fixture_in_library_path() {
    let repo_root = unique_temp_dir("contract-analyze-library-path-traversal");
    install_fixture(&repo_root, "valid-spec.md", SPEC_REL);
    install_fixture(&repo_root, "invalid-path-traversal-plan.md", PLAN_REL);

    let error = analyze_plan(repo_root.join(SPEC_REL), repo_root.join(PLAN_REL))
        .expect_err("library analyzer should reject path traversal files entries");

    assert_eq!(error.failure_class(), "InstructionParseFailed");
    assert!(error.message().contains("Malformed files block entry"));
}

#[test]
fn analyze_plan_rejects_invalid_plan_headers_in_library_path() {
    let repo_root = unique_temp_dir("contract-analyze-invalid-library-headers");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "**Workflow State:** Engineering Approved",
        "**Workflow State:** Legacy Draft",
    );
    replace_in_file(
        &plan_path,
        "**Execution Mode:** none",
        "**Execution Mode:** made-up-mode",
    );
    replace_in_file(
        &plan_path,
        "**Last Reviewed By:** plan-eng-review",
        "**Last Reviewed By:** somebody-else",
    );

    let error = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect_err("library analyzer should reject invalid plan headers");

    assert_eq!(error.failure_class(), "InstructionParseFailed");
    assert!(error.message().contains("header is missing or malformed"));
}

#[test]
fn analyze_plan_accepts_valid_last_directive_with_immediate_predecessor_edge() {
    let repo_root = unique_temp_dir("contract-analyze-valid-last");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before packet-backed execution splits into lane-owned work.\n- After Task 1, create two worktrees and run Tasks 2 and 3 in parallel:\n  - Task 2 owns the CLI and packaged-binary surfaces for packet-backed execution.\n  - Task 3 owns the prompt and shell-proof surfaces for packet-backed execution.\n\n",
        "## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before reintegration work begins.\n- Execute Task 2 serially after Task 1. It is the reintegration seam before the final gate.\n- Execute Task 3 last as the final ratification gate.\n\n",
    );
    replace_in_file(
        &plan_path,
        "Task 1\n  |\n  +--> Task 2\n  |\n  +--> Task 3\n",
        "Task 1\n  |\n  v\nTask 2\n  |\n  v\nTask 3\n",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "valid");
    assert!(report.execution_topology_valid);
    assert!(report.serial_hazards_resolved);
}

#[test]
fn analyze_plan_requires_last_directive_to_wait_for_all_current_sink_tasks() {
    let repo_root = unique_temp_dir("contract-analyze-last-sinks");
    install_fixture(&repo_root, "valid-spec.md", SPEC_REL);

    let plan_path = repo_root.join(PLAN_REL);
    fs::create_dir_all(
        plan_path
            .parent()
            .expect("custom last-plan fixture should have a parent directory"),
    )
    .expect("custom last-plan fixture parent should exist");
    fs::write(
        &plan_path,
        format!(
            "# Plan Contract Fixture\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{SPEC_REL}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n- REQ-002 -> Task 1\n- REQ-003 -> Task 2, Task 3, Task 4\n- DEC-001 -> Task 1\n- NONGOAL-001 -> Task 4\n- VERIFY-001 -> Task 2, Task 3, Task 4\n\n## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before lane-owned work starts.\n- After Task 1, create two isolated worktrees and run Tasks 2 and 3 in parallel:\n  - Task 2 owns the CLI surface.\n  - Task 3 owns the prompt surface.\n- Execute Task 4 last as the final ratification gate.\n\n## Dependency Diagram\n\n```text\nTask 1 -> Task 2\nTask 1 -> Task 3\nTask 2 -> Task 4\n```\n\n## Task 1: Establish the plan contract\n\n**Spec Coverage:** REQ-001, REQ-002, DEC-001\n**Task Outcome:** Establishes the shared contract boundary.\n**Plan Constraints:**\n- Keep markdown authoritative.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/contracts/plan.rs`\n\n- [ ] **Step 1: Establish the boundary**\n\n## Task 2: Own the CLI surface\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Owns the CLI packet surface.\n**Plan Constraints:**\n- Keep this lane disjoint.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/cli/plan_contract.rs`\n\n- [ ] **Step 1: Land the CLI slice**\n\n## Task 3: Own the prompt surface\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Owns the prompt packet surface.\n**Plan Constraints:**\n- Keep this lane disjoint.\n**Open Questions:** none\n\n**Files:**\n- Modify: `skills/subagent-driven-development/implementer-prompt.md`\n\n- [ ] **Step 1: Land the prompt slice**\n\n## Task 4: Ratify the combined result\n\n**Spec Coverage:** REQ-003, NONGOAL-001, VERIFY-001\n**Task Outcome:** Ratifies the combined result after both lane-owned units finish.\n**Plan Constraints:**\n- Do not begin until every unfinished lane is complete.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/contracts_spec_plan.rs`\n\n- [ ] **Step 1: Ratify the combined result**\n"
        ),
    )
    .expect("custom last-plan fixture should write");

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.execution_topology_valid);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "dependency_diagram_mismatch")
    );
}

#[test]
fn analyze_plan_accepts_parallel_lane_with_isolated_worktree_wording() {
    let repo_root = unique_temp_dir("contract-analyze-isolated-worktree-wording");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "create two worktrees and run Tasks 2 and 3 in parallel",
        "create one isolated worktree per task and run Tasks 2 and 3 in parallel",
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "valid");
    assert!(report.parallel_workspace_isolation_valid);
}

#[test]
fn analyze_plan_accepts_multi_task_serial_reintegration_seam() {
    let repo_root = unique_temp_dir("contract-analyze-serial-reintegration-seam");
    install_fixture(&repo_root, "valid-spec.md", SPEC_REL);
    let plan_path = repo_root.join(PLAN_REL);
    fs::create_dir_all(
        plan_path
            .parent()
            .expect("custom seam-plan fixture should have a parent directory"),
    )
    .expect("custom seam-plan fixture parent should exist");
    fs::write(
        &plan_path,
        format!(
            "# Plan Contract Fixture\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{SPEC_REL}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n- REQ-002 -> Task 1\n- REQ-003 -> Task 2, Task 3, Task 4, Task 5\n- DEC-001 -> Task 1\n- NONGOAL-001 -> Task 5\n- VERIFY-001 -> Task 2, Task 3, Task 4, Task 5\n\n## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before lane-owned work starts.\n- After Task 1, create one isolated worktree per task and run Tasks 2 and 3 in parallel:\n  - Task 2 owns the CLI lane.\n  - Task 3 owns the prompt lane.\n- Execute Tasks 4 and 5 serially after Tasks 2 and 3. They form the reintegration seam before finish gating.\n\n## Dependency Diagram\n\n```text\nTask 1 -> Task 2\nTask 1 -> Task 3\nTask 2 -> Task 4\nTask 3 -> Task 4\nTask 4 -> Task 5\n```\n\n## Task 1: Establish the plan contract\n\n**Spec Coverage:** REQ-001, REQ-002, DEC-001\n**Task Outcome:** Establishes the shared contract boundary.\n**Plan Constraints:**\n- Keep markdown authoritative.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/contracts/plan.rs`\n\n- [ ] **Step 1: Establish the boundary**\n\n## Task 2: Own the CLI lane\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Owns the CLI lane in isolation.\n**Plan Constraints:**\n- Keep this lane disjoint.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/cli/plan_contract.rs`\n\n- [ ] **Step 1: Land the CLI lane**\n\n## Task 3: Own the prompt lane\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Owns the prompt lane in isolation.\n**Plan Constraints:**\n- Keep this lane disjoint.\n**Open Questions:** none\n\n**Files:**\n- Modify: `skills/subagent-driven-development/implementer-prompt.md`\n\n- [ ] **Step 1: Land the prompt lane**\n\n## Task 4: Reintegrate the parallel lanes\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Reintegrates the two parallel lanes into shared glue.\n**Plan Constraints:**\n- Do not begin until Tasks 2 and 3 are complete.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/execution/harness.rs`\n\n- [ ] **Step 1: Reintegrate the parallel lanes**\n\n## Task 5: Ratify the combined result\n\n**Spec Coverage:** REQ-003, NONGOAL-001, VERIFY-001\n**Task Outcome:** Ratifies the combined result after the reintegration seam finishes.\n**Plan Constraints:**\n- Do not begin until Task 4 is complete.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/contracts_spec_plan.rs`\n\n- [ ] **Step 1: Ratify the combined result**\n"
        ),
    )
    .expect("custom seam-plan fixture should write");

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "valid");
    assert!(report.serial_hazards_resolved);
    assert!(report.execution_topology_valid);
}

#[test]
fn analyze_plan_rejects_multi_task_serial_plain_seam_wording() {
    let repo_root = unique_temp_dir("contract-analyze-plain-seam-wording");
    install_fixture(&repo_root, "valid-spec.md", SPEC_REL);

    let plan_path = repo_root.join(PLAN_REL);
    fs::create_dir_all(
        plan_path
            .parent()
            .expect("custom plain-seam fixture should have a parent directory"),
    )
    .expect("custom plain-seam fixture parent should exist");
    fs::write(
        &plan_path,
        format!(
            "# Plan Contract Fixture\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{SPEC_REL}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n- REQ-002 -> Task 1\n- REQ-003 -> Task 2, Task 3, Task 4, Task 5\n- DEC-001 -> Task 1\n- NONGOAL-001 -> Task 5\n- VERIFY-001 -> Task 2, Task 3, Task 4, Task 5\n\n## Execution Strategy\n\n- Execute Task 1 serially. It establishes the contract surface before lane-owned work starts.\n- After Task 1, create one isolated worktree per task and run Tasks 2 and 3 in parallel:\n  - Task 2 owns the CLI lane.\n  - Task 3 owns the prompt lane.\n- Execute Tasks 4 and 5 serially after Tasks 2 and 3. They are the seam before finish gating.\n\n## Dependency Diagram\n\n```text\nTask 1 -> Task 2\nTask 1 -> Task 3\nTask 2 -> Task 4\nTask 3 -> Task 4\nTask 4 -> Task 5\n```\n\n## Task 1: Establish the plan contract\n\n**Spec Coverage:** REQ-001, REQ-002, DEC-001\n**Task Outcome:** Establishes the shared contract boundary.\n**Plan Constraints:**\n- Keep markdown authoritative.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/contracts/plan.rs`\n\n- [ ] **Step 1: Establish the boundary**\n\n## Task 2: Own the CLI lane\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Owns the CLI lane in isolation.\n**Plan Constraints:**\n- Keep this lane disjoint.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/cli/plan_contract.rs`\n\n- [ ] **Step 1: Land the CLI lane**\n\n## Task 3: Own the prompt lane\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Owns the prompt lane in isolation.\n**Plan Constraints:**\n- Keep this lane disjoint.\n**Open Questions:** none\n\n**Files:**\n- Modify: `skills/subagent-driven-development/implementer-prompt.md`\n\n- [ ] **Step 1: Land the prompt lane**\n\n## Task 4: Reintegrate the parallel lanes\n\n**Spec Coverage:** REQ-003, VERIFY-001\n**Task Outcome:** Reintegrates the two parallel lanes into shared glue.\n**Plan Constraints:**\n- Do not begin until Tasks 2 and 3 are complete.\n**Open Questions:** none\n\n**Files:**\n- Modify: `src/execution/harness.rs`\n\n- [ ] **Step 1: Reintegrate the parallel lanes**\n\n## Task 5: Ratify the combined result\n\n**Spec Coverage:** REQ-003, NONGOAL-001, VERIFY-001\n**Task Outcome:** Ratifies the combined result after the reintegration seam finishes.\n**Plan Constraints:**\n- Do not begin until Task 4 is complete.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/contracts_spec_plan.rs`\n\n- [ ] **Step 1: Ratify the combined result**\n"
        ),
    )
    .expect("custom plain-seam fixture should write");

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("analysis should still produce a report");

    assert_eq!(report.contract_state, "invalid");
    assert!(!report.serial_hazards_resolved);
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "serial_execution_unproven")
    );
}

#[test]
fn plan_fidelity_receipt_validation_accepts_matching_pass_receipt() {
    let repo_root = unique_temp_dir("plan-fidelity-receipt-valid");
    install_valid_artifacts(&repo_root);
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    write_plan_fidelity_receipt(
        &receipt_path,
        &build_matching_plan_fidelity_receipt(&repo_root),
    );

    let gate = evaluate_plan_fidelity_gate(&repo_root, &receipt_path);

    assert_eq!(gate.state, "pass");
    assert!(gate.reason_codes.is_empty());
    assert!(gate.diagnostics.is_empty());
}

#[test]
fn plan_fidelity_receipt_validation_rejects_stale_plan_revision_binding() {
    let repo_root = unique_temp_dir("plan-fidelity-receipt-stale");
    install_valid_artifacts(&repo_root);
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    let mut receipt = build_matching_plan_fidelity_receipt(&repo_root);
    receipt.plan_revision += 1;
    write_plan_fidelity_receipt(&receipt_path, &receipt);

    let gate = evaluate_plan_fidelity_gate(&repo_root, &receipt_path);

    assert_eq!(gate.state, "stale");
    assert!(
        gate.reason_codes
            .iter()
            .any(|code| code == "stale_plan_fidelity_receipt")
    );
}

#[test]
fn plan_fidelity_receipt_validation_rejects_non_independent_reviewer_provenance() {
    let repo_root = unique_temp_dir("plan-fidelity-receipt-provenance");
    install_valid_artifacts(&repo_root);
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    let mut receipt = build_matching_plan_fidelity_receipt(&repo_root);
    receipt.reviewer_provenance.review_stage = String::from("featureforge:writing-plans");
    receipt.reviewer_provenance.distinct_from_stages =
        vec![String::from("featureforge:writing-plans")];
    write_plan_fidelity_receipt(&receipt_path, &receipt);

    let gate = evaluate_plan_fidelity_gate(&repo_root, &receipt_path);

    assert_eq!(gate.state, "invalid");
    assert!(
        gate.reason_codes
            .iter()
            .any(|code| code == "plan_fidelity_receipt_not_independent")
    );
}

#[test]
fn plan_fidelity_receipt_validation_rejects_missing_execution_topology_verification() {
    let repo_root = unique_temp_dir("plan-fidelity-receipt-topology");
    install_valid_artifacts(&repo_root);
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    let mut receipt = build_matching_plan_fidelity_receipt(&repo_root);
    receipt.verification.checked_surfaces = vec![String::from("requirement_index")];
    write_plan_fidelity_receipt(&receipt_path, &receipt);

    let gate = evaluate_plan_fidelity_gate(&repo_root, &receipt_path);

    assert_eq!(gate.state, "invalid");
    assert!(
        gate.reason_codes
            .iter()
            .any(|code| code == "plan_fidelity_receipt_missing_execution_topology_check")
    );
}

#[test]
fn plan_fidelity_receipt_validation_rejects_missing_or_drifted_review_artifacts() {
    let repo_root = unique_temp_dir("plan-fidelity-receipt-artifact-binding");
    install_valid_artifacts(&repo_root);
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    let mut receipt = build_matching_plan_fidelity_receipt(&repo_root);
    fs::remove_file(repo_root.join(&receipt.review_artifact_path))
        .expect("review artifact should be removable for missing-artifact coverage");
    write_plan_fidelity_receipt(&receipt_path, &receipt);

    let missing_artifact_gate = evaluate_plan_fidelity_gate(&repo_root, &receipt_path);
    assert_eq!(missing_artifact_gate.state, "invalid");
    assert!(
        missing_artifact_gate
            .reason_codes
            .iter()
            .any(|code| code == "plan_fidelity_review_artifact_missing")
    );

    let (artifact_rel, artifact_fingerprint) =
        seed_direct_plan_fidelity_review_artifact(&repo_root);
    receipt.review_artifact_path = artifact_rel;
    receipt.review_artifact_fingerprint = artifact_fingerprint;
    write_plan_fidelity_receipt(&receipt_path, &receipt);
    fs::write(
        repo_root.join(&receipt.review_artifact_path),
        "tampered review artifact contents\n",
    )
    .expect("tampered review artifact should write");

    let mismatch_gate = evaluate_plan_fidelity_gate(&repo_root, &receipt_path);
    assert_eq!(mismatch_gate.state, "invalid");
    assert!(
        mismatch_gate
            .reason_codes
            .iter()
            .any(|code| code == "plan_fidelity_review_artifact_fingerprint_mismatch")
    );
}

#[test]
fn exported_analyze_plan_reads_runtime_owned_plan_fidelity_receipt_path() {
    let repo_root = unique_temp_dir("contract-analyze-runtime-plan-fidelity-path");
    install_valid_draft_artifacts(&repo_root);
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    write_plan_fidelity_receipt(
        &receipt_path,
        &build_matching_plan_fidelity_receipt(&repo_root),
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), repo_root.join(PLAN_REL))
        .expect("direct analyze_plan helper should read the runtime-owned receipt path");

    assert_eq!(report.contract_state, "valid");
    assert_eq!(report.plan_fidelity_receipt.state, "pass");
}

#[test]
fn analyze_plan_cli_resolves_repo_relative_paths_from_subdirectories() {
    let repo_root = unique_temp_dir("contract-analyze-cli-subdir");
    let state_dir = unique_temp_dir("contract-analyze-cli-subdir-state");
    install_valid_draft_artifacts(&repo_root);
    write_plan_fidelity_review_artifact(
        &repo_root,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-cli-subdir.md",
            plan_path: PLAN_REL,
            plan_revision: 1,
            spec_path: SPEC_REL,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "independent-reviewer-subdir",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    parse_success_json(
        &run_record_plan_fidelity(
            &repo_root,
            &state_dir,
            &[
                "record",
                "--plan",
                PLAN_REL,
                "--review-artifact",
                ".featureforge/reviews/plan-fidelity-cli-subdir.md",
                "--json",
            ],
            "record plan-fidelity receipt for subdirectory analyze-plan coverage",
        ),
        "record plan-fidelity receipt for subdirectory analyze-plan coverage",
    );
    fs::create_dir_all(repo_root.join("src/runtime")).expect("subdirectory should exist");

    let report = parse_success_json(
        &run_rust_from_dir(
            &repo_root.join("src/runtime"),
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "analyze-plan should resolve repo-relative paths from subdirectories",
        ),
        "analyze-plan should resolve repo-relative paths from subdirectories",
    );

    assert_eq!(report["contract_state"], "valid");
    assert_eq!(report["plan_fidelity_receipt"]["state"], "pass");
}

#[test]
fn analyze_valid_contract_fixture_with_trailing_engineering_review_summary() {
    let repo_root = unique_temp_dir("contract-analyze-trailing-eng-summary");
    let state_dir = unique_temp_dir("contract-analyze-trailing-eng-summary-state");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    let source = fs::read_to_string(&plan_path).expect("valid plan fixture should read");
    fs::write(
        &plan_path,
        format!(
            "{source}\n\n## Engineering Review Summary\n\n**Review Status:** clear\n**Reviewed At:** 2026-03-24T16:02:11Z\n**Review Mode:** big_change\n**Reviewed Plan Revision:** 1\n**Critical Gaps:** 0\n**Browser QA Required:** yes\n**Test Plan Artifact:** `~/.featureforge/projects/example/example-branch-test-plan-20260324T160211Z.md`\n**Outside Voice:** fresh-context-subagent\n"
        ),
    )
    .expect("plan fixture with trailing summary should write");

    let report = analyze_plan(repo_root.join(SPEC_REL), plan_path.clone())
        .expect("analysis should tolerate trailing engineering summary");
    assert_eq!(report.contract_state, "valid");
    assert_eq!(report.task_count, 3);
    assert_eq!(report.packet_buildable_tasks, 3);
    assert!(report.coverage_complete);

    let lint = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
            "rust lint with trailing engineering summary",
        ),
        "rust lint with trailing engineering summary",
    );
    assert_eq!(lint["status"], "ok");
    assert_eq!(lint["plan_task_count"], 3);
    assert_eq!(lint["coverage"]["REQ-001"][0], 1);
}

#[test]
fn analyze_plan_detects_stale_source_spec_linkage() {
    let repo_root = unique_temp_dir("contract-analyze-stale");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    let source = fs::read_to_string(&plan_path).expect("plan fixture should read");
    fs::write(
        &plan_path,
        source.replace("**Source Spec Revision:** 1", "**Source Spec Revision:** 2"),
    )
    .expect("stale plan fixture should write");

    let report =
        analyze_plan(repo_root.join(SPEC_REL), plan_path).expect("analysis should succeed");
    assert_eq!(report.contract_state, "invalid");
    assert_eq!(
        report.reason_codes,
        vec![String::from("stale_spec_plan_linkage")]
    );
    assert!(report.coverage_complete);
}

#[test]
fn analyze_valid_contract_fixture_with_checked_steps_and_fenced_details() {
    let repo_root = unique_temp_dir("contract-analyze-checked-steps");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    let source = fs::read_to_string(&plan_path).expect("valid plan fixture should read");
    let source = source
        .replace(
            "- [ ] **Step 1: Parse the source requirement index**",
            "- [x] **Step 1: Parse the source requirement index**\n```text\nchecked step detail fixture\n```",
        )
        .replace(
            "- [ ] **Step 2: Validate the coverage matrix against the indexed requirements**",
            "- [x] **Step 2: Validate the coverage matrix against the indexed requirements**\n```text\ncoverage detail fixture\n```",
        )
        .replace(
            "- [ ] **Step 1: Build canonical task packets**",
            "- [x] **Step 1: Build canonical task packets**\n```text\npacket detail fixture\n```",
        )
        .replace(
            "- [ ] **Step 2: Rebuild stale packets from the current approved artifacts**",
            "- [x] **Step 2: Rebuild stale packets from the current approved artifacts**\n```text\nrebuild detail fixture\n```",
        );
    fs::write(&plan_path, source).expect("plan fixture with checked step details should write");

    let report = analyze_plan(repo_root.join(SPEC_REL), &plan_path)
        .expect("checked steps with fenced details should analyze");

    assert_eq!(report.contract_state, "valid");
    assert_eq!(report.task_count, 3);
    assert_eq!(report.packet_buildable_tasks, 3);
    assert!(report.coverage_complete);
}

#[test]
fn analyze_plan_rejects_malformed_checked_step_entries() {
    let repo_root = unique_temp_dir("contract-analyze-malformed-checked-step");
    install_valid_artifacts(&repo_root);

    let plan_path = repo_root.join(PLAN_REL);
    replace_in_file(
        &plan_path,
        "- [ ] **Step 1: Parse the source requirement index**",
        "- [x] **Step 1 Parse the source requirement index**",
    );

    let error = analyze_plan(repo_root.join(SPEC_REL), plan_path)
        .expect_err("malformed checked step entry should fail closed");

    assert_eq!(error.failure_class(), "InstructionParseFailed");
    assert!(
        error
            .message()
            .contains("Malformed step entry: - [x] **Step 1 Parse the source requirement index**"),
        "unexpected diagnostic: {}",
        error.message()
    );
}

#[test]
fn lint_valid_contract_matches_helper_and_canonical_cli() {
    let repo_root = unique_temp_dir("contract-lint-valid-cli");
    let state_dir = unique_temp_dir("contract-lint-valid-state");
    install_valid_artifacts(&repo_root);

    let helper = parse_success_json(
        &run_helper(
            &repo_root,
            &state_dir,
            &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
            "helper lint valid contract",
        ),
        "helper lint valid contract",
    );
    let rust = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
            "rust lint valid contract",
        ),
        "rust lint valid contract",
    );

    assert_eq!(rust, helper);
    assert_eq!(rust["status"], "ok");
    assert_eq!(rust["spec_requirement_count"], 6);
    assert_eq!(rust["plan_task_count"], 3);
    assert_eq!(rust["coverage"]["REQ-001"][0], 1);
    assert_eq!(rust["coverage"]["REQ-003"][0], 2);
    assert_eq!(rust["coverage"]["REQ-003"][1], 3);
}

#[test]
fn lint_ignores_fenced_example_requirement_index_blocks() {
    let repo_root = unique_temp_dir("contract-lint-fenced");
    let state_dir = unique_temp_dir("contract-lint-fenced-state");
    install_fixture(&repo_root, "valid-plan.md", PLAN_REL);
    inline_spec_with_fenced_requirement_index(&repo_root);

    let rust = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
            "rust lint fenced requirement index fixture",
        ),
        "rust lint fenced requirement index fixture",
    );
    assert_eq!(rust["status"], "ok");
    assert_eq!(rust["spec_requirement_count"], 6);
    assert_eq!(rust["plan_task_count"], 3);
}

#[test]
fn analyze_plan_cli_reports_fixture_matrix() {
    let repo_root = unique_temp_dir("contract-analyze-cli-matrix");
    let state_dir = unique_temp_dir("contract-analyze-cli-state");

    install_valid_artifacts(&repo_root);
    let valid = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze valid contract",
        ),
        "rust analyze valid contract",
    );
    assert_eq!(valid["contract_state"], "valid");
    assert_eq!(valid["task_count"], 3);
    assert_eq!(valid["packet_buildable_tasks"], 3);
    assert_eq!(valid["coverage_complete"], true);
    assert_eq!(valid["open_questions_resolved"], true);
    assert_eq!(valid["task_structure_valid"], true);
    assert_eq!(valid["files_blocks_valid"], true);
    assert_eq!(valid["execution_strategy_present"], true);
    assert_eq!(valid["dependency_diagram_present"], true);
    assert_eq!(valid["execution_topology_valid"], true);
    assert_eq!(valid["serial_hazards_resolved"], true);
    assert_eq!(valid["parallel_lane_ownership_valid"], true);
    assert_eq!(valid["parallel_workspace_isolation_valid"], true);
    assert_eq!(
        valid["parallel_worktree_groups"],
        serde_json::json!([[2, 3]])
    );
    assert_eq!(
        valid["parallel_worktree_requirements"],
        serde_json::json!([{
            "tasks": [2, 3],
            "declared_worktrees": 2,
            "required_worktrees": 2
        }])
    );
    assert_eq!(valid["reason_codes"], Value::Array(vec![]));
    assert_eq!(valid["diagnostics"], Value::Array(vec![]));

    let stale_plan = repo_root.join(PLAN_REL);
    replace_in_file(
        &stale_plan,
        "**Source Spec Revision:** 1",
        "**Source Spec Revision:** 2",
    );
    let stale = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze stale source linkage",
        ),
        "rust analyze stale source linkage",
    );
    assert_eq!(stale["contract_state"], "invalid");
    assert_eq!(stale["reason_codes"][0], "stale_spec_plan_linkage");
    install_valid_artifacts(&repo_root);

    install_fixture(&repo_root, "invalid-missing-coverage-plan.md", PLAN_REL);
    let missing_coverage = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze missing coverage",
        ),
        "rust analyze missing coverage",
    );
    assert_eq!(missing_coverage["contract_state"], "invalid");
    assert_eq!(missing_coverage["coverage_complete"], false);
    assert_eq!(missing_coverage["packet_buildable_tasks"], 2);
    assert_eq!(
        missing_coverage["reason_codes"][0],
        "missing_requirement_coverage"
    );
    install_valid_artifacts(&repo_root);

    install_fixture(&repo_root, "invalid-malformed-files-plan.md", PLAN_REL);
    let malformed_files = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze malformed files",
        ),
        "rust analyze malformed files",
    );
    assert_eq!(malformed_files["contract_state"], "invalid");
    assert_eq!(malformed_files["packet_buildable_tasks"], 1);
    assert_eq!(malformed_files["files_blocks_valid"], false);
    assert_eq!(malformed_files["reason_codes"][0], "malformed_files_block");
    install_valid_artifacts(&repo_root);

    let spec_path = repo_root.join(SPEC_REL);
    replace_in_file(&spec_path, "**Spec Revision:** 1", "**Spec Revision:** one");
    let missing_spec_revision = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze missing spec revision",
        ),
        "rust analyze missing spec revision",
    );
    assert_eq!(missing_spec_revision["contract_state"], "invalid");
    assert_eq!(
        missing_spec_revision["reason_codes"][0],
        "missing_spec_revision"
    );
    install_valid_artifacts(&repo_root);

    install_fixture(
        &repo_root,
        "invalid-malformed-task-structure-plan.md",
        PLAN_REL,
    );
    let malformed_task = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze malformed task structure",
        ),
        "rust analyze malformed task structure",
    );
    assert_eq!(malformed_task["contract_state"], "invalid");
    assert_eq!(malformed_task["task_structure_valid"], false);
    assert_eq!(
        malformed_task["reason_codes"][0],
        "malformed_task_structure"
    );
    install_valid_artifacts(&repo_root);

    let coverage_plan = repo_root.join(PLAN_REL);
    replace_in_file(&coverage_plan, "- REQ-001 -> Task 1", "- REQ-001 -> Task 9");
    let coverage_mismatch = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze coverage mismatch",
        ),
        "rust analyze coverage mismatch",
    );
    assert_eq!(coverage_mismatch["contract_state"], "invalid");
    assert_eq!(
        coverage_mismatch["reason_codes"][0],
        "coverage_matrix_mismatch"
    );
    install_valid_artifacts(&repo_root);

    install_fixture(&repo_root, "overlapping-write-scopes-plan.md", PLAN_REL);
    let overlapping = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze overlapping write scopes",
        ),
        "rust analyze overlapping write scopes",
    );
    assert_eq!(overlapping["contract_state"], "valid");
    assert_eq!(
        overlapping["overlapping_write_scopes"][0]["path"],
        "skills/writing-plans/SKILL.md"
    );
    assert_eq!(
        overlapping["overlapping_write_scopes"][0]["tasks"],
        serde_json::json!([1, 2])
    );
    install_valid_artifacts(&repo_root);

    install_fixture(&repo_root, "fake-parallel-hotspot-plan.md", PLAN_REL);
    let fake_parallel = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze fake parallel hotspot plan",
        ),
        "rust analyze fake parallel hotspot plan",
    );
    assert_eq!(fake_parallel["contract_state"], "invalid");
    assert_eq!(fake_parallel["execution_topology_valid"], false);
    assert_eq!(
        fake_parallel["reason_codes"][0],
        "parallel_hotspot_conflict"
    );
    install_valid_artifacts(&repo_root);

    install_fixture(&repo_root, "invalid-missing-index-spec.md", SPEC_REL);
    let missing_index = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze missing requirement index",
        ),
        "rust analyze missing requirement index",
    );
    assert_eq!(missing_index["contract_state"], "invalid");
    assert_eq!(
        missing_index["reason_codes"][0],
        "missing_requirement_index"
    );
    install_valid_artifacts(&repo_root);

    replace_in_file(
        &repo_root.join(SPEC_REL),
        "- [REQ-001][behavior] Execution-bound specs must include a parseable `Requirement Index`.",
        "- REQ-001 behavior] Execution-bound specs must include a parseable `Requirement Index`.",
    );
    let malformed_index = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze malformed requirement index",
        ),
        "rust analyze malformed requirement index",
    );
    assert_eq!(malformed_index["contract_state"], "invalid");
    assert_eq!(
        malformed_index["reason_codes"][0],
        "malformed_requirement_index"
    );
    install_valid_artifacts(&repo_root);

    replace_in_file(
        &repo_root.join(PLAN_REL),
        "**Spec Coverage:** REQ-001, REQ-002, DEC-001",
        "**Spec Coverage:** ",
    );
    let missing_task_coverage = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze missing task spec coverage",
        ),
        "rust analyze missing task spec coverage",
    );
    assert_eq!(missing_task_coverage["contract_state"], "invalid");
    assert_eq!(
        missing_task_coverage["reason_codes"][0],
        "task_missing_spec_coverage"
    );
}

#[test]
fn analyze_plan_cli_failpoints_surface_unexpected_contract_failures() {
    let repo_root = unique_temp_dir("contract-analyze-failpoints");
    let state_dir = unique_temp_dir("contract-analyze-failpoints-state");
    install_valid_artifacts(&repo_root);

    for failpoint in [
        "requirement_index_unexpected_failure",
        "coverage_matrix_unexpected_failure",
    ] {
        let mut command =
            Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
        command
            .current_dir(&repo_root)
            .env("FEATUREFORGE_STATE_DIR", &state_dir)
            .env("FEATUREFORGE_PLAN_CONTRACT_TEST_FAILPOINT", failpoint)
            .args([
                "plan",
                "contract",
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ]);
        let output = run(command, failpoint);
        let payload = parse_success_json(&output, failpoint);
        assert_eq!(payload["contract_state"], "invalid");
        assert_eq!(
            payload["reason_codes"][0],
            "unexpected_plan_contract_failure"
        );
        assert_eq!(
            payload["diagnostics"][0]["code"],
            "unexpected_plan_contract_failure"
        );
    }
}

#[test]
fn build_task_packet_preserves_contract_text_and_regenerates_persisted_cache() {
    let repo_root = unique_temp_dir("contract-packet");
    let state_dir = unique_temp_dir("contract-packet-state");
    install_valid_artifacts(&repo_root);

    let json_packet = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "build-task-packet",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--format",
                "json",
                "--persist",
                "yes",
            ],
            "rust build json task packet",
        ),
        "rust build json task packet",
    );
    assert_eq!(json_packet["status"], "ok");
    assert_eq!(json_packet["task_number"], 1);
    assert_eq!(json_packet["task_title"], "Establish the plan contract");
    assert_eq!(json_packet["persisted"], true);
    assert_eq!(json_packet["cache_status"], "fresh");
    assert!(packet_has_requirement_statement(
        &json_packet,
        "Execution-bound specs must include a parseable `Requirement Index`."
    ));
    assert!(
        json_packet["packet_markdown"]
            .as_str()
            .is_some_and(|packet| packet
                .contains("Execution-bound specs must include a parseable `Requirement Index`"))
    );
    let packet_path = PathBuf::from(
        json_packet["packet_path"]
            .as_str()
            .expect("persisted task packet path should exist"),
    );
    let first_fingerprint = json_packet["packet_fingerprint"]
        .as_str()
        .expect("packet fingerprint should exist")
        .to_owned();

    let markdown_packet = run_rust(
        &repo_root,
        &state_dir,
        &[
            "build-task-packet",
            "--plan",
            PLAN_REL,
            "--task",
            "2",
            "--format",
            "markdown",
            "--persist",
            "no",
        ],
        "rust build markdown task packet",
    );
    assert!(
        markdown_packet.status.success(),
        "markdown task packet should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        markdown_packet.status,
        String::from_utf8_lossy(&markdown_packet.stdout),
        String::from_utf8_lossy(&markdown_packet.stderr)
    );
    let markdown = String::from_utf8(markdown_packet.stdout)
        .expect("markdown task packet output should be utf8");
    assert!(markdown.contains("## Task Packet"));
    assert!(markdown.contains("## Task 2: Dispatch exact packet-backed execution"));
    assert!(markdown.contains("**Open Questions:** none"));

    replace_in_file(
        &repo_root.join(PLAN_REL),
        "**Plan Revision:** 1",
        "**Plan Revision:** 2",
    );
    let regenerated = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "build-task-packet",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--format",
                "json",
                "--persist",
                "yes",
            ],
            "rust regenerate persisted task packet after revision change",
        ),
        "rust regenerate persisted task packet after revision change",
    );
    assert_eq!(regenerated["plan_revision"], 2);
    assert_eq!(regenerated["cache_status"], "regenerated");
    assert_eq!(
        regenerated["packet_path"].as_str(),
        Some(packet_path.to_string_lossy().as_ref())
    );
    assert_ne!(
        regenerated["packet_fingerprint"].as_str(),
        Some(first_fingerprint.as_str())
    );

    fs::write(&packet_path, "tampered\n").expect("packet cache should be writable");
    let tampered = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "build-task-packet",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--format",
                "json",
                "--persist",
                "yes",
            ],
            "rust regenerate tampered persisted task packet",
        ),
        "rust regenerate tampered persisted task packet",
    );
    assert_eq!(tampered["cache_status"], "regenerated");
    assert!(
        fs::read_to_string(&packet_path)
            .expect("packet cache should remain readable")
            .contains("## Task 1: Establish the plan contract")
    );
}

#[test]
fn lint_invalid_contract_failures_and_packet_cache_retention_match_cli_contract() {
    let repo_root = unique_temp_dir("contract-invalid-fixtures");
    let state_dir = unique_temp_dir("contract-invalid-fixtures-state");
    let cases = [
        (
            "invalid-missing-index-spec.md",
            "valid-plan.md",
            "MissingRequirementIndex",
        ),
        (
            "valid-spec.md",
            "invalid-missing-coverage-plan.md",
            "MissingRequirementCoverage",
        ),
        (
            "valid-spec.md",
            "invalid-unknown-id-plan.md",
            "UnknownRequirementId",
        ),
        (
            "valid-spec.md",
            "invalid-ambiguous-wording-plan.md",
            "AmbiguousTaskWording",
        ),
        (
            "valid-spec.md",
            "invalid-requirement-weakening-plan.md",
            "RequirementWeakeningDetected",
        ),
        (
            "valid-spec.md",
            "invalid-open-questions-plan.md",
            "TaskOpenQuestionsNotResolved",
        ),
        (
            "valid-spec.md",
            "invalid-malformed-files-plan.md",
            "MalformedFilesBlock",
        ),
        (
            "valid-spec.md",
            "invalid-malformed-task-structure-plan.md",
            "MalformedTaskStructure",
        ),
        (
            "valid-spec.md",
            "invalid-path-traversal-plan.md",
            "MalformedFilesBlock",
        ),
    ];

    for (spec_fixture, plan_fixture, expected_error_class) in cases {
        install_fixture(&repo_root, spec_fixture, SPEC_REL);
        install_fixture(&repo_root, plan_fixture, PLAN_REL);

        let failure = parse_failure_json(
            &run_rust(
                &repo_root,
                &state_dir,
                &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
                expected_error_class,
            ),
            expected_error_class,
        );
        assert_eq!(failure["error_class"], expected_error_class);
    }

    install_valid_artifacts(&repo_root);
    let unknown_task = parse_failure_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "build-task-packet",
                "--plan",
                PLAN_REL,
                "--task",
                "99",
                "--format",
                "json",
                "--persist",
                "no",
            ],
            "build-task-packet unknown task",
        ),
        "build-task-packet unknown task",
    );
    assert_eq!(unknown_task["error_class"], "TaskNotFound");

    let packet = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "build-task-packet",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--format",
                "json",
                "--persist",
                "yes",
            ],
            "seed retained packet cache",
        ),
        "seed retained packet cache",
    );
    let packet_path = PathBuf::from(
        packet["packet_path"]
            .as_str()
            .expect("packet path should exist for retained cache"),
    );
    let packet_dir = packet_path
        .parent()
        .expect("packet directory should exist")
        .to_path_buf();
    fs::write(packet_dir.join("stale-one.packet.md"), "stale one\n").expect("stale one packet");
    fs::write(packet_dir.join("stale-two.packet.md"), "stale two\n").expect("stale two packet");
    fs::write(packet_dir.join("stale-three.packet.md"), "stale three\n")
        .expect("stale three packet");

    let mut retained = Command::cargo_bin("featureforge").expect("featureforge cargo binary");
    retained
        .current_dir(&repo_root)
        .env("FEATUREFORGE_STATE_DIR", &state_dir)
        .env("FEATUREFORGE_PLAN_PACKET_RETENTION", "2")
        .args([
            "plan",
            "contract",
            "build-task-packet",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--format",
            "json",
            "--persist",
            "yes",
        ]);
    let retained_output = parse_success_json(
        &run(retained, "retained packet cache"),
        "retained packet cache",
    );
    assert_eq!(retained_output["persisted"], true);

    let retained_packets = fs::read_dir(&packet_dir)
        .expect("packet directory should remain readable")
        .flatten()
        .filter(|entry| entry.path().extension().and_then(|ext| ext.to_str()) == Some("md"))
        .filter(|entry| entry.file_name().to_string_lossy().contains(".packet"))
        .count();
    assert_eq!(retained_packets, 2);
    assert_eq!(retained_output["packet_path"], packet["packet_path"]);
}

#[test]
fn lint_cache_invalidates_after_plan_change() {
    let repo_root = unique_temp_dir("contract-lint-cache");
    let state_dir = unique_temp_dir("contract-lint-cache-state");
    install_valid_artifacts(&repo_root);

    let seeded = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
            "seed lint cache",
        ),
        "seed lint cache",
    );
    assert_eq!(seeded["status"], "ok");

    replace_in_file(
        &repo_root.join(PLAN_REL),
        "- REQ-003 -> Task 2",
        "- REQ-003 -> Task 1",
    );

    let failure = parse_failure_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &["lint", "--spec", SPEC_REL, "--plan", PLAN_REL],
            "lint after cached plan change",
        ),
        "lint after cached plan change",
    );
    assert_eq!(failure["error_class"], "CoverageMatrixMismatch");
}

#[test]
fn analyze_plan_reports_missing_plan_fidelity_receipt_for_draft_plan() {
    let repo_root = unique_temp_dir("contract-analyze-missing-plan-fidelity-receipt");
    let state_dir = unique_temp_dir("contract-analyze-missing-plan-fidelity-receipt-state");
    install_valid_draft_artifacts(&repo_root);

    let report = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze draft plan without plan-fidelity receipt",
        ),
        "rust analyze draft plan without plan-fidelity receipt",
    );

    assert_eq!(report["contract_state"], "invalid");
    assert_eq!(report["plan_fidelity_receipt"]["state"], "missing");
    assert!(
        report["reason_codes"]
            .as_array()
            .expect("reason_codes should be present")
            .iter()
            .filter_map(Value::as_str)
            .any(|code| code == "missing_plan_fidelity_receipt")
    );
}

#[test]
fn analyze_plan_accepts_matching_pass_plan_fidelity_receipt_for_draft_plan() {
    let repo_root = unique_temp_dir("contract-analyze-pass-plan-fidelity-receipt");
    let state_dir = unique_temp_dir("contract-analyze-pass-plan-fidelity-receipt-state");
    install_valid_draft_artifacts(&repo_root);
    write_plan_fidelity_review_artifact(
        &repo_root,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-pass.md",
            plan_path: PLAN_REL,
            plan_revision: 1,
            spec_path: SPEC_REL,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "independent-reviewer-1",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let record = parse_success_json(
        &run_record_plan_fidelity(
            &repo_root,
            &state_dir,
            &[
                "record",
                "--plan",
                PLAN_REL,
                "--review-artifact",
                ".featureforge/reviews/plan-fidelity-pass.md",
                "--json",
            ],
            "record matching pass plan-fidelity receipt",
        ),
        "record matching pass plan-fidelity receipt",
    );
    assert_eq!(record["status"], "ok");

    let report = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze draft plan with pass plan-fidelity receipt",
        ),
        "rust analyze draft plan with pass plan-fidelity receipt",
    );

    assert_eq!(report["contract_state"], "valid");
    assert_eq!(report["plan_fidelity_receipt"]["state"], "pass");
    assert_eq!(
        report["plan_fidelity_receipt"]["reviewer_stage"],
        "featureforge:plan-fidelity-review"
    );
    assert_eq!(
        report["plan_fidelity_receipt"]["provenance_source"],
        "fresh-context-subagent"
    );
    assert_eq!(
        report["plan_fidelity_receipt"]["verified_requirement_index"],
        true
    );
    assert_eq!(
        report["plan_fidelity_receipt"]["verified_execution_topology"],
        true
    );
}

#[test]
fn analyze_plan_rejects_stale_or_non_independent_plan_fidelity_receipts() {
    let repo_root = unique_temp_dir("contract-analyze-stale-plan-fidelity-receipt");
    let state_dir = unique_temp_dir("contract-analyze-stale-plan-fidelity-receipt-state");
    install_valid_draft_artifacts(&repo_root);
    let slug_identity = discover_slug_identity(&repo_root);
    let runtime_receipt_path = plan_fidelity_receipt_path(
        &state_dir,
        &slug_identity.repo_slug,
        &slug_identity.branch_name,
    );
    let mut non_independent_receipt = build_matching_plan_fidelity_receipt(&repo_root);
    non_independent_receipt.reviewer_provenance.reviewer_source = String::from("same-context");
    non_independent_receipt.reviewer_provenance.reviewer_id = String::from("writer-context");
    write_plan_fidelity_receipt(&runtime_receipt_path, &non_independent_receipt);

    let non_independent = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze draft plan with non-independent plan-fidelity receipt",
        ),
        "rust analyze draft plan with non-independent plan-fidelity receipt",
    );
    assert_eq!(non_independent["contract_state"], "invalid");
    assert_eq!(non_independent["plan_fidelity_receipt"]["state"], "invalid");
    assert!(
        non_independent["reason_codes"]
            .as_array()
            .expect("reason_codes should be present")
            .iter()
            .filter_map(Value::as_str)
            .any(|code| code == "plan_fidelity_receipt_not_independent")
    );
    fs::remove_file(&runtime_receipt_path).expect("invalid runtime receipt should be removable");
    write_plan_fidelity_review_artifact(
        &repo_root,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-stale.md",
            plan_path: PLAN_REL,
            plan_revision: 1,
            spec_path: SPEC_REL,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "independent-reviewer-2",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    parse_success_json(
        &run_record_plan_fidelity(
            &repo_root,
            &state_dir,
            &[
                "record",
                "--plan",
                PLAN_REL,
                "--review-artifact",
                ".featureforge/reviews/plan-fidelity-stale.md",
                "--json",
            ],
            "record pass plan-fidelity receipt before plan revision change",
        ),
        "record pass plan-fidelity receipt before plan revision change",
    );

    replace_in_file(
        &repo_root.join(PLAN_REL),
        "**Plan Revision:** 1",
        "**Plan Revision:** 2",
    );

    let stale = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze draft plan with stale plan-fidelity receipt",
        ),
        "rust analyze draft plan with stale plan-fidelity receipt",
    );
    assert_eq!(stale["contract_state"], "invalid");
    assert_eq!(stale["plan_fidelity_receipt"]["state"], "stale");
    assert!(
        stale["reason_codes"]
            .as_array()
            .expect("reason_codes should be present")
            .iter()
            .filter_map(Value::as_str)
            .any(|code| code == "stale_plan_fidelity_receipt")
    );
}

#[test]
fn analyze_plan_requires_requirement_index_and_execution_topology_checks_in_receipt() {
    let repo_root = unique_temp_dir("contract-analyze-plan-fidelity-receipt-checks");
    let state_dir = unique_temp_dir("contract-analyze-plan-fidelity-receipt-checks-state");
    install_valid_draft_artifacts(&repo_root);
    let slug_identity = discover_slug_identity(&repo_root);
    let receipt_path = plan_fidelity_receipt_path(
        &state_dir,
        &slug_identity.repo_slug,
        &slug_identity.branch_name,
    );
    let mut receipt = build_matching_plan_fidelity_receipt(&repo_root);
    receipt.verification.checked_surfaces = Vec::new();
    receipt.verification.verified_requirement_ids = Vec::new();
    write_plan_fidelity_receipt(&receipt_path, &receipt);

    let report = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze draft plan with incomplete plan-fidelity receipt",
        ),
        "rust analyze draft plan with incomplete plan-fidelity receipt",
    );

    assert_eq!(report["contract_state"], "invalid");
    assert_eq!(report["plan_fidelity_receipt"]["state"], "invalid");
    let reason_codes = report["reason_codes"]
        .as_array()
        .expect("reason_codes should be present")
        .iter()
        .filter_map(Value::as_str)
        .collect::<Vec<_>>();
    assert!(
        reason_codes.contains(&"plan_fidelity_receipt_missing_requirement_index_check"),
        "missing requirement-index verification should fail closed, got {reason_codes:?}"
    );
    assert!(
        reason_codes.contains(&"plan_fidelity_receipt_missing_execution_topology_check"),
        "missing execution-topology verification should fail closed, got {reason_codes:?}"
    );
}

#[test]
fn analyze_plan_reports_invalid_fidelity_gate_when_spec_requirement_index_is_malformed() {
    let repo_root = unique_temp_dir("contract-analyze-plan-fidelity-malformed-spec");
    let state_dir = unique_temp_dir("contract-analyze-plan-fidelity-malformed-spec-state");
    install_valid_draft_artifacts(&repo_root);
    fs::write(
        repo_root.join(SPEC_REL),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Summary\n\nMalformed fixture without a Requirement Index.\n",
    )
    .expect("malformed spec fixture should write");

    let report = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "rust analyze draft plan with malformed source spec",
        ),
        "rust analyze draft plan with malformed source spec",
    );

    assert_eq!(report["contract_state"], "invalid");
    assert_eq!(report["plan_fidelity_receipt"]["state"], "invalid");
    assert_ne!(
        report["plan_fidelity_receipt"]["state"], "not_applicable",
        "draft-plan analysis should still report the plan-fidelity gate when the source spec is malformed"
    );
}

#[test]
fn analyze_plan_rejects_pass_receipt_when_source_spec_is_not_workflow_valid_ceo_review() {
    let repo_root = unique_temp_dir("contract-analyze-plan-fidelity-invalid-spec-reviewer");
    install_valid_draft_artifacts(&repo_root);
    replace_in_file(
        &repo_root.join(SPEC_REL),
        "**Last Reviewed By:** plan-ceo-review",
        "**Last Reviewed By:** brainstorming",
    );
    let receipt_path = plan_fidelity_receipt_path_for_repo(&repo_root);
    write_plan_fidelity_receipt(
        &receipt_path,
        &build_matching_plan_fidelity_receipt(&repo_root),
    );

    let report = analyze_plan(repo_root.join(SPEC_REL), repo_root.join(PLAN_REL))
        .expect("analyze_plan should still return a report for draft plans with invalid spec reviewer provenance");

    assert_eq!(report.contract_state, "invalid");
    assert_eq!(report.plan_fidelity_receipt.state, "invalid");
    assert!(
        report
            .reason_codes
            .iter()
            .any(|code| code == "plan_fidelity_source_spec_not_ceo_approved")
    );
}

#[test]
fn analyze_plan_rejects_out_of_repo_source_spec_paths() {
    let repo_root = unique_temp_dir("contract-analyze-external-source-spec");
    let state_dir = unique_temp_dir("contract-analyze-external-source-spec-state");
    install_valid_draft_artifacts(&repo_root);
    replace_in_file(
        &repo_root.join(PLAN_REL),
        &format!("**Source Spec:** `{SPEC_REL}`"),
        "**Source Spec:** `../external/docs/featureforge/specs/outside-spec.md`",
    );

    let report = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "analyze-plan",
                "--spec",
                SPEC_REL,
                "--plan",
                PLAN_REL,
                "--format",
                "json",
            ],
            "analyze-plan should fail closed on out-of-repo Source Spec paths",
        ),
        "analyze-plan should fail closed on out-of-repo Source Spec paths",
    );

    assert_eq!(report["contract_state"], "invalid");
    assert!(
        report["reason_codes"]
            .as_array()
            .expect("reason_codes should be present")
            .iter()
            .filter_map(Value::as_str)
            .any(|code| code == "missing_source_spec"),
        "out-of-repo Source Spec paths should fail the plan header contract"
    );
}

#[test]
fn plan_contract_schemas_exist_with_expected_titles() {
    let analyze_schema_path = repo_fixture_path("schemas/plan-contract-analyze.schema.json");
    let packet_schema_path = repo_fixture_path("schemas/plan-contract-packet.schema.json");
    let generated_schema_dir = unique_temp_dir("generated-contract-schemas");
    write_contract_schemas(&generated_schema_dir).expect("generated contract schemas should write");

    let analyze_schema: Value = serde_json::from_str(
        &fs::read_to_string(&analyze_schema_path).expect("analyze schema should exist"),
    )
    .expect("analyze schema should be valid json");
    let packet_schema: Value = serde_json::from_str(
        &fs::read_to_string(&packet_schema_path).expect("packet schema should exist"),
    )
    .expect("packet schema should be valid json");
    let generated_analyze_schema =
        fs::read_to_string(generated_schema_dir.join("plan-contract-analyze.schema.json"))
            .expect("generated analyze schema should exist");

    assert_eq!(analyze_schema["title"], "AnalyzePlanReport");
    assert_eq!(packet_schema["title"], "TaskPacket");
    assert_eq!(
        fs::read_to_string(&analyze_schema_path)
            .expect("checked-in analyze schema should be readable")
            .trim_end(),
        generated_analyze_schema.trim_end()
    );
}
