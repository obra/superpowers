# TODOS.md Format Reference

Shared reference for the canonical `TODOS.md` format used by `featureforge:plan-ceo-review` and `featureforge:plan-eng-review`.

---

## File Structure

```markdown
# TODOS

## <Skill/Component>
<items sorted P0 first, then P1, P2, P3, P4>

## Completed
<finished items with completion annotation>
```

**Sections:** Organize by skill or component (`## Brainstorming`, `## Review`, `## QA`, `## Infrastructure`). Within each section, sort items by priority with the highest priority first.

---

## TODO Item Format

Each item is an H3 under its section:

```markdown
### <Title>

**What:** One-line description of the work.

**Why:** The concrete problem it solves or value it unlocks.

**Context:** Enough detail that someone picking this up later understands the motivation, the current state, and where to start.

**Effort:** S / M / L / XL
**Priority:** P0 / P1 / P2 / P3 / P4
**Depends on:** <prerequisites, or "None">
```

**Required fields:** What, Why, Context, Effort, Priority
**Optional fields:** Depends on, Blocked by

---

## Priority Definitions

- **P0** — Blocking: must be done before the next release or major workflow change
- **P1** — Critical: should be done this cycle
- **P2** — Important: do after P0/P1 items are clear
- **P3** — Nice-to-have: revisit after adoption or usage data
- **P4** — Someday: worthwhile idea with no near-term urgency

---

## Completed Item Format

When an item is completed, move it to `## Completed`, preserve its original content, and append:

```markdown
**Completed:** vX.Y.Z (YYYY-MM-DD)
```
