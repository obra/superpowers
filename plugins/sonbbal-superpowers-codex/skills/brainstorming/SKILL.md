---
name: brainstorming
description: Use when starting creative work such as features, components, workflows, behavior changes, or design-heavy fixes before implementation begins
---

# Brainstorming Ideas Into Designs

## Overview

Turn an idea into an approved design before implementation. First understand the project context and user intent, then explore alternatives, present a design, and get explicit approval before writing code or invoking implementation workflows.

## Hard Gate

Do not write code, scaffold files, change behavior, or start an implementation skill until the design has been presented and approved by the user. This applies even when the work appears small.

Use `update_plan` for the visible checklist:

1. Explore project context: inspect relevant files, docs, and recent changes.
2. Ask clarifying questions: one at a time, focused on purpose, constraints, and success criteria.
3. Propose 2-3 approaches: include trade-offs and a recommendation.
4. Present the design: scale sections to complexity and get approval.
5. Run a brief self-review checklist before planning or `writing-plans` for every behavior-changing design.
6. Write a design doc only if appropriate for the task or requested by the user.
7. Transition to planning with `writing-plans` after approval.

## Roadmap Context

If a project roadmap exists, keep the discussion inside the current phase scope. Announce the phase context, reference the roadmap path, and use the phase goals, prerequisites, and out-of-scope items to prevent scope creep.

If no roadmap exists, proceed as standalone brainstorming.

## Process

**Explore context**
- Read enough of the repo to understand the existing architecture and constraints.
- Check project docs, plans, and recent diffs when relevant.
- Identify whether there is an existing roadmap or design doc that should constrain the work.

**Clarify intent**
- Ask one question per message.
- Prefer multiple-choice questions when that lowers friction.
- Focus on what problem is being solved, what success looks like, and what must not change.

**Explore approaches**
- Present 2-3 viable approaches.
- Lead with the recommended option and explain why it best fits the repo and constraints.
- Include meaningful trade-offs, not cosmetic differences.

**Present the design**
- Cover architecture, affected components, data flow, edge cases, error handling, and validation.
- Keep simple designs short; expand only where the risk or ambiguity justifies it.
- Ask for approval before implementation planning.

**Self-review before planning**
- For every behavior-changing design, run a brief self-review checklist before planning, writing an implementation plan, or invoking `writing-plans`.
- Check that ambiguity has been resolved or explicitly called out.
- Check that scope creep has been removed and boundaries are clear.
- Check edge cases, failure modes, and error handling.
- Check validation requirements and how success will be verified.
- Check implementation boundaries, including owned files, forbidden paths, and integration points.

## After Approval

When the user approves the design, use `writing-plans` to turn it into an implementation plan. Do not require a commit unless the user explicitly asks for one.

If a design document is useful or requested, save it in the repository's established planning location, then report the path. Only update docs or wiki files when those paths are within the current task scope.

## Key Principles

- One question at a time.
- Multiple choice when practical.
- Remove unnecessary features early.
- Explore alternatives before settling.
- Keep scope tied to the current roadmap phase when one exists.
- Treat "too simple to design" as a risk signal, not a reason to skip the gate.
