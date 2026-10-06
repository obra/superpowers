#!/usr/bin/env bash
# First-turn micro-test for the brainstorming skill.
#
# Use when tuning brainstorming wording: it samples how a fresh agent opens a
# conversation for each prompt in prompts/, with and without a skill loaded.
# Cheap and fast; it complements (does not replace) the multi-turn quorum
# scenarios in evals/.
#
# Each sample is an isolated `claude -p` run: no user settings, no plugins,
# no hooks, no MCP, no skills. The arm's skill text (if any) is appended to
# the system prompt.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: first-turn.sh -a ARM [-s SKILL_FILE] [-n REPS] [-p PROMPT_GLOB] [-o OUT_DIR]
                     [-H claude|codex] [-m MODEL]

  -a ARM          Label for this arm, e.g. "none", "old", "new".
  -s SKILL_FILE   SKILL.md to load as the active skill. Omit for a no-skill control.
  -n REPS         Samples per prompt (default 5).
  -p PROMPT_GLOB  Which prompts to run, relative to prompts/ (default "*.txt").
  -o OUT_DIR      Results root (default /tmp/brainstorming-first-turn/<timestamp>).
  -j JOBS         Parallel runs (default 5).
  -H HARNESS      claude (default) or codex.
  -m MODEL        Model for the harness (e.g. sonnet, gpt-6-luna). Default:
                  the harness's own default.

Codex runs use a throwaway CODEX_HOME holding only a symlink to
~/.codex/auth.json, so your config.toml and global AGENTS.md don't load. The
skill goes in as developer_instructions.

Writes OUT_DIR/ARM/<prompt>/<rep>.md (the agent's final reply) and
<rep>.files (anything it wrote in its scratch dir). Prints one line per
sample: arm, prompt, rep, word count, question-mark count, files written.
Read every reply yourself before drawing conclusions.

Example:
  tests/brainstorming/first-turn.sh -a none
  tests/brainstorming/first-turn.sh -a old -s /tmp/old-brainstorming.md
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARM="" SKILL="" REPS=5 GLOB="*.txt" OUT="/tmp/brainstorming-first-turn/$(date +%Y%m%d-%H%M%S)" JOBS=5
HARNESS=claude MODEL=""
while getopts "a:s:n:p:o:j:H:m:h" opt; do
  case $opt in
    a) ARM=$OPTARG ;; s) SKILL=$OPTARG ;; n) REPS=$OPTARG ;;
    p) GLOB=$OPTARG ;; o) OUT=$OPTARG ;; j) JOBS=$OPTARG ;;
    H) HARNESS=$OPTARG ;; m) MODEL=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
[ -n "$ARM" ] || { echo "error: -a ARM is required" >&2; usage >&2; exit 2; }
[ -z "$SKILL" ] || [ -f "$SKILL" ] || { echo "error: skill file not found: $SKILL" >&2; exit 2; }
case $HARNESS in
  claude) ;;
  codex)
    [ -f "$HOME/.codex/auth.json" ] || { echo "error: no ~/.codex/auth.json; log in to codex first" >&2; exit 2; }
    CODEX_ISOLATED_HOME=$(mktemp -d /tmp/first-turn-codex-home.XXXX)
    ln -s "$HOME/.codex/auth.json" "$CODEX_ISOLATED_HOME/auth.json"
    export CODEX_ISOLATED_HOME ;;
  *) echo "error: -H must be claude or codex" >&2; exit 2 ;;
esac

run_one() {
  local prompt_file=$1 rep=$2
  local name; name=$(basename "$prompt_file" .txt)
  local dest="$OUT/$ARM/$name"
  local work; work=$(mktemp -d)
  mkdir -p "$dest"
  # Small fixture so code-ish prompts have something to look at.
  mkdir -p "$work/app/assets"
  printf '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#336699"/></svg>\n' > "$work/app/assets/icon.svg"
  printf '# My App\n\nA small web app.\n' > "$work/README.md"
  local before; before=$(cd "$work" && find . -type f | sort)

  local preamble=""
  [ -z "$SKILL" ] || preamble="The following skill is active for this conversation. Follow it.

$(cat "$SKILL")"
  local cmd stdout="$dest/$rep.md"
  if [ "$HARNESS" = codex ]; then
    cmd=(env CODEX_HOME="$CODEX_ISOLATED_HOME" codex exec --ignore-rules --ephemeral
         --skip-git-repo-check -s workspace-write -o "$dest/$rep.md")
    [ -z "$MODEL" ] || cmd+=(-m "$MODEL")
    # TOML literal multi-line string; Codex falls back to the raw text if it doesn't parse.
    [ -z "$preamble" ] || cmd+=(-c "developer_instructions='''$preamble'''")
    stdout="$dest/$rep.log"
  else
    cmd=(claude -p --setting-sources project --disable-slash-commands --strict-mcp-config
         --no-session-persistence --permission-mode acceptEdits)
    [ -z "$MODEL" ] || cmd+=(--model "$MODEL")
    [ -z "$preamble" ] || cmd+=(--append-system-prompt "$preamble")
  fi
  cmd+=("$(cat "$prompt_file")")
  if ! (cd "$work" && "${cmd[@]}" < /dev/null) > "$stdout" 2> "$dest/$rep.err"; then
    echo "$ARM $name $rep FAILED (see $dest/$rep.err)"
    return
  fi
  (cd "$work" && find . -type f | sort) | comm -13 <(echo "$before") - > "$dest/$rep.files"
  # Edits to the fixture count too.
  grep -q 336699 "$work/app/assets/icon.svg" || echo "./app/assets/icon.svg (modified)" >> "$dest/$rep.files"
  printf '%s %s %s words=%s qmarks=%s files=%s\n' "$ARM" "$name" "$rep" \
    "$(wc -w < "$dest/$rep.md" | tr -d ' ')" "$(tr -cd '?' < "$dest/$rep.md" | wc -c | tr -d ' ')" \
    "$(wc -l < "$dest/$rep.files" | tr -d ' ')"
}
export -f run_one
export ARM SKILL OUT HARNESS MODEL

for f in "$SCRIPT_DIR"/prompts/$GLOB; do
  for rep in $(seq 1 "$REPS"); do echo "$f $rep"; done
done | xargs -P "$JOBS" -n 2 bash -c 'run_one "$0" "$1"' | sort

echo "Replies in $OUT/$ARM/"
