---
name: generate-workflow
description: Use after /team-setup to turn the team intake into a unified workflow - composes engine skills, proposes improvements for gaps, and writes the team workflow, conventions, connectors, and a trigger skill.
---

# Generate Workflow

## Overview

Turns the filled `team/intake/*.md` files into the team's actual working
system: `team/workflow.md` (the canonical flow), `team/CLAUDE.md`
(conventions), connector config, and a thin trigger skill that routes
members into the workflow. This skill is a compositor, not an author. The
governing rule for everything it does is **compose and scaffold, never
hallucinate**: reuse existing Superpowers engine skills wherever one fits,
and where something is genuinely missing, scaffold a thin stub — never
write a deep skill body the leader didn't ask for.

## When to Use

Run this once `team/intake/*.md` has been filled in by `/team-setup`.
Re-run it whenever the leader edits an intake file and wants
`team/workflow.md` regenerated to match.

## The Process

### 1. Read the intake

Read all five files under `team/intake/`: `what-we-do.md`,
`what-we-use.md`, `our-conventions.md`, `testing.md`, `connectors.md`.
Check that every `##` heading in each file has content underneath it, not
just the bare heading. If any heading is still empty, STOP — tell the
leader to run `/team-setup` (naming the specific file/heading that's
missing) and don't proceed. Don't invent an answer for a blank heading.

### 2. Compose `team/workflow.md`

Draft the team's ordered flow (idea -> shipped) using the "How work
typically flows" answer from `what-we-do.md` and the testing answers from
`testing.md` as the backbone. For every step in that flow, map it to an
existing Superpowers engine skill by name wherever one fits — name the
skill explicitly in the document. Typical mappings:

- Shaping an idea or requirement -> `brainstorming`
- Turning a spec into a plan -> `writing-plans`
- Implementing a change -> `test-driven-development`
- Running multi-task or independent work -> `subagent-driven-development`
  (or `executing-plans` / `dispatching-parallel-agents`, whichever the
  intake's flow implies)
- Chasing a bug -> `systematic-debugging`
- Review before merge -> `requesting-code-review` on the author's side,
  `receiving-code-review` on the reviewer's side
- Closing out -> `verification-before-completion`, then
  `finishing-a-development-branch`

Where a step is team-specific (their own tool, their own house process
that no engine skill covers), reference a team skill under
`team/skills/` by name instead of an engine skill. Write the result to
`team/workflow.md` as a numbered flow: step name, one line describing
what happens at that step, and which skill — engine or team — it invokes.

### 3. Gap-analyze against the Superpowers methodology

Compare the composed flow to the full Superpowers methodology (brainstorm
-> plan -> test-driven implementation -> review -> ship, with debugging
and verification woven in as needed). For every gap — a stage the
intake never mentioned, such as no review step before merge or no
test-first discipline — do not silently patch it in and do not write a
full skill for it. Instead:

- PROPOSE the fix to the leader as a short, numbered list. Example: "Your
  flow has no review step before merge. Proposal: wire in
  `requesting-code-review` between implementation and merge." Or: "Your
  flow has no incident-response step and no engine skill covers it.
  Proposal: scaffold a thin stub team skill for it."
- Wait for the leader's approval on each proposal before acting —
  Superpowers-style, no silent action.
- Only after approval: either add the approved skill reference into
  `team/workflow.md`, or scaffold a stub under
  `team/skills/<name>/SKILL.md` — frontmatter (`name`, a real trigger
  `description`) plus a one-line placeholder body ("Stub — flesh out via
  `/new-skill`."). A stub is a named, discoverable file, not a finished
  skill.

This step is where the governing rule matters most: **compose and
scaffold, never hallucinate**. If you catch yourself drafting several
paragraphs of process for a gap, stop — that's a full skill body the
leader hasn't asked for. Scaffold the stub and stop there.

### 4. Write `team/CLAUDE.md`

Read `our-conventions.md` (`## Code style`, `## Review rules`,
`## Glossary / terms`) and write those answers into `team/CLAUDE.md` as
the team's conventions, style rules, and glossary, in plain prose under
matching sections. Leave any durable hand-written notes already present
below the generated section untouched — replace only the
generator-owned part, per the note already in that file.

### 5. Write connector config

Read `connectors.md` (`## Documentation sources`, `## MCP tools /
integrations`, `## Always-on context`). For documentation sources, write
doc-pointer file(s) that reference `team/docs/` so a member knows where
to look for real context, and link them from `team/workflow.md` or
`team/CLAUDE.md`. For MCP tools/integrations, write the documented
configuration as text the leader can paste into their own MCP settings —
this generator produces config, it does not install or connect anything
itself.

### 6. Write the trigger skill

Write `team/skills/team-workflow-entry/SKILL.md`, a thin skill whose
`description` fires when a member is starting a new piece of work (for
example: "Use when a team member is starting new work and needs to know
which step of the team's workflow applies"). Its body does exactly one
thing: point at `team/workflow.md` and tell the member to read it before
proceeding. Keep it thin — it's a router into the workflow, not a copy of
it.

### 7. Summarize and hand off

Report what was written: `team/workflow.md`, `team/CLAUDE.md`, the
connector files, `team/skills/team-workflow-entry/SKILL.md`, and any
stubs scaffolded and approved in step 3. For every stub, explicitly
remind the leader it's a placeholder that needs fleshing out via
`/new-skill` — a stub with only a placeholder body doesn't do anything
on its own yet.

## Quick Reference

| Step | Produces | Source intake |
|---|---|---|
| 1. Read | Go/no-go check | all of `team/intake/*` |
| 2. Compose | `team/workflow.md` | `what-we-do.md`, `testing.md` |
| 3. Gap-analyze | Proposals -> approved wiring or stubs | vs. Superpowers methodology |
| 4. Conventions | `team/CLAUDE.md` | `our-conventions.md` |
| 5. Connectors | doc-pointers + MCP config text | `connectors.md` |
| 6. Trigger | `team/skills/team-workflow-entry/SKILL.md` | (routes to `team/workflow.md`) |
| 7. Handoff | Summary + `/new-skill` reminder | — |

## Red Flags — Stop and Correct

| Excuse / impulse | Reality |
|---|---|
| "Intake is mostly filled in, close enough" | One empty heading is enough to stop. Tell the leader to run `/team-setup` and name the gap. |
| "I'll just add the missing review step myself, it's obviously needed" | Gaps are proposals, not silent edits. Propose `requesting-code-review` (or the right fix), wait for approval. |
| "I'm on a roll, let me write the full skill for this gap while I'm here" | That's hallucinating a skill the leader didn't ask for. Scaffold a thin stub and stop — compose and scaffold, never hallucinate. |
| "The trigger skill should just restate the whole workflow so members don't have to click through" | Keep it thin. It routes to `team/workflow.md`; it doesn't duplicate it. |
| "I'll skip the MCP config since I can't actually connect anything" | Write the config text anyway — the leader pastes it in themselves. |
| "No need to mention `/new-skill` again, I already said stubs need work" | Every stub gets its own explicit reminder in the summary, not one blanket line. |
