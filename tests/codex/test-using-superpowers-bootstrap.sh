#!/usr/bin/env bash
# Test: using-superpowers bootstrap via SessionStart hook for Codex
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

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

echo "=== Test: Codex using-superpowers bootstrap ==="
echo ""

echo "Test 1: Codex target emits hookSpecificOutput without Claude env..."
codex_output=$(HOME="$TEST_HOME" SUPERPOWERS_HOOK_TARGET="codex" "$HOOK_SCRIPT")
assert_contains "$codex_output" '"hookSpecificOutput"' "Codex output uses hookSpecificOutput" || exit 1
assert_contains "$codex_output" '"hookEventName": "SessionStart"' "Codex output identifies SessionStart" || exit 1
assert_not_contains "$codex_output" '"additional_context"' "Codex output avoids legacy fallback field" || exit 1

if echo "$codex_output" | grep -Fq "You have superpowers."; then
    echo "  [PASS] Codex output includes bootstrap banner"
else
    echo "  [FAIL] Codex output missing bootstrap banner"
    exit 1
fi

if echo "$codex_output" | grep -Fq "$skill_marker" && echo "$codex_output" | grep -Fq "$description_marker"; then
    echo "  [PASS] Codex output embeds current using-superpowers content"
else
    echo "  [FAIL] Codex output missing expected using-superpowers markers"
    exit 1
fi

echo ""
echo "Test 2: Cursor still uses additional_context..."
cursor_output=$(HOME="$TEST_HOME" CURSOR_PLUGIN_ROOT="$REPO_ROOT" "$HOOK_SCRIPT")
assert_contains "$cursor_output" '"additional_context"' "Cursor output uses additional_context" || exit 1
assert_not_contains "$cursor_output" '"hookSpecificOutput"' "Cursor output suppresses hookSpecificOutput" || exit 1

echo ""
echo "=== Codex using-superpowers bootstrap tests passed ==="
