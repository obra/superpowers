"""
test_parser.py — Unit tests for mapper.parser module.

Tests cover:
- Happy path: valid frontmatter parses into a correct Skill dataclass.
- Multi-line / special-character descriptions are not truncated.
- Malformed frontmatter (missing delimiters) raises ValueError.
- Missing required fields (name, description) raise ValueError.
- Slugification is correct (hyphens, lowercase, no consecutive hyphens).
- Classification cross-references the existing commands/ directory.
- Command slug overrides work correctly.
"""

from __future__ import annotations

import pytest
from pathlib import Path

from parser import Skill, classify_skills, parse_skill_file


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_skill_md(name: str, description: str, body: str = "# Body") -> str:
    return f'---\nname: {name}\ndescription: "{description}"\n---\n\n{body}\n'


# ---------------------------------------------------------------------------
# parse_skill_file
# ---------------------------------------------------------------------------


class TestParseSkillFile:
    def test_parses_valid_frontmatter(self, tmp_path: Path) -> None:
        """Well-formed SKILL.md produces a correct Skill dataclass."""
        content = _make_skill_md(
            "brainstorming",
            "You MUST use this before any creative work",
            "# Overview\nHelp turn ideas into designs.",
        )
        path = tmp_path / "SKILL.md"
        skill = parse_skill_file(content, path)

        assert skill.name == "brainstorming"
        assert skill.slug == "brainstorming"
        assert "You MUST" in skill.description
        assert "Help turn ideas" in skill.body
        assert skill.source_path == path
        assert skill.is_command is False

    def test_multiline_description_not_truncated(self, tmp_path: Path) -> None:
        """A long single-line description with special chars is fully captured.

        Verifies that _FRONTMATTER_RE (with re.DOTALL) captures the full
        frontmatter block even when descriptions contain long values with
        brackets, hyphens, and other special characters.
        """
        content = (
            '---\n'
            'name: test-skill\n'
            'description: "You MUST use this before creating features, '
            'building components, adding functionality, '
            'or modifying behavior. Explores user intent."\n'
            '---\n\n# Body\n'
        )
        skill = parse_skill_file(content, tmp_path / "SKILL.md")
        assert "Explores user intent." in skill.description
        assert "building components" in skill.description

    def test_description_spanning_frontmatter_block(self, tmp_path: Path) -> None:
        """re.DOTALL on _FRONTMATTER_RE captures the full block across newlines.

        Note: _KEY_VALUE_RE is single-line only (re.MULTILINE, not re.DOTALL).
        A description with an actual embedded newline inside the quotes would be
        truncated to the first line — this is a documented constraint. What
        re.DOTALL *does* protect against is a multi-line frontmatter block being
        cut short by the outer regex. This test verifies that.
        """
        # Two-field frontmatter — re.DOTALL ensures the entire block
        # (spanning multiple lines) is captured before the closing ---
        content = (
            '---\n'
            'name: my-skill\n'
            'description: "A description on line two of the block"\n'
            '---\n\n# Body here\n'
        )
        skill = parse_skill_file(content, tmp_path / "SKILL.md")
        assert skill.name == "my-skill"
        assert "A description on line two" in skill.description
        assert skill.body == "# Body here"

    def test_description_with_brackets_and_colons(self, tmp_path: Path) -> None:
        """Description fields containing brackets and colons are preserved."""
        content = (
            '---\n'
            'name: my-skill\n'
            'description: "Use when: [condition] applies; otherwise skip"\n'
            '---\n\n# Body\n'
        )
        skill = parse_skill_file(content, tmp_path / "SKILL.md")
        assert "[condition]" in skill.description
        assert "Use when:" in skill.description

    def test_missing_frontmatter_raises(self, tmp_path: Path) -> None:
        """Content without '---' delimiters raises ValueError."""
        content = "# No frontmatter here\nJust body text."
        with pytest.raises(ValueError, match="frontmatter"):
            parse_skill_file(content, tmp_path / "SKILL.md")

    def test_missing_name_raises(self, tmp_path: Path) -> None:
        """Frontmatter lacking 'name' raises ValueError naming the missing field."""
        content = '---\ndescription: "some desc"\n---\n\n# Body\n'
        with pytest.raises(ValueError, match="name"):
            parse_skill_file(content, tmp_path / "SKILL.md")

    def test_missing_description_raises(self, tmp_path: Path) -> None:
        """Frontmatter lacking 'description' raises ValueError naming the field."""
        content = '---\nname: my-skill\n---\n\n# Body\n'
        with pytest.raises(ValueError, match="description"):
            parse_skill_file(content, tmp_path / "SKILL.md")

    def test_body_is_stripped(self, tmp_path: Path) -> None:
        """Leading/trailing whitespace in the body section is stripped."""
        content = '---\nname: s\ndescription: "d"\n---\n\n\n\n# Body\n\n\n'
        skill = parse_skill_file(content, tmp_path / "SKILL.md")
        assert skill.body == "# Body"

    @pytest.mark.parametrize("name,expected_slug", [
        ("brainstorming", "brainstorming"),
        ("test-driven-development", "test-driven-development"),
        ("My Cool Skill", "my-cool-skill"),
        ("using_superpowers", "using-superpowers"),
        (" edge--case ", "edge-case"),
    ])
    def test_slugify(self, tmp_path: Path, name: str, expected_slug: str) -> None:
        """Skill names are correctly slugified."""
        content = f'---\nname: {name}\ndescription: "d"\n---\n\n# Body\n'
        skill = parse_skill_file(content, tmp_path / "SKILL.md")
        assert skill.slug == expected_slug


# ---------------------------------------------------------------------------
# classify_skills
# ---------------------------------------------------------------------------


class TestClassifySkills:
    def _make_skill(self, slug: str, tmp_path: Path) -> Skill:
        content = f'---\nname: {slug}\ndescription: "d"\n---\n\n# Body\n'
        return parse_skill_file(content, tmp_path / f"{slug}-SKILL.md")

    def test_cross_references_commands_dir(self, tmp_path: Path) -> None:
        """Skills matching command file stems in commands/ are classified as commands."""
        commands_dir = tmp_path / "commands"
        commands_dir.mkdir()
        (commands_dir / "brainstorming.md").write_text("x", encoding="utf-8")

        skills = [
            self._make_skill("brainstorming", tmp_path),
            self._make_skill("systematic-debugging", tmp_path),
        ]
        classify_skills(skills, commands_dir=commands_dir)

        assert skills[0].is_command is True
        assert skills[1].is_command is False

    def test_slug_overrides_take_precedence(self, tmp_path: Path) -> None:
        """Explicit override slugs are always classified as commands."""
        skills = [self._make_skill("systematic-debugging", tmp_path)]
        classify_skills(skills, commands_dir=None, command_slug_overrides=["systematic-debugging"])
        assert skills[0].is_command is True

    def test_default_is_context(self, tmp_path: Path) -> None:
        """Without any commands dir or overrides all skills are context."""
        skills = [self._make_skill("brainstorming", tmp_path)]
        classify_skills(skills, commands_dir=None)
        assert skills[0].is_command is False

    def test_missing_commands_dir_handled_gracefully(self, tmp_path: Path) -> None:
        """When commands_dir doesn't exist, classification doesn't raise."""
        skills = [self._make_skill("brainstorming", tmp_path)]
        non_existent = tmp_path / "no-such-dir"
        classify_skills(skills, commands_dir=non_existent)
        assert skills[0].is_command is False
