#!/usr/bin/env bash
# Skill invocation assertions for Horspowers test suite
# Provides functions to verify skill invocations in transcripts

# Assert a skill was called in a transcript
# Usage: assert_skill_called "transcript.jsonl" "skill-name" "test name"
assert_skill_called() {
    local transcript_file="$1"
    local skill_name="$2"
    local test_name="${3:-assertion}"

    # Check if transcript contains skill invocation
    if grep -q "\"skill:$skill_name" "$transcript_file"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Skill '$skill_name' not found in transcript"
        return 1
    fi
}

# Assert a skill was called with a specific parameter value
# Usage: assert_skill_param "transcript.jsonl" "skill-name" "param-key" "expected-value" "test name"
assert_skill_param() {
    local transcript_file="$1"
    local skill_name="$2"
    local param_key="$3"
    local expected_value="$4"
    local test_name="${5:-assertion}"

    # Extract the skill invocation line
    local skill_line
    skill_line=$(grep "\"skill:$skill_name" "$transcript_file" | head -1)

    if [ -z "$skill_line" ]; then
        echo "  [FAIL] $test_name"
        echo "  Skill '$skill_name' not found in transcript"
        return 1
    fi

    # Check if parameter exists and matches expected value
    # Format: skill:name --param "value" or --param 'value'
    local double_quoted="--${param_key} \"${expected_value}\""
    local single_quoted="--${param_key} '${expected_value}'"

    # Use bash native string matching instead of grep for better reliability
    if [[ "$skill_line" == *"$double_quoted"* ]] || [[ "$skill_line" == *"$single_quoted"* ]]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected parameter '$param_key'='$expected_value'"
        echo "  In skill invocation: $skill_line"
        return 1
    fi
}

# Assert skill A was called before skill B
# Usage: assert_skill_order "transcript.jsonl" "skill-a" "skill-b" "test name"
assert_skill_order() {
    local transcript_file="$1"
    local skill_a="$2"
    local skill_b="$3"
    local test_name="${4:-assertion}"

    # Get line numbers of skill invocations
    local line_a=$(grep -n "\"skill:$skill_a" "$transcript_file" | head -1 | cut -d: -f1)
    local line_b=$(grep -n "\"skill:$skill_b" "$transcript_file" | head -1 | cut -d: -f1)

    if [ -z "$line_a" ]; then
        echo "  [FAIL] $test_name: skill '$skill_a' not found"
        return 1
    fi

    if [ -z "$line_b" ]; then
        echo "  [FAIL] $test_name: skill '$skill_b' not found"
        return 1
    fi

    if [ "$line_a" -lt "$line_b" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected '$skill_a' before '$skill_b'"
        echo "  But found '$skill_a' at line $line_a, '$skill_b' at line $line_b"
        return 1
    fi
}
