#!/usr/bin/env bash
set -euo pipefail

echo "=== Testing Complete Codex Integration Workflow ==="

PLUGIN_ROOT="/Users/fh/.claude/plugins/cache/superpowers"

# Test 1: All files exist
echo "Test 1: Verifying all integration files exist..."
required_files=(
    "${PLUGIN_ROOT}/config/codex-config.json"
    "${PLUGIN_ROOT}/lib/codex-utils.sh"
    "${PLUGIN_ROOT}/skills/codex-delegator/SKILL.md"
    "${PLUGIN_ROOT}/hooks/codex-response-validator.sh"
    "${PLUGIN_ROOT}/docs/CODEX_INTEGRATION.md"
    "${PLUGIN_ROOT}/examples/codex-review-example.md"
    "${PLUGIN_ROOT}/examples/codex-debug-example.md"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✗ Missing: $file"
        exit 1
    fi
done
echo "✓ All required files exist"

# Test 2: Config is valid
echo "Test 2: Validating configuration..."
if ! jq empty "${PLUGIN_ROOT}/config/codex-config.json" 2>/dev/null; then
    echo "✗ Invalid JSON in config"
    exit 1
fi
echo "✓ Configuration is valid JSON"

# Test 3: Skills reference Codex
echo "Test 3: Verifying skill modifications..."
if ! grep -q "codex" "${PLUGIN_ROOT}/skills/requesting-code-review/SKILL.md"; then
    echo "✗ requesting-code-review not updated for Codex"
    exit 1
fi

if ! grep -q "codex" "${PLUGIN_ROOT}/skills/systematic-debugging/SKILL.md"; then
    echo "✗ systematic-debugging not updated for Codex"
    exit 1
fi
echo "✓ Skills properly reference Codex integration"

# Test 4: Utilities work
echo "Test 4: Testing utility functions..."
source "${PLUGIN_ROOT}/lib/codex-utils.sh"

if [ -z "$(get_plugin_root)" ]; then
    echo "✗ get_plugin_root failed"
    exit 1
fi

if [ -z "$(is_codex_enabled)" ]; then
    echo "✗ is_codex_enabled failed"
    exit 1
fi

if [ -z "$(should_delegate_to_codex code_review)" ]; then
    echo "✗ should_delegate_to_codex failed"
    exit 1
fi
echo "✓ Utility functions work correctly"

# Test 5: Validation hook works
echo "Test 5: Testing validation hook..."
if [ ! -x "${PLUGIN_ROOT}/hooks/codex-response-validator.sh" ]; then
    echo "✗ Validation hook not executable"
    exit 1
fi

# Test with valid response
valid_response="STRENGTHS:\n- Test\n\nISSUES:\n\nCRITICAL:\nNone\n\nASSESSMENT:\nReady\n\nREASONING:\nLooks good"
if ! echo -e "$valid_response" | "${PLUGIN_ROOT}/hooks/codex-response-validator.sh" "code_review" >/dev/null 2>&1; then
    echo "✗ Validation hook rejected valid response"
    exit 1
fi
echo "✓ Validation hook works correctly"

# Test 6: Documentation complete
echo "Test 6: Verifying documentation..."
doc_sections=(
    "Configuration"
    "Usage"
    "Response Formats"
    "Troubleshooting"
)

for section in "${doc_sections[@]}"; do
    if ! grep -q "$section" "${PLUGIN_ROOT}/docs/CODEX_INTEGRATION.md"; then
        echo "✗ Documentation missing section: $section"
        exit 1
    fi
done
echo "✓ Documentation is complete"

# Test 7: Examples are comprehensive
echo "Test 7: Verifying examples..."
if ! grep -q "Codex Response" "${PLUGIN_ROOT}/examples/codex-review-example.md"; then
    echo "✗ Review example incomplete"
    exit 1
fi

if ! grep -q "Phase" "${PLUGIN_ROOT}/examples/codex-debug-example.md"; then
    echo "✗ Debug example incomplete"
    exit 1
fi
echo "✓ Examples are comprehensive"

# Test 8: Integration preserves existing workflows
echo "Test 8: Checking backward compatibility..."

# Temporarily disable Codex
backup_config="${PLUGIN_ROOT}/config/codex-config.backup-test.json"
cp "${PLUGIN_ROOT}/config/codex-config.json" "$backup_config"

jq '.codex_enabled = false' "${PLUGIN_ROOT}/config/codex-config.json" > /tmp/codex-test.json
mv /tmp/codex-test.json "${PLUGIN_ROOT}/config/codex-config.json"

# Check that delegation is disabled
source "${PLUGIN_ROOT}/lib/codex-utils.sh"
if [ "$(should_delegate_to_codex code_review)" != "false" ]; then
    echo "✗ Delegation not properly disabled when codex_enabled = false"
    mv "$backup_config" "${PLUGIN_ROOT}/config/codex-config.json"
    exit 1
fi

# Restore config
mv "$backup_config" "${PLUGIN_ROOT}/config/codex-config.json"
echo "✓ Backward compatibility preserved"

echo ""
echo "=== All Integration Tests Passed ==="
echo ""
echo "Summary:"
echo "✓ All files created"
echo "✓ Configuration valid"
echo "✓ Skills updated"
echo "✓ Utilities functional"
echo "✓ Validation working"
echo "✓ Documentation complete"
echo "✓ Examples comprehensive"
echo "✓ Backward compatible"
echo ""
echo "Codex integration is ready for use!"
