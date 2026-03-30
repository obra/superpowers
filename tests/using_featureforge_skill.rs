#[path = "support/files.rs"]
mod files_support;
#[path = "support/install.rs"]
mod install_support;
#[path = "support/process.rs"]
mod process_support;

use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

use files_support::write_file;
use install_support::install_compiled_featureforge;
use process_support::{repo_root, run, run_checked};

fn skill_doc_path() -> PathBuf {
    repo_root().join("skills/using-featureforge/SKILL.md")
}

fn read_skill_doc() -> String {
    fs::read_to_string(skill_doc_path()).expect("using-featureforge skill doc should be readable")
}

fn route_contract_fixture_path() -> PathBuf {
    repo_root().join("tests/fixtures/using-featureforge-project-memory-route-contract.sh")
}

fn read_route_contract_fixture() -> String {
    fs::read_to_string(route_contract_fixture_path())
        .expect("using-featureforge route contract fixture should be readable")
}

struct RouteSelectionHarness<'a> {
    preamble: &'a str,
    normal_stack: &'a str,
    route_block: &'a str,
    session_key: &'a str,
    workflow_next_skill: &'a str,
    implementation_ready_route: &'a str,
}

fn extract_bash_block(content: &str, heading: &str) -> String {
    let mut in_heading = false;
    let mut in_block = false;
    let mut lines = Vec::new();

    for line in content.lines() {
        if !in_heading {
            if line == heading {
                in_heading = true;
            }
            continue;
        }
        if !in_block {
            if line == "```bash" {
                in_block = true;
            }
            continue;
        }
        if line == "```" {
            break;
        }
        lines.push(line);
    }

    assert!(
        !lines.is_empty(),
        "expected bash block under heading {heading}"
    );
    lines.join("\n")
}

fn canonical_decision_path(state_dir: &Path, session_key: &str) -> PathBuf {
    state_dir
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key)
}

fn run_bash_block(state_dir: &Path, home_dir: &Path, script: &str, context: &str) -> Output {
    install_compiled_featureforge(home_dir);
    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg(script)
        .current_dir(repo_root())
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .env("HOME", home_dir);
    run(command, context)
}

fn run_bash_block_without_override(
    state_dir: &Path,
    home_dir: &Path,
    script: &str,
    context: &str,
) -> Output {
    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg(script)
        .current_dir(repo_root())
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .env("HOME", home_dir);
    run(command, context)
}

fn extract_last_nonempty_line(output: &[u8], context: &str) -> String {
    String::from_utf8(output.to_vec())
        .unwrap_or_else(|error| panic!("{context} should emit utf8: {error}"))
        .lines()
        .rev()
        .find(|line| !line.trim().is_empty())
        .unwrap_or_else(|| panic!("{context} should emit a non-empty line"))
        .to_owned()
}

fn parse_supported_entry_stdout(output: &[u8], context: &str) -> Value {
    let stdout = String::from_utf8(output.to_vec())
        .unwrap_or_else(|error| panic!("{context} should emit utf8: {error}"));
    let lines = stdout
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect::<Vec<_>>();
    let Some(json_line) = lines.last() else {
        panic!("{context} should emit a final json line");
    };
    for line in &lines[..lines.len().saturating_sub(1)] {
        assert!(
            line.starts_with("UPGRADE_AVAILABLE ") || line.starts_with("JUST_UPGRADED "),
            "{context} should not emit unexpected stdout before the final json line: {line:?}"
        );
    }
    serde_json::from_str(json_line)
        .unwrap_or_else(|error| panic!("{context} should emit valid json on the last line: {error}"))
}

fn simulate_supported_entry(
    state_dir: &Path,
    home_dir: &Path,
    preamble: &str,
    normal_stack: &str,
    session_key: &str,
    message: &str,
) -> Value {
    let message_file = state_dir.join(format!("{session_key}.txt"));
    write_file(&message_file, message);

    let script = format!(
        r#"
set -euo pipefail
{preamble}
_resolve_json="$("$_FEATUREFORGE_BIN" session-entry resolve --message-file "$SP_TEST_MESSAGE_FILE" --session-key "$SP_TEST_SESSION_KEY")"
eval "$(
  RESOLVE_JSON="$_resolve_json" python3 - <<'PY'
import json
import os
import shlex

data = json.loads(os.environ["RESOLVE_JSON"])
prompt = data.get("prompt") or {{}}
fields = {{
    "SP_TEST_OUTCOME": data.get("outcome", ""),
    "SP_TEST_DECISION_SOURCE": data.get("decision_source", ""),
    "SP_TEST_DECISION_PATH": data.get("decision_path", ""),
    "SP_TEST_PROMPT_QUESTION": prompt.get("question", ""),
}}
for key, value in fields.items():
    print(f"{{key}}={{shlex.quote(str(value))}}")
PY
)"
_first_response_kind=""
_normal_stack_session_path=""
case "$SP_TEST_OUTCOME" in
  needs_user_choice)
    _first_response_kind="bypass_prompt"
    ;;
  enabled)
{normal_stack}
    _first_response_kind="normal_stack"
    _normal_stack_session_path="$_SP_STATE_DIR/sessions/$PPID"
    ;;
  bypassed)
    _first_response_kind="featureforge_bypassed"
    ;;
  *)
    _first_response_kind="runtime_failure"
    ;;
esac
SP_TEST_OUTCOME="$SP_TEST_OUTCOME" \
SP_TEST_DECISION_SOURCE="$SP_TEST_DECISION_SOURCE" \
SP_TEST_DECISION_PATH="$SP_TEST_DECISION_PATH" \
SP_TEST_PROMPT_QUESTION="$SP_TEST_PROMPT_QUESTION" \
SP_TEST_FIRST_RESPONSE_KIND="$_first_response_kind" \
SP_TEST_NORMAL_STACK_SESSION_PATH="$_normal_stack_session_path" \
python3 - <<'PY'
import json
import os
from pathlib import Path

normal_stack_session_path = os.environ["SP_TEST_NORMAL_STACK_SESSION_PATH"]
print(json.dumps({{
    "first_response_kind": os.environ["SP_TEST_FIRST_RESPONSE_KIND"],
    "normal_stack_started": bool(normal_stack_session_path) and Path(normal_stack_session_path).is_file(),
    "helper_outcome": os.environ["SP_TEST_OUTCOME"],
    "decision_source": os.environ["SP_TEST_DECISION_SOURCE"],
    "decision_path": os.environ["SP_TEST_DECISION_PATH"],
    "normal_stack_session_path": normal_stack_session_path,
    "prompt_question": os.environ["SP_TEST_PROMPT_QUESTION"],
}}))
PY
"#
    );

    install_compiled_featureforge(home_dir);
    let output = run_checked(
        {
            let mut command = Command::new("bash");
            command
                .arg("-lc")
                .arg(script)
                .current_dir(repo_root())
                .env("FEATUREFORGE_STATE_DIR", state_dir)
                .env("HOME", home_dir)
                .env("SP_TEST_MESSAGE_FILE", &message_file)
                .env("SP_TEST_SESSION_KEY", session_key);
            command
        },
        session_key,
    );

    parse_supported_entry_stdout(&output.stdout, session_key)
}

fn simulate_supported_route_selection(
    state_dir: &Path,
    home_dir: &Path,
    harness: &RouteSelectionHarness<'_>,
    message: &str,
) -> Value {
    let message_file = state_dir.join(format!("{}.txt", harness.session_key));
    write_file(&message_file, message);

    let script = format!(
        r#"
set -euo pipefail
{preamble}
_resolve_json="$("$_FEATUREFORGE_BIN" session-entry resolve --message-file "$SP_TEST_MESSAGE_FILE" --session-key "$SP_TEST_SESSION_KEY")"
eval "$(
  RESOLVE_JSON="$_resolve_json" python3 - <<'PY'
import json
import os
import shlex

data = json.loads(os.environ["RESOLVE_JSON"])
prompt = data.get("prompt") or {{}}
fields = {{
    "SP_TEST_OUTCOME": data.get("outcome", ""),
    "SP_TEST_DECISION_SOURCE": data.get("decision_source", ""),
    "SP_TEST_DECISION_PATH": data.get("decision_path", ""),
    "SP_TEST_PROMPT_QUESTION": prompt.get("question", ""),
}}
for key, value in fields.items():
    print(f"{{key}}={{shlex.quote(str(value))}}")
PY
)"
_first_response_kind=""
_normal_stack_session_path=""
_selected_route=""
case "$SP_TEST_OUTCOME" in
  needs_user_choice)
    _first_response_kind="bypass_prompt"
    ;;
  enabled)
{normal_stack}
    _first_response_kind="normal_stack"
    _normal_stack_session_path="$_SP_STATE_DIR/sessions/$PPID"
    _selected_route="$(
{route_block}
)"
    if [ -z "$_selected_route" ] && [ -n "${{SP_TEST_IMPLEMENTATION_READY_ROUTE:-}}" ]; then
      _selected_route="$SP_TEST_IMPLEMENTATION_READY_ROUTE"
    fi
    ;;
  bypassed)
    _first_response_kind="featureforge_bypassed"
    ;;
  *)
    _first_response_kind="runtime_failure"
    ;;
esac
SP_TEST_OUTCOME="$SP_TEST_OUTCOME" \
SP_TEST_DECISION_SOURCE="$SP_TEST_DECISION_SOURCE" \
SP_TEST_DECISION_PATH="$SP_TEST_DECISION_PATH" \
SP_TEST_PROMPT_QUESTION="$SP_TEST_PROMPT_QUESTION" \
SP_TEST_FIRST_RESPONSE_KIND="$_first_response_kind" \
SP_TEST_NORMAL_STACK_SESSION_PATH="$_normal_stack_session_path" \
SP_TEST_SELECTED_ROUTE="$_selected_route" \
python3 - <<'PY'
import json
import os
from pathlib import Path

normal_stack_session_path = os.environ["SP_TEST_NORMAL_STACK_SESSION_PATH"]
print(json.dumps({{
    "first_response_kind": os.environ["SP_TEST_FIRST_RESPONSE_KIND"],
    "normal_stack_started": bool(normal_stack_session_path) and Path(normal_stack_session_path).is_file(),
    "helper_outcome": os.environ["SP_TEST_OUTCOME"],
    "decision_source": os.environ["SP_TEST_DECISION_SOURCE"],
    "decision_path": os.environ["SP_TEST_DECISION_PATH"],
    "normal_stack_session_path": normal_stack_session_path,
    "prompt_question": os.environ["SP_TEST_PROMPT_QUESTION"],
    "selected_route": os.environ["SP_TEST_SELECTED_ROUTE"],
}}))
PY
"#,
        preamble = harness.preamble,
        normal_stack = harness.normal_stack,
        route_block = harness.route_block,
    );

    install_compiled_featureforge(home_dir);
    let output = run_checked(
        {
            let mut command = Command::new("bash");
            command
                .arg("-lc")
                .arg(script)
                .current_dir(repo_root())
                .env("FEATUREFORGE_STATE_DIR", state_dir)
                .env("HOME", home_dir)
                .env("SP_TEST_MESSAGE_FILE", &message_file)
                .env("SP_TEST_SESSION_KEY", harness.session_key)
                .env("SP_TEST_WORKFLOW_NEXT_SKILL", harness.workflow_next_skill)
                .env(
                    "SP_TEST_IMPLEMENTATION_READY_ROUTE",
                    harness.implementation_ready_route,
                );
            command
        },
        harness.session_key,
    );

    parse_supported_entry_stdout(&output.stdout, harness.session_key)
}

#[test]
fn using_featureforge_skill_documents_and_derives_the_canonical_bypass_gate() {
    let content = read_skill_doc();
    let normal_stack = extract_bash_block(&content, "## Normal FeatureForge Stack");
    let required_patterns = [
        "~/.featureforge/session-entry/using-featureforge/$PPID",
        "featureforge session-entry resolve --message-file <path>",
        "featureforge session-entry resolve --message-file <path> --spawned-subagent",
        "featureforge session-entry resolve --message-file <path> --spawned-subagent --spawned-subagent-opt-in",
        "if the session decision is `enabled`, continue into the normal stack",
        "if the session decision is `bypassed` and the user did not explicitly request FeatureForge, stop and bypass the rest of this skill",
        "if the user explicitly requests FeatureForge or explicitly names a FeatureForge skill, rewrite the session decision to `enabled` and continue on the same turn",
        "default spawned-subagent bypass is ephemeral and non-persisted",
        "supported spawned-subagent entry paths must pass the runtime marker instead of inventing prose-only bypass behavior",
        "session-entry bootstrap ownership is runtime-owned",
        "missing or malformed decision state fails closed",
        "If the session decision file exists but contains malformed content:",
        "do not compute `_SESSIONS`",
        "If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to `enabled`:",
        "If the bypass gate resolves to `enabled` for this turn, run the normal shared FeatureForge stack before any further FeatureForge behavior:",
        "If helpers are unavailable, fallback stays minimal and conservative:",
        "Manual fallback must not infer readiness from the legacy thin header subset.",
        "If the user is explicitly asking to set up or repair project memory under `docs/project_notes/`, or to log a bug fix in project memory, record a decision in project memory, update key facts in project memory, or otherwise record durable bugs, decisions, key facts, or issue breadcrumbs in repo-visible project memory, short-circuit helper-derived workflow routes and execution handoff paths and route to `featureforge:project-memory`.",
        "Explicit memory-oriented requests such as setting up `docs/project_notes/` or recording durable bugs, decisions, key facts, or issue breadcrumbs should route to `featureforge:project-memory`.",
        "Do not add `featureforge:project-memory` to the default mandatory workflow stack.",
        "When product-work artifact state already points at another active workflow stage, follow that workflow owner first and treat project memory as optional follow-up support unless the user is explicitly asking to work on project memory itself, in which case the explicit project-memory route above takes precedence over helper-derived workflow routes and execution handoff paths.",
        "In manual fallback, choose this route only for explicit memory-oriented requests; vague mentions of notes or docs are not enough.",
        "_UPD=\"\"",
        "export FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY=1",
        "_SESSIONS=$(find \"$_SP_STATE_DIR/sessions\" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')",
        "_CONTRIB=\"\"",
        "supported entry paths must ask the bypass question on `needs_user_choice` before the normal stack starts",
        "Only after the bypass gate resolves to `enabled` for the current session key, if `$_FEATUREFORGE_BIN` is available call `$_FEATUREFORGE_BIN workflow status --refresh`.",
    ];
    for pattern in required_patterns {
        assert!(
            content.contains(pattern),
            "using-featureforge skill should contain pattern: {pattern}"
        );
    }
    assert!(
        !content.contains("continue to normal FeatureForge behavior"),
        "using-featureforge skill should not use the stale normal-behavior phrase"
    );
    assert!(
        !content.contains("SP_TEST_MESSAGE_FILE"),
        "using-featureforge skill should not expose the test message env var"
    );
    assert!(
        !content.contains("SP_TEST_WORKFLOW_NEXT_SKILL"),
        "using-featureforge skill should not expose the test route env var"
    );
    let explicit_memory_route_index = content
        .find("If the user is explicitly asking to set up or repair project memory under `docs/project_notes/`, or to log a bug fix in project memory, record a decision in project memory, update key facts in project memory, or otherwise record durable bugs, decisions, key facts, or issue breadcrumbs in repo-visible project memory, short-circuit helper-derived workflow routes and execution handoff paths and route to `featureforge:project-memory`.")
        .expect("using-featureforge skill should document explicit-memory routing precedence");
    let generic_next_skill_index = content
        .find("If the JSON result contains a non-empty `next_skill`, use that route.")
        .expect("using-featureforge skill should still document generic next_skill routing");
    let implementation_ready_index = content
        .find("If the JSON result reports `status` `implementation_ready`, proceed to the normal execution preflight and handoff flow using the exact approved plan path.")
        .expect("using-featureforge skill should still document implementation-ready handoff routing");
    assert!(
        explicit_memory_route_index < generic_next_skill_index,
        "explicit project-memory routing should be documented before the generic next_skill rule"
    );
    assert!(
        explicit_memory_route_index < implementation_ready_index,
        "explicit project-memory routing should be documented before the implementation-ready handoff rule"
    );
    assert!(
        !normal_stack.contains("featureforge:project-memory"),
        "normal featureforge stack should not route through project-memory by default"
    );

    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let output = run_bash_block(
        state_dir.path(),
        temp_home.path(),
        &format!("{preamble}\nprintf \"%s\\n\" \"$_SP_USING_FEATUREFORGE_DECISION_PATH\"\n"),
        "derive using-featureforge decision path",
    );
    let decision_path =
        extract_last_nonempty_line(&output.stdout, "derive using-featureforge decision path");
    let expected_prefix = state_dir
        .path()
        .join("session-entry")
        .join("using-featureforge");
    assert!(
        Path::new(&decision_path).starts_with(&expected_prefix),
        "decision path should live under {:?}, got {}",
        expected_prefix,
        decision_path
    );
}

#[test]
fn using_featureforge_preamble_requires_the_packaged_runtime_binary() {
    let content = read_skill_doc();
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let output = run_bash_block_without_override(
        state_dir.path(),
        temp_home.path(),
        &format!("{preamble}\nprintf \"%s\\n\" \"$_FEATUREFORGE_ROOT\"\n"),
        "derive using-featureforge runtime root without packaged binary",
    );
    let stdout = String::from_utf8(output.stdout)
        .expect("runtime root without packaged binary should emit utf8");
    assert_eq!(
        stdout.trim_end(),
        "",
        "using-featureforge preamble should not guess a runtime root without the packaged install binary"
    );
}

#[test]
fn using_featureforge_skill_supported_entry_routing_matches_runtime_contract() {
    let content = read_skill_doc();
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let normal_stack = extract_bash_block(&content, "## Normal FeatureForge Stack");
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let state = state_dir.path();
    let home = temp_home.path();

    let missing_output = simulate_supported_entry(
        state,
        home,
        &preamble,
        &normal_stack,
        "fresh-entry",
        "Please route this from a fresh entry path.\n",
    );
    assert_eq!(
        missing_output["helper_outcome"],
        Value::String(String::from("needs_user_choice"))
    );
    assert_eq!(
        missing_output["first_response_kind"],
        Value::String(String::from("bypass_prompt"))
    );
    assert_eq!(missing_output["normal_stack_started"], Value::Bool(false));
    assert_eq!(
        missing_output["decision_source"],
        Value::String(String::from("missing"))
    );
    assert_eq!(
        missing_output["decision_path"],
        Value::String(
            canonical_decision_path(state, "fresh-entry")
                .to_string_lossy()
                .into_owned()
        )
    );
    assert!(
        !missing_output["prompt_question"]
            .as_str()
            .unwrap_or_default()
            .is_empty()
    );

    let malformed_path = canonical_decision_path(state, "malformed-entry");
    write_file(&malformed_path, "corrupt\nextra\n");
    let malformed_output = simulate_supported_entry(
        state,
        home,
        &preamble,
        &normal_stack,
        "malformed-entry",
        "Please route this from malformed state.\n",
    );
    assert_eq!(
        malformed_output["helper_outcome"],
        Value::String(String::from("needs_user_choice"))
    );
    assert_eq!(
        malformed_output["first_response_kind"],
        Value::String(String::from("bypass_prompt"))
    );
    assert_eq!(malformed_output["normal_stack_started"], Value::Bool(false));
    assert_eq!(
        malformed_output["decision_source"],
        Value::String(String::from("malformed"))
    );
    assert_eq!(
        malformed_output["decision_path"],
        Value::String(malformed_path.to_string_lossy().into_owned())
    );

    let enabled_path = canonical_decision_path(state, "enabled-entry");
    write_file(&enabled_path, "enabled\n");
    let enabled_output = simulate_supported_entry(
        state,
        home,
        &preamble,
        &normal_stack,
        "enabled-entry",
        "Please route this from enabled state.\n",
    );
    assert_eq!(
        enabled_output["helper_outcome"],
        Value::String(String::from("enabled"))
    );
    assert_eq!(
        enabled_output["first_response_kind"],
        Value::String(String::from("normal_stack"))
    );
    assert_eq!(enabled_output["normal_stack_started"], Value::Bool(true));
    assert_eq!(
        enabled_output["decision_source"],
        Value::String(String::from("existing_enabled"))
    );
    assert!(
        !enabled_output["normal_stack_session_path"]
            .as_str()
            .unwrap_or_default()
            .is_empty()
    );

    let bypassed_path = canonical_decision_path(state, "bypassed-entry");
    write_file(&bypassed_path, "bypassed\n");
    let bypassed_output = simulate_supported_entry(
        state,
        home,
        &preamble,
        &normal_stack,
        "bypassed-entry",
        "Continue without FeatureForge.\n",
    );
    assert_eq!(
        bypassed_output["helper_outcome"],
        Value::String(String::from("bypassed"))
    );
    assert_eq!(
        bypassed_output["first_response_kind"],
        Value::String(String::from("featureforge_bypassed"))
    );
    assert_eq!(bypassed_output["normal_stack_started"], Value::Bool(false));
    assert_eq!(
        bypassed_output["decision_source"],
        Value::String(String::from("existing_bypassed"))
    );

    for (session_key, message) in [
        (
            "fresh-spec-review-intent",
            "Please review this draft spec from a fresh session.\n",
        ),
        (
            "fresh-plan-review-intent",
            "Please review this draft plan from a fresh session.\n",
        ),
        (
            "fresh-execution-preflight-intent",
            "Please start implementation from the approved plan in this fresh session.\n",
        ),
    ] {
        let fresh_output =
            simulate_supported_entry(state, home, &preamble, &normal_stack, session_key, message);
        assert_eq!(
            fresh_output["helper_outcome"],
            Value::String(String::from("needs_user_choice")),
            "{session_key} should surface the bypass prompt before any later routing"
        );
        assert_eq!(
            fresh_output["first_response_kind"],
            Value::String(String::from("bypass_prompt")),
            "{session_key} should surface the bypass prompt first"
        );
        assert_eq!(
            fresh_output["normal_stack_started"],
            Value::Bool(false),
            "{session_key} should not enter the normal stack before the bypass decision"
        );
        assert_eq!(
            fresh_output["decision_source"],
            Value::String(String::from("missing")),
            "{session_key} should stay a missing-decision fresh entry"
        );
    }

    let reentry_path = canonical_decision_path(state, "reentry-entry");
    write_file(&reentry_path, "bypassed\n");
    let reentry_output = simulate_supported_entry(
        state,
        home,
        &preamble,
        &normal_stack,
        "reentry-entry",
        "featureforge please\n",
    );
    assert_eq!(
        reentry_output["helper_outcome"],
        Value::String(String::from("enabled"))
    );
    assert_eq!(
        reentry_output["first_response_kind"],
        Value::String(String::from("normal_stack"))
    );
    assert_eq!(reentry_output["normal_stack_started"], Value::Bool(true));
    assert_eq!(
        reentry_output["decision_source"],
        Value::String(String::from("explicit_reentry"))
    );
    assert_eq!(
        fs::read_to_string(&reentry_path).expect("reentry path should be readable"),
        "enabled\n"
    );
}

#[test]
fn using_featureforge_project_memory_carveout_stays_explicit_and_workflow_bound() {
    let content = read_skill_doc();
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let normal_stack = extract_bash_block(&content, "## Normal FeatureForge Stack");
    let route_block = read_route_contract_fixture();
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let state = state_dir.path();
    let home = temp_home.path();

    let enabled_path = canonical_decision_path(state, "project-memory-route-enabled");
    write_file(&enabled_path, "enabled\n");

    let vague_message = "Please add some notes to the docs after plan review.\n";
    let direct_skill_message =
        "Please use featureforge:project-memory and work on project memory itself for this follow-up.\n";
    let explicit_messages = [
        "Please set up project memory for this repo before planning.\n",
        "Please log this bug fix in project memory before continuing plan review.\n",
        "Please log a bug fix in project memory before continuing plan review.\n",
        "Please log a bug fix in docs/project_notes/bugs.md before continuing plan review.\n",
        "Please record this decision in project memory before continuing plan review.\n",
        "Please record a decision in project memory before continuing plan review.\n",
        "Please update our key facts in project memory before continuing plan review.\n",
        "Please record durable issue breadcrumbs in project memory before continuing plan review.\n",
        "Please record issue breadcrumbs in docs/project_notes/issues.md before continuing plan review.\n",
        "Please repair docs/project_notes/README.md before continuing plan review.\n",
        "Please rewrite docs/project_notes/issues.md before continuing plan review.\n",
        "Please add a breadcrumb to docs/project_notes/issues.md before continuing plan review.\n",
        "Please write docs/project_notes/issues.md with the latest breadcrumb before continuing plan review.\n",
        "Please create docs/project_notes/issues.md if it is missing before continuing plan review.\n",
        "Please prune outdated breadcrumbs from docs/project_notes/issues.md before continuing plan review.\n",
        "Please delete stale notes from docs/project_notes/issues.md before continuing plan review.\n",
        "Please record durable bugs in docs/project_notes/bugs.md before continuing plan review.\n",
    ];
    let negative_messages = [
        "What does docs/project_notes/bugs.md say right now?\n",
        "Please read docs/project_notes/issues.md before continuing plan review.\n",
        "Do not use featureforge:project-memory for this follow-up.\n",
        "Please do not set up project memory before planning.\n",
        "Please do not log a bug fix in project memory before continuing plan review.\n",
        "Please do not record a decision in project memory before continuing plan review.\n",
        "Please do not update our key facts in project memory before continuing plan review.\n",
        "Please do not rewrite docs/project_notes/issues.md before continuing plan review.\n",
        "Please do not add a breadcrumb to docs/project_notes/issues.md before continuing plan review.\n",
        "Please do not prune docs/project_notes/issues.md before continuing plan review.\n",
        "Please do not delete docs/project_notes/issues.md before continuing plan review.\n",
        "Please record a decision in the approved plan before continuing.\n",
        "Please log a bug fix in the execution evidence before continuing.\n",
        "Please update our key facts in the approved spec before continuing.\n",
    ];

    for active_owner in [
        "featureforge:plan-eng-review",
        "featureforge:writing-plans",
        "featureforge:executing-plans",
        "featureforge:subagent-driven-development",
    ] {
        let harness = RouteSelectionHarness {
            preamble: &preamble,
            normal_stack: &normal_stack,
            route_block: &route_block,
            session_key: "project-memory-route-enabled",
            workflow_next_skill: active_owner,
            implementation_ready_route: "",
        };
        let vague_entry = simulate_supported_route_selection(state, home, &harness, vague_message);
        assert_eq!(
            vague_entry["helper_outcome"],
            Value::String(String::from("enabled")),
            "active-workflow precedence coverage should run through the real enabled entry path",
        );
        assert_eq!(
            vague_entry["first_response_kind"],
            Value::String(String::from("normal_stack")),
            "enabled entry should continue through the normal stack before route selection",
        );
        assert_eq!(
            vague_entry["selected_route"],
            Value::String(String::from(active_owner)),
            "vague notes or docs requests should keep the active workflow owner",
        );

        for explicit_message in explicit_messages {
            let explicit_entry =
                simulate_supported_route_selection(state, home, &harness, explicit_message);
            assert_eq!(
                explicit_entry["helper_outcome"],
                Value::String(String::from("enabled")),
                "explicit project-memory routing should still use the real enabled entry path",
            );
            assert_eq!(
                explicit_entry["selected_route"],
                Value::String(String::from("featureforge:project-memory")),
                "explicit project-memory requests should override whichever workflow owner is active",
            );
        }

        for negative_message in negative_messages {
            let negative_entry =
                simulate_supported_route_selection(state, home, &harness, negative_message);
            assert_eq!(
                negative_entry["helper_outcome"],
                Value::String(String::from("enabled")),
                "negative route coverage should still use the real enabled entry path",
            );
            assert_eq!(
                negative_entry["selected_route"],
                Value::String(String::from(active_owner)),
                "read-only path mentions or negated skill mentions should keep the active workflow owner",
            );
        }

        let direct_skill_entry =
            simulate_supported_route_selection(state, home, &harness, direct_skill_message);
        assert_eq!(
            direct_skill_entry["helper_outcome"],
            Value::String(String::from("enabled")),
            "direct project-memory skill requests should still use the real enabled entry path",
        );
        assert_eq!(
            direct_skill_entry["selected_route"],
            Value::String(String::from("featureforge:project-memory")),
            "direct project-memory requests should route to project-memory even when another workflow owner exists",
        );
    }

    let handoff_harness = RouteSelectionHarness {
        preamble: &preamble,
        normal_stack: &normal_stack,
        route_block: &route_block,
        session_key: "project-memory-route-enabled",
        workflow_next_skill: "",
        implementation_ready_route: "featureforge:executing-plans",
    };
    let handoff_explicit_entry = simulate_supported_route_selection(
        state,
        home,
        &handoff_harness,
        "Please record a decision in project memory before execution preflight continues.\n",
    );
    assert_eq!(
        handoff_explicit_entry["selected_route"],
        Value::String(String::from("featureforge:project-memory")),
        "explicit project-memory requests should override implementation-ready handoff routes",
    );
    let handoff_vague_entry = simulate_supported_route_selection(
        state,
        home,
        &handoff_harness,
        vague_message,
    );
    assert_eq!(
        handoff_vague_entry["selected_route"],
        Value::String(String::from("featureforge:executing-plans")),
        "non-explicit requests should preserve the implementation-ready handoff route",
    );
}
