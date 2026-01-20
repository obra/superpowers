#!/usr/bin/env bash
# Test suite for tests/helpers/assertions/transcript-assertions.sh

# Source the transcript-assertions.sh to test
ASSERTIONS_PATH="$(dirname "$0")/transcript-assertions.sh"

if [ -f "$ASSERTIONS_PATH" ]; then
    source "$ASSERTIONS_PATH"
else
    echo "Error: transcript-assertions.sh not found at $ASSERTIONS_PATH"
    exit 1
fi

# Test: assert_transcript_valid checks if transcript has valid JSONL format
# Usage: assert_transcript_valid "transcript.jsonl" "test name"
test_assert_transcript_valid_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a valid JSONL transcript
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"Hello"}
{"type":"tool","tool_use":{"tool_name":"Read","input":"file.txt"}}
{"type":"message","role":"assistant","content":"Hi there"}
EOF

    local result
    result=$(assert_transcript_valid "$transcript_file" "valid JSONL format" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_transcript_valid passes for valid JSONL"
        return 0
    else
        echo "  [FAIL] assert_transcript_valid should pass for valid JSONL"
        return 1
    fi
}

# Test: assert_transcript_valid fails for invalid JSON
test_assert_transcript_valid_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create an invalid JSONL transcript
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"Hello"}
this is not valid json
{"type":"tool","tool_use":{"tool_name":"Read","input":"file.txt"}}
EOF

    local result
    result=$(assert_transcript_valid "$transcript_file" "invalid JSON" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_transcript_valid fails for invalid JSON"
        return 0
    else
        echo "  [FAIL] assert_transcript_valid should fail for invalid JSON"
        return 1
    fi
}

# Test: assert_tool_called checks if a tool was invoked in transcript
# Usage: assert_tool_called "transcript.jsonl" "tool-name" "test name"
test_assert_tool_called_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a transcript with tool invocation
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"Read file.txt"}
{"type":"tool","tool_use":{"tool_name":"Read","input":"file.txt"}}
{"type":"message","role":"assistant","content":"File content here"}
EOF

    local result
    result=$(assert_tool_called "$transcript_file" "Read" "Read tool was called" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_tool_called passes when tool found"
        return 0
    else
        echo "  [FAIL] assert_tool_called should pass when tool found"
        return 1
    fi
}

# Test: assert_tool_called fails when tool not invoked
test_assert_tool_called_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a transcript without the tool
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"Write file.txt"}
{"type":"tool","tool_use":{"tool_name":"Write","input":"file.txt"}}
{"type":"message","role":"assistant","content":"File written"}
EOF

    local result
    result=$(assert_tool_called "$transcript_file" "Read" "Read tool not found" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_tool_called fails when tool not found"
        return 0
    else
        echo "  [FAIL] assert_tool_called should fail when tool not found"
        return 1
    fi
}

# Test: assert_output_contains checks if assistant output contains text
# Usage: assert_output_contains "transcript.jsonl" "expected text" "test name"
test_assert_output_contains_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a transcript with specific output
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"Say hello"}
{"type":"message","role":"assistant","content":"Hello, World! This is a response."}
EOF

    local result
    result=$(assert_output_contains "$transcript_file" "Hello, World!" "output contains greeting" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_output_contains passes when text found"
        return 0
    else
        echo "  [FAIL] assert_output_contains should pass when text found"
        return 1
    fi
}

# Test: assert_output_contains fails when text not in output
test_assert_output_contains_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a transcript without the expected text
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"Say hello"}
{"type":"message","role":"assistant","content":"Hi there!"}
EOF

    local result
    result=$(assert_output_contains "$transcript_file" "Hello, World!" "output missing greeting" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_output_contains fails when text not found"
        return 0
    else
        echo "  [FAIL] assert_output_contains should fail when text not found"
        return 1
    fi
}

# Test: assert_message_count verifies number of messages in transcript
# Usage: assert_message_count "transcript.jsonl" expected_count "test name"
test_assert_message_count_pass() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a transcript with 3 messages
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"First"}
{"type":"message","role":"assistant","content":"Second"}
{"type":"message","role":"user","content":"Third"}
EOF

    local result
    result=$(assert_message_count "$transcript_file" 3 "message count correct" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -eq 0 ]; then
        echo "  [PASS] assert_message_count passes when count matches"
        return 0
    else
        echo "  [FAIL] assert_message_count should pass when count matches"
        return 1
    fi
}

# Test: assert_message_count fails when count doesn't match
test_assert_message_count_fail() {
    local transcript_file
    transcript_file=$(mktemp)

    # Create a transcript with 2 messages
    cat > "$transcript_file" <<'EOF'
{"type":"message","role":"user","content":"First"}
{"type":"message","role":"assistant","content":"Second"}
EOF

    local result
    result=$(assert_message_count "$transcript_file" 5 "message count wrong" 2>&1)
    local exit_code=$?

    rm -f "$transcript_file"

    if [ $exit_code -ne 0 ]; then
        echo "  [PASS] assert_message_count fails when count doesn't match"
        return 0
    else
        echo "  [FAIL] assert_message_count should fail when count doesn't match"
        return 1
    fi
}

# Run all tests
echo "========================================="
echo "Running transcript-assertions.sh tests"
echo "========================================="
echo ""

failed=0

test_assert_transcript_valid_pass || ((failed++))
test_assert_transcript_valid_fail || ((failed++))
test_assert_tool_called_pass || ((failed++))
test_assert_tool_called_fail || ((failed++))
test_assert_output_contains_pass || ((failed++))
test_assert_output_contains_fail || ((failed++))
test_assert_message_count_pass || ((failed++))
test_assert_message_count_fail || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
