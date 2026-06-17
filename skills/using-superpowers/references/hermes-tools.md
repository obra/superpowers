# Hermes Agent Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Hermes these resolve to the tools below.

| Action skills request | Hermes equivalent |
|----------------------|-------------------|
| Read a file | `read_file` |
| Create a new file | `write_file` |
| Edit a file | `patch` |
| Run a shell command | `terminal` |
| Search file contents | `search_files` with `target='content'` |
| Find files by name | `search_files` with `target='name'` |
| Fetch a URL | `web_extract` |
| Search the web | `web_search` |
| Invoke a skill | `skill_view(name)` — or type `/<skill-name>` in the TUI/CLI |
| Dispatch a subagent (`Subagent (general-purpose):` template) | `delegate_task` (see [Subagent support](#subagent-support)) |
| Multiple parallel dispatches | `delegate_task` with an array of task objects — all run concurrently |
| Task tracking ("create a todo", "mark complete") | `todo` |

## Invoking Skills

In the Hermes TUI or CLI, type `/<skill-name>` to activate a skill. From within a tool call, use `skill_view(name='<skill-name>')` to load a skill's full content, then follow its instructions.

Browse available skills with `skills_list()` or the `/skills` command.

## Subagent Support

`delegate_task` spawns one or more isolated subagents. Each gets its own conversation, terminal session, and toolset. Only the final summary is returned to your context.

```
# Single subagent
delegate_task(tasks=[{"prompt": "Research X and summarise findings"}])

# Multiple parallel subagents
delegate_task(tasks=[
    {"prompt": "Review the auth module for security issues", "label": "security"},
    {"prompt": "Profile the database query layer",           "label": "perf"},
    {"prompt": "Check types across the API surface",         "label": "types"},
])
```

Skills that reference `Subagent (general-purpose):` blocks map to a single entry in the tasks array. Skills that fan out multiple subagents in parallel map to multiple entries in one `delegate_task` call.

## Task Tracking

Use the `todo` tool for session-scoped task tracking. Pass a `todos` array to create or update items:

```
todo(todos=[
    {"content": "Write failing test", "status": "in_progress"},
    {"content": "Implement feature",  "status": "pending"},
    {"content": "Refactor",           "status": "pending"},
])
```

Call `todo()` with no arguments to read the current list.

## Long-Running Processes

Hermes supports background processes via `terminal`:

```
terminal(command="npm run dev", background=True, notify_on_complete=True)
# Check status later:
process(action="poll")
```

## Environment Detection for Git Skills

Skills that create worktrees or finish branches should detect their environment first:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR)

## Instructions-File Convention

Hermes reads `~/.hermes/SOUL.md` as a personality/persona file and `~/.hermes/config.yaml` for model and agent settings. Skills live at `~/.hermes/skills/`. The equivalent of `CLAUDE.md` / `AGENTS.md` context is set in the Hermes system prompt or via `SOUL.md`.
