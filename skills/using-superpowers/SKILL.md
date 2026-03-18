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

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

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

    "User message received" -> "About to EnterPlanMode?" [label="check first"];
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

## Skill Dependency Map

```dot
digraph skill_dependencies {
    rankdir=LR;
    node [shape=box];

    // Entry points
    brainstorming [style=filled, fillcolor="#ccffcc", label="superpowers:brainstorming"];
    debugging [style=filled, fillcolor="#ccffcc", label="superpowers:systematic-debugging"];
    writing_skills [style=filled, fillcolor="#ccffcc", label="superpowers:writing-skills"];

    // Creative pipeline
    worktree [label="superpowers:using-git-worktrees"];
    writing_plans [label="superpowers:writing-plans"];
    sdd [label="superpowers:subagent-driven-development"];
    executing_plans [label="superpowers:executing-plans"];

    // Implementation
    tdd [label="superpowers:test-driven-development"];

    // Debugging path
    dispatching [label="superpowers:dispatching-parallel-agents"];

    // Code review chain
    requesting [label="superpowers:requesting-code-review"];
    receiving [label="superpowers:receiving-code-review"];
    verification [label="superpowers:verification-before-completion"];
    finishing [label="superpowers:finishing-a-development-branch"];

    // Creative pipeline edges
    brainstorming -> worktree;
    worktree -> writing_plans;
    writing_plans -> sdd;
    writing_plans -> executing_plans;

    // Implementation edges
    sdd -> tdd;
    executing_plans -> tdd;

    // Debugging path edges
    debugging -> dispatching;
    dispatching -> tdd;

    // Code review chain edges
    finishing -> requesting;
    requesting -> receiving;
    receiving -> verification;
    verification -> finishing;

    // Writing-skills dependencies
    writing_skills -> brainstorming [style=dashed, label="references"];
    writing_skills -> tdd [style=dashed, label="references"];
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

## Rule Priority

When skills conflict, follow this hierarchy:

1. **Verification** (non-negotiable) — always verify before claiming completion
2. **TDD** — write tests first for any production code
3. **Debugging** — follow systematic process before proposing fixes
4. **All other skills** — apply in context order

Verification is never skipped, even when user instructions override TDD or debugging workflows.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

## Integration

**This skill is the entry point for all others.** It determines which skills to invoke and in what order.

**Key downstream skills:**
- **superpowers:brainstorming** — for any creative or feature work
- **superpowers:systematic-debugging** — for any bug or unexpected behavior
- **superpowers:verification-before-completion** — before any completion claim
- **superpowers:test-driven-development** — before writing production code
