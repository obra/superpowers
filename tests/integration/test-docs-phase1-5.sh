#!/usr/bin/env bash
# Integration Test: Documentation System Phase 1-5 New Features
# Tests new features added during Phase 1-5:
# - deleteBugDocument() method
# - countCoreDocs() method
# - extractDocType() prefix format detection
# - Migration script functionality

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
echo -e "${CYAN} Integration Test: Phase 1-5 New Features${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Create test project
TEST_PROJECT=$(create_test_project "docs-phase1-5")
init_git_repo "$TEST_PROJECT"
echo -e "${GREEN}✓${NC} Test project initialized"
echo ""

HORSPOWERS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test 1: deleteBugDocument() - Status verification
echo -e "${YELLOW}Test 1: deleteBugDocument() - Status Verification${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$TEST_PROJECT/test-delete-bug.js" << 'EOF'
const { UnifiedDocsManager } = require('@HORSPOWERS_ROOT@/lib/docs-core.js');
const fs = require('fs');
const path = require('path');

const manager = new UnifiedDocsManager(process.cwd());

// Create a fixed bug document
const bugResult = manager.createActiveDocument('bug', 'Test Fixed Bug', null, {
    status: '已修复',
    priority: '中'
});

console.log('Created bug document:', bugResult.path);

// Test 1: Delete with status verification (should succeed)
console.log('\nTest 1.1: Delete with status verification...');
const deleteResult1 = manager.deleteBugDocument(bugResult.path, { verifyStatus: true });
console.log('  Success:', deleteResult1.success);
console.log('  Deleted:', deleteResult1.deleted);
console.log('  Message:', deleteResult1.message);

if (!deleteResult1.success || !deleteResult1.deleted) {
    console.error('FAIL: Expected success=true, deleted=true');
    process.exit(1);
}

// Create another bug document (not fixed)
const bugResult2 = manager.createActiveDocument('bug', 'Test Unfixed Bug', null, {
    status: '待修复',
    priority: '高'
});

console.log('\nCreated unfixed bug document:', bugResult2.path);

// Test 2: Delete with status verification (should fail - not fixed)
console.log('\nTest 1.2: Delete unfixed bug with verification...');
const deleteResult2 = manager.deleteBugDocument(bugResult2.path, { verifyStatus: true });
console.log('  Success:', deleteResult2.success);
console.log('  Deleted:', deleteResult2.deleted);
console.log('  Message:', deleteResult2.message);

if (deleteResult2.success || deleteResult2.deleted) {
    console.error('FAIL: Expected success=false, deleted=false for unfixed bug');
    process.exit(1);
}

// Test 3: Force delete unfixed bug
console.log('\nTest 1.3: Force delete unfixed bug...');
const deleteResult3 = manager.deleteBugDocument(bugResult2.path, { verifyStatus: false });
console.log('  Success:', deleteResult3.success);
console.log('  Deleted:', deleteResult3.deleted);

if (!deleteResult3.success || !deleteResult3.deleted) {
    console.error('FAIL: Expected success=true, deleted=true for force delete');
    process.exit(1);
}

console.log('\n✓ All deleteBugDocument tests passed!');
EOF

sed -i.bak "s|@HORSPOWERS_ROOT@|$HORSPOWERS_ROOT|g" "$TEST_PROJECT/test-delete-bug.js"
rm -f "$TEST_PROJECT/test-delete-bug.js.bak"

echo "Running deleteBugDocument tests..."
if node "$TEST_PROJECT/test-delete-bug.js"; then
    echo -e "${GREEN}✓ PASS${NC}: deleteBugDocument() status verification working"
else
    echo -e "${RED}✗ FAIL${NC}: deleteBugDocument() test failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 2: countCoreDocs() - Core document counting
echo -e "${YELLOW}Test 2: countCoreDocs() - Core Document Counting${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$TEST_PROJECT/test-count-core.js" << 'EOF'
const { UnifiedDocsManager } = require('@HORSPOWERS_ROOT@/lib/docs-core.js');

const manager = new UnifiedDocsManager(process.cwd());

// Create design, plan, task documents for a feature
console.log('Creating documents for feature-auth...');
const designResult = manager.createDesignDocument('Authentication System', '# Auth Design');
const planResult = manager.createPlanDocument('Auth Implementation', '# Auth Plan');
const taskResult = manager.createActiveDocument('task', 'Implement Auth', null, {
    plan: planResult.filename
});

console.log('  Design:', designResult.filename);
console.log('  Plan:', planResult.filename);
console.log('  Task:', taskResult.filename);

// Test 1: Count all core docs
console.log('\nTest 2.1: Count all core docs (no filter)...');
const countResult1 = manager.countCoreDocs();
console.log('  Total:', countResult1.total);
console.log('  Design:', countResult1.details.design);
console.log('  Plan:', countResult1.details.plan);
console.log('  Task:', countResult1.details.task);
console.log('  Warning:', countResult1.warning || 'none');

if (countResult1.total !== 3) {
    console.error('FAIL: Expected total=3, got', countResult1.total);
    process.exit(1);
}

// Create additional documents (should exceed threshold)
console.log('\nCreating extra documents...');
const designResult2 = manager.createDesignDocument('Authorization', '# Authz Design');
const planResult2 = manager.createPlanDocument('Authz Implementation', '# Authz Plan');
const taskResult2 = manager.createActiveDocument('task', 'Implement Authz', null, {
    plan: planResult2.filename
});

// Test 2: Count should trigger warning
console.log('\nTest 2.2: Count with warning (>3 core docs)...');
const countResult2 = manager.countCoreDocs();
console.log('  Total:', countResult2.total);
console.log('  Warning:', countResult2.warning || 'none');

if (countResult2.total <= 3) {
    console.error('FAIL: Expected total>3');
    process.exit(1);
}

if (!countResult2.warning) {
    console.error('FAIL: Expected warning for >3 core docs');
    process.exit(1);
}

// Test 3: Filter by feature name
console.log('\nTest 2.3: Filter by feature name (auth)...');
const countResult3 = manager.countCoreDocs('auth');
console.log('  Total:', countResult3.total);
console.log('  Warning:', countResult3.warning || 'none');

// Should count documents with 'auth' in name
if (countResult3.total === 0) {
    console.error('FAIL: Expected >0 docs for feature "auth"');
    process.exit(1);
}

console.log('\n✓ All countCoreDocs tests passed!');
EOF

sed -i.bak "s|@HORSPOWERS_ROOT@|$HORSPOWERS_ROOT|g" "$TEST_PROJECT/test-count-core.js"
rm -f "$TEST_PROJECT/test-count-core.js.bak"

echo "Running countCoreDocs tests..."
if node "$TEST_PROJECT/test-count-core.js"; then
    echo -e "${GREEN}✓ PASS${NC}: countCoreDocs() working correctly"
else
    echo -e "${RED}✗ FAIL${NC}: countCoreDocs() test failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 3: extractDocType() - Prefix format detection
echo -e "${YELLOW}Test 3: extractDocType() - Prefix Format Detection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$TEST_PROJECT/test-extract-type.js" << 'EOF'
const { UnifiedDocsManager } = require('@HORSPOWERS_ROOT@/lib/docs-core.js');

const manager = new UnifiedDocsManager(process.cwd());

// Test cases for new prefix format
const testCases = [
    // New prefix format (should be detected)
    { path: 'docs/plans/2026-01-21-design-auth-system.md', expected: 'design' },
    { path: 'docs/plans/2026-01-21-plan-auth-implementation.md', expected: 'plan' },
    { path: 'docs/active/2026-01-21-task-implement-auth.md', expected: 'task' },
    { path: 'docs/active/2026-01-21-bug-login-fails.md', expected: 'bug' },
    { path: 'docs/context/2026-01-21-context-project-setup.md', expected: 'context' },

    // Old suffix format (should still be detected for backward compatibility)
    { path: 'docs/plans/2025-01-04-auth-system-design.md', expected: 'design' },

    // Edge cases - 使用严格前缀匹配，避免子串误判
    { path: 'docs/2026-01-21-debug-connection.md', expected: 'plan' }, // 'debug' 不是 'bug-' 前缀，应识别为 plan
    { path: 'docs/2026-01-21-designer-profile.md', expected: 'plan' }, // 'designer' 不是 'design-' 前缀，应识别为 plan
    { path: 'docs/random-file.md', expected: 'unknown' }, // 没有日期前缀，应识别为 unknown
];

console.log('Testing extractDocType()...\n');
let allPassed = true;

for (const test of testCases) {
    const result = manager.extractDocType(test.path);
    const passed = result === test.expected;
    const status = passed ? '✓' : '✗';

    console.log(`${status} ${test.path}`);
    console.log(`  Expected: ${test.expected}, Got: ${result}`);

    if (!passed) {
        allPassed = false;
    }
}

if (!allPassed) {
    console.error('\nFAIL: Some extractDocType tests failed');
    process.exit(1);
}

console.log('\n✓ All extractDocType tests passed!');
EOF

sed -i.bak "s|@HORSPOWERS_ROOT@|$HORSPOWERS_ROOT|g" "$TEST_PROJECT/test-extract-type.js"
rm -f "$TEST_PROJECT/test-extract-type.js.bak"

echo "Running extractDocType tests..."
if node "$TEST_PROJECT/test-extract-type.js"; then
    echo -e "${GREEN}✓ PASS${NC}: extractDocType() prefix format detection working"
else
    echo -e "${RED}✗ FAIL${NC}: extractDocType() test failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Test 4: Migration script - Dry run mode
echo -e "${YELLOW}Test 4: Migration Script - Dry Run Mode${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create old format documents for testing
mkdir -p "$TEST_PROJECT/docs/plans"
cat > "$TEST_PROJECT/docs/plans/2025-01-04-test-feature-design.md" << 'EOF'
# Test Feature Design

This is a test design document in old format.
EOF

cat > "$TEST_PROJECT/docs/plans/2026-01-20-another-feature-design.md" << 'EOF'
# Another Feature Design

This is another test design document in old format.
EOF

echo "Created old format design documents for testing"

# Run migration script in dry-run mode
echo "Running migration script in dry-run mode..."
if node "$HORSPOWERS_ROOT/scripts/migrate-docs.js" --dry-run; then
    echo -e "${GREEN}✓ PASS${NC}: Migration script dry-run working"
else
    echo -e "${RED}✗ FAIL${NC}: Migration script test failed"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Verify old format files still exist (dry-run should not modify)
OLD_COUNT=$(find "$TEST_PROJECT/docs" -name "*-design.md" -type f | wc -l)
if [ "$OLD_COUNT" -eq 2 ]; then
    echo -e "  ${GREEN}✓${NC} Dry-run did not modify files (correct)"
else
    echo -e "  ${RED}✗${NC} Dry-run modified files (unexpected)"
    cleanup_test_project "$TEST_PROJECT"
    exit 1
fi
echo ""

# Summary
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Test Summary${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

echo "Test Results:"
echo "  ✓ deleteBugDocument() status verification: PASS"
echo "  ✓ countCoreDocs() core document counting: PASS"
echo "  ✓ extractDocType() prefix format detection: PASS"
echo "  ✓ Migration script dry-run mode: PASS"
echo ""

# Cleanup
cleanup_test_project "$TEST_PROJECT"

echo -e "${GREEN}✓ All Phase 1-5 feature tests PASSED${NC}"
echo ""

exit 0
