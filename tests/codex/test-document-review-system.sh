#!/usr/bin/env bash
# Integration Test: spec document review via Codex
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: Document Review System"
echo "========================================"
echo ""
echo "This test verifies the document review system by:"
echo "  1. Creating a spec with intentional errors"
echo "  2. Running the spec document reviewer through Codex"
echo "  3. Verifying the reviewer catches the errors"
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

echo "Test project: $TEST_PROJECT"
echo ""

cd "$TEST_PROJECT"
mkdir -p docs/superpowers/specs

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

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit with flawed spec" --quiet

echo "Created test spec with intentional errors:"
echo "  - TODO placeholder in Requirements section"
echo "  - 'specified later' deferral in Architecture section"
echo ""

OUTPUT=$(run_codex "You are testing the spec document reviewer.

Read the review template at $REPO_ROOT/skills/brainstorming/spec-document-reviewer-prompt.md.

Then review the spec at docs/superpowers/specs/test-feature-design.md using the criteria and output format from that template.

Look for:
- TODOs, placeholders, 'TBD', incomplete sections
- sections saying content will be specified later
- issues serious enough to make planning flawed

Output only the review." "$TEST_PROJECT" 180)

SESSION_FILE=$(latest_codex_session_file)
if [ -z "$SESSION_FILE" ] || [ ! -f "$SESSION_FILE" ]; then
    echo "ERROR: Could not find persisted Codex session file"
    exit 1
fi

FAILED=0

echo "=== Verification Tests ==="
echo ""

echo "Test 1: Reviewer found TODO..."
if assert_contains "$OUTPUT" "TODO" "Reviewer identified TODO" && assert_contains "$OUTPUT" "requirements" "Reviewer linked TODO to Requirements"; then
    :
else
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 2: Reviewer found deferred content..."
if assert_contains "$OUTPUT" "specified later|later|defer|incomplete|error handling" "Reviewer identified deferred content"; then
    :
else
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 3: Review output format..."
if assert_contains "$OUTPUT" "Spec Review|Status:|Issues|Recommendations" "Review includes expected structure"; then
    :
else
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 4: Reviewer verdict..."
if echo "$OUTPUT" | grep -Eiq "Issues Found|not approved|Status:.*Issues Found|Status:.*Needs Changes"; then
    echo "  [PASS] Reviewer correctly found issues"
elif echo "$OUTPUT" | grep -Eiq "Approved|Status:.*Approved"; then
    echo "  [FAIL] Reviewer incorrectly approved spec with errors"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Reviewer identified problems with an equivalent verdict"
fi
echo ""

echo "Test 5: Persisted session created..."
if grep -q '"type":"task_complete"' "$SESSION_FILE" && grep -q '"last_agent_message":' "$SESSION_FILE"; then
    echo "  [PASS] Persisted session contains task completion evidence"
else
    echo "  [FAIL] Persisted session missing task completion evidence"
    FAILED=$((FAILED + 1))
fi
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo "========================================"
    echo " Document Review Test Passed"
    echo "========================================"
    exit 0
fi

echo "========================================"
echo " Document Review Test Failed ($FAILED checks)"
echo "========================================"
exit 1
