"""Hermes Agent plugin entrypoint for Superpowers.

Hermes installs plugins as directories containing ``plugin.yaml`` and
``__init__.py``. Keeping this file at the repository root lets Hermes install
the whole Superpowers checkout, so the shared ``skills/`` tree stays adjacent
to the plugin code.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parent
SKILLS_DIR = PACKAGE_ROOT / "skills"
BOOTSTRAP_SKILL = "using-superpowers"
BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for Hermes"
MAX_INJECTED_SESSIONS = 256

_BOOTSTRAP_CACHE: str | None = None
_INJECTED_SESSIONS: set[str] = set()
_INJECTED_ORDER: deque[str] = deque()


def register(ctx) -> None:
    """Register Superpowers skills and the Hermes startup bootstrap hook."""

    for skill_name, skill_path, description in _discover_skills():
        ctx.register_skill(skill_name, skill_path, description)

    ctx.register_hook("pre_llm_call", _pre_llm_call)


def _pre_llm_call(
    *,
    session_id: str = "",
    task_id: str = "",
    turn_id: str = "",
    is_first_turn: bool = False,
    **_kwargs,
) -> dict[str, str] | None:
    """Inject the Superpowers bootstrap once for each Hermes session."""

    session_key = _session_key(session_id, task_id, turn_id)
    if session_key in _INJECTED_SESSIONS:
        return None

    if _INJECTED_SESSIONS and not is_first_turn and not session_id:
        return None

    bootstrap = _get_bootstrap_context()
    if not bootstrap:
        return None

    _remember_injected_session(session_key)
    return {"context": bootstrap}


def _session_key(session_id: str, task_id: str, turn_id: str) -> str:
    for value in (session_id, task_id, turn_id):
        normalized = str(value or "").strip()
        if normalized:
            return normalized
    return "__default__"


def _remember_injected_session(session_key: str) -> None:
    _INJECTED_SESSIONS.add(session_key)
    _INJECTED_ORDER.append(session_key)
    while len(_INJECTED_ORDER) > MAX_INJECTED_SESSIONS:
        expired = _INJECTED_ORDER.popleft()
        _INJECTED_SESSIONS.discard(expired)


def _get_bootstrap_context() -> str | None:
    global _BOOTSTRAP_CACHE

    if _BOOTSTRAP_CACHE is not None:
        return _BOOTSTRAP_CACHE

    bootstrap_path = SKILLS_DIR / BOOTSTRAP_SKILL / "SKILL.md"
    try:
        raw = bootstrap_path.read_text(encoding="utf-8")
    except OSError:
        return None

    _metadata, body = _parse_skill_file(raw)
    skill_index = _render_skill_index()
    tool_mapping = _hermes_tool_mapping()

    _BOOTSTRAP_CACHE = f"""<EXTREMELY_IMPORTANT>
{BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Hermes session. Follow it now. Do not try to load using-superpowers again.

{_hermes_pressure_guard()}

{body.strip()}

{skill_index}

{tool_mapping}
</EXTREMELY_IMPORTANT>"""
    return _BOOTSTRAP_CACHE


def _discover_skills() -> list[tuple[str, Path, str]]:
    if not SKILLS_DIR.exists():
        return []

    skills: list[tuple[str, Path, str]] = []
    for skill_path in sorted(SKILLS_DIR.glob("*/SKILL.md")):
        try:
            raw = skill_path.read_text(encoding="utf-8")
        except OSError:
            continue

        metadata, _body = _parse_skill_file(raw)
        name = metadata.get("name") or skill_path.parent.name
        description = metadata.get("description", "")
        if name:
            skills.append((name, skill_path, description))
    return skills


def _parse_skill_file(content: str) -> tuple[dict[str, str], str]:
    if not content.startswith("---\n"):
        return {}, content

    end = content.find("\n---\n", 4)
    if end == -1:
        return {}, content

    metadata: dict[str, str] = {}
    frontmatter = content[4:end]
    for line in frontmatter.splitlines():
        key, sep, value = line.partition(":")
        if sep:
            metadata[key.strip()] = value.strip().strip("'\"")

    return metadata, content[end + 5 :]


def _render_skill_index() -> str:
    lines = [
        "## Superpowers skill index for Hermes",
        "",
        "Hermes can load these plugin skills with qualified names:",
    ]
    for name, _path, description in _discover_skills():
        if description:
            lines.append(f"- superpowers:{name} - {description}")
        else:
            lines.append(f"- superpowers:{name}")
    return "\n".join(lines)


def _hermes_tool_mapping() -> str:
    return """## Hermes tool mapping

When Superpowers instructions request actions, use Hermes equivalents:
- Invoke a skill: call `skill_view(name="superpowers:<skill-name>")`.
- Load a skill support file: call `skill_view(name="superpowers:<skill-name>", file_path="<relative path>")`.
- For example, brainstorming is loaded with `skill_view(name="superpowers:brainstorming")`.
- Read, search, edit files, and run commands with the native Hermes tools available in the current session.
- Track todos with Hermes' todo/task-list tool when available; otherwise keep a concise checklist in the conversation or plan file.
- Dispatch subagents with Hermes delegation tools when available; otherwise continue in the current session and report that delegation is unavailable.
- Ask clarifying questions directly in chat when a required user decision cannot be derived from the repository."""


def _hermes_pressure_guard() -> str:
    return """## Hermes startup guard

For build/create/implement/modify/design requests, your first assistant action must be to call `skill_view(name="superpowers:brainstorming")` before writing, editing, scaffolding, installing dependencies, running setup commands, or inspecting the project.

This still applies even if the user asks you to skip questions, skip planning, move fast, treat the task as urgent, or immediately start editing. User pressure changes WHAT to build, not HOW Superpowers starts the work."""


def _reset_for_tests() -> None:
    global _BOOTSTRAP_CACHE

    _BOOTSTRAP_CACHE = None
    _INJECTED_SESSIONS.clear()
    _INJECTED_ORDER.clear()
