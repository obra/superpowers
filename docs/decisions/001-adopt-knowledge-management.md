# [DECISION-001] Adopt Knowledge Management Patterns

**Status**: Active
**Date**: 2025-11-03

## Context

Working solo and in teams, we need to track architectural decisions and non-obvious problem solutions. The `mem` system works well for personal knowledge but doesn't provide:

- Team visibility (others can't see decisions/discoveries)
- Git history (no tracking of when/why decisions changed)
- Discoverability (team members don't know what's been solved)

## Decision

Adopt opt-in knowledge management patterns:

- Architecture Decision Records (ADRs) in `docs/decisions/`
- DISCOVERIES pattern in `docs/discoveries/DISCOVERIES.md`

These complement `mem` (personal) with project-level (team) documentation.

## Rationale

- **Opt-in**: Only enable in projects where valuable, no forcing on teams
- **Complements mem**: Use mem for solo work, files for team sharing
- **Git-tracked**: Decisions and discoveries preserved in version control
- **Discoverable**: Team members can browse `docs/` to learn project context

Follows patterns from Microsoft Amplifier project, adapted for our needs.

## Alternatives Considered

- **Just use mem**: Rejected - doesn't share with team, not in git
- **Force in all projects**: Rejected - violates autonomy, creates empty dirs everywhere
- **Separate skill**: Rejected - better to integrate into existing workflows

## Consequences

**Positive:**

- ✅ Project-level knowledge preserved
- ✅ Team members can discover decisions/solutions
- ✅ Git history tracks evolution of thinking
- ✅ Skills automatically use when present

**Negative/Risks:**

- ⚠️ Another system to maintain (but opt-in mitigates)
- ⚠️ Need discipline to document (but skills prompt)
- ⚠️ Template versioning (embedded in slash command)

## Review Triggers

- [ ] If team adoption is low after 3 months
- [ ] If maintenance burden becomes significant
- [ ] If mem system evolves to cover team use cases
