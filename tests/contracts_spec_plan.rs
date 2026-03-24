use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use std::time::{SystemTime, UNIX_EPOCH};

use assert_cmd::cargo::CommandCargoExt;
use serde_json::Value;
use superpowers::contracts::plan::analyze_plan;
use superpowers::contracts::spec::parse_spec_file;

const SPEC_REL: &str = "docs/superpowers/specs/2026-03-22-plan-contract-fixture-design.md";
const PLAN_REL: &str = "docs/superpowers/plans/2026-03-22-plan-contract-fixture.md";
const REAL_SPEC_REL: &str = "docs/superpowers/specs/2026-03-21-task-fidelity-improvement-design.md";
const REAL_PLAN_REL: &str = "docs/superpowers/plans/2026-03-21-task-fidelity-improvement.md";

fn unique_temp_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock should be after unix epoch")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("superpowers-{label}-{nanos}"));
    fs::create_dir_all(&dir).expect("temp dir should be created");
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

fn helper_bin_path() -> PathBuf {
    repo_fixture_path("bin/superpowers-plan-contract")
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
    let mut command = Command::new(helper_bin_path());
    command
        .current_dir(repo_root)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn run_rust(repo_root: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("superpowers").expect("superpowers cargo binary should exist");
    command
        .current_dir(repo_root)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(["plan", "contract"])
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
- [REQ-003][behavior] Superpowers must provide a derived `superpowers-plan-contract` helper that lints traceability and builds canonical task packets.
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
    assert_eq!(report.task_count, 2);
    assert_eq!(report.packet_buildable_tasks, 2);
    assert!(report.coverage_complete);
    assert!(report.open_questions_resolved);
    assert!(report.task_structure_valid);
    assert!(report.files_blocks_valid);
    assert!(report.reason_codes.is_empty());
    assert!(report.overlapping_write_scopes.is_empty());
    assert!(report.diagnostics.is_empty());
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
            "{source}\n\n## Engineering Review Summary\n\n**Review Status:** clear\n**Reviewed At:** 2026-03-24T16:02:11Z\n**Review Mode:** big_change\n**Reviewed Plan Revision:** 1\n**Critical Gaps:** 0\n**Browser QA Required:** yes\n**Test Plan Artifact:** `~/.superpowers/projects/example/example-branch-test-plan-20260324T160211Z.md`\n**Outside Voice:** fresh-context-subagent\n"
        ),
    )
    .expect("plan fixture with trailing summary should write");

    let report = analyze_plan(repo_root.join(SPEC_REL), plan_path.clone())
        .expect("analysis should tolerate trailing engineering summary");
    assert_eq!(report.contract_state, "valid");
    assert_eq!(report.task_count, 2);
    assert_eq!(report.packet_buildable_tasks, 2);
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
    assert_eq!(lint["plan_task_count"], 2);
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
    assert_eq!(report.task_count, 2);
    assert_eq!(report.packet_buildable_tasks, 2);
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
    assert_eq!(rust["plan_task_count"], 2);
    assert_eq!(rust["coverage"]["REQ-001"][0], 1);
    assert_eq!(rust["coverage"]["REQ-003"][0], 2);
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
    assert_eq!(rust["plan_task_count"], 2);
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
    assert_eq!(valid["task_count"], 2);
    assert_eq!(valid["packet_buildable_tasks"], 2);
    assert_eq!(valid["coverage_complete"], true);
    assert_eq!(valid["open_questions_resolved"], true);
    assert_eq!(valid["task_structure_valid"], true);
    assert_eq!(valid["files_blocks_valid"], true);
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
            Command::cargo_bin("superpowers").expect("superpowers cargo binary should exist");
        command
            .current_dir(&repo_root)
            .env("SUPERPOWERS_STATE_DIR", &state_dir)
            .env("SUPERPOWERS_PLAN_CONTRACT_TEST_FAILPOINT", failpoint)
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

    let mut retained = Command::cargo_bin("superpowers").expect("superpowers cargo binary");
    retained
        .current_dir(&repo_root)
        .env("SUPERPOWERS_STATE_DIR", &state_dir)
        .env("SUPERPOWERS_PLAN_PACKET_RETENTION", "2")
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
fn real_approved_task_fidelity_contract_lints_and_task_packet_builds() {
    let repo_root = repo_fixture_path("");
    let state_dir = unique_temp_dir("contract-real-approved-state");

    let lint = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &["lint", "--spec", REAL_SPEC_REL, "--plan", REAL_PLAN_REL],
            "lint real approved task-fidelity artifacts",
        ),
        "lint real approved task-fidelity artifacts",
    );
    assert_eq!(lint["status"], "ok");
    assert_eq!(lint["spec_requirement_count"], 18);
    assert_eq!(lint["plan_task_count"], 5);
    assert_eq!(lint["coverage"]["REQ-006"][0], 4);
    assert_eq!(lint["coverage"]["VERIFY-001"][1], 5);

    let packet = parse_success_json(
        &run_rust(
            &repo_root,
            &state_dir,
            &[
                "build-task-packet",
                "--plan",
                REAL_PLAN_REL,
                "--task",
                "4",
                "--format",
                "json",
                "--persist",
                "no",
            ],
            "build real approved task-fidelity packet",
        ),
        "build real approved task-fidelity packet",
    );
    assert_eq!(packet["status"], "ok");
    assert_eq!(packet["task_number"], 4);
    assert_eq!(packet["persisted"], false);
    assert!(packet_has_requirement_statement(
        &packet,
        "Execution modes must build and consume canonical task packets instead of relying on controller-written task context."
    ));
    assert!(packet["packet_markdown"].as_str().is_some_and(|block| {
        block.contains("Execution modes must build and consume canonical task packets")
    }));
    assert!(packet["packet_markdown"].as_str().is_some_and(|block| {
        block.contains("## Task 4: Switch Execution And Review Consumers To Task Packets")
    }));
}

#[test]
fn plan_contract_schemas_exist_with_expected_titles() {
    let analyze_schema_path = repo_fixture_path("schemas/plan-contract-analyze.schema.json");
    let packet_schema_path = repo_fixture_path("schemas/plan-contract-packet.schema.json");

    let analyze_schema: Value = serde_json::from_str(
        &fs::read_to_string(&analyze_schema_path).expect("analyze schema should exist"),
    )
    .expect("analyze schema should be valid json");
    let packet_schema: Value = serde_json::from_str(
        &fs::read_to_string(&packet_schema_path).expect("packet schema should exist"),
    )
    .expect("packet schema should be valid json");

    assert_eq!(analyze_schema["title"], "AnalyzePlanReport");
    assert_eq!(packet_schema["title"], "TaskPacket");
}
