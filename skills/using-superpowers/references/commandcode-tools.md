# Command Code Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Command Code these resolve to the tools below.

**Blessed skill invoke path:** read `skills/<name>/SKILL.md` with `read_file` (or use `/skill-name` if already discovered). That is the platform mechanism — do not invent a separate skill tool.

## Tools

| Action skills request | Command Code tool |
|---|---|
| Read a file | `read_file` / `read_multiple_files` |
| Create a new file | `write_file` |
| Edit a file (targeted patch) | `edit_file` |
| List a directory | `read_directory` |
| Find files by name | `glob` |
| Search file contents | `grep` |
| Run a shell command | `shell_command` |
| Fetch a URL / read a webpage | `web_fetch` |
| Search the web | `web_search` |
| Invoke a skill | `read_file` on `skills/<name>/SKILL.md` (or `/skill-name` if already discovered) |
| Dispatch a subagent | `agent` with `subagent_type`: `"general"` \| `"explore"` \| `"plan"` |
| Task tracking | `todo_write` (or `task_create` / `task_update` / `task_list`) |
| Ask the user a question | `ask_user_question` |
| Enter / exit a worktree | `enter_worktree` / `exit_worktree` |

## Invoking a skill

Command Code has no separate Skill tool. Reading `SKILL.md` is the blessed invoke path:

```
read_file(path="skills/brainstorming/SKILL.md")
```

If the skill is already discovered, `/skill-name` is also fine. Prefer the path under the package `skills/` directory when resolving files.

## Subagent dispatch

Use `agent` with an explicit `subagent_type`:

```
agent(subagent_type="general", prompt="...")
agent(subagent_type="explore", prompt="...")
agent(subagent_type="plan", prompt="...")
```

If `agent` is unavailable, do the work inline rather than inventing tool calls.

## Task tracking

Use `todo_write` for session task tracking. If task board tools are available, use `task_create` / `task_update` / `task_list`. Treat older `TodoWrite` references as the task-tracking action.
