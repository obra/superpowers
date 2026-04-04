#!/usr/bin/env bash
# Test: using-superpowers bootstrap via SessionStart hook
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOK_SCRIPT="$REPO_ROOT/hooks/session-start"
SKILL_FILE="$REPO_ROOT/skills/using-superpowers/SKILL.md"
TEST_HOME="$(mktemp -d)"

cleanup() {
    rm -rf "$TEST_HOME"
}

trap cleanup EXIT

if [ ! -x "$HOOK_SCRIPT" ]; then
    echo "Hook script is not executable: $HOOK_SCRIPT"
    exit 1
fi

skill_marker=$(grep -F "If you think there is even a 1% chance a skill might apply" "$SKILL_FILE" | head -1)
description_marker=$(grep -F "description: Use when starting any conversation" "$SKILL_FILE" | head -1)

echo "=== Test: using-superpowers bootstrap ==="
echo ""

echo "Test 1: Claude Code hook shape and injected skill content..."
claude_output=$(HOME="$TEST_HOME" CLAUDE_PLUGIN_ROOT="$REPO_ROOT" "$HOOK_SCRIPT")
assert_contains "$claude_output" '"hookSpecificOutput"' "Claude output uses hookSpecificOutput" || exit 1
assert_contains "$claude_output" '"hookEventName": "SessionStart"' "Claude output identifies SessionStart" || exit 1
assert_not_contains "$claude_output" '"additional_context"' "Claude output avoids fallback field" || exit 1

if echo "$claude_output" | grep -Fq "You have superpowers."; then
    echo "  [PASS] Claude output includes bootstrap banner"
else
    echo "  [FAIL] Claude output missing bootstrap banner"
    exit 1
fi

if echo "$claude_output" | grep -Fq "$skill_marker" && echo "$claude_output" | grep -Fq "$description_marker"; then
    echo "  [PASS] Claude output embeds current using-superpowers content"
else
    echo "  [FAIL] Claude output missing expected using-superpowers markers"
    exit 1
fi

echo ""
echo "Test 2: Cursor precedence over Claude field selection..."
cursor_output=$(HOME="$TEST_HOME" CURSOR_PLUGIN_ROOT="$REPO_ROOT" CLAUDE_PLUGIN_ROOT="$REPO_ROOT" "$HOOK_SCRIPT")
assert_contains "$cursor_output" '"additional_context"' "Cursor output uses additional_context" || exit 1
assert_not_contains "$cursor_output" '"hookSpecificOutput"' "Cursor output suppresses Claude field" || exit 1

echo ""
echo "Test 3: Fallback field without platform env vars..."
fallback_output=$(HOME="$TEST_HOME" "$HOOK_SCRIPT")
assert_contains "$fallback_output" '"additionalContext"' "Fallback output uses additionalContext" || exit 1
assert_not_contains "$fallback_output" '"additional_context"' "Fallback output avoids Cursor-only field" || exit 1
assert_not_contains "$fallback_output" '"hookSpecificOutput"' "Fallback output omits Claude field" || exit 1

echo ""
echo "Test 4: Legacy custom-skill warning is injected when needed..."
mkdir -p "$TEST_HOME/.config/superpowers/skills"
warning_output=$(HOME="$TEST_HOME" CLAUDE_PLUGIN_ROOT="$REPO_ROOT" "$HOOK_SCRIPT")

if echo "$warning_output" | grep -Fq "WARNING:" && echo "$warning_output" | grep -Fq "~/.config/superpowers/skills"; then
    echo "  [PASS] Legacy custom-skill warning is injected"
else
    echo "  [FAIL] Legacy custom-skill warning missing"
    exit 1
fi

echo ""
echo "=== using-superpowers bootstrap tests passed ==="
