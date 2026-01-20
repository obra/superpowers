#!/usr/bin/env bash
# Quick Verification Test
# Verifies integration test infrastructure is working

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Quick Verification Test${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Test 1: Create test project
echo "Test 1: Create test project..."
TEST_PROJECT=$(create_test_project "quick-verify")
if [ -d "$TEST_PROJECT" ]; then
    echo -e "  ${GREEN}✓${NC} Test project created: $TEST_PROJECT"
else
    echo -e "  ${RED}✗${NC} Failed to create test project"
    exit 1
fi
echo ""

# Test 2: Initialize git repo
echo "Test 2: Initialize git repository..."
init_git_repo "$TEST_PROJECT"
if [ -d "$TEST_PROJECT/.git" ]; then
    echo -e "  ${GREEN}✓${NC} Git repository initialized"
else
    echo -e "  ${RED}✗${NC} Failed to initialize git"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 3: Create a simple file
echo "Test 3: Create test file..."
echo "# Test" > "$TEST_PROJECT/README.md"
if [ -f "$TEST_PROJECT/README.md" ]; then
    echo -e "  ${GREEN}✓${NC} File created successfully"
else
    echo -e "  ${RED}✗${NC} Failed to create file"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 4: File exists check
echo "Test 4: File exists check..."
if file_exists "$TEST_PROJECT" "README.md"; then
    echo -e "  ${GREEN}✓${NC} file_exists() works correctly"
else
    echo -e "  ${RED}✗${NC} file_exists() failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 5: Count files
echo "Test 5: Count files..."
FILE_COUNT=$(count_files "$TEST_PROJECT" "*.md")
if [ "$FILE_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} count_files() works (found $FILE_COUNT files)"
else
    echo -e "  ${RED}✗${NC} count_files() failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 6: Read file
echo "Test 6: Read file content..."
CONTENT=$(read_file "$TEST_PROJECT" "README.md")
if echo "$CONTENT" | grep -q "Test"; then
    echo -e "  ${GREEN}✓${NC} read_file() works correctly"
else
    echo -e "  ${RED}✗${NC} read_file() failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 7: Cleanup
echo "Test 7: Cleanup test project..."
cleanup_test_project "$TEST_PROJECT"
if [ ! -d "$TEST_PROJECT" ]; then
    echo -e "  ${GREEN}✓${NC} Test project removed successfully"
else
    echo -e "  ${RED}✗${NC} Failed to remove test project"
    exit 1
fi
echo ""

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Verification Complete${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${GREEN}✓ All helper functions working correctly${NC}"
echo ""
echo "Integration test infrastructure is ready!"
echo ""

exit 0
