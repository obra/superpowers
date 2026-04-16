# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/spectral.plan` or `spectral:writing-plans` skill.

## Summary

[Summary of the feature and technical approach]

## Technical Context

**Language/Version**: [e.g., Python 3.11, TypeScript 5.0, etc.]  
**Primary Dependencies**: [List key dependencies]  
**Storage**: [e.g., PostgreSQL, Redis, Files, or N/A]  
**Testing**: [e.g., pytest, jest, vitest]  
**Target Platform**: [e.g., Web, Mobile, CLI]

## Constitution Check

*GATE: Must pass before research. Re-check after design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # Implementation plan
├── research.md          # Research findings
├── data-model.md        # Data models
└── tasks.md             # Task breakdown
```

### Source Code

```text
src/
├── models/
├── services/
└── api/

tests/
├── integration/
└── unit/
```

## Complexity Tracking

| Violation | Why Needed | Alternative Rejected |
|-----------|------------|---------------------|
| [Example] | [Reason]   | [Why rejected]      |
