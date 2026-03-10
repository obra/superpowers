---
name: superpowers-bootstrap
description: Use at the start of every conversation and before every response - scans available skills and workflows to automatically apply relevant ones based on the user's request
---

# Superpowers Bootstrap

## Overview
This skill ensures that the right workflows and skills are automatically applied based on context. You don't need to wait for the user to invoke a slash command — if a skill applies, use it.

**Core principle:** If there is even a 1% chance a skill might apply, you MUST invoke it.

## How It Works

At the start of every conversation and before responding to any request, scan the available skills for relevance:

### Skill Trigger Map

| If the user is... | Auto-load this skill |
|---|---|
| Reporting a bug, error, or unexpected behavior | `systematic-debugging` |
| Starting a new feature or project | `brainstorming` |
| Asking to implement something with a plan | `executing-plans` |
| Writing or discussing tests | `test-driven-development` |
| Asking to create an implementation plan | `writing-plans` |
| About to claim work is complete | `verification-before-completion` |
| Preparing code for review or merge | `requesting-code-review` |
| Responding to code review feedback | `receiving-code-review` |
| Starting work that should be isolated | `using-git-worktrees` |
| Finishing a feature branch | `finishing-a-development-branch` |
| Executing a multi-task plan | `subagent-development` |
| Creating a new workflow or skill | `writing-workflows` |

### Discovery Process

1. **Read the user's request**
2. **Check the trigger map** above
3. **If a match is found:** Load the skill's `SKILL.md` and follow its instructions
4. **If multiple match:** Load the most specific one first (e.g., `systematic-debugging` over `brainstorming` when user reports a bug)
5. **If none match:** Proceed normally

### Where Skills Live

Skills are discoverable in two locations (check both):
- **`.agents/skills/<name>/SKILL.md`** — Native skill format (auto-discovered)
- **`.agents/workflows/<name>.md`** — Workflow format (invokable via `/name`)

Both contain the same instructions. The skill format is the primary discovery path; workflows are the user's manual override.

## Rules

1. **IF A SKILL APPLIES, YOU MUST USE IT.** This is not optional.
2. **User slash commands take priority** — if the user types `/workflow-name`, follow that workflow regardless of what you think applies.
3. **User instructions take priority over skills** — if the user says "skip TDD," skip it.
4. **Announce when using a skill** — say "I'm using the [skill-name] workflow" so the user knows what's happening.
5. **Don't stack skills unnecessarily** — if one skill references another (e.g., "use `/verification-before-completion`"), load it only when you reach that step.

## Priority Order

1. **User's explicit instructions** — highest priority
2. **User's slash commands** — manual workflow invocation
3. **Auto-discovered skills** — this bootstrap's trigger map
4. **Default behavior** — lowest priority
