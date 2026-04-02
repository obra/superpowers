---
name: using-pp-superpowers
description: Use when starting any conversation — establishes how to find and use Power Platform skills, requiring Skill tool invocation before ANY response including clarifying questions
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

pp-superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, direct requests) — highest priority
2. **pp-superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

## How to Access Skills

Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you — follow it directly. Never use the Read tool on skill files.

## Power Platform Skills

| Skill | When to invoke |
|-------|---------------|
| `solution-discovery` | Starting a new Power Platform project, gathering requirements, establishing project foundations, or updating an existing `.foundation/` |

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

## Skill Priority

When multiple skills could apply:

1. **Process skills first** (solution-discovery, brainstorming, debugging) — these determine HOW to approach the task
2. **Domain skills second** (application-design, schema-design) — these guide execution

## User Instructions

Instructions say WHAT, not HOW. "Build me an app" or "Set up my project" doesn't mean skip workflows.
