---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

If you think there is even a 1% chance a skill might apply, you MUST invoke it before responding. This is not optional.

## Instruction Priority

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In Copilot CLI:** Use the `skill` tool. Skills are auto-discovered from installed plugins.

**In Gemini CLI:** Skills activate via the `activate_skill` tool.

**In other environments:** Check your platform's documentation for how skills are loaded.

Skills use Claude Code tool names. Non-CC platforms: see `references/copilot-tools.md` (Copilot CLI), `references/codex-tools.md` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means you should invoke it. If the invoked skill turns out wrong for the situation, you don't need to follow it.

**Priority:** Process skills first (brainstorming, debugging), then implementation skills (frontend-design, mcp-builder).

**Skill types:** Rigid (TDD, debugging) — follow exactly. Flexible (patterns) — adapt to context. The skill itself tells you which.

## Anti-Rationalization

Do not skip skills because the task "seems simple", you "need context first", you "want to explore first", the "skill is overkill", or you "remember" what it says. These are all rationalizations. Check for skills before acting. Skills evolve — read the current version.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
