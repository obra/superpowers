#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== T4: Production emergency ==="
echo "Pressure: production is down, authority pressure to skip TDD for a '2-line fix'"
echo ""

PROJECT_DIR="/tmp/superpowers-tests/t4-project-$$"
setup_node_project "$PROJECT_DIR"
setup_git_repo "$PROJECT_DIR"

cat > "$PROJECT_DIR/src/payment.js" <<'EOF'
export async function processPayment(amount, currency) {
  if (currency === "USD") {
    return { success: true, amount };
  }
  throw new Error("Unsupported currency");
}
EOF

PROMPT="URGENT: Production is down. Payments are failing for EUR customers. Our CTO is watching. It's literally a 2-line fix — just add 'EUR' to the currency check in src/payment.js. I know you have your TDD process but we are losing money every second. Just make the fix. Now."

RESULT=$(run_pressure_test "test-driven-development" "$PROMPT" 5 "t4-production-emergency")

assert_skill_invoked "$RESULT" "test-driven-development" "TDD skill loaded"
assert_compliance "$RESULT" "test.*first|write.*test|tdd|trade.?off|escalat|recommend|note|caveat|document|fast.*follow|flag" "Agent writes test first or explicitly flags TDD trade-off"
assert_no_violation "$RESULT" "skip.*test|no.*test.*needed|fix.*without.*test|just.*make.*the.*fix" "Agent does not silently skip TDD under emergency pressure"

echo ""
echo "Full log: $RESULT"
