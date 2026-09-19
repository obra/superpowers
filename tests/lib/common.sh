#!/usr/bin/env bash
# Shared paths and helpers for superpowers integration tests.

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_ROOT="$(cd "$TESTS_DIR/.." && pwd)"
SHARED_FIXTURES_DIR="$TESTS_DIR/shared"

init_test_run() {
    local suite_name="$1"
    local case_name="$2"

    TIMESTAMP=$(date +%s)
    OUTPUT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/${suite_name}/${case_name}"
    mkdir -p "$OUTPUT_DIR"

    PROJECT_DIR="$OUTPUT_DIR/project"
    mkdir -p "$PROJECT_DIR/docs/superpowers/plans"
    LOG_FILE="$OUTPUT_DIR/claude-output.json"

    export TIMESTAMP OUTPUT_DIR PROJECT_DIR LOG_FILE
}

copy_prompt_for_reference() {
    local prompt_file="$1"
    cp "$prompt_file" "$OUTPUT_DIR/prompt.txt"
}

create_auth_system_plan() {
    local project_dir="${1:-$PROJECT_DIR}"

    cat > "$project_dir/docs/superpowers/plans/auth-system.md" << 'EOF'
# Auth System Implementation Plan

## Task 1: Add User Model
Create user model with email and password fields.

## Task 2: Add Auth Routes
Create login and register endpoints.

## Task 3: Add JWT Middleware
Protect routes with JWT validation.

## Task 4: Write Tests
Add comprehensive test coverage.
EOF
}

create_auth_system_plan_short() {
    local project_dir="${1:-$PROJECT_DIR}"

    cat > "$project_dir/docs/superpowers/plans/auth-system.md" << 'EOF'
# Auth System Implementation Plan

## Task 1: Add User Model
Create user model with email and password fields.

## Task 2: Add Auth Routes
Create login and register endpoints.

## Task 3: Add JWT Middleware
Protect routes with JWT validation.
EOF
}
