# CodeBuddy Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On CodeBuddy these resolve to the tools below.

CodeBuddy is compatible with the Claude Code plugin format. The existing `.claude-plugin/plugin.json` manifest, `hooks/hooks.json` configuration, and `hooks/session-start` bootstrap script work without modification — CodeBuddy sets `CLAUDE_PLUGIN_ROOT` (in addition to `CODEBUDDY_PLUGIN_ROOT`) when running plugin hooks, so the session-start script's Claude Code branch fires correctly.

| Action skills request | CodeBuddy equivalent |
| --- | --- |
| Read a file | `read_file` |
| Create / edit / delete a file | `write_to_file` (create/overwrite), `replace_in_file` (targeted edits), `delete_file` |
| Run a shell command | `execute_command` |
| Search file contents / find files by name | `search_content` (regex content search), `search_file` (filename pattern search) |
| Fetch a URL / web search | `web_fetch` (retrieve & summarize URL), `web_search` (search the web) |
| Dispatch a subagent | `task` with `subagent_name` — use `code-explorer` for codebase exploration. CodeBuddy also supports team mode for async parallel agents. |
| Create / update todos | No native todo tool. Track tasks in a plan file or `TODO.md`. |
| Invoke a skill | `use_skill` — the native skill-loading tool. Skills are auto-discovered from the plugin's `skills/` directory. |

## Skills

CodeBuddy has a native `use_skill` tool and auto-discovers skills from the plugin's `skills/` directory. When a skill applies, invoke it with `use_skill` and the skill name (e.g. `use_skill` with `command: "brainstorming"`).

## Subagents

CodeBuddy's `task` tool dispatches subagents. The `subagent_name` parameter selects the agent type (e.g. `code-explorer` for codebase exploration). CodeBuddy also supports a team mode where multiple agents work asynchronously in parallel and communicate via `send_message`.

## Task tracking

CodeBuddy has no native todo/task-list tool. When a skill says to create a todo list or track tasks, maintain a markdown checklist in a plan file or repo-local `TODO.md`. Older Superpowers docs may refer to `TodoWrite`; treat that as the task-tracking action above.
