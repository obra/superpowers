---
name: Code and Project Cleanup
description: Use before commits or when project feels cluttered - safely removes unnecessary comments, debug statements, temp files, and build artifacts with git checkpoints
---

# Code and Project Cleanup

## Overview

Systematically clean code and project artifacts while preserving valuable work. Remove unnecessary comments and debug statements, clean temporary files and build artifacts, all with git safety checkpoints for easy rollback.

## When to Use

- Before commits
- After development sessions
- During refactoring
- When project feels cluttered
- Before code reviews

## Core Safety Principles

**Always create git checkpoint first** for easy rollback:

```bash
git add -A && git commit -m "Pre-cleanup checkpoint" || echo "No changes to commit"
```

**Protected directories** (never touch):

- `.claude/`, `.git/` - Configuration and version control
- `node_modules/`, `vendor/` - Dependencies
- `.env`, `.env.*` - Environment configuration

**Verification before action**: Show what will be removed and why, then get confirmation

## Comment Cleanup

Use Glob to find source files, Read to examine patterns, Grep to locate specific types.

**Remove (WHAT comments):**

- Restate what code does
- State the obvious ("constructor" above a constructor)
- Add no value beyond code itself
- Explain self-evident syntax

**Preserve (WHY comments):**

- Explain WHY something is done (business logic, design decisions)
- Document complex algorithms or non-obvious behavior
- Contain TODOs, FIXMEs, HACKs tracking technical debt
- Reference bug tickets or external documentation
- Warn about edge cases or unusual requirements

**Example:**

```python
# ❌ Remove: "Initialize variable to store count"
count = 0

# ✅ Keep: "Start at 0 to exclude header row in CSV parsing"
count = 0
```

## Debug Statement Cleanup

**Remove:**

- Console.log, print(), System.out.println() for debugging
- Commented-out code blocks from debug sessions
- Temporary timing or profiling code
- Hard-coded test values in production code

**Preserve:**

- Production monitoring and logging
- Error handling and exception logging
- Audit trail or compliance logging

## Project Artifact Cleanup

### Common Temporary Patterns

Use Glob with these patterns:

- `*.log`, `*.tmp`, `*~` - Logs, temp files, backups
- `*.swp`, `*.swo` - Editor swap files
- `.DS_Store`, `Thumbs.db` - OS metadata

### Build Artifact Patterns

- `dist/`, `build/`, `target/` - Build output directories
- `*.o`, `*.pyc`, `*.class` - Compiled files
- `__pycache__/` - Python bytecode cache

### Deletion Process

1. Create git checkpoint, identify with Glob/Read, check file age (>7 days safer)
2. Verify git status (untracked safer), group similar files
3. Show removal plan with patterns and reasons, get confirmation
4. Create TodoWrite list, delete, verify integrity (tests/build)

## Red Flags and Pitfalls

**Stop and ask:**

- Unrecognized patterns, files modified <24h, large directories
- Files in README, protected directories, or potential config files

**Verify before removal:**

- `.cache` (performance), `.tmp` (session data), commented code (examples)
- File contents (Read), git status (tracked = important), file age, build dependencies

## Rollback

If cleanup causes issues:

```bash
git reset --hard HEAD~1  # Restore from checkpoint
```

Every cleanup is reversible through git checkpoint, maintaining project safety.
