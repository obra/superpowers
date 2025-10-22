---
name: Code and Project Cleanup
description: Safe cleanup of code (comments, debug statements) and project artifacts (temp files, logs, build artifacts) with safety checks
when_to_use: before commits, after development sessions, during refactoring, or when project feels cluttered
version: 1.0.0
---

# Code and Project Cleanup

I'll help clean up your codebase and project artifacts while preserving valuable work and maintaining safety.

## Core Principles

### Safety First
- **Git checkpoint**: Create a commit before any cleanup for easy rollback
- **Protected directories**: Never touch .claude, .git, node_modules, vendor, or core config files
- **Verification before action**: Show what will be removed and why, then get confirmation
- **Git status awareness**: Understand tracked vs untracked files to avoid breaking version control

### Value Preservation
- **Code documentation**: Keep comments that explain WHY, not WHAT
- **Active files**: Consider file age - recent files may be actively used
- **Important artifacts**: Some "temporary" files like .env or .cache are actually critical
- **Error information**: Debug logs might contain important troubleshooting data

### Systematic Approach
- **Strategic thinking**: Analyze before acting - what looks safe vs what needs inspection
- **Pattern recognition**: Group similar cleanup targets for efficient batch processing
- **Tool selection**: Use native tools (Glob, Grep, Read) for identification and verification
- **Incremental cleanup**: Process files systematically with todo list tracking

## Strategic Analysis Process

<think>
Before cleaning, carefully consider:

1. **Artifact Identification**
   - What patterns indicate temporary/debug files? (*.log, *.tmp, *~, build artifacts)
   - Which files might look temporary but are actually important? (.env, .cache)
   - Are there project-specific conventions for temp files?
   - What about generated files that should be kept?

2. **Comment Value Assessment**
   - Does the comment explain WHY something is done? (KEEP)
   - Does it just restate what the code does? (REMOVE)
   - Does it contain TODOs, FIXMEs, HACKs, or warnings? (KEEP)
   - Does it document complex business logic? (KEEP)
   - Does it state the obvious? (REMOVE)

3. **Safety Analysis**
   - Which deletions are definitely safe?
   - Which require more careful inspection?
   - Are there active processes using these files?
   - Could removing these break the development environment?

4. **Common Pitfalls**
   - .env files might look like artifacts but contain config
   - .cache directories might be needed for performance
   - Some .tmp files might be active session data
   - Debug logs might contain important error information
   - Comments explaining WHY are often mislabeled as obvious

5. **Cleanup Strategy**
   - Start with obvious artifacts (*.log, *.tmp, *~)
   - Check file age - older files are usually safer to remove
   - Verify with git status what's tracked vs untracked
   - Group similar files for batch decision making
</think>

## Code Cleanup Technique

### Comment Assessment

**Identify files with comments using:**
- **Glob** to find source files
- **Read** to examine comment patterns
- **Grep** to locate specific comment types

**Comments to Remove (WHAT comments):**
- Simply restate what the code does
- Add no value beyond the code itself
- State the obvious (like "constructor" above a constructor)
- Explain syntax that's self-evident to any developer

**Comments to Preserve (WHY comments):**
- Explain WHY something is done (business logic, design decisions)
- Document complex business logic or non-obvious algorithms
- Contain TODOs, FIXMEs, or HACKs that track technical debt
- Warn about non-obvious behavior or edge cases
- Provide important context that code alone cannot convey
- Reference bug tickets or external documentation

### Debug Statement Removal

**Look for:**
- Console.log, print(), System.out.println() statements
- Commented-out code blocks from debugging sessions
- Temporary timing or profiling code
- Hard-coded test values left in production code

**Preserve:**
- Logging statements that serve production monitoring
- Error handling and exception logging
- Audit trail or compliance-related logging

## Project Cleanup Technique

### Artifact Identification Patterns

**Common temporary file patterns:**
- `*.log` - Log files
- `*.tmp` - Temporary files
- `*~` - Backup files
- `*.swp`, `*.swo` - Vim swap files
- `.DS_Store` - macOS metadata
- `Thumbs.db` - Windows thumbnails

**Build artifact patterns:**
- `dist/`, `build/`, `target/` - Build output directories
- `*.o`, `*.pyc`, `*.class` - Compiled object files
- `__pycache__/` - Python bytecode cache

**Development artifact patterns:**
- Failed implementation attempts (abandoned branches)
- Development-only test files
- Unused scaffolding or boilerplate
- Old migration scripts already applied

### Protected Directories

**Never clean:**
- `.claude/` - Claude commands and configurations
- `.git/` - Version control data
- `node_modules/`, `vendor/` - Dependency directories (regenerable but not artifacts)
- `.env`, `.env.*` - Environment configuration
- `package.json`, `requirements.txt`, `go.mod` - Dependency manifests

### Safe Deletion Process

1. **Create git checkpoint for safety:**
   ```bash
   git add -A
   git commit -m "Pre-cleanup checkpoint" || echo "No changes to commit"
   ```

2. **Identify cleanup targets using native tools:**
   - Glob tool to find temporary and debug files
   - Grep tool to detect debug statements in code
   - Read tool to verify file contents before removal

3. **Check file age:**
   - Files older than 7 days are usually safer to remove
   - Recently modified files might be actively used
   - Compare timestamps with recent commits

4. **Verify with git status:**
   - Understand what's tracked vs untracked
   - Untracked artifacts are safer to remove
   - Tracked files might be intentionally committed

5. **Group similar files for batch decisions:**
   - All *.log files together
   - All build artifacts together
   - Review each group as a unit

6. **Show what will be removed and why:**
   - List files with their patterns
   - Explain why each pattern is safe to remove
   - Get confirmation before deletion

7. **Create todo list for systematic processing:**
   - One task per file type/pattern
   - Mark completed as you go
   - Track any skipped items with reasons

8. **Verify project integrity after cleanup:**
   - Run tests if available
   - Check that build still works
   - Verify application still runs

## Review Process

### For Code Cleanup

For each file with obvious comments or debug statements:
1. Show the redundant comments/statements found
2. Explain why they should be removed
3. Show the cleaner version
4. Apply changes after confirmation

### For Project Cleanup

For each set of artifacts identified:
1. List files matching the pattern
2. Explain why the pattern is safe to remove
3. Show file ages and git status
4. Delete after confirmation

## Red Flags and Common Pitfalls

### When to Stop and Ask

**Red flags that require user consultation:**
- File pattern you don't recognize from the project type
- Configuration files that might be essential
- Large directories that could impact disk space significantly
- Files modified very recently (within last 24 hours)
- Anything in a protected directory
- Files referenced in documentation or README

### Common Pitfalls to Avoid

**Don't assume:**
- `.cache` is always safe to delete (might be needed for performance)
- All `.tmp` files are temporary (some might be session data)
- Commented code is always obsolete (might be legitimate examples)
- All console.log statements are debug code (might be intentional logging)

**Do verify:**
- File contents before deletion (use Read tool)
- Git tracking status (tracked files are more likely important)
- File age (recent = more caution)
- Dependencies in build scripts or configs

**Always protect:**
- Version control metadata (.git)
- Dependency directories (regenerable but not artifacts)
- Configuration files (.env, config.json, etc.)
- Claude-specific files (.claude directory)

## Restoration Plan

If cleanup causes issues, restoration is straightforward:
```bash
git reset --hard HEAD~1  # Restore from checkpoint
```

This ensures every cleanup is reversible and maintains project safety.

## Expected Outcome

After cleanup, the project should have:
- Only comments that explain WHY, not WHAT
- No debug statements or temporary logging
- No temporary files or build artifacts
- Clean working directory
- All essential files intact and functional
- Full git history for rollback if needed

This creates a cleaner, more maintainable codebase while ensuring complete safety through git checkpoints and careful verification.
