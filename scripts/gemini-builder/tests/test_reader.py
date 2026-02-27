"""
test_reader.py — Unit tests for mapper.reader module.

Tests cover:
- Happy path: valid SKILL.md files are discovered correctly.
- Missing directory raises FileNotFoundError with context.
- File passed as skills_root raises NotADirectoryError.
- read_file returns correct contents.
- read_file raises FileNotFoundError for missing files.
"""

from __future__ import annotations

import pytest
from pathlib import Path

from reader import find_skill_files, read_file


# ---------------------------------------------------------------------------
# find_skill_files
# ---------------------------------------------------------------------------


class TestFindSkillFiles:
    def test_finds_skill_md_in_subdirectory(self, tmp_path: Path) -> None:
        """A SKILL.md file inside a subdirectory is discovered."""
        skill_dir = tmp_path / "brainstorming"
        skill_dir.mkdir()
        skill_file = skill_dir / "SKILL.md"
        skill_file.write_text("# Skill", encoding="utf-8")

        results = find_skill_files(tmp_path)
        assert results == [skill_file.resolve()]

    def test_returns_sorted_results(self, tmp_path: Path) -> None:
        """Results are returned in alphabetical order."""
        for name in ("zzz-skill", "aaa-skill", "mmm-skill"):
            d = tmp_path / name
            d.mkdir()
            (d / "SKILL.md").write_text("x", encoding="utf-8")

        results = find_skill_files(tmp_path)
        names = [p.parent.name for p in results]
        assert names == sorted(names)

    def test_ignores_non_md_files(self, tmp_path: Path) -> None:
        """Files other than SKILL.md inside skill dirs are ignored."""
        skill_dir = tmp_path / "my-skill"
        skill_dir.mkdir()
        (skill_dir / "README.txt").write_text("x", encoding="utf-8")
        (skill_dir / "helper.sh").write_text("x", encoding="utf-8")
        # No SKILL.md — should find nothing.
        assert find_skill_files(tmp_path) == []

    def test_ignores_root_level_md_files(self, tmp_path: Path) -> None:
        """Markdown files at the skills/ root (not inside subdirs) are skipped."""
        (tmp_path / "ORPHAN.md").write_text("x", encoding="utf-8")
        assert find_skill_files(tmp_path) == []

    def test_missing_directory_raises(self, tmp_path: Path) -> None:
        """Missing skills root raises FileNotFoundError with a helpful message."""
        non_existent = tmp_path / "does-not-exist"
        with pytest.raises(FileNotFoundError, match="Skills root directory not found"):
            find_skill_files(non_existent)

    def test_file_as_root_raises(self, tmp_path: Path) -> None:
        """Passing a file path instead of a directory raises NotADirectoryError."""
        a_file = tmp_path / "file.md"
        a_file.write_text("x", encoding="utf-8")
        with pytest.raises(NotADirectoryError):
            find_skill_files(a_file)

    def test_empty_directory_returns_empty_list(self, tmp_path: Path) -> None:
        """An empty directory returns an empty list without error."""
        assert find_skill_files(tmp_path) == []


# ---------------------------------------------------------------------------
# read_file
# ---------------------------------------------------------------------------


class TestReadFile:
    def test_reads_utf8_content(self, tmp_path: Path) -> None:
        """File content is returned as a UTF-8 string."""
        f = tmp_path / "SKILL.md"
        f.write_text("hello world 🎉", encoding="utf-8")
        assert read_file(f) == "hello world 🎉"

    def test_missing_file_raises(self, tmp_path: Path) -> None:
        """Reading a non-existent file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="not found"):
            read_file(tmp_path / "ghost.md")
