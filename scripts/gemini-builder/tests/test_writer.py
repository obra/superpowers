"""
test_writer.py — Unit tests for mapper.writer module.

Tests cover:
- write_gemini_md: file is created, contains all skill names and bodies.
- write_command_toml: file uses canonical 'description' and 'prompt' fields.
- write_manifest: valid JSON with required fields.
- clean_output_dir: idempotent, creates directory when absent.
- clean_output_dir safety guard: rejects unsafe paths.
"""

from __future__ import annotations

import json
import sys
import pytest
from pathlib import Path

from parser import Skill
from writer import (
    clean_output_dir,
    write_command_toml,
    write_gemini_md,
    write_manifest,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_skill(
    name: str,
    description: str = "A test skill",
    body: str = "# Skill Body",
    is_command: bool = False,
) -> Skill:
    slug = name.lower().replace(" ", "-")
    return Skill(
        name=name,
        slug=slug,
        description=description,
        body=body,
        source_path=Path(f"/fake/{name}/SKILL.md"),
        is_command=is_command,
    )


# ---------------------------------------------------------------------------
# write_gemini_md
# ---------------------------------------------------------------------------


class TestWriteGeminiMd:
    def test_creates_file(self, tmp_path: Path) -> None:
        skills = [_make_skill("brainstorming")]
        out = write_gemini_md(skills, tmp_path)
        assert out.exists()
        assert out.name == "GEMINI.md"

    def test_contains_skill_name_as_heading(self, tmp_path: Path) -> None:
        skills = [_make_skill("brainstorming")]
        out = write_gemini_md(skills, tmp_path)
        assert "## brainstorming" in out.read_text(encoding="utf-8")

    def test_contains_skill_description(self, tmp_path: Path) -> None:
        skills = [_make_skill("brainstorming", description="My description")]
        out = write_gemini_md(skills, tmp_path)
        assert "My description" in out.read_text(encoding="utf-8")

    def test_contains_skill_body(self, tmp_path: Path) -> None:
        skills = [_make_skill("brainstorming", body="## TDD Loop\nWrite the test first.")]
        out = write_gemini_md(skills, tmp_path)
        assert "Write the test first." in out.read_text(encoding="utf-8")

    def test_multiple_skills_all_present(self, tmp_path: Path) -> None:
        skills = [_make_skill("skill-a"), _make_skill("skill-b")]
        out = write_gemini_md(skills, tmp_path)
        content = out.read_text(encoding="utf-8")
        assert "## skill-a" in content
        assert "## skill-b" in content

    def test_empty_skills_creates_file(self, tmp_path: Path) -> None:
        out = write_gemini_md([], tmp_path)
        assert out.exists()


# ---------------------------------------------------------------------------
# write_command_toml
# ---------------------------------------------------------------------------


class TestWriteCommandToml:
    def test_creates_toml_file(self, tmp_path: Path) -> None:
        skill = _make_skill("brainstorm", is_command=True)
        out = write_command_toml(skill, tmp_path / "commands")
        assert out.exists()
        assert out.suffix == ".toml"

    def test_uses_slug_as_filename(self, tmp_path: Path) -> None:
        skill = _make_skill("my-skill", is_command=True)
        skill.slug = "my-skill"
        out = write_command_toml(skill, tmp_path / "commands")
        assert out.stem == "my-skill"

    def test_contains_description_field(self, tmp_path: Path) -> None:
        """Canonical field 'description' must be present — schema validation."""
        skill = _make_skill("brainstorm", description="A brainstorm skill", is_command=True)
        out = write_command_toml(skill, tmp_path / "commands")
        content = out.read_text(encoding="utf-8")
        assert 'description = "A brainstorm skill"' in content

    def test_contains_prompt_field_not_template(self, tmp_path: Path) -> None:
        """Canonical field 'prompt' must be present (NOT 'template')."""
        skill = _make_skill("brainstorm", body="# Do the thing", is_command=True)
        out = write_command_toml(skill, tmp_path / "commands")
        content = out.read_text(encoding="utf-8")
        assert "prompt" in content
        assert "template" not in content

    def test_body_in_prompt_value(self, tmp_path: Path) -> None:
        """The skill body text appears inside the 'prompt' value."""
        skill = _make_skill("brainstorm", body="My body text", is_command=True)
        out = write_command_toml(skill, tmp_path / "commands")
        content = out.read_text(encoding="utf-8")
        assert "My body text" in content

    def test_toml_is_parseable(self, tmp_path: Path) -> None:
        """The generated TOML can be parsed by Python's stdlib tomllib (3.11+)."""
        if sys.version_info < (3, 11):
            pytest.skip("tomllib requires Python 3.11+")
        import tomllib
        skill = _make_skill("brainstorm", description="desc", body="body", is_command=True)
        out = write_command_toml(skill, tmp_path / "commands")
        with open(out, "rb") as f:
            data = tomllib.load(f)
        assert data["description"] == "desc"
        assert "body" in data["prompt"]

    def test_creates_commands_dir_if_missing(self, tmp_path: Path) -> None:
        """The commands/ subdirectory is created if it doesn't exist."""
        commands_dir = tmp_path / "commands"
        assert not commands_dir.exists()
        write_command_toml(_make_skill("s", is_command=True), commands_dir)
        assert commands_dir.is_dir()


# ---------------------------------------------------------------------------
# write_manifest
# ---------------------------------------------------------------------------


class TestWriteManifest:
    def test_creates_json_file(self, tmp_path: Path) -> None:
        out = write_manifest([], tmp_path)
        assert out.name == "gemini-extension.json"
        assert out.exists()

    def test_valid_json(self, tmp_path: Path) -> None:
        out = write_manifest([], tmp_path)
        data = json.loads(out.read_text(encoding="utf-8"))
        assert isinstance(data, dict)

    def test_required_fields_present(self, tmp_path: Path) -> None:
        out = write_manifest([], tmp_path)
        data = json.loads(out.read_text(encoding="utf-8"))
        assert "name" in data
        assert "version" in data
        assert "description" in data
        assert "contextFileName" in data

    def test_context_file_name_is_gemini_md(self, tmp_path: Path) -> None:
        out = write_manifest([], tmp_path)
        data = json.loads(out.read_text(encoding="utf-8"))
        assert data["contextFileName"] == "GEMINI.md"

    def test_name_is_lowercase_hyphenated(self, tmp_path: Path) -> None:
        out = write_manifest([], tmp_path)
        data = json.loads(out.read_text(encoding="utf-8"))
        name = data["name"]
        assert name == name.lower()
        assert " " not in name
        assert "_" not in name


# ---------------------------------------------------------------------------
# clean_output_dir
# ---------------------------------------------------------------------------


class TestCleanOutputDir:
    def _safe_dir(self, tmp_path: Path) -> Path:
        """Returns a path that satisfies the safety guard."""
        return tmp_path / "local-gemini-superpowers"

    def test_creates_directory_when_absent(self, tmp_path: Path) -> None:
        out = self._safe_dir(tmp_path)
        assert not out.exists()
        clean_output_dir(out)
        assert out.is_dir()

    def test_recreates_existing_directory(self, tmp_path: Path) -> None:
        """Running twice is idempotent — existing contents are removed."""
        out = self._safe_dir(tmp_path)
        out.mkdir()
        (out / "leftover.txt").write_text("old", encoding="utf-8")

        clean_output_dir(out)

        assert out.is_dir()
        assert not (out / "leftover.txt").exists()

    def test_safety_guard_rejects_missing_name(self, tmp_path: Path) -> None:
        """Paths without 'local-gemini-superpowers' in the name are rejected."""
        dangerous = tmp_path / "my-project"
        dangerous.mkdir()
        with pytest.raises(ValueError, match="Safety check failed"):
            clean_output_dir(dangerous)

    def test_safety_guard_rejects_shallow_path(self, tmp_path: Path) -> None:
        """Path with very few components (simulating near-root) is rejected.

        We can't literally pass '/' so we mock the resolve() to return a
        shallow path by monkey-patching Path.resolve.
        """
        out = tmp_path / "local-gemini-superpowers"
        out.mkdir()

        original_resolve = Path.resolve

        def shallow_resolve(self, strict=False):
            if self == out:
                # Simulate a 2-component path: e.g. /local-gemini-superpowers
                return Path("/local-gemini-superpowers")
            return original_resolve(self, strict=strict)

        import writer as writer_module
        monkeypatch_path = pytest.MonkeyPatch()
        monkeypatch_path.setattr(Path, "resolve", shallow_resolve)
        with pytest.raises(ValueError, match="Safety check failed"):
            clean_output_dir(out)
        monkeypatch_path.undo()
