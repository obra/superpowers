---
name: project-scoping
description: Use when starting a new project, large refactor, broad review-driven fix set, or any effort that needs a phase roadmap before detailed design
---

# Project Scoping

## Overview

Define the roadmap before detailed design. This skill splits a large effort into phases with goals, scope, prerequisites, estimated size, and explicit exclusions, then transitions to brainstorming for the first phase.

## When to Use

Use before brainstorming when:

- Starting a new project.
- Planning a large refactor.
- Addressing a broad review-driven fix set.
- The expected work spans roughly 10 or more tasks.
- The user explicitly asks for project scoping or a roadmap.

Do not use for a single bug fix or a small feature. If a roadmap already exists and the user is continuing a later phase, use brainstorming within that phase instead.

## Hard Gate

The output is a roadmap only. Do not define detailed specs, APIs, data models, UI copy, test cases, or implementation steps here. Those belong in brainstorming and writing-plans.

Use `update_plan` for the visible checklist:

1. Explore project context: inspect relevant code, docs, plans, and recent changes.
2. Define goals and constraints: clarify technical and business constraints one question at a time.
3. Split into phases: define 2-6 deliverable phases where possible.
4. Define not in scope: name exclusions explicitly.
5. Write a roadmap doc when appropriate or requested.
6. Transition to brainstorming for Phase 1 after roadmap approval.

## Process

**Explore context**
- Identify tech stack, architecture, key modules, existing plans, and relevant contracts.
- Check whether there is already a roadmap that should be reused or updated.

**Define goals and constraints**
- Ask one question at a time.
- Clarify the ultimate outcome, non-negotiable constraints, priorities, deadlines, and compatibility requirements.
- Prefer multiple-choice questions when they make the decision easier.

**Split into phases**
- Each phase should produce a working deliverable.
- Boundaries should follow natural system boundaries such as modules, layers, workflows, or user-facing increments.
- Each phase should have a goal, scope, rough task count, and prerequisites.
- Keep the roadmap comprehensible. Merge or re-split phases when dependencies become hard to explain.

**Define not in scope**
- Be specific about excluded capabilities, platforms, modules, migrations, and cleanup.
- Use these exclusions to prevent scope creep during later brainstorming and implementation.

## Roadmap Format

```markdown
# <Project Name> Roadmap

> Created: YYYY-MM-DD
> Status: Active

## Goal
<The project's goal in 1-2 sentences>

## Constraints
- <Technical or business constraint>

## Phase 1: <Phase Name>
- **Goal:** <One sentence>
- **Scope:** <Affected modules or directories>
- **Estimated tasks:** N
- **Prerequisites:** None

## Phase 2: <Phase Name>
- **Goal:** <One sentence>
- **Scope:** <Affected modules or directories>
- **Estimated tasks:** N
- **Prerequisites:** Phase 1 complete

## Not In Scope
- <Excluded item>
```

## After Approval

After the user approves the roadmap, use brainstorming for Phase 1. Do not invoke writing-plans or implementation workflows from this skill.

Save the roadmap to the repository's established planning location when useful or requested. Do not require a commit unless the user explicitly asks for one.

## Red Flags

- "There is only one phase, so scoping is unnecessary." Still clarify goal, scope, constraints, and exclusions.
- "Let's design the API here." Detailed design belongs in brainstorming.
- "We'll define out-of-scope later." Define it now or it will drift into scope.
- "The dependencies are too tangled to phase." Rework the phase split until the roadmap is understandable.
