# Claude Code Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Claude Code these resolve to the tools below.

| Action skills request | Claude Code equivalent |
|----------------------|------------------------|
| Invoke a skill | `Skill` |
| Dispatch a subagent (`Subagent (general-purpose):` template) | `Agent` (older releases named this `Task`) |
| Multiple parallel dispatches | Multiple `Agent` calls in one response |
| Task tracking ("create a todo", "mark complete") | `TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet`; `TodoWrite` in `claude -p` / Agent SDK unless `CLAUDE_CODE_ENABLE_TASKS=1` is set |

## Instructions file

When a skill mentions "your instructions file", on Claude Code this is **`CLAUDE.md`** at the project root. Claude Code also reads `~/.claude/CLAUDE.md` for global context. Claude Code walks the directory tree upward from the working directory, loading `CLAUDE.md` files it finds along the way.

## Personal skills directory

User-level skills live at **`~/.claude/skills/`**.
