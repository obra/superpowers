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

# Codex auto-discovers a plugin's hooks/hooks.json whenever the Codex manifest
# has no `hooks` field: load_plugin_hooks falls back to a hardcoded
# DEFAULT_HOOKS_CONFIG_FILE = "hooks/hooks.json" and registers it. That file is
# the Claude Code SessionStart hook, it is tracked in this repo, and this
# marketplace installs the whole repo root (source url "./"), so on Codex the
# fallback re-registers the SessionStart hook and its install-time trust prompt.
# Declaring an empty inline hooks object ({}) parses as an empty inline hook set
# and suppresses the auto-discovery. An absent field, an empty array ([]), and
# an empty inline list all collapse back to the fallback, so the value must be
# exactly an empty object.
hooks_config = repo_root / "hooks" / "hooks.json"
if not hooks_config.exists():
    raise AssertionError("hooks/hooks.json must exist (Claude Code SessionStart hook)")

assert_equal(
    manifest.get("hooks"),
    {},
    "Codex manifest must declare empty hooks {} to suppress hooks/hooks.json auto-discovery",
)

print("Codex marketplace manifest looks good")
PY
