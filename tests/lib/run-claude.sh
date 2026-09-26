#!/usr/bin/env bash
# Helpers for running Claude Code in stream-json mode.

run_claude_stream_json() {
    local log_file="$1"
    local prompt="$2"
    local max_turns="${3:-3}"
    shift 3

    cd "$PROJECT_DIR"

    timeout 300 claude -p "$prompt" \
        --plugin-dir "$PLUGIN_ROOT" \
        --dangerously-skip-permissions \
        --max-turns "$max_turns" \
        --output-format stream-json \
        "$@" \
        > "$log_file" 2>&1 || true
}

run_claude_stream_json_continue() {
    local log_file="$1"
    local prompt="$2"
    local max_turns="${3:-3}"
    shift 3

    cd "$PROJECT_DIR"

    timeout 300 claude -p "$prompt" \
        --continue \
        --plugin-dir "$PLUGIN_ROOT" \
        --dangerously-skip-permissions \
        --max-turns "$max_turns" \
        --output-format stream-json \
        "$@" \
        > "$log_file" 2>&1 || true
}
