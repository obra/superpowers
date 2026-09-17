# Muse Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Muse these resolve to the tools below.

| Action skills request | Muse equivalent |
|----------------------|----------------|
| Read a file | `read_file` |
| Read multiple files | `read_file` (call multiple times) or `search` |
| Create a new file | `write_file` |
| Edit a file | `edit_file` |
| Run a shell command | `bash` |
| Search file contents | `search` |
| Find files by name | `search` with `glob` |
| Fetch a URL | `web_fetch` |
| Search the web | `web_search` |
| Invoke a skill | `read_file` on `skills/<name>/SKILL.md` or native skill tool |
| Dispatch a subagent (`Subagent (general-purpose):` template) | `subagent_spawn` with prompt filling |
| Task tracking ("create a todo", "mark complete") | `write_todos` or `bash` task file |
| Ask the user a question | `request_user_input` |

## Instructions file

When a skill mentions "your instructions file", on Muse this is **`CLAUDE.md`** or **`AGENTS.md`** in the project root. Muse loads these hierarchically where configured.

## Skill invocation

Muse has native skill support via `muse skills`. To invoke a Superpowers skill, read its `SKILL.md` and follow the instructions. The bootstrap (`using-superpowers`) is injected automatically at `SessionStart` via the plugin hook — you are already following it, do not re-load it.

## Subagent dispatch

Use `subagent_spawn` to delegate work to isolated subagents. Fill prompt templates (e.g., `implementer-prompt.md`, `task-reviewer-prompt.md`) before dispatching. If no subagent tool is available, do the work inline rather than inventing tool calls.

## Task tracking

Use `write_todos` for checklist tracking. Create one todo per skill checklist item, mark in_progress/completed as you go. If `write_todos` is unavailable, maintain a markdown task file via `write_file`/`edit_file`.
