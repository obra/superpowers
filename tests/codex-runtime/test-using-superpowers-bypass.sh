#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_DOC="$REPO_ROOT/skills/using-superpowers/SKILL.md"

require_pattern() {
  local pattern="$1"
  if ! rg -n -F -- "$pattern" "$SKILL_DOC" >/dev/null; then
    echo "Missing using-superpowers bypass pattern: $pattern"
    exit 1
  fi
}

extract_preamble_bash() {
  awk '
    /^## Preamble \(run first\)$/ { in_heading=1; next }
    in_heading && /^```bash$/ { in_block=1; next }
    in_block && /^```$/ { exit }
    in_block { print }
  ' "$SKILL_DOC"
}

STATE_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

require_pattern '~/.superpowers/session-flags/using-superpowers/$PPID'
require_pattern 'if the session decision is `enabled`, continue into the normal stack'
require_pattern 'if the session decision is `bypassed` and the user did not explicitly request Superpowers, stop and bypass the rest of this skill'
require_pattern 'if the user explicitly requests Superpowers or explicitly names a Superpowers skill, rewrite the session decision to `enabled` and continue on the same turn'
require_pattern 'If the session decision file exists but contains malformed content:'
require_pattern 'do not compute `_SESSIONS`'
require_pattern 'If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to `enabled`:'
require_pattern 'If the bypass gate resolves to `enabled` for this turn, run the normal shared Superpowers stack before any further Superpowers behavior:'
require_pattern '_UPD=""'
require_pattern '_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d '\'' '\'')'
require_pattern '_CONTRIB=""'

PREAMBLE_BASH="$(extract_preamble_bash)"
if [[ -z "$PREAMBLE_BASH" ]]; then
  echo "Failed to extract using-superpowers preamble bash block"
  exit 1
fi

decision_path="$(
  SUPERPOWERS_STATE_DIR="$STATE_DIR" \
  bash -lc "$PREAMBLE_BASH"$'\n''printf "%s\n" "$_SP_USING_SUPERPOWERS_DECISION_PATH"'
)"

case "$decision_path" in
  "$STATE_DIR"/session-flags/using-superpowers/*) ;;
  *)
    echo "Expected decision path to live under the temp state dir, got: $decision_path"
    exit 1
    ;;
esac

mkdir -p "$(dirname "$decision_path")"

printf 'enabled\n' > "$decision_path"
require_pattern 'if the session decision is `enabled`, continue into the normal stack'

printf 'bypassed\n' > "$decision_path"
require_pattern 'if the session decision is `bypassed` and the user did not explicitly request Superpowers, stop and bypass the rest of this skill'

printf 'corrupt\nextra\n' > "$decision_path"
require_pattern 'ignore it for bypass purposes on that turn'
require_pattern 'treat future turns as undecided until a later write succeeds'

echo "using-superpowers bypass regression passed."
