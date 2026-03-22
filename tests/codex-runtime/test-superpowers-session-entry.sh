#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-session-entry"
STATE_DIR="$(mktemp -d)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$TMP_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

require_helper() {
  if [[ ! -x "$HELPER_BIN" ]]; then
    echo "Expected helper to exist and be executable: $HELPER_BIN"
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

assert_contains() {
  local output="$1"
  local expected="$2"
  local label="$3"
  if [[ "$output" != *"$expected"* ]]; then
    echo "Expected ${label} output to contain '${expected}'"
    printf '%s\n' "$output"
    exit 1
  fi
}

require_absent_pattern() {
  local path="$1"
  local pattern="$2"
  if rg -n -e "$pattern" "$path" >/dev/null; then
    echo "Expected pattern to be absent from ${path}: ${pattern}"
    exit 1
  fi
}

run_json_command() {
  local label="$1"
  shift
  local output
  local status=0
  output="$("$HELPER_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_command_fails() {
  local label="$1"
  local expected_class="$2"
  shift 2
  local output
  local status=0
  output="$("$HELPER_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected command to fail for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_contains "$output" "\"failure_class\":\"$expected_class\"" "$label"
  printf '%s\n' "$output"
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

populate_decoy_state_tree() {
  local count="$1"
  local dir="$STATE_DIR/session-flags/using-superpowers"
  local i
  mkdir -p "$dir"
  for ((i=1; i<=count; i++)); do
    printf 'enabled\n' > "$dir/decoy-session-$i"
  done
}

# Red contract expectations:
# expect_json_field outcome needs_user_choice
# expect_json_field decision_source missing
# expect_json_field failure_class MalformedDecisionState

run_missing_decision_needs_user_choice() {
  local message_file
  local output
  local expected_path

  message_file="$(write_message_file missing-message.txt <<'EOF'
Can you help with this task?
EOF
)"
  expected_path="$(decision_path_for_key "missing-session")"
  output="$(run_json_command "missing decision" resolve --message-file "$message_file" --session-key "missing-session")"
  assert_json_equals "$output" "outcome" "needs_user_choice" "missing decision"
  assert_json_equals "$output" "decision_source" "missing" "missing decision"
  assert_json_equals "$output" "session_key" "missing-session" "missing decision"
  assert_json_equals "$output" "decision_path" "$expected_path" "missing decision"
  assert_json_equals "$output" "policy_source" "default" "missing decision"
  assert_json_equals "$output" "persisted" "false" "missing decision"
  assert_json_nonempty "$output" "prompt.question" "missing decision prompt"
}

run_existing_enabled_decision() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file enabled-message.txt <<'EOF'
Continue normally.
EOF
)"
  decision_path="$(decision_path_for_key "enabled-session")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'enabled\n' > "$decision_path"

  output="$(run_json_command "existing enabled decision" resolve --message-file "$message_file" --session-key "enabled-session")"
  assert_json_equals "$output" "outcome" "enabled" "existing enabled decision"
  assert_json_equals "$output" "decision_source" "existing_enabled" "existing enabled decision"
  assert_json_equals "$output" "persisted" "true" "existing enabled decision"
}

run_existing_bypassed_decision() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file bypassed-message.txt <<'EOF'
Continue without extra workflow help.
EOF
)"
  decision_path="$(decision_path_for_key "bypassed-session")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "existing bypassed decision" resolve --message-file "$message_file" --session-key "bypassed-session")"
  assert_json_equals "$output" "outcome" "bypassed" "existing bypassed decision"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "existing bypassed decision"
  assert_json_equals "$output" "persisted" "true" "existing bypassed decision"
}

run_malformed_decision_needs_user_choice() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file malformed-message.txt <<'EOF'
Please route this correctly.
EOF
)"
  decision_path="$(decision_path_for_key "malformed-session")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'corrupt\nextra\n' > "$decision_path"

  output="$(run_json_command "malformed decision" resolve --message-file "$message_file" --session-key "malformed-session")"
  assert_json_equals "$output" "outcome" "needs_user_choice" "malformed decision"
  assert_json_equals "$output" "decision_source" "malformed" "malformed decision"
  assert_json_equals "$output" "failure_class" "MalformedDecisionState" "malformed decision"
}

run_explicit_reentry_rewrites_bypassed_decision() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file explicit-reentry-message.txt <<'EOF'
Please use superpowers for this task.
EOF
)"
  decision_path="$(decision_path_for_key "explicit-reentry")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "explicit re-entry" resolve --message-file "$message_file" --session-key "explicit-reentry")"
  assert_json_equals "$output" "outcome" "enabled" "explicit re-entry"
  assert_json_equals "$output" "decision_source" "explicit_reentry" "explicit re-entry"
  assert_json_equals "$output" "persisted" "true" "explicit re-entry"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected explicit re-entry to persist enabled decision"
    exit 1
  fi
}

run_natural_language_skill_request_triggers_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file natural-language-reentry-message.txt <<'EOF'
Please use brainstorming for this task.
EOF
)"
  decision_path="$(decision_path_for_key "natural-language-reentry")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "natural language explicit re-entry" resolve --message-file "$message_file" --session-key "natural-language-reentry")"
  assert_json_equals "$output" "outcome" "enabled" "natural language explicit re-entry"
  assert_json_equals "$output" "decision_source" "explicit_reentry" "natural language explicit re-entry"
  assert_json_equals "$output" "persisted" "true" "natural language explicit re-entry"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected natural-language explicit re-entry to persist enabled decision"
    exit 1
  fi
}

run_direct_superpowers_please_triggers_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file direct-superpowers-please-message.txt <<'EOF'
superpowers please
EOF
)"
  decision_path="$(decision_path_for_key "direct-superpowers-please")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "direct superpowers please re-entry" resolve --message-file "$message_file" --session-key "direct-superpowers-please")"
  assert_json_equals "$output" "outcome" "enabled" "direct superpowers please re-entry"
  assert_json_equals "$output" "decision_source" "explicit_reentry" "direct superpowers please re-entry"
  assert_json_equals "$output" "persisted" "true" "direct superpowers please re-entry"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected direct superpowers please request to persist enabled decision"
    exit 1
  fi
}

run_enable_superpowers_again_triggers_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file enable-superpowers-again-message.txt <<'EOF'
Enable superpowers again.
EOF
)"
  decision_path="$(decision_path_for_key "enable-superpowers-again")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "enable superpowers again re-entry" resolve --message-file "$message_file" --session-key "enable-superpowers-again")"
  assert_json_equals "$output" "outcome" "enabled" "enable superpowers again re-entry"
  assert_json_equals "$output" "decision_source" "explicit_reentry" "enable superpowers again re-entry"
  assert_json_equals "$output" "persisted" "true" "enable superpowers again re-entry"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected enable superpowers again request to persist enabled decision"
    exit 1
  fi
}

run_negated_skill_request_does_not_trigger_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file negated-skill-request-message.txt <<'EOF'
Do not use brainstorming for this task.
EOF
)"
  decision_path="$(decision_path_for_key "negated-skill-request")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "negated skill request" resolve --message-file "$message_file" --session-key "negated-skill-request")"
  assert_json_equals "$output" "outcome" "bypassed" "negated skill request"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "negated skill request"
  assert_json_equals "$output" "persisted" "true" "negated skill request"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected negated skill request to keep bypassed decision"
    exit 1
  fi
}

run_use_no_skill_request_does_not_trigger_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file use-no-skill-request-message.txt <<'EOF'
Please use no brainstorming here.
EOF
)"
  decision_path="$(decision_path_for_key "use-no-skill-request")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "use no skill request" resolve --message-file "$message_file" --session-key "use-no-skill-request")"
  assert_json_equals "$output" "outcome" "bypassed" "use no skill request"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "use no skill request"
  assert_json_equals "$output" "persisted" "true" "use no skill request"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected use-no skill request to keep bypassed decision"
    exit 1
  fi
}

run_use_no_superpowers_does_not_trigger_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file use-no-superpowers-message.txt <<'EOF'
Please use no superpowers here.
EOF
)"
  decision_path="$(decision_path_for_key "use-no-superpowers")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "use no superpowers" resolve --message-file "$message_file" --session-key "use-no-superpowers")"
  assert_json_equals "$output" "outcome" "bypassed" "use no superpowers"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "use no superpowers"
  assert_json_equals "$output" "persisted" "true" "use no superpowers"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected use-no superpowers request to keep bypassed decision"
    exit 1
  fi
}

run_never_use_skill_request_does_not_trigger_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file never-use-skill-request-message.txt <<'EOF'
Please never use brainstorming here.
EOF
)"
  decision_path="$(decision_path_for_key "never-use-skill-request")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "never use skill request" resolve --message-file "$message_file" --session-key "never-use-skill-request")"
  assert_json_equals "$output" "outcome" "bypassed" "never use skill request"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "never use skill request"
  assert_json_equals "$output" "persisted" "true" "never use skill request"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected never-use skill request to keep bypassed decision"
    exit 1
  fi
}

run_long_negated_skill_request_does_not_trigger_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file long-negated-skill-request-message.txt <<'EOF'
Please do not under any circumstances use brainstorming for this task.
EOF
)"
  decision_path="$(decision_path_for_key "long-negated-skill-request")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "long negated skill request" resolve --message-file "$message_file" --session-key "long-negated-skill-request")"
  assert_json_equals "$output" "outcome" "bypassed" "long negated skill request"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "long negated skill request"
  assert_json_equals "$output" "persisted" "true" "long negated skill request"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected long negated skill request to keep bypassed decision"
    exit 1
  fi
}

run_long_negated_superpowers_request_does_not_trigger_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file long-negated-superpowers-message.txt <<'EOF'
Please do not under any circumstances use superpowers for this task.
EOF
)"
  decision_path="$(decision_path_for_key "long-negated-superpowers")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "long negated superpowers request" resolve --message-file "$message_file" --session-key "long-negated-superpowers")"
  assert_json_equals "$output" "outcome" "bypassed" "long negated superpowers request"
  assert_json_equals "$output" "decision_source" "existing_bypassed" "long negated superpowers request"
  assert_json_equals "$output" "persisted" "true" "long negated superpowers request"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected long negated superpowers request to keep bypassed decision"
    exit 1
  fi
}

run_contrastive_superpowers_clause_triggers_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file contrastive-superpowers-message.txt <<'EOF'
Do not use brainstorming, but use superpowers for this task.
EOF
)"
  decision_path="$(decision_path_for_key "contrastive-superpowers")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "contrastive superpowers clause" resolve --message-file "$message_file" --session-key "contrastive-superpowers")"
  assert_json_equals "$output" "outcome" "enabled" "contrastive superpowers clause"
  assert_json_equals "$output" "decision_source" "explicit_reentry" "contrastive superpowers clause"
  assert_json_equals "$output" "persisted" "true" "contrastive superpowers clause"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected contrastive superpowers clause to persist enabled decision"
    exit 1
  fi
}

run_contrastive_skill_clause_triggers_reentry() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file contrastive-skill-message.txt <<'EOF'
Do not use brainstorming, but use writing-plans for this task.
EOF
)"
  decision_path="$(decision_path_for_key "contrastive-skill")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(run_json_command "contrastive skill clause" resolve --message-file "$message_file" --session-key "contrastive-skill")"
  assert_json_equals "$output" "outcome" "enabled" "contrastive skill clause"
  assert_json_equals "$output" "decision_source" "explicit_reentry" "contrastive skill clause"
  assert_json_equals "$output" "persisted" "true" "contrastive skill clause"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected contrastive skill clause to persist enabled decision"
    exit 1
  fi
}

run_explicit_reentry_write_failure_is_unpersisted() {
  local message_file
  local decision_path
  local output

  message_file="$(write_message_file explicit-reentry-write-failure-message.txt <<'EOF'
Use superpowers right now.
EOF
)"
  decision_path="$(decision_path_for_key "explicit-reentry-write-failure")"
  mkdir -p "$(dirname "$decision_path")"
  printf 'bypassed\n' > "$decision_path"

  output="$(
    SUPERPOWERS_SESSION_ENTRY_TEST_FAILPOINT="reentry_write_failure" \
      run_json_command "explicit re-entry write failure" resolve --message-file "$message_file" --session-key "explicit-reentry-write-failure"
  )"
  assert_json_equals "$output" "outcome" "enabled" "explicit re-entry write failure"
  assert_json_equals "$output" "decision_source" "explicit_reentry_unpersisted" "explicit re-entry write failure"
  assert_json_equals "$output" "persisted" "false" "explicit re-entry write failure"
  assert_json_equals "$output" "failure_class" "DecisionWriteFailed" "explicit re-entry write failure"
  if [[ "$(cat "$decision_path")" != "bypassed" ]]; then
    echo "Expected re-entry write failure to leave persisted bypassed decision unchanged"
    exit 1
  fi
}

run_record_persists_enabled_choice() {
  local output
  local decision_path

  decision_path="$(decision_path_for_key "record-enabled")"
  output="$(run_json_command "record enabled choice" record --decision enabled --session-key "record-enabled")"
  assert_json_equals "$output" "outcome" "enabled" "record enabled choice"
  assert_json_equals "$output" "decision_source" "existing_enabled" "record enabled choice"
  assert_json_equals "$output" "persisted" "true" "record enabled choice"
  if [[ "$(cat "$decision_path")" != "enabled" ]]; then
    echo "Expected record command to persist enabled decision"
    exit 1
  fi
}

run_record_rejects_invalid_decision() {
  run_command_fails "record invalid decision" "InvalidCommandInput" record --decision maybe --session-key "record-invalid" >/dev/null
}

run_record_rejects_whitespace_only_session_key() {
  run_command_fails "record whitespace-only session key" "InvalidCommandInput" record --decision enabled --session-key "   " >/dev/null
}

run_whitespace_only_session_key_fails_closed() {
  local message_file

  message_file="$(write_message_file whitespace-session-key-message.txt <<'EOF'
Please keep the gate deterministic.
EOF
)"
  run_command_fails "whitespace-only session key" "InvalidCommandInput" resolve --message-file "$message_file" --session-key "   " >/dev/null
}

run_hot_path_uses_derived_decision_file() {
  local message_file
  local output
  local expected_path

  message_file="$(write_message_file hot-path-message.txt <<'EOF'
Normal routing should use the derived session key.
EOF
)"
  expected_path="$(decision_path_for_key "derived-session")"
  mkdir -p "$(dirname "$expected_path")"
  printf 'enabled\n' > "$expected_path"

  populate_decoy_state_tree 100

  output="$(run_json_command "hot path derived decision file" resolve --message-file "$message_file" --session-key "derived-session")"
  assert_json_equals "$output" "outcome" "enabled" "hot path derived decision file"
  assert_json_equals "$output" "decision_path" "$expected_path" "hot path derived decision file"
}

require_helper
run_missing_decision_needs_user_choice
run_existing_enabled_decision
run_existing_bypassed_decision
run_malformed_decision_needs_user_choice
run_explicit_reentry_rewrites_bypassed_decision
run_natural_language_skill_request_triggers_reentry
run_direct_superpowers_please_triggers_reentry
run_enable_superpowers_again_triggers_reentry
run_negated_skill_request_does_not_trigger_reentry
run_use_no_skill_request_does_not_trigger_reentry
run_use_no_superpowers_does_not_trigger_reentry
run_never_use_skill_request_does_not_trigger_reentry
run_long_negated_skill_request_does_not_trigger_reentry
run_long_negated_superpowers_request_does_not_trigger_reentry
run_contrastive_superpowers_clause_triggers_reentry
run_contrastive_skill_clause_triggers_reentry
run_explicit_reentry_write_failure_is_unpersisted
run_record_persists_enabled_choice
run_record_rejects_invalid_decision
run_record_rejects_whitespace_only_session_key
run_whitespace_only_session_key_fails_closed
run_hot_path_uses_derived_decision_file
require_absent_pattern "$HELPER_BIN" 'find .*session-flags'

echo "session-entry helper regression test passed."
