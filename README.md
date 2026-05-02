# spx — Tiered Superpowers (kwkwkiki fork)

A downstream fork of the Superpowers plugin with **tier-based ceremony scaling**. Ceremony scales with the size of the task: a typo fix doesn't trigger a design-approval gate or a worktree, while a multi-day subsystem still gets the full plan/review/worktree pipeline.

This fork exists because the upstream "every project gets a design, even simple ones" philosophy makes a 3-hour task into a 1-2 day workflow. It is not intended for upstream — see `CLAUDE.md`.

## What changed vs upstream

| Concern | Upstream | This fork |
|---|---|---|
| Session injection | Full `using-superpowers` SKILL injected each startup/clear/compact (~2K tokens) | Slim `POINTER.md` (~200 tokens) — full SKILL on demand via the `Skill` tool |
| Design gate | HARD-GATE blocks ALL implementation until user approves design — applies to "EVERY project regardless of perceived simplicity" | Only Medium/Large tier; Trivial/Small skip brainstorming entirely |
| Question style | One question per message; visual-companion offer must be its own message | Up to 3 batched questions per message; visual offer inlined |
| Plan docs | Always saved to `docs/superpowers/specs|plans/YYYY-MM-DD-*.md` and committed | Medium → `.spx/` (gitignored); Large → `docs/superpowers/` (committed); Trivial/Small → none |
| Worktree | REQUIRED before any plan execution | REQUIRED only for Large; recommended for Medium; skip for Trivial/Small |
| Per-task review | Two subagents (spec-reviewer + quality-reviewer) per task | Single combined reviewer (Large only); Medium gets one final reviewer |
| Commit cadence | "Frequent commits" — one per 2-5 min step | Logical boundaries; one commit per task for ≤Medium |
| `anthropic-best-practices.md` | Auto-loaded with `writing-skills` (~11.5K tokens) | Lazy-loaded from `references/` only when explicitly needed |
| Per-platform tool refs | All loaded each session | Indexed; load only your platform's file |

Preserved across all tiers: `verification-before-completion` (Iron Law), `systematic-debugging` (root-cause first), TDD core principles, subagent-isolation pattern.

## The tier rubric

Every request is classified before any ceremony fires. Inferred from the request — **not asked**.

| Tier | Scope | Examples |
|---|---|---|
| **Trivial** | Single-line edit, no logic change | typo, rename, comment, config flip |
| **Small** | Single file, ≤~30 LOC, no architectural impact | flag, isolated bugfix, label tweak |
| **Medium** | Multi-file feature within one subsystem | new endpoint, new component, single-module refactor |
| **Large** | Cross-system, schema change, security surface, >1 day | new subsystem, migration, auth, billing, "platform" |

**Auto-escalate one tier up** if any apply: touches >2 files, security surface, schema/migration, public-API change, ambiguous user intent. When in doubt, tier up.

### Ceremony matrix

|  | Trivial | Small | Medium | Large |
|---|:-:|:-:|:-:|:-:|
| Restate intent before acting | optional | yes | yes | yes |
| `brainstorming` HARD-GATE | skip | skip | 1-pass batched | full |
| Plan/spec file | none | none | `.spx/` (gitignored) | `docs/superpowers/` (committed) |
| `using-git-worktrees` | skip | skip | recommended | REQUIRED |
| Commit cadence | 1 commit | logical | logical | frequent |
| Per-task reviewer | skip | skip | skip | yes |
| Final feature reviewer | skip | skip | yes | yes |
| `test-driven-development` | optional | recommended | yes | yes |
| `verification-before-completion` | yes | yes | yes | yes |
| `systematic-debugging` | yes | yes | yes | yes |

Full rubric and inference cues: `skills/task-tier/SKILL.md`.

## Skills

Bold = new in this fork.

**Triage**
- **`task-tier`** — authoritative tier classifier; every gating skill defers to it

**Process**
- `using-superpowers` — skill philosophy and precedence rules (loaded on demand, not on every session)
- `brainstorming` — Medium/Large only; batched questions; tier-aware spec location
- `writing-plans` — Large tier; logical-boundary commits; tier-aware bite-size
- `executing-plans` — tier-0 skip-or-proceed gate
- `subagent-driven-development` — collapsed combined per-task reviewer; tier-conditional
- `dispatching-parallel-agents` — concurrent subagent workflows
- `using-git-worktrees` — REQUIRED only for Large
- `requesting-code-review` — per-tier mandatory matrix
- `receiving-code-review` — responding to feedback (unchanged)
- `finishing-a-development-branch` — merge/PR decision workflow

**Discipline (apply to every tier)**
- `verification-before-completion` — Iron Law: evidence before claims (unchanged)
- `systematic-debugging` — root-cause first (unchanged)
- `test-driven-development` — RED-GREEN-REFACTOR (strictness scales with tier)

**Meta**
- `writing-skills` — `anthropic-best-practices.md` now load-on-demand only

## How a request flows

```
user request
  ↓
task-tier triages → Trivial / Small / Medium / Large
  ↓
Trivial/Small → make change → verification → done
Medium       → batched brainstorming → implement → final reviewer → done
Large        → brainstorming (full) → writing-plans → worktree → subagent-driven → final reviewer → finishing-branch
```

`verification-before-completion` and `systematic-debugging` apply at every tier.

## Installation

This is a personal fork; install directly from this repo rather than the upstream marketplace. Adapt the path for your harness.

**Claude Code:**
```bash
/plugin marketplace add kwkwkiki/spx
/plugin install superpowers@spx
```

**Cursor / Copilot CLI / Codex / Gemini CLI / OpenCode:** point your plugin loader at `kwkwkiki/spx` instead of `obra/superpowers`. The hook script auto-detects the harness; the slim SessionStart pointer works on every supported platform.

To pull updates, sync your fork from this repo's main branch — there is no official marketplace entry.

## `.spx/` scratch directory

Medium-tier specs and plans are written to `.spx/` in the user repo (gitignored). Add this to your repo's `.gitignore`:

```
.spx/
```

Promote a scratch file to permanent docs when it matures:
```bash
git mv .spx/specs/<topic>.md docs/superpowers/specs/$(date +%Y-%m-%d)-<topic>-design.md
```

Details: `skills/task-tier/spx-scratch-template.md`.

## Known follow-ups

- `tests/claude-code/test-subagent-driven-development*.sh` assert the upstream "spec compliance before code quality" ordering. The combined reviewer is now the default; those assertions will need updating. They run only against a live Claude CLI and are not in any CI pipeline.

## License

MIT — see `LICENSE`. Original work © Jesse Vincent / Prime Radiant; tier-scaling modifications © kwkwkiki.
