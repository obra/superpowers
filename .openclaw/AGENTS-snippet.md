<!-- superpowers-openclaw-wrapper -->
## Superpowers Workflow Framework

You have access to the Superpowers skill framework. Superpowers provides a set of
structured workflow skills that guide how you approach software development tasks.

**Before responding to any message**, check whether a Superpowers skill applies to
the current task. If there is even a 1% chance a skill is relevant, you must invoke
it using OpenClaw's native skill system before proceeding.

**Key skills available:**
- `using-superpowers` — Load this first; it explains how all other skills work
- `brainstorming` — Before committing to any approach (Socratic questioning)
- `writing-plans` — Before beginning implementation
- `test-driven-development` — For all feature development
- `systematic-debugging` — For all debugging sessions
- `dispatching-parallel-agents` — When parallelism would speed up a task
- `subagent-driven-development` — For complex multi-step tasks

**Tool mapping for OpenClaw:**

| Superpowers Reference | Use in OpenClaw |
|---|---|
| `TodoWrite` | Use `write` to create a `PLAN.md` file; use `edit` to update it |
| `Task` (subagent dispatch) | Use `sessions_spawn` for sub-agent orchestration |
| `Skill` tool invocation | Use OpenClaw's native skill system |
| `Read`, `Write`, `Edit` | Same — use native tools directly |
| `Bash` | Use `exec` tool |
| `WebFetch`/`WebSearch` | Use the `web_fetch` or `browser` tool |

**Subagent Coordination Pattern for OpenClaw:**

For complex tasks, use this pattern:
1. Spawn subagents with `sessions_spawn` (mode="isolated")
2. Use `ACTIVE-TASK.md` to track progress across agents
3. Use `sessions_send` to communicate with subagents
4. Use `sessions_yield` to receive results

**Skills are located at** `~/.openclaw/skills/<skill-name>/` and will be discovered
automatically by OpenClaw's skill loader.
