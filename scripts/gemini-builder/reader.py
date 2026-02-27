"""
reader.py — Filesystem traversal and raw file reading.

Responsibilities:
    - Locate all SKILL.md files within a skills root directory
    - Read file contents safely with contextual error messages

Why separate from parsing:
    Isolating I/O from transformation makes each unit independently testable
    and allows swap of the storage backend (e.g., remote fetch) without
    touching parse logic.
"""

from __future__ import annotations

from pathlib import Path


def find_skill_files(skills_root: Path) -> list[Path]:
    """
    Recursively discovers all SKILL.md files within *skills_root*.

    Each direct subdirectory of *skills_root* is treated as a skill folder.
    Only the primary ``SKILL.md`` file is returned per skill; supplementary
    markdown files (examples, guides) are intentionally excluded here —
    the parser handles auxiliary content inclusion if desired.

    Args:
        skills_root: Absolute or relative path to the ``skills/`` directory.

    Returns:
        Sorted list of absolute ``Path`` objects pointing to each SKILL.md.

    Raises:
        FileNotFoundError: If *skills_root* does not exist.
        NotADirectoryError: If *skills_root* is a file, not a directory.
        PermissionError: If the directory cannot be read.
    """
    if not skills_root.exists():
        raise FileNotFoundError(
            f"Skills root directory not found: {skills_root}\n"
            f"Tip: pass --skills-dir pointing to your skills/ folder."
        )
    if not skills_root.is_dir():
        raise NotADirectoryError(
            f"Expected a directory for skills root, got a file: {skills_root}"
        )

    skill_files: list[Path] = []
    try:
        for entry in skills_root.iterdir():
            if not entry.is_dir():
                continue
            candidate = entry / "SKILL.md"
            if candidate.is_file():
                skill_files.append(candidate.resolve())
    except PermissionError as exc:
        raise PermissionError(
            f"Cannot read skills directory (permission denied): {skills_root}"
        ) from exc

    return sorted(skill_files)


def read_file(path: Path) -> str:
    """
    Reads and returns the full text content of *path*.

    Args:
        path: Path to the file to read.

    Returns:
        The file contents as a UTF-8 string.

    Raises:
        FileNotFoundError: If the file does not exist.
        PermissionError: If the file cannot be read.
        UnicodeDecodeError: If the file is not valid UTF-8.
    """
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise FileNotFoundError(f"Skill file not found: {path}")
    except PermissionError:
        raise PermissionError(f"Cannot read skill file (permission denied): {path}")
    except UnicodeDecodeError as exc:
        raise UnicodeDecodeError(
            exc.encoding,
            exc.object,
            exc.start,
            exc.end,
            f"Skill file is not valid UTF-8: {path}",
        )
