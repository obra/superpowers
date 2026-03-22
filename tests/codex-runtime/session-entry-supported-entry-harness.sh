#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-session-entry"
SKILL_DOC="$REPO_ROOT/skills/using-superpowers/SKILL.md"

extract_block() {
  local heading="$1"
  awk -v heading="$heading" '
    $0 == heading { in_heading=1; next }
    in_heading && /^```bash$/ { in_block=1; next }
    in_block && /^```$/ { exit }
    in_block { print }
  ' "$SKILL_DOC"
}

run_normal_stack() {
  local preamble_bash normal_stack_bash
  preamble_bash="$(extract_block "## Preamble (run first)")"
  normal_stack_bash="$(extract_block "## Normal Superpowers Stack")"
  [[ -n "$preamble_bash" ]] || { printf 'Failed to extract using-superpowers preamble block.\n' >&2; exit 1; }
  [[ -n "$normal_stack_bash" ]] || { printf 'Failed to extract using-superpowers normal stack block.\n' >&2; exit 1; }

  bash -lc "$preamble_bash"$'\n'"$normal_stack_bash"$'\n''printf "%s\n" "$_SP_STATE_DIR/sessions/$PPID"'
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
    if (value === null || value === undefined) {
      process.stdout.write("");
    } else if (typeof value === "object") {
      process.stdout.write(JSON.stringify(value));
    } else {
      process.stdout.write(String(value));
    }
  ' "$path"
}

message_file=""
session_key=""

if [[ "${1:-}" == "resolve" ]]; then
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --message-file) message_file="${2:-}"; shift 2 ;;
    --session-key) session_key="${2:-}"; shift 2 ;;
    *) printf 'Unknown harness argument: %s\n' "$1" >&2; exit 1 ;;
  esac
done

[[ -x "$HELPER_BIN" ]] || { printf 'Expected helper to exist and be executable: %s\n' "$HELPER_BIN" >&2; exit 1; }
[[ -n "$message_file" ]] || { printf 'Harness requires --message-file.\n' >&2; exit 1; }

helper_args=(resolve --message-file "$message_file")
if [[ -n "$session_key" ]]; then
  helper_args+=(--session-key "$session_key")
fi

helper_output="$("$HELPER_BIN" "${helper_args[@]}")"
helper_outcome="$(json_value "$helper_output" "outcome")"
decision_source="$(json_value "$helper_output" "decision_source")"
decision_path="$(json_value "$helper_output" "decision_path")"
prompt_question="$(json_value "$helper_output" "prompt.question")"
normal_stack_session_path=""

case "$helper_outcome" in
  needs_user_choice)
    first_response_kind="bypass_prompt"
    ;;
  enabled)
    first_response_kind="normal_stack"
    normal_stack_session_path="$(run_normal_stack)"
    ;;
  bypassed)
    first_response_kind="superpowers_bypassed"
    ;;
  *)
    first_response_kind="runtime_failure"
    ;;
esac

if [[ -n "$normal_stack_session_path" && -f "$normal_stack_session_path" ]]; then
  normal_stack_started="true"
else
  normal_stack_started="false"
fi

printf '{'
printf '"first_response_kind":"%s",' "$first_response_kind"
printf '"normal_stack_started":%s,' "$normal_stack_started"
printf '"helper_outcome":"%s",' "$helper_outcome"
printf '"decision_source":"%s",' "$decision_source"
printf '"decision_path":"%s",' "$decision_path"
printf '"normal_stack_session_path":"%s",' "$normal_stack_session_path"
printf '"prompt_question":"%s"' "$(printf '%s' "$prompt_question" | sed 's/\\/\\\\/g; s/"/\\"/g')"
printf '}\n'
