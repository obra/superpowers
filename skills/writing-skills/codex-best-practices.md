# Codex Skill Best Practices

## Core Rules

- Keep each skill focused on one job
- Write the description around a high-level job plus trigger conditions, not workflow summaries
- Prefer Codex-native terminology
- Use supporting reference files only when they improve clarity or reduce context load

## Discovery

- `name` should be concrete and searchable
- `description` should say what the skill does and when to use it
- Avoid vague descriptions that summarize the workflow but hide the trigger or the job

## Context

- Assume Codex reads `AGENTS.md` and skill metadata before loading the full skill
- Keep frequently-loaded skills short and explicit
- Move heavy reference material into separate files
