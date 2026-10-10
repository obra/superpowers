#!/usr/bin/env bash
# Opens an interactive Codex session set up like a converse.sh eval run.
#
# Use when you want to drive a brainstorming scenario yourself and see what
# the eval subjects see: a fresh CODEX_HOME with only the superpowers under
# test installed (account connectors and other plugins off), the scenario's
# fixture work dir, the model and effort our eval runs used, and optionally
# the using-superpowers bootstrap preloaded. Prints the scenario's opening
# message to paste in. Codex runs with its default sandbox and approvals,
# as converse.sh runs do unless CODEX_PERMISSIONS=yolo.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: try-codex.sh [-b] [-s SCENARIO] PLUGIN

  PLUGIN       A superpowers checkout dir, a git ref in this repo (e.g. main,
               dev) to archive and load, or "curated" for the account's
               curated release.
  -b           Preload using-superpowers before the first turn
               (CODEX_BOOTSTRAP=1; see codex-with-plugin.sh).
  -s SCENARIO  Scenario under scenarios/ (default ocd-app).

Environment:
  REAL_CODEX_BIN   codex to run (default: codex on PATH). The eval runs
                   used a build with openai/codex#51908.
  CODEX_MODEL      Model (default CSD_CODEX_MODEL if set, else
                   gpt-6.1-sol, the model our eval runs used).
  CODEX_EFFORT     Reasoning effort (default max).

Leaves the work dir and CODEX_HOME under $TMPDIR (paths printed at exit),
minus the copied ~/.codex/auth.json, which is removed when Codex exits.
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
SCENARIO=ocd-app BOOT=""
while getopts "bs:h" opt; do
  case $opt in
    b) BOOT=1 ;; s) SCENARIO=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
[ $# -eq 1 ] || { usage >&2; exit 2; }
SDIR="$SCRIPT_DIR/scenarios/$SCENARIO"
[ -f "$SDIR/opening.txt" ] || { echo "error: no scenario $SCENARIO" >&2; exit 2; }
[ -f "$HOME/.codex/auth.json" ] || { echo "error: no ~/.codex/auth.json; run codex login first" >&2; exit 2; }

TMP=$(mktemp -d "${TMPDIR:-/tmp}/try-codex.XXXXXX")
PLUGIN=$1
if [ "$PLUGIN" != curated ] && [ ! -d "$PLUGIN" ]; then
  git -C "$REPO" rev-parse -q --verify "$PLUGIN^{commit}" > /dev/null \
    || { echo "error: $PLUGIN is not a dir or a git ref" >&2; exit 2; }
  mkdir "$TMP/plugin" && git -C "$REPO" archive "$PLUGIN" | tar x -C "$TMP/plugin"
  PLUGIN="$TMP/plugin"
fi

WORK="$TMP/work"
mkdir "$WORK"
(cd "$WORK" && git init -q && { [ ! -f "$SDIR/setup.sh" ] || bash "$SDIR/setup.sh"; })

export CODEX_HOME="$TMP/codex-home"
mkdir "$CODEX_HOME"
cp "$HOME/.codex/auth.json" "$CODEX_HOME/"
printf '[projects."%s"]\ntrust_level = "trusted"\n' "$WORK" > "$CODEX_HOME/config.toml"

# Codex's remote plugin sync sometimes installs the account's curated
# superpowers and lists it beside the one under test (see
# codex-with-plugin.sh). Say so, since that session didn't test PLUGIN alone.
report() {
  rm -f "$CODEX_HOME/auth.json"
  echo; echo "work dir: $WORK"; echo "codex home: $CODEX_HOME"
  local first
  first=$(find "$CODEX_HOME/sessions" -name 'rollout*.jsonl' 2>/dev/null | sort | head -1 || true)
  [ -n "$first" ] && [ "$(grep -m1 skills_instructions "$first" | grep -o -- '- superpowers:brainstorming:' | wc -l)" -gt 1 ] \
    && echo "WARNING: this session also listed the curated superpowers; it may have used that instead. Run again."
  return 0
}
trap report EXIT
echo "Opening message for $SCENARIO (paste it in):"
echo "----"
cat "$SDIR/opening.txt"
echo "----"
read -r -p "Press Enter to start Codex. "

CODEX_BOOTSTRAP=$BOOT bash "$SCRIPT_DIR/codex-with-plugin.sh" "$PLUGIN" \
  -C "$WORK" -m "${CODEX_MODEL:-${CSD_CODEX_MODEL:-gpt-6.1-sol}}" \
  -c "model_reasoning_effort=\"${CODEX_EFFORT:-max}\"" \
  -c tools.experimental_request_user_input.enabled=false -c features.apps=false
