"""Validate the native Antigravity plugin: the Marketplace manifest, the
skill description agy relies on to bootstrap using-superpowers, and the
repo layout agy depends on. CI-safe; when `agy` is on PATH, also runs
`agy plugin validate`.

Converted from tests/antigravity/test-plugin-manifest.sh (bash wrapper
around a Python heredoc) — see superpowers#dev "tests: convert
wrapped-Python bash tests to plain pytest".
"""
import json
import re
import shutil
import struct
import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / ".antigravity-plugin" / "plugin.json"

REQUIRED_FIELDS = [
    "name", "description", "displayName", "logo",
    "suggestedPrompts", "version", "author",
]


def _load_manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_manifest_exists():
    assert MANIFEST_PATH.is_file(), f"manifest missing at {MANIFEST_PATH}"


@pytest.mark.parametrize("field", REQUIRED_FIELDS)
def test_required_field_present(field):
    manifest = _load_manifest()
    assert manifest.get(field), f"manifest field {field!r} is missing or empty"


def test_name_is_superpowers():
    manifest = _load_manifest()
    assert manifest["name"] == "superpowers", (
        f"name must be 'superpowers', got {manifest['name']!r}"
    )


def test_name_is_kebab_case():
    manifest = _load_manifest()
    assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", manifest["name"]), "name is not kebab-case"


def test_description_fits_marketplace_card():
    manifest = _load_manifest()
    # The guide recommends 120-160 characters for Marketplace cards; we use
    # a shorter tagline by choice, so enforce only the upper bound.
    length = len(manifest["description"])
    assert length <= 160, f"description is {length} characters; Marketplace cards fit at most 160"


def test_suggested_prompts_shape():
    manifest = _load_manifest()
    prompts = manifest["suggestedPrompts"]
    assert isinstance(prompts, list) and 1 <= len(prompts) <= 3, (
        "suggestedPrompts must be a list of 1-3 prompts"
    )
    assert all(isinstance(p, str) and p.strip() for p in prompts), (
        "suggestedPrompts entries must be non-empty strings"
    )


def test_version_matches_claude_plugin_manifest():
    manifest = _load_manifest()
    claude_manifest = json.loads(
        (REPO_ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8")
    )
    assert manifest["version"] == claude_manifest["version"], (
        f"version {manifest['version']!r} != .claude-plugin version "
        f"{claude_manifest['version']!r}"
    )


def test_author_matches_claude_plugin_manifest():
    manifest = _load_manifest()
    claude_manifest = json.loads(
        (REPO_ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8")
    )
    assert manifest["author"] == claude_manifest["author"], (
        "author does not match .claude-plugin/plugin.json"
    )


def _logo_header():
    manifest = _load_manifest()
    logo = REPO_ROOT / manifest["logo"]
    assert logo.is_file(), f"logo {manifest['logo']!r} does not exist"
    header = logo.read_bytes()[:26]
    assert header[:8] == b"\x89PNG\r\n\x1a\n", "logo is not a PNG"
    width, height = struct.unpack(">II", header[16:24])
    return width, height


def test_logo_is_square_and_at_least_128px():
    width, height = _logo_header()
    assert width == height and width >= 128, (
        f"logo must be square and at least 128x128, got {width}x{height}"
    )


def test_version_bump_registers_manifest():
    version_config = json.loads((REPO_ROOT / ".version-bump.json").read_text(encoding="utf-8"))
    assert any(
        entry.get("path") == ".antigravity-plugin/plugin.json"
        and entry.get("field") == "version"
        for entry in version_config.get("files", [])
    ), ".version-bump.json does not register .antigravity-plugin/plugin.json"


def test_using_superpowers_description_bootstraps_agy():
    # agy lists each skill's description, and using-superpowers' description
    # is what gets the model to load it at the start of a session.
    skill_md = (REPO_ROOT / "skills" / "using-superpowers" / "SKILL.md").read_text(
        encoding="utf-8"
    )
    frontmatter = re.match(r"---\n(.*?)\n---\n", skill_md, re.DOTALL)
    description = frontmatter and re.search(
        r"^description:(.*)$", frontmatter.group(1), re.MULTILINE
    )
    assert description and "Use when starting any conversation" in description.group(1), (
        "using-superpowers description no longer says 'Use when starting any "
        "conversation'; Antigravity relies on it to bootstrap"
    )


@pytest.mark.parametrize("stray", ["plugin.json", "hooks.json", "rules"])
def test_no_stray_root_files_agy_would_misread(stray):
    # A root plugin.json would be read instead of .antigravity-plugin/plugin.json,
    # a root hooks.json would run on every model call, and Cursor loads any
    # rules/*.md shipped in a plugin.
    assert not (REPO_ROOT / stray).exists(), f"root {stray} must not exist"


@pytest.mark.skipif(shutil.which("agy") is None, reason="agy not on PATH; not running agy plugin validate")
def test_agy_plugin_validate():
    result = subprocess.run(
        ["agy", "plugin", "validate", str(REPO_ROOT)],
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    assert result.returncode == 0, f"agy plugin validate failed\n{output}"
    assert "[ok]" in output, f"agy plugin validate did not report [ok]\n{output}"
    assert re.search(r"skills +: [0-9]+ processed", output), f"agy found no skills\n{output}"
