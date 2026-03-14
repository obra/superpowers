#!/usr/bin/env bash
# Deep Codex E2E test that verifies real multi-agent tool usage via JSON events.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORIGINAL_HOME="${HOME:-}"

if ! command -v codex >/dev/null 2>&1; then
    echo "  [SKIP] Codex not installed - skipping multi-agent E2E"
    exit 0
fi

if [ ! -f "$ORIGINAL_HOME/.codex/auth.json" ]; then
    echo "  [SKIP] Codex auth not found at $ORIGINAL_HOME/.codex/auth.json"
    exit 0
fi

source "$SCRIPT_DIR/setup.sh"
source "$SCRIPT_DIR/test-helpers.sh"

trap cleanup_test_env EXIT

json_file="$(mktemp "$TEST_ROOT/codex-multi-agent.XXXXXX.jsonl")"
last_message_file="$(mktemp "$TEST_ROOT/codex-multi-agent-last.XXXXXX.txt")"

prompt=$(cat <<'EOF'
Use the $dispatching-parallel-agents skill.
Spawn explorer to read skills/subagent-driven-development/SKILL.md and extract the role pipeline.
Spawn reviewer to independently confirm whether spec_reviewer comes before quality_reviewer.
Wait for both agents, then answer in exactly two lines:
PIPELINE: <roles in order>
ORDER: <which review happens first>
EOF
)

echo "=== Test: Codex multi-agent E2E ==="
echo ""
echo "Test 1: Real spawn_agent + wait flow..."

run_codex_json "$prompt" "$json_file" "$last_message_file" 180 || {
    echo "  [FAIL] Codex exec --json failed"
    exit 1
}

python3 - "$json_file" "$last_message_file" <<'PY'
from __future__ import annotations

import json
import sys
from pathlib import Path

json_path = Path(sys.argv[1])
last_message_path = Path(sys.argv[2])

events: list[dict] = []
for raw_line in json_path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line.startswith("{"):
        continue
    try:
        events.append(json.loads(line))
    except json.JSONDecodeError:
        continue

spawn_completed = 0
wait_completed = 0
for event in events:
    if event.get("type") != "item.completed":
        continue
    item = event.get("item", {})
    if item.get("type") != "collab_tool_call":
        continue
    if item.get("status") != "completed":
        continue
    tool = item.get("tool")
    if tool == "spawn_agent":
        spawn_completed += 1
    if tool == "wait":
        wait_completed += 1

last_message = last_message_path.read_text(encoding="utf-8").strip()

errors: list[str] = []
if spawn_completed < 2:
    errors.append(f"expected at least 2 completed spawn_agent calls, got {spawn_completed}")
if wait_completed < 2:
    errors.append(f"expected at least 2 completed wait calls, got {wait_completed}")
if "worker -> spec_reviewer -> quality_reviewer -> monitor -> reviewer" not in last_message:
    errors.append("final message did not contain the expected role pipeline")
if (
    "spec_reviewer happens first" not in last_message
    and "spec_reviewer comes before quality_reviewer" not in last_message
):
    errors.append("final message did not confirm the expected review ordering")

if errors:
    for error in errors:
        print(f"  [FAIL] {error}")
    sys.exit(1)

print(f"  [PASS] Observed {spawn_completed} completed spawn_agent calls")
print(f"  [PASS] Observed {wait_completed} completed wait calls")
print("  [PASS] Final message kept the expected two-line answer")
PY

echo ""
echo "=== Codex multi-agent E2E passed ==="
