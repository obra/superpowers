---
name: using-superpowers
description: Use when a user asks to implement, debug, review, plan, research, automate, or modify files and a specialized skill may apply
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
Invoke a skill when the user request clearly matches a skill description or explicitly names a skill.

If no skill clearly applies, respond normally.

When a skill does clearly apply, use it before taking task actions.
</EXTREMELY-IMPORTANT>

## The Rule

Use skills for concrete work where their descriptions match the request: implementation, debugging, reviews, planning, research, automation, file edits, publishing, or domain-specific workflows.

For lightweight conversation, greetings, simple explanations, or requests that do not clearly map to a skill, answer directly.

Before entering plan mode, if the user request calls for design or planning and you have not already brainstormed, invoke the brainstorming skill first.

When you invoke a skill, keep any user-facing note brief and useful. Follow the skill exactly. If it has a checklist, create a todo per item.

## Skill Priority

When multiple skills clearly apply, process skills come first because they set the approach, then implementation skills carry it out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.

- "Let's build X" -> superpowers:brainstorming first, then implementation skills.
- "Fix this bug" -> superpowers:systematic-debugging first, then domain skills.

## Common Mistakes

Avoid both failure modes:

| Mistake | Correct behavior |
|---------|------------------|
| Treating every conversation as a skill trigger | Use skills only for clear matches or explicit skill requests. |
| Skipping a clearly matching skill because the task seems quick | Invoke the matching skill before task actions. |
| Relying on memory of a skill | Read the current skill instructions when using it. |
| Announcing noisy process details | Keep skill-use notes brief and helpful. |

## Platform Adaptation

If your harness appears here, read its reference file for special instructions:

- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Antigravity: `references/antigravity-tools.md`

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.
