# GitHub Copilot Skill Authoring Notes

This file summarizes the GitHub Copilot guidance that matters most when writing FeatureForge skills for local installs.

## Official References

- Skills: `https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills`
- Custom agents: `https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents`
- Custom instructions: `https://docs.github.com/en/copilot/reference/customization-cheat-sheet`

## What Matters in Practice

### 1. Skills and agents are installed locally

For local installs:
- skills live in `~/.copilot/skills/`
- custom agents live in `~/.copilot/agents/`

FeatureForge should keep `skills/` and `agents/` canonical in the repo and install them into those discovery locations.

### 2. Repo instructions still matter

Copilot composes repository instructions from `AGENTS.md`, `.github/copilot-instructions.md`, and `.github/instructions/*.instructions.md`. Keep workflow rules in the canonical repo instructions, not duplicated skill copies.

### 3. Keep descriptions trigger-only

Like Codex, Copilot relies on concise trigger descriptions to decide when to use a skill. `description` should say when to use the skill, not summarize its workflow.

### 4. Keep skills concise and reference-driven

Put the workflow in `SKILL.md`, move heavy reference material to supporting files, and link to those files directly from `SKILL.md`.

### 5. Preserve behavior across platforms

When adapting a skill for multiple platforms:
- change discovery paths and install locations
- change platform-specific tool names
- keep the workflow, ordering, and output contracts the same

Do not redesign the skill just because the platform names changed.
