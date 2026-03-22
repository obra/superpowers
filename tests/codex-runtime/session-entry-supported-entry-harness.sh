#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-session-entry"

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

case "$helper_outcome" in
  needs_user_choice)
    first_response_kind="bypass_prompt"
    normal_stack_started="false"
    ;;
  enabled)
    first_response_kind="normal_stack"
    normal_stack_started="true"
    ;;
  bypassed)
    first_response_kind="superpowers_bypassed"
    normal_stack_started="false"
    ;;
  *)
    first_response_kind="runtime_failure"
    normal_stack_started="false"
    ;;
esac

printf '{'
printf '"first_response_kind":"%s",' "$first_response_kind"
printf '"normal_stack_started":%s,' "$normal_stack_started"
printf '"helper_outcome":"%s",' "$helper_outcome"
printf '"decision_source":"%s",' "$decision_source"
printf '"decision_path":"%s",' "$decision_path"
printf '"prompt_question":"%s"' "$(printf '%s' "$prompt_question" | sed 's/\\/\\\\/g; s/"/\\"/g')"
printf '}\n'
