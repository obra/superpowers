# Antigravity CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Antigravity CLI equivalent |
|-----------------|----------------------|
| `Read` (file reading) | `view_file` |
| `Write` (file creation) | `write_to_file` |
| `Edit` (file editing) | `replace_file_content` / `multi_replace_file_content` |
| `Bash` (run commands) | `run_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `glob` |
| `TodoWrite` (task tracking) | `write_todos` (or task/todo comments) |
| `Skill` tool (invoke a skill) | `activate_skill` |
| `WebSearch` | `search_web` |
| `WebFetch` | `read_url_content` |
| `Task` tool (dispatch subagent) | `invoke_subagent` / `define_subagent` (see [Subagent support](#subagent-support)) |

## Subagent support

Antigravity CLI supports subagents natively via the `invoke_subagent` and `define_subagent` tools. Use these tools to delegate specific, independent tasks to subagents.

When a skill says to dispatch a named agent type:
1. Define the subagent type if not already defined using `define_subagent`.
2. Invoke the subagent using `invoke_subagent` with the prompt template from the skill filled with appropriate task details.
3. Communicate using `send_message` when needed.

| Skill instruction | Antigravity CLI equivalent |
|-------------------|----------------------|
| `Task tool (superpowers:implementer)` | `invoke_subagent` with `implementer` role and filled prompt |
| `Task tool (superpowers:spec-reviewer)` | `invoke_subagent` with `spec-reviewer` role and filled prompt |
| `Task tool (superpowers:code-reviewer)` | `invoke_subagent` with `code-reviewer` role and filled prompt |
| `Task tool (superpowers:code-quality-reviewer)` | `invoke_subagent` with `code-quality-reviewer` role and filled prompt |
| `Task tool (general-purpose)` | `invoke_subagent` with task-specific role and prompt |

### Parallel dispatch

Antigravity CLI supports parallel subagent execution. When a skill asks you to dispatch multiple independent tasks in parallel, define/invoke the subagents concurrently by specifying multiple subagent objects in the `Subagents` array of a single `invoke_subagent` call.
