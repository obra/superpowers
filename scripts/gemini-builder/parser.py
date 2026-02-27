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

# Matches a frontmatter key-value pair — single-line values only.
#   name: brainstorming
#   description: "You MUST use this..."
# Note: multi-line quoted values (with an actual embedded newline) are NOT
# supported here. re.MULTILINE makes ^ and $ match line boundaries, but
# value capture stops at end-of-line. All current SKILL.md descriptions
# are single-line, so this is a deliberate, documented constraint.
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
    Classifies every ``Skill`` as a command, mutating ``Skill.is_command``
    in-place and returning the same list.

    Default behaviour (zero-maintenance design):
        ALL skills are classified as commands so that any skill added to
        ``skills/`` automatically becomes a Gemini CLI slash command without
        any manual update to ``commands/`` or configuration files.

    Override behaviour:
        If ``command_slug_overrides`` is provided those slugs are guaranteed
        to be commands (same result as the default, but explicit).

    ``commands_dir`` is accepted for backward compatibility but no longer
    drives classification — the cross-reference logic has been removed in
    favour of the all-commands default.

    Args:
        skills:                 List of parsed ``Skill`` objects.
        commands_dir:           Accepted but unused (kept for API compatibility).
        command_slug_overrides: Optional list of slug strings that should
                                always be treated as commands (no-op under the
                                current all-commands default, but respected).

    Returns:
        The same ``skills`` list with ``is_command`` set to ``True`` for all
        entries.
    """
    override_set: set[str] = set(command_slug_overrides or [])

    for skill in skills:
        # All skills are commands by default (zero-maintenance design).
        # Explicit overrides are a no-op in practice but kept for forward
        # compatibility with any future deny-list mechanism.
        skill.is_command = True or skill.slug in override_set or skill.name in override_set

    return skills
