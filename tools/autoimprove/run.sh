#!/bin/bash
# Auto-Improve Loop v1 — Entry Point
# Usage: ./tools/autoimprove/run.sh [max_turns]
#   max_turns: number of Claude turns (default: 10)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAX_TURNS="${1:-10}"

cd "$REPO_ROOT"

echo "=== Auto-Improve v1 ==="
echo "Repository: $REPO_ROOT"
echo "Max turns: $MAX_TURNS"
echo "Time: $(date)"
echo ""

echo "=== Baseline Score ==="
node tools/autoimprove/eval.js
echo ""

# Save baseline SHA for post-loop safety check
BASELINE_SHA=$(git rev-parse HEAD)

echo "=== Starting Optimization Loop ==="
claude -p "$(cat tools/autoimprove/prompt.md)" \
  --max-turns "$MAX_TURNS" \
  --dangerously-skip-permissions

echo ""
echo "=== Final Score ==="
node tools/autoimprove/eval.js
echo ""

# Safety check: verify only skill-rules.json was modified
CHANGED_FILES=$(git diff --name-only "$BASELINE_SHA" HEAD 2>/dev/null | grep -v '^hooks/skill-rules.json$' || true)
if [ -n "$CHANGED_FILES" ]; then
  echo "=== WARNING: Unexpected files modified ==="
  echo "$CHANGED_FILES"
  echo "The loop may have edited files outside its allowed scope."
  echo ""
fi

if [ -f tools/autoimprove/results.tsv ]; then
  echo "=== Experiment Log ==="
  cat tools/autoimprove/results.tsv
else
  echo "(no experiment log generated)"
fi
