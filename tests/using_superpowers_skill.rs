#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

use bin_support::compiled_superpowers_path;
use files_support::write_file;
use json_support::parse_json;
use process_support::{repo_root, run, run_checked};

fn skill_doc_path() -> PathBuf {
    repo_root().join("skills/using-superpowers/SKILL.md")
}

fn read_skill_doc() -> String {
    fs::read_to_string(skill_doc_path()).expect("using-superpowers skill doc should be readable")
}

fn read_repo_file(path: &str) -> String {
    fs::read_to_string(repo_root().join(path))
        .unwrap_or_else(|error| panic!("{path} should be readable: {error}"))
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
        .join("using-superpowers")
        .join(session_key)
}

fn run_bash_block(state_dir: &Path, home_dir: &Path, script: &str, context: &str) -> Output {
    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg(script)
        .current_dir(repo_root())
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .env("HOME", home_dir)
        .env("SUPERPOWERS_COMPAT_BIN", compiled_superpowers_path());
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
        .env("SUPERPOWERS_STATE_DIR", state_dir)
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
_resolve_json="$("$SUPERPOWERS_COMPAT_BIN" session-entry resolve --message-file "$SP_TEST_MESSAGE_FILE" --session-key "$SP_TEST_SESSION_KEY")"
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
    _first_response_kind="superpowers_bypassed"
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

    let output = run_checked(
        {
            let mut command = Command::new("bash");
            command
                .arg("-lc")
                .arg(script)
                .current_dir(repo_root())
                .env("SUPERPOWERS_STATE_DIR", state_dir)
                .env("HOME", home_dir)
                .env("SUPERPOWERS_COMPAT_BIN", compiled_superpowers_path())
                .env("SP_TEST_MESSAGE_FILE", &message_file)
                .env("SP_TEST_SESSION_KEY", session_key);
            command
        },
        session_key,
    );

    parse_json(&output, session_key)
}

#[test]
fn using_superpowers_skill_documents_and_derives_the_canonical_bypass_gate() {
    let content = read_skill_doc();
    let required_patterns = [
        "~/.superpowers/session-entry/using-superpowers/$PPID",
        "superpowers session-entry resolve --message-file <path>",
        "if the session decision is `enabled`, continue into the normal stack",
        "if the session decision is `bypassed` and the user did not explicitly request Superpowers, stop and bypass the rest of this skill",
        "if the user explicitly requests Superpowers or explicitly names a Superpowers skill, rewrite the session decision to `enabled` and continue on the same turn",
        "session-entry bootstrap ownership is runtime-owned",
        "missing or malformed decision state fails closed",
        "If the session decision file exists but contains malformed content:",
        "do not compute `_SESSIONS`",
        "If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to `enabled`:",
        "If the bypass gate resolves to `enabled` for this turn, run the normal shared Superpowers stack before any further Superpowers behavior:",
        "If helpers are unavailable, fallback stays minimal and conservative:",
        "Manual fallback must not infer readiness from the legacy thin header subset.",
        "_UPD=\"\"",
        "_SESSIONS=$(find \"$_SP_STATE_DIR/sessions\" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')",
        "_CONTRIB=\"\"",
        "supported entry paths must ask the bypass question on `needs_user_choice` before the normal stack starts",
    ];
    for pattern in required_patterns {
        assert!(
            content.contains(pattern),
            "using-superpowers skill should contain pattern: {pattern}"
        );
    }
    assert!(
        !content.contains("continue to normal Superpowers behavior"),
        "using-superpowers skill should not use the stale normal-behavior phrase"
    );

    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let output = run_bash_block(
        state_dir.path(),
        temp_home.path(),
        &format!("{preamble}\nprintf \"%s\\n\" \"$_SP_USING_SUPERPOWERS_DECISION_PATH\"\n"),
        "derive using-superpowers decision path",
    );
    let decision_path =
        extract_last_nonempty_line(&output.stdout, "derive using-superpowers decision path");
    let expected_prefix = state_dir
        .path()
        .join("session-entry")
        .join("using-superpowers");
    assert!(
        Path::new(&decision_path).starts_with(&expected_prefix),
        "decision path should live under {:?}, got {}",
        expected_prefix,
        decision_path
    );
}

#[test]
fn using_superpowers_preamble_recognizes_the_repo_checkout_as_a_runtime_root() {
    let content = read_skill_doc();
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let output = run_bash_block_without_override(
        state_dir.path(),
        temp_home.path(),
        &format!("{preamble}\nprintf \"%s\\n\" \"$_SUPERPOWERS_ROOT\"\n"),
        "derive using-superpowers runtime root without compat override",
    );
    let derived_root = extract_last_nonempty_line(
        &output.stdout,
        "derive using-superpowers runtime root without compat override",
    );
    assert_eq!(
        PathBuf::from(&derived_root),
        repo_root(),
        "using-superpowers preamble should recognize the repo checkout as the runtime root without test-only launcher overrides"
    );
}

#[test]
fn using_superpowers_skill_supported_entry_routing_matches_runtime_contract() {
    let content = read_skill_doc();
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let normal_stack = extract_bash_block(&content, "## Normal Superpowers Stack");
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
        "Continue without Superpowers.\n",
    );
    assert_eq!(
        bypassed_output["helper_outcome"],
        Value::String(String::from("bypassed"))
    );
    assert_eq!(
        bypassed_output["first_response_kind"],
        Value::String(String::from("superpowers_bypassed"))
    );
    assert_eq!(bypassed_output["normal_stack_started"], Value::Bool(false));
    assert_eq!(
        bypassed_output["decision_source"],
        Value::String(String::from("existing_bypassed"))
    );

    let reentry_path = canonical_decision_path(state, "reentry-entry");
    write_file(&reentry_path, "bypassed\n");
    let reentry_output = simulate_supported_entry(
        state,
        home,
        &preamble,
        &normal_stack,
        "reentry-entry",
        "superpowers please\n",
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
fn using_superpowers_docs_point_to_rust_gate_instead_of_legacy_shell_tests() {
    for path in [
        "tests/evals/README.md",
        "tests/evals/using-superpowers-routing.scenarios.md",
    ] {
        let content = read_repo_file(path);
        assert!(
            content.contains("cargo nextest run --test using_superpowers_skill"),
            "{path} should point to the Rust gate"
        );
        assert!(
            !content.contains("tests/codex-runtime/test-using-superpowers-bypass.sh"),
            "{path} should no longer point to the removed shell harness"
        );
    }
}
