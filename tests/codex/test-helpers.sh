#!/usr/bin/env bash
# Helper functions for Codex skill tests
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ORIGINAL_CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"

setup_codex_test_env() {
    export TEST_ROOT
    TEST_ROOT="$(mktemp -d)"
    export HOME="$TEST_ROOT/home"
    export CODEX_HOME="$TEST_ROOT/codex-home"

    mkdir -p "$HOME/.agents/skills" "$CODEX_HOME"
    ln -s "$REPO_ROOT/skills" "$HOME/.agents/skills/superpowers"

    if [ -f "$ORIGINAL_CODEX_HOME/auth.json" ]; then
        cp "$ORIGINAL_CODEX_HOME/auth.json" "$CODEX_HOME/auth.json"
    fi

    cat > "$CODEX_HOME/config.toml" <<'EOF'
[features]
multi_agent = true
EOF
}

cleanup_codex_test_env() {
    if [ -n "${TEST_ROOT:-}" ] && [ -d "$TEST_ROOT" ]; then
        rm -rf "$TEST_ROOT"
    fi
}

create_test_project() {
    mktemp -d
}

cleanup_test_project() {
    local test_dir="$1"
    if [ -d "$test_dir" ]; then
        rm -rf "$test_dir"
    fi
}

run_codex() {
    local prompt="$1"
    local project_dir="$2"
    local timeout_seconds="${3:-60}"
    local output_file
    output_file=$(mktemp)

    if timeout "$timeout_seconds" env HOME="$HOME" CODEX_HOME="$CODEX_HOME" codex exec \
        --skip-git-repo-check \
        -C "$project_dir" \
        -s workspace-write \
        "$prompt" > "$output_file" 2>&1; then
        cat "$output_file"
        rm -f "$output_file"
        return 0
    else
        local exit_code=$?
        cat "$output_file" >&2
        rm -f "$output_file"
        return "$exit_code"
    fi
}

run_codex_json_to_file() {
    local prompt="$1"
    local project_dir="$2"
    local output_file="$3"
    local timeout_seconds="${4:-1800}"

    timeout "$timeout_seconds" env HOME="$HOME" CODEX_HOME="$CODEX_HOME" codex exec \
        --json \
        --skip-git-repo-check \
        -C "$project_dir" \
        -s workspace-write \
        "$prompt" > "$output_file" 2>&1
}

latest_codex_session_file() {
    find "$CODEX_HOME/sessions" -name "*.jsonl" -type f 2>/dev/null | sort -r | head -1
}

assert_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -Eq "$pattern"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected to find: $pattern"
        echo "  In output:"
        echo "$output" | sed 's/^/    /'
        return 1
    fi
}

assert_not_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -Eq "$pattern"; then
        echo "  [FAIL] $test_name"
        echo "  Did not expect to find: $pattern"
        echo "  In output:"
        echo "$output" | sed 's/^/    /'
        return 1
    else
        echo "  [PASS] $test_name"
        return 0
    fi
}

assert_order() {
    local output="$1"
    local pattern_a="$2"
    local pattern_b="$3"
    local test_name="${4:-test}"

    local line_a
    local line_b
    line_a=$(echo "$output" | grep -En "$pattern_a" | head -1 | cut -d: -f1 || true)
    line_b=$(echo "$output" | grep -En "$pattern_b" | head -1 | cut -d: -f1 || true)

    if [ -z "$line_a" ]; then
        echo "  [FAIL] $test_name: pattern A not found: $pattern_a"
        return 1
    fi

    if [ -z "$line_b" ]; then
        echo "  [FAIL] $test_name: pattern B not found: $pattern_b"
        return 1
    fi

    if [ "$line_a" -lt "$line_b" ]; then
        echo "  [PASS] $test_name (A at line $line_a, B at line $line_b)"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected '$pattern_a' before '$pattern_b'"
        echo "  But found A at line $line_a, B at line $line_b"
        return 1
    fi
}

export -f setup_codex_test_env
export -f cleanup_codex_test_env
export -f create_test_project
export -f cleanup_test_project
export -f run_codex
export -f run_codex_json_to_file
export -f latest_codex_session_file
export -f assert_contains
export -f assert_not_contains
export -f assert_order
export REPO_ROOT
