---
name: new-workflow
description: Use when a team member wants to define a new multi-step workflow - composes existing engine and team skills into an ordered flow and optionally a trigger skill.
---

# New Workflow

Interview a team member to define a new multi-step workflow, then **compose**
it out of skills that already exist — engine skills from Superpowers and the
team's own `team/skills/*` — writing an ordered flow to
`team/workflows/<name>.md` and, optionally, a thin trigger skill that fires it.

## Overview

A workflow is a named, ordered sequence of steps for a recurring kind of
task ("ship a bugfix", "review and land a dependency bump"). This skill
does **not** author new capability — it maps each step to a skill that
already exists and records the order. The governing rule is **compose,
don't duplicate**: if a step is "understand the problem before coding",
that's `superpowers:brainstorming`, not a new skill you write here. Only
when no existing skill covers a step do you flag a genuine gap — and even
then you point the member at `/new-skill`, you don't inline a deep skill
body.

The skills available to compose from:

- **Engine (Superpowers)** — `brainstorming`, `writing-plans`,
  `executing-plans`, `test-driven-development`, `systematic-debugging`,
  `subagent-driven-development`, `dispatching-parallel-agents`,
  `requesting-code-review`, `receiving-code-review`,
  `verification-before-completion`, `finishing-a-development-branch`,
  `using-git-worktrees`, `writing-skills`. Invoked as
  `superpowers:<name>`.
- **Team** — whatever lives under `team/skills/` (the generators plus any
  generated team skills). Invoked as `/<team>:<name>`.

## When to Use

Run this when a member describes a repeatable, multi-step process they
want the team to follow the same way each time. Don't use it for a
single-technique skill — that's `new-skill`. Don't use it to wire in a
doc, tool, or convention — that's `new-connector`.

## The Process

### 1. Announce

Say exactly:

> Using new-workflow to compose a new workflow with you.

### 2. Interview for goal and steps

Ask, one focused question at a time:

1. **The goal** — what task does this workflow cover, start to finish?
   Name it in a few words; that name becomes the file and (optional)
   trigger.
2. **The steps** — walk the process in order, the way they'd hand it to a
   new teammate. Capture each step as a short imperative phrase.

Push back on steps that are vague or that collapse several actions into
one — a workflow's value is that each step maps cleanly to something
Claude can actually do.

### 3. Map each step to an existing skill (reuse, don't recreate)

For every step, name the skill that already performs it — from the engine
or team lists above. State the mapping out loud so the member sees the
composition:

> "Understand the problem first" → `superpowers:brainstorming`
> "Write it test-first" → `superpowers:test-driven-development`
> "Get it reviewed before merge" → `superpowers:requesting-code-review`

If a step has **no** existing skill, don't invent one here. Mark it as a
gap and tell the member to run `/new-skill` to build it, then reference it
from the workflow once it exists. Composing beats duplicating: a workflow
that re-explains brainstorming instead of pointing at the engine skill
drifts out of sync the moment the engine updates.

### 4. Write the workflow

Write `team/workflows/<name>.md` as an ordered composition that **names
the skills**, not one that re-explains them:

```markdown
# <Workflow name>

<one-line goal>

1. **<step>** — `superpowers:<skill>` (or `/<team>:<skill>`)
2. **<step>** — `superpowers:<skill>`
3. ...
```

Each line is a step, its skill, and just enough context to know when the
step is done. Keep the prose thin — the skills carry the depth.

### 5. Optionally write a thin trigger skill

Ask whether Claude should reach for this workflow automatically. If yes,
write a thin skill under `team/skills/<name>/SKILL.md` whose
description triggers on the situation and whose body points at
`team/workflows/<name>.md`. Defer to `superpowers:writing-skills` for the
frontmatter and trigger-description quality. If no, the workflow is still
runnable — the member just opens `team/workflows/<name>.md` directly.

### 6. Confirm the result

Tell the member: the `team/workflows/<name>.md` path, the ordered skills
it composes, any gaps to fill with `/new-skill`, and whether a trigger
skill was created (and so whether it auto-fires).

## Quick Reference

| Step | Action |
|---|---|
| 1 | Announce: "Using new-workflow to compose a new workflow with you." |
| 2 | Interview: goal, then ordered steps |
| 3 | Map each step to an existing engine/team skill; mark gaps for `/new-skill` |
| 4 | Write `team/workflows/<name>.md` naming those skills |
| 5 | Optionally write a thin trigger skill (defer to `superpowers:writing-skills`) |
| 6 | Confirm path, composed skills, gaps, and trigger |

## Red Flags — Stop and Correct

| Excuse / impulse | Reality |
|---|---|
| "This step needs a skill, I'll write the body inline here" | Compose, don't duplicate. If it's brainstorming, reference `superpowers:brainstorming`; if nothing fits, send them to `/new-skill`. |
| "I'll paraphrase what each engine skill does so the workflow is self-contained" | Paraphrase drifts. Name the skill and let it carry the depth — the workflow is an index, not a copy. |
| "One big step is fine" | A step that bundles several actions maps to no single skill. Split until each step names one skill. |
| "Every workflow needs a trigger skill" | Ask. A trigger is optional; a workflow file is runnable on its own. Don't add always-considered surface the member didn't want. |
| "I'll invent a skill name that sounds right" | Only reference skills that exist. Verify against the engine and `team/skills/` lists; unknown steps are gaps, not guesses. |
