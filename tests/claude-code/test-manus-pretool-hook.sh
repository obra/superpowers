#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: manus pretool hook ==="

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

# Case 1: No .active -> empty JSON
output=$(cd "$TEST_PROJECT" && "$SCRIPT_DIR/../../hooks/manus-pretool.sh")
assert_valid_json "$output" "Hook outputs valid JSON when inactive"
assert_contains "$output" "{}" "Hook outputs empty JSON when inactive"

# Case 2: .active + task_plan.md -> reminder JSON
mkdir -p "$TEST_PROJECT/docs/manus"
cat > "$TEST_PROJECT/docs/manus/task_plan.md" <<'PLAN'
# Task Plan

## Goal
Test hook output.
PLAN

touch "$TEST_PROJECT/docs/manus/.active"

output_active=$(cd "$TEST_PROJECT" && "$SCRIPT_DIR/../../hooks/manus-pretool.sh")
assert_valid_json "$output_active" "Hook outputs valid JSON when active"
assert_contains "$output_active" "Manus Planning Reminder" "Hook emits reminder content"

echo "=== All tests passed ==="
