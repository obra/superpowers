"""
test_integration.py — End-to-end integration tests for the full mapper pipeline.

Design principle:
    All tests use tmp_path to scaffold a self-contained fake skills/ tree.
    This makes the suite CI-safe with no dependency on the real repository
    being cloned or in any particular state.

    A secondary live-repo smoke test is included but guarded by
    @pytest.mark.skipif so it is skipped when the real skills/ directory
    doesn't exist (e.g. in CI without the repo).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

from mapper import run


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def fake_skills_tree(tmp_path: Path) -> tuple[Path, Path, Path]:
    """
    Scaffolds a minimal but realistic fake skills/ and commands/ tree.

    Returns:
        Tuple of (skills_dir, commands_dir, output_dir).
    """
    skills_dir = tmp_path / "skills"
    commands_dir = tmp_path / "commands"
    output_dir = tmp_path / "local-gemini-superpowers"

    # Skill 1 — will be classified as a command (matching commands/ file)
    s1 = skills_dir / "brainstorming"
    s1.mkdir(parents=True)
    (s1 / "SKILL.md").write_text(
        '---\n'
        'name: brainstorming\n'
        'description: "You MUST use this before any creative work - '
        'creating features, building components, or modifying behavior."\n'
        '---\n\n'
        '# Brainstorming\n\nHelp turn ideas into designs.\n',
        encoding="utf-8",
    )

    # Skill 2 — will be classified as global context
    s2 = skills_dir / "test-driven-development"
    s2.mkdir(parents=True)
    (s2 / "SKILL.md").write_text(
        '---\n'
        'name: test-driven-development\n'
        'description: "Use when implementing any feature or bugfix"\n'
        '---\n\n'
        '# TDD\n\nWrite the test first.\n',
        encoding="utf-8",
    )

    # Skill 3 — also global context
    s3 = skills_dir / "systematic-debugging"
    s3.mkdir(parents=True)
    (s3 / "SKILL.md").write_text(
        '---\n'
        'name: systematic-debugging\n'
        'description: "Use when debugging unexpected behavior"\n'
        '---\n\n'
        '# Debugging\n\nFind and fix bugs systematically.\n',
        encoding="utf-8",
    )

    # Matching command file — makes brainstorming a command
    commands_dir.mkdir(parents=True)
    (commands_dir / "brainstorming.md").write_text(
        '---\ndisable-model-invocation: true\n---\n\nInvoke brainstorming skill.\n',
        encoding="utf-8",
    )

    return skills_dir, commands_dir, output_dir


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------


class TestFullPipeline:
    def test_output_directory_is_created(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        assert output_dir.is_dir()

    def test_gemini_md_is_generated(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        assert (output_dir / "GEMINI.md").exists()

    def test_gemini_md_contains_context_skills(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        content = (output_dir / "GEMINI.md").read_text(encoding="utf-8")
        assert "test-driven-development" in content
        assert "systematic-debugging" in content

    def test_command_skill_not_in_gemini_md(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        """Command skills should appear in TOML files, not in GEMINI.md body."""
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        content = (output_dir / "GEMINI.md").read_text(encoding="utf-8")
        # brainstorming is a command, its section should not be in GEMINI.md
        assert "## brainstorming" not in content

    def test_command_toml_is_generated(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        assert (output_dir / "commands" / "brainstorming.toml").exists()

    def test_toml_has_description_and_prompt(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        content = (output_dir / "commands" / "brainstorming.toml").read_text(encoding="utf-8")
        assert "description" in content
        assert "prompt" in content

    def test_toml_is_parseable(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        if sys.version_info < (3, 11):
            pytest.skip("tomllib requires Python 3.11+")
        import tomllib

        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        toml_path = output_dir / "commands" / "brainstorming.toml"
        with open(toml_path, "rb") as f:
            data = tomllib.load(f)
        assert "description" in data
        assert "prompt" in data

    def test_manifest_is_valid_json(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        manifest_path = output_dir / "gemini-extension.json"
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert data["contextFileName"] == "GEMINI.md"
        assert data["name"]
        assert data["version"]

    def test_pipeline_is_idempotent(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        """Running the pipeline twice produces the same output without errors."""
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir)
        run(skills_dir, output_dir, commands_dir=commands_dir)
        assert (output_dir / "GEMINI.md").exists()
        assert (output_dir / "gemini-extension.json").exists()

    def test_dry_run_produces_no_files(
        self, fake_skills_tree: tuple[Path, Path, Path]
    ) -> None:
        """Dry run should not create the output directory."""
        skills_dir, commands_dir, output_dir = fake_skills_tree
        run(skills_dir, output_dir, commands_dir=commands_dir, dry_run=True)
        assert not output_dir.exists()

    def test_command_slug_override(self, tmp_path: Path) -> None:
        """A skill can be forced into command classification via override."""
        skills_dir = tmp_path / "skills"
        output_dir = tmp_path / "local-gemini-superpowers"
        tdd = skills_dir / "test-driven-development"
        tdd.mkdir(parents=True)
        (tdd / "SKILL.md").write_text(
            '---\nname: test-driven-development\ndescription: "TDD skill"\n---\n\n# TDD\n',
            encoding="utf-8",
        )
        run(
            skills_dir,
            output_dir,
            commands_dir=None,
            command_slug_overrides=["test-driven-development"],
        )
        assert (output_dir / "commands" / "test-driven-development.toml").exists()


# ---------------------------------------------------------------------------
# Live-repo smoke test (skipped in CI when repo not present)
# ---------------------------------------------------------------------------

_REAL_SKILLS_DIR = Path(__file__).resolve().parents[2] / "skills"


@pytest.mark.skipif(
    not _REAL_SKILLS_DIR.is_dir(),
    reason="Real skills/ directory not found — skipping live-repo smoke test",
)
class TestLiveRepoSmoke:
    def test_pipeline_runs_on_real_skills(self, tmp_path: Path) -> None:
        """Should process all real SKILL.md files without error."""
        output_dir = tmp_path / "local-gemini-superpowers"
        commands_dir = _REAL_SKILLS_DIR.parent / "commands"
        result = run(
            skills_dir=_REAL_SKILLS_DIR,
            output_dir=output_dir,
            commands_dir=commands_dir if commands_dir.is_dir() else None,
        )
        assert len(result["skills"]) > 0
        assert (output_dir / "GEMINI.md").exists()
        assert (output_dir / "gemini-extension.json").exists()
