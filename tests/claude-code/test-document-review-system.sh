#!/usr/bin/env bash
# Integration Test: Document Review System
# Actually runs spec/plan review and verifies reviewers catch issues
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: Document Review System"
echo "========================================"
echo ""
echo "This test verifies the document review system by:"
echo "  1. Creating a spec with intentional errors"
echo "  2. Running the spec document reviewer"
echo "  3. Verifying the reviewer catches the errors"
echo ""

# Create test project
TEST_PROJECT=$(create_test_project)
echo "Test project: $TEST_PROJECT"

# Trap to cleanup
trap "cleanup_test_project $TEST_PROJECT" EXIT

cd "$TEST_PROJECT"

# Create directory structure
mkdir -p docs/superpowers/specs

# Create a spec document WITH INTENTIONAL ERRORS for the reviewer to catch
cat > docs/superpowers/specs/test-feature-design.md <<'EOF'
# Test Feature Design

## Overview

This is a test feature that does something useful.

## Requirements

1. The feature should work correctly
2. It should be fast
3. TODO: Add more requirements here

## Architecture

The feature will use a simple architecture with:
- A frontend component
- A backend service
- Error handling will be specified later once we understand the failure modes better

## Data Flow

Data flows from the frontend to the backend.

## Testing Strategy

Tests will be written to cover the main functionality.
EOF

# Initialize git repo
git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit with test spec" --quiet

echo ""
echo "Created test spec with intentional errors:"
echo "  - TODO placeholder in Requirements section"
echo "  - 'specified later' deferral in Architecture section"
echo ""
echo "Running spec document reviewer..."
echo ""

# Run Claude to review the spec
OUTPUT_FILE="$TEST_PROJECT/claude-output.txt"

PROMPT="You are testing the spec document reviewer.

Read the spec-document-reviewer-prompt.md template in skills/brainstorming/ to understand the review format.

Then review the spec at $TEST_PROJECT/docs/superpowers/specs/test-feature-design.md using the criteria from that template.

Look for:
- TODOs, placeholders, 'TBD', incomplete sections
- Sections saying 'to be defined later' or 'will spec when X is done'
- Sections noticeably less detailed than others

Output your review in the format specified in the template."

echo "================================================================================"
cd "$SCRIPT_DIR/../.." && timeout 120 claude -p "$PROMPT" --permission-mode bypassPermissions 2>&1 | tee "$OUTPUT_FILE" || {
    echo ""
    echo "================================================================================"
    echo "EXECUTION FAILED (exit code: $?)"
    exit 1
}
echo "================================================================================"

echo ""
echo "Analyzing reviewer output..."
echo ""

# Verification tests
FAILED=0

echo "=== Verification Tests ==="
echo ""

# Test 1: Reviewer found the TODO
echo "Test 1: Reviewer found TODO..."
if grep -qi "TODO" "$OUTPUT_FILE" && grep -qi "requirements\|Requirements" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer identified TODO in Requirements section"
else
    echo "  [FAIL] Reviewer did not identify TODO"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Reviewer found the "specified later" deferral
echo "Test 2: Reviewer found 'specified later' deferral..."
if grep -qi "specified later\|later\|defer\|incomplete\|error handling" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer identified deferred content"
else
    echo "  [FAIL] Reviewer did not identify deferred content"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Reviewer output includes Issues section
echo "Test 3: Review output format..."
if grep -qi "issues\|Issues" "$OUTPUT_FILE"; then
    echo "  [PASS] Review includes Issues section"
else
    echo "  [FAIL] Review missing Issues section"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Reviewer did NOT approve (found issues)
echo "Test 4: Reviewer verdict..."
if grep -qi "Issues Found\|❌\|not approved\|issues found" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer correctly found issues (not approved)"
elif grep -qi "Approved\|✅" "$OUTPUT_FILE" && ! grep -qi "Issues Found\|❌" "$OUTPUT_FILE"; then
    echo "  [FAIL] Reviewer incorrectly approved spec with errors"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Reviewer identified problems (ambiguous format but found issues)"
fi
echo ""

# Summary
echo "========================================"
echo " Test Summary"
echo "========================================"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    echo "All verification tests passed!"
    echo ""
    echo "The spec document reviewer correctly:"
    echo "  ✓ Found TODO placeholder"
    echo "  ✓ Found 'specified later' deferral"
    echo "  ✓ Produced properly formatted review"
    echo "  ✓ Did not approve spec with errors"
    exit 0
else
    echo "STATUS: FAILED"
    echo "Failed $FAILED verification tests"
    echo ""
    echo "Output saved to: $OUTPUT_FILE"
    echo ""
    echo "Review the output to see what went wrong."
    exit 1
fi
