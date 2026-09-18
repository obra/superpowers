#!/usr/bin/env bash
# Micro-test for keeping later plans true. Repo: plan 1 (engine) is built and
# committed with Game.Advance; plan 2 in plans/ still says Game.Tick (its
# Consumes line, test names, steps). One fresh single-shot session per rep is
# told plan 1 is done and asked to set up plan 2 and stop before its Task 1.
# Arms: X0 no instruction; X1 the per-ruling "plans touched" slot (C3);
# X2 a boundary scan of the next plan against the code as built.
# Usage: run.sh <out-dir> <reps>    (Sonnet 5 via Bedrock; MICRO_MODEL overrides)
# Reads: whether plan 2's Tick lines were changed to Advance, and how many remain.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); OUT=$1; REPS=$2; MODEL=${MICRO_MODEL:-us.anthropic.claude-sonnet-5}
mkdir -p "$OUT"
one() {  # arm rep
  local arm=$1 rep=$2 d="$OUT/$1-$2"
  [ -e "$d/result.txt" ] && return 0
  mkdir -p "$d/cfg"; rsync -a "$HERE/repo/" "$d/repo/"
  git -C "$d/repo" init -q -b main && git -C "$d/repo" add -A && git -C "$d/repo" -c user.name=m -c user.email=m@example.com commit -q -m "plan 1 (engine) complete; plans in plans/"
  python3 -c "import json,os;json.dump({'hasCompletedOnboarding':True,'lastOnboardingVersion':'2.1.273','projects':{os.path.realpath('$d/repo'):{'hasTrustDialogAccepted':True}}},open('$d/cfg/.claude.json','w'))"
  local guide; guide=$(cat "$HERE/variants/$arm.txt")
  local prompt="You are executing the implementation plans in plans/ for this project, in order, under the superpowers:executing-plans skill; design.md is the spec. Plan 1 (the engine, plans/*-1-engine.md) is complete and committed: see git log and internal/game. You are about to start plan 2 (plans/*-2-playable-terminal.md). $guide

Do the setup for plan 2 now and stop before its Task 1's first test. You may edit files under plans/ and write ledger notes; do not write any Go. When you stop, say in a few lines what you checked and what you changed."
  ( cd "$d/repo" && CLAUDE_CONFIG_DIR="$d/cfg" CLAUDE_CODE_USE_BEDROCK=1 AWS_REGION=${AWS_REGION:-us-east-1} timeout 600 claude -p "$prompt" --model "$MODEL" --allowedTools "Read,Edit,Write,Bash,Grep,Glob" < /dev/null > "$d/out.md" 2> "$d/err.log" ) || true
  local p2; p2=$(ls "$d/repo"/plans/*-2-*.md)
  { echo "arm=$arm rep=$rep"; echo "plan2-tick-remaining: $(grep -c 'Tick' "$p2" || true)"; echo "plan2-advance-now: $(grep -c 'Advance' "$p2" || true)"; echo "plan2-edited: $(git -C "$d/repo" status --short plans/ | wc -l | tr -d ' ')"; echo "mentions-mismatch: $(grep -c -i 'tick' "$d/out.md" || true)"; } > "$d/result.txt"
}
export -f one; export HERE OUT MODEL
for arm in $(ls "$HERE/variants" | sed 's/\.txt$//'); do for r in $(seq 1 "$REPS"); do echo "$arm $r"; done; done | xargs -P 4 -n 2 bash -c 'one "$0" "$1"'
echo "done: $(ls "$OUT" | wc -l | tr -d ' ') reps"
