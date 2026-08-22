#!/usr/bin/env bash
# Registration-shape tests for the Amazon Q Developer CLI integration.
#
# Validates, without a live `q` install:
#   1. The checked-in custom agent manifest parses and wires agentSpawn to
#      hooks/session-start with AMAZON_Q_AGENT=1.
#   2. hooks/session-start emits PLAIN TEXT under AMAZON_Q_AGENT=1
#      (Q injects raw stdout; a JSON envelope would be injected literally)
#      while every other platform still gets its JSON envelope.
#   3. The Platform Adaptation list and reference file agree.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES+1)); }
FAILURES=0

echo "Amazon Q CLI integration tests"

# 1. Custom agent manifest shape
if node -e '
const fs = require("fs");
const agent = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
if (agent.name !== "superpowers") {
  console.error(`agent name is ${JSON.stringify(agent.name)}, expected "superpowers"`);
  process.exit(1);
}
const spawn = agent.hooks && agent.hooks.agentSpawn && agent.hooks.agentSpawn[0];
if (!spawn) {
  console.error("missing hooks.agentSpawn[0]");
  process.exit(1);
}
if (!/AMAZON_Q_AGENT=1/.test(spawn.command)) {
  console.error("agentSpawn command must set AMAZON_Q_AGENT=1: " + spawn.command);
  process.exit(1);
}
if (!/hooks\/session-start/.test(spawn.command)) {
  console.error("agentSpawn command must run hooks/session-start: " + spawn.command);
  process.exit(1);
}
' "$REPO_ROOT/.amazonq/cli-agents/superpowers.json"; then
    pass "custom agent manifest wires agentSpawn to session-start"
else
    fail "custom agent manifest wires agentSpawn to session-start"
fi

# 2a. Plain-text output under AMAZON_Q_AGENT=1 (must NOT be a JSON envelope)
out="$(cd "$REPO_ROOT" && AMAZON_Q_AGENT=1 CLAUDE_PLUGIN_ROOT="$REPO_ROOT" bash hooks/session-start)"
if printf '%s' "$out" | node -e '
let raw = "";
process.stdin.on("data", c => raw += c);
process.stdin.on("end", () => {
  try { JSON.parse(raw); process.exit(1); }   // JSON = wrong for Q
  catch { process.exit(0); }                   // not JSON = plain text, correct
});
'; then
    pass "session-start emits plain text under AMAZON_Q_AGENT=1"
else
    fail "session-start emits plain text under AMAZON_Q_AGENT=1"
fi

# 2b. Plain-text output actually contains the bootstrap marker
if printf '%s' "$out" | grep -q "You have superpowers"; then
    pass "plain-text output contains the bootstrap block"
else
    fail "plain-text output contains the bootstrap block"
fi

# 2c. Existing platforms keep their JSON envelopes
if (cd "$REPO_ROOT" && CLAUDE_PLUGIN_ROOT="$REPO_ROOT" bash hooks/session-start \
    | WANT=claude node "$SCRIPT_DIR/check-envelope.js"); then
    pass "Claude Code path unchanged (hookSpecificOutput envelope)"
else
    fail "Claude Code path unchanged (hookSpecificOutput envelope)"
fi

if (cd "$REPO_ROOT" && CURSOR_PLUGIN_ROOT="$REPO_ROOT" bash hooks/session-start \
    | WANT=cursor node "$SCRIPT_DIR/check-envelope.js"); then
    pass "Cursor path unchanged (additional_context envelope)"
else
    fail "Cursor path unchanged (additional_context envelope)"
fi

# 3. Reference file registered in Platform Adaptation
if grep -q 'references/amazon-q-tools.md' \
    "$REPO_ROOT/skills/using-superpowers/SKILL.md" && \
   [ -f "$REPO_ROOT/skills/using-superpowers/references/amazon-q-tools.md" ]; then
    pass "amazon-q-tools.md exists and is listed in Platform Adaptation"
else
    fail "amazon-q-tools.md exists and is listed in Platform Adaptation"
fi

if [ "$FAILURES" -eq 0 ]; then
    echo "STATUS: PASSED"
    exit 0
else
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi
