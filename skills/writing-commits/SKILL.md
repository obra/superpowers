---
name: Writing Commits
description: Guidelines for creating clear, meaningful commits - covers when to commit, commit message structure, atomic commits, and co-authorship policy
---

# Writing Commits

## Overview

Good commits are the foundation of maintainable version history. Each commit should tell a story: what changed, why it changed, and how it contributes to the project's evolution.

**Core principles:** Atomic changes, clear messages, logical boundaries, appropriate attribution.

## When to Commit

Commit at logical checkpoints, not arbitrary intervals:

### Good Times to Commit

- **Feature completion**: A single feature works end-to-end
- **Test passes**: Tests for new functionality pass
- **Refactor complete**: Code structure improved without behavior change
- **Bug fixed**: Issue resolved and verified
- **Docs updated**: Documentation synchronized with code changes

### Avoid Committing

- **Mid-feature**: Incomplete functionality that doesn't work
- **Failing tests**: Broken code that others can't build on
- **Debugging state**: Console.logs, temporary prints, commented code
- **Mixed concerns**: Multiple unrelated changes in one commit

**Each commit should leave the codebase in a working state.**

## Commit Message Structure

Use conventional commit format for clarity and tooling compatibility:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

**Common types:**

- `feat`: New feature for users
- `fix`: Bug fix for users
- `refactor`: Code restructuring without behavior change
- `docs`: Documentation changes only
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `perf`: Performance improvements
- `style`: Code formatting, whitespace (not CSS/UI)

### Scope

Optional. Component, module, or area affected:

- `feat(auth): add OAuth2 support`
- `fix(api): handle null response in user endpoint`
- `docs(readme): update installation instructions`

### Subject

- **Imperative mood**: "add feature" not "added feature" or "adds feature"
- **No period at end**: It's a title, not a sentence
- **Max 50 characters**: Forces conciseness
- **Lowercase after type**: `feat: add` not `feat: Add`

### Body

Optional. Explains **why** and **context**, not what (code shows what):

```
refactor(database): extract connection pooling logic

The connection logic was duplicated across 3 modules, making
configuration changes error-prone. This extracts it to a single
module that all consumers import.

Reduces risk of connection leaks and simplifies future updates
to connection parameters.
```

### Footer

Optional. Reference issues, breaking changes, co-authorship:

```
Closes #123
Fixes #456

BREAKING CHANGE: API now requires authentication token
```

## Atomic Commits

Each commit should be **independently understandable** and (ideally) **independently functional**:

### What "Atomic" Means

- **One logical change**: Don't mix refactoring + new feature in one commit
- **Complete**: All related changes included (code + tests + docs)
- **Minimal**: Nothing unrelated included
- **Builds**: Code compiles/runs (tests may be incomplete during TDD)

### Good Atomic Commits

```bash
# ✅ Good: Three atomic commits
git commit -m "feat(auth): add User model and validation"
git commit -m "test(auth): add User model test coverage"
git commit -m "docs(auth): document User model fields"
```

### Poor Non-Atomic Commits

```bash
# ❌ Bad: Mixed concerns
git commit -m "Add User model, fix typo in README, update dependencies"

# ❌ Bad: Incomplete
git commit -m "Add User model" # (but forgot to commit the test file)

# ❌ Bad: Too granular
git commit -m "Add User class"
git commit -m "Add name field"
git commit -m "Add email field"
git commit -m "Add password field"
```

## Co-Authorship Policy

**Default: Skip co-authorship.** Clean git history without repetitive attribution is more valuable than credit on every commit.

### When to Skip Co-Authorship (Default)

**❌ Skip by default:**

- **Most work**: Features, fixes, refactoring, tests, docs
- **Routine commits**: Standard development workflow
- **Minor fixes**: Typos, formatting, simple corrections
- **Trivial updates**: Dependency bumps, config tweaks
- **Standard refactoring**: Renaming, file moves, basic cleanup
- **Documentation**: README updates, comment fixes
- **Test implementations**: Even comprehensive test suites

**Example (typical commit, no co-authorship):**

```
feat(cache): implement LRU cache with TTL support

Adds configurable LRU cache with time-to-live expiration.
Uses doubly-linked list for O(1) eviction and hash map for
O(1) lookups. Handles edge cases in concurrent access.
```

### When to Add Co-Authorship (Rare)

**✅ Only add when explicitly requested:**

- User says "add co-authorship" or "give yourself credit"
- User's project has specific attribution requirements
- Legal/compliance reasons for tracking AI contributions

**Never add co-authorship proactively.** If unsure, skip it.

## Common Mistakes

### Vague Messages

**❌ Bad:**

```
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"
```

**✅ Good:**

```
git commit -m "fix(auth): prevent null pointer in token validation"
git commit -m "refactor(api): extract duplicate error handling"
git commit -m "feat(ui): add loading spinner to submit button"
```

### Mixing Changes

**❌ Bad:**

```
git commit -m "Add login feature, fix navbar bug, update dependencies"
```

**✅ Good:**

```
git commit -m "feat(auth): add login form and validation"
git commit -m "fix(ui): correct navbar responsive breakpoint"
git commit -m "chore(deps): update React to 18.2.0"
```

### Too Much Detail

**❌ Bad:**

```
git commit -m "Changed line 42 in auth.js from if (x) to if (x && y)"
```

**✅ Good:**

```
git commit -m "fix(auth): add null check for user object"
```

## Integration

**Used in:**

- All development workflows
- **finishing-a-development-branch**: Before merge/PR
- **executing-plans**: After each task
- **subagent-driven-development**: Between tasks

**Related skills:**

- **verification-before-completion**: Ensures tests pass before committing
- **code-and-project-cleanup**: Cleans up before committing
- **finishing-a-development-branch**: Optional commit history cleanup

## Examples

### Feature Development

```bash
# 1. Tests first (TDD)
git add tests/auth/test_login.py
git commit -m "test(auth): add login validation tests"

# 2. Implementation
git add src/auth/login.py
git commit -m "feat(auth): implement login with JWT tokens

Adds secure login endpoint with bcrypt password hashing
and JWT token generation. Includes rate limiting and
account lockout after 5 failed attempts."

# 3. Documentation
git add docs/api/auth.md
git commit -m "docs(auth): document login endpoint"
```

### Bug Fix

```bash
git add src/api/users.py tests/api/test_users.py
git commit -m "fix(api): handle deleted users in team endpoint

Team members API was returning 500 when encountering
deleted user references. Now filters out deleted users
and logs warning.

Fixes #342"
```

### Refactoring

```bash
git add src/database/*.py
git commit -m "refactor(database): extract connection pool to module

Connection pooling logic was duplicated in 3 places.
Consolidates to single configurable module."
```

## Remember

- **When**: Logical checkpoints, working state
- **What**: Atomic, complete, minimal
- **How**: Clear type, concise subject, imperative mood
- **Why**: Body explains context and reasoning
- **Who**: Skip co-authorship by default, add only when explicitly requested
