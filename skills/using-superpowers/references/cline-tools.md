# Cline Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Cline these resolve to the tools below.

| Action skills request | Cline equivalent |
| --- | --- |
| Invoke a skill | Cline's native `skills` tool (invocation: `<skill> [args]`). Slash commands `/<skill>` also work. |
| Read files | `read_files` |
| Create / edit / delete files | `editor` or `apply_patch` |
| Run shell commands | `run_commands` |
| Search file contents | `search_codebase` (regex, multiple parallel searches in one call) |
| Ask the user a question with options | `ask_question` |
| Dispatch a subagent | `spawn_agent` (synchronous) or `start_subagent` / `get_subagent` / `message_subagent` (async background) |
| Task tracking / todos | Plan-mode todo UI, or the `tasks` tool when available, or a plan markdown file |

## Subagents

Cline ships `spawn_agent` for synchronous subagent runs (waits for the result before continuing). If the agents-squad plugin is installed, `start_subagent` / `get_subagent` / `message_subagent` provide async background runs with polling — prefer these for parallel work (SDD, dispatching-parallel-agents).

When a skill says "Task tool (general-purpose)" or "dispatch an implementer/reviewer subagent", call `spawn_agent` (or `start_subagent`) with a precise, self-contained `systemPrompt` and `task`.

## Task lists

Cline's plan mode has a built-in todo UI. If the `tasks` tool is available, use it for durable todos. Otherwise track the plan in a markdown file under the repo — Superpowers skills already accept plan files as the canonical record.