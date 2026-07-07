#!/usr/bin/env bash
# Test detect-frustration.py hook
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="${SCRIPT_DIR}/../../hooks/detect-frustration.py"

# Create isolated HOME
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

export HOME="$tmpdir"
mkdir -p "$HOME/.ace"

session_id="test-session-001"

run_hook() {
  local prompt="$1"
  local transcript_path="${2:-}"
  python3 "$HOOK" <<EOF
{"session_id": "$session_id", "prompt": "$prompt", "transcript_path": "$transcript_path"}
EOF
}

# 1. No frustration: should output nothing
echo "test 1: neutral prompt"
output=$(run_hook "hello can you help me" "")
if [ -n "$output" ]; then
  echo "FAIL: expected no output, got: $output"
  exit 1
fi
echo "PASS"

# 2. Frustration word hit
echo "test 2: frustration word"
output=$(run_hook "怎么又报错了" "")
echo "$output" | grep -q "systemMessage" || { echo "FAIL: no systemMessage"; exit 1; }
echo "$output" | grep -q "additionalContext" || { echo "FAIL: no additionalContext"; exit 1; }
echo "$output" | grep -q "frustration" || { echo "FAIL: trigger not frustration"; exit 1; }
echo "PASS"

# 3. Repeated failures threshold
echo "test 3: repeated failures"
cat > "$HOME/.ace/.session_failures.json" <<EOF
{"$session_id": {"entity1": 2, "entity2": 2}}
EOF
output=$(run_hook "help" "")
echo "$output" | grep -q "repeated_failures" || { echo "FAIL: trigger not repeated_failures"; exit 1; }
echo "PASS"

# 4. Anti-spam: same session+trigger should not suggest twice
echo "test 4: anti-spam"
output=$(run_hook "怎么又报错了" "")
if [ -n "$output" ]; then
  echo "FAIL: expected no second suggestion, got: $output"
  exit 1
fi
echo "PASS"

# 5. Long session (mock large transcript)
echo "test 5: long session"
other_session="other-session-002"
transcript="$HOME/.claude/projects/-data-codes-ace/${other_session}.jsonl"
mkdir -p "$HOME/.claude/projects/-data-codes-ace"
for i in $(seq 1 1600); do
  echo '{"type":"user","message":{"content":"x"}}' >> "$transcript"
done
output=$(python3 "$HOOK" <<EOF
{"session_id": "$other_session", "prompt": "help", "transcript_path": "$transcript"}
EOF
)
echo "$output" | grep -q "long_session" || { echo "FAIL: trigger not long_session"; exit 1; }
echo "PASS"

echo "All detect-frustration tests passed."
