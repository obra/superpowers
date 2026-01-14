#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: manus resume ==="

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

# Session 1: Create manus files (simulating manus-planning start)
cd "$TEST_PROJECT"
mkdir -p docs/manus

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git commit --allow-empty -m "init" --quiet

# Create manus files as if manus-planning was started
cat > "$TEST_PROJECT/docs/manus/task_plan.md" <<'EOF'
# Create docs/note.txt

## Goal
Create a simple file docs/note.txt with the content "ok"

## Current Phase
Phase 1: Initial Setup

## Phases
### Phase 1: Initial Setup
**Status**: in_progress
**Tasks**:
- Create docs directory if needed
- Create note.txt with "ok"

### Phase 2: Verification
**Status**: pending
**Tasks**:
- Verify file exists
- Verify content is correct

### Phase 3-5: Not applicable for simple task
EOF

cat > "$TEST_PROJECT/docs/manus/findings.md" <<'EOF'
# Findings

## Requirements
- Create docs/note.txt with "ok"
EOF

cat > "$TEST_PROJECT/docs/manus/progress.md" <<'EOF'
# Progress

## Session 1
Started planning. Ready for implementation.
EOF

touch "$TEST_PROJECT/docs/manus/.active"

# Verify session 1 setup
assert_file_exists "$TEST_PROJECT/docs/manus/task_plan.md" "task_plan.md created"
assert_file_exists "$TEST_PROJECT/docs/manus/findings.md" "findings.md created"
assert_file_exists "$TEST_PROJECT/docs/manus/progress.md" "progress.md created"
assert_file_exists "$TEST_PROJECT/docs/manus/.active" ".active created"

# Session 2: Claude resumes and completes the task
PROMPT_2="Change to directory $TEST_PROJECT.

You will find manus planning files in docs/manus/. Read them to understand the task.
Complete Phase 1 by creating docs/note.txt with 'ok'.
Then mark the task complete and remove docs/manus/.active marker."

if command -v timeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && timeout 180 claude -p "$PROMPT_2" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out2.txt" 2>&1 || true
elif command -v gtimeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && gtimeout 180 claude -p "$PROMPT_2" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out2.txt" 2>&1 || true
else
    echo "  [SKIP] timeout command not available"
    exit 0
fi

# Verify session 2 results
assert_file_exists "$TEST_PROJECT/docs/note.txt" "task completed"

if [ -f "$TEST_PROJECT/docs/manus/.active" ]; then
  echo "  [FAIL] .active still present after completion"
  exit 1
else
  echo "  [PASS] .active removed after completion"
fi

echo "=== All tests passed ==="
