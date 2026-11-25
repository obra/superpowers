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

run_bounded() {
  if command -v timeout >/dev/null 2>&1; then
    timeout 3 "$@"
  else
    perl -e 'alarm 3; exec @ARGV' "$@"
  fi
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
echo "--- start-server.sh relative --project-dir ---"

cat > "$TEST_DIR/fake-bin/node" <<'EOF'
#!/usr/bin/env bash
echo "CAPTURED_BRAINSTORM_DIR=${BRAINSTORM_DIR:-__UNSET__}"
exit 0
EOF
chmod +x "$TEST_DIR/fake-bin/node"

# The script cds into its own directory before starting the server, so a
# relative --project-dir must be resolved against the caller's cwd first.
# Covers an existing dir and a not-yet-created one, both with spaces.
for relative_dir in "." "new project dir"; do
  caller_dir="$TEST_DIR/caller with space"
  rm -rf "$caller_dir"
  mkdir -p "$caller_dir"
  expected_root="$(cd "$caller_dir" && pwd)"
  if [[ "$relative_dir" != "." ]]; then
    expected_root="$expected_root/$relative_dir"
  fi

  captured=$(
    cd "$caller_dir" &&
      PATH="$TEST_DIR/fake-bin:$PATH" \
        MSYSTEM="" \
        bash "$START_SCRIPT" --project-dir "$relative_dir" --foreground 2>&1 || true
  )
  brainstorm_dir=$(echo "$captured" | grep "CAPTURED_BRAINSTORM_DIR=" | head -1 | sed 's/CAPTURED_BRAINSTORM_DIR=//')

  case "$brainstorm_dir" in
    "$expected_root/.superpowers/brainstorm/"*)
      pass "--project-dir '$relative_dir' gives the server an absolute session dir under the caller's cwd" ;;
    *)
      fail "--project-dir '$relative_dir' gives the server an absolute session dir under the caller's cwd" \
           "expected prefix '$expected_root/.superpowers/brainstorm/', got: $captured" ;;
  esac

  if [[ -n "$brainstorm_dir" && -f "$brainstorm_dir/state/server.pid" ]]; then
    pass "--project-dir '$relative_dir' writes server.pid into the project session dir"
  else
    fail "--project-dir '$relative_dir' writes server.pid into the project session dir" \
         "no server.pid under '$brainstorm_dir/state', output: $captured"
  fi
done

echo ""
echo "--- start-server.sh missing values & Cursor auto-foreground ---"

mkdir -p "$TEST_DIR/nonwin-bin" "$TEST_DIR/arg-caller"
cat > "$TEST_DIR/nonwin-bin/uname" <<'EOF'
#!/usr/bin/env bash
[[ "${1:-}" == "-s" ]] && echo "Linux" || exec /usr/bin/uname "$@"
EOF
cat > "$TEST_DIR/nonwin-bin/node" <<'EOF'
#!/usr/bin/env bash
echo "FOREGROUND_MODE=true"
EOF
chmod +x "$TEST_DIR/nonwin-bin/uname" "$TEST_DIR/nonwin-bin/node"

check_missing_value() {
  local label="$1" expected_flag="$2"
  shift 2
  local rc=0 captured=""
  captured=$(cd "$TEST_DIR/arg-caller" && PATH="$TEST_DIR/nonwin-bin:$PATH" run_bounded bash "$START_SCRIPT" "$@" 2>&1) || rc=$?
  if [[ "$rc" -eq 1 ]] && echo "$captured" | grep -q '"error":' && echo "$captured" | grep -Fq -- "$expected_flag"; then
    pass "$label"
  else
    fail "$label" "expected rc=1 and JSON error mentioning $expected_flag, got rc=$rc output: $captured"
  fi
}

for flag in --project-dir --host --url-host --idle-timeout-minutes; do
  check_missing_value "$flag with no value fails fast with JSON error" "$flag" "$flag"
done
check_missing_value "--project-dir followed by --open fails fast with JSON error" "--project-dir" --project-dir --open
check_missing_value "--project-dir with empty string fails fast with JSON error" "--project-dir" --project-dir ""

rm -rf "$TEST_DIR/project"/* "$TEST_DIR/project"/.superpowers
rc=0
captured=$(CODEX_CI="" CURSOR_AGENT=1 CURSOR_EXTENSION_HOST_ROLE="" CURSOR_PLUGIN_ROOT="" MSYSTEM="" \
  PATH="$TEST_DIR/nonwin-bin:$PATH" run_bounded bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>&1) || rc=$?
if [[ "$rc" -eq 0 ]] && echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
  pass "auto-foregrounds when CURSOR_AGENT is set on non-Windows uname"
else
  fail "auto-foregrounds when CURSOR_AGENT is set on non-Windows uname" "expected rc=0 and FOREGROUND_MODE=true, got rc=$rc output: $captured"
fi

rm -rf "$TEST_DIR/project"/* "$TEST_DIR/project"/.superpowers
rc=0
captured=$(CODEX_CI="" CURSOR_AGENT="" CURSOR_EXTENSION_HOST_ROLE=agent-exec CURSOR_PLUGIN_ROOT="" MSYSTEM="" \
  PATH="$TEST_DIR/nonwin-bin:$PATH" run_bounded bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>&1) || rc=$?
if [[ "$rc" -eq 0 ]] && echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
  pass "auto-foregrounds when CURSOR_EXTENSION_HOST_ROLE=agent-exec on non-Windows uname"
else
  fail "auto-foregrounds when CURSOR_EXTENSION_HOST_ROLE=agent-exec on non-Windows uname" "expected rc=0 and FOREGROUND_MODE=true, got rc=$rc output: $captured"
fi

cat > "$TEST_DIR/nonwin-bin/node" <<'EOF'
#!/usr/bin/env bash
echo '{"type":"server-started","port":12345}'
EOF
chmod +x "$TEST_DIR/nonwin-bin/node"

rm -rf "$TEST_DIR/project"/* "$TEST_DIR/project"/.superpowers
rc=0
captured=$(CODEX_CI="" CURSOR_AGENT=1 CURSOR_EXTENSION_HOST_ROLE="" CURSOR_PLUGIN_ROOT="" MSYSTEM="" \
  PATH="$TEST_DIR/nonwin-bin:$PATH" run_bounded bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" --background 2>&1) || rc=$?
if [[ "$rc" -eq 1 ]] && echo "$captured" | grep -q "Server started but was killed"; then
  pass "--background overrides Cursor auto-foreground"
else
  fail "--background overrides Cursor auto-foreground" "expected background branch, got rc=$rc output: $captured"
fi

rm -rf "$TEST_DIR/project"/* "$TEST_DIR/project"/.superpowers
rc=0
captured=$(CODEX_CI="" CURSOR_AGENT="" CURSOR_EXTENSION_HOST_ROLE=user CURSOR_PLUGIN_ROOT="" MSYSTEM="" \
  PATH="$TEST_DIR/nonwin-bin:$PATH" run_bounded bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>&1) || rc=$?
if [[ "$rc" -eq 1 ]] && echo "$captured" | grep -q "Server started but was killed"; then
  pass "stays in background when CURSOR_EXTENSION_HOST_ROLE is not agent-exec"
else
  fail "stays in background when CURSOR_EXTENSION_HOST_ROLE is not agent-exec" "expected background branch, got rc=$rc output: $captured"
fi

rm -rf "$TEST_DIR/project"/* "$TEST_DIR/project"/.superpowers
rc=0
captured=$(CODEX_CI="" CURSOR_AGENT="" CURSOR_EXTENSION_HOST_ROLE="" CURSOR_PLUGIN_ROOT=/some/plugin MSYSTEM="" \
  PATH="$TEST_DIR/nonwin-bin:$PATH" run_bounded bash "$START_SCRIPT" --project-dir "$TEST_DIR/project" 2>&1) || rc=$?
if [[ "$rc" -eq 1 ]] && echo "$captured" | grep -q "Server started but was killed"; then
  pass "stays in background when only CURSOR_PLUGIN_ROOT is set"
else
  fail "stays in background when only CURSOR_PLUGIN_ROOT is set" "expected background branch, got rc=$rc output: $captured"
fi

echo ""
echo "--- Results: $passed passed, $failed failed ---"
if [[ $failed -gt 0 ]]; then
  exit 1
fi
