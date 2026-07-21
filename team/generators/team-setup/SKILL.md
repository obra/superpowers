---
name: team-setup
description: Use when a team leader first sets up this template - interviews them about how the team works, writes the intake files, and names the team plugin. Run this before generating the workflow.
---

# Team Setup

Turn a team leader's knowledge of how their team works into the filled-in
`team/intake/*.md` files that the workflow generator reads next.

## Overview

This skill runs a short, structured interview with whoever is setting up the
template for their team, then writes the answers straight into the intake
files under `team/intake`. It does two jobs, in a fixed order: name the
plugin first, then interview. Nothing gets generated here — this skill only
captures facts. The workflow generator (`/generate-workflow`) is what turns
captured facts into skills.

## When to Use

Use this at the very start of adopting the template, before any team-specific
skills, docs, or conventions exist. If `team/intake/*.md` files are already
filled in and you're being asked to change one answer, edit the file directly
instead of re-running the whole interview.

## The Process

### 1. Announce

Say exactly:

> Using team-setup to capture how your team works.

### 2. Name the plugin first

Before any interview questions, get the plugin named. This has to happen
first because every prefix the leader will see for the rest of setup depends
on it.

- Ask for a short slug for the team's plugin (lowercase letters, digits,
  hyphens, must start with a letter — e.g. `acme-eng`, `platform-team`).
- If the answer doesn't fit that shape, say so and ask again. Don't try to
  auto-fix it (stripping spaces, lowercasing) — a slug the leader typed
  wrong once is worth a second, correct answer rather than a guess.
- Run `team/scripts/rename-plugin.sh <slug>` with the validated slug.
- Confirm the result back to the leader, naming the new prefix explicitly:
  "Your team plugin is now `/<slug>:` — skills you generate will live under
  that prefix."

### 3. Interview, one question at a time

Walk the five intake files in this fixed order:

1. `what-we-do`
2. `what-we-use`
3. `our-conventions`
4. `testing`
5. `connectors`

For each file, read its `##` headings from `team/intake/<file>.md` and ask
one focused question per heading. Ask **one question at a time** — never
bundle two headings into a single message. Wait for the answer, capture it,
then move to the next heading.

- Prefer multiple-choice questions where the heading has a natural finite
  set of answers (e.g. "How do you test before merge? (a) unit tests only
  (b) unit + integration (c) manual QA (d) other"). Open-ended is fine when
  there isn't a natural set.
- Probe shallow answers before moving on. A one-word or one-tool answer is
  rarely enough to generate a useful skill from later. If the leader says
  "Jira," ask what Jira is used for and at which step it comes in — don't
  accept a bare tool name as the whole answer.
- If a heading genuinely doesn't apply to this team, write "N/A" under it
  rather than skipping it silently — the generator needs every heading
  addressed, not just the ones with content.

### 4. Write answers into the intake files

After each answer (probed until it's concrete), write it under the matching
`##` heading in `team/intake/<file>.md`. Keep the file's existing headings
exactly as they are — you're filling in content underneath them, not
renaming or reordering them. Plain prose under each heading is fine; these
files stay plain markdown, not YAML or JSON.

Write incrementally, one file at a time, immediately after that file's
questions are answered — don't hold all five files' answers in your head
until the end of the interview.

### 5. Summarize and hand off

Once all five `team/intake` files are filled in, summarize what was
captured: one or two lines per file naming the key facts recorded. Then tell
the leader the next step:

> Setup captured. Run `/generate-workflow` next to turn this into your
> team's skills.

## Quick Reference

| Step | Action |
|---|---|
| 1 | Announce: "Using team-setup to capture how your team works." |
| 2 | Get slug, validate, run `team/scripts/rename-plugin.sh <slug>`, confirm `/<slug>:` prefix |
| 3 | Interview one question at a time, walking `team/intake` files in fixed order |
| 4 | Write each answer under its matching `##` heading, same file, same headings |
| 5 | Summarize, point to `/generate-workflow` |

## Red Flags — Stop and Correct

| Excuse / impulse | Reality |
|---|---|
| "I'll ask about the stack and the workflow in one message, save time" | That's two headings in one question. Split it — one question at a time. |
| "They said 'Jira' — good enough, next heading" | A bare tool name isn't a usable answer. Probe: for what, at which step? |
| "This heading probably doesn't matter for this team, skip it" | Write "N/A" under it instead. Every heading gets addressed, none go silently blank. |
| "I'll rename the plugin at the end, once I know more" | Rename first. Every prefix shown to the leader afterward depends on it. |
| "Close enough, I'll clean up the slug myself" | Don't auto-fix an invalid slug. Reject it and ask again. |
| "I'll hold the answers and write all five files at the end" | Write each file as soon as its questions are answered. |

## Common Mistakes

- **Batching questions.** Even two related headings ("what tools, and how do
  they fit your flow") is two questions — ask them one at a time.
- **Renaming the plugin last.** It's the first action after the
  announcement, not a wrap-up step.
- **Accepting one-word answers.** "Jira" or "GitHub" alone doesn't tell the
  generator what to build. Ask a follow-up before writing it down.
- **Reformatting the intake templates.** Don't add, remove, or rename `##`
  headings in `team/intake/*.md` — the generator expects them exactly as
  shipped.
