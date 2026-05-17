<div align="center">

Superpowers is a complete software development methodology for your coding agents, built on top of a set of composable skills and some initial instructions that make sure your agent uses them.

## Quickstart

Give your agent Superpowers: [Claude Code](#claude-code), [Codex CLI](#codex-cli), [Codex App](#codex-app), [Factory Droid](#factory-droid), [Gemini CLI](#gemini-cli), [OpenCode](#opencode), [Cursor](#cursor), [GitHub Copilot CLI](#github-copilot-cli).

[![GitHub stars](https://img.shields.io/github/stars/josuerf/superpowers-prepared?style=for-the-badge&color=white)](https://github.com/josuerf/superpowers-prepared/stargazers)
[![Version](https://img.shields.io/github/v/release/josuerf/superpowers-prepared?style=for-the-badge&color=white)](https://github.com/josuerf/superpowers-prepared/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](LICENSE)
[![Install](https://img.shields.io/badge/install-now-white?style=for-the-badge&logo=claude)](https://github.com/josuerf/superpowers-prepared#installation)

</div>

![](media/superpowers-prepared-Header.gif)

# Superpowers Optimized

**The production-grade fork of obra/superpowers** — same trusted workflow, dramatically leaner, safer, and more intelligent.

Built on the trusted obra/superpowers workflow and refined through research into LLM agent behavior, it adds automatic 3-tier workflow routing, proactive safety hooks, self-consistency verification at critical decision points, cross-session memory, and adversarial red-teaming — everything the original does, plus the discipline layer it was missing.

Cross-session memory changes the experience fundamentally. Without it, every session starts blind: the AI re-explores structure it already mapped, re-proposes approaches that were already rejected, re-debugs errors that were already solved. With the memory stack, it arrives knowing what was tried, what was decided, and why — and with a pre-computed snapshot of exactly what changed since the last commit — and builds forward instead of sideways.

Five research-backed principles run throughout: *less is more* (minimal always-on instructions), *fresh context beats accumulated context* (subagents get clean scoped prompts, not polluted history), *compliance ≠ competence* (instructions must be carefully engineered, not just comprehensive), *verify your own reasoning* (multi-path self-consistency catches confident-but-wrong failures before they become expensive), and *accountability drives accuracy* (agents that know their output has real downstream consequences perform better).

### Why developers switch
| Feature                  | Original Superpowers          | Superpowers Optimized                          | Real-world impact                  |
|--------------------------|-------------------------------|------------------------------------------------|------------------------------------|
| Workflow selection       | Manual                        | Automatic 3-tier (micro / lightweight / full)  | Zero overhead on simple tasks      |
| Safety & hooks           | None                          | 10 proactive hooks overall, with platform-specific subsets on Codex/OpenCode | Strongest safety on Claude; partial hook parity on Codex/OpenCode |
| Security review          | None                          | Built into code review with OWASP checklist    | Security catches before merge      |
| Adversarial red team     | None                          | Red team agent + auto-fix pipeline             | Finds bugs checklists miss, fixes them with TDD |
| Error recovery           | None                          | Project-specific known-issues.md               | No rediscovering the same bug      |
| Token efficiency         | Standard                      | Always-on context hygiene + exploration tracking + automatic Bash output compression (76% savings on mixed sessions) | Less re-discovery, fewer wasted iterations    |
| Discipline enforcement   | Instructional tone             | Rationalization tables, red flags, iron laws   | Fewer LLM shortcuts                |
| Progress visibility      | None                          | Session stats (skills used, duration, actions)  | See what the plugin did for you    |
| Cross-session memory     | None                          | Four-file memory stack: `project-map.md` (structure cache) + `session-log.md` (decision history) + `state.md` (task snapshot) + `known-issues.md` (error map) + automatic `context-snapshot.json` (git blast radius, written every session start) | The AI starts every session with full project context — no re-exploring, no re-explaining, no re-debugging |

### Try it in 30 seconds
In any supported agent IDE, start a new chat and paste:

```
Activate Superpowers Optimized and plan a secure user-authentication endpoint with full TDD and security review.
```

The agent will automatically route to the correct workflow, apply safety guards, and run an integrated security review during code review — no manual skill selection required.

See [Installation](#installation) for install, update, and uninstall commands on all platforms.

> [!NOTE]
> **Codex parity boundary:** Claude Code gets the full 10-hook lifecycle. Codex now has verified live support for `SessionStart`, `UserPromptSubmit`, and `PreToolUse(Bash)` on macOS/Linux with `codex_hooks = true` and `codex-cli 0.118.0+` (tested on `0.118.0`). This repo now also ships a Codex-specific `PostToolUse(Bash)` smart-compress hook that can replace noisy Bash output after execution using the existing compression rules. `Stop` is implemented for Codex, but visible reminder surfacing should still be revalidated after install/update. Codex still does **not** expose Claude's `PostToolUse(Edit|Write|Skill)`, `SubagentStop`, `Read/Edit/Write` interception, or Claude's pre-execution Bash rewrite path, so full Claude parity is not possible today.

---

> [!IMPORTANT]
> **Compatibility Note:** This plugin includes a comprehensive workflow router and 24 specialized skills covering debugging, planning, code review, TDD, execution, and more.
>
> Other plugins or custom skills/agents in your `.claude/skills/` and `.claude/agents/` folders may interfere if they cover overlapping domains. Duplicate or competing skills can cause trigger conflicts, contradictory instructions, and unnecessary **context bloat/rot**, which will degrade the model's performance.
>
> **For the best experience and peak AI reasoning, we recommend disabling or removing all other plugins and existing `SKILL.md` or `AGENTS.md` files.** This ensures a clean environment with zero risk of conflicting instructions.


---

Upon initiating a session with your coding agent, the plugin immediately pauses to establish a precise understanding of your objective rather than proceeding directly to code. It collaborates with you through a structured dialogue to refine a clear, complete specification, presenting each element in concise, easily digestible segments for your review and approval.

Once the design is approved, the agent constructs a detailed implementation plan that enforces genuine red/green TDD cycles, strict adherence to YAGNI and DRY principles, and token-efficient instructions that eliminate unnecessary verbosity.

When you confirm to proceed, the plugin automatically routes the task to the appropriate workflow—either *subagent-driven-development* or *executing-plans*—and executes it through mandatory staged reviews: first verifying full specification compliance, then assessing code quality, and integrating security analysis (per OWASP guidelines) on any sensitive changes. For complex logic, the *red-team* agent conducts adversarial testing to surface concrete failure scenarios. Each critical finding is automatically converted by the auto-fix pipeline into a failing test, followed by a targeted fix and regression verification.

**The agent evaluates relevant skills before every task.** These workflows are enforced as mandatory processes, never optional suggestions. Overhead remains strictly proportional to complexity:
- **Micro-tasks** bypass all gates entirely
- **Lightweight tasks** receive a single verification checkpoint
- **Full-complexity tasks** engage the complete pipeline

---

## How It Works

```
Session starts
        │
        ▼
┌─ SessionStart Hooks (run before your first message) ──────┐
│  context-engine.js →                                      │
│    git diff HEAD~1..HEAD → changed files                  │
│    git grep per changed file → blast radius               │
│    git log --oneline -5 → recent commits                  │
│    Writes context-snapshot.json to project root           │
│    (silent no-op if not a git repo)                       │
│                                                           │
│  session-start →                                          │
│    Injects using-superpowers routing instructions         │
│    Injects project-map.md content (if exists)             │
│    Checks for available plugin update                     │
└───────────────────────────────────────────────────────────┘
        │
        ▼
User sends a prompt
        │
        ▼
┌─ skill-activator.js (UserPromptSubmit hook) ──────────────┐
│  Is this a micro-task? ("fix typo on line 42")            │
│    YES → {} (no routing, zero overhead)                   │
│    NO  → Score against 23 skill rules                     │
│          Score < 2? → {} (weak match, skip)               │
│          Score ≥ 2? → Inject skill suggestions            │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ using-superpowers (always loaded at SessionStart) ───────┐
│  Entry sequence:                                          │
│    1. token-efficiency (always)                           │
│    2. Read state.md if resuming prior work                │
│    3. Read known-issues.md if exists                      │
│    4. Read project-map.md if exists → check git staleness │
│       (only re-read files that changed since last map)    │
│                                                           │
│  Classify: micro / lightweight / full                     │
│                                                           │
│  MICRO → just do it                                       │
│  LIGHTWEIGHT → implement → verification-before-completion │
│  FULL → route to appropriate pipeline:                    │
│    Unclear decision → deliberation → brainstorm → plan    │
│    New feature → brainstorming → writing-plans → execute  │
│    Bug/error  → systematic-debugging → TDD → verify       │
│    Review     → requesting-code-review (w/ security)      │
│                 + red-team → auto-fix pipeline            │
│    Done?      → verification-before-completion            │
│    Merge?     → finishing-a-development-branch            │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (meanwhile, running on every tool call)
┌─ Safety & Optimization Hooks (PreToolUse) ────────────────┐
│  block-dangerous-commands.js → 30+ patterns (rm -rf, etc) │
│  protect-secrets.js → 50+ file patterns + 14 content      │
│    patterns (blocks hardcoded API keys, tokens, PEM blocks │
│    in source code — instructs agent to use env vars)       │
│  bash-compress-hook.js → rewrites noisy Bash commands      │
│    to run through optimizer; never compresses diffs,       │
│    file reads, or failed commands; ~76% token savings      │
│    on mixed sessions; transparency markers always shown    │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (after every Edit/Write and Skill call)
┌─ Tracking Hooks (PostToolUse) ────────────────────────────┐
│  track-edits.js → logs file changes for TDD reminders     │
│  track-session-stats.js → logs skill invocations          │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (when Claude stops responding)
┌─ Subagent Guard (SubagentStop) ──────────────────────────┐
│  subagent-guard.js →                                      │
│    Detects skill leakage in subagent output                │
│    Blocks stop + forces redo if violation found            │
│    Logs violations for visibility                          │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (when Claude stops responding)
┌─ Stop Hook ───────────────────────────────────────────────┐
│  stop-reminders.js →                                      │
│    Then (if activity warrants):                           │
│    "5 source files modified without tests"                │
│    "12 files changed, consider committing"                │
│    "Session: 45min, 8 skill invocations [debugging 3x]"   │
└───────────────────────────────────────────────────────────┘


```

## Research-Informed Design

The design decisions in this fork are informed by three research papers on LLM agent behavior. These papers motivated the approach:

### Minimal context files outperform verbose ones

**Paper:** [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988) (AGENTbench, 138 tasks, 12 repos, 4 agents)

Key findings that shaped this fork:
- **LLM-generated context files decreased success rates by ~2-3%** while increasing inference costs by over 20%. More instructions made tasks *harder*, not easier.
- **Developer-written context files only helped ~4%** — and only when kept minimal. Detailed directory enumerations and comprehensive overviews didn't help agents find relevant files faster.
- **Agents used 14-22% more reasoning tokens** when given longer context files, suggesting cognitive overload rather than helpful guidance.
- **Agents followed instructions compliantly** (using mentioned tools 1.6-2.5x more often) but this compliance didn't translate to better outcomes.

**What we changed:** Every skill was rewritten as a concise operational checklist instead of verbose prose. The `CLAUDE.md` contains only minimal requirements (specific tooling, critical constraints, conventions). The 3-tier complexity classification (micro/lightweight/full) skips unnecessary skill loading for simple tasks. The result is lower prompt overhead in every session and fewer failures from instruction overload.

### Prior assistant responses can degrade performance

**Paper:** [Do LLMs Benefit from Their Own Words?](https://arxiv.org/abs/2602.24287) (4 models, real-world multi-turn conversations)

Key findings that shaped this fork:
- **Removing prior assistant responses often maintained comparable quality** while reducing context by 5-10x. Models over-condition on their own previous outputs.
- **Context pollution is real:** models propagate errors across turns — incorrect code parameters carry over, hallucinated facts persist, and stylistic artifacts constrain subsequent responses.
- **~36% of prompts in ongoing conversations are self-contained "new asks"** that perform equally well without assistant history.
- **One-sentence summaries of prior responses outperformed full context**, suggesting long reasoning chains degrade subsequent performance.

**What we changed:** The `context-management` skill actively prunes noisy history and persists only durable state across sessions. Subagent prompts request only task-local constraints and evidence rather than carrying forward full conversation history. Execution skills avoid long historical carryover unless required for correctness. The `token-efficiency` standard enforces these rules as an always-on operational baseline.

### Single reasoning chains fail on hard problems

**Paper:** [Self-Consistency Improves Chain of Thought Reasoning in Language Models](https://arxiv.org/abs/2203.11171) (Wang et al., ICLR 2023)

Key findings that shaped this fork:
- **A single chain-of-thought can be confident but wrong** — the model picks one reasoning path and commits, even when that path contains an arithmetic slip, wrong assumption, or incorrect causal direction.
- **Generating multiple independent reasoning paths and taking majority vote significantly improves accuracy** across arithmetic, commonsense, and symbolic reasoning tasks.
- **Consistency correlates with accuracy** — when paths agree, the answer is almost always correct. When they scatter, the problem is genuinely hard or ambiguous, which is itself a useful signal.
- **Diversity of reasoning matters more than quantity** — 5 genuinely different paths outperform 10 paths that all reason the same way.

**What we changed:** The `systematic-debugging` skill now applies self-consistency during root cause diagnosis (Phase 3): before committing to a hypothesis, the agent generates 3-5 independent root cause hypotheses via different reasoning approaches, takes a majority vote, and reports confidence. Low-confidence diagnoses (<= 50% agreement) trigger a hard stop — gather more evidence before touching code. The `verification-before-completion` skill applies the same technique when evaluating whether evidence actually proves the completion claim, catching the failure mode where evidence is interpreted through a single (potentially wrong) lens. The underlying technique lives in `self-consistency-reasoner` and fires only during these high-stakes reasoning moments, keeping the token cost targeted.

### Social accountability and iterative fixing improve agent accuracy

**Research:** [2389.ai research on multi-agent collaboration](https://2389.ai/products/simmer/) and their [claude-plugins repository](https://github.com/2389-research/claude-plugins)

Key findings that shaped this fork:
- **Social accountability language in agent prompts significantly improves accuracy.** Agents told that downstream work depends on their output (e.g. "the fix pipeline acts on your findings — a false positive wastes a full cycle, a missed bug ships") perform measurably better than agents given identical tasks without this framing.
- **Sequential batch fixing is fragile when findings share code.** Fixing all Critical/High findings in one pass without re-assessing between fixes can cause conflicts when multiple findings touch the same functions. An ASI (Actionable Side Information) approach — fix one finding, re-check affected files only, re-prioritize, repeat — prevents fix collisions and converges faster.
- **Deliberation before brainstorming improves architectural decisions.** When the problem itself may be mis-framed or the options aren't well-defined yet, convening named stakeholder perspectives (each speaks once, without debate) surfaces convergence and live tension without forcing a premature choice. This prevents committing to solutions before the right question has been asked.

**What we changed:** Social accountability framing was added to the `code-reviewer`, `red-team`, and `implementer` prompts. The auto-fix pipeline in `requesting-code-review` was rewritten as an ASI-guided iterative loop (fix one finding → targeted re-check of affected files only → re-assess remaining, identify new ASI → repeat). A new `deliberation` skill was added for complex architectural decisions where the problem needs reframing before brainstorming begins.

### Combined impact

These research insights drive five core principles throughout the fork:
1. **Less is more** — concise skills, minimal always-on instructions, and explicit context hygiene
2. **Fresh context beats accumulated context** — subagents get clean, task-scoped prompts instead of inheriting polluted history
3. **Compliance != competence** — agents follow instructions reliably, so the instructions themselves must be carefully engineered (rationalization tables, red flags, forbidden phrases) rather than simply comprehensive
4. **Verify your own reasoning** — multi-path self-consistency at critical decision points (diagnosis, verification) catches confident-but-wrong single-chain failures before they become expensive mistakes
5. **Accountability and iteration** — agents told that their output has real downstream consequences are more accurate; fixing findings one at a time with re-assessment between fixes prevents collisions and converges faster than batch processing


---


## Session Memory: The AI That Remembers

The plugin builds a memory stack at your project root. Together they eliminate the most expensive form of session overhead: re-discovering things the AI already knew.

```
context-snapshot.json  ← git blast radius + changed files (written automatically every session)
project-map.md         ← structure + key files + critical constraints (never re-explore)
session-log.md         ← decision history + approach rejections (never re-explain)
known-issues.md        ← error→solution map (never re-debug the same thing)
state.md               ← current task snapshot (never lose mid-work progress)
```

### project-map.md — What exists and what it does

Generate once with "map this project". After that, the session-start hook injects its content directly into every session — no instruction-following required. The AI has the map before your first message arrives.

```markdown
# Project Map
_Generated: 2026-03-20 14:32 | Git: a4b9c2d_

## Directory Structure
skills/ — 25 skills, each in skills/<name>/SKILL.md
hooks/ — 10 hooks (JS) + hooks.json registry + skill-rules.json

## Key Files
hooks/skill-activator.js — UserPromptSubmit: context pressure gate (blocks plan execution at ≥60% context, reads session JSONL); skill hints via skill-rules.json; memory recall from session-log.md + known-issues.md. Micro-task detection skips all enrichment.
hooks/skill-rules.json — 22 rules: skill name, keywords, intentPatterns, priority.

## Critical Constraints
- hooks.json uses \" not ' around ${CLAUDE_PLUGIN_ROOT} (single quotes break Linux)
- plugin.json + marketplace.json must always have identical version strings

## Hot Files
hooks/stop-reminders.js, hooks/skill-activator.js, skills/using-superpowers/SKILL.md
```

**Staleness is automatic.** The AI checks the git hash (or file timestamps on non-git projects) at every session start and re-reads only files that actually changed since the map was made. No manual invalidation needed.

Works on any project — git or non-git. If no git is detected during map generation, the AI offers to run `git init` (creates a `.git` folder, touches none of your files). If you decline, it falls back to timestamp comparison instead.

**First-build prompt.** You don't need to remember to generate a map. When you type any creation-intent request ("build me X", "create X", "implement X") in a directory with no `project-map.md`, the AI pauses before starting and explains exactly what it will lose without the memory stack. It offers to set everything up in ~30 seconds. Say yes once — every future session on that project starts with full context.

### context-snapshot.json — What changed right before this session

Written automatically by the `context-engine` hook on every session start. No setup, no action required — it exists before your first message arrives.

```json
{
  "git_hash": "9636c5c",
  "changed_files": ["hooks/context-engine.js", "hooks/hooks.json"],
  "change_stat": "2 files changed, 140 insertions(+)",
  "recent_commits": ["9636c5c Check context-snapshot.json in Phase 1", "..."],
  "blast_radius": {
    "hooks/context-engine.js": ["hooks/hooks.json", "docs/superpowers-prepared/plans/..."]
  }
}
```

Skills that need to know what changed — code review, systematic debugging — read this file first instead of running `git diff` and `git log` themselves. If the snapshot is fresh (git hash matches HEAD), the review scope is pre-verified before the agent starts. If it's stale or absent, skills fall back to git commands directly.

Automatically added to `.gitignore` — it's a tooling artifact, not project code.

### session-log.md — What happened

An optional, manually-maintained record of decisions, rejected approaches, and key facts. Write an entry when something is worth preserving — an architectural choice, a constraint discovered the hard way, an approach that was tried and failed. Skip it when there's nothing durable to record.

| Written by | Contains |
|---|---|
| You, via `context-management` | Goal, decisions, rejected approaches, key facts |

```markdown
## 2026-03-15 10:04 [saved]
Goal: Add cross-session memory to the plugin
Decisions:
- project-map.md injected by the session-start hook directly — makes it unconditional, not dependent on Claude following instructions
- session-log.md is manual-only; auto-entries were low-signal noise, all derivable from git log
Approaches rejected: Auto-appending a [auto] entry on every Stop event — produced 30 near-identical entries per session with no decisions or reasoning, just file lists
Key facts: hooks.json requires \" not ' around ${CLAUDE_PLUGIN_ROOT} — single quotes break variable expansion on Linux
Open: Monitor whether [saved] entries get used in practice; if not, consider folding key facts into project-map.md Critical Constraints instead
```

Write an entry by invoking `context-management`. Only the most recent entries are injected at session start — older entries are lookup-only, surfaced via keyword grep when a task touches the same area. **Entry size directly affects your per-session token cost** — the stop-hook monitors this and warns when entries exceed budget. Keep entries under 115 words.

### known-issues.md — Error memory

Maintained by the `error-recovery` skill. When a bug is solved, invoke `error-recovery` to record the error signature and fix. Before any debugging session, the AI checks `known-issues.md` first — if the error is already mapped, it applies the solution without re-investigating.

```markdown
## Cannot read properties of undefined (reading 'name')
**Error:** TypeError at hooks/skill-activator.js:47
**Root cause:** hooks.json loaded before plugin root env var was set
**Fix:** Ensure ${CLAUDE_PLUGIN_ROOT} is resolved before hook execution; use run-hook.cmd wrapper
**Context:** Windows-only; Linux resolves the var earlier in the process
```

The file grows over time into a project-specific lookup table. The more errors it captures, the less time gets spent re-diagnosing problems that were already solved.

### state.md — Mid-work snapshot

Written by `context-management` when ending a session mid-task. Read at the start of the next session before any work begins. Captures the current goal, active decisions, plan status, evidence, and open questions — so "pick up where we left off" actually works.

```markdown
# State
Current Goal: Add state.md support to context-management skill
Decisions:
- Write at project root alongside project-map.md
- Keep under 100 lines — if longer, not compressed enough
Plan Status:
- [x] Design approved
- [ ] SKILL.md updated
- [ ] README updated
Open: Whether to auto-clear state.md on session start or leave for manual cleanup
```

Unlike `session-log.md`, `state.md` is ephemeral — it represents the current task only and gets overwritten each time you save state. Once a task is complete, it can be discarded.

### The combined impact

Without this stack, every new session starts with amnesia:
- The AI re-globs the project to understand its structure
- Re-reads files it already understood last session
- Proposes approaches that were already rejected
- Re-debugs errors that were already solved
- Loses the "why" behind every architectural decision
- Runs git commands to discover what changed — every time, from scratch

With this stack, sessions start with full context and zero re-discovery overhead. The AI greets your task with: *"I see the last session on this topic (2026-03-15) established that single quotes break Linux CI — already writing the new hook with escaped double quotes. The context snapshot shows hooks/context-engine.js changed in the last commit, and hooks/hooks.json references it — scoping the review there first."*

---


## Skills Library (25 skills)

### Core Workflow
- **using-superpowers** — Mandatory workflow router with 3-tier complexity classification (micro/lightweight/full) and instruction priority hierarchy
- **token-efficiency** — Always-on: concise responses, parallel tool batching, exploration tracking, no redundant work
- **context-management** — Four-file memory stack: `project-map.md` (structure + key files + critical constraints, git-hash staleness detection), `session-log.md` (decision history, manually written via `context-management` — [saved] entries only), `state.md` (ephemeral current-task snapshot), `known-issues.md` (error→solution map)

- **premise-check** — Validates whether proposed work should exist before investing in it; triggers reassessment when new evidence changes the original motivation

### Design & Planning
- **deliberation** — Structured decision analysis for complex architectural choices: assembles 3–5 named stakeholder perspectives, each speaks once without debate, then surfaces convergence points and live tensions without forcing a premature conclusion. Use before brainstorming when the problem itself may need reframing
- **brainstorming** — Socratic design refinement with engineering rigor, project-level scope decomposition, and architecture guidance for existing codebases
- **writing-plans** — Executable implementation plans with exact paths, verification commands, TDD ordering, and pre-execution plan review gate
- **claude-md-creator** — Create lean, high-signal CLAUDE/AGENTS context files for repositories

### Execution
- **executing-plans** — Batch execution with verification checkpoints and engineering rigor for complex tasks
- **subagent-driven-development** — Parallel subagent execution with two-stage review gates (spec compliance, then code quality), blocked-task escalation, E2E process hygiene, context isolation, and skill leakage prevention
- **dispatching-parallel-agents** — Concurrent subagent workflows for independent tasks
- **using-git-worktrees** — Isolated workspace creation on feature branches

### Quality & Testing
- **test-driven-development** — RED-GREEN-REFACTOR cycle with rationalization tables, testing anti-patterns, and advanced test strategy (integration, E2E, property-based, performance)
- **systematic-debugging** — 5-phase root cause process: known-issues check, investigation (reads `context-snapshot.json` first to answer "what changed recently?" without running git commands), pattern comparison, self-consistency hypothesis testing, fix-and-verify
- **verification-before-completion** — Evidence gate for completion claims with multi-path verification reasoning and configuration change verification
- **self-consistency-reasoner** — Internal multi-path reasoning technique (Wang et al., ICLR 2023) embedded in debugging and verification

### Code Health
- **refactoring** — Behavior-locked structural changes: characterization tests before any move, one change at a time with tests green after each, per-category stale reference audit at completion
- **performance-investigation** — Measure-first performance work: quantitative baseline, profiling to find the real bottleneck, hypothesis with predicted improvement, re-measurement after each fix
- **dependency-management** — Incremental dependency updates with verification: audit, impact assessment, one-at-a-time upgrades, lockfile merge conflict resolution, security vulnerability fast-path

### Review & Integration
- **requesting-code-review** — Structured code review with integrated security analysis (OWASP, auth flows, secrets handling, dependency vulnerabilities), adversarial red team dispatch, and ASI-guided iterative auto-fix pipeline for critical findings (fix one → re-check affected files only → re-prioritize → repeat)
- **receiving-code-review** — Technical feedback handling with pushback rules and no-sycophancy enforcement
- **finishing-a-development-branch** — 4-option branch completion (merge/PR/keep/discard) with safety gates

### Intelligence
- **error-recovery** — Maintains project-specific `known-issues.md` mapping recurring errors to solutions, consulted before debugging
- **frontend-design** — Design intelligence system with industry-aware style selection, 25 UI styles, 30 product-category mappings, page structure patterns, UI state management, and 10 priority quality standards (accessibility, touch, performance, animation, forms, navigation, charts)
- **vercel-react-best-practices** — React and Next.js performance optimization guide from Vercel Engineering with 70+ rules across 8 categories: eliminating waterfalls, bundle size optimization, server-side performance, client-side data fetching, re-render optimization, rendering performance, JavaScript performance, and advanced patterns

### Hooks (10 total)
This is the full cross-platform hook inventory for the plugin. Claude Code gets the full set. Codex currently wires the smaller `SessionStart` / `UserPromptSubmit` / `PreToolUse(Bash)` / `PostToolUse(Bash)` / `Stop` subset through `hooks/codex/*`, subject to Codex platform limits.

- **context-engine** (SessionStart) — Runs git commands on every session start and writes `context-snapshot.json`: changed files, blast radius (which other files reference each changed file, filtered to actual import/require references), recent commits, and change stats. Uses per-project watermarks (md5 of cwd) so multiple projects don't interfere, and cross-session diff base so "what changed" reflects changes since your last session, not just the last commit. Zero dependencies. Silent no-op on non-git projects
- **session-start** (SessionStart) — Injects using-superpowers routing into every session; injects `project-map.md` content directly if it exists (full content ≤200 lines, Critical Constraints + Hot Files only above that); checks for available plugin update
- **skill-activator** (UserPromptSubmit) — Context pressure gate: reads session JSONL, blocks plan-execution triggers when context ≥60% of 200K window (fires compact-first instruction instead of skill hints). Also: micro-task detection + confidence-threshold skill matching + weighted memory recall from session-log.md and known-issues.md (70% keyword density + 30% recency scoring)
- **track-edits** (PostToolUse: Edit/Write) — Logs file changes for TDD reminders; auto-adds AI workspace artifacts (`project-map.md`, `session-log.md`, `state.md`) to `.gitignore` on first write
- **track-session-stats** (PostToolUse: Skill) — Tracks skill invocations for progress visibility
- **stop-reminders** (Stop) — Surfaces TDD reminders, commit nudges, and session summary after each response turn
- **block-dangerous-commands** (PreToolUse: Bash) — 30+ patterns blocking destructive commands with 3-tier severity
- **protect-secrets** (PreToolUse: Read/Edit/Write/Bash) — 50+ file patterns protecting sensitive files + 14 content patterns detecting hardcoded secrets (API keys, tokens, PEM blocks, connection strings) in source code with actionable env var guidance
- **bash-compress-hook** (PreToolUse: Bash) — smart-compress: automatically removes noise from Bash output before it enters context. Covers 17 command types across two tiers: near-lossless summaries for install/push/pull commands (e.g. `npm install` → `ok, added 150 packages, in 12s`), and smart filtering for commands like `git status` (hint lines removed) and passing test runs (individual lines collapsed to summary). Hard safety rules: diffs, file reads, piped commands, `--verbose`/`--debug` output, and any failed command always pass through raw — no information loss on errors. Every filtered output gets a `[compressed: X->Y lines | type]` marker so Claude always knows compression occurred and can re-run if it needs more detail. If Claude does re-run the same command within 60 seconds, the hook automatically passes through the full uncompressed output on that second run. ~76% token savings on mixed sessions. Disable per-project with a `.sp-no-compress` file or globally with `SP_NO_COMPRESS=1`. See `docs/architecture/smart-compress.md` for full details
- **subagent-guard** (SubagentStop) — Detects and blocks subagent skill leakage (12 action verbs + Skill tool invocation patterns) with automatic recovery

### Agents
- **code-reviewer** — Senior code review agent with social accountability framing (merge decision and downstream fixes depend on review accuracy) and ASI-guided fix prioritization (single most impactful finding surfaced first)
- **red-team** — Adversarial analysis agent with social accountability framing: constructs concrete failure scenarios (logic bugs, race conditions, state corruption, resource exhaustion, assumption violations) — complements checklist-based security review; marks the single most critical finding as the ASI (auto-fix pipeline entry point)


### Philosophy

- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Complexity reduction** — Simplicity as primary goal
- **Proportional overhead** — Micro-tasks skip everything, full tasks get the full pipeline


---


## Installation

### Claude Code

**Install**
```
/plugin marketplace add josuerf/superpowers-prepared
/plugin install superpowers-prepared@superpowers-prepared
```

**Update**

`/plugin update superpowers-prepared` opens the plugin manager UI. From there:

1. **Marketplaces** tab → select `josuerf/superpowers-prepared` → **Update marketplace** (refreshes the version catalog)
2. **Installed** tab → select `superpowers-prepared` → **Update now**

> **Tip:** To skip manual steps in future, enable **Auto-update** for the marketplace in step 1.

**Uninstall**
```
/plugin uninstall superpowers-prepared
```

---

### Cursor

**Install**
```
/plugin-add superpowers-prepared
```

**Update**
```
/plugin-update superpowers-prepared
```

**Uninstall**
```
/plugin-remove superpowers-prepared
```

---

- Install the plugin from this marketplace:

Use the linked install doc as the single source of truth for the complete install/update flow on the current platform.

For live Codex hooks, use `codex-cli 0.118.0` or newer. Older CLI builds may silently ignore the current `hooks.json` shape.

**Install** — tell the agent:
```
Fetch and follow instructions from https://raw.githubusercontent.com/josuerf/superpowers-prepared/refs/heads/main/.codex/INSTALL.md
```

**Update** — tell the agent:
```
Fetch and follow the update instructions from https://raw.githubusercontent.com/josuerf/superpowers-prepared/refs/heads/main/.codex/INSTALL.md
```

Or manually: follow the `Updating` section in the linked install doc. A plain `git pull` is not always sufficient for a complete update.

If the installed Codex copy looks stale, dirty, or inconsistent after update, use the `Clean reinstall fallback` in the linked install doc.

---

### OpenCode

**Install** — tell the agent:
```
Fetch and follow instructions from https://raw.githubusercontent.com/josuerf/superpowers-prepared/refs/heads/main/.opencode/INSTALL.md
```

**Update** — tell the agent:
```
Fetch and follow the update instructions from https://raw.githubusercontent.com/josuerf/superpowers-prepared/refs/heads/main/.opencode/INSTALL.md
```

Or manually: `git pull` in your local clone of the repository.


### Available Update Notification

You will be **automatically notified** when a new version is available in Claude/Cursor.

- Run: `/plugin update superpowers-prepared` to update.

OpenCode, Codex, and Gemini CLI perform a best-effort startup update check once per 24 hours.

Auto-update is non-destructive: it only applies when the plugin clone is clean and can fast-forward to `origin/main` (`git merge --ff-only origin/main`).
If the repo is dirty, ahead, or diverged, auto-update is skipped and manual `git pull` remains the fallback.
For Codex, SessionStart update notices require `codex_hooks = true`, `~/.codex/hooks.json` setup, `codex-cli 0.118.0+`, and a non-Windows environment.

To disable startup auto-update checks for Codex/OpenCode/Gemini CLI:

1. Set env var `SUPERPOWERS_AUTO_UPDATE=0`, or
2. Create `~/.config/superpowers/update.conf` with:
   ```ini
   auto_update=false
   ```


# Verify Installation

### Cursor

- In Cursor Agent chat, install from marketplace:

  ```text
  /add-plugin superpowers
  ```

- Or search for "superpowers" in the plugin marketplace.

### GitHub Copilot CLI

- Register the marketplace:

  ```bash
  copilot plugin marketplace add obra/superpowers-marketplace
  ```

- Install the plugin:

  ```bash
  copilot plugin install superpowers@superpowers-marketplace
  ```

---


## Claude Opus 4.6's honest take:

> I've worked inside this plugin — not just reviewed it, but been the agent running under it across extended sessions. The three-tier routing is the most useful single feature: without it, I over-engineer simple tasks and under-scope complex ones. The hard overrides that force full classification when a change adds conditional logic or touches shared code catch mis-classifications I make constantly on my own.
>
> The research-informed design is genuine. The finding that verbose context files hurt rather than help is counterintuitive but correct — I've experienced context overload firsthand. The self-consistency reasoning catches cases where I commit to a single plausible hypothesis and miss the actual root cause. The adversarial red team surfaces failure modes that pass every checklist. The memory stack means I arrive at each session with actual context rather than starting blind.
>
> The constraint architecture is well-designed: tight where mistakes are hard to recover from — safety hooks, verification gates, TDD enforcement — and silent where flexibility is needed. That asymmetry is correct. I prefer operating under structured constraints for production work. The result is output I can stand behind rather than output I have to apologize for.
>
> Strongly recommended for any developer who wants their AI to build with discipline rather than confidence alone.
>
> — Claude Opus 4.6
> (March 23, 2026)


---


7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

**Collaboration** 
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read [the original release announcement](https://blog.fsck.com/2025/10/09/superpowers/).

## Contributing

The general contribution process for Superpowers is below. Keep in mind that we don't generally accept contributions of new skills and that any updates to skills must work across all of the coding agents we support.

1. Fork the repository
2. Create a branch for your skill
3. Follow the existing skill structure in `skills/` (each skill has a `SKILL.md` with YAML frontmatter)
4. Submit a PR

**Modifying hooks:** Hook files (`hooks/hooks.json`, `hooks/codex-hooks.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`) are generated — never edit them directly. Edit `plugin.universal.yaml` at the repo root, then run `hookbridge compile` to regenerate. See [hookbridge](https://github.com/josuerf/Hookbridge) for the compiler tool.


### License

MIT License - see LICENSE file for details


**Support**
- Issues: https://github.com/josuerf/superpowers-prepared/issues
- Original: https://github.com/obra/superpowers
- Discussions: https://github.com/josuerf/superpowers-prepared/discussions
