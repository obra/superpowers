---
name: github-project-management
description: Use when completing design docs, creating implementation plans, discovering bugs during unrelated work, or finishing branches - integrates GitHub issue tracking into development workflow with confirmation before creating issues
---

# GitHub Project Management

## Overview

Integrate GitHub issue tracking into natural development workflow. Offer to create issues at key checkpoints, always with user confirmation.

**Core principle:** Work should be tracked where it happens, not as a separate administrative task.

## Configuration

Each repo specifies its project in CLAUDE.md:

```markdown
## GitHub Project

github_project: owner/project-number
```

Examples: `github_project: obra/1` (user) or `github_project: my-org/5` (org)

If missing, ask: "No project configured. Create as repo-only issue, or specify a project?"

For cross-repo items, always ask which project to use.

## Integration Points

### 1. After Brainstorming

**Trigger:** Design doc committed to `docs/plans/`

**Action:** Ask "Create a tracking issue for this feature?"

If yes, propose:
```
Title: [Feature] <brief description>
Body: Summary + link to design doc + acceptance criteria
```

Wait for approval, then create and add to project.

### 2. After Writing Plans

**Trigger:** Implementation plan completed

**Action:** Ask "Create tracking issues for this plan?"

Options:
- A) Single parent issue linking to plan
- B) Individual issues per major task
- C) Skip

### 3. During Implementation (Bug/Debt Discovery)

**Trigger:** Discovered bug or tech debt unrelated to current task

**Decision tree:**
- Can fix in <5 minutes without derailing current work? → Fix it, no issue needed
- Complex, requires investigation, or would derail work? → Offer to create issue

**Action:** "I found an issue: <description>. Create an issue to track this?"

If yes, propose:
```
Title: [Bug] or [Tech Debt] <description>
Body: Context (what you were doing), location, description, potential impact
```

**This is NOT "overstepping"** — offering to track work is part of the development workflow, not project management politics.

### 4. After Finishing Branch

**Trigger:** Branch work complete, running finishing-a-development-branch

**Action:** Check for related issues:
- Issue references in commits (`#123`, `fixes #456`)
- Issue number in branch name

If found, ask: "Update these issues?" with options: close, comment, or skip.

If PR created, remind: issues with `fixes #N` auto-close on merge.

## Issue Types

| Situation | Create |
|-----------|--------|
| Single-repo work (bug, feature) | Repo issue via `gh issue create` |
| Cross-repo, spike, unclear scope | Project draft via `gh project item-create` |

Repo issues can be referenced in commits and auto-close via PR.

## Common Rationalizations (Don't Fall For These)

| Excuse | Reality |
|--------|---------|
| "Creating issues is overstepping" | Offering to track work is collaboration, not politics |
| "It's in git, no need for issue" | Git tracks code, issues track work intent and status |
| "Administrative overhead" | 30 seconds now vs forgotten work later |
| "Not my domain" | You're part of the team, tracking is everyone's job |

## Quick Reference

See gh-reference.md for CLI commands.

**Minimum auth:** `gh auth refresh -s project`

**Most common operations:**
```bash
# Create issue and add to project
gh issue create -R owner/repo --title "Title" --body "Body"
gh project item-add PROJECT_NUM --owner OWNER --url ISSUE_URL

# Create project draft (cross-repo)
gh project item-create PROJECT_NUM --owner OWNER --title "Title" --body "Body"

# Check project config
gh project list --owner OWNER
```
