---
date: 2026-01-27
tags: [architecture, planning, config-interaction]
workflow: [brainstorming, planning]
---

# Map Feature Interactions Before Implementation

## Problem

Added user context prompts without analyzing how they interact with existing schedule prompts. Result:

- Schedule `systemPrompt` could override entire system prompt
- User context would be silently wiped out when schedule had custom prompt
- Architectural bug caught in code review, required significant refactoring

**Root cause:** Implemented feature in isolation without considering all combinations with existing config.

## Solution

**Create interaction matrix BEFORE implementation:**

```
             | No Schedule Prompt | Schedule Prompt
-------------|-------------------|------------------
No Context   | Default + Default | Default + Schedule
User Context | System + Context  | System + Context + Schedule
```

**For each cell, define:**
- What gets used?
- What takes precedence?
- What composes vs replaces?

**Then implement the architecture that satisfies all cells.**

## Pattern

### Step 1: Identify Intersecting Configs

When adding feature X that touches existing config Y:
- User prompts (new) + Schedule prompts (existing)
- Active hours (new) + Sync intervals (existing)
- Per-user settings (new) + Global defaults (existing)

### Step 2: Enumerate All Combinations

Create matrix of all possible states:

```
         | Y disabled | Y enabled
---------|-----------|------------
X off    | ?         | ?
X on     | ?         | ?
```

### Step 3: Define Behavior for Each Cell

For EACH combination, decide:
- What happens?
- What takes precedence?
- What's the user expectation?

**Don't guess** - explicitly define or ask user.

### Step 4: Check for Conflicts

Look for cells where behavior is unclear or conflicts with other cells:
- "X overrides Y" vs "Y overrides X" - which is correct?
- Does order matter?
- Are there circular dependencies?

### Step 5: Document in Architecture

Add interaction matrix to design doc or CLAUDE.md:

```markdown
## Config Interaction: User Context + Schedule Prompts

| User Context | Schedule Prompt | Behavior |
|--------------|----------------|----------|
| None         | None           | Use system defaults |
| None         | Custom         | Schedule defines task |
| Custom       | None           | Context + default task |
| Custom       | Custom         | Context + schedule task (composed) |

**Key:** User context is ALWAYS included (never overridden).
Schedule prompt defines the task instruction (user message, not system override).
```

## When to Apply

**Red flags indicating feature interaction:**
- Adding config that affects same component (prompts, schedules, filters)
- User-level config + Schedule-level config
- New feature has "priority" or "override" semantics
- Existing code has conditional logic based on config presence

**Examples:**
- Adding user timezone + Schedule has timezone → which wins?
- Adding file upload limits + Existing size validation → which applies?
- Adding custom templates + Default templates → merge or replace?

## Prevention Checklist

Before implementing feature that touches existing config:

- [ ] List all related existing configs
- [ ] Create interaction matrix (all combinations)
- [ ] Define behavior for each cell
- [ ] Check for conflicts/ambiguities
- [ ] Document in design doc
- [ ] Get user sign-off on interaction semantics

## Example from Session

**Feature:** User context prompts (text + Drive file)

**Existing:** Schedule has `systemPrompt` field

**Interaction matrix needed:**
```
             | No Schedule systemPrompt | Has Schedule systemPrompt
-------------|--------------------------|---------------------------
No Context   | Default behavior         | Schedule defines task
Has Context  | Context always included  | Context + Schedule (HOW?)
```

**Key question missed:** In bottom-right cell, does schedule REPLACE context or COMPOSE with it?

**Cost:** Architectural refactoring after implementation, multiple review rounds.

**Correct approach:** Create matrix during brainstorming, clarify composition semantics BEFORE implementation.

## Related Patterns

- **Brainstorming skill:** Use this phase to create interaction matrices
- **AskUserQuestion:** When behavior unclear, ask user to define each cell
- **Architectural decision records:** Document interaction decisions
