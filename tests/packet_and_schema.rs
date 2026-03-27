use std::collections::BTreeSet;
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

fn schema_properties(schema: &Value) -> &serde_json::Map<String, Value> {
    schema
        .get("properties")
        .and_then(Value::as_object)
        .expect("schema should expose object properties")
}

fn schema_required_fields(schema: &Value, issues: &mut Vec<String>) -> BTreeSet<String> {
    match schema.get("required") {
        Some(Value::Array(required_fields)) => {
            let mut fields = BTreeSet::new();
            for field in required_fields {
                match field.as_str() {
                    Some(name) => {
                        fields.insert(name.to_owned());
                    }
                    None => {
                        issues.push(String::from(
                            "schema `required` array should contain only string field names",
                        ));
                    }
                }
            }
            fields
        }
        Some(_) => {
            issues.push(String::from(
                "schema should expose top-level `required` as an array",
            ));
            BTreeSet::new()
        }
        None => {
            issues.push(String::from("schema is missing top-level `required`"));
            BTreeSet::new()
        }
    }
}

fn resolve_local_schema_ref<'a>(schema: &'a Value, value: &'a Value) -> Option<&'a Value> {
    let mut current = value;
    let mut visited_refs = BTreeSet::new();
    loop {
        let Some(reference) = current.get("$ref").and_then(Value::as_str) else {
            return Some(current);
        };
        if !reference.starts_with('#') || !visited_refs.insert(reference.to_owned()) {
            return None;
        }
        let pointer = reference.trim_start_matches('#');
        current = if pointer.is_empty() {
            schema
        } else {
            schema.pointer(pointer)?
        };
    }
}

fn schema_type_set(schema: &Value, value: &Value) -> Option<BTreeSet<String>> {
    let resolved_variants = schema_resolved_variants(schema, value)?;
    let mut types = BTreeSet::new();
    for resolved in resolved_variants {
        match resolved.get("type") {
            Some(Value::String(type_name)) => {
                types.insert(type_name.clone());
            }
            Some(Value::Array(type_names)) => {
                for type_name in type_names {
                    types.insert(type_name.as_str()?.to_owned());
                }
            }
            _ => {}
        }
    }
    if types.is_empty() { None } else { Some(types) }
}

fn schema_enum_set(schema: &Value, value: &Value) -> Option<BTreeSet<String>> {
    let resolved_variants = schema_resolved_variants(schema, value)?;
    let mut enum_values = BTreeSet::new();
    for resolved in resolved_variants {
        let Some(values) = resolved.get("enum").and_then(Value::as_array) else {
            continue;
        };
        for value in values {
            enum_values.insert(value.as_str()?.to_owned());
        }
    }
    if enum_values.is_empty() {
        None
    } else {
        Some(enum_values)
    }
}

fn schema_resolved_variants<'a>(schema: &'a Value, value: &'a Value) -> Option<Vec<&'a Value>> {
    fn collect_variants<'a>(schema: &'a Value, value: &'a Value, out: &mut Vec<&'a Value>) -> bool {
        let Some(resolved) = resolve_local_schema_ref(schema, value) else {
            return false;
        };
        let mut found = false;
        for keyword in ["anyOf", "oneOf"] {
            let Some(variants) = resolved.get(keyword).and_then(Value::as_array) else {
                continue;
            };
            for variant in variants {
                found |= collect_variants(schema, variant, out);
            }
        }
        if !found {
            out.push(resolved);
            return true;
        }
        found
    }

    let mut variants = Vec::new();
    if collect_variants(schema, value, &mut variants) {
        Some(variants)
    } else {
        None
    }
}

fn schema_property<'a>(
    properties: &'a serde_json::Map<String, Value>,
    field: &str,
    issues: &mut Vec<String>,
    missing_fields: &mut BTreeSet<String>,
) -> Option<&'a Value> {
    match properties.get(field) {
        Some(value) => Some(value),
        None => {
            if missing_fields.insert(field.to_owned()) {
                issues.push(format!("missing expected property `{field}`"));
            }
            None
        }
    }
}

fn assert_schema_types(
    schema: &Value,
    properties: &serde_json::Map<String, Value>,
    field: &str,
    expected_types: &[&str],
    issues: &mut Vec<String>,
    missing_fields: &mut BTreeSet<String>,
) {
    let Some(property) = schema_property(properties, field, issues, missing_fields) else {
        return;
    };
    let Some(actual_types) = schema_type_set(schema, property) else {
        issues.push(format!(
            "property `{field}` is missing a usable `type` definition"
        ));
        return;
    };
    let expected_types: BTreeSet<String> =
        expected_types.iter().map(|ty| (*ty).to_owned()).collect();
    if actual_types != expected_types {
        issues.push(format!(
            "property `{field}` has schema types {actual_types:?}, expected {expected_types:?}"
        ));
    }
}

fn assert_schema_required_field(
    required_fields: &BTreeSet<String>,
    field: &str,
    issues: &mut Vec<String>,
    missing_required_fields: &mut BTreeSet<String>,
) {
    if !required_fields.contains(field) && missing_required_fields.insert(field.to_owned()) {
        issues.push(format!(
            "field `{field}` should be present in the schema `required` array"
        ));
    }
}

fn assert_schema_optional_field(
    required_fields: &BTreeSet<String>,
    field: &str,
    issues: &mut Vec<String>,
    non_optional_fields: &mut BTreeSet<String>,
) {
    if required_fields.contains(field) && non_optional_fields.insert(field.to_owned()) {
        issues.push(format!(
            "field `{field}` should be optional and must not be present in the schema `required` array"
        ));
    }
}

fn assert_schema_enum(
    schema: &Value,
    properties: &serde_json::Map<String, Value>,
    field: &str,
    expected_values: &[&str],
    issues: &mut Vec<String>,
    missing_fields: &mut BTreeSet<String>,
) {
    let Some(property) = schema_property(properties, field, issues, missing_fields) else {
        return;
    };
    let Some(actual_values) = schema_enum_set(schema, property) else {
        issues.push(format!(
            "property `{field}` is missing a usable `enum` definition"
        ));
        return;
    };
    let expected_values: BTreeSet<String> = expected_values
        .iter()
        .map(|value| (*value).to_owned())
        .collect();
    if actual_values != expected_values {
        issues.push(format!(
            "property `{field}` has schema enum {actual_values:?}, expected {expected_values:?}"
        ));
    }
}

fn assert_schema_array_items_types(
    schema: &Value,
    properties: &serde_json::Map<String, Value>,
    field: &str,
    expected_types: &[&str],
    issues: &mut Vec<String>,
    missing_fields: &mut BTreeSet<String>,
) {
    let Some(property) = schema_property(properties, field, issues, missing_fields) else {
        return;
    };
    let Some(items) = property.get("items") else {
        issues.push(format!("property `{field}` is missing `items`"));
        return;
    };
    let Some(actual_types) = schema_type_set(schema, items) else {
        issues.push(format!(
            "property `{field}` items are missing a usable `type` definition"
        ));
        return;
    };
    let expected_types: BTreeSet<String> =
        expected_types.iter().map(|ty| (*ty).to_owned()).collect();
    if actual_types != expected_types {
        issues.push(format!(
            "property `{field}` items have schema types {actual_types:?}, expected {expected_types:?}"
        ));
    }
}

fn assert_schema_array_items_enum(
    schema: &Value,
    properties: &serde_json::Map<String, Value>,
    field: &str,
    expected_values: &[&str],
    issues: &mut Vec<String>,
    missing_fields: &mut BTreeSet<String>,
) {
    let Some(property) = schema_property(properties, field, issues, missing_fields) else {
        return;
    };
    let Some(items) = property.get("items") else {
        issues.push(format!("property `{field}` is missing `items`"));
        return;
    };
    let Some(actual_values) = schema_enum_set(schema, items) else {
        issues.push(format!(
            "property `{field}` items are missing a usable `enum` definition"
        ));
        return;
    };
    let expected_values: BTreeSet<String> = expected_values
        .iter()
        .map(|value| (*value).to_owned())
        .collect();
    if actual_values != expected_values {
        issues.push(format!(
            "property `{field}` items have schema enum {actual_values:?}, expected {expected_values:?}"
        ));
    }
}

fn plan_execution_status_schema_issues(schema_json: &str) -> Vec<String> {
    let schema: Value = serde_json::from_str(schema_json).expect("schema should parse");
    let properties = schema_properties(&schema);
    let mut issues = Vec::new();
    let required_fields = schema_required_fields(&schema, &mut issues);

    let mut missing_fields = BTreeSet::new();
    let mut missing_required_fields = BTreeSet::new();
    let mut non_optional_fields = BTreeSet::new();

    macro_rules! check_types {
        ($field:literal, [$($expected:literal),+ $(,)?], required) => {
            assert_schema_types(
                &schema,
                &properties,
                $field,
                &[$($expected),+],
                &mut issues,
                &mut missing_fields,
            );
            assert_schema_required_field(
                &required_fields,
                $field,
                &mut issues,
                &mut missing_required_fields,
            );
        };
        ($field:literal, [$($expected:literal),+ $(,)?], optional) => {
            assert_schema_types(
                &schema,
                &properties,
                $field,
                &[$($expected),+],
                &mut issues,
                &mut missing_fields,
            );
            assert_schema_optional_field(
                &required_fields,
                $field,
                &mut issues,
                &mut non_optional_fields,
            );
        };
    }

    macro_rules! check_enum {
        ($field:literal, [$($expected:literal),+ $(,)?]) => {
            assert_schema_enum(
                &schema,
                &properties,
                $field,
                &[$($expected),+],
                &mut issues,
                &mut missing_fields,
            );
        };
    }

    macro_rules! check_array_items {
        ($field:literal, [$($expected:literal),+ $(,)?]) => {
            assert_schema_array_items_types(
                &schema,
                &properties,
                $field,
                &[$($expected),+],
                &mut issues,
                &mut missing_fields,
            );
        };
    }

    macro_rules! check_array_items_enum {
        ($field:literal, [$($expected:literal),+ $(,)?]) => {
            assert_schema_array_items_enum(
                &schema,
                &properties,
                $field,
                &[$($expected),+],
                &mut issues,
                &mut missing_fields,
            );
        };
    }

    check_types!("execution_run_id", ["string", "null"], optional);
    check_types!("latest_authoritative_sequence", ["integer"], required);
    check_types!("harness_phase", ["string"], required);
    check_enum!(
        "harness_phase",
        [
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
        ]
    );
    check_types!("chunk_id", ["string"], required);
    check_types!("chunking_strategy", ["string", "null"], optional);
    check_enum!("chunking_strategy", ["task", "task-group", "whole-run"]);
    check_types!("evaluator_policy", ["string", "null"], optional);
    check_types!("reset_policy", ["string", "null"], optional);
    check_enum!("reset_policy", ["none", "chunk-boundary", "adaptive"]);
    check_types!("review_stack", ["array", "null"], optional);
    check_array_items!("review_stack", ["string"]);
    check_types!("active_contract_path", ["string", "null"], optional);
    check_types!("active_contract_fingerprint", ["string", "null"], optional);
    check_types!("required_evaluator_kinds", ["array"], required);
    check_array_items!("required_evaluator_kinds", ["string"]);
    check_array_items_enum!(
        "required_evaluator_kinds",
        ["spec_compliance", "code_quality"]
    );
    check_types!("completed_evaluator_kinds", ["array"], required);
    check_array_items!("completed_evaluator_kinds", ["string"]);
    check_array_items_enum!(
        "completed_evaluator_kinds",
        ["spec_compliance", "code_quality"]
    );
    check_types!("pending_evaluator_kinds", ["array"], required);
    check_array_items!("pending_evaluator_kinds", ["string"]);
    check_array_items_enum!(
        "pending_evaluator_kinds",
        ["spec_compliance", "code_quality"]
    );
    check_types!("non_passing_evaluator_kinds", ["array"], required);
    check_array_items!("non_passing_evaluator_kinds", ["string"]);
    check_array_items_enum!(
        "non_passing_evaluator_kinds",
        ["spec_compliance", "code_quality"]
    );
    check_types!("aggregate_evaluation_state", ["string"], required);
    check_enum!(
        "aggregate_evaluation_state",
        ["pass", "pending", "fail", "blocked"]
    );
    check_types!("last_evaluation_report_path", ["string", "null"], optional);
    check_types!(
        "last_evaluation_report_fingerprint",
        ["string", "null"],
        optional
    );
    check_types!(
        "last_evaluation_evaluator_kind",
        ["string", "null"],
        optional
    );
    check_enum!(
        "last_evaluation_evaluator_kind",
        ["spec_compliance", "code_quality"]
    );
    check_types!("last_evaluation_verdict", ["string", "null"], optional);
    check_enum!("last_evaluation_verdict", ["pass", "fail", "blocked"]);
    check_types!("current_chunk_retry_count", ["integer"], required);
    check_types!("current_chunk_retry_budget", ["integer"], required);
    check_types!("current_chunk_pivot_threshold", ["integer"], required);
    check_types!("handoff_required", ["boolean"], required);
    check_types!("open_failed_criteria", ["array"], required);
    check_array_items!("open_failed_criteria", ["string"]);
    check_types!("write_authority_state", ["string"], required);
    check_types!("write_authority_holder", ["string", "null"], optional);
    check_types!("write_authority_worktree", ["string", "null"], optional);
    check_types!("repo_state_baseline_head_sha", ["string", "null"], optional);
    check_types!(
        "repo_state_baseline_worktree_fingerprint",
        ["string", "null"],
        optional
    );
    check_types!("repo_state_drift_state", ["string"], required);
    check_types!("dependency_index_state", ["string"], required);
    check_types!("final_review_state", ["string"], required);
    check_enum!(
        "final_review_state",
        ["not_required", "missing", "fresh", "stale"]
    );
    check_types!("browser_qa_state", ["string"], required);
    check_enum!(
        "browser_qa_state",
        ["not_required", "missing", "fresh", "stale"]
    );
    check_types!("release_docs_state", ["string"], required);
    check_enum!(
        "release_docs_state",
        ["not_required", "missing", "fresh", "stale"]
    );
    check_types!(
        "last_final_review_artifact_fingerprint",
        ["string", "null"],
        optional
    );
    check_types!(
        "last_browser_qa_artifact_fingerprint",
        ["string", "null"],
        optional
    );
    check_types!(
        "last_release_docs_artifact_fingerprint",
        ["string", "null"],
        optional
    );
    check_types!("execution_mode", ["string"], required);
    check_types!("execution_fingerprint", ["string"], required);
    check_types!("evidence_path", ["string"], required);
    check_types!("execution_started", ["string"], required);
    check_types!("reason_codes", ["array"], required);
    check_array_items!("reason_codes", ["string"]);
    check_types!("warning_codes", ["array"], required);
    check_array_items!("warning_codes", ["string"]);
    check_types!("latest_packet_fingerprint", ["string", "null"], optional);
    check_types!("latest_head_sha", ["string", "null"], optional);
    check_types!("latest_base_sha", ["string", "null"], optional);
    check_types!("active_task", ["integer", "null"], optional);
    check_types!("active_step", ["integer", "null"], optional);
    check_types!("blocking_task", ["integer", "null"], optional);
    check_types!("blocking_step", ["integer", "null"], optional);
    check_types!("resume_task", ["integer", "null"], optional);
    check_types!("resume_step", ["integer", "null"], optional);
    check_types!("plan_revision", ["integer"], required);

    issues
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

    let missing_generated = plan_execution_status_schema_issues(&generated);
    assert!(
        missing_generated.is_empty(),
        "generated plan-execution schema is missing expanded status fields or shapes: {missing_generated:?}"
    );

    let missing_checked_in = plan_execution_status_schema_issues(&checked_in);
    assert!(
        missing_checked_in.is_empty(),
        "checked-in plan-execution schema is missing expanded status fields or shapes: {missing_checked_in:?}"
    );
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
