# Gemini CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Gemini CLI equivalent |
|-----------------|----------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `replace` |
| `Bash` (run commands) | `run_shell_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `glob` |
| `TodoWrite` (task tracking) | `write_todos` |
| `Skill` tool (invoke a skill) | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | `generalist`, `codebase_investigator`, `code-reviewer`, `cli_help` |

## Native subagent support

Gemini CLI supports specialized subagents natively. While Claude Code uses a single `Task` tool, Gemini CLI exposes each subagent as its own dedicated tool.

When a skill refers to the `Task` tool, you should delegate to the most appropriate subagent:
- **`codebase_investigator`**: Architecture mapping, deep analysis, and bug root-cause analysis.
- **`generalist`**: Multi-file refactoring, research, and high-volume tasks.
- **`code-reviewer`**: Validating work against standards and plans.
- **`cli_help`**: Information about Gemini CLI itself.

## Additional Gemini CLI tools

These tools are available in Gemini CLI but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `list_directory` | List files and subdirectories |
| `save_memory` | Persist facts to GEMINI.md across sessions |
| `ask_user` | Request structured input from the user |
| `tracker_create_task` | Rich task management (create, update, list, visualize) |
| `enter_plan_mode` / `exit_plan_mode` | Switch to read-only research mode before making changes |
