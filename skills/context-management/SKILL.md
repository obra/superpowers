---
name: context-management
description: >
  Use in long or noisy sessions to persist durable state across session
  boundaries via state.md. Triggers on: user explicitly asks to "save state",
  "compress context", cross-session handoff needed, or repeated failures
  indicate context is getting stale.
---

# Context Management

Persist durable decisions and progress to `state.md` for cross-session continuity.

## Purpose

Claude Code automatically compresses context within a session. This skill is for **cross-session persistence** — ensuring that decisions, progress, and evidence survive when a session ends and a new one begins.

## When to Use

- User explicitly asks to save state or compress context
- Work will continue in a new session and progress must be preserved
- Complex multi-step task has significant accumulated decisions/evidence
- Repeated failures suggest the session has accumulated stale/conflicting context

## Procedure

1. Extract durable artifacts only:
   - Approved design decisions
   - Active plan tasks and their status
   - Verified facts/evidence
   - Open questions/risks

2. Write `state.md` at the project root (or next to the active plan file) with concise sections:
   - `Current Goal`
   - `Decisions`
   - `Plan Status`
   - `Evidence`
   - `Open Issues`

3. In a new session, read `state.md` first to restore context before continuing work.

## Guardrails

- Do not drop user-provided constraints.
- Do not rewrite requirements; preserve intent.
- If uncertain whether old context matters, keep a short reference in `Open Issues`.
- Keep `state.md` under 100 lines — if it's longer, it's not compressed enough.
