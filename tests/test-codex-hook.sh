#!/usr/bin/env bash
set -euo pipefail

test_hook_script_exists() {
    hook_file="/Users/fh/.claude/plugins/cache/superpowers/hooks/codex-response-validator.sh"
    if [ ! -f "$hook_file" ]; then
        echo "FAIL: Codex hook script does not exist"
        return 1
    fi

    if [ ! -x "$hook_file" ]; then
        echo "FAIL: Codex hook script is not executable"
        return 1
    fi

    echo "PASS: Codex hook script exists and is executable"
}

test_hook_accepts_stdin() {
    hook_file="/Users/fh/.claude/plugins/cache/superpowers/hooks/codex-response-validator.sh"

    # Test with valid response via stdin
    valid_response="STRENGTHS:\n- Good code\n\nISSUES:\n\nCRITICAL:\nNone\n\nASSESSMENT:\nReady\n\nREASONING:\nAll good"

    result=$(echo -e "$valid_response" | "$hook_file" "code_review" 2>&1 || true)

    if echo "$result" | grep -q "validation_passed.*true"; then
        echo "PASS: Hook accepts response via stdin"
    else
        echo "FAIL: Hook should accept stdin"
        return 1
    fi
}

test_hook_validates_response() {
    hook_file="/Users/fh/.claude/plugins/cache/superpowers/hooks/codex-response-validator.sh"

    # Test with valid response (includes REASONING as required by config)
    valid_response="STRENGTHS:\n- Good code\n\nISSUES:\n\nCRITICAL:\nNone\n\nASSESSMENT:\nReady\n\nREASONING:\nAll checks passed"

    result=$(echo -e "$valid_response" | "$hook_file" "code_review" 2>&1 || true)

    if echo "$result" | grep -q "validation_passed.*true"; then
        echo "PASS: Hook validates responses correctly"
    else
        echo "FAIL: Hook validation logic broken"
        return 1
    fi
}

# Run tests
test_hook_script_exists
test_hook_accepts_stdin
test_hook_validates_response
