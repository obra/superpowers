#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: manus + ralph combined ==="

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

mkdir -p "$TEST_PROJECT"
cat > "$TEST_PROJECT/@fix_plan.md" <<'EOF'
- [ ] Create docs/combined.txt with "ok"
EOF

cat > "$TEST_PROJECT/PROMPT.md" <<'EOF'
You are running in a Ralph loop with Superpowers-NG.

If docs/manus/.active is missing, start manus-planning and create the manus files.
Do NOT complete the task in this loop; stop after Phase 1 planning.

Emit the required Ralph status block at the end.
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

assert_file_exists "$TEST_PROJECT/docs/manus/.active" "manus .active created"

status=$(extract_ralph_status "$(cat "$TEST_PROJECT/out.txt")")
verify_ralph_status_block "$status" "Status block emitted"
assert_contains "$status" "EXIT_SIGNAL: false" "EXIT_SIGNAL stays false while manus active"

echo "=== All tests passed ==="
