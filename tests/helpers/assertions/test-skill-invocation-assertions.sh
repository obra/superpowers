#!/usr/bin/env bash
# Test suite for tests/helpers/assertions/skill-invocation-assertions.sh

# Source the skill-invocation-assertions.sh to test
ASSERTIONS_PATH="$(dirname "$0")/skill-invocation-assertions.sh"

if [ -f "$ASSERTIONS_PATH" ]; then
    source "$ASSERTIONS_PATH"
else
    echo "Error: skill-invocation-assertions.sh not found at $ASSERTIONS_PATH"
    exit 1
fi

# Test: assert_skill_called checks if a skill was invoked
# Usage: assert_skill_called "transcript.jsonl" "skill-name" "test name"
test_assert_skill_called_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a test transcript with skill invocation
    cat > "$transcript_file" <<'EOF'
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:brainstorming"}}
EOF

    local result
    result=$(assert_skill_called "$transcript_file" "brainstorming" "skill was invoked" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_skill_called passes when skill found"
        return 0
    else
        echo "  [FAIL] assert_skill_called should pass when skill found"
        return 1
    fi
}

# Test: assert_skill_called fails when skill not invoked
test_assert_skill_called_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a test transcript without the skill invocation
    cat > "$transcript_file" <<'EOF'
{"type":"tool","tool_use":{"tool_name":"Read","input":"file.txt"}}
EOF

    local result
    result=$(assert_skill_called "$transcript_file" "brainstorming" "skill not found" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_skill_called fails when skill not found"
        return 0
    else
        echo "  [FAIL] assert_skill_called should fail when skill not found"
        return 1
    fi
}

# Test: assert_skill_param checks if skill was called with specific parameter
# Usage: assert_skill_param "transcript.jsonl" "skill-name" "param-key" "param-value" "test name"
test_assert_skill_param_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a test transcript with skill and parameter
    # Using single quotes around parameter value to avoid escaping issues
    cat > "$transcript_file" <<'EOF'
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:brainstorming --topic 'test topic'"}}
EOF

    local result
    result=$(assert_skill_param "$transcript_file" "brainstorming" "topic" "test topic" "parameter matches" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_skill_param passes when parameter found"
        return 0
    else
        echo "  [FAIL] assert_skill_param should pass when parameter found"
        return 1
    fi
}

# Test: assert_skill_param fails when parameter not found
test_assert_skill_param_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a test transcript without the parameter
    cat > "$transcript_file" <<'EOF'
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:brainstorming --topic \"test topic\""}}
EOF

    local result
    result=$(assert_skill_param "$transcript_file" "brainstorming" "other" "value" "parameter not found" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_skill_param fails when parameter not found"
        return 0
    else
        echo "  [FAIL] assert_skill_param should fail when parameter not found"
        return 1
    fi
}

# Test: assert_skill_order checks if skill A was called before skill B
# Usage: assert_skill_order "transcript.jsonl" "skill-a" "skill-b" "test name"
test_assert_skill_order_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a test transcript with correct order
    cat > "$transcript_file" <<'EOF'
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:brainstorming"}}
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:writing-plans"}}
EOF

    local result
    result=$(assert_skill_order "$transcript_file" "brainstorming" "writing-plans" "order correct" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_skill_order passes when order is correct"
        return 0
    else
        echo "  [FAIL] assert_skill_order should pass when order is correct"
        return 1
    fi
}

# Test: assert_skill_order fails when order is wrong
test_assert_skill_order_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a test transcript with wrong order
    cat > "$transcript_file" <<'EOF'
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:writing-plans"}}
{"type":"tool","tool_use":{"tool_name":"Skill","input":"skill:brainstorming"}}
EOF

    local result
    result=$(assert_skill_order "$transcript_file" "brainstorming" "writing-plans" "order wrong" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_skill_order fails when order is wrong"
        return 0
    else
        echo "  [FAIL] assert_skill_order should fail when order is wrong"
        return 1
    fi
}

# Run all tests
echo "========================================="
echo "Running skill-invocation-assertions.sh tests"
echo "========================================="
echo ""

failed=0

test_assert_skill_called_pass || ((failed++))
test_assert_skill_called_fail || ((failed++))
test_assert_skill_param_pass || ((failed++))
test_assert_skill_param_fail || ((failed++))
test_assert_skill_order_pass || ((failed++))
test_assert_skill_order_fail || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
