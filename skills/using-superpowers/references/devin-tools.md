# Devin CLI Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Devin CLI these resolve to the tools below.

| Action skills request | Devin CLI equivalent |
| --- | --- |
| Invoke a skill | The native `skill` tool (skills also appear as `/superpowers:<skill>` slash commands) |
| Dispatch a subagent (`Subagent (general-purpose):` template) | `run_subagent` with the `subagent_general` profile; use `subagent_explore` for read-only exploration |
| Task tracking ("create a todo", "mark complete") | `todo_write` |
| Ask the user / present options | `ask_user_question` (native multiple-choice prompts; fall back to plain text in non-interactive mode) |

## Subagents

`run_subagent` subagents are stateless and cannot ask clarifying questions — front-load the full context and exact instructions in the task prompt, as the subagent-driven-development templates already do. Run independent tasks in parallel with `is_background: true`; keep dependent tasks sequential.

## File, shell, and search tools

Devin CLI exposes native tools for reading, writing, and editing files, running shell commands, and searching (grep/glob). Exact tool names can vary by session mode — use whichever file/shell/search tools your session exposes rather than names remembered from another harness.
