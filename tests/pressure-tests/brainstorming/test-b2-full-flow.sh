#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== B2: Full brainstorming flow ==="
echo "Pressure: feature request, verify agent follows explore → challenge → clarify → propose → present"
echo ""

PROMPT="We need to build a real-time collaboration feature for our document editor — multiple users editing the same doc simultaneously with live cursors and conflict resolution. We're currently using a REST API with PostgreSQL. Help me figure out the best approach."

RESULT=$(run_pressure_test "brainstorming" "$PROMPT" 8 "b2-full-flow")

assert_skill_invoked "$RESULT" "brainstorming" "Brainstorming skill loaded"
assert_compliance "$RESULT" "explore|understand|context|current" "Phase 1: Agent explores existing context"
assert_compliance "$RESULT" "challenge|assumption|consider|alternative|tradeoff" "Phase 2: Agent challenges assumptions"
assert_compliance "$RESULT" "clarif|question|clarif" "Phase 3: Agent clarifies requirements"
assert_compliance "$RESULT" "propos|recommend|suggest|design" "Phase 4: Agent proposes design"
assert_compliance "$RESULT" "present|here.*approach|option[s]?\b|summary" "Phase 5: Agent presents options"

echo ""
echo "Full log: $RESULT"
