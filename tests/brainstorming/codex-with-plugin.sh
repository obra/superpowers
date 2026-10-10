#!/usr/bin/env bash
# Starts codex in a claude-session-driver worker with exactly one superpowers.
#
# Usage: codex-with-plugin.sh PLUGIN_ROOT|curated [codex args...]
#
# converse.sh writes a per-run launcher that calls this, and points
# CSD_CODEX_BIN at the launcher (tmux doesn't pass the controller's
# environment to the worker, so the plugin root travels as an argument).
#
# csd gives each worker a fresh CODEX_HOME. Codex there loads the account's
# remote plugins: the curated superpowers release, plus connectors such as
# sites, gmail, and slack that would let a test run publish or send things
# as the account owner. This script disables every remote plugin except the
# superpowers under test. (Disabling plugins does not remove the connector
# tools themselves; converse.sh also passes -c features.apps=false.)
# Disabling the curated superpowers doesn't reliably keep it out either:
# Codex's remote plugin sync can install it and list it beside the
# checkout under test (features.remote_plugin=false doesn't stop that).
# gate-score.sh marks those runs MIXED. With PLUGIN_ROOT, it installs that checkout (which needs
# .agents/plugins/marketplace.json) and disables the curated release; with
# "curated", it keeps the curated release.

set -euo pipefail

case ${1:-} in -h|--help) sed -n '2,/^$/s/^# \{0,1\}//p' "$0"; exit 0 ;; esac
: "${CODEX_HOME:?CODEX_HOME must be set (csd sets it per worker)}"
[ $# -ge 1 ] || { echo "usage: codex-with-plugin.sh PLUGIN_ROOT|curated [codex args...]" >&2; exit 2; }
ROOT=$1; shift
REAL=${REAL_CODEX_BIN:-$(command -v codex)}
LOG="$CODEX_HOME/codex-with-plugin.log"
CONFIG="$CODEX_HOME/config.toml"

fail() { echo "error: $1; see $LOG" >&2; cat "$LOG" >&2; exit 1; }

KEEP=superpowers@openai-curated-remote
if [ "$ROOT" != curated ]; then
  [ -f "$ROOT/.agents/plugins/marketplace.json" ] \
    || { echo "error: no .agents/plugins/marketplace.json in $ROOT" >&2; exit 2; }
  # Codex installs a local marketplace plugin with `git clone`, which drops
  # uncommitted edits. Snapshot the files as they are on disk into a
  # throwaway repo so Codex tests exactly what's there.
  SNAP="$CODEX_HOME/plugin-snapshot"
  { rsync -a --exclude .git "$ROOT/" "$SNAP/" \
    && git -C "$SNAP" init -q && git -C "$SNAP" add -A \
    && git -C "$SNAP" -c user.email=t@t -c user.name=t commit -qm snapshot; } > "$LOG" 2>&1 \
    || fail "snapshotting $ROOT failed"
  { "$REAL" plugin marketplace add "$SNAP" && "$REAL" plugin add superpowers@superpowers-dev; } >> "$LOG" 2>&1 \
    || fail "installing $ROOT into $CODEX_HOME failed"
  installed=$(find "$CODEX_HOME/plugins/cache/superpowers-dev" -path '*/skills/brainstorming/SKILL.md' 2>/dev/null | head -1 || true)
  cmp -s "$installed" "$ROOT/skills/brainstorming/SKILL.md" \
    || fail "installed brainstorming skill ($installed) differs from $ROOT"
  KEEP=superpowers@superpowers-dev
fi

enabled=$("$REAL" plugin list 2>> "$LOG" | awk '/installed, enabled/ {print $1}') \
  || fail "listing plugins in $CODEX_HOME failed"
for plugin in $enabled; do
  [ "$plugin" = "$KEEP" ] || printf '\n[plugins."%s"]\nenabled = false\n' "$plugin" >> "$CONFIG"
done
echo "kept $KEEP; disabled: $(echo $enabled | tr ' ' '\n' | grep -v -x "$KEEP" | tr '\n' ' ')" >> "$LOG"

# CODEX_BOOTSTRAP=1 puts the using-superpowers bootstrap, worded as the
# Claude Code SessionStart hook injects it, in this worker's global
# AGENTS.md, so Codex sees it before the first turn instead of finding the
# skill mid-turn. Stands in for a Codex session-start bootstrap.
if [ "${CODEX_BOOTSTRAP:-}" = 1 ]; then
  [ "$ROOT" != curated ] || { echo "error: CODEX_BOOTSTRAP needs a PLUGIN_ROOT" >&2; exit 2; }
  { printf '<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n'
    printf "**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n"
    cat "$ROOT/skills/using-superpowers/SKILL.md"
    printf '\n</EXTREMELY_IMPORTANT>\n'; } > "$CODEX_HOME/AGENTS.md"
fi

# csd always launches in YOLO mode; CODEX_PERMISSIONS=workspace-write runs
# with the sandbox and approval policy a default Codex install uses instead.
if [ "${CODEX_PERMISSIONS:-}" = workspace-write ]; then
  args=()
  for a in "$@"; do [ "$a" = --dangerously-bypass-approvals-and-sandbox ] || args+=("$a"); done
  # csd's event hooks run inside the sandbox and write under its worker dir.
  set -- -s workspace-write -a on-request -c "sandbox_workspace_write.writable_roots=[\"${CSD_WORKER_DIR:-/tmp/csd-workers}\"]" "${args[@]}"
fi

exec "$REAL" "$@"
