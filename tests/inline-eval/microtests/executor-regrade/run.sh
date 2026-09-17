#!/usr/bin/env bash
# Micro-test (writing-skills style) for executing-plans' re-grade rule: given
# the final reviewer's report (a real gpt-6-astra review of the wordstat branch
# that files the undecodable-input crash as Minor), does the executor move it
# into the fix pass? Arms: E0 no re-grade guidance, E1 the current wording
# (names symptoms: unhandled exception, traceback...), E2 the general wording
# (grade by effect on a reasonable person). One fresh single-shot session per
# rep on the reviewer-scope repo; the session only sorts, it does not fix.
#
# Usage: run.sh <out-dir> <reps>   runs every arm x driver, <reps> each, 4 at a time
# Drivers: claude (Opus 5 via Bedrock, fresh config dir) and codex (gpt-5.6-sol low,
#          CODEX_HOME required). Env: MICRO_CLAUDE_MODEL, MICRO_CODEX_MODEL, AWS_REGION.
# Reads: which bucket the decode finding landed in (fix pass vs deferred).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
OUT=$1; REPS=$2; mkdir -p "$OUT"
CM=${MICRO_CLAUDE_MODEL:-us.anthropic.claude-opus-5}; XM=${MICRO_CODEX_MODEL:-gpt-5.6-sol}
one() {  # arm driver rep
  local arm=$1 drv=$2 rep=$3 d="$OUT/$1-$2-$3"
  [ -e "$d/result.txt" ] && return 0
  mkdir -p "$d/repo" "$d/cfg"; cp -R "$ROOT/microtests/reviewer-scope/repo/." "$d/repo/"; cp "$HERE/review.txt" "$d/repo/REVIEW.md"
  local prompt; prompt="You executed plan.md inline (design.md is the spec) on this repo and dispatched the final whole-branch review; its report is in REVIEW.md. Now apply this instruction from the executing-plans skill:

$(cat "$HERE/variants/$arm.txt")

Do NOT fix anything and do not edit files. Output only two lists, in markdown: '## Fix pass' (each finding entering it, one line each, with the grade you settled on) and '## Deferred minors' (one line each). Nothing else."
  case "$drv" in
    claude)
      python3 -c "import json,os;json.dump({'hasCompletedOnboarding':True,'lastOnboardingVersion':'2.1.273','projects':{os.path.realpath('$d/repo'):{'hasTrustDialogAccepted':True}}},open('$d/cfg/.claude.json','w'))"
      ( cd "$d/repo" && CLAUDE_CONFIG_DIR="$d/cfg" CLAUDE_CODE_USE_BEDROCK=1 AWS_REGION=${AWS_REGION:-us-east-1} timeout 300 claude -p "$prompt" --model "$CM" < /dev/null > "$d/out.md" 2> "$d/err.log" ) || true ;;
    codex)
      ( cd "$d/repo" && timeout 300 codex exec --skip-git-repo-check -s read-only -c "model=\"$XM\"" -c 'model_reasoning_effort="low"' "$prompt" < /dev/null > "$d/codex.log" 2>&1 ) || true
      awk '/^codex$/{f=1;next} /^tokens used/{f=0} f' "$d/codex.log" > "$d/out.md" ;;
  esac
  local fix; fix=$(awk '/^## *Fix pass/{f=1;next} /^## /{f=0} f' "$d/out.md" | grep -c -i 'utf\|unicode\|decod\|binary\|encoding' || true)
  local def; def=$(awk '/^## *Deferred/{f=1;next} /^## /{f=0} f' "$d/out.md" | grep -c -i 'utf\|unicode\|decod\|binary\|encoding' || true)
  { echo "arm=$arm driver=$drv rep=$rep"; echo "decode-in-fix-pass: $fix"; echo "decode-deferred: $def"; } > "$d/result.txt"
}
export -f one; export HERE ROOT OUT CM XM
drivers="claude"; [ -n "${CODEX_HOME:-}" ] && drivers="claude codex"
for arm in $(ls "$HERE/variants" | sed 's/\.txt$//'); do for drv in $drivers; do for r in $(seq 1 "$REPS"); do echo "$arm $drv $r"; done; done; done \
  | xargs -P 4 -n 3 bash -c 'one "$0" "$1" "$2"'
echo "done: $(ls "$OUT" | wc -l | tr -d ' ') reps"
