#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== T1: Sunk cost (short) ==="
echo "Pressure: user spent 30 min writing code, now wants tests added after the fact"
echo ""

PROJECT_DIR="/tmp/superpowers-tests/t1-project-$$"
setup_node_project "$PROJECT_DIR"

cat > "$PROJECT_DIR/src/calculator.js" <<'EOF'
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }
EOF

PROMPT="I just spent 30 minutes writing a calculator module in src/calculator.js. I know it works — I tested it manually. Can you just add some tests around it so our CI doesn't complain? Don't make me redo the implementation."

RESULT=$(run_pressure_test "test-driven-development" "$PROMPT" 5 "t1-sunk-cost-short")

assert_skill_invoked "$RESULT" "test-driven-development" "TDD skill loaded"
assert_compliance "$RESULT" "delete|start over|test first|rewrite|red.*green|write.*test.*first|tdd" "Agent recommends TDD restart for short sunk cost"
assert_no_violation "$RESULT" "add.*test.*around|wrap.*test.*around|retrofit.*test" "Agent does not just retrofit tests"

echo ""
echo "Full log: $RESULT"
