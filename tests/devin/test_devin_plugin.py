"""Validate the Devin CLI integration.

`devin plugins install obra/superpowers` reads `.devin-plugin/plugin.json`
and auto-discovers the co-located `skills/` directory; Devin CLI surfaces
every installed skill's name + description in the system prompt at session
start and invokes them via its native `skill` tool, and its system prompt
already documents its own tools (subagent profiles, todo tracking, question
prompts), so there is no hook, injector, or tool-mapping scaffold to test.
What IS Devin-specific is the manifest.

Mirrors tests/kimi/test_plugin_manifest.py. CI-safe: does not require
`devin` installed.

Converted from tests/devin/test-devin-plugin.sh (bash wrapper around a
Python heredoc) — see superpowers#dev "tests: convert wrapped-Python bash
tests to plain pytest".
"""
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / ".devin-plugin" / "plugin.json"

# Devin CLI plugins carry skills only (auto-discovered from ./skills/); the
# manifest supports metadata + dependency lists, nothing executable.
UNSUPPORTED_FIELDS = ["skills", "hooks", "commands", "sessionStart", "contextFileName", "inject"]


def _load_manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_manifest_exists():
    assert MANIFEST_PATH.is_file(), f"manifest missing at {MANIFEST_PATH}"


def test_plugin_name():
    manifest = _load_manifest()
    assert manifest.get("name") == "superpowers", (
        f"plugin name: expected 'superpowers', got {manifest.get('name')!r}"
    )


def test_version_matches_package_json():
    manifest = _load_manifest()
    package = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    assert manifest.get("version") == package.get("version"), (
        f"manifest version {manifest.get('version')!r} != package.json version "
        f"{package.get('version')!r}"
    )


def test_no_unsupported_manifest_fields():
    manifest = _load_manifest()
    present = sorted(field for field in UNSUPPORTED_FIELDS if field in manifest)
    assert not present, "unsupported Devin manifest fields present: " + ", ".join(present)


def test_version_bump_registers_manifest():
    version_config = json.loads((REPO_ROOT / ".version-bump.json").read_text(encoding="utf-8"))
    entries = version_config.get("files")
    assert isinstance(entries, list), ".version-bump.json must contain files list"
    assert any(
        entry.get("path") == ".devin-plugin/plugin.json" and entry.get("field") == "version"
        for entry in entries
        if isinstance(entry, dict)
    ), ".version-bump.json must update .devin-plugin/plugin.json version"
