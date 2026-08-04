#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MARKETPLACE="$REPO_ROOT/.agents/plugins/marketplace.json"

python3 - "$MARKETPLACE" "$REPO_ROOT" <<'PY'
import json
import sys
from pathlib import Path

marketplace_path = Path(sys.argv[1])
repo_root = Path(sys.argv[2])

if not marketplace_path.exists():
    raise AssertionError(".agents/plugins/marketplace.json must exist")

marketplace = json.loads(marketplace_path.read_text(encoding="utf-8"))

def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")

assert_equal(marketplace.get("name"), "superpowers-dev", "marketplace name")
assert_equal(
    marketplace.get("interface", {}).get("displayName"),
    "Superpowers Dev",
    "marketplace display name",
)

plugins = marketplace.get("plugins")
if not isinstance(plugins, list):
    raise AssertionError("plugins must be a list")

matching_plugins = [plugin for plugin in plugins if plugin.get("name") == "superpowers"]
assert_equal(len(matching_plugins), 1, "superpowers plugin entry count")

plugin = matching_plugins[0]
assert_equal(plugin.get("source"), {"source": "url", "url": "./"}, "plugin source")
assert_equal(
    plugin.get("policy"),
    {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
    "plugin policy",
)
assert_equal(plugin.get("category"), "Developer Tools", "plugin category")

plugin_manifest = repo_root / ".codex-plugin" / "plugin.json"
if not plugin_manifest.exists():
    raise AssertionError(".codex-plugin/plugin.json must exist")

manifest = json.loads(plugin_manifest.read_text(encoding="utf-8"))
assert_equal(manifest.get("name"), plugin.get("name"), "plugin manifest name")

# The Codex manifest must declare its hooks explicitly. An absent field makes
# load_plugin_hooks fall back to a hardcoded DEFAULT_HOOKS_CONFIG_FILE =
# "hooks/hooks.json" — the Claude Code SessionStart hook, which injects the
# bootstrap at startup and must not run on Codex. The explicit pointer both
# registers the Codex compaction re-injection hook and overrides that fallback.
hooks_config = repo_root / "hooks" / "hooks.json"
if not hooks_config.exists():
    raise AssertionError("hooks/hooks.json must exist (Claude Code SessionStart hook)")

assert_equal(
    manifest.get("hooks"),
    "./hooks/hooks-codex.json",
    "Codex manifest must point hooks at the Codex hook config (an absent field "
    "falls back to auto-discovering the Claude Code hooks/hooks.json)",
)

codex_hooks_path = repo_root / "hooks" / "hooks-codex.json"
if not codex_hooks_path.exists():
    raise AssertionError("hooks/hooks-codex.json must exist (Codex manifest points at it)")

codex_hooks = json.loads(codex_hooks_path.read_text(encoding="utf-8"))
session_start = codex_hooks["hooks"]["SessionStart"]
assert_equal(len(session_start), 1, "Codex SessionStart hook group count")
assert_equal(session_start[0].get("matcher"), "compact", "Codex hook matcher")
entry = session_start[0]["hooks"][0]
assert_equal(entry.get("type"), "command", "Codex hook type")
command = entry.get("command", "")
if "${PLUGIN_ROOT}" not in command or not command.endswith("session-start-codex"):
    raise AssertionError(
        f"Codex hook command must run session-start-codex via ${{PLUGIN_ROOT}}: {command!r}"
    )

print("Codex marketplace manifest looks good")
PY
