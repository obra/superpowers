# Iteration mode (existing features)

SKILL.md holds except where this file differs.

**Announce:** "I'm using interactive-design to iterate on this UI with ledger-tracked data changes."

## Pending data

A `[PENDING]` entry lives in the ledger's **Pending** subsection with a stable id (`P1`, `P2`, …), the surface, the data needed, and the expected shape. Creating a real fixture instead is always allowed.

When the design is complete, before §4, map each pending id to an endpoint entry. Several ids may share one.

- `[EXISTING]`: wire the frontend to the endpoint and delete the placeholder.
- `[EXISTING — EXTENDED]`: create a marked fixture for the delta and record the delta.
- `[FIXTURE]`: create a marked fixture route.

Delete the empty Pending subsection before §4. Re-exercise affected surfaces, including new empty and error states, and bring visible changes back to the loop for your human partner's approval. A pending id with no plausible source goes to your human partner as a design question.

## Exit routing

Recommend a route and let your human partner confirm:

- **Small and decision-complete** (one outcome, one PR, no product shaping): invoke `toolbelt:quick-task`, carrying every §5 obligation that applies, with the fixture-zero check passing before merge.
- **Otherwise:** invoke `toolbelt:writing-specs`.

Either route ships the UI changes and backend delta in one PR.
