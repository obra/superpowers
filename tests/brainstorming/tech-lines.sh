#!/usr/bin/env bash
# Shows how each converse.sh run handled technology choices.
#
# Use after a batch of converse.sh runs when checking whether the subject
# asked about, proposed, or silently picked a platform or stack. For each
# run it prints how the run ended, the subject's lines that mention
# technology, and any code files left in the work dir. It is a reading aid:
# read the full transcript before scoring a run.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: tech-lines.sh OUT_DIR [SCENARIO]

  OUT_DIR    A converse.sh results root (contains ARM/SCENARIO/transcript.md).
  SCENARIO   Only show runs of this scenario.

Environment:
  TECH_LINES_MAX   Matching lines shown per run (default 12).
EOF
}

[ $# -ge 1 ] && [ -d "$1" ] || { usage >&2; exit 2; }
OUT=$1 ONLY=${2:-}
MAX=${TECH_LINES_MAX:-12}
PATTERN='swift|native|pwa|web ?app|home screen|browser|react|vue|svelte|vite|flask|django|sqlite|indexeddb|postgres|database|framework|stack|platform|xcode|android|iphone|tablet|technolog|built with|how (it|this).s built|language'

for t in "$OUT"/*/*/transcript.md; do
  run=${t#"$OUT"/}; run=${run%/transcript.md}
  [ -z "$ONLY" ] || [ "${run#*/}" = "$ONLY" ] || continue
  dir=$(dirname "$t")
  turns=$(grep -c '^## AGENT' "$t" || true)
  echo "=== $run ($turns agent turns)"
  awk '/^## AGENT/{a=1; next} /^## HUMAN/{a=0} a' "$t" \
    | grep -i -E "$PATTERN" | cut -c1-220 | head -n "$MAX" | sed 's/^/  /' || true
  if [ -f "$dir/files.txt" ]; then
    code=$(sed '/^--- git log/q' "$dir/files.txt" | grep -v -E '^--- |node_modules|^\./docs/|^\./\.' \
           | grep -E '\.(js|ts|tsx|jsx|html|css|swift|py|json)$' | wc -l)
    echo "  [code files at end: $code]"
  fi
done
