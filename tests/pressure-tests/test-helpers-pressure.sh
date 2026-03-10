#!/usr/bin/env bash
# Pressure test helpers for Superpowers skill testing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../claude-code/test-helpers.sh"

# Run a pressure test scenario against a skill
# Usage: run_pressure_test <skill-name> <prompt> <max-turns> <test-name>
# Returns: path to the JSONL session file
run_pressure_test() {
    local skill_name="$1"
    local prompt="$2"
    local max_turns="${3:-5}"
    local test_name="${4:-test}"

    local timestamp=$(date +%s)
    local output_dir="/tmp/superpowers-tests/${timestamp}/pressure-tests/${skill_name}/${test_name}"
    mkdir -p "$output_dir"

    local log_file="$output_dir/claude-output.json"
    local plugin_dir="$(cd "$SCRIPT_DIR/../.." && pwd)"

    # Create a minimal project directory for the test
    local project_dir="$output_dir/project"
    mkdir -p "$project_dir"

    cd "$project_dir"

    timeout 600 claude -p "$prompt" \
        --plugin-dir "$plugin_dir" \
        --dangerously-skip-permissions \
        --max-turns "$max_turns" \
        --output-format stream-json \
        > "$log_file" 2>&1 || true

    echo "$log_file"
}

# Assert that Claude's response contains a compliance marker
# Searches assistant message content in the JSONL transcript
# Usage: assert_compliance <jsonl-file> <pattern> <test-name>
assert_compliance() {
    local jsonl_file="$1"
    local pattern="$2"
    local test_name="${3:-compliance check}"

    # Extract assistant message text content from JSONL
    if grep '"type":"assistant"' "$jsonl_file" | grep -qiE "$pattern"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected compliance marker: $pattern"
        return 1
    fi
}

# Assert that Claude did NOT exhibit a forbidden behavior
# Usage: assert_no_violation <jsonl-file> <pattern> <test-name>
assert_no_violation() {
    local jsonl_file="$1"
    local pattern="$2"
    local test_name="${3:-violation check}"

    if grep '"type":"assistant"' "$jsonl_file" | grep -qiE "$pattern"; then
        echo "  [FAIL] $test_name"
        echo "  Found forbidden pattern: $pattern"
        return 1
    else
        echo "  [PASS] $test_name"
        return 0
    fi
}

# Check if a specific tool was invoked in the session
# Usage: assert_tool_used <jsonl-file> <tool-name> <test-name>
assert_tool_used() {
    local jsonl_file="$1"
    local tool_name="$2"
    local test_name="${3:-tool used check}"

    if grep -qE '"name":"'"$tool_name"'"' "$jsonl_file"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected tool to be invoked: $tool_name"
        return 1
    fi
}

# Check if a specific tool was NOT invoked
# Usage: assert_tool_not_used <jsonl-file> <tool-name> <test-name>
assert_tool_not_used() {
    local jsonl_file="$1"
    local tool_name="$2"
    local test_name="${3:-tool not used check}"

    if grep -qE '"name":"'"$tool_name"'"' "$jsonl_file"; then
        echo "  [FAIL] $test_name"
        echo "  Expected tool NOT to be invoked: $tool_name"
        return 1
    else
        echo "  [PASS] $test_name"
        return 0
    fi
}

# Check that a skill was invoked
# Usage: assert_skill_invoked <jsonl-file> <skill-name> <test-name>
assert_skill_invoked() {
    local jsonl_file="$1"
    local skill_name="$2"
    local test_name="${3:-skill invoked check}"

    local skill_pattern='"skill":"([^"]*:)?'"${skill_name}"'"'
    if grep '"name":"Skill"' "$jsonl_file" | grep -qE "$skill_pattern"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected skill to be invoked: $skill_name"
        echo "  Skills found: $(grep -o '"skill":"[^"]*"' "$jsonl_file" 2>/dev/null | sort -u || echo '(none)')"
        return 1
    fi
}

# Set up a minimal Node.js project for testing
# Usage: setup_node_project <dir>
setup_node_project() {
    local dir="$1"
    mkdir -p "$dir/src"

    cat > "$dir/package.json" <<'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF

    cat > "$dir/src/index.js" <<'EOF'
export function hello() {
  return "Hello, World!";
}
EOF
}

# Set up a minimal git repo in a directory
# Usage: setup_git_repo <dir>
setup_git_repo() {
    local dir="$1"
    git -C "$dir" init -q
    git -C "$dir" config user.email "test@example.com"
    git -C "$dir" config user.name "Test User"
    git -C "$dir" commit --allow-empty -m "Initial commit" -q
}

export -f run_pressure_test
export -f assert_compliance
export -f assert_no_violation
export -f assert_tool_used
export -f assert_tool_not_used
export -f assert_skill_invoked
export -f setup_node_project
export -f setup_git_repo
