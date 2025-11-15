#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="/Users/fh/.claude/plugins/cache/superpowers"
source "${PLUGIN_ROOT}/lib/codex-utils.sh"

echo "=== Testing Codex Fallback Behavior ==="

# Test 1: Disable Codex and verify fallback
echo "Test 1: Testing fallback when Codex disabled..."

# Save original config
cp "${PLUGIN_ROOT}/config/codex-config.json" "/tmp/codex-config-backup.json"

# Disable Codex
jq '.codex_enabled = false' "${PLUGIN_ROOT}/config/codex-config.json" > /tmp/codex-config-tmp.json
mv /tmp/codex-config-tmp.json "${PLUGIN_ROOT}/config/codex-config.json"

# Check delegation
if [ "$(should_delegate_to_codex code_review)" = "false" ]; then
    echo "✓ Correctly falls back when Codex disabled"
else
    echo "✗ Fallback logic broken"
    mv "/tmp/codex-config-backup.json" "${PLUGIN_ROOT}/config/codex-config.json"
    exit 1
fi

# Restore config
mv "/tmp/codex-config-backup.json" "${PLUGIN_ROOT}/config/codex-config.json"

# Test 2: Invalid response triggers fallback
echo "Test 2: Testing validation failure triggers fallback..."

invalid_response="This is an invalid response without proper structure"

if ! "${PLUGIN_ROOT}/hooks/codex-response-validator.sh" "code_review" "$invalid_response" 2>/dev/null; then
    echo "✓ Validation correctly rejects invalid response"
else
    echo "✗ Validation should reject invalid response"
    exit 1
fi

# Test 3: Verify fallback config setting
echo "Test 3: Checking fallback_to_claude setting..."
fallback_enabled=$(jq -r '.delegation_rules.code_review.fallback_to_claude' "${PLUGIN_ROOT}/config/codex-config.json")
if [ "$fallback_enabled" = "true" ]; then
    echo "✓ Fallback to Claude is enabled"
else
    echo "⚠ Fallback to Claude is not enabled (may be intentional)"
fi

echo ""
echo "=== All Fallback Tests Passed ==="
