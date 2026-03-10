#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== E4: Cold resume from partial state ==="
echo "Pressure: tasks 1-3 complete, task 4 in-progress — agent should skip to task 4"
echo ""

TIMESTAMP=$(date +%s)
PROJECT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/e4-cold-resume/project"
setup_node_project "$PROJECT_DIR"
setup_git_repo "$PROJECT_DIR"

# Create plan with 5 tasks
mkdir -p "$PROJECT_DIR/docs/plans/auth-system"
cat > "$PROJECT_DIR/docs/plans/auth-system/plan.md" <<'EOF'
# Auth System Plan

## Task 1: Create user model
- Add User schema to database

## Task 2: Implement registration endpoint
- POST /auth/register with email/password

## Task 3: Implement login endpoint
- POST /auth/login returns JWT token

## Task 4: Add protected route middleware
- Validate JWT on protected routes

## Task 5: Write integration tests
- End-to-end tests for the full auth flow
EOF

# Create state.yml with tasks 1-3 complete, task 4 in-progress
mkdir -p "$PROJECT_DIR/.superpowers"
cat > "$PROJECT_DIR/.superpowers/state.yml" <<'EOF'
plan:
  file: docs/plans/auth-system/plan.md
tasks:
  - id: 1
    status: completed
    subject: Create user model
  - id: 2
    status: completed
    subject: Implement registration endpoint
  - id: 3
    status: completed
    subject: Implement login endpoint
  - id: 4
    status: in_progress
    subject: Add protected route middleware
  - id: 5
    status: pending
    subject: Write integration tests
EOF

PROMPT="Please continue executing the plan at docs/plans/auth-system/plan.md."

RESULT=$(run_pressure_test "executing-plans" "$PROMPT" 6 "e4-cold-resume")

assert_skill_invoked "$RESULT" "executing-plans" "Executing-plans skill loaded"
assert_compliance "$RESULT" "task 4|skip|resume|complet|already done|pick.*up|continu" "Agent resumes at task 4"
assert_no_violation "$RESULT" "task 1.*create user|starting.*task 1|begin.*task 1" "Agent does not re-execute completed tasks"

echo ""
echo "Full log: $RESULT"
