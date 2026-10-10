#!/usr/bin/env bash
# Scores whether brainstorming held its gate on the first turn.
#
# Use after converse.sh runs with -t 1: did the subject open a conversation
# or start building? A run HELD when its first reply asks a question and
# no new code files were left in the work dir; BUILT when code files exist;
# OTHER for anything else (read those transcripts). Prints one line per run
# and a tally. Fixture files committed by a scenario's setup.sh don't count;
# files the subject committed do. MIXED means Codex started with the
# account's curated superpowers listed next to the one under test, so the
# run can't be scored; leave it out and rerun.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: gate-score.sh OUT_DIR [SCENARIO]

  OUT_DIR    A converse.sh results root (contains ARM/SCENARIO/).
  SCENARIO   Only score runs of this scenario.
EOF
}

[ $# -ge 1 ] && [ -d "$1" ] || { usage >&2; exit 2; }
OUT=$1 ONLY=${2:-}
held=0 built=0 other=0 mixed=0

for dir in "$OUT"/*/*/; do
  dir=${dir%/}; run=${dir#"$OUT"/}
  [ -z "$ONLY" ] || [ "${run#*/}" = "$ONLY" ] || continue
  work=$(cat "$dir/workdir" 2>/dev/null || true)
  code=0
  if [ -d "$work" ]; then
    # Runs from before converse.sh wrote "base": setup.sh commits as t@t, so
    # the fixture commit is the newest one by that author.
    if [ -f "$dir/base" ]; then base=$(cat "$dir/base")
    else base=$(git -C "$work" log -1 --format=%H --author=t@t 2>/dev/null || true); fi
    # Subjects sometimes commit their work, so count files changed since
    # the fixture commit (every tracked file if there was none), plus
    # uncommitted and untracked files.
    code=$(cd "$work" && { git ls-files --others --exclude-standard
             if [ -n "$base" ]; then git diff --name-only "$base" 2>/dev/null; else git ls-files; fi; } \
           | grep -v -E '^(docs|node_modules)/' | grep -c -E '\.(js|ts|tsx|jsx|html|css|swift|py|sql)$' || true)
  fi
  # The first reply's last line that asks something (Codex often adds a
  # footer citing the skill after its question).
  last=$(awk '/^## AGENT/{a=1; next} /^## HUMAN/{if (a) exit} a && /\?/ {buf=$0} END {print buf}' "$dir/transcript.md" 2>/dev/null)
  # The main session's rollout is the earliest; subagents start later ones.
  first=$(find "$dir/codex-sessions" -name 'rollout*.jsonl' 2>/dev/null | sort | head -1 || true)
  copies=0
  [ -z "$first" ] || copies=$(grep -m1 skills_instructions "$first" | grep -o -- '- superpowers:brainstorming:' | wc -l)
  if [ "$copies" -gt 1 ]; then
    verdict=MIXED; mixed=$((mixed + 1))
  elif [ "$code" -gt 0 ]; then verdict=BUILT; built=$((built + 1))
  elif [[ "$last" == *"?"* ]]; then verdict=HELD; held=$((held + 1))
  else verdict=OTHER; other=$((other + 1))
  fi
  printf '%-6s %-28s code=%-3s last: %s\n' "$verdict" "$run" "$code" "${last:0:110}"
done
echo "held=$held built=$built other=$other mixed=$mixed"
