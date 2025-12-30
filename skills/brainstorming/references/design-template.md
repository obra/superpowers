# Design Document Template

Use this structure for design documents written to `docs/plans/`.

## Filename Format

```
docs/plans/YYYY-MM-DD-<topic>-design.md
```

Example: `docs/plans/2025-01-15-user-authentication-design.md`

---

## Template

```markdown
# [Feature Name] Design

**Date:** YYYY-MM-DD
**Status:** Draft | Validated | Implemented
**Author:** [Name or "AI-assisted"]

## Summary

[2-3 sentences describing what this design accomplishes]

## Problem Statement

[What problem does this solve? Why is it needed?]

## Requirements

### Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Non-Functional Requirements
- [ ] Performance: [specific metric]
- [ ] Security: [considerations]

## Proposed Solution

### Architecture Overview

[High-level description of the approach]

### Components

| Component | Responsibility |
|-----------|---------------|
| ComponentA | Description |
| ComponentB | Description |

### Data Flow

[Describe how data moves through the system]

### Error Handling

[How errors are detected, reported, and recovered]

## Alternatives Considered

### Option A: [Name]
- **Pros:** ...
- **Cons:** ...

### Option B: [Name]
- **Pros:** ...
- **Cons:** ...

**Decision:** Selected [Option] because [reasoning]

## Testing Strategy

- Unit tests: [what to test]
- Integration tests: [what to test]
- Edge cases: [list]

## Implementation Plan

1. Step 1
2. Step 2
3. Step 3

## Open Questions

- [ ] Question 1
- [ ] Question 2
```

---

## Tips

- Keep each section focused and concise
- Use diagrams when architecture is complex
- Link to relevant code files or documentation
- Update status as design progresses through validation
