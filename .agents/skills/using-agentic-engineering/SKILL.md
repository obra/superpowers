---
name: using-agentic-engineering
description: Use at the start of any task - the harness meta-skill. Invoke a relevant skill before ANY action, and treat AGENTS.md as the binding contract.
---

# Using the Agentic Engineering Harness

<SUBAGENT-STOP>
If you are a subagent dispatched to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If there is even a 1% chance a skill below applies to what you are doing, you ABSOLUTELY MUST invoke
it before acting — including before asking a clarifying question, exploring the codebase, or
writing code. This is not negotiable. You cannot rationalize your way out of it.
</EXTREMELY-IMPORTANT>

## The rule

Invoke a relevant skill BEFORE any response or action. Announce "Using [skill] to [purpose]" and
follow it exactly. If it turns out wrong for the situation, you don't have to use it — but check
first.

## The contract

`AGENTS.md` at the repo root is the source of truth for workflow (§3), guardrails (§4), and
verification (§5). Its rules are mandatory, not suggestions. Named agents (if installed) are
thin aliases that load these skills — playbooks live only under `.agents/skills/`.

## Routing

- **High-level goal → GitHub tickets → serial PRs:** `orchestrated-delivery` (thin agent: `code-coordinator`).
- **Single ticket already filed:** `implementing-a-ticket`.
- **Plan tasks without GitHub Issues:** `subagent-driven-development` / `executing-plans`.
- **Independent domains in parallel:** `dispatching-parallel-agents` (never parallel tickets inside orchestrated-delivery).
- **Merge-gating review of ticketed work:** `falsifying-review` (prefer over generic requesting-code-review).

## Available skills

### Core loop
- **brainstorming** — before creative/feature work; spec elicitation + approval gates.
- **writing-plans** — turn an approved spec into a bite-sized implementation plan.
- **using-git-worktrees** — isolate work in a worktree/branch before coding (honor `ticket_worktree_pattern` from invariants when ticketed).
- **executing-plans** — implement the approved plan task-by-task.
- **test-driven-development** — RED-GREEN-REFACTOR during implementation.
- **requesting-code-review** — review each task before moving on.
- **receiving-code-review** — respond to review feedback constructively.
- **subagent-driven-development** — dispatch a fresh subagent per plan task + review.
- **dispatching-parallel-agents** — run independent domains in parallel across agents.
- **verification-before-completion** — no completion claim without fresh evidence (includes mutation for invariants).
- **finishing-a-development-branch** — verify, PR description schema, merge/PR/cleanup.
- **systematic-debugging** — root cause before fixing.

### Orchestrated delivery (ticketed)
- **orchestrated-delivery** — goal → tickets → serial implement → harden → falsify → human merge.
- **implementing-a-ticket** — one GitHub issue in an isolated worktree through PR + hand-back.
- **hardening-invariant-tests** — mutation-oriented tests for invariant tickets.
- **falsifying-review** — falsify implementer claims; merge-gating verdicts.
- **creating-tickets** — issue body schema, project/status/severity labels.

### Memory & harness improvement
- **capturing-learnings** — environment/client facts → workspace learnings store.
- **improving-harness** — instruction defects → lessons queue → approved skill/AGENTS edits.
- **improving-harness-metalearn** — index integrity, compression, dedupe (`regen_index.py`).
- **prompt-decompose** — split oversized skill bodies into procedures (~400-line threshold).
- **recording-changelog** — per-repo milestone changelog.
- **recording-backlog** — deferred/future work.

## If none applies

If no skill applies, follow `AGENTS.md` directly.
