#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::cargo::CommandCargoExt;
use featureforge::cli::plan_execution::ExecutionTopologyArg;
use featureforge::contracts::plan::{AnalyzePlanReport, analyze_plan};
use featureforge::execution::harness::{LearnedTopologyGuidance, TopologySelectionContext};
use featureforge::execution::topology::recommend_topology;
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};
use serde_json::Value;
use std::path::Path;
use std::process::{Command, Output};
use tempfile::TempDir;

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-17-example-execution-plan.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-17-example-execution-plan-design.md";

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
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "fixture-work"])
                .current_dir(repo);
            command
        },
        "git checkout fixture-work",
    );

    (repo_dir, state_dir)
}

fn write_approved_spec(repo: &Path) {
    write_file(
        &repo.join(SPEC_REL),
        r#"# Example Execution Plan Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Execution fixtures must support a valid single-task plan path for routing and finish-gate coverage.
- [REQ-002][behavior] Execution fixtures must support a valid multi-task independent-plan path for topology and preflight coverage.

## Summary

Fixture spec for focused execution-helper regression coverage.
"#,
    );
}

fn write_independent_plan(repo: &Path) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- REQ-002 -> Task 2

## Execution Strategy

- After the initial setup, create two worktrees and run Tasks 1 and 2 in parallel:
  - Task 1 owns `docs/task-a.md`.
  - Task 2 owns `docs/task-b.md`.

## Dependency Diagram

```text
Task 1    Task 2
```

## Task 1: Independent Task A

**Spec Coverage:** REQ-001, REQ-002
**Task Outcome:** Task A is isolated.
**Plan Constraints:**
- Keep Task 1 independent.
**Open Questions:** none

**Files:**
- Modify: `docs/task-a.md`

- [ ] **Step 1: Complete Task A**

## Task 2: Independent Task B

**Spec Coverage:** REQ-002
**Task Outcome:** Task B is isolated.
**Plan Constraints:**
- Keep Task 2 independent.
**Open Questions:** none

**Files:**
- Modify: `docs/task-b.md`

- [ ] **Step 1: Complete Task B**
"#
        ),
    );
}

fn write_single_step_plan(repo: &Path, execution_mode: &str) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** {execution_mode}
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1

## Execution Strategy

- Execute Task 1 last. It is the only task in this fixture and closes the execution graph for downstream review routing.

## Dependency Diagram

```text
Task 1
```

## Task 1: Single Step Task

**Spec Coverage:** REQ-001, REQ-002
**Task Outcome:** The workspace is prepared for execution.
**Plan Constraints:**
- Keep the fixture single-step and deterministic.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`

- [ ] **Step 1: Prepare the workspace for execution**
"#
        ),
    );
}

fn run_shell(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    let compat_bin =
        std::env::var_os("CARGO_BIN_EXE_featureforge").expect("featureforge test binary path");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_COMPAT_BIN", compat_bin)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    run(command, context)
}

fn run_shell_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    parse_json(&run_shell(repo, state, args, context), context)
}

fn run_rust_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    parse_json(&run(command, context), context)
}

fn topology_report(repo: &Path) -> AnalyzePlanReport {
    analyze_plan(repo.join(SPEC_REL), repo.join(PLAN_REL)).expect("plan analysis should succeed")
}

fn topology_context(
    execution_context_key: &str,
    tasks_independent: bool,
    isolated_agents_available: &str,
    session_intent: &str,
    workspace_prepared: &str,
    current_parallel_path_ready: bool,
    learned_guidance: Option<LearnedTopologyGuidance>,
) -> TopologySelectionContext {
    TopologySelectionContext {
        execution_context_key: execution_context_key.to_owned(),
        tasks_independent,
        isolated_agents_available: isolated_agents_available.to_owned(),
        session_intent: session_intent.to_owned(),
        workspace_prepared: workspace_prepared.to_owned(),
        current_parallel_path_ready,
        learned_guidance,
    }
}

fn accept_execution_preflight(repo: &Path, state: &Path, plan_rel: &str) {
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-preflight-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-preflight-fixture",
    );

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "execution preflight acceptance",
    );
    assert_eq!(preflight["allowed"], true);
}

#[test]
fn canonical_recommend_matches_helper_for_independent_plan() {
    let (repo_dir, state_dir) = init_repo("plan-execution-recommend");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let args = [
        "recommend",
        "--plan",
        PLAN_REL,
        "--isolated-agents",
        "available",
        "--session-intent",
        "stay",
        "--workspace-prepared",
        "yes",
    ];
    let helper = run_shell_json(repo, state, &args, "shell recommend");
    let rust = run_rust_json(repo, state, &args, "rust recommend");

    assert_eq!(rust["recommended_skill"], helper["recommended_skill"]);
    assert_eq!(rust["decision_flags"], helper["decision_flags"]);
    assert_eq!(
        rust["recommended_skill"],
        Value::String(String::from("featureforge:subagent-driven-development"))
    );
    assert_eq!(rust["decision_flags"]["tasks_independent"], "yes");
    assert_eq!(rust["decision_flags"]["same_session_viable"], "yes");
}

#[test]
fn canonical_recommend_exposes_policy_tuple_and_reason_codes_without_mutating_preflight_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-recommend-policy-tuple");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before recommend policy tuple",
    );
    for field in [
        "execution_run_id",
        "chunking_strategy",
        "evaluator_policy",
        "reset_policy",
        "review_stack",
    ] {
        let value = status_before
            .get(field)
            .unwrap_or_else(|| panic!("status should expose {field} before recommend"));
        assert!(
            value.is_null(),
            "status should keep {field} null before recommend, got {value:?}"
        );
    }

    let recommend = run_rust_json(
        repo,
        state,
        &[
            "recommend",
            "--plan",
            PLAN_REL,
            "--isolated-agents",
            "available",
            "--session-intent",
            "stay",
            "--workspace-prepared",
            "yes",
        ],
        "recommend policy tuple",
    );
    assert_eq!(
        recommend["recommended_skill"],
        "featureforge:subagent-driven-development"
    );
    assert_eq!(recommend["selected_topology"], "worktree-backed-parallel");
    assert!(
        recommend["reason_codes"]
            .as_array()
            .is_some_and(|codes| !codes.is_empty()),
        "recommend should expose topology reason_codes"
    );
    assert!(
        recommend["reason"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "recommend should preserve reason as a non-empty string"
    );

    let status_after = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after recommend policy tuple",
    );
    for field in [
        "execution_run_id",
        "chunking_strategy",
        "evaluator_policy",
        "reset_policy",
        "review_stack",
    ] {
        let value = status_after
            .get(field)
            .unwrap_or_else(|| panic!("status should expose {field} after recommend"));
        assert!(
            value.is_null(),
            "recommend should not mutate preflight-owned {field}, got {value:?}"
        );
    }
}

#[test]
fn runtime_topology_recommends_worktree_backed_parallel_when_the_plan_and_workspace_are_ready() {
    let (repo_dir, state_dir) = init_repo("plan-execution-worktree-backed-parallel");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let recommendation = recommend_topology(
        &report,
        &topology_context("main@base-a", true, "available", "stay", "yes", true, None),
    );

    assert_eq!(
        recommendation.selected_topology,
        ExecutionTopologyArg::WorktreeBackedParallel
    );
    assert_eq!(
        recommendation.recommended_skill,
        "featureforge:subagent-driven-development"
    );
    assert!(
        recommendation
            .reason
            .to_lowercase()
            .contains("worktree-backed parallel"),
        "reason should explain why runtime selected the worktree-backed parallel topology"
    );
    assert!(
        recommendation
            .reason_codes
            .iter()
            .any(|code| code == "worktree_backed_parallel_ready"),
        "parallel-ready topology should report the worktree-backed reason code"
    );

    let shell = run_shell_json(
        repo,
        state,
        &[
            "recommend",
            "--plan",
            PLAN_REL,
            "--isolated-agents",
            "available",
            "--session-intent",
            "stay",
            "--workspace-prepared",
            "yes",
        ],
        "shell recommend still available for current routing",
    );
    assert_eq!(
        shell["recommended_skill"],
        "featureforge:subagent-driven-development"
    );
}

#[test]
fn runtime_topology_falls_back_conservatively_when_worktrees_or_agents_are_not_ready() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-conservative-fallback");
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let recommendation = recommend_topology(
        &report,
        &topology_context(
            "main@base-a",
            true,
            "unavailable",
            "stay",
            "no",
            false,
            None,
        ),
    );

    assert_eq!(
        recommendation.selected_topology,
        ExecutionTopologyArg::ConservativeFallback
    );
    assert_eq!(
        recommendation.recommended_skill,
        "featureforge:executing-plans"
    );
    assert!(
        recommendation
            .reason
            .to_lowercase()
            .contains("conservative"),
        "reason should explain the conservative fallback"
    );
    assert!(
        recommendation
            .reason_codes
            .iter()
            .any(|code: &String| code == "conservative_fallback_policy_safety_block"),
        "fallback topology should expose the actual blocker reason code"
    );
    assert!(
        !recommendation
            .reason_codes
            .iter()
            .any(|code: &String| code == "conservative_fallback_same_session_unavailable"),
        "fallback diagnostics should not blame same-session viability when it is not the actual blocker"
    );
    assert_eq!(
        recommendation.decision_flags.tasks_independent, "yes",
        "topology fallback should not redefine actual task independence"
    );
}

#[test]
fn runtime_topology_separate_session_fallback_uses_actual_blocker_reason_codes() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-separate-session-fallback");
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let recommendation = recommend_topology(
        &report,
        &topology_context(
            "main@base-a",
            true,
            "unavailable",
            "separate",
            "yes",
            false,
            None,
        ),
    );

    assert_eq!(
        recommendation.selected_topology,
        ExecutionTopologyArg::ConservativeFallback
    );
    assert_eq!(
        recommendation.recommended_skill,
        "featureforge:executing-plans"
    );
    assert!(
        recommendation
            .reason_codes
            .iter()
            .any(|code| code == "conservative_fallback_policy_safety_block"),
        "separate-session fallback should name the actual blocker"
    );
    assert!(
        !recommendation
            .reason_codes
            .iter()
            .any(|code| code == "conservative_fallback_same_session_unavailable"),
        "separate-session fallback must not claim same-session unavailability"
    );
    assert_eq!(
        recommendation.decision_flags.session_intent, "separate",
        "session intent should still be surfaced verbatim"
    );
}

#[test]
fn runtime_topology_reuses_matching_downgrade_history_for_same_context() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-downgrade-reuse");
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let learned_guidance = LearnedTopologyGuidance {
        approved_plan_revision: report.plan_revision,
        execution_context_key: String::from("main@base-a"),
        primary_reason_class: String::from("workspace_unavailable"),
    };
    let recommendation = recommend_topology(
        &report,
        &topology_context(
            "main@base-a",
            true,
            "available",
            "stay",
            "no",
            false,
            Some(learned_guidance),
        ),
    );

    assert_eq!(
        recommendation.selected_topology,
        ExecutionTopologyArg::ConservativeFallback
    );
    assert_eq!(
        recommendation.recommended_skill,
        "featureforge:executing-plans"
    );
    assert!(
        recommendation.learned_downgrade_reused,
        "matching downgrade history should be reused as conservative guidance"
    );
    assert!(
        recommendation
            .reason_codes
            .iter()
            .any(|code| code == "matching_downgrade_history_reused"),
        "matching downgrade history should be visible in the runtime reason codes"
    );
}

#[test]
fn runtime_topology_supersedes_downgrade_history_when_the_blocker_clears() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-downgrade-recovery");
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let learned_guidance = LearnedTopologyGuidance {
        approved_plan_revision: report.plan_revision,
        execution_context_key: String::from("main@base-a"),
        primary_reason_class: String::from("workspace_unavailable"),
    };
    let recommendation = recommend_topology(
        &report,
        &topology_context(
            "main@base-a",
            true,
            "available",
            "stay",
            "yes",
            true,
            Some(learned_guidance),
        ),
    );

    assert_eq!(
        recommendation.selected_topology,
        ExecutionTopologyArg::WorktreeBackedParallel
    );
    assert_eq!(
        recommendation.recommended_skill,
        "featureforge:subagent-driven-development"
    );
    assert!(
        !recommendation.learned_downgrade_reused,
        "restored runs should supersede old conservative guidance rather than reuse it"
    );
    assert!(
        recommendation
            .reason_codes
            .iter()
            .any(|code| code == "matching_downgrade_history_superseded"),
        "recovery should explicitly supersede the learned downgrade history"
    );
}

#[test]
fn runtime_topology_serializes_selected_topology_with_contract_values() {
    let serialized = serde_json::to_value(ExecutionTopologyArg::WorktreeBackedParallel)
        .expect("topology enum should serialize");
    assert_eq!(
        serialized,
        Value::String(String::from("worktree-backed-parallel"))
    );

    let round_tripped: ExecutionTopologyArg =
        serde_json::from_value(Value::String(String::from("conservative-fallback")))
            .expect("topology enum should deserialize from contract value");
    assert_eq!(round_tripped, ExecutionTopologyArg::ConservativeFallback);

    let (repo_dir, _state_dir) = init_repo("plan-execution-topology-json-contract");
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let recommendation = recommend_topology(
        &report,
        &topology_context("main@base-a", true, "available", "stay", "yes", true, None),
    );
    let json = serde_json::to_value(&recommendation).expect("recommendation should serialize");
    assert_eq!(
        json["selected_topology"],
        Value::String(String::from("worktree-backed-parallel"))
    );
}

#[test]
fn runtime_topology_can_select_worktree_backed_parallel_for_separate_session_coordinators() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-separate-session-parallel");
    let repo = repo_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let report = topology_report(repo);
    let recommendation = recommend_topology(
        &report,
        &topology_context(
            "main@base-a",
            true,
            "available",
            "separate",
            "yes",
            true,
            None,
        ),
    );

    assert_eq!(
        recommendation.selected_topology,
        ExecutionTopologyArg::WorktreeBackedParallel
    );
    assert_eq!(
        recommendation.recommended_skill, "featureforge:executing-plans",
        "a separate-session coordinator should still drive the worktree-backed parallel topology"
    );
    assert_eq!(
        recommendation.decision_flags.same_session_viable, "no",
        "the same-session flag should remain about session intent, not topology eligibility"
    );
    assert_eq!(recommendation.decision_flags.tasks_independent, "yes");
}

#[test]
fn preflight_acceptance_persists_run_and_chunk_identity_across_fingerprint_changes() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-stable-identities");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let before_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before preflight identity acceptance",
    );
    assert!(
        before_preflight["execution_run_id"].is_null(),
        "execution_run_id should be null before preflight acceptance"
    );

    accept_execution_preflight(repo, state, PLAN_REL);
    let accepted_status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after preflight identity acceptance",
    );
    let accepted_run_id = accepted_status["execution_run_id"]
        .as_str()
        .expect("execution_run_id should be present after preflight acceptance")
        .to_owned();
    let accepted_chunk_id = accepted_status["chunk_id"]
        .as_str()
        .expect("chunk_id should be present after preflight acceptance")
        .to_owned();

    let begin = run_rust_json(
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
            accepted_status["execution_fingerprint"]
                .as_str()
                .expect("accepted status fingerprint should be present"),
        ],
        "begin after preflight identity acceptance",
    );
    assert_ne!(
        begin["execution_fingerprint"], accepted_status["execution_fingerprint"],
        "begin should mutate execution fingerprint after activating work"
    );
    assert_eq!(
        begin["execution_run_id"],
        Value::String(accepted_run_id),
        "execution_run_id should stay stable after preflight acceptance"
    );
    assert_eq!(
        begin["chunk_id"],
        Value::String(accepted_chunk_id),
        "chunk_id should stay stable after preflight acceptance"
    );
}
