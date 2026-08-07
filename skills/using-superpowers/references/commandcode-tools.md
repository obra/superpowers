# Command Code Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Command Code these resolve to:

| Action skills request | Command Code equivalent |
|---|---|
| Read a file | `read_file` (single) or `read_multiple_files` |
| Read multiple files | `read_multiple_files` |
| Create a new file | `write_file` |
| Edit a file | `edit_file` |
| List files / directories | `read_directory` |
| Find files by name | `glob` |
| Search file contents | `grep` |
| Run a shell command | `shell_command` |
| Fetch a URL | `web_fetch` |
| Search the web | `web_search` |
| Invoke a skill | Read the skill's `SKILL.md` with `read_file` or invoke `/skill-name` / `/skill:name` |
| Dispatch a subagent | `agent` with `subagent_type: "general" | "explore" | "plan"` |
| Task tracking | `todo_write` (session checklist) or `task_create`/`task_update`/`task_list` (durable ledger) |
| Ask the user a question | `ask_user_question` |
| Enter / exit worktree | `enter_worktree` / `exit_worktree` (fallback: `shell_command` + `git worktree`) |

**Notes:**
- "Create a todo" → `todo_write`
- "Dispatch a subagent" → `agent` (general-purpose by default)
- "Invoke a skill" → read its `SKILL.md` directly; Command Code has no standalone `Skill` tool
