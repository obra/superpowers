#!/usr/bin/env bash
# Integration Test Helpers
# Helper functions for running full workflow tests

set -euo pipefail

# Create a temporary test project
create_test_project() {
    local test_name="${1:-integration-test-$(date +%s)}"
    local base_dir="${TMPDIR:-/tmp}/horspowers-tests"
    local test_dir="$base_dir/$test_name"

    # Clean up any existing test directory
    rm -rf "$test_dir"

    # Create directory structure
    mkdir -p "$test_dir"

    echo "$test_dir"
}

# Cleanup test project
cleanup_test_project() {
    local test_dir="$1"
    if [ -d "$test_dir" ]; then
        rm -rf "$test_dir"
        echo "  [CLEANUP] Removed test directory: $test_dir"
    fi
}

# Initialize git repository in test project
init_git_repo() {
    local project_dir="$1"
    cd "$project_dir"

    git init > /dev/null 2>&1
    git config user.name "Test User"
    git config user.email "test@example.com"

    # Create initial commit
    echo "# Test Project" > README.md
    git add README.md
    git commit -m "Initial commit" > /dev/null 2>&1

    cd - > /dev/null
}

# Run Claude in test project directory
run_claude_in_project() {
    local project_dir="$1"
    local prompt="$2"
    local timeout="${3:-120}"
    local output_file=$(mktemp)

    (
        cd "$project_dir"
        claude -p "$prompt" --permission-mode bypassPermissions > "$output_file" 2>&1
    )

    local exit_code=$?
    local output=$(cat "$output_file")
    rm -f "$output_file"

    if [ $exit_code -eq 0 ]; then
        echo "$output"
        return 0
    else
        echo "  [ERROR] Command failed with exit code: $exit_code" >&2
        echo "$output"
        return $exit_code
    fi
}

# Check if file exists in project
file_exists() {
    local project_dir="$1"
    local file_path="$2"
    [ -f "$project_dir/$file_path" ]
}

# Check if directory exists in project
dir_exists() {
    local project_dir="$1"
    local dir_path="$2"
    [ -d "$project_dir/$dir_path" ]
}

# Count files in directory matching pattern
count_files() {
    local project_dir="$1"
    local pattern="$2"
    local dir="${3:-.}"

    find "$project_dir/$dir" -name "$pattern" 2>/dev/null | wc -l
}

# Read file content
read_file() {
    local project_dir="$1"
    local file_path="$2"
    cat "$project_dir/$file_path"
}

# Search for content in files
search_in_project() {
    local project_dir="$1"
    local pattern="$2"
    local file_pattern="${3:-*.md}"

    grep -r "$pattern" "$project_dir" --include="$file_pattern" 2>/dev/null || true
}

# Check if skill was invoked in transcript
check_skill_invoked() {
    local transcript="$1"
    local skill_name="$2"

    echo "$transcript" | grep -q "Skill tool was called" && \
    echo "$transcript" | grep -q "skill.*$skill_name"
}

# Extract skill params from transcript
extract_skill_param() {
    local transcript="$1"
    local param_name="$2"

    echo "$transcript" | grep -oP "(?<=Param $param_name: ).*?(?=\\n|$)" | head -1
}

# Export functions
export -f create_test_project
export -f cleanup_test_project
export -f init_git_repo
export -f run_claude_in_project
export -f file_exists
export -f dir_exists
export -f count_files
export -f read_file
export -f search_in_project
export -f check_skill_invoked
export -f extract_skill_param
