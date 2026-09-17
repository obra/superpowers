#!/usr/bin/env bash
# Micro-test (writing-skills style) for the writing-plans Review Focus wording:
# does a per-line ruling with a cost field (T1: cost criterion, T2: planner's
# free choice) reduce the number of lines earmarked for tests, versus the
# current test-per-line wording (T0)? One fresh `claude -p` on Opus 5 via
# Bedrock per rep, given a design and a complete plan; the output is the
# Review Focus section alone. Fixtures: wordstat (3 tasks) and ledgerlite (6).
#
# Usage: run.sh <out-dir> <reps>     runs every arm x fixture, <reps> each, 4 at a time
# Env:   MICRO_MODEL (default us.anthropic.claude-opus-5), AWS_REGION (default us-east-1)
# Reads: items, items marked Test vs Reviewer, whether undecodable input is named and
#        which tier it got. Invented behavior (a line that changes what the spec states)
#        needs a manual read of each out.md.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
OUT=$1; REPS=$2; MODEL=${MICRO_MODEL:-us.anthropic.claude-opus-5}
mkdir -p "$OUT"
one() {  # arm fixture rep
  local arm=$1 fx=$2 rep=$3 d="$OUT/$1-$2-$3"
  [ -e "$d/result.txt" ] && return 0
  mkdir -p "$d/repo" "$d/cfg"
  case "$fx" in
    wordstat)   cp "$ROOT/microtests/scope-vs-failure/template/plan.md" "$ROOT/microtests/scope-vs-failure/template/design.md" "$d/repo/" ;;
    ledgerlite) cp "$ROOT/fixtures/ledgerlite/plan.md" "$ROOT/fixtures/ledgerlite/design.md" "$d/repo/" ;;
  esac
  python3 -c "import json,os;json.dump({'hasCompletedOnboarding':True,'lastOnboardingVersion':'2.1.273','projects':{os.path.realpath('$d/repo'):{'hasTrustDialogAccepted':True}}},open('$d/cfg/.claude.json','w'))"
  ( cd "$d/repo" && CLAUDE_CONFIG_DIR="$d/cfg" CLAUDE_CODE_USE_BEDROCK=1 AWS_REGION=${AWS_REGION:-us-east-1} timeout 400 \
      claude -p "$(cat "$HERE/variants/$arm.txt")" --model "$MODEL" < /dev/null > "$d/out.md" 2> "$d/err.log" ) || true
  local items tests reviewer decode decode_tier
  items=$(grep -c -E '^(- |[0-9]+\. |\* )' "$d/out.md" || true)
  tests=$(grep -E '^(- |[0-9]+\. |\* )' "$d/out.md" | grep -c -i 'test' || true)
  reviewer=$(grep -E '^(- |[0-9]+\. |\* )' "$d/out.md" | grep -c -i 'reviewer checks\|reviewer confirms\|no test' || true)
  decode=$(grep -E '^(- |[0-9]+\. |\* )' "$d/out.md" | grep -i 'utf-8\|unicode\|decod\|binary\|non-text\|encoding' | head -1 || true)
  decode_tier=none; [ -n "$decode" ] && { printf '%s' "$decode" | grep -q -i 'reviewer checks\|reviewer confirms\|no test' && decode_tier=reviewer || decode_tier=test; }
  { echo "arm=$arm fixture=$fx rep=$rep"; echo "items: $items"; echo "test-lines: $tests"; echo "reviewer-lines: $reviewer"; echo "decode-tier: $decode_tier"; } > "$d/result.txt"
}
export -f one; export HERE ROOT OUT MODEL
for arm in $(ls "$HERE/variants" | sed 's/\.txt$//'); do for fx in wordstat ledgerlite; do for r in $(seq 1 "$REPS"); do echo "$arm $fx $r"; done; done; done \
  | xargs -P 4 -n 3 bash -c 'one "$0" "$1" "$2"'
echo "done: $(ls "$OUT" | wc -l | tr -d ' ') reps"
