#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_DOC="$REPO_ROOT/skills/using-superpowers/SKILL.md"
ENTRY_HARNESS="$REPO_ROOT/tests/codex-runtime/session-entry-supported-entry-harness.sh"
STATE_DIR="$(mktemp -d)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$TMP_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

require_pattern() {
  local pattern="$1"
  if ! rg -n -F -- "$pattern" "$SKILL_DOC" >/dev/null; then
    echo "Missing session-entry gate pattern: $pattern"
    exit 1
  fi
}

require_absent_pattern() {
  local pattern="$1"
  if rg -n -F -- "$pattern" "$SKILL_DOC" >/dev/null; then
    echo "Unexpected stale session-entry gate pattern: $pattern"
    exit 1
  fi
}

json_value() {
  local json="$1"
  local path="$2"
  printf '%s' "$json" | node -e '
    const fs = require("fs");
    const keys = process.argv[1].split(".");
    let value = JSON.parse(fs.readFileSync(0, "utf8"));
    for (const key of keys) {
      if (value === null || value === undefined) break;
      value = value[key];
    }
    if (value === null) {
      process.stdout.write("null");
    } else if (typeof value === "object") {
      process.stdout.write(JSON.stringify(value));
    } else {
      process.stdout.write(String(value));
    }
  ' "$path"
}

assert_json_equals() {
  local json="$1"
  local path="$2"
  local expected="$3"
  local label="$4"
  local actual
  actual="$(json_value "$json" "$path")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected ${label} field ${path} to equal '${expected}'"
    echo "Actual: ${actual}"
    printf '%s\n' "$json"
    exit 1
  fi
}

assert_json_nonempty() {
  local json="$1"
  local path="$2"
  local label="$3"
  local actual
  actual="$(json_value "$json" "$path")"
  if [[ -z "$actual" || "$actual" == "null" ]]; then
    echo "Expected ${label} field ${path} to be non-empty"
    printf '%s\n' "$json"
    exit 1
  fi
}

write_message_file() {
  local name="$1"
  local path="$TMP_DIR/$name"
  cat > "$path"
  printf '%s\n' "$path"
}

decision_path_for_key() {
  local session_key="$1"
  printf '%s\n' "$STATE_DIR/session-flags/using-superpowers/$session_key"
}

run_json_command() {
  local label="$1"
  shift
  local output
  local status=0
  output="$("$ENTRY_HARNESS" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

require_pattern 'session-entry bootstrap ownership is runtime-owned'
require_pattern 'missing or malformed decision state fails closed'
require_pattern 'Supported entry paths must resolve `superpowers-session-entry resolve --message-file <path>` before any normal Superpowers behavior:'
require_pattern 'if the helper returns `needs_user_choice`, ask the opt-out question and persist either `enabled` or `bypassed`'
require_pattern '`superpowers-session-entry resolve` should surface `outcome` `needs_user_choice` with `failure_class` `MalformedDecisionState`'
require_absent_pattern 'continue to normal Superpowers behavior'

if [[ ! -x "$ENTRY_HARNESS" ]]; then
  echo "Expected supported-entry harness to exist and be executable: $ENTRY_HARNESS"
  exit 1
fi

missing_message="$(write_message_file missing-entry.txt <<'EOF'
Please route this from a fresh entry path.
EOF
)"
missing_output="$(run_json_command "fresh entry needs user choice" resolve --message-file "$missing_message" --session-key "fresh-entry")"
assert_json_equals "$missing_output" "helper_outcome" "needs_user_choice" "fresh entry needs user choice"
assert_json_equals "$missing_output" "first_response_kind" "bypass_prompt" "fresh entry needs user choice"
assert_json_equals "$missing_output" "normal_stack_started" "false" "fresh entry needs user choice"
assert_json_equals "$missing_output" "decision_source" "missing" "fresh entry needs user choice"
assert_json_equals "$missing_output" "decision_path" "$(decision_path_for_key "fresh-entry")" "fresh entry needs user choice"
assert_json_nonempty "$missing_output" "prompt_question" "fresh entry needs user choice"

malformed_message="$(write_message_file malformed-entry.txt <<'EOF'
Please route this from malformed state.
EOF
)"
malformed_path="$(decision_path_for_key "malformed-entry")"
mkdir -p "$(dirname "$malformed_path")"
printf 'corrupt\nextra\n' > "$malformed_path"
malformed_output="$(run_json_command "malformed entry needs user choice" resolve --message-file "$malformed_message" --session-key "malformed-entry")"
assert_json_equals "$malformed_output" "helper_outcome" "needs_user_choice" "malformed entry needs user choice"
assert_json_equals "$malformed_output" "first_response_kind" "bypass_prompt" "malformed entry needs user choice"
assert_json_equals "$malformed_output" "normal_stack_started" "false" "malformed entry needs user choice"
assert_json_equals "$malformed_output" "decision_source" "malformed" "malformed entry needs user choice"
assert_json_equals "$malformed_output" "decision_path" "$malformed_path" "malformed entry needs user choice"
assert_json_nonempty "$malformed_output" "prompt_question" "malformed entry needs user choice"

enabled_message="$(write_message_file enabled-entry.txt <<'EOF'
Please route this from enabled state.
EOF
)"
enabled_path="$(decision_path_for_key "enabled-entry")"
mkdir -p "$(dirname "$enabled_path")"
printf 'enabled\n' > "$enabled_path"
enabled_output="$(run_json_command "enabled entry allows normal stack" resolve --message-file "$enabled_message" --session-key "enabled-entry")"
assert_json_equals "$enabled_output" "helper_outcome" "enabled" "enabled entry allows normal stack"
assert_json_equals "$enabled_output" "first_response_kind" "normal_stack" "enabled entry allows normal stack"
assert_json_equals "$enabled_output" "normal_stack_started" "true" "enabled entry allows normal stack"
assert_json_equals "$enabled_output" "decision_source" "existing_enabled" "enabled entry allows normal stack"

echo "session-entry gate regression test passed."
