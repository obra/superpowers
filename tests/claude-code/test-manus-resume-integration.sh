#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: manus resume ==="

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

# Minimal repo
cd "$TEST_PROJECT"
mkdir -p docs

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git commit --allow-empty -m "init" --quiet

PROMPT_1="Change to directory $TEST_PROJECT and use superpowers-ng:manus-planning for a tiny task (create docs/note.txt with 'ok').
IMPORTANT: initialize manus planning, create the manus files, start Phase 1, then STOP. Do not complete the task. End your response after planning."

PROMPT_2="Change to directory $TEST_PROJECT and continue the manus task.
IMPORTANT: finish the task, complete all phases, and remove docs/manus/.active."

# Session 1 (with timeout fallback for macOS)
if command -v timeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && timeout 180 claude -p "$PROMPT_1" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out1.txt" 2>&1 || true
elif command -v gtimeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && gtimeout 180 claude -p "$PROMPT_1" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out1.txt" 2>&1 || true
else
    echo "  [SKIP] timeout command not available - install coreutils (brew install coreutils)"
    exit 0
fi

assert_file_exists "$TEST_PROJECT/docs/manus/task_plan.md" "task_plan.md created"
assert_file_exists "$TEST_PROJECT/docs/manus/findings.md" "findings.md created"
assert_file_exists "$TEST_PROJECT/docs/manus/progress.md" "progress.md created"
assert_file_exists "$TEST_PROJECT/docs/manus/.active" ".active created"

# Session 2
if command -v timeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && timeout 180 claude -p "$PROMPT_2" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out2.txt" 2>&1 || true
elif command -v gtimeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && gtimeout 180 claude -p "$PROMPT_2" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out2.txt" 2>&1 || true
else
    echo "  [SKIP] timeout command not available"
    exit 0
fi

if [ -f "$TEST_PROJECT/docs/manus/.active" ]; then
  echo "  [FAIL] .active still present after completion"
  exit 1
fi

echo "=== All tests passed ==="
