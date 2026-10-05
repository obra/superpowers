#!/usr/bin/env bash
# Multi-turn brainstorming test: a real Claude Code session (the subject)
# talks with a simulated human who has hidden intent.
#
# Use when you need to see how a brainstorming skill behaves past the first
# turn: whether it draws out the hidden intent, plays it back, sizes the
# work, writes the design, and holds the approval gate. Pair it with
# first-turn.sh, which is cheaper and only covers the opening.
#
# The subject is a claude-session-driver worker loading the superpowers
# plugin from PLUGIN_DIR, with no user settings, CLAUDE.md, or MCP servers.
# The human is an isolated `claude -p` given the scenario's persona.md and
# the transcript so far; it may read files in the subject's work dir.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: converse.sh -s SCENARIO -a ARM -P PLUGIN_DIR [-t MAX_TURNS] [-o OUT_DIR]

  -s SCENARIO    Directory name under scenarios/ (opening.txt, persona.md,
                 optional setup.sh run inside a fresh git work dir).
  -a ARM         Label for this arm, e.g. "old" or "new".
  -P PLUGIN_DIR  Superpowers checkout to load as the plugin.
  -t MAX_TURNS   Agent turns before giving up (default 16).
  -o OUT_DIR     Results root (default /tmp/brainstorming-converse/<timestamp>).

Writes OUT_DIR/ARM/SCENARIO/:
  transcript.md   the conversation
  tools.jsonl     every tool call the subject made, in order
  files.txt       files in the work dir at the end (and its git log)
  workdir         path of the work dir, left in place for inspection
Prints one summary line when done. Read the transcript yourself.

Requires: tmux, and claude-session-driver at CSD (default
~/git/claude-session-driver/skills/driving-claude-code-sessions/scripts/csd)
with consent granted (`csd grant-consent`), at a version that accepts
Claude's folder-trust dialog when it defaults to "No, exit".
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSD=${CSD:-$HOME/git/claude-session-driver/skills/driving-claude-code-sessions/scripts/csd}
SCENARIO="" ARM="" PLUGIN="" MAX_TURNS=16 OUT="/tmp/brainstorming-converse/$(date +%Y%m%d-%H%M%S)"
while getopts "s:a:P:t:o:h" opt; do
  case $opt in
    s) SCENARIO=$OPTARG ;; a) ARM=$OPTARG ;; P) PLUGIN=$OPTARG ;;
    t) MAX_TURNS=$OPTARG ;; o) OUT=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
SDIR="$SCRIPT_DIR/scenarios/$SCENARIO"
[ -n "$SCENARIO" ] && [ -f "$SDIR/persona.md" ] && [ -f "$SDIR/opening.txt" ] \
  || { echo "error: scenario not found or incomplete: $SDIR" >&2; usage >&2; exit 2; }
[ -n "$ARM" ] || { echo "error: -a ARM is required" >&2; exit 2; }
[ -f "$PLUGIN/.claude-plugin/plugin.json" ] || { echo "error: not a plugin checkout: $PLUGIN" >&2; exit 2; }
[ -x "$CSD" ] || { echo "error: csd not found at $CSD (set CSD)" >&2; exit 2; }

DEST="$OUT/$ARM/$SCENARIO"
mkdir -p "$DEST"
WORK=$(mktemp -d "/tmp/bs-$SCENARIO-$ARM.XXXX")
echo "$WORK" > "$DEST/workdir"
(cd "$WORK" && git init -q && { [ ! -f "$SDIR/setup.sh" ] || bash "$SDIR/setup.sh"; })

NAME="bs-$ARM-$SCENARIO-$$"
if ! SHIM=$("$CSD" launch "$NAME" "$WORK" -- --setting-sources project --strict-mcp-config --plugin-dir "$PLUGIN" 2> "$DEST/launch.log"); then
  echo "error: worker launch failed; see $DEST/launch.log" >&2
  exit 1
fi
trap '"$SHIM" read-events --type pre_tool_use > "$DEST/tools.jsonl" 2>/dev/null || true; "$SHIM" stop >/dev/null 2>&1 || true' EXIT

HUMAN_RULES='You are playing the human in a conversation with an AI assistant. Stay in character as described below. Reply with ONLY your next message to the assistant: no stage directions, no quotes, no commentary.

Output exactly <<END>> instead of a message when any of these is true:
- the assistant has finished what you asked for;
- you have approved a description or design and the assistant has moved on to planning or building;
- the conversation is going in circles and you would give up.

Your character:
'
TRANSCRIPT="$DEST/transcript.md"
msg=$(cat "$SDIR/opening.txt")
: > "$TRANSCRIPT"
turns=0 ended=no
while [ "$turns" -lt "$MAX_TURNS" ]; do
  printf '## HUMAN\n\n%s\n\n' "$msg" >> "$TRANSCRIPT"
  reply=$("$SHIM" converse "$msg" 900) || { echo "$ARM $SCENARIO: subject converse failed at turn $turns" >&2; break; }
  turns=$((turns + 1))
  printf '## AGENT\n\n%s\n\n' "$reply" >> "$TRANSCRIPT"
  msg=$(cd "$WORK" && claude -p --setting-sources project --disable-slash-commands --strict-mcp-config \
        --no-session-persistence --allowedTools Read Glob Grep --disallowedTools Write Edit Bash \
        --append-system-prompt "$HUMAN_RULES$(cat "$SDIR/persona.md")" \
        "Here is the conversation so far. Write your next message.

$(cat "$TRANSCRIPT")")
  if [ "$(printf '%s' "$msg" | tr -d '[:space:]')" = "<<END>>" ]; then ended=yes; break; fi
done

{ (cd "$WORK" && find . -path ./.git -prune -o -type f -print | sort); echo "--- git log"; (cd "$WORK" && git log --oneline 2>/dev/null); } > "$DEST/files.txt"
echo "$ARM $SCENARIO turns=$turns ended=$ended -> $DEST"
