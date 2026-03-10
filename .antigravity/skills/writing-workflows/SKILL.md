---
name: writing-workflows
description: Use when creating new workflows, skills, or reusable process documentation - follows TDD-based approach to ensure workflows solve real problems
---

# Writing Workflows

> **This skill mirrors the `/writing-workflows` workflow.**

## Overview
Writing workflows is TDD applied to process documentation.

**Core principle:** If you didn't see the problem the workflow solves, you don't know if it teaches the right thing.

## Workflow File Format
```markdown
---
description: Use when [triggering conditions]
---
# Workflow Name
## Overview / ## When to Use / ## The Process / ## Quick Reference / ## Common Mistakes
```

## Checklist
- [ ] YAML frontmatter with `description` starting with "Use when..."
- [ ] Clear overview with core principle
- [ ] When-to-use criteria
- [ ] Step-by-step process
- [ ] Quick reference table
- [ ] Common mistakes section
- [ ] Cross-references to related workflows
- [ ] No narrative storytelling

## When to Create
**Create:** Technique wasn't obvious, broadly applicable, reusable across projects.
**Don't create:** One-off solutions, standard practices, project-specific conventions.
