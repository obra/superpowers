---
name: writing-plans
description: >
  Decomposes approved requirements into executable task plans with
  verification commands and TDD ordering. Invoke after design approval
  or when user says "write a plan", "break this down". Routed by
  brainstorming as the next step after design approval.
---

# Writing Plans

Create an implementation plan another agent can execute with minimal ambiguity.

> When running in Claude Code with native tasks support, this skill can also mirror plan tasks into native tasks for dependency tracking and progress visibility. In other environments, ignore the native-task notes below and use the markdown plan only.

## Output Path

Save to `docs/plans/YYYY-MM-DD-<feature-name>.md`.

## Plan Header

```markdown
# <Feature Name> Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-optimized:executing-plans to implement this plan task-by-task.

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
- For especially complex or ambiguous features, you may first run `prompt-optimizer` on the user’s request to tighten scope before finalizing the plan.

### (Claude Code only) Initialize native tasks

If native tasks are available:

1. Call `TaskList` once at the start to see if tasks already exist from `brainstorming`.
2. If tasks exist, you will enrich them as you write the plan; if not, you will create them as you go.

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

### (Claude Code only) Mirror plan tasks to native tasks

For each `Task N` you define in the plan, you may also create or update a native task:

```yaml
TaskCreate:
  subject: "Task N: <Name>"
  description: |
    [Copy the task content you just wrote: files, steps, and acceptance criteria.]
  activeForm: "Implementing <Name>"
```

After all tasks are created, you may use `TaskUpdate` to express dependencies (for example, Task 2 blocked by Task 1):

```yaml
TaskUpdate:
  taskId: <dependent-task-id>
  addBlockedBy: [<prerequisite-task-id>]
```

To enable cross-session resume, keep a small JSON sidecar next to the plan file (for example `docs/plans/2026-01-15-feature.md.tasks.json`) that records:

- The plan path.
- Each task’s id, subject, status, and `blockedBy` list.
- `lastUpdated` as an ISO timestamp.

## Quality Bar

- No vague steps like "update logic".
- No hidden dependencies between distant tasks.
- Call out migrations, feature flags, and rollback checks when relevant.
- Prefer small vertical slices over large horizontal phases.

## Handoff

After saving, present exactly two options:

1. `subagent-driven-development` in this session
2. `executing-plans` in a separate session
