# Skills Audit v2 — Design Document

> **Date:** 2026-03-01
> **Status:** Approved
> **Approach:** Layered Sweep — consistency fixes first, then fork innovations, then upstream gap coverage
> **Predecessor:** `docs/plans/skills-audit/design.md` (v4.5.0 audit, Phases 1-3)

## Goal

Second-pass audit of all 16 Superpowers skills, ensuring end-to-end workflow consistency, adopting high-value innovations from community forks, and closing gaps identified from upstream issues/PRs.

## Research Sources

- **E2E workflow audit** (`docs/research/e2e-workflow-audit.md`): 30 findings across 6 workflow chains, revalidated against v4.5.0 — 13 still present, 4 partially fixed, 17 already resolved
- **Upstream closed issues** (`docs/research/upstream-closed-issues.md`): 156 closed issues, 11 gaps still relevant
- **Upstream open issues/PRs** (`docs/research/upstream-open-issues-prs.md`): 104 issues + 84 PRs, 38 addressed by v4.5.0
- **Upstream unmerged PRs** (`docs/research/upstream-unmerged-prs.md`): 230 unmerged PRs scanned, top 15 prioritized
- **Forks survey** (`docs/research/upstream-forks-survey.md`): 5,111 forks, 6 with meaningful divergence

## Architecture: Three Layers

### Layer 1 — E2E Consistency Fixes (17 items)

Surgical edits to existing skills fixing contradictions, missing cross-references, broken handoffs, and stale references discovered by the workflow audit.

#### High Severity (1)

| ID | Fix | File(s) |
|----|-----|---------|
| CX-7 | Change `{PLAN_REFERENCE}` to `{PLAN_OR_REQUIREMENTS}` — placeholder mismatch in code-reviewer template | `requesting-code-review/code-reviewer.md` |

#### Medium Severity (3)

| ID | Fix | File(s) |
|----|-----|---------|
| W1-2 | Add Integration section to verification-before-completion listing callers and usage context | `verification-before-completion/SKILL.md` |
| W5-1 | Add "Pairs with" cross-references between requesting-code-review and receiving-code-review | Both code review SKILL.md files |
| CX-4/19 | Fix agent-team spec-reviewer: change `superpowers:code-reviewer` subagent_type to `general-purpose` for spec review (code-reviewer is the wrong agent type for spec compliance checking) | `agent-team-driven-development/spec-reviewer-prompt.md` |

#### Low Severity (12)

| ID | Fix | File(s) |
|----|-----|---------|
| CX-9 | Fix "designing-before-coding" stale reference to "brainstorming" | `writing-skills/SKILL.md` |
| CX-11 | Add "Announce at start" to brainstorming | `brainstorming/SKILL.md` |
| CX-13 | Clarify "fresh per task, persistent within task" for subagent fix loops | `subagent-driven-development/SKILL.md` |
| CX-14 | Reorder "write header last" instruction for clarity | `writing-plans/SKILL.md` |
| CX-15 | Add "Announce at start" to subagent-driven and agent-team-driven development | Both execution SKILL.md files |
| CX-17 | Add Integration section to dispatching-parallel-agents | `dispatching-parallel-agents/SKILL.md` |
| CX-18 | Remove "finished suspiciously quickly" biased framing from spec-reviewer | `subagent-driven-development/spec-reviewer-prompt.md` |
| CX-20 | Add autonomous plan revision escalation guidance | `executing-plans/SKILL.md` |
| W6-1 | Upgrade verification-before-completion reference from illustrative to functional | `writing-skills/SKILL.md` |
| CX-5 | Clarify "Agent tool" usage in agent-team prompts (partially fixed, clean up remaining confusion) | `agent-team-driven-development/spec-reviewer-prompt.md` |
| W2-1 | Make worktree handoff for parallel session path more explicit | `writing-plans/SKILL.md`, `executing-plans/SKILL.md` |
| W3-1 | Add bold REQUIRED SUB-SKILL callout for finishing in subagent-driven-development | `subagent-driven-development/SKILL.md` |
| CX-21 | Add user confirmation gates at team decision (step 8) and implementation transition (step 9) | `brainstorming/SKILL.md` |

### Layer 2 — Fork Innovations (4 items)

High-value ideas adopted from community forks, with attribution.

| Priority | Item | Source | File(s) |
|----------|------|--------|---------|
| P0 | **Plan mode prohibition** — Block `EnterPlanMode`/`ExitPlanMode` in brainstorming, writing-plans, executing-plans. Prevents session-trapping failure mode. | pcvelz/superpowers (227 stars) | `brainstorming/SKILL.md`, `writing-plans/SKILL.md`, `executing-plans/SKILL.md` |
| P0 | **Expanded red flags table** — Add 7 new rationalization patterns to using-superpowers | pcvelz/superpowers | `using-superpowers/SKILL.md` |
| P1 | **Plan status frontmatter** — Add `status: pending`/`status: executed` YAML frontmatter to plan documents | pcvelz/superpowers | `writing-plans/SKILL.md`, `executing-plans/SKILL.md` |
| P2 | **Sequential fallback note** — Note that Codex can't parallel-dispatch; use sequential execution | markelz0r/superpowers-codex | `dispatching-parallel-agents/SKILL.md` |

### Layer 3 — Upstream Gap Coverage (6 items)

Ideas from closed issues, open PRs, and unmerged PR diffs that our v4.5.0 audit missed.

| Priority | Item | Source | File(s) |
|----------|------|--------|---------|
| P0 | **Worktree environment file guidance** — Add post-creation section for copying .env, database configs, MCP dirs | Issues #521, #220, #241 | `using-git-worktrees/SKILL.md` |
| P0 | **Hook bug fixes** — bash 5.3 heredoc hang (PR #572), Linux variable expansion (PRs #584/#585), Ubuntu/dash compat (PR #553) | Open PRs | `hooks/session-start` |
| P1 | **Plan verification step** — Spot-check 3 claims from plan against codebase before executing (3-Example Rule) | PR #448 (banga87) | `executing-plans/SKILL.md` |
| P1 | **Cross-task dependency check** — Final review should check for cross-task dependency issues, not just per-task quality | PR #578 (STRML) | `agent-team-driven-development/SKILL.md` |
| P2 | **Quick mode acknowledgment** — For trivial tasks, design can be 1-2 sentences rather than full document | PRs #534 (johnwhoyou), #477 (sjawhar) | `brainstorming/SKILL.md` |
| — | **Attribution section** — Credit fork authors and PR authors | — | This design doc |

## Files Touched Summary

| File | Layer 1 | Layer 2 | Layer 3 | Total changes |
|------|---------|---------|---------|---------------|
| `brainstorming/SKILL.md` | CX-11, CX-21 | Plan mode, — | Quick mode | 4 |
| `writing-plans/SKILL.md` | CX-14, W2-1 | Plan mode, Plan status | — | 4 |
| `executing-plans/SKILL.md` | CX-20, W2-1 | Plan mode, Plan status | Plan verification | 5 |
| `using-superpowers/SKILL.md` | — | Red flags | — | 1 |
| `using-git-worktrees/SKILL.md` | — | — | Env files | 1 |
| `verification-before-completion/SKILL.md` | W1-2 | — | — | 1 |
| `requesting-code-review/SKILL.md` | W5-1 | — | — | 1 |
| `requesting-code-review/code-reviewer.md` | CX-7 | — | — | 1 |
| `receiving-code-review/SKILL.md` | W5-1 | — | — | 1 |
| `agent-team-driven-development/SKILL.md` | CX-15 | — | Cross-task check | 2 |
| `agent-team-driven-development/spec-reviewer-prompt.md` | CX-4/19, CX-5 | — | — | 2 |
| `subagent-driven-development/SKILL.md` | CX-13, CX-15, W3-1 | — | — | 3 |
| `subagent-driven-development/spec-reviewer-prompt.md` | CX-18 | — | — | 1 |
| `dispatching-parallel-agents/SKILL.md` | CX-17 | Sequential note | — | 2 |
| `writing-skills/SKILL.md` | CX-9, W6-1 | — | — | 2 |
| `hooks/session-start` | — | — | Hook fixes | 1 |

**Total: ~27 changes across 16 files**

## Deferred / Future Work

- **state.yml implementation** — Phase 4 from v4.5.0 design. Designed but not yet wired into skills.
- **Multi-model routing** — BryanHoo/superpowers-ccg's fail-closed gate pattern could inform future verification gates. Full multi-model routing is too infrastructure-dependent for now.
- **Review/model/workflow tiering** — Phase 4 from v4.5.0 design.
- **EVALUATION.md test framework** — Structured test scenarios per skill. Useful for skill developers but low priority for consumers.
- **Task persistence (.tasks.json)** — pcvelz's approach to cross-session task recovery. Complements state.yml but deferred until state.yml is implemented.

## Acknowledgments

This design incorporates ideas from the following community contributors:

- **pcvelz/superpowers** (227 stars) — Plan mode prohibition, expanded red flags table, plan status frontmatter
- **BryanHoo/superpowers-ccg** (65 stars) — Fail-closed gate principle (informing future verification gate design)
- **markelz0r/superpowers-codex** — Sequential fallback guidance for Codex platform
- **banga87** (PR #448) — 3-Example Rule for plan verification
- **STRML** (PR #578) — Cross-task dependency detection concept
- **johnwhoyou** (PR #534) and **sjawhar** (PR #477) — Quick mode / bootstrap skip concepts
- **pds** (PR #572) — Bash 5.3 heredoc hang fix
- **04cb** (PR #584), **atian8179** (PR #585) — Linux variable expansion fix
- **jd316** (PR #553) — Ubuntu/dash POSIX compatibility fix
