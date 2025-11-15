#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="/Users/fh/.claude/plugins/cache/superpowers"
source "${PLUGIN_ROOT}/lib/codex-utils.sh"

echo "=== Testing Codex Code Review Flow ==="

# Test 1: Config check
echo "Test 1: Checking Codex configuration..."
if [ "$(is_codex_enabled)" = "true" ]; then
    echo "✓ Codex is enabled"
else
    echo "✗ Codex is not enabled (expected for this test)"
    echo "  Enabling Codex for test..."
    jq '.codex_enabled = true' "${PLUGIN_ROOT}/config/codex-config.json" > /tmp/codex-config-tmp.json
    mv /tmp/codex-config-tmp.json "${PLUGIN_ROOT}/config/codex-config.json"
fi

# Test 2: Delegation check
echo "Test 2: Checking code review delegation..."
if [ "$(should_delegate_to_codex code_review)" = "true" ]; then
    echo "✓ Code review delegation is enabled"
else
    echo "✗ Code review delegation not enabled"
    exit 1
fi

# Test 3: Template loading
echo "Test 3: Loading code review template..."
template=$(get_codex_prompt_template "code_review_template")
if [ -n "$template" ]; then
    echo "✓ Template loaded successfully"
else
    echo "✗ Failed to load template"
    exit 1
fi

# Test 4: Template filling
echo "Test 4: Testing template filling..."
filled=$(fill_template "$template" \
    "BASE_SHA" "abc123" \
    "HEAD_SHA" "def456" \
    "WHAT_WAS_IMPLEMENTED" "Test feature" \
    "PLAN_OR_REQUIREMENTS" "Test plan")

if echo "$filled" | grep -q "abc123" && echo "$filled" | grep -q "Test feature"; then
    echo "✓ Template filled correctly"
else
    echo "✗ Template filling failed"
    exit 1
fi

# Test 5: Response validation
echo "Test 5: Testing response validation..."
mock_response="STRENGTHS:
- Good implementation

ISSUES:

CRITICAL:
None

IMPORTANT:
None

ASSESSMENT:
Ready to proceed

REASONING:
Code follows best practices"

validation_result=$("${PLUGIN_ROOT}/hooks/codex-response-validator.sh" "code_review" "$mock_response")
if echo "$validation_result" | jq -e '.validation_passed' >/dev/null; then
    echo "✓ Response validation passed"
else
    echo "✗ Response validation failed"
    echo "$validation_result"
    exit 1
fi

echo ""
echo "=== All Code Review Flow Tests Passed ==="
