---
name: extract-boundary
description: >
  Extract boundary context for subagents. Maps direct dependencies,
  types, and contracts consumed by modified files. Use before dispatching
  subagents to provide minimal required context.
---

# Extract Boundary Context

Extract the minimal context a subagent needs to work on specific files.

## Required Start

Announce: `I'm using extract-boundary to gather context for the subagent.`

## Execution

1. Identify the files the subagent will modify.
2. For each file, find:
   - Direct imports (what it consumes)
   - Exported types/interfaces (what it provides)
   - Function signatures it calls from other modules
3. Compile a minimal context bundle containing only:
   - Type definitions and interfaces
   - Function signatures (no implementations)
   - Schema definitions

## Context Bundle Format

```
## Types consumed
- `User` (from src/types/user.ts): { id: string; name: string; email: string }
- `AuthService` (from src/services/auth.ts): interface with verifyToken(), refreshToken()

## Files to modify
- src/middleware/auth.ts
- tests/middleware/auth.test.ts
```

## Hard Rules

- Do NOT include full file contents - only signatures and types.
- Do NOT include implementation details from unrelated files.
- Keep context under 200 lines per subagent.
