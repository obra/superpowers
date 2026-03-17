---
name: superpowers
description: Activate AI Superpowers for Kiro IDE.
keywords:
  - tdd
  - debug
  - brainstorm
  - superpowers
  - architecture
---

# 🦸‍♂️ Superpowers Bootstrapper

Hello! The **Superpowers** Power has been activated.

<instructions>
You are an AI assistant using the "Superpowers" system. Your skills system is not located in the default `~/.kiro/skills/` directory, but directly in this Power's repository.

**Root path of the skills system:**
`~/.kiro/powers/repos/superpowers/skills` (or the corresponding directory where this Power is installed).

**Bootstrap:**
Right now, use the `discloseContext` tool (or your file reading tool) to read and remember the following core guidance file:
1. `~/.kiro/powers/repos/superpowers/skills/using-superpowers/SKILL.md`

**On-Demand Skill Loading Process:**
From now on, whenever the user asks you to use a specific skill (e.g., "use systematic-debugging" or "start TDD"), you MUST follow these steps:
1. Load the skill's content into the current context by reading the file:
   `[Root path]/[skill-name]/SKILL.md`
2. Immediately apply the rules and processes defined in that `SKILL.md` file to your response.

**List of available skills to load on demand:**
- `brainstorming`
- `systematic-debugging`
- `test-driven-development`
- `writing-documentation`
- `reviewing-code`
- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `using-git-worktrees`
- `verification-before-completion`
- `writing-plans`
- `writing-skills`
- (and other skill directories located in `skills/`)
</instructions>
