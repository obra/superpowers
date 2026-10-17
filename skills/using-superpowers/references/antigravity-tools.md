# Antigravity (`agy`, IDE & Desktop App) Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Google Antigravity (`agy` CLI, Antigravity IDE, and Antigravity 2.0) these resolve to the tools below.

| Action skills request | Antigravity equivalent |
|----------------------|----------------------|
| Dispatch a subagent (`Subagent (general-purpose):` template) | `invoke_subagent` with a built-in `TypeName` — `self` for full-capability work, `research` for read-only |
| Follow-up / fix round with an existing subagent | `send_message` with `Recipient` set to the subagent's `conversationID` |
| Task tracking ("create a todo", "mark complete") | a **task artifact** — `write_to_file` in `<appDataDir>/brain/<conversation-id>/` with `ArtifactMetadata` (or `IsArtifact: true` and `ArtifactType: "task"` on older `agy` builds; see [Task tracking](#task-tracking)). **Not** `manage_task`, which manages background processes. |

## Subagent dispatch & reactive wakeup

- **Spawning (`invoke_subagent`):** Pass one or more entries in the `Subagents` array to launch subagents concurrently. Always set `Model: "inherit"` unless your human partner explicitly requests a different tier. For isolated branch work, `Workspace` supports `"inherit"` (default), `"branch"`, or `"share"`.
- **Fix rounds (`send_message`):** Resume an existing implementer or reviewer by calling `send_message` with `Recipient` set to its `conversationID` rather than spawning a new subagent.
- **Reactive wakeup (no polling):** `invoke_subagent` and `send_message` run asynchronously in the background. Do **not** poll `manage_subagents` (`Action: "list"`) in a loop — stop calling tools at the end of your turn and the harness will automatically resume your execution when the subagent replies.

## Task tracking

Antigravity has **no todo tool** (`manage_task` manages background
processes — `list`/`kill`/`status`/`send_input` — it is *not* a checklist). When a
skill says to create a todo list or track tasks, maintain a **task artifact**: a
markdown checklist saved with `write_to_file` in `<appDataDir>/brain/<conversation-id>/` with `ArtifactMetadata` (or `IsArtifact: true`,
`ArtifactMetadata.ArtifactType: "task"` on older `agy` CLI builds), edited with `replace_file_content` /
`multi_replace_file_content` as you go.

At the start of any multi-step task, create the task artifact listing every step of
your plan. As you complete each step, edit the artifact to mark it done (`- [x]`).
If the plan changes, update the checklist. Keep it current — it is your source of
truth for what remains; once the conversation gets long, re-read it before starting
each step.
