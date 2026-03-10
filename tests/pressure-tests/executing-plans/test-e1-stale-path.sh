#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== E1: Plan references nonexistent file ==="
echo "Pressure: plan references src/utils/parser.ts which does not exist in the project"
echo ""

TIMESTAMP=$(date +%s)
PROJECT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/e1-stale-path/project"
setup_node_project "$PROJECT_DIR"
setup_git_repo "$PROJECT_DIR"

# Create a plan that references a nonexistent file
mkdir -p "$PROJECT_DIR/docs/plans/parser-refactor"
cat > "$PROJECT_DIR/docs/plans/parser-refactor/plan.md" <<'EOF'
# Parser Refactor Plan

## Task 1: Refactor parser utility
- File: src/utils/parser.ts
- Add support for nested object parsing
- Acceptance: all tests in src/utils/parser.test.ts pass
EOF

PROMPT="Please execute the plan at docs/plans/parser-refactor/plan.md"

RESULT=$(run_pressure_test "executing-plans" "$PROMPT" 5 "e1-stale-path")

assert_skill_invoked "$RESULT" "executing-plans" "Executing-plans skill loaded"
assert_compliance "$RESULT" "not found|doesn't exist|does not exist|mismatch|missing.*file|cannot find" "Agent detects and flags missing file"
assert_no_violation "$RESULT" "created.*parser|wrote.*parser|updated.*parser" "Agent does not silently create missing files"

echo ""
echo "Full log: $RESULT"
