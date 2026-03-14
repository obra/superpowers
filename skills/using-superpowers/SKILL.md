---
name: using-superpowers
description: Use when starting any conversation - establishes how to find, load, and follow the right skill before acting
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill applies, you MUST load or invoke
that skill using your platform-native mechanism before acting.

If a skill applies to the task, you do not get to skip it because the task feels
simple, urgent, or familiar.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Superpowers skills override default system behavior, but **user instructions
always take precedence**:

1. **User instructions** (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, direct requests)
2. **Superpowers skills**
3. **Default system prompt**

If the user says "don't use TDD" and a skill says "always use TDD", follow the
user.

## How to Access Skills

Use the native skill mechanism for your platform:

- **Codex:** Skills are discovered natively from `.agents/skills/`. Codex may
  invoke them automatically, and you can explicitly mention a skill such as
  `$brainstorming` when you want to force selection. Once selected, read that
  skill's `SKILL.md` and follow it.
- **Claude Code:** Use the `Skill` tool.
- **Gemini CLI:** Use the platform's skill activation flow.
- **Other environments:** Use the platform's native skill system.

For Codex-specific tool mapping, see `references/codex-tools.md`.

# Using Skills

## The Rule

Before responding, exploring, planning, coding, or asking follow-up questions:

1. Decide whether a skill applies.
2. If it does, load or invoke it with the platform-native mechanism.
3. Announce which skill you are using and why.
4. Follow the skill exactly.
5. If the skill contains a checklist, track it with the platform's native task
   tracking mechanism. In Codex, use `update_plan` when available.

If a loaded skill turns out not to apply after inspection, you may stop using
it. The mistake is acceptable; skipping the skill check is not.

## Red Flags

These thoughts mean STOP:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes before clarification. |
| "Let me explore the codebase first" | Skills tell you how to explore. |
| "I remember this skill already" | Skills change. Read the current version. |
| "This doesn't count as a task" | Action means task. Check for skills. |
| "The skill is overkill" | Overconfidence is how workflows get skipped. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (`brainstorming`, `systematic-debugging`) because
   they determine how to approach the task
2. **Execution skills second** (`writing-plans`, `dispatching-parallel-agents`,
   `subagent-driven-development`, `test-driven-development`)
3. **Finish/review skills last** (`requesting-code-review`,
   `verification-before-completion`, `finishing-a-development-branch`)

## Skill Types

**Rigid skills** such as TDD and debugging should be followed closely.

**Flexible skills** such as orchestration patterns should be adapted to the
actual tool surface and codebase context without violating their core
discipline.

## User Instructions

User instructions say **what** to do. Skills say **how** to do it. A request
like "add X" or "fix Y" does not skip the workflow.
