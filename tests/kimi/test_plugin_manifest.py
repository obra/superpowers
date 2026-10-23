"""Checks for the Kimi plugin manifest.

Converted from tests/kimi/test-plugin-manifest.sh (bash wrapper around a
Python heredoc) — see superpowers#dev "tests: convert wrapped-Python bash
tests to plain pytest".
"""
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / ".kimi-plugin" / "plugin.json"

REQUIRED_INSTRUCTION_TOKENS = [
    "AskUserQuestion",
    "TodoList",
    "Agent",
    "Skill",
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Grep",
    "Glob",
    "FetchURL",
    "WebSearch",
]

UNSUPPORTED_FIELDS = [
    "tools",
    "commands",
    "hooks",
    "apps",
    "inject",
    "configFile",
    "config_file",
    "bootstrap",
]


def _load_manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_manifest_exists():
    assert MANIFEST_PATH.is_file(), f"manifest missing at {MANIFEST_PATH}"


def test_plugin_name():
    manifest = _load_manifest()
    assert manifest.get("name") == "superpowers"


def test_skills_path():
    manifest = _load_manifest()
    assert manifest.get("skills") == "./skills/"


def test_session_start_skill():
    manifest = _load_manifest()
    assert manifest.get("sessionStart", {}).get("skill") == "using-superpowers"


def test_skill_instructions_non_empty_string():
    manifest = _load_manifest()
    instructions = manifest.get("skillInstructions")
    assert isinstance(instructions, str) and instructions.strip(), (
        "skillInstructions must be a non-empty string"
    )


def test_skill_instructions_mention_every_tool():
    manifest = _load_manifest()
    instructions = manifest.get("skillInstructions")
    for token in REQUIRED_INSTRUCTION_TOKENS:
        assert token in instructions, f"skillInstructions: missing {token!r}"


def test_version_bump_registers_manifest():
    version_config = json.loads(
        (MANIFEST_PATH.parents[1] / ".version-bump.json").read_text(encoding="utf-8")
    )
    entries = version_config.get("files")
    assert isinstance(entries, list), ".version-bump.json must contain files list"
    assert any(
        entry.get("path") == ".kimi-plugin/plugin.json" and entry.get("field") == "version"
        for entry in entries
        if isinstance(entry, dict)
    ), ".version-bump.json must update .kimi-plugin/plugin.json version"


def test_no_unsupported_runtime_fields():
    manifest = _load_manifest()
    present = sorted(field for field in UNSUPPORTED_FIELDS if field in manifest)
    assert not present, "unsupported Kimi runtime fields present: " + ", ".join(present)
