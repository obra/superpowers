# Architecture Decision Records (ADRs)

This directory tracks significant architectural and design decisions for the project.

## When to Create an ADR

Create a decision record when:

- Making architectural choices (patterns, frameworks, approaches)
- Choosing between multiple valid approaches
- Making decisions that will be hard to reverse
- Establishing project conventions or standards
- Making trade-offs that future developers should understand

**Use `mem` for quick decision tracking in solo work.**

**Use ADRs when:**

- Decisions affect team members
- Complex decisions requiring full justification
- Decisions you want in git history
- Formal documentation is valuable

## ADR Template

Copy this template for new decisions:

```markdown
# [DECISION-NNN] Title

**Status**: Active | Deprecated | Superseded
**Date**: YYYY-MM-DD

## Context

Why was this decision needed? What problem are we solving?

## Decision

What did we decide to do?

## Rationale

Why this approach over alternatives?

## Alternatives Considered

What other options did we evaluate?

- **Option A**: Description and why rejected
- **Option B**: Description and why rejected

## Consequences

**Positive:**

- ✅ Benefit 1
- ✅ Benefit 2

**Negative/Risks:**

- ⚠️ Trade-off 1
- ⚠️ Trade-off 2

## Review Triggers

When should we reconsider this decision?

- [ ] Condition 1
- [ ] Condition 2
```

## Naming Convention

Files: `NNN-short-description.md` where NNN is zero-padded number (001, 002, etc.)

Examples:

- `001-use-typescript-for-frontend.md`
- `002-adopt-microservices-architecture.md`

## Updating Status

When revisiting decisions:

- **Deprecated**: No longer recommended, but still in use
- **Superseded**: Replaced by another decision (link to it)

## Tips

- Write ADRs when fresh - capture context while it's clear
- Include specific examples and code snippets
- Link to relevant issues, PRs, or documentation
- Update status when circumstances change
- One decision per ADR (don't bundle)
