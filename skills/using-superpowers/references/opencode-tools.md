# OpenCode Tool Mapping

Skills speak in actions ("invoke a skill", "dispatch a subagent", "create a todo", "read a file"). On OpenCode these resolve to the tools below.

## Skill IDs: use the bare id

OpenCode registers Superpowers skills under **bare ids** (`brainstorming`,
`writing-plans`, `systematic-debugging`, …). The qualified form
`superpowers:brainstorming` does **not** exist in its registry and the call
fails with `Unable to load skill superpowers:<name>`.

- Invoke a skill → OpenCode's native `skill` tool with the bare id
  (e.g. skill `brainstorming`, never `superpowers:brainstorming`).
- The same applies when one skill names another: read
  `superpowers:writing-plans` in skill text as skill `writing-plans`.

## Other actions

| Action skills request | OpenCode equivalent |
| --- | --- |
| Dispatch a subagent (`Subagent (general-purpose):` template) | V1: `task` with `subagent_type: "general"`; V2: `subagent` with `agent: "general"` (continuation via `sessionID`) |
| Task tracking ("create a todo", "mark complete") | V1: `todowrite`; V2 has no todo tool — track the plan in a markdown file (or the harness's plan facility) instead |
| Read files | `read` |
| Create, edit, or delete files | V1: `apply_patch`; V2: `patch` (same patch format) |
| Run shell commands | V1: `bash`; V2: `shell` |
| Search files | `grep`, `glob` |
| Fetch a URL | `webfetch` |

If your OpenCode version's tool names differ from the table, prefer what the
harness actually offers — the skill tool itself is always called `skill`.
