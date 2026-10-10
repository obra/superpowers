#!/usr/bin/env bash
# Fast tests for start-server.sh shell-only platform decisions.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
START_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"

TEST_DIR="${TMPDIR:-/tmp}/brainstorm-start-test-$$"
passed=0
failed=0

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

pass() {
  echo "  PASS: $1"
  passed=$((passed + 1))
}

fail() {
  echo "  FAIL: $1"
  echo "    $2"
  failed=$((failed + 1))
}

make_fake_uname() {
  local fake_bin="$1"
  cat > "$fake_bin/uname" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "-s" ]]; then
  echo "MINGW64_NT-10.0"
else
  /usr/bin/uname "$@"
fi
EOF
  chmod +x "$fake_bin/uname"
}

echo ""
echo "--- start-server.sh platform detection ---"

mkdir -p "$TEST_DIR/fake-bin" "$TEST_DIR/project"
make_fake_uname "$TEST_DIR/fake-bin"

cat > "$TEST_DIR/fake-bin/node" <<'EOF'
#!/usr/bin/env bash
echo "CAPTURED_OWNER_PID=${BRAINSTORM_OWNER_PID:-__UNSET__}"
printf 'CAPTURED_ARGV=%s\n' "$@"
exit 0
EOF
chmod +x "$TEST_DIR/fake-bin/node"

captured=$(
  PATH="$TEST_DIR/fake-bin:$PATH" \
    MSYSTEM="" \
    bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" --foreground 2>/dev/null || true
)
owner_pid_value=$(echo "$captured" | grep "CAPTURED_OWNER_PID=" | head -1 | sed 's/CAPTURED_OWNER_PID=//')

if [[ "$owner_pid_value" == "" || "$owner_pid_value" == "__UNSET__" ]]; then
  pass "clears BRAINSTORM_OWNER_PID when uname reports a Windows-like shell"
else
  fail "clears BRAINSTORM_OWNER_PID when uname reports a Windows-like shell" \
       "expected empty or unset, got '$owner_pid_value'"
fi

if echo "$captured" | grep -Eq '^CAPTURED_ARGV=--brainstorm-server-id=[A-Za-z0-9_-]{32,64}$'; then
  pass "passes shell-safe server instance id argv"
else
  fail "passes shell-safe server instance id argv" \
       "expected exact --brainstorm-server-id=<safe id> argv line, got: $captured"
fi

server_id_file=$(find "$TEST_DIR/project/.superpowers/brainstorm" -name server-instance-id -print 2>/dev/null | head -1)
server_id_value=""
if [[ -n "$server_id_file" ]]; then
  server_id_value="$(tr -d '\r\n' < "$server_id_file")"
fi
if [[ "$server_id_value" =~ ^[A-Za-z0-9_-]{32,64}$ ]]; then
  pass "writes shell-safe server-instance-id state file"
else
  fail "writes shell-safe server-instance-id state file" \
       "expected valid id in state, got '$server_id_value'"
fi

rm -rf "$TEST_DIR/project"/*

cat > "$TEST_DIR/fake-bin/node" <<'EOF'
#!/usr/bin/env bash
echo "FOREGROUND_MODE=true"
exit 0
EOF
chmod +x "$TEST_DIR/fake-bin/node"

captured=$(
  PATH="$TEST_DIR/fake-bin:$PATH" \
    MSYSTEM="" \
    bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>/dev/null || true
)

if echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
  pass "auto-foregrounds when uname reports a Windows-like shell"
else
  fail "auto-foregrounds when uname reports a Windows-like shell" \
       "expected foreground node path, got: $captured"
fi

echo ""
echo "--- start-server.sh Cursor auto-detect ---"

rm -rf "$TEST_DIR/project"/*
mkdir -p "$TEST_DIR/cursor-bin" "$TEST_DIR/project"

cat > "$TEST_DIR/cursor-bin/node" <<'EOF'
#!/usr/bin/env bash
echo "FOREGROUND_MODE=true"
exit 0
EOF
chmod +x "$TEST_DIR/cursor-bin/node"

captured=$(
  PATH="$TEST_DIR/cursor-bin:$PATH" \
    CURSOR_AGENT=1 \
    MSYSTEM="" \
    OSTYPE=darwin23 \
    bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>/dev/null || true
)

if echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
  pass "auto-foregrounds when CURSOR_AGENT is set"
else
  fail "auto-foregrounds when CURSOR_AGENT is set" \
       "expected foreground node path, got: $captured"
fi

rm -rf "$TEST_DIR/project"/*
mkdir -p "$TEST_DIR/project"

captured=$(
  PATH="$TEST_DIR/cursor-bin:$PATH" \
    CURSOR_EXTENSION_HOST_ROLE=agent-exec \
    MSYSTEM="" \
    OSTYPE=darwin23 \
    bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>/dev/null || true
)

if echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
  pass "auto-foregrounds when CURSOR_EXTENSION_HOST_ROLE=agent-exec"
else
  fail "auto-foregrounds when CURSOR_EXTENSION_HOST_ROLE=agent-exec" \
       "expected foreground node path, got: $captured"
fi

rm -rf "$TEST_DIR/project"/*
mkdir -p "$TEST_DIR/project"

hint_err=$(
  PATH="$TEST_DIR/cursor-bin:$PATH" \
    CURSOR_AGENT=1 \
    MSYSTEM="" \
    OSTYPE=darwin23 \
    bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>&1 >/dev/null || true
)

if echo "$hint_err" | grep -q '"type":"hint"'; then
  pass "prints Cursor async-shell hint on stderr"
else
  fail "prints Cursor async-shell hint on stderr" \
       "expected hint JSON on stderr, got: $hint_err"
fi

rm -rf "$TEST_DIR/project"/*
mkdir -p "$TEST_DIR/cursor-bg-bin" "$TEST_DIR/project"

cat > "$TEST_DIR/cursor-bg-bin/node" <<'EOF'
#!/usr/bin/env bash
echo '{"type":"server-started","port":9,"host":"127.0.0.1","url_host":"localhost","url":"http://127.0.0.1:9/?key=test","screen_dir":"/tmp","state_dir":"/tmp","idle_timeout_ms":1}'
# Stay alive through the post-start alive window
sleep 3
exit 0
EOF
chmod +x "$TEST_DIR/cursor-bg-bin/node"

cat > "$TEST_DIR/cursor-bg-bin/curl" <<'EOF'
#!/usr/bin/env bash
echo "200"
exit 0
EOF
chmod +x "$TEST_DIR/cursor-bg-bin/curl"

captured=$(
  PATH="$TEST_DIR/cursor-bg-bin:$PATH" \
    CURSOR_AGENT=1 \
    MSYSTEM="" \
    OSTYPE=darwin23 \
    bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" --background 2>/dev/null || true
)

if echo "$captured" | grep -q '"type":"server-started"'; then
  pass "Cursor --background overrides auto-foreground"
else
  fail "Cursor --background overrides auto-foreground" \
       "expected server-started from background path, got: $captured"
fi

# Kill any leftover fake node from the background path
pkill -f "brainstorm-start-test-$$" 2>/dev/null || true
find "$TEST_DIR/project" -name server.pid -print 2>/dev/null | while read -r pidfile; do
  pid="$(tr -d ' \n' < "$pidfile" 2>/dev/null || true)"
  if [[ -n "$pid" ]]; then
    kill "$pid" 2>/dev/null || true
  fi
done

echo ""
echo "--- Results: $passed passed, $failed failed ---"
if [[ $failed -gt 0 ]]; then
  exit 1
fi
