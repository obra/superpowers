"""Checks for the Codex Marketplace manifest.

Converted from tests/codex/test-marketplace-manifest.sh (bash wrapper
around a Python heredoc) — see superpowers#dev "tests: convert
wrapped-Python bash tests to plain pytest".
"""
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MARKETPLACE_PATH = REPO_ROOT / ".agents" / "plugins" / "marketplace.json"


def _load_marketplace():
    return json.loads(MARKETPLACE_PATH.read_text(encoding="utf-8"))


def test_marketplace_manifest_exists():
    assert MARKETPLACE_PATH.is_file(), (
        ".agents/plugins/marketplace.json must exist"
    )


def test_marketplace_name():
    marketplace = _load_marketplace()
    assert marketplace.get("name") == "superpowers-dev"


def test_marketplace_display_name():
    marketplace = _load_marketplace()
    assert marketplace.get("interface", {}).get("displayName") == "Superpowers Dev"


def test_plugins_is_a_list():
    marketplace = _load_marketplace()
    assert isinstance(marketplace.get("plugins"), list), "plugins must be a list"


def _superpowers_plugin_entry():
    marketplace = _load_marketplace()
    plugins = marketplace.get("plugins")
    assert isinstance(plugins, list), "plugins must be a list"
    matching = [p for p in plugins if p.get("name") == "superpowers"]
    assert len(matching) == 1, (
        f"superpowers plugin entry count: expected 1, got {len(matching)}"
    )
    return matching[0]


def test_exactly_one_superpowers_plugin_entry():
    _superpowers_plugin_entry()


def test_plugin_source():
    plugin = _superpowers_plugin_entry()
    assert plugin.get("source") == {"source": "url", "url": "./"}


def test_plugin_policy():
    plugin = _superpowers_plugin_entry()
    assert plugin.get("policy") == {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL",
    }


def test_plugin_category():
    plugin = _superpowers_plugin_entry()
    assert plugin.get("category") == "Developer Tools"


def test_codex_plugin_manifest_exists():
    plugin_manifest = REPO_ROOT / ".codex-plugin" / "plugin.json"
    assert plugin_manifest.is_file(), ".codex-plugin/plugin.json must exist"


def test_codex_plugin_manifest_name_matches_marketplace_entry():
    plugin = _superpowers_plugin_entry()
    plugin_manifest = REPO_ROOT / ".codex-plugin" / "plugin.json"
    manifest = json.loads(plugin_manifest.read_text(encoding="utf-8"))
    assert manifest.get("name") == plugin.get("name")


def test_codex_manifest_declares_empty_hooks_to_suppress_autodiscovery():
    # Codex auto-discovers a plugin's hooks/hooks.json whenever the Codex
    # manifest has no `hooks` field: load_plugin_hooks falls back to a
    # hardcoded DEFAULT_HOOKS_CONFIG_FILE = "hooks/hooks.json" and registers
    # it. That file is the Claude Code SessionStart hook, it is tracked in
    # this repo, and this marketplace installs the whole repo root (source
    # url "./"), so on Codex the fallback re-registers the SessionStart hook
    # and its install-time trust prompt. Declaring an empty inline hooks
    # object ({}) parses as an empty inline hook set and suppresses the
    # auto-discovery. An absent field, an empty array ([]), and an empty
    # inline list all collapse back to the fallback, so the value must be
    # exactly an empty object.
    hooks_config = REPO_ROOT / "hooks" / "hooks.json"
    assert hooks_config.is_file(), (
        "hooks/hooks.json must exist (Claude Code SessionStart hook)"
    )

    plugin_manifest = REPO_ROOT / ".codex-plugin" / "plugin.json"
    manifest = json.loads(plugin_manifest.read_text(encoding="utf-8"))
    assert manifest.get("hooks") == {}, (
        "Codex manifest must declare empty hooks {} to suppress "
        "hooks/hooks.json auto-discovery"
    )
