# Context Synthesis Prompt Template

Use this template when synthesizing subagent findings after each phase.

## Using Clarification Context

Before each synthesis phase, read `docs/handoffs/context-clarification.md` if it exists. Use it to:
- Focus exploration on areas identified during clarification
- Skip aspects that user explicitly said are out of scope
- Prioritize based on user's stated goals and constraints

```
# Phase Synthesis (Orchestrator performs inline, not a subagent)

After all subagents in a phase complete:

## For Codebase Phase

Read all `docs/handoffs/context-codebase-*.md` files.

Write synthesis to `docs/handoffs/context-codebase-summary.md`:

```markdown
# Codebase Context Summary

## Architecture Overview
[Synthesized view of relevant architecture]

## Key Files
| File | Purpose | Relevance |
|------|---------|-----------|
| path | what it does | why it matters |

## Patterns to Follow
1. [Pattern from codebase with example location]
2. [Pattern from codebase with example location]

## Test Strategy
[How similar features are tested]

## Dependencies
[Key libraries and internal modules]

## Implementation Considerations
[Synthesized recommendations]
```

## For Documentation Phase

Read all `docs/handoffs/context-docs-*.md` files.

Write synthesis to `docs/handoffs/context-docs-summary.md`:

```markdown
# Documentation Context Summary

## API Quick Reference

| Function/Method | Signature | Notes |
|-----------------|-----------|-------|
| name | params -> return | key detail |

## Configuration Needed
[Relevant config from all docs]

## Official Recommendations
[Best practices from official docs]

## Gotchas
[Warnings aggregated from all sources]
```

## For Best Practices Phase

Read all `docs/handoffs/context-web-*.md` files.

Write synthesis to `docs/handoffs/context-web-summary.md`:

```markdown
# Best Practices Context Summary

## Current Industry Standards (2024-2025)
[Top practices with rationale]

## Recommended Implementation Approach
[Synthesized recommendation for our case]

## Anti-Patterns to Avoid
[Aggregated list with reasons]

## Reference Examples
| Example | Source | Key Takeaway |
|---------|--------|--------------|
| what | URL | lesson |
```
```

**These summaries feed into plan writing.**
