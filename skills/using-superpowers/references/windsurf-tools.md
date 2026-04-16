# Windsurf Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Windsurf equivalent |
|-----------------|---------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_to_file` |
| `Edit` (file editing) | `edit` or `multi_edit` |
| `Bash` (run commands) | `run_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `find_by_name` |
| `TodoWrite` (task tracking) | `todo_list` |
| `Skill` tool (invoke a skill) | `skill` tool — works the same as Claude Code's `Skill` tool |
| `WebSearch` | `search_web` |
| `WebFetch` | `read_url_content` |
| `Task` tool (dispatch subagent) | No equivalent — execute tasks sequentially in current session |

## Subagent Handling in Windsurf

Windsurf does not have a `Task` tool for spawning subagents. When a skill instructs you to "dispatch a subagent", execute each task sequentially within the current session instead. Follow the same logical process (implementation, review, etc.) but perform each step yourself.

## Additional Windsurf tools

These tools are available in Windsurf but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `list_dir` | List files and directories in a path |
| `code_search` | Fast context search using parallel grep and readfile |
| `create_memory` | Save important context to memory database |
| `browser_preview` | Spin up browser preview for web servers |
| App Deploys | Deploy web applications to Netlify via Cascade tool calls |

## Windsurf-specific features

- **Skills**: Discovered from `.windsurf/skills/` (workspace) and `~/.codeium/windsurf/skills/` (global)
- **Rules**: Stored in `.windsurf/rules/` (workspace) and `~/.codeium/windsurf/memories/global_rules.md` (global)
- **Workflows**: Stored in `.windsurf/workflows/` (workspace)
- **Cascade Modes**: Code mode, Plan mode, Ask mode
- **Auto-execution**: Commands can be auto-executed based on safety level
