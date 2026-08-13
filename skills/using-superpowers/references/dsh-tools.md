# DeepSeek Harness (dsh) Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On the DeepSeek Harness these resolve to the tools below. The full mapping for the deltas is inlined in the `superpowers:bootstrap` system-prompt section the plugin registers; keep the two in sync.

| Action skills request | DeepSeek Harness equivalent |
| --- | --- |
| Read a file | `read` (`file_path`; returns line-numbered text) |
| Create a file | `write` (full replacement) |
| Edit a file | `edit` (literal `old_string`/`new_string`; set `replace_all` when the match repeats) |
| Delete a file | `bash` with `rm` |
| Run a shell command | `bash` (fresh shell per call; pass `workdir`; set `run_in_background: true` for long work, then `job_output` / `job_kill` / `job_list`) |
| Search file contents | `grep` (ripgrep syntax) |
| Find files by name | `glob` |
| Fetch a URL / web search | `web_search` |
| Invoke a skill | `skill` with the exact skill name from the session skill catalog. Catalog names are plain (`brainstorming`), never the `superpowers:`-prefixed forms used in skill prose. |
| Dispatch a subagent | `subagent` (standalone prompt; background by default) or `subagent_fork` (inherits this conversation). There are NO named subagent types — put the role and instructions in the prompt itself. Follow up with `send_message`, list with `list_agents`, stop with `interrupt_agent`. Large multi-agent orchestration → `workflow`. Fresh-agent iteration loops → `ralph` (only when the human asks for them). |
| Create / update todos | `todo_write` (send the ENTIRE list every call — it replaces the previous list) |
| Ask the human partner | `ask_user_question` |
| Long-running objectives | `create_goal` / `get_goal` / `update_goal` |
| Plan mode | `exit_plan_mode` (present the complete plan as markdown; implement only after approval) |

## Skills

dsh has a native skill system: a `skill` tool plus a layered registry. This plugin reads every `skills/*/SKILL.md` at load time and registers it through `ctx.skills`, so each skill appears in the session skill catalog under its plain frontmatter name. Always load skills through the `skill` tool — do not read `SKILL.md` files directly.

## Bootstrap

dsh has no session-start shell hook. The plugin instead registers the `using-superpowers` body as an ordered system-prompt section, which dsh reassembles before every model step — so the bootstrap is present from the first request and after compaction with no per-session opt-in. The inline tool mapping for the deltas below is part of that section.

## Subagents

dsh subagents are prompt-only: there is no subagent-type parameter. Write the role and full instructions into the `subagent` prompt itself, and pass any context the child needs, because a plain `subagent` sees none of this conversation. Skills that dispatch typed subagents (e.g. `dispatching-parallel-agents`, `subagent-driven-development`) must translate each type into an equivalent prompt preamble. `subagent_fork` is the variant that inherits this conversation. Both are background-first; results arrive as notices, and follow-ups go through `send_message`.

## Task lists

Use `todo_write`. It replaces the entire list on every call — resend all items, not a delta. Older Superpowers docs may refer to `TodoWrite`; treat that as this action.

## Plan mode

dsh plan mode uses `exit_plan_mode`: present the complete plan as markdown in that single tool call and implement only after approval. Brainstorming still comes first — the `using-superpowers` rule ("before entering plan mode, invoke brainstorming") applies unchanged.
