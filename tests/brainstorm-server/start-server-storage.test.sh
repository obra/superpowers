#!/usr/bin/env bash
# Tests storage path resolution logic for start-server.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SUPERPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
START_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/brainstorm-storage-test-XXXXXX")"
FAKE_NODE_DIR="$TEST_ROOT/fake-bin"
mkdir -p "$FAKE_NODE_DIR"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

cat > "$FAKE_NODE_DIR/node" <<'FAKENODE'
#!/usr/bin/env bash
echo "CAPTURED_BRAINSTORM_DIR=${BRAINSTORM_DIR:-__UNSET__}"
exit 0
FAKENODE
chmod +x "$FAKE_NODE_DIR/node"

pass_count=0

run_case() {
  local name="$1"
  local expected_prefix="$2"
  shift 2

  local output
  output=$(PATH="$FAKE_NODE_DIR:$PATH" "$@" --foreground 2>/dev/null || true)
  local captured
  captured=$(echo "$output" | sed -n 's/^CAPTURED_BRAINSTORM_DIR=//p' | head -1)

  if [[ -z "$captured" || "$captured" == "__UNSET__" ]]; then
    echo "FAIL: $name"
    echo "  No BRAINSTORM_DIR captured. Output: $output"
    exit 1
  fi

  if [[ "$captured" != "$expected_prefix"/* ]]; then
    echo "FAIL: $name"
    echo "  Expected prefix: $expected_prefix/"
    echo "  Got: $captured"
    exit 1
  fi

  echo "PASS: $name"
  pass_count=$((pass_count + 1))
}

# 1) --state-dir wins over all other inputs
run_case "--state-dir overrides --project-dir and env" \
  "$TEST_ROOT/state-explicit" \
  env SUPERPOWERS_STATE_DIR="$TEST_ROOT/state-env" XDG_DATA_HOME="$TEST_ROOT/xdg" \
  bash "$START_SCRIPT" --state-dir "$TEST_ROOT/state-explicit" --project-dir "$TEST_ROOT/project"

# 2) --project-dir used when --state-dir absent
run_case "--project-dir keeps legacy .superpowers layout" \
  "$TEST_ROOT/project-legacy/.superpowers/brainstorm" \
  env SUPERPOWERS_STATE_DIR="$TEST_ROOT/state-env" XDG_DATA_HOME="$TEST_ROOT/xdg" \
  bash "$START_SCRIPT" --project-dir "$TEST_ROOT/project-legacy"

# 3) SUPERPOWERS_STATE_DIR used when no flags
run_case "SUPERPOWERS_STATE_DIR used when flags absent" \
  "$TEST_ROOT/state-env-only" \
  env SUPERPOWERS_STATE_DIR="$TEST_ROOT/state-env-only" XDG_DATA_HOME="$TEST_ROOT/xdg" \
  bash "$START_SCRIPT"

# 4) XDG_DATA_HOME fallback when env unset
run_case "XDG_DATA_HOME fallback used by default" \
  "$TEST_ROOT/xdg-fallback/superpowers/brainstorm" \
  env -u SUPERPOWERS_STATE_DIR XDG_DATA_HOME="$TEST_ROOT/xdg-fallback" \
  bash "$START_SCRIPT"

# 5) ~/.local/share fallback when XDG_DATA_HOME unset
HOME_DIR="$TEST_ROOT/home-fallback"
mkdir -p "$HOME_DIR"
run_case "HOME .local/share fallback used when XDG unset" \
  "$HOME_DIR/.local/share/superpowers/brainstorm" \
  env -u SUPERPOWERS_STATE_DIR -u XDG_DATA_HOME HOME="$HOME_DIR" \
  bash "$START_SCRIPT"

echo "All $pass_count storage tests passed."
