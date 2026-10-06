#!/usr/bin/env bash
# Launch a blind pair of brainstorming sessions for one tester.
#
# Use when comparing two brainstorming skill versions with a tester (a person
# or a subagent playing one) who shouldn't know which version is which. Starts
# two claude-session-driver workers, each loading a different superpowers
# checkout, under neutral labels X and Y. The label-to-version mapping goes to
# a file the tester never sees.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: blind-pair.sh -t TESTER -A PLUGIN_A -B PLUGIN_B [-o OUT_DIR]

  -t TESTER    Tester name, e.g. "t1". Workers are named TESTER-x and TESTER-y.
  -A, -B       The two superpowers checkouts to compare.
  -o OUT_DIR   Where the hidden mapping and work dirs are recorded
               (default /tmp/brainstorming-blind).

Prints the two shim paths (X then Y) for the tester to drive with
`<shim> converse "<message>" 900`. Each worker runs in a fresh git repo
with no user settings, CLAUDE.md, or MCP servers.

The mapping is appended to OUT_DIR/mapping.txt: "TESTER X=<plugin> Y=<plugin>".
Stop workers afterwards with `<shim> stop`.
EOF
}

CSD=${CSD:-$HOME/git/claude-session-driver/skills/driving-claude-code-sessions/scripts/csd}
TESTER="" A="" B="" OUT=/tmp/brainstorming-blind
while getopts "t:A:B:o:h" opt; do
  case $opt in
    t) TESTER=$OPTARG ;; A) A=$OPTARG ;; B) B=$OPTARG ;; o) OUT=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
[ -n "$TESTER" ] || { echo "error: -t TESTER is required" >&2; exit 2; }
for p in "$A" "$B"; do
  [ -f "$p/.claude-plugin/plugin.json" ] || { echo "error: not a plugin checkout: $p" >&2; exit 2; }
done
mkdir -p "$OUT"

# Coin flip for which version sits behind X.
if [ $((RANDOM % 2)) -eq 0 ]; then X=$A Y=$B; else X=$B Y=$A; fi
echo "$TESTER X=$X Y=$Y" >> "$OUT/mapping.txt"

for label in x y; do
  plugin=$X; [ "$label" = y ] && plugin=$Y
  work=$(mktemp -d "$OUT/$TESTER-$label.XXXX")
  (cd "$work" && git init -q)
  echo "$TESTER-$label $work" >> "$OUT/workdirs.txt"
  "$CSD" launch "$TESTER-$label" "$work" -- --setting-sources project --strict-mcp-config --plugin-dir "$plugin" 2> "$OUT/$TESTER-$label.launch.log" \
    || { echo "error: launch failed for $TESTER-$label; see $OUT/$TESTER-$label.launch.log" >&2; exit 1; }
done
