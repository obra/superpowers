# Antigravity Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Antigravity, use the available tools below.

| Action skills request | Antigravity equivalent |
|----------------------|----------------------|
| Dispatch a subagent (`Subagent (general-purpose):` template) | On Antigravity 2.0 and CLI, use `invoke_subagent` with a built-in `TypeName` — `self` for full-capability work, `research` for read-only. See [Subagent availability](#subagent-availability) for IDE. |
| Task tracking ("create a todo", "mark complete") | a **task artifact** written with `write_to_file` (see [Task tracking](#task-tracking)). `manage_task` manages background processes. |

## Subagent availability

The tested standalone IDE 2.5.5 has no general subagent tool. When a skill
provides a no-subagent path, follow it. Otherwise, report that the required
delegation cannot run on that surface.

## Task tracking

Antigravity has **no todo tool** (`manage_task` manages background
processes — `list`/`kill`/`status`/`send_input` — it is *not* a checklist). When a
skill says to create a todo list or track tasks, maintain a **task artifact**: a
markdown checklist saved with `write_to_file`, edited with
`replace_file_content` / `multi_replace_file_content` as you go. Follow the
`write_to_file` schema on your surface for artifact metadata. In observed CLI,
2.0, and IDE sessions, writing `task.md` in the conversation's artifact
directory created the task artifact.

At the start of any multi-step task, create the task artifact listing every step of
your plan. As you complete each step, edit the artifact to mark it done (`- [x]`).
If the plan changes, update the checklist. Keep it current — it is your source of
truth for what remains; once the conversation gets long, re-read it before starting
each step.
