#!/usr/bin/env bash
# Setup script for Codex integration tests.
# Creates an isolated HOME/CODEX_HOME while reusing the user's Codex auth.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ORIGINAL_HOME="${HOME:-}"
TEST_ROOT="$(mktemp -d "$REPO_ROOT/.tmp-codex-test.XXXXXX")"

export REPO_ROOT
export ORIGINAL_HOME
export TEST_ROOT
export TEST_HOME="$TEST_ROOT/home"
export HOME="$TEST_HOME"
export XDG_CONFIG_HOME="$TEST_ROOT/xdg"
export CODEX_HOME="$TEST_ROOT/codex-home"
export TEST_PROJECT="$TEST_ROOT/project"
export CODEX_TEST_TIMEOUT="${CODEX_TEST_TIMEOUT:-120}"

mkdir -p \
    "$HOME" \
    "$XDG_CONFIG_HOME" \
    "$CODEX_HOME/agents" \
    "$CODEX_HOME/log" \
    "$CODEX_HOME/sqlite" \
    "$TEST_PROJECT/.agents/skills"

cp "$ORIGINAL_HOME/.codex/auth.json" "$CODEX_HOME/auth.json"
cp "$REPO_ROOT/.codex/examples/agents/"*.toml "$CODEX_HOME/agents/"

cat > "$CODEX_HOME/config.toml" <<EOF
approval_policy = "never"
sandbox_mode = "read-only"
web_search = "disabled"
check_for_update_on_startup = false
cli_auth_credentials_store = "file"
history.persistence = "none"
hide_agent_reasoning = true
model_reasoning_effort = "none"
model_reasoning_summary = "none"
model_verbosity = "low"
sqlite_home = "$CODEX_HOME/sqlite"
log_dir = "$CODEX_HOME/log"
suppress_unstable_features_warning = true

[analytics]
enabled = false

[feedback]
enabled = false

[features]
multi_agent = true
shell_snapshot = false

[agents]
max_threads = 6
max_depth = 1

[agents.explorer]
description = "Read-only codebase explorer for tracing execution paths and gathering evidence before edits."
config_file = "agents/explorer.toml"

[agents.worker]
description = "Implementation-focused agent for the smallest defensible change within an explicit file scope."
config_file = "agents/worker.toml"

[agents.reviewer]
description = "Final reviewer for correctness, regressions, and missing tests before merge or handoff."
config_file = "agents/reviewer.toml"

[agents.monitor]
description = "Wait-focused agent for polling long-running verification and background commands."
config_file = "agents/monitor.toml"

[agents.browser_debugger]
description = "UI debugger that reproduces browser flows and captures evidence before code changes."
config_file = "agents/browser-debugger.toml"

[agents.spec_reviewer]
description = "Read-only reviewer that checks exact scope compliance against the approved task."
config_file = "agents/spec-reviewer.toml"

[agents.quality_reviewer]
description = "Read-only reviewer focused on correctness, tests, and maintainability after scope is approved."
config_file = "agents/quality-reviewer.toml"
EOF

ln -s "$REPO_ROOT/skills" "$TEST_PROJECT/.agents/skills/superpowers"

cleanup_test_env() {
    if [ -n "${TEST_ROOT:-}" ] && [ -d "$TEST_ROOT" ]; then
        rm -rf "$TEST_ROOT"
    fi
}

export -f cleanup_test_env
