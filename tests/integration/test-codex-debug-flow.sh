#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="/Users/fh/.claude/plugins/cache/superpowers"
source "${PLUGIN_ROOT}/lib/codex-utils.sh"

echo "=== Testing Codex Debugging Flow ==="

# Test 1: Debugging delegation check
echo "Test 1: Checking debugging delegation..."
if [ "$(should_delegate_to_codex debugging)" = "true" ]; then
    echo "✓ Debugging delegation is enabled"
else
    echo "✗ Debugging delegation not enabled"
    exit 1
fi

# Test 2: Debug template loading
echo "Test 2: Loading debugging template..."
template=$(get_codex_prompt_template "debugging_template")
if [ -n "$template" ]; then
    echo "✓ Template loaded successfully"
else
    echo "✗ Failed to load template"
    exit 1
fi

# Test 3: Template filling for debugging
echo "Test 3: Testing debug template filling..."
filled=$(fill_template "$template" \
    "PROBLEM_DESCRIPTION" "Test fails with NPE" \
    "DEBUG_PHASE" "evidence_gathering" \
    "CONTEXT" "Stack trace shows...")

if echo "$filled" | grep -q "Test fails with NPE" && echo "$filled" | grep -q "evidence_gathering"; then
    echo "✓ Template filled correctly"
else
    echo "✗ Template filling failed"
    exit 1
fi

# Test 4: Debug response validation
echo "Test 4: Testing debug response validation..."
mock_response="EVIDENCE GATHERED:
- Test fails at line 42
- NPE in getUserData()

ROOT CAUSE HYPOTHESIS:
User object is null when called from async context

REASONING:
Stack trace shows async callback path, user context not propagated

RECOMMENDED NEXT STEPS:
1. Add null check before getUserData()
2. Verify async context propagation
3. Add test for async scenario"

validation_result=$("${PLUGIN_ROOT}/hooks/codex-response-validator.sh" "debugging" "$mock_response")
if echo "$validation_result" | jq -e '.validation_passed' >/dev/null; then
    echo "✓ Response validation passed"
else
    echo "✗ Response validation failed"
    echo "$validation_result"
    exit 1
fi

echo ""
echo "=== All Debugging Flow Tests Passed ==="
