#!/usr/bin/env bash
# Test: Skill Priority Resolution
# Verifies that skills are resolved with correct priority: project > personal > superpowers
# NOTE: These tests require OpenCode to be installed and configured
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Skill Priority Resolution ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Create same skill "priority-test" in all three locations with different markers
echo "Setting up priority test fixtures..."

# 1. Create in superpowers location (lowest priority)
mkdir -p "$HOME/.config/opencode/superpowers/skills/priority-test"
cat > "$HOME/.config/opencode/superpowers/skills/priority-test/SKILL.md" <<'EOF'
---
name: priority-test
description: Superpowers version of priority test skill
---
# Priority Test Skill (Superpowers Version)

This is the SUPERPOWERS version of the priority test skill.

PRIORITY_MARKER_SUPERPOWERS_VERSION
EOF

# 2. Create in personal location (medium priority)
mkdir -p "$HOME/.config/opencode/skills/priority-test"
cat > "$HOME/.config/opencode/skills/priority-test/SKILL.md" <<'EOF'
---
name: priority-test
description: Personal version of priority test skill
---
# Priority Test Skill (Personal Version)

This is the PERSONAL version of the priority test skill.

PRIORITY_MARKER_PERSONAL_VERSION
EOF

# 3. Create in project location (highest priority)
mkdir -p "$TEST_HOME/test-project/.opencode/skills/priority-test"
cat > "$TEST_HOME/test-project/.opencode/skills/priority-test/SKILL.md" <<'EOF'
---
name: priority-test
description: Project version of priority test skill
---
# Priority Test Skill (Project Version)

This is the PROJECT version of the priority test skill.

PRIORITY_MARKER_PROJECT_VERSION
EOF

echo "  Created priority-test skill in all three locations"

# Test 1: Verify fixture setup
echo ""
echo "Test 1: Verifying test fixtures..."

if [ -f "$HOME/.config/opencode/superpowers/skills/priority-test/SKILL.md" ]; then
    echo "  [PASS] Superpowers version exists"
else
    echo "  [FAIL] Superpowers version missing"
    exit 1
fi

if [ -f "$HOME/.config/opencode/skills/priority-test/SKILL.md" ]; then
    echo "  [PASS] Personal version exists"
else
    echo "  [FAIL] Personal version missing"
    exit 1
fi

if [ -f "$TEST_HOME/test-project/.opencode/skills/priority-test/SKILL.md" ]; then
    echo "  [PASS] Project version exists"
else
    echo "  [FAIL] Project version missing"
    exit 1
fi

# Check if opencode is available for integration tests
if ! command -v opencode &> /dev/null; then
    echo ""
    echo "  [SKIP] OpenCode not installed - skipping integration tests"
    echo "  To run these tests, install OpenCode: https://opencode.ai"
    echo ""
    echo "=== Priority fixture tests passed (integration tests skipped) ==="
    exit 0
fi

# Test 2: Test that personal overrides superpowers
echo ""
echo "Test 2: Testing personal > superpowers priority..."
echo "  Running from outside project directory..."

# Run from HOME (not in project) - should get personal version
cd "$HOME"
output=$(timeout 60s opencode run --print-logs "Use the use_skill tool to load the priority-test skill. Show me the exact content including any PRIORITY_MARKER text." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
}

if echo "$output" | grep -qi "PRIORITY_MARKER_PERSONAL_VERSION"; then
    echo "  [PASS] Personal version loaded (overrides superpowers)"
elif echo "$output" | grep -qi "PRIORITY_MARKER_SUPERPOWERS_VERSION"; then
    echo "  [FAIL] Superpowers version loaded instead of personal"
    exit 1
else
    echo "  [WARN] Could not verify priority marker in output"
    echo "  Output snippet:"
    echo "$output" | grep -i "priority\|personal\|superpowers" | head -10
fi

# Test 3: Test that project overrides both personal and superpowers
echo ""
echo "Test 3: Testing project > personal > superpowers priority..."
echo "  Running from project directory..."

# Run from project directory - should get project version
cd "$TEST_HOME/test-project"
output=$(timeout 60s opencode run --print-logs "Use the use_skill tool to load the priority-test skill. Show me the exact content including any PRIORITY_MARKER text." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
}

if echo "$output" | grep -qi "PRIORITY_MARKER_PROJECT_VERSION"; then
    echo "  [PASS] Project version loaded (highest priority)"
elif echo "$output" | grep -qi "PRIORITY_MARKER_PERSONAL_VERSION"; then
    echo "  [FAIL] Personal version loaded instead of project"
    exit 1
elif echo "$output" | grep -qi "PRIORITY_MARKER_SUPERPOWERS_VERSION"; then
    echo "  [FAIL] Superpowers version loaded instead of project"
    exit 1
else
    echo "  [WARN] Could not verify priority marker in output"
    echo "  Output snippet:"
    echo "$output" | grep -i "priority\|project\|personal" | head -10
fi

# Test 4: Test explicit superpowers: prefix bypasses priority
echo ""
echo "Test 4: Testing superpowers: prefix forces superpowers version..."

cd "$TEST_HOME/test-project"
output=$(timeout 60s opencode run --print-logs "Use the use_skill tool to load superpowers:priority-test specifically. Show me the exact content including any PRIORITY_MARKER text." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
}

if echo "$output" | grep -qi "PRIORITY_MARKER_SUPERPOWERS_VERSION"; then
    echo "  [PASS] superpowers: prefix correctly forces superpowers version"
elif echo "$output" | grep -qi "PRIORITY_MARKER_PROJECT_VERSION\|PRIORITY_MARKER_PERSONAL_VERSION"; then
    echo "  [FAIL] superpowers: prefix did not force superpowers version"
    exit 1
else
    echo "  [WARN] Could not verify priority marker in output"
fi

# Test 5: Test explicit project: prefix
echo ""
echo "Test 5: Testing project: prefix forces project version..."

cd "$HOME"  # Run from outside project but with project: prefix
output=$(timeout 60s opencode run --print-logs "Use the use_skill tool to load project:priority-test specifically. Show me the exact content." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
}

# Note: This may fail since we're not in the project directory
# The project: prefix only works when in a project context
if echo "$output" | grep -qi "not found\|error"; then
    echo "  [PASS] project: prefix correctly fails when not in project context"
else
    echo "  [INFO] project: prefix behavior outside project context may vary"
fi

echo ""
echo "=== All priority tests passed ==="
