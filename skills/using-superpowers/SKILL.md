---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Superpowers Ruby skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md, GEMINI.md, or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In Gemini CLI:** Skills activate via the `activate_skill` tool. Gemini loads skill metadata at session start and activates the full content on demand.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see `references/codex-tools.md` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.

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

These thoughts mean STOP—you're rationalizing:

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

## Skills Catalog

All available skills — invoke with the `Skill` tool using the `name` value.

### Process & Workflow

| Name | When to Use |
|------|-------------|
| `superpowers-ruby:brainstorming` | When starting any creative work — new features, components, or behavior changes (**REQUIRED**) |
| `superpowers-ruby:test-driven-development` | When implementing any feature or bugfix — before writing implementation code (**REQUIRED**) |
| `superpowers-ruby:systematic-debugging` | When diagnosing a bug or unexpected behavior |
| `superpowers-ruby:writing-plans` | When planning a multi-step implementation |
| `superpowers-ruby:executing-plans` | When executing an existing plan |
| `superpowers-ruby:dispatching-parallel-agents` | When parallelizing independent work across subagents |
| `superpowers-ruby:subagent-driven-development` | When using subagents to implement and review code |
| `superpowers-ruby:verification-before-completion` | When finishing a task — before marking it done |
| `superpowers-ruby:finishing-a-development-branch` | When wrapping up a feature branch for PR |
| `superpowers-ruby:using-git-worktrees` | When needing isolated git worktrees for parallel work |
| `superpowers-ruby:compound` | When a non-trivial problem has just been solved — capture the solution |

### Ruby & Rails

| Name | When to Use |
|------|-------------|
| `superpowers-ruby:ruby` | When writing, reviewing, or debugging pure Ruby — idiomatic patterns, Ruby 3.x+ features (pattern matching, `Data.define`, endless methods), memoization, result objects |
| `superpowers-ruby:rails-guides` | When working on any Rails-specific topic: ActiveRecord, routing, controllers, views, mailers, jobs, Action Cable, Action Text, Active Storage, migrations, validations, associations, caching, security |
| `superpowers-ruby:37signals-style` | When writing Rails code in 37signals/Basecamp style — controllers, models, views, Hotwire, testing, database, philosophy |
| `superpowers-ruby:ruby-commit-message` | When committing changes in Ruby or Rails projects — Conventional Commits format with developer-friendly body |
| `superpowers-ruby:sandi-metz-rules` | When reviewing or refactoring Ruby code for quality — classes <100 lines, methods <5 lines, ≤4 params, one object per controller action |

### Hotwire & Stimulus

| Name | When to Use |
|------|-------------|
| `superpowers-ruby:hwc-stimulus-fundamentals` | When working on Stimulus controller lifecycle, values, targets, outlets, action parameters, keyboard events — framework-level APIs |
| `superpowers-ruby:hwc-navigation-content` | When implementing Turbo Drive/Frames navigation: pagination, tabbed nav, lazy loading, faceted filtering, cache lifecycle, scroll restoration |
| `superpowers-ruby:hwc-forms-validation` | When building Hotwire form workflows: submission lifecycle, inline editing, validation errors, typeahead, modal forms |
| `superpowers-ruby:hwc-ux-feedback` | When adding cross-cutting UX feedback: loading states, busy indicators, progress bars, optimistic UI, page transitions |
| `superpowers-ruby:hwc-realtime-streaming` | When implementing push-based Hotwire: Turbo Streams over WebSocket/SSE, custom stream actions, live list updates, cross-tab sync |
| `superpowers-ruby:hwc-media-content` | When building media-heavy features: image/video/audio uploads, previews, playback controls, progress tracking, third-party media libs |

### Security

| Name | When to Use |
|------|-------------|
| `superpowers-ruby:brakeman` | When running Rails security audits, analyzing code for SQL injection/XSS/command injection, or setting up CI/CD security scanning |

### Code Review & Quality

| Name | When to Use |
|------|-------------|
| `superpowers-ruby:requesting-code-review` | When submitting code for review |
| `superpowers-ruby:receiving-code-review` | When processing incoming code review feedback |

### Meta

| Name | When to Use |
|------|-------------|
| `superpowers-ruby:writing-skills` | When authoring a new skill or improving an existing one |
| `superpowers-ruby:compound` | When capturing a non-trivial solution for compound knowledge |
| `superpowers-ruby:compound-refresh` | When docs/solutions/ learnings may be stale — after refactors, migrations, or dependency upgrades |
