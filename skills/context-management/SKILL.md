---
name: context-management
description: Use in long or noisy multi-turn sessions to compress prior state into state.md and reduce context pollution before continuing.
---

# Context Management

Reduce context pollution and token bloat by summarizing durable state.

## Trigger

Use when any applies:
- Session has many turns (default: >10)
- Context has repeated failed hypotheses
- Prompts are getting long/redundant
- User explicitly asks to compress or reset context

## Procedure

1. Extract durable artifacts only:
- Approved design decisions
- Active plan tasks and status
- Verified facts/evidence
- Open questions/risks

2. Write `state.md` at the project root (or next to the active plan file if one exists) with concise sections:
- `Current Goal`
- `Decisions`
- `Plan Status`
- `Evidence`
- `Open Issues`

3. Continue using only current user turn + `state.md` + required skill docs.

4. Exclude old assistant reasoning unless needed for correctness.

## Required Output

Return JSON only:

```json
{
  "pruned": true,
  "summary_file": "state.md",
  "notes": "what was preserved and what was dropped"
}
```

## Guardrails

- Do not drop user-provided constraints.
- Do not rewrite requirements; preserve intent.
- If uncertain whether old context matters, keep a short reference in `Open Issues`.
