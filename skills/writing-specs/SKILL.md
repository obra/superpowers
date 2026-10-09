---
name: writing-specs
description: "Use after brainstorming reaches an approved design, or when your human partner asks for a spec directly or hands you written requirements. Writes, reviews, and gates the spec document before planning starts."
---

# Writing Specs

<ENTRY-GATE>
You normally arrive from brainstorming with a design your human partner approved section by section. Arriving from interactive-design with a reconciled contract ledger is an equivalent entry. Direct entry is allowed when your human partner asks for a spec or supplies written requirements; skipping brainstorming is their call, never yours.
</ENTRY-GATE>

## Checklist

Create a todo per item and complete them in order.

1. **Gather context** — explore the codebase and the requirements you were given
2. **Write the spec** — save to `docs/toolbelt/specs/YYYY-MM-DD-<topic>-design.md` and commit
3. **Self-review the spec** — placeholders, contradictions, ambiguity, scope
4. **User reviews the written spec**
5. **Alternate-harness review** — resolve a reviewer outside the author's harness
6. **Transition to planning** — the terminal state: invoke writing-plans

## Gathering Context

On direct entry, dispatch background subagents to explore prior art, the surfaces this change touches, and the relevant docs. Reserve questions for what only your human partner knows.

When a requirement leaves open a decision that changes what gets built, ask — one question per message. If several are open, use the brainstorming skill instead.

## Writing the Spec

Cover architecture, components, data flow, error handling, and testing, scaling each section to its complexity.

- **Global constraints go up top** — version floors, dependency limits, naming and copy rules, platform requirements, copied verbatim; the plan and every task inherit them.
- **Units with one purpose and well-defined interfaces** — what each does, how it is used, what it depends on.
- **YAGNI** — cut anything the design doesn't need.
- **Follow existing patterns**, fixing existing problems only where they affect this work.
- **No placeholders** — no "TBD", "add error handling", or "similar to the above"; a deferred decision only relocates into the plan.

Use the elements-of-style:writing-clearly-and-concisely skill if available. Save it to the path in item 2, or your human partner's location when they name one, and commit it to git.

## Review Gates

**Self-review** the spec: placeholders, vague requirements, sections that contradict, requirements open to two readings, scope too large for one plan. Fix inline; no re-review.

**User review gate.** Ask your human partner to review the spec:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait. If they request changes, make them and self-review again; proceed only once they approve.

**Alternate-harness review.** After that approval, route a `reviewer` with specialty `spec` through toolbelt:agent-routing, on a different harness than yours; if the routing names none, stop and tell your human partner. Dispatch the reviewer to check for gaps, ambiguity, or poor design. Small technical gaps — fix the spec and proceed. A rework large enough to change the idea — bring it to your human partner. Unsure — ask.

**Then invoke the writing-plans skill.** Do NOT invoke any other skill.
