use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use featureforge::contracts::evidence::read_execution_evidence;
use featureforge::contracts::packet::{build_task_packet_with_timestamp, write_contract_schemas};
use featureforge::contracts::plan::parse_plan_file;
use featureforge::contracts::spec::parse_spec_file;
use featureforge::execution::state::write_plan_execution_schema;
use featureforge::repo_safety::write_repo_safety_schema;
use featureforge::session_entry::write_session_entry_schema;
use featureforge::update_check::write_update_check_schema;

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

#[test]
fn task_packet_build_is_deterministic_for_fixed_timestamp() {
    let repo_root = unique_temp_dir("packet-deterministic");
    install_valid_artifacts(&repo_root);

    let spec = parse_spec_file(repo_root.join(SPEC_REL)).expect("spec should parse");
    let plan = parse_plan_file(repo_root.join(PLAN_REL)).expect("plan should parse");

    let first = build_task_packet_with_timestamp(&spec, &plan, 1, "2026-03-23T15:00:00Z")
        .expect("first packet should build");
    let second = build_task_packet_with_timestamp(&spec, &plan, 1, "2026-03-23T15:00:00Z")
        .expect("second packet should build");

    assert_eq!(first.packet_fingerprint, second.packet_fingerprint);
    assert_eq!(first.markdown, second.markdown);
    assert_eq!(first.task_title, "Establish the plan contract");
    assert!(
        first
            .markdown
            .contains("Execution-bound specs must include a parseable `Requirement Index`")
    );
}

#[test]
fn contract_schema_files_are_generated_with_expected_titles() {
    let schemas_dir = unique_temp_dir("contract-schemas");
    write_contract_schemas(&schemas_dir).expect("schemas should write");

    let analyze_schema = fs::read_to_string(schemas_dir.join("plan-contract-analyze.schema.json"))
        .expect("analyze schema should read");
    let packet_schema = fs::read_to_string(schemas_dir.join("plan-contract-packet.schema.json"))
        .expect("packet schema should read");

    assert!(analyze_schema.contains("\"title\": \"AnalyzePlanReport\""));
    assert!(packet_schema.contains("\"title\": \"TaskPacket\""));
}

#[test]
fn checked_in_plan_execution_schema_matches_generated_output() {
    let schemas_dir = unique_temp_dir("plan-execution-schema");
    write_plan_execution_schema(&schemas_dir).expect("plan execution schema should write");

    let generated = fs::read_to_string(schemas_dir.join("plan-execution-status.schema.json"))
        .expect("generated plan execution schema should read");
    let checked_in = fs::read_to_string(repo_fixture_path(
        "schemas/plan-execution-status.schema.json",
    ))
    .expect("checked-in plan execution schema should read");

    assert_eq!(generated.trim_end(), checked_in.trim_end());
}

#[test]
fn checked_in_repo_safety_and_session_entry_schemas_match_generated_output() {
    let schemas_dir = unique_temp_dir("policy-schemas");
    write_repo_safety_schema(&schemas_dir).expect("repo-safety schema should write");
    write_session_entry_schema(&schemas_dir).expect("session-entry schema should write");

    let generated_repo_safety =
        fs::read_to_string(schemas_dir.join("repo-safety-check.schema.json"))
            .expect("generated repo-safety schema should read");
    let checked_in_repo_safety =
        fs::read_to_string(repo_fixture_path("schemas/repo-safety-check.schema.json"))
            .expect("checked-in repo-safety schema should read");
    assert_eq!(
        generated_repo_safety.trim_end(),
        checked_in_repo_safety.trim_end()
    );

    let generated_session_entry =
        fs::read_to_string(schemas_dir.join("session-entry-resolve.schema.json"))
            .expect("generated session-entry schema should read");
    let checked_in_session_entry = fs::read_to_string(repo_fixture_path(
        "schemas/session-entry-resolve.schema.json",
    ))
    .expect("checked-in session-entry schema should read");
    assert_eq!(
        generated_session_entry.trim_end(),
        checked_in_session_entry.trim_end()
    );
}

#[test]
fn checked_in_update_check_schema_matches_generated_output() {
    let schemas_dir = unique_temp_dir("update-check-schema");
    write_update_check_schema(&schemas_dir).expect("update-check schema should write");

    let generated = fs::read_to_string(schemas_dir.join("update-check.schema.json"))
        .expect("generated update-check schema should read");
    let checked_in = fs::read_to_string(repo_fixture_path("schemas/update-check.schema.json"))
        .expect("checked-in update-check schema should read");

    assert_eq!(generated.trim_end(), checked_in.trim_end());
}

#[test]
fn checked_in_runtime_root_schema_matches_generated_output() {
    let schemas_dir = unique_temp_dir("runtime-root-schema");
    write_contract_schemas(&schemas_dir).expect("schemas should write");

    let generated = fs::read_to_string(schemas_dir.join("repo-runtime-root.schema.json"))
        .expect("generated runtime-root schema should read");
    let checked_in = fs::read_to_string(repo_fixture_path("schemas/repo-runtime-root.schema.json"))
        .expect("checked-in runtime-root schema should read");

    assert_eq!(generated.trim_end(), checked_in.trim_end());
}

#[test]
fn runtime_root_schema_bounds_the_source_contract() {
    let schemas_dir = unique_temp_dir("runtime-root-source-schema");
    write_contract_schemas(&schemas_dir).expect("schemas should write");

    let generated = fs::read_to_string(schemas_dir.join("repo-runtime-root.schema.json"))
        .expect("generated runtime-root schema should read");

    assert!(
        generated.contains("\"enum\""),
        "runtime-root schema should bound the source field with an enum"
    );
    for source in [
        "unresolved",
        "featureforge_dir_env",
        "repo_local",
        "binary_adjacent",
        "canonical_install",
    ] {
        assert!(
            generated.contains(&format!("\"{source}\"")),
            "runtime-root schema should include {source} in the bounded source set"
        );
    }
}

#[test]
fn execution_evidence_markdown_remains_readable() {
    let repo_root = unique_temp_dir("execution-evidence");
    let evidence_path = repo_root.join(
        "docs/featureforge/execution-evidence/2026-03-22-runtime-integration-hardening-r1-evidence.md",
    );
    if let Some(parent) = evidence_path.parent() {
        fs::create_dir_all(parent).expect("execution evidence parent should exist");
    }
    fs::write(
        &evidence_path,
        "# Execution Evidence: 2026-03-22-runtime-integration-hardening\n\n**Plan Path:** docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md\n**Plan Revision:** 1\n**Source Spec Path:** docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md\n**Source Spec Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-22T12:00:00Z\n**Execution Source:** featureforge:executing-plans\n**Claim:** Added route-time red fixtures.\n**Files:**\n- tests/workflow_runtime.rs\n**Verification:**\n- cargo test --test workflow_runtime\n**Invalidation Reason:** N/A\n",
    )
    .expect("execution evidence fixture should write");

    let evidence =
        read_execution_evidence(&evidence_path).expect("execution evidence should parse");

    assert_eq!(
        evidence.plan_path,
        "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"
    );
    assert_eq!(evidence.plan_revision, 1);
    assert!(!evidence.steps.is_empty());
    assert_eq!(evidence.steps[0].task_number, 1);
    assert_eq!(evidence.steps[0].step_number, 1);
    assert_eq!(evidence.steps[0].status, "Completed");
    assert!(
        evidence.steps[0]
            .claim
            .contains("Added route-time red fixtures")
    );
}
