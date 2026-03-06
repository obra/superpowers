---
name: brainstorming
description: Use when the user wants new features, behavior changes, or architecture changes and there is no approved design yet.
---

# Brainstorming

Turn rough requests into an approved design before implementation.

## Hard Gate

Do not write code, edit files, or invoke implementation skills until design approval is explicit.

## Checklist

1. Inspect project context (relevant files, docs, recent commits).
2. Ask clarifying questions one at a time.
3. For especially vague or multi-part requests, optionally invoke `prompt-optimizer` once to refine the user’s goal before designing.
4. Propose 2-3 approaches with trade-offs and a recommendation.
5. Present design in short sections; confirm each section.
6. If the repo lacks `CLAUDE.md` / `AGENTS.md` and long-term collaboration is expected, consider using `claude-md-creator` to create a minimal, high-signal context file.
7. Save approved design to `docs/plans/YYYY-MM-DD-<topic>-design.md`.
8. Invoke `writing-plans`.

## Design Contents

Include:
- Scope and non-goals
- Architecture and data flow
- Interfaces/contracts
- Error handling
- Testing strategy
- Rollout or migration notes (if needed)

## Interaction Rules

- Keep each question focused.
- Prefer multiple choice when it reduces ambiguity.
- Remove non-essential scope (YAGNI).
- If user feedback conflicts with prior assumptions, revise design before proceeding.

## Exit Criteria

- User approved the design.
- Design document exists at the required path.
- `writing-plans` is invoked as the next skill.
