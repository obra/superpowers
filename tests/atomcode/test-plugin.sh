#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MARKETPLACE="$REPO_ROOT/.claude-plugin/marketplace.json"
MANIFEST="$REPO_ROOT/.claude-plugin/plugin.json"
HOOKS_JSON="$REPO_ROOT/hooks/hooks.json"
SESSION_START="$REPO_ROOT/hooks/session-start"
TOOLS_REF="$REPO_ROOT/skills/using-superpowers/references/atomcode-tools.md"

FAILURES=0
pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

echo "AtomCode plugin compatibility tests"

# 1. Marketplace manifest must parse as AtomCode expects (`.claude-plugin/`
#    is AtomCode's fallback marketplace manifest location) and expose the
#    plugin via an inline `source` (AtomCode's PluginSource::Inline).
if python3 - "$MARKETPLACE" <<'PY'
import json, sys
from pathlib import Path

marketplace = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

def need(cond, label):
    if not cond:
        raise AssertionError(label)

need(marketplace.get("name"), "marketplace name required")
need(isinstance(marketplace.get("plugins"), list) and marketplace["plugins"],
     "marketplace plugins list required")
plugin = marketplace["plugins"][0]
need(plugin.get("name") == "superpowers", "first plugin must be superpowers")
need(plugin.get("source") == "./", "plugin source must be an inline ./ path")
need(plugin.get("version"), "plugin version required")

print("  marketplace manifest OK")
PY
then pass "marketplace.json is consumable by AtomCode"; else fail "marketplace.json is consumable by AtomCode"; fi

# 2. Plugin manifest: AtomCode defaults the skills dir to `skills/` when the
#    field is absent, and ignores unknown fields — assert the tracked manifest
#    stays compatible (no fields AtomCode would choke on).
if python3 - "$MANIFEST" <<'PY'
import json, sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

def need(cond, label):
    if not cond:
        raise AssertionError(label)

need(manifest.get("name") == "superpowers", "plugin name")
need(manifest.get("version"), "plugin version")

print("  plugin manifest OK")
PY
then pass "plugin.json is consumable by AtomCode"; else fail "plugin.json is consumable by AtomCode"; fi

# 3. hooks.json: AtomCode accepts the Claude Code schema (event names are
#    case-insensitive) and runs the command via `sh -c`, expanding
#    ${CLAUDE_PLUGIN_ROOT} — which AtomCode exports. Assert the SessionStart
#    registration uses that variable in the command.
if node -e '
const hooks = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const groups = hooks.hooks.SessionStart;
if (!groups) { console.error("missing SessionStart"); process.exit(1); }
const command = groups[0].hooks[0].command;
if (!command.includes("${CLAUDE_PLUGIN_ROOT}")) {
  console.error(`SessionStart command must use ${"${CLAUDE_PLUGIN_ROOT}"}: ${command}`);
  process.exit(1);
}
' "$HOOKS_JSON"; then
    pass "hooks.json SessionStart command expands via AtomCode-exported CLAUDE_PLUGIN_ROOT"
else
    fail "hooks.json SessionStart command expands via AtomCode-exported CLAUDE_PLUGIN_ROOT"
fi

# 4. The session-start hook output: AtomCode's SessionStart handler parses the
#    last JSON line as hookSpecificOutput.additionalContext (falling back to
#    plain stdout). Running under CLAUDE_PLUGIN_ROOT (which AtomCode sets) must
#    emit exactly that nested shape, with no top-level context fields.
hook_output="$(env -i PATH="${PATH:-}" CLAUDE_PLUGIN_ROOT="$REPO_ROOT" bash "$SESSION_START" 2>&1)"
if printf '%s' "$hook_output" | node -e '
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
let payload;
try { payload = JSON.parse(input); }
catch (e) { console.error(`invalid JSON: ${e.message}`); process.exit(1); }
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const out = payload.hookSpecificOutput;
if (!out || typeof out !== "object" || Array.isArray(out)) {
  console.error("missing hookSpecificOutput object"); process.exit(1);
}
if (has(payload, "additionalContext") || has(payload, "additional_context")) {
  console.error("nested output also included a top-level context field"); process.exit(1);
}
if (typeof out.additionalContext !== "string" || !out.additionalContext.includes("EXTREMELY_IMPORTANT")) {
  console.error("additionalContext missing bootstrap content"); process.exit(1);
}
'; then
    pass "session-start emits hookSpecificOutput.additionalContext under CLAUDE_PLUGIN_ROOT (AtomCode shape)"
else
    fail "session-start emits hookSpecificOutput.additionalContext under CLAUDE_PLUGIN_ROOT (AtomCode shape)"
    echo "    output:"
    echo "$hook_output" | sed 's/^/      /'
fi

# 5. Tool mapping reference exists and is reachable from the bootstrap skill.
if [[ -f "$TOOLS_REF" ]] && grep -q "atomcode-tools.md" "$REPO_ROOT/skills/using-superpowers/SKILL.md"; then
    pass "atomcode-tools.md exists and is linked from SKILL.md Platform Adaptation"
else
    fail "atomcode-tools.md exists and is linked from SKILL.md Platform Adaptation"
fi

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
