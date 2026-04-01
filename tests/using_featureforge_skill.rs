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
use std::thread::sleep;
use std::time::Duration;
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

fn parse_json_stdout_lines(output: &[u8], context: &str) -> Vec<Value> {
    let stdout = String::from_utf8(output.to_vec())
        .unwrap_or_else(|error| panic!("{context} should emit utf8: {error}"));
    let lines = stdout
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect::<Vec<_>>();
    let first_json_index = lines
        .iter()
        .position(|line| line.trim_start().starts_with('{'))
        .unwrap_or_else(|| panic!("{context} should emit at least one json line"));
    for line in &lines[..first_json_index] {
        assert!(
            line.starts_with("UPGRADE_AVAILABLE ") || line.starts_with("JUST_UPGRADED "),
            "{context} should not emit unexpected stdout before json lines: {line:?}"
        );
    }
    lines[first_json_index..]
        .iter()
        .map(|line| {
            serde_json::from_str(line).unwrap_or_else(|error| {
                panic!("{context} should emit valid json lines after the preamble output: {error}")
            })
        })
        .collect()
}

fn simulate_supported_route_selection_batch(
    state_dir: &Path,
    home_dir: &Path,
    harness: &RouteSelectionHarness<'_>,
    messages: &[&str],
) -> Vec<Value> {
    let message_dir = state_dir.join(format!("{}-messages", harness.session_key));
    fs::create_dir_all(&message_dir)
        .unwrap_or_else(|error| panic!("{} should create message dir: {error}", harness.session_key));
    let message_paths = messages
        .iter()
        .enumerate()
        .map(|(index, message)| {
            let path = message_dir.join(format!("message-{index}.txt"));
            write_file(&path, message);
            path
        })
        .collect::<Vec<_>>();

    let simulate_calls = message_paths
        .iter()
        .map(|path| format!("simulate_one '{}'", path.display()))
        .collect::<Vec<_>>()
        .join("\n");
    let script = format!(
        r#"
set -euo pipefail
{preamble}
simulate_one() {{
    export SP_TEST_MESSAGE_FILE="$1"
    local _selected_route=""
    _selected_route="$({route_block})"
    if [ -z "$_selected_route" ] && [ -n "${{SP_TEST_IMPLEMENTATION_READY_ROUTE:-}}" ]; then
        _selected_route="$SP_TEST_IMPLEMENTATION_READY_ROUTE"
    fi
    if [ -f "$_SP_STATE_DIR/sessions/$PPID" ]; then
        printf '{{"preamble_session_started":true,"selected_route":"%s"}}\n' "$_selected_route"
    else
        printf '{{"preamble_session_started":false,"selected_route":"%s"}}\n' "$_selected_route"
    fi
}}
{simulate_calls}
"#,
        preamble = harness.preamble,
        route_block = harness.route_block,
        simulate_calls = simulate_calls,
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
                .env("SP_TEST_WORKFLOW_NEXT_SKILL", harness.workflow_next_skill)
                .env(
                    "SP_TEST_IMPLEMENTATION_READY_ROUTE",
                    harness.implementation_ready_route,
                );
            command
        },
        harness.session_key,
    );

    parse_json_stdout_lines(&output.stdout, harness.session_key)
}

#[test]
fn using_featureforge_skill_uses_shared_preamble_without_session_entry_gate() {
    let content = read_skill_doc();
    for pattern in [
        "If helpers are unavailable, fallback stays minimal and conservative:",
        "Manual fallback must not infer readiness from the legacy thin header subset.",
        "If the user is explicitly asking to set up or repair project memory under `docs/project_notes/`, or to log a bug fix in project memory, record a decision in project memory, update key facts in project memory, or otherwise record durable bugs, decisions, key facts, or issue breadcrumbs in repo-visible project memory, short-circuit helper-derived workflow routes and execution handoff paths and route to `featureforge:project-memory`.",
        "Explicit memory-oriented requests such as setting up `docs/project_notes/` or recording durable bugs, decisions, key facts, or issue breadcrumbs should route to `featureforge:project-memory`.",
        "Do not add `featureforge:project-memory` to the default mandatory workflow stack.",
        "When product-work artifact state already points at another active workflow stage, follow that workflow owner first and treat project memory as optional follow-up support unless the user is explicitly asking to work on project memory itself, in which case the explicit project-memory route above takes precedence over helper-derived workflow routes and execution handoff paths.",
        "In manual fallback, choose this route only for explicit memory-oriented requests; vague mentions of notes or docs are not enough.",
        "_UPD=\"\"",
        "_SESSIONS=$(find \"$_SP_STATE_DIR/sessions\" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')",
        "_CONTRIB=\"\"",
    ] {
        assert!(
            content.contains(pattern),
            "using-featureforge skill should contain pattern: {pattern}"
        );
    }
    for removed_pattern in [
        "## Bypass Gate",
        "## Normal FeatureForge Stack",
        "session-entry/using-featureforge/$PPID",
        "featureforge session-entry resolve --message-file <path>",
        "FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY",
        "FEATUREFORGE_SPAWNED_SUBAGENT",
        "FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN",
        "ask one interactive question before any normal FeatureForge work happens",
        "Only after the bypass gate resolves to `enabled` for the current session key",
    ] {
        assert!(
            !content.contains(removed_pattern),
            "using-featureforge skill should omit removed session-entry gate pattern: {removed_pattern}"
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

    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let output = run_bash_block(
        state_dir.path(),
        temp_home.path(),
        &format!("{preamble}\nprintf \"%s\\n\" \"$_SP_STATE_DIR/sessions/$PPID\"\n"),
        "derive using-featureforge shared session marker path",
    );
    let session_marker_path = extract_last_nonempty_line(
        &output.stdout,
        "derive using-featureforge shared session marker path",
    );
    let expected_prefix = state_dir
        .path()
        .join("sessions");
    assert!(
        Path::new(&session_marker_path).starts_with(&expected_prefix),
        "shared session marker path should live under {:?}, got {}",
        expected_prefix,
        session_marker_path
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
fn install_compiled_featureforge_skips_redundant_recopy_for_same_home() {
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let first_target = install_compiled_featureforge(temp_home.path());
    let first_modified = fs::metadata(&first_target)
        .expect("installed binary should exist after first install")
        .modified()
        .expect("installed binary should expose modified time after first install");

    sleep(Duration::from_millis(1200));

    let second_target = install_compiled_featureforge(temp_home.path());
    let second_modified = fs::metadata(&second_target)
        .expect("installed binary should exist after second install")
        .modified()
        .expect("installed binary should expose modified time after second install");

    assert_eq!(first_target, second_target);
    assert_eq!(
        first_modified, second_modified,
        "reinstalling the packaged binary into the same home should skip redundant copies"
    );
}

#[test]
fn using_featureforge_project_memory_carveout_stays_explicit_and_workflow_bound() {
    let content = read_skill_doc();
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let route_block = read_route_contract_fixture();
    let temp_home = TempDir::new().expect("home tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let state = state_dir.path();
    let home = temp_home.path();

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
            route_block: &route_block,
            session_key: "project-memory-route-selection",
            workflow_next_skill: active_owner,
            implementation_ready_route: "",
        };
        let mut messages = Vec::with_capacity(1 + explicit_messages.len() + negative_messages.len() + 1);
        messages.push(vague_message);
        messages.extend(explicit_messages.iter().copied());
        messages.extend(negative_messages.iter().copied());
        messages.push(direct_skill_message);
        let entries = simulate_supported_route_selection_batch(state, home, &harness, &messages);

        let vague_entry = &entries[0];
        assert_eq!(vague_entry["preamble_session_started"], Value::Bool(true));
        assert_eq!(
            vague_entry["selected_route"],
            Value::String(String::from(active_owner)),
            "vague notes or docs requests should keep the active workflow owner",
        );

        let explicit_start = 1;
        let negative_start = explicit_start + explicit_messages.len();
        let direct_index = negative_start + negative_messages.len();

        for (index, _explicit_message) in explicit_messages.iter().enumerate() {
            let explicit_entry = &entries[explicit_start + index];
            assert_eq!(explicit_entry["preamble_session_started"], Value::Bool(true));
            assert_eq!(
                explicit_entry["selected_route"],
                Value::String(String::from("featureforge:project-memory")),
                "explicit project-memory requests should override whichever workflow owner is active",
            );
        }

        for (index, _negative_message) in negative_messages.iter().enumerate() {
            let negative_entry = &entries[negative_start + index];
            assert_eq!(negative_entry["preamble_session_started"], Value::Bool(true));
            assert_eq!(
                negative_entry["selected_route"],
                Value::String(String::from(active_owner)),
                "read-only path mentions or negated skill mentions should keep the active workflow owner",
            );
        }

        let direct_skill_entry = &entries[direct_index];
        assert_eq!(direct_skill_entry["preamble_session_started"], Value::Bool(true));
        assert_eq!(
            direct_skill_entry["selected_route"],
            Value::String(String::from("featureforge:project-memory")),
            "direct project-memory requests should route to project-memory even when another workflow owner exists",
        );
    }

    let handoff_harness = RouteSelectionHarness {
        preamble: &preamble,
        route_block: &route_block,
        session_key: "project-memory-route-handoff",
        workflow_next_skill: "",
        implementation_ready_route: "featureforge:executing-plans",
    };
    let handoff_entries = simulate_supported_route_selection_batch(
        state,
        home,
        &handoff_harness,
        &[
            "Please record a decision in project memory before execution preflight continues.\n",
            vague_message,
        ],
    );
    let handoff_explicit_entry = &handoff_entries[0];
    assert_eq!(
        handoff_explicit_entry["selected_route"],
        Value::String(String::from("featureforge:project-memory")),
        "explicit project-memory requests should override implementation-ready handoff routes",
    );
    let handoff_vague_entry = &handoff_entries[1];
    assert_eq!(
        handoff_vague_entry["selected_route"],
        Value::String(String::from("featureforge:executing-plans")),
        "non-explicit requests should preserve the implementation-ready handoff route",
    );
}
