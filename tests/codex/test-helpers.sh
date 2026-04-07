#!/usr/bin/env bash
# Helper functions for Codex skill tests
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ORIGINAL_CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
CODEX_TEST_MODEL="gpt-5.4"
CODEX_TEST_REASONING_EFFORT="xhigh"

normalize_codex_path() {
    local path="$1"

    if command -v cygpath >/dev/null 2>&1; then
        cygpath -am "$path"
    else
        printf '%s\n' "$path"
    fi
}

setup_codex_test_env() {
    export TEST_ROOT
    TEST_ROOT="$(mktemp -d)"
    export HOME="$TEST_ROOT/home"
    export CODEX_HOME="$TEST_ROOT/codex-home"
    export USERPROFILE

    USERPROFILE="$(normalize_codex_path "$HOME")"

    mkdir -p \
        "$HOME/.agents/skills" \
        "$HOME/.codex/agents" \
        "$HOME/.codex/superpowers/skills" \
        "$CODEX_HOME/agents" \
        "$CODEX_HOME/superpowers/skills" \
        "$CODEX_HOME/superpowers/hooks"
    ln -s "$REPO_ROOT/skills" "$HOME/.agents/skills/superpowers"
    cp -R "$REPO_ROOT/skills/." "$HOME/.codex/superpowers/skills/"
    cp -R "$REPO_ROOT/skills/." "$CODEX_HOME/superpowers/skills/"
    cp -R "$REPO_ROOT/hooks/." "$CODEX_HOME/superpowers/hooks/"
    cp "$REPO_ROOT/.codex/agents/"*.toml "$CODEX_HOME/agents/"
    cp "$REPO_ROOT/.codex/agents/"*.toml "$HOME/.codex/agents/"

    cat > "$CODEX_HOME/config.toml" <<EOF
model = "$CODEX_TEST_MODEL"
model_reasoning_effort = "$CODEX_TEST_REASONING_EFFORT"
EOF

    if [ -f "$ORIGINAL_CODEX_HOME/auth.json" ]; then
        cp "$ORIGINAL_CODEX_HOME/auth.json" "$CODEX_HOME/auth.json"
    fi

    install_codex_session_start_hook
}

install_codex_session_start_hook() {
    cat > "$CODEX_HOME/hooks.json" <<EOF
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "^(startup|resume)$",
        "hooks": [
          {
            "type": "command",
            "command": "SUPERPOWERS_HOOK_TARGET=codex bash \"$CODEX_HOME/superpowers/hooks/session-start\"",
            "statusMessage": "loading superpowers",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
EOF
}

cleanup_codex_test_env() {
    if [ -n "${TEST_ROOT:-}" ] && [ -d "$TEST_ROOT" ]; then
        rm -rf "$TEST_ROOT"
    fi
}

create_test_project() {
    local test_dir

    test_dir="$(mktemp -d)"
    mkdir -p "$test_dir/.agents"
    ln -s "$REPO_ROOT/skills" "$test_dir/.agents/skills"

    printf '%s\n' "$test_dir"
}

create_test_repo_copy() {
    local test_dir

    test_dir="$(mktemp -d)"

    # Copy the current working tree into a disposable project so Codex cannot mutate the real checkout.
    tar -C "$REPO_ROOT" --exclude='.git' -cf - . | tar -C "$test_dir" -xf -

    mkdir -p "$test_dir/.agents"
    rm -rf "$test_dir/.agents/skills"
    ln -s "$test_dir/skills" "$test_dir/.agents/skills"

    printf '%s\n' "$test_dir"
}

cleanup_test_project() {
    local test_dir="$1"
    if [ -d "$test_dir" ]; then
        rm -rf "$test_dir"
    fi
}

build_local_skill_preamble() {
    local project_dir="$1"

    if [ -d "$project_dir/.agents/skills" ]; then
        cat <<'EOF'
Use repository-local Superpowers skills from `./.agents/skills` for this project.
Do not load a globally installed Superpowers skill when a repository-local copy with the same name exists.

EOF
    fi
}

run_codex() {
    local prompt="$1"
    local project_dir="$2"
    local timeout_seconds="${3:-60}"
    local codex_project_dir
    local skill_preamble
    local full_prompt
    local output_file
    local json_output_file
    local parse_errors_file
    local final_message
    codex_project_dir=$(normalize_codex_path "$project_dir")
    skill_preamble="$(build_local_skill_preamble "$project_dir")"
    if [ -n "$skill_preamble" ]; then
        full_prompt="${skill_preamble}"$'\n'"$prompt"
    else
        full_prompt="$prompt"
    fi
    output_file=$(mktemp)
    json_output_file=$(mktemp)
    parse_errors_file=$(mktemp)

    if ! command -v jq >/dev/null 2>&1; then
        echo "jq is required to parse codex exec --json output" >&2
        rm -f "$output_file" "$json_output_file" "$parse_errors_file"
        return 1
    fi

    if timeout "$timeout_seconds" env HOME="$HOME" CODEX_HOME="$CODEX_HOME" codex exec \
        --json \
        --skip-git-repo-check \
        -C "$codex_project_dir" \
        -s workspace-write \
        "$full_prompt" > "$output_file" 2>&1; then
        grep '^{' "$output_file" > "$json_output_file" || true

        if [ ! -s "$json_output_file" ]; then
            echo "Failed to extract JSON lines from Codex output" >&2
            cat "$output_file" >&2
            rm -f "$output_file" "$json_output_file" "$parse_errors_file"
            return 1
        fi

        set +e
        final_message=$(jq -rs '
                map(
                    select(
                        .type == "item.completed"
                        and .item.type == "agent_message"
                        and (.item.text? != null)
                    )
                    | .item.text
                )
                | last // empty
            ' "$json_output_file" 2>"$parse_errors_file")
        local jq_status=$?
        set -e

        if [ "$jq_status" -ne 0 ]; then
            echo "Failed to parse Codex JSON output with jq" >&2
            cat "$parse_errors_file" >&2
            cat "$output_file" >&2
            rm -f "$output_file" "$json_output_file" "$parse_errors_file"
            return 1
        fi

        if [ -n "$final_message" ]; then
            printf '%s\n' "$final_message"
            rm -f "$output_file" "$json_output_file" "$parse_errors_file"
            return 0
        fi

        echo "Failed to extract final Codex agent message from JSON output" >&2
        cat "$output_file" >&2
        rm -f "$output_file" "$json_output_file" "$parse_errors_file"
        return 1
    else
        local exit_code=$?
        cat "$output_file" >&2
        rm -f "$output_file" "$json_output_file" "$parse_errors_file"
        return "$exit_code"
    fi
}

run_codex_json_to_file() {
    local prompt="$1"
    local project_dir="$2"
    local output_file="$3"
    local timeout_seconds="${4:-1800}"
    local codex_project_dir
    local skill_preamble
    local full_prompt
    codex_project_dir=$(normalize_codex_path "$project_dir")
    skill_preamble="$(build_local_skill_preamble "$project_dir")"
    if [ -n "$skill_preamble" ]; then
        full_prompt="${skill_preamble}"$'\n'"$prompt"
    else
        full_prompt="$prompt"
    fi

    timeout "$timeout_seconds" env HOME="$HOME" CODEX_HOME="$CODEX_HOME" codex exec \
        --json \
        --dangerously-bypass-approvals-and-sandbox \
        --skip-git-repo-check \
        -C "$codex_project_dir" \
        "$full_prompt" > "$output_file" 2>&1
}

latest_codex_session_file() {
    find "$CODEX_HOME/sessions" -name "*.jsonl" -type f 2>/dev/null | sort -r | head -1
}

assert_semantic_judgment() {
    local source_text="$1"
    local question="$2"
    local answer="$3"
    local rubric="$4"
    local project_dir="$5"
    local test_name="${6:-semantic judgment}"
    local timeout_seconds="${7:-120}"
    local evaluator_output
    local parse_errors_file
    local failed_criteria
    local reason
    local prompt

    if ! command -v jq >/dev/null 2>&1; then
        echo "  [FAIL] $test_name: jq is required for semantic evaluation"
        return 1
    fi

    parse_errors_file=$(mktemp)
    prompt=$(cat <<EOF_PROMPT
You are grading whether an answer correctly reflects source material.

Use only the provided source text and rubric. Do not rely on outside knowledge.
Judge based on meaning, not wording. If the answer is materially correct but phrased differently, it should pass.

Return exactly one JSON object with this shape:
{"pass":true,"reason":"short explanation","failed_criteria":[]}

Rules:
- "pass" must be true only if every rubric item is satisfied.
- "failed_criteria" must list the unmet rubric items verbatim when pass is false.
- Do not include markdown fences or any text outside the JSON object.

## Source Text
$source_text

## Question
$question

## Answer Under Review
$answer

## Rubric
$rubric
EOF_PROMPT
)

    if ! evaluator_output=$(run_codex "$prompt" "$project_dir" "$timeout_seconds"); then
        echo "  [FAIL] $test_name"
        echo "  Semantic evaluator failed to run"
        rm -f "$parse_errors_file"
        return 1
    fi

    if ! printf '%s' "$evaluator_output" | jq empty >/dev/null 2>"$parse_errors_file"; then
        echo "  [FAIL] $test_name"
        echo "  Semantic evaluator did not return valid JSON"
        cat "$parse_errors_file" | sed 's/^/    /'
        printf '%s\n' "$evaluator_output" | sed 's/^/    /'
        rm -f "$parse_errors_file"
        return 1
    fi

    if ! printf '%s' "$evaluator_output" | jq -e '
        type == "object"
        and (.pass | type == "boolean")
        and (.reason | type == "string")
        and (.failed_criteria | type == "array")
    ' >/dev/null 2>"$parse_errors_file"; then
        echo "  [FAIL] $test_name"
        echo "  Semantic evaluator returned an unexpected JSON shape"
        cat "$parse_errors_file" | sed 's/^/    /'
        printf '%s\n' "$evaluator_output" | sed 's/^/    /'
        rm -f "$parse_errors_file"
        return 1
    fi

    if printf '%s' "$evaluator_output" | jq -e '.pass == true' >/dev/null 2>"$parse_errors_file"; then
        echo "  [PASS] $test_name"
        rm -f "$parse_errors_file"
        return 0
    fi

    reason=$(printf '%s' "$evaluator_output" | jq -r '.reason // "No reason provided"' 2>/dev/null || true)
    failed_criteria=$(printf '%s' "$evaluator_output" | jq -r '(.failed_criteria // []) | join("; ")' 2>/dev/null || true)

    echo "  [FAIL] $test_name"
    if [ -n "$reason" ]; then
        echo "  Reason: $reason"
    fi
    if [ -n "$failed_criteria" ]; then
        echo "  Failed criteria: $failed_criteria"
    fi
    rm -f "$parse_errors_file"
    return 1
}

assert_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -Eiq "$pattern"; then
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

    if echo "$output" | grep -Eiq "$pattern"; then
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

export -f setup_codex_test_env
export -f cleanup_codex_test_env
export -f install_codex_session_start_hook
export -f create_test_project
export -f create_test_repo_copy
export -f cleanup_test_project
export -f build_local_skill_preamble
export -f normalize_codex_path
export -f run_codex
export -f run_codex_json_to_file
export -f latest_codex_session_file
export -f assert_semantic_judgment
export -f assert_contains
export -f assert_not_contains
export REPO_ROOT
export CODEX_TEST_MODEL
export CODEX_TEST_REASONING_EFFORT
