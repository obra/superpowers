"""
writer.py — Artifact generation for the Gemini CLI extension output.

Responsibilities:
    - Generate GEMINI.md (consolidated global context from non-command skills)
    - Generate commands/<slug>.toml (one file per command skill)
    - Generate gemini-extension.json (extension manifest)
    - Safely clean and recreate the output directory

Design note — TOML field names:
    The Gemini CLI custom command format expects exactly two fields:
        description  — shown in the command picker UI
        prompt       — the instruction text sent to the model (NOT "template")
    These are locked in and validated by write_command_toml to catch
    any future schema drift early.

Design note — safety in clean_output_dir:
    shutil.rmtree() is destructive and irreversible. Before calling it we
    assert that the target path name is one of the known-safe output names
    ('dist' for CI, 'local-gemini-superpowers' for local dev) AND that
    the path has at least 3 components from filesystem root. This prevents
    a misconfigured --output-dir from wiping an arbitrary workspace.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

try:
    from .parser import Skill  # Package import (e.g. scripts.gemini-builder.writer)
except ImportError:
    from parser import Skill  # type: ignore[no-redef]  # Direct sys.path import (tests)

# Canonical Gemini CLI TOML field names. 'prompt' is correct — not 'template'.
_TOML_FIELD_DESCRIPTION = "description"
_TOML_FIELD_PROMPT = "prompt"

# Extension name written into gemini-extension.json.
_EXTENSION_NAME = "superpowers"
_EXTENSION_VERSION = "1.0.0"
_EXTENSION_DESCRIPTION = (
    "obra/superpowers skills ported to the Gemini CLI extension format. "
    "Provides global context guidelines and slash commands for structured "
    "agent workflows."
)


# ---------------------------------------------------------------------------
# Safety guard
# ---------------------------------------------------------------------------


# Known-safe output directory names.
# 'dist'                    — used by the CI/CD workflow
# 'local-gemini-superpowers' — used for local development
_SAFE_OUTPUT_NAMES: frozenset[str] = frozenset({"dist", "local-gemini-superpowers"})


def _assert_safe_to_delete(path: Path) -> None:
    """
    Asserts that *path* is safe to pass to ``shutil.rmtree()``.

    Checks:
    1. The path name (final component) is one of the known-safe output names.
    2. The resolved path has at least 3 components from the filesystem root,
       preventing accidental deletion of ``/``, ``/home``, or similar.

    Args:
        path: The output directory path to validate.

    Raises:
        ValueError: With a descriptive message if either safety check fails.
    """
    resolved = path.resolve()
    parts = resolved.parts

    if resolved.name not in _SAFE_OUTPUT_NAMES:
        raise ValueError(
            f"Safety check failed: output directory name '{resolved.name}' is not "
            f"in the allowlist {sorted(_SAFE_OUTPUT_NAMES)}.\n"
            f"Refusing to delete: {resolved}\n"
            f"Tip: use --output-dir pointing to 'dist/' (CI) or "
            f"'local-gemini-superpowers/' (local dev)."
        )

    if len(parts) < 3:
        raise ValueError(
            f"Safety check failed: output path is suspiciously close to the "
            f"filesystem root ({len(parts)} components).\n"
            f"Refusing to delete: {resolved}"
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def clean_output_dir(out_dir: Path) -> None:
    """
    Safely deletes and recreates *out_dir* for idempotent pipeline re-runs.

    A strict safety guard is applied before deletion — see ``_assert_safe_to_delete``.
    If *out_dir* does not exist yet, it is simply created.

    Args:
        out_dir: Target output directory.

    Raises:
        ValueError:      If the path fails the safety guard.
        PermissionError: If the directory cannot be created or deleted.
    """
    _assert_safe_to_delete(out_dir)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=False)


def write_gemini_md(context_skills: list[Skill], out_dir: Path) -> Path:
    """
    Writes ``GEMINI.md`` by concatenating the body of every non-command skill.

    Each skill is separated by a level-2 heading using the skill's name, and a
    brief description line is prepended so the model knows when to invoke each
    behaviour without reading the full body.

    Structure::

        # Superpowers Global Context
        > Auto-generated from obra/superpowers skills.

        ---

        ## brainstorming
        > You MUST use this before any creative work...

        <body content>

        ---

        ## test-driven-development
        ...

    Args:
        context_skills: Skills where ``is_command == False``.
        out_dir:        Output directory (must already exist).

    Returns:
        Path to the written ``GEMINI.md`` file.
    """
    lines: list[str] = [
        "# Superpowers Global Context",
        "",
        "> Auto-generated from [obra/superpowers](https://github.com/obra/superpowers) "
        "by the Gemini Mapper pipeline. Do not edit manually.",
        "",
    ]

    for skill in context_skills:
        lines += [
            "---",
            "",
            f"## {skill.name}",
            "",
            f"> {skill.description}",
            "",
            skill.body,
            "",
        ]

    output_path = out_dir / "GEMINI.md"
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def write_command_toml(skill: Skill, commands_dir: Path) -> Path:
    """
    Writes a Gemini CLI custom command TOML file for a single command skill.

    The Gemini CLI expects exactly:
        description = "..."   # shown in the /command picker
        prompt      = "..."   # instruction text passed to the model

    These field names are asserted at runtime so any future schema drift
    in the Gemini CLI is caught immediately rather than silently producing
    invalid commands.

    Args:
        skill:        A ``Skill`` with ``is_command == True``.
        commands_dir: The ``commands/`` subdirectory inside the output dir.

    Returns:
        Path to the written ``.toml`` file.

    Raises:
        AssertionError: If the generated TOML is missing required field names
                        (internal consistency check).
    """
    commands_dir.mkdir(parents=True, exist_ok=True)

    # Escape backslashes and double-quotes for TOML multi-line basic strings.
    def _toml_escape(text: str) -> str:
        return text.replace("\\", "\\\\").replace('"""', '\\"\\"\\"')

    # Use TOML multi-line basic strings to faithfully preserve markdown body.
    description_escaped = skill.description.replace('"', '\\"')
    body_escaped = _toml_escape(skill.body)

    toml_content = (
        f'{_TOML_FIELD_DESCRIPTION} = "{description_escaped}"\n'
        f'{_TOML_FIELD_PROMPT} = """\n{body_escaped}\n"""\n'
    )

    # Internal schema assertion — catches field name drift early.
    assert _TOML_FIELD_DESCRIPTION + " =" in toml_content, (
        f"TOML output missing '{_TOML_FIELD_DESCRIPTION}' field for skill '{skill.name}'"
    )
    assert _TOML_FIELD_PROMPT + " =" in toml_content, (
        f"TOML output missing '{_TOML_FIELD_PROMPT}' field for skill '{skill.name}'"
    )

    output_path = commands_dir / f"{skill.slug}.toml"
    output_path.write_text(toml_content, encoding="utf-8")
    return output_path


def write_manifest(skills: list[Skill], out_dir: Path) -> Path:
    """
    Writes ``gemini-extension.json`` registering the extension with the Gemini CLI.

    Args:
        skills:  Full list of parsed skills (used to count commands in logging).
        out_dir: Output directory (must already exist).

    Returns:
        Path to the written ``gemini-extension.json`` file.
    """
    manifest: dict = {
        "name": _EXTENSION_NAME,
        "version": _EXTENSION_VERSION,
        "description": _EXTENSION_DESCRIPTION,
        "contextFileName": "GEMINI.md",
    }

    output_path = out_dir / "gemini-extension.json"
    output_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return output_path
