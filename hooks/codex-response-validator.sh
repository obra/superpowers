#!/usr/bin/env bash
# Codex response validation hook
set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${PLUGIN_ROOT}/lib/codex-utils.sh"

# Get response type and content from arguments or stdin
RESPONSE_TYPE="${1:-unknown}"
RESPONSE_CONTENT="${2:-$(cat)}"

validate_code_review_response() {
    local response="$1"
    local validation_result='{"validation_passed": false, "errors": []}'

    # Check for required sections
    if ! echo "$response" | grep -q "STRENGTHS:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing STRENGTHS section"]')
    fi

    if ! echo "$response" | grep -q "ISSUES:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing ISSUES section"]')
    fi

    if ! echo "$response" | grep -q "ASSESSMENT:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing ASSESSMENT section"]')
    fi

    # Check for reasoning if required
    local config_file="$(get_plugin_root)/config/codex-config.json"
    local require_reasoning=$(jq -r '.response_validation.require_reasoning // true' "$config_file")

    if [ "$require_reasoning" = "true" ]; then
        if ! echo "$response" | grep -q "REASONING:"; then
            validation_result=$(echo "$validation_result" | jq '.errors += ["Missing REASONING section (required by config)"]')
        fi
    fi

    # If no errors, mark as passed
    local error_count=$(echo "$validation_result" | jq '.errors | length')
    if [ "$error_count" -eq 0 ]; then
        validation_result=$(echo "$validation_result" | jq '.validation_passed = true')
    fi

    echo "$validation_result"
}

validate_debugging_response() {
    local response="$1"
    local validation_result='{"validation_passed": false, "errors": []}'

    # Check for required sections
    if ! echo "$response" | grep -q "EVIDENCE GATHERED:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing EVIDENCE GATHERED section"]')
    fi

    if ! echo "$response" | grep -q "ROOT CAUSE HYPOTHESIS:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing ROOT CAUSE HYPOTHESIS section"]')
    fi

    if ! echo "$response" | grep -q "RECOMMENDED NEXT STEPS:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing RECOMMENDED NEXT STEPS section"]')
    fi

    # Check for reasoning
    if ! echo "$response" | grep -q "REASONING:"; then
        validation_result=$(echo "$validation_result" | jq '.errors += ["Missing REASONING section"]')
    fi

    # If no errors, mark as passed
    local error_count=$(echo "$validation_result" | jq '.errors | length')
    if [ "$error_count" -eq 0 ]; then
        validation_result=$(echo "$validation_result" | jq '.validation_passed = true')
    fi

    echo "$validation_result"
}

# Main validation logic
case "$RESPONSE_TYPE" in
    code_review)
        validation_result=$(validate_code_review_response "$RESPONSE_CONTENT")
        ;;
    debugging)
        validation_result=$(validate_debugging_response "$RESPONSE_CONTENT")
        ;;
    *)
        validation_result='{"validation_passed": false, "errors": ["Unknown response type: '"$RESPONSE_TYPE"'"]}'
        ;;
esac

# Output result
echo "$validation_result"

# Exit with appropriate code
if echo "$validation_result" | jq -e '.validation_passed' >/dev/null; then
    exit 0
else
    exit 1
fi
