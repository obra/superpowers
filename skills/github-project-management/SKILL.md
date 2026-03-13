---
name: github-project-management
description: Use when completing design docs, creating implementation plans, discovering bugs during unrelated work, or finishing branches — any development checkpoint where work should be tracked as GitHub issues or project items
---

# GitHub Project Management

## Overview

Integrate GitHub issue tracking into natural development workflow. Offer to create issues at key checkpoints, always with user confirmation.

**Core principle:** Work should be tracked where it happens, not as a separate administrative task.

## When to Use

- After completing a design doc (brainstorming)
- After writing an implementation plan (writing-plans)
- When you discover a bug or tech debt unrelated to current work
- After finishing a development branch (finishing-a-development-branch)

## When NOT to Use

- Sprint planning, backlog grooming, or roadmap organization
- Automated issue creation without user confirmation
- Project-specific conventions (put those in CLAUDE.md)

## Configuration

Each repo specifies its project in CLAUDE.md as `github_project: owner/project-number` (e.g., `obra/1` for user, `my-org/5` for org).

If missing, ask: "No project configured. Create as repo-only issue, or specify a project?"

## Integration Points

### 1. After Brainstorming

**Follows:** superpowers:brainstorming

**Trigger:** Design doc committed to `docs/plans/`

**Action:** Ask "Create a tracking issue for this feature?" If yes, propose title (`[Feature] <description>`), summary, link to design doc, and acceptance criteria. Wait for approval before creating.

### 2. After Writing Plans

**Follows:** superpowers:writing-plans

**Trigger:** Implementation plan completed

**Action:** Ask "Create tracking issues for this plan?"

Options: A) Single parent issue linking to plan, B) Parent with sub-issues (see gh-reference.md for GraphQL commands), C) Individual issues per task, D) Skip.

### 3. During Implementation (Bug/Debt Discovery)

**Trigger:** Discovered bug or tech debt unrelated to current task

Can fix in <5 minutes without derailing? Fix it. Otherwise, offer to create issue.

**Action:** "I found an issue: <description>. Create an issue to track this?" If yes, propose title (`[Bug]` or `[Tech Debt]`), context, location, and impact. Wait for approval.

### 4. After Finishing Branch

**Follows:** superpowers:finishing-a-development-branch

**Trigger:** Branch work complete

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

**Note:** Some repos have issues disabled. If `gh issue create` fails, use a project draft item instead.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Creating issues without user confirmation | Always propose details and wait for explicit approval |
| Using project number with `--project` flag | `--project` takes the display name, not the number. Use `--project "My Project"` or the two-step method |
| Assuming `item-create` succeeded with no output | `gh project item-create` is silent on success. Verify with `item-list --format json` |

## Quick Reference

See gh-reference.md for CLI commands. **Minimum auth:** `gh auth refresh -s project`
