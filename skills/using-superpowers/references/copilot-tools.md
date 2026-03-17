# GitHub Copilot Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Copilot agent mode equivalent |
|-----------------|-------------------------------|
| `Read` (file reading) | Read file contents (built-in) |
| `Write` (file creation) | Create/write files (built-in) |
| `Edit` (file editing) | Edit files (built-in) |
| `Bash` (run commands) | Run in terminal (built-in) |
| `Grep` (search content) | Workspace search or terminal `grep`/`rg` |
| `Glob` (search by name) | Workspace file search or terminal `find` |
| `TodoWrite` (task tracking) | No equivalent — track progress with markdown checklists in chat |
| `Skill` tool (invoke a skill) | No equivalent — read the skill's SKILL.md file directly |
| `Task` tool (dispatch subagent) | No equivalent — Copilot does not support subagents |
| `WebSearch` | No equivalent in agent mode |
| `WebFetch` | No equivalent in agent mode |

## No subagent support

Copilot agent mode has no equivalent to Claude Code's `Task` tool. Skills that rely on subagent dispatch (`subagent-driven-development`, `dispatching-parallel-agents`) will fall back to single-session execution via `executing-plans`.

