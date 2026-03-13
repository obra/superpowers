---
name: error-recovery
description: >
  Maintains a project-specific known-issues.md mapping recurring errors
  to their solutions. Consulted automatically by systematic-debugging
  before investigation. Saves time by avoiding rediscovery of known
  problems across sessions. Triggers on: "save this fix", "remember
  this error", "known issues", or automatically when systematic-debugging
  resolves a recurring error.
---

# Error Recovery Intelligence

Maintain a project-level error→solution mapping to avoid rediscovering known problems.

## File Location

`known-issues.md` at the project root (same level as `package.json`, `Cargo.toml`, etc.).

## When to Consult

Before starting any debugging investigation:
1. Check if `known-issues.md` exists.
2. Search it for the error message, error code, or failing test name.
3. If a match is found, try the documented solution first before full investigation.

## When to Update

After resolving a bug that is likely to recur:
- Environment-dependent errors (missing services, port conflicts, env vars)
- Configuration errors (wrong versions, missing dependencies, build flags)
- Test failures caused by external state (database needs seeding, service needs starting)
- Platform-specific issues (Windows vs. Unix path handling, line endings)
- Errors that took significant investigation to diagnose

**Do NOT record:**
- One-off logic bugs (the fix is in the code; the commit message has the context)
- Errors already documented in the project's README or docs
- Transient network/API failures

## Entry Format

Each entry must be concise and actionable:

```markdown
## [Short description]

**Error:** `exact error message or pattern`
**Cause:** One sentence explaining why this happens.
**Fix:**
```bash
exact command or steps to resolve
```
**Context:** When this typically occurs (e.g., "after fresh clone", "on Windows", "when DB is not running").
```

## File Management

- Keep `known-issues.md` under 50 entries. If it grows beyond that, prune entries that haven't been relevant in months.
- Group entries by category (Environment, Dependencies, Tests, Build, Platform).
- When a known issue is permanently fixed (e.g., the root cause was removed from the codebase), delete the entry.

## Integration

- `systematic-debugging` consults this file in Phase 1 (Investigate) before generating hypotheses.
- `using-superpowers` reads this file during the entry sequence when it exists.
- After resolving a debugging session, offer to add the error→solution mapping if it meets the "When to Update" criteria.
