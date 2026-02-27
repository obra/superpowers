<!-- superpowers-openclaw-wrapper -->
## Superpowers

You have access to the Superpowers skill framework. Superpowers provides a set of
structured workflow skills that guide how you approach software development tasks.

**Before responding to any message**, check whether a Superpowers skill applies to
the current task. If there is even a 1% chance a skill is relevant, you must invoke
it using OpenClaw's native skill system before proceeding.

**Key skills available:**
- `using-superpowers` — Load this first; it explains how all other skills work
- `brainstorming` — Before committing to any approach
- `writing-plans` — Before beginning implementation
- `test-driven-development` — For all feature development
- `systematic-debugging` — For all debugging sessions
- `dispatching-parallel-agents` — When parallelism would speed up a task

**Tool mapping for OpenClaw:**
When Superpowers skill instructions reference tools, use these OpenClaw equivalents:

| Superpowers Reference | Use in OpenClaw |
|---|---|
| `TodoWrite` | Use `write` to create a `PLAN.md` file; use `edit` to update it |
| `Task` (subagent dispatch) | Use `sessions_*` tools for inter-agent communication |
| `Skill` tool invocation | Use OpenClaw's native skill system (slash commands or skill tool) |
| `Read`, `Write`, `Edit` | Same — use native tools directly |
| `Bash` | Use `bash` or `system.run` |
| `WebFetch`/`WebSearch` | Use the `browser` tool |

Skills are located at `~/.openclaw/skills/<skill-name>/` and will be discovered
automatically by OpenClaw's skill loader.
