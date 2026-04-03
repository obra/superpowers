---
name: using-superpowers
description: Use when starting any conversation in this repository to enforce Codex-native skill usage before any response or action
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If there is even a small chance a skill applies, you must use it.
</EXTREMELY-IMPORTANT>

## Instruction Priority

1. User instructions
2. Repository `AGENTS.md`
3. Relevant Superpowers skills
4. Default Codex behavior

## Codex-Native Rule

Do not translate from another platform's tool model.

Use Codex-native mechanisms directly:

- native skill discovery and explicit skill mention
- `update_plan` for checklist tracking
- `spawn_agent` for delegated work
- native file and shell tools for editing and verification

## Required Behavior

- Check for relevant skills before responding or acting.
- Use process skills first when they determine how the task should be approached.
- Follow the chosen skill exactly unless user instructions override it.
- Treat "this seems simple" as a red flag, not an exception.

## Skill Priority

1. Process skills such as brainstorming and debugging
2. Execution and workflow skills such as writing-plans or subagent-driven-development
3. Domain-specific or support skills

## Checklist Tracking

If a skill has a checklist, create one `update_plan` item per checklist item before proceeding.

## Reference

If you need extra repository-specific Codex guidance, read `references/codex-conventions.md`.
