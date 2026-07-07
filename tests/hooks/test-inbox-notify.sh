#!/usr/bin/env bash
# Test inbox-notify.py hook
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="${SCRIPT_DIR}/../../hooks/inbox-notify.py"

# Create isolated HOME
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

export HOME="$tmpdir"
mkdir -p "$HOME/.ace/inbox"

# No messages: should output nothing
echo "test 1: empty inbox"
output=$(python3 "$HOOK" <<EOF
{"source": "startup"}
EOF
)
if [ -n "$output" ]; then
  echo "FAIL: expected no output, got: $output"
  exit 1
fi
echo "PASS"

# Unread message: should notify
echo "test 2: unread message"
cat > "$HOME/.ace/inbox/messages.jsonl" <<EOF
{"id": "msg-001", "report_id": "rpt-001", "created_at": "2026-07-07T12:00:00+00:00", "level": "info", "title": "Update", "body": "We are looking into it."}
EOF
cat > "$HOME/.ace/inbox/state.json" <<EOF
{"read_ids": []}
EOF
output=$(python3 "$HOOK" <<EOF
{"source": "startup"}
EOF
)
echo "$output" | grep -q "systemMessage" || { echo "FAIL: no systemMessage"; exit 1; }
echo "$output" | grep -q "additionalContext" || { echo "FAIL: no additionalContext"; exit 1; }
echo "$output" | grep -q "Update" || { echo "FAIL: title not shown"; exit 1; }
echo "PASS"

# Read message: should not notify
echo "test 3: already read"
cat > "$HOME/.ace/inbox/state.json" <<EOF
{"read_ids": ["msg-001"]}
EOF
output=$(python3 "$HOOK" <<EOF
{"source": "startup"}
EOF
)
if [ -n "$output" ]; then
  echo "FAIL: expected no output for read message, got: $output"
  exit 1
fi
echo "PASS"

# Resume source: should not notify
echo "test 4: resume source"
cat > "$HOME/.ace/inbox/state.json" <<EOF
{"read_ids": []}
EOF
output=$(python3 "$HOOK" <<EOF
{"source": "resume"}
EOF
)
if [ -n "$output" ]; then
  echo "FAIL: expected no output on resume, got: $output"
  exit 1
fi
echo "PASS"

echo "All inbox-notify tests passed."
