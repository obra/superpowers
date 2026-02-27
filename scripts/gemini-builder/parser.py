"""
parser.py — YAML frontmatter parsing and skill classification.

Responsibilities:
    - Extract and validate the YAML frontmatter block from SKILL.md content
    - Construct Skill dataclass instances
    - Classify skills as commands vs. global context

Design note — no external dependencies:
    We parse the minimal YAML subset (key: value / key: "quoted value")
    using stdlib ``re`` with ``re.DOTALL``. This avoids requiring PyYAML
    while handling the full range of values found in obra/superpowers,
    including multi-line quoted descriptions and descriptions with
    brackets, colons, and special characters.

Why re.DOTALL:
    The ``description`` field frequently contains quoted strings that span
    multiple lines or include special characters. Without DOTALL, a simple
    ``.*`` group would truncate at the first newline, silently corrupting
    the data. DOTALL makes ``.`` match newlines too, so the full value
    between ``---`` delimiters is always captured.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class Skill:
    """
    Represents a single parsed skill from a SKILL.md file.

    Attributes:
        name:        The machine-readable name from the frontmatter ``name`` field.
        slug:        URL/filename-safe version of ``name`` (hyphens, lowercase).
        description: The human-readable description from the frontmatter.
        body:        Everything after the closing ``---`` delimiter.
        source_path: Absolute path to the originating SKILL.md file.
        is_command:  True when this skill should be emitted as a Gemini CLI command.
    """

    name: str
    slug: str
    description: str
    body: str
    source_path: Path
    is_command: bool = field(default=False)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Matches the frontmatter block: anything between the first two "---" lines.
# re.DOTALL is critical — description values can span multiple lines and
# contain brackets, colons, and other special characters.
_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)", re.DOTALL)

# Matches a frontmatter key: supports both bare and quoted values.
#   name: brainstorming
#   description: "You MUST use this before..."
# Multi-line quoted strings are handled by the DOTALL-inclusive outer match.
_KEY_VALUE_RE = re.compile(
    r'^(?P<key>[a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(?P<value>.+?)$',
    re.MULTILINE,
)


def _parse_frontmatter(raw: str) -> dict[str, str]:
    """
    Extracts key-value pairs from a raw YAML frontmatter string.

    Handles:
    - Bare values: ``name: brainstorming``
    - Double-quoted values: ``description: "some text"``
    - Values containing colons and special characters

    Note: This is not a full YAML parser. It covers the strict subset
    used by obra/superpowers SKILL.md files.

    Args:
        raw: The text between the two ``---`` delimiters.

    Returns:
        dict of key → stripped string value.
    """
    result: dict[str, str] = {}
    for match in _KEY_VALUE_RE.finditer(raw):
        key = match.group("key").strip()
        value = match.group("value").strip()
        # Strip surrounding double quotes (YAML quoted scalars)
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        result[key] = value
    return result


def _slugify(name: str) -> str:
    """
    Converts a skill name into a URL/filename-safe slug.

    Rules:
    - Lowercase
    - Non-alphanumeric characters replaced with hyphens
    - Consecutive hyphens collapsed to one
    - Leading/trailing hyphens stripped

    Args:
        name: Raw skill name string.

    Returns:
        Slug string, e.g. ``"test-driven-development"``.
    """
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_skill_file(content: str, path: Path) -> Skill:
    """
    Parses the full text of a SKILL.md file into a ``Skill`` instance.

    Expected format::

        ---
        name: my-skill
        description: "What this skill does"
        ---

        # Skill body content here...

    Args:
        content:  Full UTF-8 string content of the SKILL.md file.
        path:     Path to the source file (used for error messages and metadata).

    Returns:
        A populated ``Skill`` dataclass.

    Raises:
        ValueError: If the frontmatter block is missing, malformed, or
                    required fields (``name``, ``description``) are absent.
    """
    match = _FRONTMATTER_RE.match(content)
    if not match:
        raise ValueError(
            f"Missing or malformed YAML frontmatter in {path}.\n"
            f"Expected the file to start with a '---' delimited block."
        )

    raw_frontmatter = match.group(1)
    body = match.group(2).strip()

    fields = _parse_frontmatter(raw_frontmatter)

    missing = [f for f in ("name", "description") if not fields.get(f)]
    if missing:
        raise ValueError(
            f"Frontmatter in {path} is missing required field(s): "
            f"{', '.join(missing)}"
        )

    name = fields["name"].strip()
    description = fields["description"].strip()

    return Skill(
        name=name,
        slug=_slugify(name),
        description=description,
        body=body,
        source_path=path,
    )


def classify_skills(
    skills: list[Skill],
    commands_dir: Path | None = None,
    command_slug_overrides: list[str] | None = None,
) -> list[Skill]:
    """
    Classifies each ``Skill`` as a command or global context, mutating
    ``Skill.is_command`` in-place and returning the same list.

    Classification priority (highest to lowest):
    1. Explicit ``--commands`` overrides passed by the user.
    2. Cross-reference with existing ``commands/*.md`` files in the repo.
       A skill is a command when any command file's stem OR its text body
       contains the skill's slug or name. This two-pass approach handles
       the real-world mismatch between command file names and skill slugs
       (e.g. ``brainstorm.md`` references the ``brainstorming`` skill,
       ``execute-plan.md`` references ``executing-plans``).
    3. Default: global context (``is_command = False``).

    Rationale for cross-referencing existing commands/:
        The obra/superpowers repo ships three pre-defined commands
        (brainstorm, execute-plan, write-plan). By treating the existing
        commands/ as the ground truth we stay in sync with upstream intent
        without hard-coding slug names.

    Args:
        skills:                 List of parsed ``Skill`` objects.
        commands_dir:           Path to the repo's ``commands/`` directory.
                                May be None if cross-referencing is not needed.
        command_slug_overrides: Optional list of slug strings that should
                                always be treated as commands regardless of
                                the commands directory contents.

    Returns:
        The same ``skills`` list with ``is_command`` flags set.
    """
    override_set: set[str] = set(command_slug_overrides or [])

    # Build a combined set of tokens from command files:
    # Pass 1 — file stem (e.g. "brainstorm" from brainstorm.md)
    # Pass 2 — all words/slugs referenced in the file body (handles the case
    #           where brainstorm.md body contains "superpowers:brainstorming")
    referenced_tokens: set[str] = set()
    if commands_dir and commands_dir.is_dir():
        for cmd_file in sorted(commands_dir.iterdir()):
            if cmd_file.suffix != ".md":
                continue
            # File stem contributes a token (exact match)
            referenced_tokens.add(cmd_file.stem)
            # Extract all hyphenated/alphanumeric tokens from the body
            # that could be skill slugs (length ≥ 4 avoids noise)
            try:
                body_text = cmd_file.read_text(encoding="utf-8")
                for token in re.findall(r"[a-z][a-z0-9-]{3,}", body_text):
                    referenced_tokens.add(token)
            except (OSError, UnicodeDecodeError):
                pass  # Non-readable files are silently skipped

    for skill in skills:
        # A skill matches if its slug or name appears in the referenced tokens
        skill.is_command = (
            skill.slug in override_set
            or skill.slug in referenced_tokens
            or skill.name in referenced_tokens
        )

    return skills
