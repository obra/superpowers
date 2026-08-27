#!/usr/bin/env bash
# Regression tests for the narration gate's drift rule.
#
# The rule has to survive a real asymmetry: an ASR mangles unusual names, so
# exact word-matching produces false alarms — and, worse, a *dropped* word
# scores as more similar than two mispronounced ones. So the gate measures
# missing/invented CONTENT, and these tests pin that distinction.
#
# Usage: tests/proving-it-works-with-a-movie/test-narrate.sh
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
NARRATE="$HERE/../../skills/proving-it-works-with-a-movie/scripts/narrate"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
pass=0; fail=0

command -v uv >/dev/null || { echo "SKIP: uv not on PATH"; exit 0; }

drift() {  # drift <label> <expect-exit> <script> <heard>
  local label="$1" want="$2"
  printf '%s' "$3" > "$WORK/script.txt"
  printf '%s' "$4" > "$WORK/heard.txt"
  local out rc
  out="$("$NARRATE" --drift-check "$WORK/script.txt" "$WORK/heard.txt" 2>&1)"; rc=$?
  if [ "$rc" -eq "$want" ]; then
    echo "ok    $label  ($out)"; pass=$((pass + 1))
  else
    echo "FAIL  $label: exit $rc wanted $want ($out)"; fail=$((fail + 1))
  fi
}

SCRIPT="This is smevals studio. Every eval on the shelf is a folder of tasks and graders."

# the ASR mangles jargon on a perfectly good clip - must NOT fail
drift "mispronounced jargon passes" 0 "$SCRIPT" \
  "This is Mevil studio. Every Yvel on the shelf is a folder of tasks and graders."

# identical - must pass
drift "exact transcript passes" 0 "$SCRIPT" "$SCRIPT"

# the voice skipped a whole clause - must fail
drift "a dropped clause fails" 1 "$SCRIPT" "This is smevals studio."

# a chat model prepended a preamble - must fail
drift "an invented preamble fails" 1 "$SCRIPT" \
  "Sure, here it is, happy to help with that. This is smevals studio. Every eval on the shelf is a folder of tasks and graders."

# a silent/garbage clip - must fail
drift "an empty clip fails" 1 "$SCRIPT" "you"

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
