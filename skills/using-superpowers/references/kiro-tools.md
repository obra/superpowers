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
3. Dispatch it to a neutral worker — `superpowers-worker-default-model`, or
   `superpowers-worker-lite-model` for the cheap tier — passing the filled template as
   the prompt. Never dispatch a general-purpose template to a purpose-built agent.
4. Parallelize independent tasks only.

If subagents or todo lists are unavailable in a session, follow the equivalent
workflow inline rather than blocking.

### General-purpose dispatch targets

Templates dispatch `Subagent (general-purpose):` and supply the entire persona,
checklist, and output format in the prompt. The template *is* the worker's role.
Kiro's other agents are purpose-built: they carry their own instructions and
output contracts, which compete with the template and usually win.

Two neutral workers exist for this:

| Dispatch case | Kiro agent |
|---------------|------------|
| `Subagent (general-purpose):` | `superpowers-worker-default-model` |
| Cheap tier for mechanical, fully specified work | `superpowers-worker-lite-model` |

Dispatch a worker and pass the filled template as the prompt. The workers carry
`skill://` discovery, so a template may tell a worker to load a skill, but they
carry no bootstrap and no role of their own.

**Never substitute a purpose-built agent** such as a named reviewer or coder for
a general-purpose dispatch. Doing so silently discards the template's checklist,
severity calibration, read-only constraints, and output format. If neither worker
is available, say so and stop rather than substituting.

If a worker dispatch fails because its pinned model is rejected, fall back to
`superpowers-worker-default-model` — never to a purpose-built agent — and report
the rejected identifier.

### Model tiers

Pick the tier by choosing the worker, not by passing a model argument. Kiro
resolves a subagent's model from its agent config; a per-dispatch model value is
not honored on every surface and can be dropped silently.

`superpowers-worker-default-model` omits `model`, so Kiro resolves it. Note that
this does not necessarily inherit the parent session's model. When a skill calls
for a cheaper tier, dispatch `superpowers-worker-lite-model`.

## Conventions

- "Your instructions file" means `AGENTS.md` on Kiro CLI.
- This repository's skills live under `skills/`.
- Kiro's native workspace and global skill locations are `.kiro/skills/` and
  `~/.kiro/skills/`, respectively.
