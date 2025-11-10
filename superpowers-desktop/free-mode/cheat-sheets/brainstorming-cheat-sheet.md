# Brainstorming Cheat Sheet

## Purpose
Turn rough ideas into fully-formed designs through collaborative questioning.

## The Process

```
Understand      → Explore        → Present        → Document
Ask questions     2-3 approaches   200-300 words    Design doc
```

## 1. Understanding

- **Check context** - Files, docs, recent commits
- **Ask questions** - ONE at a time
- **Prefer multiple choice** - Easier to answer
- **Focus on** - Purpose, constraints, success criteria

## 2. Exploring

- **Propose 2-3 approaches** - With trade-offs
- **Lead with recommendation** - And explain why
- **YAGNI ruthlessly** - Remove unnecessary features

## 3. Presenting

- **Break into sections** - 200-300 words each
- **Validate incrementally** - "Does this look right so far?"
- **Cover all aspects** - Architecture, components, data flow, errors, testing
- **Be flexible** - Go back and clarify if needed

## 4. Documenting

- **Write design** - `docs/plans/YYYY-MM-DD-<topic>-design.md`
- **Commit to git**
- **If continuing** - Create implementation plan

## Key Principles

✅ **One question at a time** - Don't overwhelm
✅ **YAGNI ruthlessly** - Simplicity first
✅ **Explore alternatives** - 2-3 before settling
✅ **Incremental validation** - Check after each section
✅ **Be flexible** - Clarify when needed

## Good Questions

**Multiple choice:**
> "Should we store this in memory or database?
> Memory is faster but doesn't persist.
> Database persists but adds latency."

**Open-ended:**
> "What's the most important constraint for this feature?"

**One at a time:**
> ❌ "How should we handle auth, data validation, and errors?"
> ✅ "How should we handle authentication?"

## Design Section Example

**Section 1: Architecture** (250 words)
```markdown
## Architecture

We'll use a three-tier architecture:

**API Layer**: Express.js REST endpoints handle HTTP requests.
Validates input, calls service layer, returns responses.

**Service Layer**: Business logic and orchestration.
Coordinates between repositories, enforces business rules.

**Data Layer**: PostgreSQL with Prisma ORM.
Handles persistence and queries.

**Why this approach**: Separates concerns, testable layers,
familiar stack. Alternative considered: GraphQL + MongoDB,
but REST + PostgreSQL better matches team expertise.

Does this architecture look right so far?
```

## Remember

> "Design first, implement second.
> Never skip brainstorming to 'save time.'"

## Use Before

- Writing code for new features
- Major refactoring
- Architectural decisions
- Complex implementations

## Don't Use For

- Clear mechanical changes
- Bug fixes (use debugging instead)
- Trivial updates
