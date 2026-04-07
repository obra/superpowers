#!/usr/bin/env bash
# Test: Codex test environment pins the day-to-day model and reasoning effort
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Codex test model config ==="
echo ""

setup_codex_test_env
trap 'cleanup_codex_test_env' EXIT

CONFIG_FILE="$CODEX_HOME/config.toml"
HOOKS_FILE="$CODEX_HOME/hooks.json"

echo "Test 1: Temporary Codex config is written..."
if [ -f "$CONFIG_FILE" ]; then
    echo "  [PASS] Test config exists at $CONFIG_FILE"
else
    echo "  [FAIL] Expected test config at $CONFIG_FILE"
    exit 1
fi
echo ""

CONFIG_CONTENT=$(cat "$CONFIG_FILE")

echo "Test 2: Model is pinned to gpt-5.4..."
assert_contains "$CONFIG_CONTENT" '^model = "gpt-5\.4"$' "Model pinned to gpt-5.4" || exit 1
echo ""

echo "Test 3: Reasoning effort is pinned to xhigh..."
assert_contains "$CONFIG_CONTENT" '^model_reasoning_effort = "xhigh"$' "Reasoning effort pinned to xhigh" || exit 1
echo ""

echo "Test 4: SessionStart hooks are enabled in the temp Codex home..."
if [ -f "$HOOKS_FILE" ]; then
    echo "  [PASS] Hooks config exists at $HOOKS_FILE"
else
    echo "  [FAIL] Expected hooks config at $HOOKS_FILE"
    exit 1
fi
echo ""

HOOKS_CONTENT=$(cat "$HOOKS_FILE")
HOOK_COMMAND=$(jq -r '.hooks.SessionStart[0].hooks[0].command' "$HOOKS_FILE")

echo "Test 5: Hooks config wires the Codex SessionStart hook..."
assert_contains "$HOOKS_CONTENT" '"SessionStart"' "Hooks config defines SessionStart" || exit 1
assert_contains "$HOOKS_CONTENT" 'loading superpowers' "Hooks config keeps the loading status message" || exit 1
assert_contains "$HOOK_COMMAND" '^SUPERPOWERS_HOOK_TARGET=codex bash ".*/superpowers/hooks/session-start"$' "Hooks config quotes the Codex session-start hook path" || exit 1
echo ""

cleanup_codex_test_env

OVERRIDE_CONFIG_CONTENT=$(
    CODEX_TEST_MODEL="gpt-5.4-mini" \
    CODEX_TEST_REASONING_EFFORT="medium" \
    HOME="$REPO_ROOT" \
    REPO_ROOT="$REPO_ROOT" \
    bash -c '
        source "$REPO_ROOT/tests/codex/test-helpers.sh"
        setup_codex_test_env
        trap '\''cleanup_codex_test_env'\'' EXIT
        cat "$CODEX_HOME/config.toml"
    '
)

echo "Test 6: Temporary Codex config accepts an explicit model override..."
assert_contains "$OVERRIDE_CONFIG_CONTENT" '^model = "gpt-5\.4-mini"$' "Model override is written to config.toml" || exit 1
echo ""

echo "Test 7: Temporary Codex config accepts an explicit reasoning-effort override..."
assert_contains "$OVERRIDE_CONFIG_CONTENT" '^model_reasoning_effort = "medium"$' "Reasoning effort override is written to config.toml" || exit 1
echo ""

echo "=== Codex test model config passed ==="
