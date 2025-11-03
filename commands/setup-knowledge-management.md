# Setup Knowledge Management

Set up ADR (Architecture Decision Records) and DISCOVERIES pattern for this project.

## Overview

This command creates an opt-in knowledge management structure:
- `docs/decisions/` for Architecture Decision Records
- `docs/discoveries/` for tracking non-obvious problems and solutions

These complement personal `mem` usage with project-level, git-tracked documentation.

## Pre-flight Checks

BEFORE creating anything, check:

1. Does `docs/decisions/` exist?
2. Does `docs/discoveries/` exist?
3. Does `docs/decisions/README.md` exist?
4. Does `docs/discoveries/DISCOVERIES.md` exist?

Commands:
```bash
ls -la docs/decisions/ 2>/dev/null
ls -la docs/discoveries/ 2>/dev/null
test -f docs/decisions/README.md && echo "README exists"
test -f docs/discoveries/DISCOVERIES.md && echo "DISCOVERIES exists"
```

## Decision Logic

### If ALL checks are clean (nothing exists):
Proceed with "Setup Steps" below.

### If ANY already exist:
**STOP immediately.**

Report what exists:
```bash
echo "Found existing structure:"
test -d docs/decisions && echo "  - docs/decisions/"
test -d docs/discoveries && echo "  - docs/discoveries/"
test -f docs/decisions/README.md && echo "  - docs/decisions/README.md"
test -f docs/discoveries/DISCOVERIES.md && echo "  - docs/discoveries/DISCOVERIES.md"
```

Present options to user:
1. **Skip setup** - Keep existing structure, don't modify
2. **Create only missing pieces** - Add what's missing, preserve what exists
3. **Show templates** - Display what would be created for manual review

Wait for user to choose before proceeding.

## Setup Steps

Only execute if pre-flight checks are clean.

### Step 1: Create directory structure

```bash
mkdir -p docs/decisions
mkdir -p docs/discoveries
```

### Step 2: Create docs/decisions/README.md

Create file with this exact content:

```markdown
# Architecture Decision Records (ADRs)

This directory tracks significant architectural and design decisions for the project.

## When to Create an ADR

Create a decision record when:
- Making architectural choices (patterns, frameworks, approaches)
- Choosing between multiple valid approaches
- Making decisions that will be hard to reverse
- Establishing project conventions or standards
- Making trade-offs that future developers should understand

**Use `mem` for quick decision tracking in solo work.**

**Use ADRs when:**
- Decisions affect team members
- Complex decisions requiring full justification
- Decisions you want in git history
- Formal documentation is valuable

## ADR Template

Copy this template for new decisions:

\`\`\`markdown
# [DECISION-NNN] Title

**Status**: Active | Deprecated | Superseded
**Date**: YYYY-MM-DD

## Context
Why was this decision needed? What problem are we solving?

## Decision
What did we decide to do?

## Rationale
Why this approach over alternatives?

## Alternatives Considered
What other options did we evaluate?
- **Option A**: Description and why rejected
- **Option B**: Description and why rejected

## Consequences

**Positive:**
- ✅ Benefit 1
- ✅ Benefit 2

**Negative/Risks:**
- ⚠️ Trade-off 1
- ⚠️ Trade-off 2

## Review Triggers
When should we reconsider this decision?
- [ ] Condition 1
- [ ] Condition 2
\`\`\`

## Naming Convention

Files: `NNN-short-description.md` where NNN is zero-padded number (001, 002, etc.)

Examples:
- `001-use-typescript-for-frontend.md`
- `002-adopt-microservices-architecture.md`

## Updating Status

When revisiting decisions:
- **Deprecated**: No longer recommended, but still in use
- **Superseded**: Replaced by another decision (link to it)

## Tips

- Write ADRs when fresh - capture context while it's clear
- Include specific examples and code snippets
- Link to relevant issues, PRs, or documentation
- Update status when circumstances change
- One decision per ADR (don't bundle)
```

### Step 3: Create docs/discoveries/DISCOVERIES.md

Create file with this exact content:

```markdown
# Discoveries

This document tracks non-obvious problems, their root causes, solutions, and prevention strategies. Check here before debugging similar issues.

**Use `mem` for personal discovery tracking in solo work.**

**Use this file when:**
- Project-specific issues that affect team members
- Problems you want in git history
- Issues requiring structured documentation
- Collective learning is valuable

## Template

Copy this template for new entries:

\`\`\`markdown
## Issue Title (YYYY-MM-DD)

### Issue
Clear description of the problem observed. Include symptoms and error messages.

### Root Cause
What actually caused it? Not just symptoms - trace to the source.

### Solution
How was it fixed? Specific steps, code changes, or configuration updates.

### Prevention
How to avoid this in the future? Patterns, checks, validation, or practices to adopt.
\`\`\`

---

## Discoveries

*No discoveries yet. This section will grow as we encounter and solve non-obvious problems.*

<!-- Add new discoveries below, newest first -->
```

### Step 4: Verify structure created

Run verification commands:

```bash
echo "Verifying structure..."
ls -la docs/decisions/
ls -la docs/discoveries/
echo ""
echo "Verifying file contents..."
wc -l docs/decisions/README.md
wc -l docs/discoveries/DISCOVERIES.md
```

Expected output:
- Both directories exist
- README.md has ~80+ lines
- DISCOVERIES.md has ~40+ lines

### Step 5: Optional - Create example ADR

Ask user: "Would you like to create an example ADR (001-adopt-knowledge-management.md) documenting this decision to adopt these patterns?"

If yes, create `docs/decisions/001-adopt-knowledge-management.md`:

```markdown
# [DECISION-001] Adopt Knowledge Management Patterns

**Status**: Active
**Date**: YYYY-MM-DD

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
```

### Step 6: Stage and commit

```bash
git add docs/
git commit -m "docs: add knowledge management structure (ADR + DISCOVERIES)"
```

## Completion

Structure created successfully. Skills will automatically detect and use these patterns when present.

**Next steps:**
- Document architectural decisions as they're made
- Add discoveries when solving non-obvious problems
- Share with team members
