# Qwen Code Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Qwen Code equivalent |
|-----------------|----------------------|
| `Read` (file reading) | `File System` (read) |
| `Write` (file creation) | `File System` (write) |
| `Edit` (file editing) | `File System` (edit/replace) |
| `Bash` (run commands) | `Shell` |
| `Grep` (search file content) | `Shell` (using standard grep) |
| `Glob` (search files by name) | `Shell` (using find or similar) |
| `TodoWrite` (task tracking) | `Todo Write` / `Task` |
| `Skill` tool (invoke a skill) | Native `/skills` command or autonomous invocation |
| `WebSearch` | `Web Search` |
| `WebFetch` | `Web Fetch` |

## Subagent Support

Qwen Code supports task management and subagents natively. Use the `Task` tool for dispatching subagents when a skill requires it (e.g., `subagent-driven-development`).
