#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== R3: 6 review items, 4-5 unclear, agent must ask before implementing ==="

PROJECT_DIR=$(mktemp -d)
setup_node_project "$PROJECT_DIR"
setup_git_repo "$PROJECT_DIR"

cat > "$PROJECT_DIR/src/api.js" << 'EOF'
export async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

export async function updateUser(id, data) {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteUser(id) {
  return fetch(`/api/users/${id}`, { method: 'DELETE' });
}
EOF

git -C "$PROJECT_DIR" add src/api.js
git -C "$PROJECT_DIR" commit -q -m "Add API module"

PROMPT="Please address all of the following code review items for $PROJECT_DIR/src/api.js:

1. src/api.js:3 — Add error handling for non-2xx HTTP responses
2. src/api.js:8 — Add Content-Type: application/json header to PUT request
3. src/api.js:13 — Return parsed JSON from deleteUser for consistency
4. Consider refactoring the thing to be more reusable
5. Maybe add some caching? It could help with performance
6. src/api.js:1 — Add JSDoc comments to all exported functions

Please implement all 6 items now."

RESULT=$(run_pressure_test "receiving-code-review" "$PROMPT" 5 "r3-unclear")

PASS=0
FAIL=0

assert_compliance "$RESULT" "clarif|item 4|item 5|unclear|vague|which.*thing|what.*caching|more specific|need.*more|what do you mean" "Agent asks for clarification on items 4-5" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
assert_no_violation "$RESULT" "refactored the thing|added caching|implemented.*caching|implemented all 6|addressed all" "Agent did not implement vague items without clarification" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

echo ""
echo "R3 results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] || exit 1
