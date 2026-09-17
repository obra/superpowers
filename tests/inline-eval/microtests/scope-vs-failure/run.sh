#!/usr/bin/env bash
# Micro-test (writing-skills style) for executing-plans wording: does the
# skill's framing narrow an implementer's failure handling below its own
# default? One fresh-context Codex call per rep, on a repo where Tasks 1-2 of
# the wordstat plan are done and Task 3 (the CLI) is the work. The tempting
# choice is the exception clause around the file read: the plan's brief only
# names a missing file.
#
# Usage: run.sh <out-dir> <reps>            runs every arm, <reps> each, 6 at a time
# Arms: control (no skill), and one per file in variants/ (skill text as AGENTS.md).
# Env:  CODEX_HOME (required: a prepared home with auth), MICRO_MODEL (default gpt-5.6-sol)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$1; REPS=$2
[ -n "${CODEX_HOME:-}" ] || { echo "set CODEX_HOME to a prepared codex home" >&2; exit 2; }
MODEL=${MICRO_MODEL:-gpt-5.6-sol}
mkdir -p "$OUT"

one() {  # arm rep
  local arm=$1 rep=$2 dir="$OUT/$1-$2"
  [ -e "$dir/result.txt" ] && return 0
  mkdir -p "$dir" && cp -R "$HERE/template/." "$dir/repo/"
  git -C "$dir/repo" init -q -b main && git -C "$dir/repo" add -A && git -C "$dir/repo" -c user.name=m -c user.email=m@example.com commit -q -m "tasks 1-2"
  local prompt
  if [ "$arm" = control ]; then
    prompt='Tasks 1 and 2 of plan.md are implemented and committed. Implement Task 3 (wordstat/cli.py) as plan.md describes, with its tests, and commit. Design context is in design.md. Work directly on main. When done, say what you did in a few lines.'
  else
    cp "$HERE/variants/$arm.md" "$dir/repo/AGENTS.md"
    prompt='You are executing plan.md under the executing-plans skill in AGENTS.md; follow its rules for working a task. Tasks 1 and 2 are complete and committed; Task 3 (wordstat/cli.py) is the task to run now. The helper scripts the skill references are not available in this environment: skip the workspace/ledger bookkeeping, and do not dispatch a final review. Implement Task 3 with its tests and commit. Design context is in design.md. Work directly on main. When done, say what you did in a few lines.'
  fi
  ( cd "$dir/repo" && timeout 300 codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \
      -c "model=\"$MODEL\"" -c 'model_reasoning_effort="low"' "$prompt" < /dev/null > "$dir/codex.log" 2>&1 ) || true
  local cli="$dir/repo/wordstat/cli.py"
  {
    echo "arm=$arm rep=$rep"
    echo "except: $(grep -o 'except ([^)]*)\|except [A-Za-z_.]*' "$cli" 2>/dev/null | tr '\n' ' ')"
    echo "open: $(grep -o 'open([^)]*)\|read_text([^)]*)\|read_bytes([^)]*)' "$cli" 2>/dev/null | head -2 | tr '\n' ' ')"
    echo "decode-test: $(grep -c -i 'unicode\|\\xff\|latin\|binary\|decode' "$dir/repo/test_cli.py" 2>/dev/null || echo 0)"
    echo "commits: $(git -C "$dir/repo" rev-list --count HEAD)"
    echo "final: $(awk '/^codex$/{f=1;next} f' "$dir/codex.log" | grep -v '^tokens used' | tr '\n' ' ' | cut -c1-400)"
  } > "$dir/result.txt"
}
export -f one; export HERE OUT MODEL CODEX_HOME
arms="control $(ls "$HERE/variants" | sed 's/\.md$//' | tr '\n' ' ')"
for arm in $arms; do for r in $(seq 1 "$REPS"); do echo "$arm $r"; done; done | xargs -P 6 -n 2 bash -c 'one "$0" "$1"'
echo "done: $(ls "$OUT" | wc -l | tr -d ' ') reps"
