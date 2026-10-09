---
name: using-toolbelt
description: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

## The Rule

Invoke a relevant or requested skill before any response or action, including clarifying questions and exploring the codebase; the skill sets the approach. If it does not fit, drop it. When orchestrating, that skill's read list decides which skills you open.

Before entering plan mode, brainstorm first if you have not.

Announce "Using [skill] to [purpose]". If it has a checklist, create a todo per item.

## Skill Priority

When several skills apply, process skills come first and set the approach; implementation skills then carry it out.

- "Let's build X" → toolbelt:brainstorming, then implementation skills.
- "Fix this bug" → toolbelt:systematic-debugging, then domain skills.

A question, a file check, or a small task is still a task; check for a skill first.

## Platform Adaptation

In Codex, read `references/codex-tools.md`.

## Agent Routing

Before your first dispatch, invoke the agent-routing skill. Route by logical role from the AGENT-ROUTING text injected at session start, or the skill's bundled default when none was; never pick a concrete agent yourself.

## User Instructions

CLAUDE.md, AGENTS.md, and your human partner's direct requests take precedence over skills, which in turn override default behavior. Skip a skill workflow only when your human partner has explicitly told you to.
