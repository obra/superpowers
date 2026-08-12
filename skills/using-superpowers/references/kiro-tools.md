# Superpowers — Kiro CLI v3 tool mapping

This is the Kiro adaptation referenced by the `using-superpowers` skill. The
bootstrap and this mapping are loaded as startup resources by the
`superpowers` agent.

## Loading skills

- Superpowers skills are registered as native Kiro `skill://` resources. Kiro
  exposes their names and descriptions at session start and loads full content
  on demand.
- Invoke relevant skills with Kiro's native **Load skill** mechanism. Never read
  a `SKILL.md` manually to activate it.
- `using-superpowers` is already loaded as a startup resource; do not load it a
  second time.
- After loading another skill, announce "Using [skill] to [purpose]", then
  follow it exactly.

## Action mapping

Superpowers skills use platform-neutral actions. On Kiro CLI v3:

| Skill action | Kiro capability |
|--------------|-----------------|
| Load or invoke a skill | Native `Load skill` tool |
| Read or search files | Read tools |
| Create or edit files | Write tools |
| Run a command | Shell tools |
| Search symbols or navigate code | Code-intelligence tools |
| Dispatch an independent worker | Subagent tools |
| Track checklist items | Todo-list tools |
| Search or fetch current information | Web tools |

Use the most specific available tool. Run independent reads and subagents in
parallel; keep dependent work sequential.

### Todo-list payloads

Kiro may expose the `tasks` argument with an underspecified type. When creating
tasks, pass an array of objects containing `task_description`; do not pass
strings or objects using `description`.

```json
{
  "command": "create",
  "task_list_description": "Design the integration",
  "tasks": [
    {"task_description": "Explore project context"},
    {"task_description": "Present the design"}
  ]
}
```

## Subagent dispatch

Skills such as `subagent-driven-development`, `dispatching-parallel-agents`, and
`requesting-code-review` reference prompt templates in their own directories.

1. Read the referenced template.
2. Fill every placeholder with the task's actual context.
3. Dispatch it with Kiro's subagent capability.
4. Parallelize independent tasks only.

If subagents or todo lists are unavailable in a session, follow the equivalent
workflow inline rather than blocking.

## Conventions

- "Your instructions file" means `AGENTS.md` on Kiro CLI.
- This repository's skills live under `skills/`.
- Kiro's native workspace and global skill locations are `.kiro/skills/` and
  `~/.kiro/skills/`, respectively.
