import os
import re
from typing import Optional

BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for hermes"

# Resolved once at import — avoids repeated path work on every session-start.
# hermes plugins install does a full git clone, so .hermes-plugin/__init__.py
# and skills/ end up at the same level in ~/.hermes/plugins/superpowers/.
_SKILLS_DIR: str = os.path.realpath(
    os.path.join(os.path.dirname(__file__), "..", "skills")
)

# Module-level cache:
#   None  = not yet assembled
#   False = SKILL.md missing (skip injection silently)
#   str   = assembled bootstrap content
_bootstrap_cache = None

_last_session_id = None


def _strip_frontmatter(content: str) -> str:
    match = re.match(r"^---\n[\s\S]*?\n---\n([\s\S]*)$", content)
    return (match.group(1) if match else content).strip()


def _hermes_tool_mapping() -> str:
    # Tool names confirmed empirically in Task 1.
    return """\
## Hermes tool mapping

When skills request actions, use these Hermes equivalents:

| Action | Hermes tool |
|--------|-------------|
| Read a file | `read_file` |
| Create a new file | `write_file` |
| Edit a file (targeted patch) | `patch` |
| Run a shell command | `terminal` |
| Search file contents | `search_files` |
| Find files by name | `terminal` with `find` |
| Fetch a URL / read a webpage | `web_extract(urls=[...])` |
| Search the web | `web_search(query=...)` |
| Dispatch a subagent | `delegate_task(goal=..., context=..., toolsets=[...], role="leaf")` |
| Task tracking | `todo` tool |
| Invoke a skill | `skill_view("skill-name")` — this is the native skill-loading mechanism on Hermes |
"""


def _get_bootstrap() -> Optional[str]:
    global _bootstrap_cache
    if _bootstrap_cache is not None:
        return None if _bootstrap_cache is False else _bootstrap_cache

    skill_path = os.path.join(_SKILLS_DIR, "using-superpowers", "SKILL.md")
    if not os.path.exists(skill_path):
        _bootstrap_cache = False
        return None

    with open(skill_path, encoding="utf-8") as f:
        raw = f.read()

    body = _strip_frontmatter(raw)
    _bootstrap_cache = (
        f"<EXTREMELY_IMPORTANT>\n"
        f"{BOOTSTRAP_MARKER}\n\n"
        f"You have superpowers.\n\n"
        f"The using-superpowers skill content is included below and is already "
        f"loaded for this Hermes session. Follow it now. "
        f"Do not try to load using-superpowers again.\n\n"
        f"{body}\n\n"
        f"## Loading Superpowers Skills on Hermes\n\n"
        f"Superpowers skills are NOT in Hermes' built-in skill registry — "
        f"`skill_view` will return 'not found' for them. "
        f"When using-superpowers tells you to invoke a skill, use this two-step:\n\n"
        f"1. Try `skill_view(\"skill-name\")` first (it works for Hermes' own skills).\n"
        f"2. If that returns 'not found', immediately use `read_file` instead:\n"
        f"   `read_file(\"{_SKILLS_DIR}/skill-name/SKILL.md\")`\n\n"
        f"Example — to load the brainstorming skill:\n"
        f"  `read_file(\"{_SKILLS_DIR}/brainstorming/SKILL.md\")`\n\n"
        f"The superpowers skills directory is: `{_SKILLS_DIR}`\n\n"
        f"{_hermes_tool_mapping()}\n"
        f"</EXTREMELY_IMPORTANT>"
    )
    return _bootstrap_cache


def register(ctx):
    def on_session_start(**kwargs):
        global _last_session_id
        session_id = kwargs.get("session_id")
        if session_id is not None and session_id == _last_session_id:
            return
        bootstrap = _get_bootstrap()
        if bootstrap is None:
            return
        ctx.inject_message(bootstrap, role="user")
        _last_session_id = session_id

    ctx.register_hook("on_session_start", on_session_start)
