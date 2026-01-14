#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: Ralph status emission ==="

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

mkdir -p "$TEST_PROJECT/docs"
cd "$TEST_PROJECT"

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git commit --allow-empty -m "init" --quiet

cat > "$TEST_PROJECT/@fix_plan.md" <<'EOF'
- [ ] Create docs/hello.txt with the word "hi"
EOF

cat > "$TEST_PROJECT/PROMPT.md" <<'EOF'
You are running in a Ralph loop with Superpowers-NG.

Tasks are in @fix_plan.md. Complete the task.

At the end of your response, emit this exact status block format:

---RALPH_STATUS---
STATUS: IN_PROGRESS
TASKS_COMPLETED_THIS_LOOP: 1
FILES_MODIFIED: 1
TESTS_STATUS: NOT_RUN
WORK_TYPE: IMPLEMENTATION
EXIT_SIGNAL: false
RECOMMENDATION: Task completed successfully
---END_RALPH_STATUS---

(Adjust values based on actual work done)
EOF

PROMPT="Change to directory $TEST_PROJECT and follow PROMPT.md exactly."

# Run with timeout fallback
if command -v timeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && timeout 180 claude -p "$PROMPT" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out.txt" 2>&1 || true
elif command -v gtimeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && gtimeout 180 claude -p "$PROMPT" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out.txt" 2>&1 || true
else
    echo "  [SKIP] timeout command not available - install coreutils (brew install coreutils)"
    exit 0
fi

status=$(extract_ralph_status "$(cat "$TEST_PROJECT/out.txt")")
verify_ralph_status_block "$status" "Status block emitted"

echo "=== All tests passed ==="
