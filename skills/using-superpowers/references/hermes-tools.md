# Hermes Agent Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Hermes Agent these resolve to the tools below.

## Tools

| Action skills request | Hermes tool |
|---|---|
| Read a file | `read_file` |
| Create a new file | `write_file` |
| Edit a file (targeted patch) | `patch` |
| Run a shell command | `terminal` |
| Search file contents | `search_files` |
| Find files by name | `terminal` with `find` |
| Fetch a URL / read a webpage | `web_extract(urls=[...])` |
| Search the web | `web_search(query=...)` |
| Dispatch a subagent | `delegate_task(goal=..., context=..., toolsets=[...], role="leaf")` |
| Task tracking | `todo` tool |
| Invoke a skill | `skill_view("skill-name")` |

## Instructions file

When a skill mentions "your instructions file," on Hermes Agent this is **`AGENTS.md`** in the project directory, or **`SOUL.md`** globally at `~/.hermes/SOUL.md`.

## Invoking a skill

Hermes Agent has a `skills` toolset with `skill_view` and `skills_list` tools.
To invoke a superpowers skill, use:

```
skill_view("brainstorming")
skill_view("test-driven-development")
```

If `skill_view` cannot find a superpowers skill (it may not appear in the catalog
until the plugin fully registers it), fall back to reading the SKILL.md directly:

```
read_file(path="~/.hermes/plugins/superpowers/skills/<skill-name>/SKILL.md")
```

This fallback is the same mechanism used by other harnesses without native skill loading.

## Subagent dispatch

Use `delegate_task` to spawn an isolated child only after the skill's approval
gate:

```
delegate_task(goal="...", context="...", toolsets=[...], role="leaf")
```

If `delegate_task` is unavailable, do the work inline rather than inventing tool calls.

Bounded `subagent-driven-development` also requires resuming the same
persistent implementer and persistent reviewer for the whole phase. If the
installed Hermes version cannot resume both children, execute the phase inline.
Do not emulate the pair with fresh children, parallel workstreams, or a
multi-agent task board.

Use delegated SDD only when Hermes can create both children idle, apply the
approved exact provider/model, reasoning effort, and context tier, count every
activation against the finite budget, keep the reviewer read-only, and prevent
nested delegation. Otherwise execute in the current session or stop for
reapproval; never inherit, default, auto-route, or substitute values.

## Task tracking

Use the `todo` tool for task tracking within a session. For multi-agent task boards, use `hermes kanban` CLI if available. Treat older `TodoWrite` references as the task-tracking action.
