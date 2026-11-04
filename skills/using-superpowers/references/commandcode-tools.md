# Command Code Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Command Code these resolve to the tools below.

**Invoke a skill with `activate_skill`.** Command Code has a native skill tool. The catalog (names and descriptions) is in the system prompt; `activate_skill` loads the `SKILL.md` body. This package registers its `skills/` directory with `cmd.addSkillsPath` and `package.json` `commandcode.skills`, so Superpowers skills are in that catalog after `cmd mods add`. Do not read `SKILL.md` with `read_file` to invoke a skill.

## Tools

| Action skills request | Command Code tool |
|---|---|
| Read a file | `read_file` (`file_path`, or `paths` for several files) |
| Create a new file | `write_file` |
| Edit a file (targeted patch) | `edit_file` |
| List a directory | `read_directory` |
| Find files by name | `glob` |
| Search file contents | `grep` |
| Run a shell command | `shell_command` |
| Fetch a URL / read a webpage | `web_fetch` |
| Search the web | `web_search` |
| Invoke a skill | `activate_skill` with the skill's `name` |
| Run a slash command | `run_command` (interactive sessions) |
| Dispatch a subagent | `agent` with `subagent_type`: `"general"` \| `"explore"` \| `"plan"` |
| Collect a background subagent | `agent_output` |
| Session task checklist | `todo_write` |
| Durable task ledger | `task_create` / `task_update` / `task_list` / `task_get` |
| Ask the user a question | `ask_user_question` |
| Enter or exit plan mode | `enter_plan_mode` / `exit_plan_mode` |
| Enter or exit a worktree | `enter_worktree` / `exit_worktree` |

## Invoking a skill

```
activate_skill(name="brainstorming")
```

`read_multiple_files` is not a current tool. Multi-file reads are `read_file` with `paths`. Calls that still arrive under the old name are rewritten to `read_file`.

If a skill name collides with a built-in or custom command, plain `/name` routes to that command. Invoke the skill as `/skill:<name>` through `run_command`. `run_command` is interactive-session only.

If `activate_skill` reports that the skill is not in the catalog, the package skill path did not load. Fix discovery (`cmd mods list`, then a fresh session) rather than reading `SKILL.md` from disk.

## Subagent dispatch

```
agent(subagent_type="general", prompt="...")
agent(subagent_type="explore", prompt="...")
agent(subagent_type="plan", prompt="...")
```

`description` and `prompt` are required. Subagents cannot spawn further agents: they are not granted `agent`, `agent_output`, plan mode, worktrees, `run_command`, or `ask_user_question`.

Background work returns an `agent_id`. Collect it with `agent_output` (`action`: `wait`, `status`, or `kill`).

If `agent` is unavailable, do the work inline rather than inventing tool calls.

## Task tracking

Use `todo_write` for the session checklist (the `/todos` panel). Each call replaces the whole list: `{content, status: pending|in_progress|completed, activeForm?, id?}`.

Use `task_create`, `task_update`, `task_list`, and `task_get` for the durable task ledger. Treat older `TodoWrite` references as this task-tracking action.

## Plan mode

`enter_plan_mode` takes no arguments. `exit_plan_mode` presents the plan for approval. Several Superpowers skills ask to enter plan mode before implementation; use these tools rather than only describing the switch.
