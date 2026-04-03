# Codex Skill Best Practices

## Core Rules

- Keep each skill focused on one job
- Write the description around trigger conditions, not workflow summaries
- Prefer Codex-native terminology
- Use supporting reference files only when they improve clarity or reduce context load

## Discovery

- `name` should be concrete and searchable
- `description` should describe when to use the skill
- Avoid vague descriptions that summarize the workflow but hide the trigger

## Context

- Assume Codex reads `AGENTS.md` and skill metadata before loading the full skill
- Keep frequently-loaded skills short and explicit
- Move heavy reference material into separate files
