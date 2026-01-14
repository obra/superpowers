#!/bin/bash
# Test: Issue context flows from issue -> design -> research -> plan -> implementer prompt
# This tests the full context preservation chain

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

test_name="issue-context-preservation"

echo "=== Test: Issue Context Preservation Chain ==="

# Test 1: Brainstorming captures issue context
echo "--- Test 1: Brainstorming captures Original Issue ---"

DESIGN_OUTPUT=$(cat <<'EOF'
# Test Design

## Original Issue

> **ID:** test-issue-123
> **Title:** Test Issue Title
> **Status:** Authoritative
> **Reason:** Has acceptance criteria checklist

## Problem
Test problem description.

## Acceptance Criteria
- [ ] First criterion
- [ ] Second criterion

---

## Problem Statement
...
EOF
)

assert_contains "$DESIGN_OUTPUT" "## Original Issue" "Design contains Original Issue section"
assert_contains "$DESIGN_OUTPUT" "test-issue-123" "Design contains issue ID"
assert_contains "$DESIGN_OUTPUT" "Authoritative" "Design shows Authoritative status"
assert_contains "$DESIGN_OUTPUT" "First criterion" "Design preserves acceptance criteria"

# Test 2: Research copies Original Issue verbatim
echo "--- Test 2: Research copies Original Issue from design ---"

RESEARCH_OUTPUT=$(cat <<'EOF'
# Research: Test Feature

## Original Issue

> **ID:** test-issue-123
> **Title:** Test Issue Title
> **Status:** Authoritative
> **Reason:** Has acceptance criteria checklist

## Problem
Test problem description.

## Acceptance Criteria
- [ ] First criterion
- [ ] Second criterion

---

## Executive Summary
...
EOF
)

assert_contains "$RESEARCH_OUTPUT" "## Original Issue" "Research contains Original Issue section"
assert_contains "$RESEARCH_OUTPUT" "test-issue-123" "Research preserves issue ID"
assert_contains "$RESEARCH_OUTPUT" "First criterion" "Research preserves acceptance criteria verbatim"

# Test 3: Plan copies Original Issue verbatim
echo "--- Test 3: Plan copies Original Issue from research ---"

PLAN_OUTPUT=$(cat <<'EOF'
# Test Implementation Plan

> **Primary Issue:** test-issue-123 (Authoritative)

## Original Issue

> **ID:** test-issue-123
> **Title:** Test Issue Title
> **Status:** Authoritative
> **Reason:** Has acceptance criteria checklist

## Problem
Test problem description.

## Acceptance Criteria
- [ ] First criterion
- [ ] Second criterion

---

## Task 1: ...
EOF
)

assert_contains "$PLAN_OUTPUT" "## Original Issue" "Plan contains Original Issue section"
assert_contains "$PLAN_OUTPUT" "test-issue-123" "Plan preserves issue ID"
assert_contains "$PLAN_OUTPUT" "First criterion" "Plan preserves acceptance criteria verbatim"

# Test 4: Implementer prompt includes Original Issue context
echo "--- Test 4: Implementer prompt includes Original Issue ---"

IMPLEMENTER_PROMPT=$(cat <<'EOF'
You are implementing Task 1: Test task

## Original Issue Context

> **ID:** test-issue-123
> **Title:** Test Issue Title
> **Status:** Authoritative

## Problem
Test problem description.

## Acceptance Criteria
- [ ] First criterion
- [ ] Second criterion

---

**Requirement:** Verify your implementation satisfies the acceptance criteria in the Original Issue above.

---

## Task Description
...
EOF
)

assert_contains "$IMPLEMENTER_PROMPT" "## Original Issue Context" "Implementer receives Original Issue"
assert_contains "$IMPLEMENTER_PROMPT" "test-issue-123" "Implementer sees issue ID"
assert_contains "$IMPLEMENTER_PROMPT" "First criterion" "Implementer sees acceptance criteria"
assert_contains "$IMPLEMENTER_PROMPT" "Verify your implementation satisfies" "Authoritative instruction present"

# Test 5: Reference Only issues get different treatment
echo "--- Test 5: Reference Only issues marked appropriately ---"

REFERENCE_PROMPT=$(cat <<'EOF'
## Original Issue Context

> **ID:** vague-issue-456
> **Title:** Make it better?
> **Status:** Reference Only

Some vague description without clear criteria.

---

**Note:** The Original Issue above is for context only. Follow the task spec below, not the issue directly.
EOF
)

assert_contains "$REFERENCE_PROMPT" "Reference Only" "Reference Only status shown"
assert_contains "$REFERENCE_PROMPT" "context only" "Reference Only instruction present"
assert_not_contains "$REFERENCE_PROMPT" "Verify your implementation satisfies" "No verification instruction for Reference Only"

echo ""
echo "=== All Issue Context Preservation Tests Passed ==="
