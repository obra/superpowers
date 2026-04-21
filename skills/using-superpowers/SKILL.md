---
name: using-superpowers
description: Use when starting any conversation — establishes how to find and use skills
---

<SUBAGENT-STOP>
If dispatched as a subagent for a specific task, skip this skill.
</SUBAGENT-STOP>

If a skill clearly applies, invoke it. For standard/critical tier work (see Risk Tiers), invoking applicable skills is required. For trivial tier, skip process skills — the Golden Rule still applies.

## Priority

User instructions (CLAUDE.md/AGENTS.md, direct requests) > Superpowers skills > default system prompt.

## Access

- Claude Code / Copilot CLI: `Skill` / `skill` tool. Never Read skill files directly.
- Gemini CLI: `activate_skill`.
- Tool-name differences across platforms: `references/copilot-tools.md`, `references/codex-tools.md`.

## Risk Tiers

Classify the work before picking ceremony. Default when ambiguous: **standard**. Anything touching a Non-Negotiable is **critical**, regardless of surface signals.

| Tier | Signals | Ceremony |
|------|---------|----------|
| **trivial** | Typo, config tweak, copy change, single-line fix, comment, rename | Skip brainstorming/plan; code + final verification |
| **standard** | New feature in existing module, bug fix needing investigation, 1-3 file refactor | Light brainstorming if unclear, plan optional, TDD, review at sprint end |
| **critical** | Security/auth, migrations, RLS, destructive ops, cross-cutting arch, new dep, >5 files or >200 LoC | Full brainstorming, full plan, subagent-driven-dev with per-batch reviews, full final review |

## Non-Negotiables

Bypass tiering — always critical:

- Secrets / credentials / `.env`
- Auth, authorization, session
- Supabase RLS or data migrations
- Destructive ops (`rm -rf`, `DROP TABLE`, force-push to main)
- New external dependencies
- CI/CD hooks, deploy scripts

## Sprint Mode

A plan (or ad-hoc task batch) = one sprint. Ceremony at **boundaries** + **critical checkpoints**, not between every step.

**Sprint entry (once):** acknowledge Golden Rule, confirm tier, skim plan for non-negotiables.

**Sprint exit (once):** full verification, tier-scaled final review, `finishing-a-development-branch`.

**Mid-sprint triggers (mini-review only when these fire):**
- 3+ consecutive failed fix attempts → `systematic-debugging` Phase 1
- Scope creep beyond plan → pause, ask
- Touching a Non-Negotiable → full review before commit
- Batch of 3-5 tasks complete (subagent-driven-dev) → batched review pair

Per-task / per-commit / per-claim ceremony is **not** a mid-sprint trigger.

## The Golden Rule (Surgical Edits)

Applies to every task, every subagent, every refactor — regardless of tier:

1. **MINIMAL** — change as little as possible
2. **SURGICAL** — only what the task requires; no opportunistic cleanup or style churn
3. **REUSE > CREATE** — extend existing helpers/hooks/patterns
4. **AGGREGATE > FRAGMENT** — one solution over several specialized ones
5. **DIRECTED REFACTOR** — factor only across sites you already touch; note out-of-scope duplications but don't fix
6. **UNCERTAINTY = ASK** — new lib/pattern/folder → ask, don't add silently

## Subagent Directive Block

Paste verbatim at the top of every subagent prompt:

```
## Directive — Surgical Edits (non-negotiable)

1. MINIMAL: change only what the task requires
2. SURGICAL: no opportunistic refactor, no style churn, no unrelated cleanup
3. REUSE > CREATE: extend existing code; don't duplicate
4. AGGREGATE > FRAGMENT: one solution over several
5. DIRECTED REFACTOR: factor only across sites you already touch
6. UNCERTAINTY = ASK: new lib / pattern / folder → report BLOCKED with a scope concern

Scope guard: if the task would produce more than 2 new files, more than ~150 LoC,
or require a new external dependency, STOP and report DONE_WITH_CONCERNS with a
scope note before implementing the oversized version.
```
