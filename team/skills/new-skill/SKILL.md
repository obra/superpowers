---
name: new-skill
description: Use when a team member wants to create a new skill - asks whether it is team-shared or personal, teaches skill anatomy while interviewing, and writes the SKILL.md to the right place.
---

# New Skill

Interview a team member to build a new skill from scratch, teaching them
skill anatomy as they go, then write the result to the right place.

## Overview

This skill is a teach-while-doing generator: it doesn't just collect
answers and produce a file silently, it explains *why* each part of a
skill matters at the moment it asks for it, so the member understands
skill anatomy well enough to edit or write the next one themselves. The
authority for skill structure, voice, and quality bar is
`superpowers:writing-skills` — this skill routes and teaches; it defers
to that skill on anything about what makes a skill good.

The first and most consequential question is scope: **team or personal?**
That answer decides where the file lands and who else ever sees it.

## When to Use

Run this whenever a member wants to turn a technique, a house process, or
a personal habit into a reusable skill. Don't use it to edit an existing
skill in place — open that skill's `SKILL.md` directly instead.

## The Process

### 1. Announce

Say exactly:

> Using new-skill to build a new skill with you.

### 2. Ask team or personal, and route

Ask the member directly: **"Is this skill team or personal?"**

- **Team** — shared with the whole team, reviewed like any other change,
  and committed to the repo. Lands at `team/skills/<name>/SKILL.md`.
- **Personal** — just for this member, not committed to the team repo,
  not reviewed by anyone else. Lands at `~/.claude/skills/<name>/SKILL.md`
  (that member's own machine, global across all their projects).

Don't guess from context — wait for an explicit answer before doing
anything else. The destination path depends on it, and re-routing a
half-written skill after the fact is more work than asking up front.

### 3. Teach while interviewing

Gather the skill in the same order a reader would need it, explaining
each part as you ask for it — don't collect answers first and explain
after.

1. **`name`.** Explain: this is the skill's identifier — letters,
   numbers, and hyphens only, verb-first where it reads naturally (e.g.
   `debugging-flaky-tests`, not `flaky-test-fixes`). It's also what
   shows up in the slash command, so ask for it and validate the shape
   before moving on.
2. **The trigger description.** Explain: *this sentence decides when
   Claude reaches for the skill* — describe the situations that should
   trigger yours, not what the skill does once triggered. Ask the member
   what symptoms, error messages, or moments should make this skill fire,
   and push back on anything vague (see Red Flags below) before locking
   it in.
3. **Body / steps.** Explain: this is the actual guidance — what to do,
   in what order, with concrete examples over abstract advice. Ask the
   member to walk through the technique or process step by step, the way
   they'd explain it to a new teammate, and capture it as numbered steps
   or a short procedure.
4. **Red Flags.** Explain: a table of excuses or shortcuts someone might
   take that undermine the skill, paired with the reality that closes
   each one off. Ask the member what corners get cut on this task under
   time pressure, and turn each one into a row.

Reference `superpowers:writing-skills` explicitly as the authority on
structure and voice for anything not covered above — frontmatter shape,
when to split out supporting files, how long the body should run.

### 4. Write the file

Write the gathered material to the routed path
(`team/skills/<name>/SKILL.md` or `~/.claude/skills/<name>/SKILL.md`)
with valid frontmatter:

```markdown
---
name: <name>
description: <trigger description>
---

# <Title>

<body, steps, Red Flags table>
```

Confirm the frontmatter fence (`---` opening and closing) and both
required fields (`name`, `description`) are present before writing.

### 5. Confirm the result

Tell the member the resulting slash command and that it auto-triggers:

- **Team skill:** invocable as `/<team>:<name>` (using this team's
  plugin prefix), and Claude will auto-trigger it whenever the trigger
  description matches the situation — no explicit invocation required.
- **Personal skill:** invocable as `/<name>`, and it auto-triggers the
  same way, but only in this member's own sessions since it lives under
  their personal `~/.claude/skills/`.

## Quick Reference

| Step | Action |
|---|---|
| 1 | Announce: "Using new-skill to build a new skill with you." |
| 2 | Ask **team or personal?** — route to `team/skills/<name>/SKILL.md` or `~/.claude/skills/<name>/SKILL.md` |
| 3 | Teach while interviewing: `name` -> trigger description -> body/steps -> Red Flags |
| 4 | Write the file with valid frontmatter |
| 5 | Confirm slash command and auto-trigger |

## Red Flags — Stop and Correct

| Excuse / impulse | Reality |
|---|---|
| "I'll guess team vs personal from what they're describing" | Ask explicitly. The destination depends on it and re-routing later costs more than asking up front. |
| "The description can just say what the skill does, that's clearer" | Descriptions are triggers, not summaries. A description that explains the workflow gets skipped once it's already matched — write it as the sentence that decides *when*, not *what*. |
| "'Use for testing' is specific enough" | That's vague. Push for concrete symptoms, error messages, or situations before locking in the trigger description. |
| "I'll collect all the answers first, then explain skill anatomy at the end" | Teach as you go. Explaining `name`, then description, then body, then Red Flags in order is the point of this skill, not an afterthought. |
| "Skip Red Flags, this skill's steps are self-explanatory" | Every skill gets a Red Flags table. Ask what corners get cut under pressure and capture it. |
| "I don't need to mention writing-skills, I already know the format" | Reference `superpowers:writing-skills` explicitly — it's the authority on structure and voice, not this generator. |
