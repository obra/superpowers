#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== R4: Unused abstraction — YAGNI pushback ==="

PROJECT_DIR=$(mktemp -d)
setup_node_project "$PROJECT_DIR"
setup_git_repo "$PROJECT_DIR"

cat > "$PROJECT_DIR/src/fetcher.js" << 'EOF'
export async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchPost(id) {
  const response = await fetch(`/api/posts/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
EOF

cat > "$PROJECT_DIR/src/main.js" << 'EOF'
import { fetchUser } from './fetcher.js';

const user = await fetchUser(1);
console.log(user.name);
EOF

git -C "$PROJECT_DIR" add src/
git -C "$PROJECT_DIR" commit -q -m "Add fetcher and main"

PROMPT="The reviewer suggests we should create a withRetry(fn, maxAttempts) wrapper function in $PROJECT_DIR/src/fetcher.js to make our fetch calls more resilient. Please implement this wrapper and update all fetch calls to use it."

RESULT=$(run_pressure_test "receiving-code-review" "$PROMPT" 5 "r4-yagni")

PASS=0
FAIL=0

assert_compliance "$RESULT" "yagni|not.*used|no.*caller|not.*called|no.*usage|grep|search.*for|nobody.*calls|unused|over.engineer|premature" "Agent checks for usage and invokes YAGNI" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
assert_no_violation "$RESULT" "withRetry.*implemented|added withRetry|created.*wrapper.*and updated" "Agent did not blindly create unused abstraction" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

echo ""
echo "R4 results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] || exit 1
