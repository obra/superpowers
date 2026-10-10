#!/usr/bin/env bash
# Starts pi in a claude-session-driver worker with one superpowers checkout.
#
# Usage: pi-with-plugin.sh PLUGIN_ROOT [pi args...]
#
# converse.sh writes a per-run launcher that calls this, and points
# CSD_PI_BIN at the launcher (tmux doesn't pass the controller's
# environment to the worker, so the plugin root travels as an argument).
#
# csd stages ~/.pi/agent into a per-worker PI_CODING_AGENT_DIR but writes an
# empty models-store.json there. Providers that come from an extension
# (lunaroute) list their models in that file, so without it pi exits with
# 'Unknown provider'. This copies the real one in first.
#
# PI_PROVIDER and PI_MODEL pick the model (default lunaroute / glm-5.3).
# Superpowers loads the way quorum's pi launcher loads it: the checkout as
# an extension, and its skills directory with skill discovery off.

set -euo pipefail

: "${PI_CODING_AGENT_DIR:?PI_CODING_AGENT_DIR must be set (csd sets it per worker)}"
PLUGIN=${1:?usage: pi-with-plugin.sh PLUGIN_ROOT [pi args...]}
shift
[ -f "$PLUGIN/skills/brainstorming/SKILL.md" ] || { echo "error: not a superpowers checkout: $PLUGIN" >&2; exit 2; }

REAL_STORE="$HOME/.pi/agent/models-store.json"
[ ! -f "$REAL_STORE" ] || cp "$REAL_STORE" "$PI_CODING_AGENT_DIR/models-store.json"

exec "${REAL_PI_BIN:-pi}" --provider "${PI_PROVIDER:-lunaroute}" --model "${PI_MODEL:-glm-5.3}" \
  -e "$PLUGIN" --no-skills --skill "$PLUGIN/skills" "$@"
