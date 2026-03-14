#!/usr/bin/env bash
# Helper functions for Codex integration tests.

run_codex() {
    local prompt="$1"
    local timeout_seconds="${2:-$CODEX_TEST_TIMEOUT}"
    local transcript_file
    local last_message_file

    transcript_file="$(mktemp "$TEST_ROOT/codex-transcript.XXXXXX")"
    last_message_file="$(mktemp "$TEST_ROOT/codex-last-message.XXXXXX")"

    if timeout "$timeout_seconds" codex exec \
        --skip-git-repo-check \
        --ephemeral \
        -C "$TEST_PROJECT" \
        -o "$last_message_file" \
        "$prompt" >"$transcript_file" 2>&1; then
        if [ -s "$last_message_file" ]; then
            cat "$last_message_file"
        else
            cat "$transcript_file"
        fi
        rm -f "$transcript_file" "$last_message_file"
        return 0
    fi

    local exit_code=$?
    cat "$transcript_file" >&2
    if [ -s "$last_message_file" ]; then
        echo "--- last message ---" >&2
        cat "$last_message_file" >&2
    fi
    rm -f "$transcript_file" "$last_message_file"
    return "$exit_code"
}

run_codex_json() {
    local prompt="$1"
    local json_file="$2"
    local last_message_file="$3"
    local timeout_seconds="${4:-$CODEX_TEST_TIMEOUT}"

    if timeout "$timeout_seconds" codex exec \
        --json \
        --skip-git-repo-check \
        --ephemeral \
        -C "$TEST_PROJECT" \
        -o "$last_message_file" \
        "$prompt" >"$json_file" 2>&1; then
        return 0
    fi

    local exit_code=$?
    cat "$json_file" >&2
    if [ -s "$last_message_file" ]; then
        echo "--- last message ---" >&2
        cat "$last_message_file" >&2
    fi
    return "$exit_code"
}

assert_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -Eq "$pattern"; then
        echo "  [PASS] $test_name"
        return 0
    fi

    echo "  [FAIL] $test_name"
    echo "  Expected to find: $pattern"
    echo "  In output:"
    echo "$output" | sed 's/^/    /'
    return 1
}

assert_order() {
    local output="$1"
    local pattern_a="$2"
    local pattern_b="$3"
    local test_name="${4:-test}"
    local line_a
    local line_b

    line_a="$(echo "$output" | grep -En "$pattern_a" | head -1 | cut -d: -f1)"
    line_b="$(echo "$output" | grep -En "$pattern_b" | head -1 | cut -d: -f1)"

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
    fi

    echo "  [FAIL] $test_name"
    echo "  Expected '$pattern_a' before '$pattern_b'"
    echo "  But found A at line $line_a, B at line $line_b"
    return 1
}

export -f run_codex
export -f run_codex_json
export -f assert_contains
export -f assert_order
