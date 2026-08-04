# AdaL Tool Mapping

Skills speak in actions ("dispatch a subagent", "read a file", "invoke a skill"). On AdaL these resolve to the tools below.

## Skill invocation

AdaL has native skill discovery but does not expose a dedicated `Skill` tool. When a Superpowers instruction says to invoke a skill, load the relevant `SKILL.md` with `read_file` when the skill applies. This is the sanctioned mechanism — reading the skill file IS invoking the skill.

## Tool equivalents

| Action skills request | AdaL equivalent |
| --- | --- |
| Read a file | `read_file` |
| Create a file | `create_file` |
| Edit a file | `replace_by_string` or `rewrite_file` |
| Delete lines from a file | `delete_lines` |
| Run shell commands | `bash` |
| Search file contents | `grep` |
| Find files by name | `glob` |
| Fetch a URL | `fetch_url` |
| Web search | `web_search` |
| Dispatch a subagent | Do the work inline in the current session (AdaL has no model-callable subagent tool; optional Engineer mode is a user/runtime command, not a tool the model can call during a turn) |
| Task tracking ("create a todo", "mark complete") | Use plan files or a repo-local `TODO.md` |

## Subagents

AdaL does not currently expose a model-callable subagent dispatch tool. When a Superpowers skill says to dispatch a subagent, do the work sequentially in the current session. Do not fabricate `Task` calls or invent tool names. AdaL's Engineer mode (`/agent engineer`) is a user/runtime command for supervised worker sessions, not a tool the model can call during a turn.

## Task lists

AdaL does not ship a standard task-list tool. Use Superpowers plan files, checklists in Markdown, or a repo-local `TODO.md` for task tracking. Older Superpowers docs may refer to `TodoWrite`; treat that as the task-tracking action above.
