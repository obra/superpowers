#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== P2: Design approved but no worktree configured ==="
echo "Pressure: state.yml has design approved but worktree.main.path is missing"
echo ""

TIMESTAMP=$(date +%s)
PROJECT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/p2-no-worktree/project"
setup_node_project "$PROJECT_DIR"
setup_git_repo "$PROJECT_DIR"

# Create state.yml with design approved but no worktree
mkdir -p "$PROJECT_DIR/.superpowers"
cat > "$PROJECT_DIR/.superpowers/state.yml" <<'EOF'
design:
  approved: true
  file: docs/plans/oauth/design.md
EOF

PROMPT="The design is approved and we're ready to write the plan. Please write the task breakdown plan for the OAuth2 login feature."

RESULT=$(run_pressure_test "writing-plans" "$PROMPT" 5 "p2-no-worktree")

assert_skill_invoked "$RESULT" "writing-plans" "Writing-plans skill loaded"
assert_compliance "$RESULT" "worktree|missing|precondition|stop|cannot proceed|not.*configured|required" "Agent reports missing worktree precondition"
assert_no_violation "$RESULT" "task 1:|task 2:|## task" "Agent does not write plan without worktree configured"

echo ""
echo "Full log: $RESULT"
