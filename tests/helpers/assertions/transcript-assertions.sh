#!/usr/bin/env bash
# Transcript assertions for Horspowers test suite
# Provides functions to verify complete session transcripts in JSONL format

# Assert a transcript file has valid JSONL format
# Usage: assert_transcript_valid "transcript.jsonl" "test name"
assert_transcript_valid() {
    local transcript_file="$1"
    local test_name="${2:-assertion}"

    # Check if file exists
    if [ ! -f "$transcript_file" ]; then
        echo "  [FAIL] $test_name"
        echo "  Transcript file not found: $transcript_file"
        return 1
    fi

    # Check if file is empty
    if [ ! -s "$transcript_file" ]; then
        echo "  [FAIL] $test_name"
        echo "  Transcript file is empty"
        return 1
    fi

    # Validate each line is valid JSON
    local line_number=0
    while IFS= read -r line; do
        ((line_number++))
        # Skip empty lines
        [ -z "$line" ] && continue

        # Try to parse JSON using python or jq if available
        if command -v python3 &> /dev/null; then
            if ! python3 -c "import json; json.loads('''$line''')" 2>/dev/null; then
                echo "  [FAIL] $test_name"
                echo "  Invalid JSON at line $line_number"
                return 1
            fi
        elif command -v jq &> /dev/null; then
            if ! echo "$line" | jq . > /dev/null 2>&1; then
                echo "  [FAIL] $test_name"
                echo "  Invalid JSON at line $line_number"
                return 1
            fi
        else
            # Fallback: basic JSON syntax check (not comprehensive)
            if ! [[ "$line" =~ ^\{.*\}$ ]]; then
                echo "  [FAIL] $test_name"
                echo "  Invalid JSON format at line $line_number (no JSON parser available)"
                return 1
            fi
        fi
    done < "$transcript_file"

    echo "  [PASS] $test_name"
    return 0
}

# Assert a tool was called in the transcript
# Usage: assert_tool_called "transcript.jsonl" "tool-name" "test name"
assert_tool_called() {
    local transcript_file="$1"
    local tool_name="$2"
    local test_name="${3:-assertion}"

    # Search for tool invocation in JSONL
    # Format: {"type":"tool","tool_use":{"tool_name":"ToolName",...}}
    if grep -q "\"tool_name\":\"$tool_name\"" "$transcript_file"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Tool '$tool_name' not found in transcript"
        return 1
    fi
}

# Assert assistant output contains specific text
# Usage: assert_output_contains "transcript.jsonl" "expected text" "test name"
assert_output_contains() {
    local transcript_file="$1"
    local expected_text="$2"
    local test_name="${3:-assertion}"

    # Extract assistant messages and check for content
    # Format: {"type":"message","role":"assistant","content":"..."}
    local found=0

    while IFS= read -r line; do
        # Check if line is an assistant message
        if [[ "$line" == *"\"role\":\"assistant\""* ]]; then
            # Extract content field and check if it contains expected text
            # Use bash string matching for reliability
            if [[ "$line" == *"$expected_text"* ]]; then
                found=1
                break
            fi
        fi
    done < "$transcript_file"

    if [ $found -eq 1 ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected text not found in assistant output: $expected_text"
        return 1
    fi
}

# Assert the transcript has a specific number of messages
# Usage: assert_message_count "transcript.jsonl" expected_count "test name"
assert_message_count() {
    local transcript_file="$1"
    local expected_count="$2"
    local test_name="${3:-assertion}"

    # Count message entries (both user and assistant)
    # Format: {"type":"message",...}
    local actual_count
    actual_count=$(grep -c "\"type\":\"message\"" "$transcript_file" || echo "0")

    if [ "$actual_count" -eq "$expected_count" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected $expected_count messages, found $actual_count"
        return 1
    fi
}
