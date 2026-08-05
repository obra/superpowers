# Junie Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Junie these resolve to the tools below.

| Action skills request | Junie equivalent |
|----------------------|------------------|
| Read a file | `open` / `open_entire_file` |
| Read multiple files | (Multiple `open` calls) |
| Create a new file | `create` |
| Edit a file | `search_replace` (single edit) / `multi_edit` (multiple edits) |
| Run a shell command | `bash` |
| Search file contents | `grep_search` |
| Find files by name | `glob_search` |
| Fetch a URL | `fetch_url` |
| Search the web | `web_search` |
| Invoke a skill | `agent_skill_read_doc` |
| Dispatch a subagent | `spawn_subagent` |
| Wait for a subagent | `wait_for_subagent` |
| Stop a subagent | `stop_subagent` |
| Ask the user | `ask_user` |
| Task tracking | `update_status` (maintains the plan and status) |
| Finish task | `submit` |
| Answer the user | `answer` |

## Task tracking

Junie has a native `update_status` tool that you MUST use to maintain your plan and track progress. When a skill says "create a todo" or "mark complete", use `update_status` to update the `plan` parameter. The tool also captures your analysis and a message for the user.

## Subagent support

Junie dispatches subagents via `spawn_subagent`. It returns a handle immediately. Use `wait_for_subagent` if you need to block until it finishes. Otherwise, continue working; you will receive the result in a future message as a `<subagents_status>` update.

## Skill Discovery

Junie discovers skills in the `skills/` directory of the project root. Use `agent_skill_read_doc` to read the content of a skill. When reading a skill, always read the main body first (omitting `path`) to understand the skill's capabilities.
