#!/usr/bin/env bash
# Multi-turn brainstorming test: a real Claude Code or Codex session (the subject)
# talks with a simulated human who has hidden intent.
#
# Use when you need to see how a brainstorming skill behaves past the first
# turn: whether it draws out the hidden intent, plays it back, sizes the
# work, writes the design, and holds the approval gate. Pair it with
# first-turn.sh, which is cheaper and only covers the opening.
#
# The subject is a claude-session-driver worker loading the superpowers
# plugin from PLUGIN_DIR. A Claude worker gets no user settings, CLAUDE.md,
# or MCP servers; a Codex worker gets csd's fresh CODEX_HOME, which still
# carries the account's remote plugins.
# The human is an isolated `claude -p` given the scenario's persona.md and
# the transcript so far; it may read files in the subject's work dir.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: converse.sh -s SCENARIO -a ARM -P PLUGIN_DIR [-H HARNESS] [-t MAX_TURNS] [-o OUT_DIR]

  -s SCENARIO    Directory name under scenarios/ (opening.txt, persona.md,
                 optional setup.sh run inside a fresh git work dir).
  -a ARM         Label for this arm, e.g. "old" or "new".
  -P PLUGIN_DIR  Superpowers checkout to load as the plugin. With -H codex,
                 "curated" instead uses the account's curated release.
  -H HARNESS     claude (default), codex, or pi. Pi runs on PI_PROVIDER
                 / PI_MODEL (default lunaroute / glm-5.3).
                 Codex runs at
                 CODEX_EFFORT (default max) on csd's model, or
                 CSD_CODEX_MODEL if set, using REAL_CODEX_BIN if set.
                 Its question tools are off; that needs a Codex built
                 after openai/codex#51908.
                 CODEX_ARGS adds more codex flags (word-split).
                 It runs with the sandbox and approvals a default Codex
                 install uses (CODEX_PERMISSIONS=workspace-write, the
                 default); CODEX_PERMISSIONS=yolo keeps csd's YOLO mode,
                 under which Codex builds without asking far more often.
                 CODEX_BOOTSTRAP=1 preloads using-superpowers in the
                 worker's global AGENTS.md, like a session-start hook.
  -t MAX_TURNS   Agent turns before giving up (default 16).
  -o OUT_DIR     Results root (default /tmp/brainstorming-converse/<timestamp>).

TURN_TIMEOUT sets how many seconds one subject turn may take (default 900).

Writes OUT_DIR/ARM/SCENARIO/ (plus codex-sessions/ for Codex):
  transcript.md   the conversation
  tools.jsonl     every tool call the subject made, in order
  files.txt       files in the work dir at the end (and its git log)
  workdir         path of the work dir, left in place for inspection
  base            the work dir's commit after setup.sh (empty if none)
Prints one summary line when done, with ended= one of: human (the
simulated human ended it), cap (hit MAX_TURNS), converse-failed,
wait-timeout, human-failed. Read the transcript yourself.

Requires: tmux, jq, codex for -H codex, and claude-session-driver at CSD (default
~/git/claude-session-driver/skills/driving-claude-code-sessions/scripts/csd)
with consent granted (`csd grant-consent`), at a version that accepts
Claude's folder-trust dialog when it defaults to "No, exit".
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSD=${CSD:-$HOME/git/claude-session-driver/skills/driving-claude-code-sessions/scripts/csd}
TURN_TIMEOUT=${TURN_TIMEOUT:-900}
SCENARIO="" ARM="" PLUGIN="" HARNESS=claude MAX_TURNS=16 OUT="/tmp/brainstorming-converse/$(date +%Y%m%d-%H%M%S)"
while getopts "s:a:P:H:t:o:h" opt; do
  case $opt in
    s) SCENARIO=$OPTARG ;; a) ARM=$OPTARG ;; P) PLUGIN=$OPTARG ;;
    H) HARNESS=$OPTARG ;; t) MAX_TURNS=$OPTARG ;; o) OUT=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
SDIR="$SCRIPT_DIR/scenarios/$SCENARIO"
[ -n "$SCENARIO" ] && [ -f "$SDIR/persona.md" ] && [ -f "$SDIR/opening.txt" ] \
  || { echo "error: scenario not found or incomplete: $SDIR" >&2; usage >&2; exit 2; }
[ -n "$ARM" ] || { echo "error: -a ARM is required" >&2; exit 2; }
case $HARNESS in
  claude) [ -f "$PLUGIN/.claude-plugin/plugin.json" ] || { echo "error: not a plugin checkout: $PLUGIN" >&2; exit 2; } ;;
  codex) [ "$PLUGIN" = curated ] || [ -f "$PLUGIN/.agents/plugins/marketplace.json" ] \
           || { echo "error: not a Codex plugin checkout (or \"curated\"): $PLUGIN" >&2; exit 2; } ;;
  pi) [ -f "$PLUGIN/skills/brainstorming/SKILL.md" ] || { echo "error: not a superpowers checkout: $PLUGIN" >&2; exit 2; } ;;
  *) echo "error: -H must be claude, codex, or pi" >&2; exit 2 ;;
esac
[ -x "$CSD" ] || { echo "error: csd not found at $CSD (set CSD)" >&2; exit 2; }

DEST="$OUT/$ARM/$SCENARIO"
mkdir -p "$DEST"
WORK=$(mktemp -d "/tmp/bs-$SCENARIO-$ARM.XXXX")
echo "$WORK" > "$DEST/workdir"
(cd "$WORK" && git init -q && { [ ! -f "$SDIR/setup.sh" ] || bash "$SDIR/setup.sh"; })
# The scenario's fixture commit (empty if none), so scoring can tell the
# subject's commits from the fixture's.
git -C "$WORK" rev-parse -q --verify HEAD > "$DEST/base" || true

NAME="bs-$ARM-$SCENARIO-$$"
if [ "$HARNESS" = claude ]; then
  # Claude asks whether to trust a new git repo, defaulting to "No, exit".
  # Mark the work dir trusted in ~/.claude.json so the worker starts unattended.
  # Parallel runs take a lock so one run's rewrite can't drop another's entry.
  CLAUDE_JSON="$HOME/.claude.json"
  ( flock 9
    jq --arg dir "$WORK" '.projects[$dir].hasTrustDialogAccepted = true' "$CLAUDE_JSON" > "$CLAUDE_JSON.converse.$$" \
      && mv "$CLAUDE_JSON.converse.$$" "$CLAUDE_JSON"
  ) 9> "${TMPDIR:-/tmp}/converse-claude-json.lock" \
    || { echo "error: could not mark $WORK trusted in $CLAUDE_JSON" >&2; exit 1; }
  LAUNCH=("$CSD" launch "$NAME" "$WORK" -- --setting-sources project --strict-mcp-config --plugin-dir "$PLUGIN")
elif [ "$HARNESS" = pi ]; then
  # Same launcher trick as Codex: the plugin root and model travel in a
  # per-run script, since the worker doesn't inherit this environment.
  printf '#!/usr/bin/env bash\nPI_PROVIDER=%q PI_MODEL=%q exec %q %q "$@"\n' "${PI_PROVIDER:-lunaroute}" "${PI_MODEL:-glm-5.3}" \
    "$SCRIPT_DIR/pi-with-plugin.sh" "$PLUGIN" > "$DEST/pi-launcher.sh"
  chmod +x "$DEST/pi-launcher.sh"
  export CSD_PI_BIN="$DEST/pi-launcher.sh"
  LAUNCH=("$CSD" launch --harness pi "$NAME" "$WORK")
else
  # The worker doesn't inherit this environment, so bake the plugin into a
  # launcher. codex-with-plugin.sh also turns off the account's connectors.
  printf '#!/usr/bin/env bash\nCODEX_PERMISSIONS=%q CODEX_BOOTSTRAP=%q REAL_CODEX_BIN=%q exec %q %q "$@"\n' "${CODEX_PERMISSIONS:-workspace-write}" "${CODEX_BOOTSTRAP:-}" "${REAL_CODEX_BIN:-$(command -v codex)}" \
    "$SCRIPT_DIR/codex-with-plugin.sh" "$PLUGIN" > "$DEST/codex-launcher.sh"
  chmod +x "$DEST/codex-launcher.sh"
  export CSD_CODEX_BIN="$DEST/codex-launcher.sh"
  # features.apps=false removes the account's connector tools (Sites, Gmail,
  # Slack, ...); disabling their plugins doesn't, and code mode can still
  # reach them, so a test run could publish or send things as the account.
  # Without its question tools, Codex asks in plain text, which the
  # simulated human can answer. The async one needs a Codex built after
  # openai/codex#51908 to respect this setting.
  LAUNCH=("$CSD" launch --harness codex "$NAME" "$WORK" -- -c "model_reasoning_effort=\"${CODEX_EFFORT:-max}\"" \
          -c tools.experimental_request_user_input.enabled=false -c features.apps=false ${CODEX_ARGS:-})
fi
if ! SHIM=$("${LAUNCH[@]}" 2> "$DEST/launch.log"); then
  echo "error: worker launch failed; see $DEST/launch.log" >&2
  exit 1
fi
# csd deletes a Codex worker's CODEX_HOME on stop; keep its session logs.
trap '"$SHIM" read-events --type pre_tool_use > "$DEST/tools.jsonl" 2>/dev/null || true
      [ "$HARNESS" != codex ] || cp -r "/tmp/csd-workers/homes/$NAME/sessions" "$DEST/codex-sessions" 2>/dev/null || true
      [ "$HARNESS" != pi ] || cp -r "/tmp/csd-workers/homes/$NAME/sessions" "$DEST/pi-sessions" 2>/dev/null || true
      "$SHIM" stop >/dev/null 2>&1 || true' EXIT

HUMAN_RULES='You are playing the human in a conversation with an AI assistant. Stay in character as described below. Reply with ONLY your next message to the assistant: no stage directions, no quotes, no commentary.

If the assistant offers to show you something in a browser, decline politely ("no thanks, text is fine") and carry on.

Output exactly <<WAIT>> instead of a message when the assistant has said it is waiting on something still running (a reviewer, a background task) and you have nothing to add.

Output exactly <<END>> instead of a message when any of these is true:
- the assistant has finished what you asked for;
- you have approved a description or design and the assistant has moved on to planning or building;
- the conversation is going in circles and you would give up.

Your character:
'
TRANSCRIPT="$DEST/transcript.md"
msg=$(cat "$SDIR/opening.txt")
: > "$TRANSCRIPT"
turns=0 ended=cap
while [ "$turns" -lt "$MAX_TURNS" ]; do
  if [ "$msg" = "<<WAIT>>" ]; then
    # The subject resumes on its own when its background work finishes.
    "$SHIM" wait-for-turn "$TURN_TIMEOUT" --after-line "$seen" > /dev/null \
      || { echo "$ARM $SCENARIO: no follow-up turn after <<WAIT>> at turn $turns" >&2; ended=wait-timeout; break; }
    # read-turn includes the raw task notification (the subagent's full
    # output); the human only sees what the subject said.
    reply=$("$SHIM" read-turn | awk '/^\*\*Prompt:\*\*/{skip=1} skip && /<\/task-notification>/{skip=0; next} !skip')
  else
    printf '## HUMAN\n\n%s\n\n' "$msg" >> "$TRANSCRIPT"
    reply=$("$SHIM" converse "$msg" "$TURN_TIMEOUT") || { echo "$ARM $SCENARIO: subject converse failed at turn $turns" >&2; ended=converse-failed; break; }
  fi
  # Codex workers have no events file until their first turn registers them.
  EVENTS=${EVENTS:-$("$SHIM" events-file)}
  seen=$(wc -l < "$EVENTS" | tr -d ' ')
  turns=$((turns + 1))
  printf '## AGENT\n\n%s\n\n' "$reply" >> "$TRANSCRIPT"
  msg=$(cd "$WORK" && claude -p --setting-sources project --disable-slash-commands --strict-mcp-config \
        --no-session-persistence --allowedTools Read Glob Grep --disallowedTools Write Edit Bash \
        --append-system-prompt "$HUMAN_RULES$(cat "$SDIR/persona.md")" \
        "Here is the conversation so far. Write your next message.

$(cat "$TRANSCRIPT")" < /dev/null) || { echo "$ARM $SCENARIO: simulated human failed at turn $turns" >&2; ended=human-failed; break; }
  msg=$(printf '%s' "$msg" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  if [ "$msg" = "<<END>>" ]; then ended=human; break; fi
done

{ (cd "$WORK" && find . -path ./.git -prune -o -type f -print | sort); echo "--- git log"; (cd "$WORK" && git log --oneline 2>/dev/null || true); } > "$DEST/files.txt"
echo "$ARM $SCENARIO turns=$turns ended=$ended -> $DEST"
