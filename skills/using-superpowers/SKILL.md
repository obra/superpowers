---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<IMPORTANT>
If a skill clearly applies to the task, invoke it. For standard and critical tier work (see Risk Tiers below), invoking applicable skills is required. For trivial tier work you MAY skip process skills and go straight to code — but the Golden Rule (see below) always applies.

This is not about ceremony for its own sake; it's about not making up process mid-work. If an existing skill fits, use it.
</IMPORTANT>

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md, GEMINI.md, or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In Copilot CLI:** Use the `skill` tool. Skills are auto-discovered from installed plugins. The `skill` tool works the same as Claude Code's `Skill` tool.

**In Gemini CLI:** Skills activate via the `activate_skill` tool. Gemini loads skill metadata at session start and activates the full content on demand.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see `references/copilot-tools.md` (Copilot CLI), `references/codex-tools.md` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
}
```

## Red Flags

These apply when you're about to skip a skill that tier-gating hasn't already excused. For trivial tier work you may already be exempt; for standard/critical work, these thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

## Risk Tiers

Before invoking process skills, classify the work. This determines how much ceremony to apply. When ambiguous, default to **standard**; escalate to **critical** if any Non-Negotiable (see below) applies.

| Tier | Signals | Applied ceremony |
|------|---------|------------------|
| **trivial** | Config tweak, typo, copy change, single-line fix, dependency bump, rename, comment addition | Skip brainstorming, skip plan, go straight to code + tests; single final verification |
| **standard** | New feature within existing module, bug fix requiring investigation, refactor of 1-3 files | Light brainstorming if unclear, plan optional, TDD required, review at bundle end |
| **critical** | Security/auth, data migrations, RLS changes, destructive ops, cross-cutting architecture, new external dep, > 5 files or > 200 LoC expected | Full brainstorming, full plan, subagent-driven-development with per-batch reviews, full verification |

Default when ambiguous: **standard**. Anything touching a Non-Negotiable escalates to **critical** regardless of surface signals.

## Non-Negotiables

These items bypass the tier system. A task that touches any of them is **critical** tier by definition, even if surface signals suggest trivial or standard. Always apply full ceremony:

- Secrets, credentials, `.env` changes
- Auth, authorization, session logic
- Supabase RLS policies or data migrations
- Destructive ops (`rm -rf`, `DROP TABLE`, force-push to main)
- New external dependencies
- Changes to CI/CD hooks or deploy scripts

## Sprint Mode

Treat a whole plan (or an ad-hoc task batch) as ONE sprint, not N independent micro-tasks. Ceremony concentrates at **sprint boundaries** and **critical checkpoints**, not between every step.

**Sprint entry checkpoint (once):**
- Acknowledge the Golden Rule (see below)
- Confirm risk tier
- For standard/critical: brief plan skim for non-negotiables

**Sprint exit checkpoint (once):**
- Full verification (tests, build, lint)
- Final code review, scaled to tier
- Use `finishing-a-development-branch`

**Mid-sprint critical checkpoints** (trigger a mini-review even mid-sprint):
- 3+ consecutive failed fix attempts → invoke `systematic-debugging` Phase 1
- Scope creep beyond plan → pause and ask
- Touching a Non-Negotiable → full review before commit
- Batch of 3-5 tasks complete in subagent-driven-dev → batched review pair

**NOT triggers for mid-sprint ceremony:**
- Each commit, each task, each claim in isolation
- Trivial edits that pass tests locally
- Progress updates within a batch ("Task 2 done, moving on")

The idea: concentrate rigor where it catches real errors (sprint boundaries, scope violations, non-negotiables) instead of spreading it thin across every micro-step.

## The Golden Rule (Surgical Edits)

Apply to every implementation task, every subagent dispatch, every refactor — regardless of tier:

1. **MINIMAL** — change as little as possible to solve the task
2. **SURGICAL** — touch only what the task requires; no opportunistic cleanup, no unrelated refactor, no style churn
3. **REUSE > CREATE** — extend existing helpers, hooks, patterns; don't duplicate what's already in the repo
4. **AGGREGATE > FRAGMENT** — one solution covering several needs beats three specialized ones
5. **DIRECTED REFACTOR** — factor only when the task already touches both sites; if a duplication is out of scope, note it but don't fix it
6. **UNCERTAINTY = ASK** — new lib, new pattern, new folder? Ask the user first rather than add silently

The Golden Rule is injected verbatim into every subagent prompt via the Subagent Directive Block (below). It complements tier-specific rigor by preventing over-engineering within whatever tier applies.

## Subagent Directive Block (template)

When dispatching any subagent (implementer, reviewer, debugger), include this block verbatim at the top of the prompt:

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

The block is short by design so it fits at the top of any subagent prompt without crowding the task-specific content.
