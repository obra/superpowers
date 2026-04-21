---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute a plan by dispatching one fresh subagent per task. Reviews (spec + code quality) run **per batch of 3-5 tasks or at sprint end**, not after every task. Fresh context per subagent, controller curates inputs, your own context stays clean.

## When to Use

- Plan exists, tasks mostly independent, stay in current session → use this.
- Parallel session or human-in-loop between tasks → use `executing-plans` instead.
- No plan yet, or tightly coupled tasks → brainstorm/plan first, or execute manually.

## Process

1. Read plan once. Extract every task's full text + context. Confirm risk tier. Create TodoWrite.
2. **Per task:** dispatch implementer (`./implementer-prompt.md`). Answer questions if asked. Let it implement, test, commit, self-review. Mark done.
3. **At end of each batch (3-5 tasks) or sprint:** dispatch spec reviewer (`./spec-reviewer-prompt.md`) on the batch. Fix loops until ✅. Then dispatch code-quality reviewer (`./code-quality-reviewer-prompt.md`). Fix loops until ✅. Never start quality before spec is ✅.
4. **At sprint exit:** dispatch a final code reviewer over the whole implementation. Then `finishing-a-development-branch`.

Never skip the re-review after a fix.

## Scaling Reviews by Risk Tier

Depth of the batch review pair scales with tier (see `using-superpowers` § Risk Tiers):

- **Trivial batch:** skip spec reviewer. Implementer self-review + your quick glance.
- **Standard batch:** spec + quality reviewers with fix loops.
- **Critical batch:** spec + quality at batch end **and** final global reviewer before `finishing-a-development-branch`.

Any batch touching a Non-Negotiable is critical regardless of size. Final global review at sprint exit runs regardless of tier.

## Model Selection

Use the cheapest model that fits the role.

- Mechanical implementation (isolated, 1-2 files, complete spec) → cheap/fast.
- Integration, multi-file coordination, debugging → standard.
- Design, architecture, review → most capable.

## Implementer Status Handling

- **DONE** — mark complete, move on. Review happens at batch boundary.
- **DONE_WITH_CONCERNS** — read the concerns. Correctness/scope → address before review. Observations → note and proceed.
- **NEEDS_CONTEXT** — supply context, re-dispatch.
- **BLOCKED** — assess: more context? more capable model? smaller split? escalate to human? Never same model + same inputs.

## Templates

- `./implementer-prompt.md`
- `./spec-reviewer-prompt.md`
- `./code-quality-reviewer-prompt.md`

All three already inject the Subagent Directive Block (Golden Rule + scope guard from `using-superpowers`).

## Guardrails

- Never start on main/master without explicit consent.
- Never dispatch multiple implementers in parallel on the same plan (git conflicts).
- Never have the subagent read the plan file — provide full task text in the prompt.
- Never close a sprint while any review has open issues.
- If a subagent fails, dispatch a fix subagent — don't patch manually (context pollution).

## Integration

- `superpowers:using-git-worktrees` — isolated workspace before starting.
- `superpowers:writing-plans` — creates the plan.
- `superpowers:requesting-code-review` — template used by reviewer subagents.
- `superpowers:finishing-a-development-branch` — sprint exit.
- Subagents use `superpowers:test-driven-development` per task.
