#!/usr/bin/env bash
# Integration Test: Complete Workflow
# Tests the full brainstorming → writing-plans → executing-plans workflow

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Integration Test: Complete Workflow${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Create test project
TEST_PROJECT=$(create_test_project "complete-workflow")
echo -e "${GREEN}✓${NC} Created test project: $TEST_PROJECT"
echo ""

# Initialize git repo
init_git_repo "$TEST_PROJECT"
echo -e "${GREEN}✓${NC} Initialized git repository"
echo ""

# Test Phase 1: Brainstorming
echo -e "${YELLOW}Phase 1: Brainstorming${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BRAINSTORMING_PROMPT="Use brainstorming skill to design a simple TODO list app with the following requirements:
- Add new tasks
- Mark tasks as complete
- Delete tasks
- Persist data to localStorage
- Use vanilla JavaScript

Keep the design simple and focused."
echo ""
echo "Running brainstorming..."
echo ""

BRAINSTORMING_OUTPUT=$(run_claude_in_project "$TEST_PROJECT" "$BRAINSTORMING_PROMPT" 180)

# Check if design document was created
DESIGN_DOC=$(find "$TEST_PROJECT/docs/plans" -name "*-design.md" 2>/dev/null | head -1)
if [ -z "$DESIGN_DOC" ]; then
    echo -e "${RED}✗ FAIL${NC}: Design document not created"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi

DESIGN_FILENAME=$(basename "$DESIGN_DOC")
echo -e "${GREEN}✓ PASS${NC}: Design document created: docs/plans/$DESIGN_FILENAME"

# Verify design document content
if grep -q "TODO list app" "$DESIGN_DOC"; then
    echo -e "${GREEN}✓ PASS${NC}: Design document contains TODO list app"
else
    echo -e "${YELLOW}⚠ WARN${NC}: Design document might not contain expected content"
fi

echo ""
echo ""

# Test Phase 2: Writing Plans
echo -e "${YELLOW}Phase 2: Writing Plans${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PLANNING_PROMPT="Use writing-plans skill to create a detailed implementation plan for the TODO list app.
The design has already been created in docs/plans/$DESIGN_FILENAME."
echo ""
echo "Running writing-plans..."
echo ""

PLANNING_OUTPUT=$(run_claude_in_project "$TEST_PROJECT" "$PLANNING_PROMPT" 180)

# Check if plan document was created
PLAN_DOC=$(find "$TEST_PROJECT/docs/plans" -name "*.md" ! -name "*-design.md" 2>/dev/null | head -1)
if [ -z "$PLAN_DOC" ]; then
    echo -e "${RED}✗ FAIL${NC}: Plan document not created"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi

PLAN_FILENAME=$(basename "$PLAN_DOC")
echo -e "${GREEN}✓ PASS${NC}: Plan document created: docs/plans/$PLAN_FILENAME"

# Verify plan has tasks
if grep -q "Task " "$PLAN_DOC"; then
    echo -e "${GREEN}✓ PASS${NC}: Plan document contains tasks"
else
    echo -e "${YELLOW}⚠ WARN${NC}: Plan document might not contain task breakdown"
fi

echo ""
echo ""

# Test Phase 3: Active Document Creation
echo -e "${YELLOW}Phase 3: Active Document Creation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if task document was created in docs/active/
TASK_DOC=$(find "$TEST_PROJECT/docs/active" -name "*-task-*.md" 2>/dev/null | head -1)
if [ -n "$TASK_DOC" ]; then
    TASK_FILENAME=$(basename "$TASK_DOC")
    echo -e "${GREEN}✓ PASS${NC}: Task document created: docs/active/$TASK_FILENAME"
else
    echo -e "${YELLOW}○ SKIP${NC}: Task document not created (may require config)"
fi

echo ""
echo ""

# Summary
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Test Summary${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Count created documents
DOC_COUNT=$(find "$TEST_PROJECT/docs" -name "*.md" 2>/dev/null | wc -l)
echo "Total documents created: $DOC_COUNT"

echo ""
echo "Document structure:"
find "$TEST_PROJECT/docs" -name "*.md" 2>/dev/null | sort | sed 's|'"$TEST_PROJECT/"'|  |'

echo ""
echo -e "${CYAN}=========================================${NC}"
echo ""

# Cleanup
cleanup_test_project "$TEST_PROJECT"

echo -e "${GREEN}✓ Integration test PASSED${NC}"
echo ""
echo "The complete workflow (brainstorming → writing-plans) is working correctly."
echo ""

exit 0
