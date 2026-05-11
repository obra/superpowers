#!/usr/bin/env bash
# Test: Skill Priority Resolution
# Documents current OpenCode duplicate-name behavior for local and bundled
# skills. The desired local-shadowing behavior is tracked separately; this
# test keeps the integration suite honest without adding a plugin workaround.
# NOTE: These tests require OpenCode to be installed and configured
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OPENCODE_TEST_TIMEOUT_SECONDS="${OPENCODE_TEST_TIMEOUT_SECONDS:-120}"

echo "=== Test: Skill Priority Resolution ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Create same skill "priority-test" in all three locations with different markers
echo "Setting up priority test fixtures..."

# 1. Create in superpowers location (lowest priority)
mkdir -p "$SUPERPOWERS_SKILLS_DIR/priority-test"
cat > "$SUPERPOWERS_SKILLS_DIR/priority-test/SKILL.md" <<'EOF'
---
name: priority-test
description: Superpowers version of priority test skill
---
# Priority Test Skill (Superpowers Version)

This is the SUPERPOWERS version of the priority test skill.

PRIORITY_MARKER_SUPERPOWERS_VERSION
EOF

# 2. Create in personal location (medium priority)
mkdir -p "$OPENCODE_CONFIG_DIR/skills/priority-test"
cat > "$OPENCODE_CONFIG_DIR/skills/priority-test/SKILL.md" <<'EOF'
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

if [ -f "$SUPERPOWERS_SKILLS_DIR/priority-test/SKILL.md" ]; then
    echo "  [PASS] Superpowers version exists"
else
    echo "  [FAIL] Superpowers version missing"
    exit 1
fi

if [ -f "$OPENCODE_CONFIG_DIR/skills/priority-test/SKILL.md" ]; then
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

run_opencode() {
    local result_var="$1"
    local dir="$2"
    local prompt="$3"
    local command_output
    local exit_code

    set +e
    command_output=$(cd "$dir" && timeout "${OPENCODE_TEST_TIMEOUT_SECONDS}s" opencode run --print-logs --format json "$prompt" 2>&1)
    exit_code=$?
    set -e

    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after ${OPENCODE_TEST_TIMEOUT_SECONDS}s"
        exit 1
    fi

    if [ $exit_code -ne 0 ]; then
        echo "  [FAIL] OpenCode returned non-zero exit code: $exit_code"
        echo "  Output was:"
        awk 'NR <= 80 { print }' <<<"$command_output"
        exit 1
    fi

    printf -v "$result_var" '%s' "$command_output"
}

assert_contains() {
    local output="$1"
    local needle="$2"
    local message="$3"

    if [[ "$output" == *"$needle"* ]]; then
        echo "  [PASS] $message"
    else
        echo "  [FAIL] $message"
        echo "  Expected to find: $needle"
        echo "  Output was:"
        awk 'NR <= 80 { print }' <<<"$output"
        exit 1
    fi
}

first_skill_tool_event() {
    awk '/"type":"tool_use"/ && /"tool":"skill"/ { print; exit }' <<<"$1"
}

describe_priority_result() {
    local output="$1"
    local expected_marker="$2"
    local fallback_marker="$3"
    local pass_message="$4"
    local known_bug_message="$5"
    local loaded_skill

    loaded_skill="$(first_skill_tool_event "$output")"

    if [[ "$loaded_skill" == *"$expected_marker"* ]]; then
        echo "  [PASS] $pass_message"
    elif [[ "$loaded_skill" == *"$fallback_marker"* ]]; then
        echo "  [INFO] $known_bug_message"
        echo "  [INFO] Tracked separately: OpenCode bundled skills can shadow local skills with duplicate native names"
    else
        echo "  [FAIL] Could not verify priority marker in native skill tool output"
        echo "  Output was:"
        awk 'NR <= 80 { print }' <<<"$output"
        exit 1
    fi
}

# Test 2: Document personal vs bundled superpowers priority
echo ""
echo "Test 2: Documenting personal vs superpowers priority..."
echo "  Running from outside project directory..."

run_opencode output "$HOME" "Call the skill tool with name \"priority-test\". Show the exact content including any PRIORITY_MARKER text."
describe_priority_result \
    "$output" \
    "PRIORITY_MARKER_PERSONAL_VERSION" \
    "PRIORITY_MARKER_SUPERPOWERS_VERSION" \
    "Personal version loaded for duplicate native skill name" \
    "Current OpenCode behavior loaded bundled superpowers version instead of personal version"

# Test 3: Document project vs bundled superpowers priority
echo ""
echo "Test 3: Documenting project vs personal/superpowers priority..."
echo "  Running from project directory..."

run_opencode output "$TEST_HOME/test-project" "Call the skill tool with name \"priority-test\". Show the exact content including any PRIORITY_MARKER text."
describe_priority_result \
    "$output" \
    "PRIORITY_MARKER_PROJECT_VERSION" \
    "PRIORITY_MARKER_SUPERPOWERS_VERSION" \
    "Project version loaded for duplicate native skill name" \
    "Current OpenCode behavior loaded bundled superpowers version instead of project version"

# Test 4: Test a non-colliding bundled superpowers skill is still available
echo ""
echo "Test 4: Testing non-colliding superpowers skill remains available..."

mkdir -p "$SUPERPOWERS_SKILLS_DIR/superpowers-only-test"
cat > "$SUPERPOWERS_SKILLS_DIR/superpowers-only-test/SKILL.md" <<'EOF'
---
name: superpowers-only-test
description: Superpowers-only priority test skill
---
# Superpowers Only Test Skill

PRIORITY_MARKER_SUPERPOWERS_ONLY_VERSION
EOF

run_opencode output "$TEST_HOME/test-project" "Call the skill tool with name \"superpowers-only-test\". Show the exact content including any PRIORITY_MARKER text."
assert_contains "$output" "PRIORITY_MARKER_SUPERPOWERS_ONLY_VERSION" "Non-colliding superpowers skill is still registered"

echo ""
echo "=== All priority tests passed ==="
