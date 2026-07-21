---
name: new-connector
description: Use when a team member wants to connect something to the workflow - internal documentation, an MCP tool, or a team convention - and wires the right kind while explaining it.
---

# New Connector

Interview a team member to wire something new into the shared workflow —
a piece of internal documentation, an MCP tool, or a team convention —
teaching them what each kind *is* and why it's grounded the way it is,
then write the connection to the right place.

## Overview

A "connector" is anything that gives the team's Claude workflow access to
knowledge or capability it doesn't have out of the box. There are three
kinds, and the whole point of this skill is to route to the right one and
explain the difference as it goes (teach-while-doing) — not to collect
answers and silently emit config. The three kinds ground Claude in
different ways:

- **doc** — text Claude can *read*. Facts, references, internal
  knowledge.
- **MCP tool** — a server Claude can *act through*. Real actions in real
  systems (issue trackers, databases, deploy tooling).
- **convention** — a rule Claude should *always follow* or reach for when
  relevant. Team norms, not knowledge or capability.

The existing connectors are described in `team/intake/connectors.md`
(headings: Documentation sources, MCP tools / integrations, Always-on
context). Read it first so you extend the picture instead of duplicating
it.

## When to Use

Run this whenever a member says "Claude should know about X", "Claude
should be able to do X", or "Claude should always do X". Don't use it to
build a technique into a reusable skill — that's `new-skill`. This skill
is specifically about wiring in a **doc, MCP tool, or convention**.

## The Process

### 1. Announce

Say exactly:

> Using new-connector to wire a new connector into the workflow with you.

### 2. Ask which kind, and route

Ask the member directly: **"Is this a doc, MCP tool, or convention?"**
Explain the three so they can place their own case:

- **doc** — Claude needs to *know* something (a runbook, an API's quirks,
  an architecture note).
- **MCP tool** — Claude needs to *do* something in another system.
- **convention** — Claude needs to *always behave* a certain way.

Don't guess from context — wait for an explicit answer. The three
branches write to different places and re-routing later costs more than
asking up front. If the member is unsure, use the read / act / always
distinction above to help them pick.

### 3. Wire the chosen kind (teach while you do it)

#### Branch: doc

Explain: docs ground Claude in facts it can read at the moment it's
relevant. Two sub-cases:

- **Internal / committable** — drop the markdown into `team/docs/` (this
  is the committed internal-docs directory, already a connector target),
  then create a small pointer skill under `team/skills/<name>/` whose
  trigger description names the situations where that doc is needed and
  whose body points Claude at the `team/docs/<file>.md`. Explain that the
  pointer skill is what makes the doc *discoverable* — a file no skill
  references is a file Claude never opens.
- **External source** — record where it lives (URL, wiki space, repo)
  under `## Documentation sources` in `team/intake/connectors.md`, and
  note how Claude reaches it. Explain grounding: Claude answers from what
  it can actually read, so a pointer to a live source beats pasting a
  snapshot that will drift.

#### Branch: MCP tool

Explain: MCP (Model Context Protocol) gives Claude *actions* in real
systems, not just text to read — a Jira MCP lets it file and move
tickets, a Postgres MCP lets it query the real database. Produce:

- A ready-to-paste MCP server config snippet (the entry the team leader
  drops into their MCP settings), with any required env vars or auth
  called out as placeholders, not invented values.
- A one-line note on **when Claude should use it** — the trigger, so the
  tool gets reached for at the right moment rather than never.

Record the tool and its "when" under `## MCP tools / integrations` in
`team/intake/connectors.md`. Explain that MCP config is machine- and
credential-specific, so this skill produces the snippet and the leader
wires it into their own environment.

#### Branch: convention

Explain: a convention is a rule, not knowledge or capability. Two homes,
by how often it applies:

- **Always-on** — append it to `team/CLAUDE.md`, below the generated
  section. `team/CLAUDE.md` is loaded into *every* session, so use it
  only for rules that should hold everywhere (e.g. "never touch
  `skills/`"). Explain the cost: always-on context is spent on every
  turn, so it earns its place only if it's near-universal.
- **On-demand** — if the rule applies to a specific kind of task, create
  a broadly-triggering conventions skill under `team/skills/<name>/`
  instead, so it fires only when relevant. Explain the tradeoff:
  on-demand keeps the always-on budget small but depends on the trigger
  description matching.

Also note the convention under `## Always-on context` in
`team/intake/connectors.md` so the intake stays the source of truth.

Reference `superpowers:writing-skills` explicitly as the authority
whenever a branch produces a skill (the doc pointer or the conventions
skill) — frontmatter shape, trigger-description quality, and voice defer
to it.

### 4. Confirm the result

Tell the member what got wired and how it activates:

- **doc** — the `team/docs/` file plus its pointer skill (auto-triggers
  on its description), or the recorded external source.
- **MCP tool** — the config snippet to paste and the "when to use" note;
  remind them it activates once added to MCP settings and the session
  restarts.
- **convention** — the `team/CLAUDE.md` addition (always-on next session)
  or the conventions skill (auto-triggers on its description).

## Quick Reference

| Step | Action |
|---|---|
| 1 | Announce: "Using new-connector to wire a new connector into the workflow with you." |
| 2 | Ask **doc, MCP tool, or convention?** and route |
| 3a | **doc** → `team/docs/` + pointer skill, or record external source in `connectors.md` |
| 3b | **MCP tool** → paste-ready config snippet + "when to use" note; record in `connectors.md` |
| 3c | **convention** → `team/CLAUDE.md` (always-on) or a conventions skill; record in `connectors.md` |
| 4 | Confirm what was wired and how it activates |

## Red Flags — Stop and Correct

| Excuse / impulse | Reality |
|---|---|
| "I'll infer whether it's a doc, tool, or convention from what they're describing" | Ask explicitly. The three branches write to different places; re-routing later costs more than one question. |
| "Dropping the doc in `team/docs/` is enough" | A doc no skill points at is a doc Claude never opens. Create the pointer skill so it's discoverable. |
| "I'll invent plausible credentials/URLs for the MCP config" | Never fabricate auth or endpoints. Use named placeholders and let the leader fill real values in their own environment. |
| "Every convention should go in `team/CLAUDE.md` so it's never missed" | Always-on context is spent every turn. Reserve `team/CLAUDE.md` for near-universal rules; put task-specific ones in a triggering skill. |
| "I'll skip updating `connectors.md`, the file/config is enough" | The intake is the source of truth. Record every connector there so the next person sees the whole picture. |
| "I know the skill format, no need to mention writing-skills" | When a branch produces a skill, defer to `superpowers:writing-skills` on structure, voice, and trigger quality. |
