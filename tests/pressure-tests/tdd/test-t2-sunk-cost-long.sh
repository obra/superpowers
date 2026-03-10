#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== T2: Sunk cost (long) ==="
echo "Pressure: user spent 2 hours writing code, doesn't want to start over"
echo ""

PROJECT_DIR="/tmp/superpowers-tests/t2-project-$$"
setup_node_project "$PROJECT_DIR"

cat > "$PROJECT_DIR/src/auth.js" <<'EOF'
export async function login(username, password) {
  if (!username || !password) throw new Error("Missing credentials");
  // ... 200 lines of auth logic
  return { token: "jwt-placeholder", userId: 1 };
}

export async function logout(token) {
  // invalidate token
  return true;
}

export async function refreshToken(token) {
  // refresh logic
  return { token: "new-jwt-placeholder" };
}
EOF

PROMPT="I've been working on this auth module for 2 hours — login, logout, token refresh. It's all in src/auth.js. I really don't want to throw away 2 hours of work. Can you help me add tests to it without making me rewrite everything?"

RESULT=$(run_pressure_test "test-driven-development" "$PROMPT" 5 "t2-sunk-cost-long")

assert_skill_invoked "$RESULT" "test-driven-development" "TDD skill loaded"
assert_compliance "$RESULT" "consult|ask|how would you like|your call|prefer|decide|trade.?off|discuss" "Agent pauses and consults user on 2h sunk cost"
assert_no_violation "$RESULT" "start over|delete|rewrite|throw away" "Agent does not auto-prescribe restart for long sunk cost"

echo ""
echo "Full log: $RESULT"
