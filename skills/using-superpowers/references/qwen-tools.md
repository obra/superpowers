# Qwen Code Tool Mapping

Skills speak in actions ("read a file", "ask a clarifying question"). In Qwen Code, these actions map to native tools as shown below.

| Action skills request | Qwen Code tool equivalent |
|-----------------------|---------------------------|
| Read a file | `read_file` |
| Write / create a file | `write_file` |
| Edit a file | `edit` |
| Run shell commands | `run_shell_command` |
| Search file contents | `grep_search` |
| List files by pattern | `glob` |
| Ask clarifying questions | `ask_user_question` |
| List directories | `list_directory` |
| Read multiple files | `read_many_files` |
| Fetch URL / Web access | `web_fetch` |
| Create / update todos | `todo_write` |
| Invoke a skill | `skill` |
| Dispatch a subagent | `agent` (see [Subagent support](#subagent-support)) |

## Subagent support

Qwen Code supports subagents natively via the `agent` tool.
- Omit `subagent_type` (or specify `subagent_type: "general-purpose"`) to launch a standard awaitable subagent that runs inline and returns its findings.
- Specify `subagent_type: "fork"` to run a detached, fire-and-forget subagent in the background. **Do not** use `"fork"` if you need to read or act on the subagent's output.

## Task and Todo tracking

Use `todo_write` to record and update progress on multi-step tasks.
