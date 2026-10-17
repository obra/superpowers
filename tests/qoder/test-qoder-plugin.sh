#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="$REPO_ROOT/.qoder-plugin/plugin.json"
HOOKS="$REPO_ROOT/hooks/hooks-qoder.json"

node - "$MANIFEST" "$HOOKS" <<'NODE'
const fs = require("fs");

const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const hooks = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

if (manifest.name !== "superpowers") throw new Error("unexpected plugin name");
if (manifest.skills !== "./skills/") throw new Error("Qoder must use the canonical skills tree");
if (manifest.hooks !== "./hooks/hooks-qoder.json") throw new Error("Qoder must use its host-specific hook config");

const groups = hooks.hooks?.SessionStart;
if (!Array.isArray(groups) || groups.length !== 1) throw new Error("expected one SessionStart hook group");
if (groups[0].matcher !== "startup|resume|clear|compact|new") throw new Error("SessionStart sources are incomplete");

const entries = groups[0].hooks;
if (!Array.isArray(entries) || entries.length !== 1) throw new Error("expected one SessionStart hook");
const entry = entries[0];
if (entry.type !== "command") throw new Error("Qoder SessionStart must be a command hook");
if (entry.shell !== "bash") throw new Error("Qoder SessionStart must request the cross-platform bash dispatcher");
if (entry.async !== false) throw new Error("Qoder SessionStart must block until context is injected");
if (entry.command !== '"${QODER_PLUGIN_ROOT}/hooks/run-hook.cmd" session-start') {
  throw new Error(`unexpected Qoder hook command: ${entry.command}`);
}
NODE

jq -e '
  any(.files[];
    .path == ".qoder-plugin/plugin.json" and .field == "version")
' "$REPO_ROOT/.version-bump.json" >/dev/null

echo "Qoder plugin tests passed"
