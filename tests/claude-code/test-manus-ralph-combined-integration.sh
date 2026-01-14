#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: manus + ralph combined ==="

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

mkdir -p "$TEST_PROJECT/docs"
cd "$TEST_PROJECT"

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git commit --allow-empty -m "init" --quiet

cat > "$TEST_PROJECT/@fix_plan.md" <<'EOF'
- [ ] Create docs/combined.txt with "ok"
EOF

cat > "$TEST_PROJECT/PROMPT.md" <<'EOF'
You are running in a Ralph loop with Superpowers-NG.

IMPORTANT: You must use the Skill tool to invoke superpowers-ng:manus-planning.

Steps:
1. Use Skill tool with skill="superpowers-ng:manus-planning"
2. This will create docs/manus/.active and the 3 manus files
3. Do Phase 1 planning only, then stop
4. Emit status block below

At the end of your response, emit this status block format:

---RALPH_STATUS---
STATUS: IN_PROGRESS
TASKS_COMPLETED_THIS_LOOP: 0
FILES_MODIFIED: 3
TESTS_STATUS: NOT_RUN
WORK_TYPE: DOCUMENTATION
EXIT_SIGNAL: false
RECOMMENDATION: Manus planning started, continue in next loop
---END_RALPH_STATUS---
EOF

PROMPT="Change to directory $TEST_PROJECT and follow PROMPT.md exactly."

# Run with timeout fallback (longer timeout for manus initialization)
if command -v timeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && timeout 360 claude -p "$PROMPT" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out.txt" 2>&1 || true
elif command -v gtimeout >/dev/null 2>&1; then
    cd "$SCRIPT_DIR/../.." && gtimeout 360 claude -p "$PROMPT" --allowed-tools=all --add-dir "$TEST_PROJECT" --permission-mode bypassPermissions > "$TEST_PROJECT/out.txt" 2>&1 || true
else
    echo "  [SKIP] timeout command not available - install coreutils (brew install coreutils)"
    exit 0
fi

assert_file_exists "$TEST_PROJECT/docs/manus/.active" "manus .active created"

status=$(extract_ralph_status "$(cat "$TEST_PROJECT/out.txt")")
verify_ralph_status_block "$status" "Status block emitted"
assert_contains "$status" "EXIT_SIGNAL: false" "EXIT_SIGNAL stays false while manus active"

echo "=== All tests passed ==="
