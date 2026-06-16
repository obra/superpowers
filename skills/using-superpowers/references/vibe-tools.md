# Mistral Vibe Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Mistral Vibe equivalent |
|-----------------|------------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `search_replace` |
| `Bash` (run commands) | `bash` |
| `Grep` (search file content) | `grep` |
| `Glob` (search files by name) | Use `bash` with `find` or `grep` for file discovery |
| `TodoWrite` (task tracking) | `todo` (use action="write" with todo items) |
| `Skill` tool (invoke a skill) | `skill` |
| `WebSearch` | `websearch` |
| `WebFetch` | `webfetch` |
| `Task` tool (dispatch subagent) | `task` (default agent: `explore`) |
| `EnterPlanMode` | Switch to `plan` agent via `--agent plan` or agent switching |
| `ExitPlanMode` | `exit_plan_mode` |

## Subagent support

Mistral Vibe supports subagent dispatch via the `task` tool. Available subagent types:

| Agent | Purpose |
|-------|---------|
| `explore` | Read-only codebase exploration (default) |
| `default` | General-purpose with approval gates |
| `accept-edits` | Auto-approves file modifications |
| `auto-approve` | Approves all actions without confirmation |

When a skill dispatches a named agent (e.g., `superpowers:code-reviewer`), use the `task` tool with the `default` agent and include the agent's prompt content from `agents/code-reviewer.md` in the task description.

## Additional Mistral Vibe tools

These tools are available in Mistral Vibe but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `ask_user_question` | Request structured input from the user with choices |

## Context files

Mistral Vibe automatically discovers and injects `AGENTS.md` files from `.vibe/` directories. Use these for project-specific instructions.
