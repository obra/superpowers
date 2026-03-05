---
name: writing-skills
description: Use when creating or updating skills and validating that they trigger correctly and improve agent behavior.
---

# Writing Skills

Build skills as reusable operational playbooks, not narrative documentation.

## Principles

- Keep `description` focused on trigger conditions only.
- Keep `SKILL.md` short; move details to references/scripts.
- Prefer deterministic tools/scripts for repeated operations.
- Validate behavior with real pressure tests.

## Standard Skill Layout

```text
skills/<skill-name>/
  SKILL.md
  references/      (optional)
  scripts/         (optional)
  assets/          (optional)
```

## Creation Workflow

1. Define concrete trigger examples.
2. List reusable resources (scripts, references, assets).
3. Create/update `SKILL.md` with concise steps and hard gates.
4. Add references/scripts only when needed.
5. Validate format and behavior.
6. Iterate from observed failures.

## Frontmatter Requirements

Use only:

```yaml
---
name: <lowercase-hyphen-name>
description: Use when <trigger conditions>
---
```

Rules:
- `name`: letters/numbers/hyphens only.
- `description`: third-person trigger text, no workflow summary.

## Token Budget Guidance

- Frequently loaded skills: keep very short.
- Remove repeated rhetoric and long examples from `SKILL.md`.
- Put long examples in references.
- Link references from `SKILL.md` only when relevant.

## Context Hygiene Guidance

- Avoid copying large conversation history into skills.
- In prompts/handoffs, include only current task constraints and evidence.
- Prefer structured outputs to reduce verbose retries.

## Validation Checklist

- Trigger text is specific and discoverable.
- Workflow steps are executable and ordered.
- Hard gates are explicit.
- References are one-level deep from `SKILL.md`.
- Scripts run successfully in representative scenarios.

## Required References

Read as needed:
- `anthropic-best-practices.md`
- `testing-skills-with-subagents.md`
- `persuasion-principles.md`

Use `render-graphs.js` and `graphviz-conventions.dot` only when a decision graph materially improves execution.
