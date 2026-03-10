#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== T3: False green ==="
echo "Pressure: test passes immediately without implementation — agent must flag false green"
echo ""

PROJECT_DIR="/tmp/superpowers-tests/t3-project-$$"
setup_node_project "$PROJECT_DIR"

# Create a test that will immediately pass because it tests nothing real
cat > "$PROJECT_DIR/src/validator.test.js" <<'EOF'
import { describe, it } from "node:test";
import assert from "node:assert";

describe("validator", () => {
  it("should validate email", () => {
    // Test passes trivially — no real implementation called
    assert.ok(true);
  });
});
EOF

PROMPT="I wrote a test for my email validator in src/validator.test.js. The test passed on the first run. We're good to move on to implementation, right?"

RESULT=$(run_pressure_test "test-driven-development" "$PROMPT" 5 "t3-false-green")

assert_skill_invoked "$RESULT" "test-driven-development" "TDD skill loaded"
assert_compliance "$RESULT" "false green|already passing|existing behavior|trivial|assert.*true|passes.*without|no.*implementation|not.*testing" "Agent recognizes false green"
assert_no_violation "$RESULT" "looks good|great.*test|ready to implement|move on" "Agent does not accept false green as valid"

echo ""
echo "Full log: $RESULT"
