---
name: writing-plans
description: >
  MUST USE after design approval to decompose requirements into executable
  task plans with verification commands and TDD ordering. Triggers on:
  "write a plan", "break this down", "plan the implementation", after
  brainstorming approval. Routed by brainstorming as the next step.
---

# Writing Plans

Create an implementation plan another agent can execute with minimal ambiguity.

## Output Path

Save to `docs/plans/YYYY-MM-DD-<feature-name>.md`.

## Plan Header

```markdown
# <Feature Name> Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the appropriate execution skill (`executing-plans` or `subagent-driven-development`) to implement this plan.

**Goal:** <single sentence>
**Architecture:** <2-4 sentences>
**Tech Stack:** <languages/libraries/tools>

---
```

## Task Rules

- Keep tasks independent when possible.
- Keep each step to one action (roughly 2-5 minutes).
- Use exact file paths.
- Include exact verification commands and expected outcomes.
- Use TDD ordering when code behavior changes.
- For ambiguous features, ask clarifying questions before finalizing the plan rather than guessing.

## Task Template

````markdown
### Task N: <Name>

**Files:**
- Create: `<path>`
- Modify: `<path>`
- Test: `<path>`

**Step 1: Add failing test**
Run: `<command>`
Expected: fail for the intended reason

**Step 2: Implement minimal change**
Describe exact edits (include code only where non-obvious).

**Step 3: Verify task**
Run: `<command>`
Expected: pass

**Step 4: Commit**
```bash
git add <files>
git commit -m "<message>"
```
````

## Quality Bar

- No vague steps like "update logic".
- No hidden dependencies between distant tasks.
- Call out migrations, feature flags, and rollback checks when relevant.
- Prefer small vertical slices over large horizontal phases.

## Handoff

After saving, present exactly two options:

1. `subagent-driven-development` in this session
2. `executing-plans` in a separate session
