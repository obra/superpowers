"""
mapper.py — Pipeline orchestrator and CLI entry point.

Wires the three pipeline stages together:
    1. READ:  Discover and read all SKILL.md files from the skills root.
    2. PARSE: Parse frontmatter, build Skill objects, classify as command/context.
    3. WRITE: Emit GEMINI.md, command TOML files, and gemini-extension.json.

Usage::

    # Default paths (run from repo root)
    python -m scripts.gemini-builder.mapper

    # Explicit paths
    python -m scripts.gemini-builder.mapper --skills-dir ./skills --output-dir ./dist

    # Override which skills become commands
    python -m scripts.gemini-builder.mapper --commands brainstorming,test-driven-development

    # Dry run — print the plan without writing anything
    python -m scripts.gemini-builder.mapper --dry-run
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

try:
    from .parser import Skill, classify_skills, parse_skill_file
    from .reader import find_skill_files, read_file
    from .writer import (
        clean_output_dir,
        write_command_toml,
        write_gemini_md,
        write_manifest,
    )
except ImportError:
    from parser import Skill, classify_skills, parse_skill_file  # type: ignore[no-redef]
    from reader import find_skill_files, read_file  # type: ignore[no-redef]
    from writer import (  # type: ignore[no-redef]
        clean_output_dir,
        write_command_toml,
        write_gemini_md,
        write_manifest,
    )

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------


def run(
    skills_dir: Path,
    output_dir: Path,
    commands_dir: Path | None = None,
    command_slug_overrides: list[str] | None = None,
    dry_run: bool = False,
) -> dict:
    """
    Executes the full Read → Parse → Write pipeline.

    Args:
        skills_dir:             Path to the ``skills/`` directory.
        output_dir:             Destination for generated artifacts.
        commands_dir:           Path to existing ``commands/`` directory for
                                cross-referencing command classification.
        command_slug_overrides: Slugs that should always be treated as commands.
        dry_run:                If True, log the plan but don't write any files.

    Returns:
        A summary dict with keys ``skills``, ``commands``, ``context_skills``.

    Raises:
        Any exception from reader/parser/writer propagates with context.
    """
    # ---- STAGE 1: READ ---------------------------------------------------- #
    logger.info("Stage 1/3 — Reading skill files from: %s", skills_dir)
    skill_paths = find_skill_files(skills_dir)

    if not skill_paths:
        logger.warning("No SKILL.md files found in %s — output will be empty.", skills_dir)

    raw_contents: list[tuple[Path, str]] = []
    for path in skill_paths:
        content = read_file(path)
        raw_contents.append((path, content))
    logger.info("  Found %d skill file(s).", len(raw_contents))

    # ---- STAGE 2: PARSE --------------------------------------------------- #
    logger.info("Stage 2/3 — Parsing and classifying skills.")
    skills: list[Skill] = []
    parse_errors: list[str] = []

    for path, content in raw_contents:
        try:
            skill = parse_skill_file(content, path)
            skills.append(skill)
        except ValueError as exc:
            # Collect parse errors so all problems are reported at once.
            parse_errors.append(str(exc))
            logger.warning("  Skipping %s — %s", path.name, exc)

    if parse_errors:
        logger.warning(
            "%d skill(s) had parse errors and were skipped.", len(parse_errors)
        )

    classify_skills(
        skills,
        commands_dir=commands_dir,
        command_slug_overrides=command_slug_overrides,
    )

    command_skills = [s for s in skills if s.is_command]
    context_skills = [s for s in skills if not s.is_command]

    logger.info(
        "  Total: %d skill(s) — %d command(s), %d global context.",
        len(skills),
        len(command_skills),
        len(context_skills),
    )
    for skill in skills:
        label = "CMD " if skill.is_command else "CTX "
        logger.info("    [%s] %s", label, skill.name)

    if dry_run:
        logger.info("Dry run — skipping file generation.")
        return {"skills": skills, "commands": command_skills, "context_skills": context_skills}

    # ---- STAGE 3: WRITE --------------------------------------------------- #
    logger.info("Stage 3/3 — Writing artifacts to: %s", output_dir)
    clean_output_dir(output_dir)

    gemini_md_path = write_gemini_md(context_skills, output_dir)
    logger.info("  Wrote %s (%d bytes)", gemini_md_path.name, gemini_md_path.stat().st_size)

    commands_out_dir = output_dir / "commands"
    for skill in command_skills:
        toml_path = write_command_toml(skill, commands_out_dir)
        logger.info("  Wrote commands/%s (%d bytes)", toml_path.name, toml_path.stat().st_size)

    manifest_path = write_manifest(skills, output_dir)
    logger.info("  Wrote %s", manifest_path.name)

    logger.info("Done. Output directory: %s", output_dir.resolve())
    return {"skills": skills, "commands": command_skills, "context_skills": context_skills}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m scripts.gemini-builder.mapper",
        description=(
            "Translate obra/superpowers SKILL.md files into a "
            "Gemini CLI extension directory."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run with defaults from the repo root:
  python -m scripts.gemini-builder.mapper

  # Custom paths:
  python -m scripts.gemini-builder.mapper --skills-dir ./skills --output-dir ./dist

  # Override command classification:
  python -m scripts.gemini-builder.mapper --commands brainstorming,systematic-debugging

  # Preview without writing:
  python -m scripts.gemini-builder.mapper --dry-run
""",
    )
    parser.add_argument(
        "--skills-dir",
        type=Path,
        default=Path("./skills"),
        metavar="DIR",
        help="Path to the skills/ directory (default: ./skills)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./dist"),
        metavar="DIR",
        help="Destination directory for generated artifacts (default: ./dist)",
    )
    parser.add_argument(
        "--commands-dir",
        type=Path,
        default=Path("./commands"),
        metavar="DIR",
        help="Path to existing commands/ directory used for classification "
             "(default: ./commands)",
    )
    parser.add_argument(
        "--commands",
        type=str,
        default="",
        metavar="SLUGS",
        help="Comma-separated list of skill slugs to force-classify as commands",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the classification plan but don't write any files",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose (DEBUG) logging output",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """
    CLI entry point. Returns an exit code (0 = success, 1 = error).

    Args:
        argv: Argument list (defaults to sys.argv[1:] when None).

    Returns:
        Integer exit code.
    """
    arg_parser = _build_arg_parser()
    args = arg_parser.parse_args(argv)

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(levelname)s %(message)s",
        stream=sys.stderr,
    )

    overrides = [s.strip() for s in args.commands.split(",") if s.strip()]
    commands_dir = args.commands_dir if args.commands_dir.is_dir() else None

    try:
        run(
            skills_dir=args.skills_dir,
            output_dir=args.output_dir,
            commands_dir=commands_dir,
            command_slug_overrides=overrides,
            dry_run=args.dry_run,
        )
    except (FileNotFoundError, NotADirectoryError, PermissionError, ValueError) as exc:
        logger.error("Error: %s", exc)
        return 1
    except Exception as exc:  # noqa: BLE001  # surface unexpected errors cleanly
        logger.error("Unexpected error: %s", exc, exc_info=True)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
