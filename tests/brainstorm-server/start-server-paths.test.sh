#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SUPERPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
START_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"
TEST_DIR="${TMPDIR:-/tmp}/brainstorm-paths-test-$$"
FAKE_NODE_DIR="$TEST_DIR/fake-bin"

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_NODE_DIR"
cat > "$FAKE_NODE_DIR/node" <<'FAKENODE'
#!/usr/bin/env bash
printf 'DIR=%s\n' "${BRAINSTORM_DIR:-}"
exit 0
FAKENODE
chmod +x "$FAKE_NODE_DIR/node"

run_case() {
  env PATH="$FAKE_NODE_DIR:$PATH" "$@"
}

require_match() {
  local output="$1"
  local pattern="$2"
  local description="$3"

  if ! echo "$output" | grep -q "$pattern"; then
    echo "FAIL: $description"
    echo "Expected pattern: $pattern"
    echo "Output:"
    echo "$output"
    exit 1
  fi
}

project_output="$(run_case bash "$START_SCRIPT" --project-dir "$TEST_DIR/repo" --foreground 2>/dev/null || true)"
state_output="$(run_case bash "$START_SCRIPT" --state-dir "$TEST_DIR/state-root" --foreground 2>/dev/null || true)"
env_output="$(SUPERPOWERS_STATE_DIR="$TEST_DIR/from-env" run_case bash "$START_SCRIPT" --foreground 2>/dev/null || true)"
default_output="$(HOME="$TEST_DIR/home" XDG_DATA_HOME="$TEST_DIR/xdg" run_case bash "$START_SCRIPT" --foreground 2>/dev/null || true)"
precedence_output="$(SUPERPOWERS_STATE_DIR="$TEST_DIR/from-env" run_case bash "$START_SCRIPT" --state-dir "$TEST_DIR/flag-wins" --project-dir "$TEST_DIR/repo2" --foreground 2>/dev/null || true)"

require_match "$project_output" "$TEST_DIR/repo/.superpowers/brainstorm/" "--project-dir should map to in-repo compatibility path"
require_match "$state_output" "$TEST_DIR/state-root/" "--state-dir should set the storage root directly"
require_match "$env_output" "$TEST_DIR/from-env/" "SUPERPOWERS_STATE_DIR should control the storage root when no flag is set"
require_match "$default_output" "$TEST_DIR/xdg/superpowers/brainstorm/" "default storage should use XDG data dir when available"
require_match "$precedence_output" "$TEST_DIR/flag-wins/" "--state-dir should take precedence over env var and compatibility alias"

echo "PASS: start-server path selection"
