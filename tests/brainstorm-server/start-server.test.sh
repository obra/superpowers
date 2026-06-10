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
echo "--- Results: $passed passed, $failed failed ---"
if [[ $failed -gt 0 ]]; then
  exit 1
fi
