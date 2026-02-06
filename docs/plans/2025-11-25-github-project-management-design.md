# GitHub Project Management Skill Design

## Overview

A tactical workflow integration skill that manages GitHub issues and project items at natural development checkpoints. The agent proposes issue creation at key workflow moments, always with user confirmation.

## Core Concepts

### Repo Issues vs Project Drafts

- **Repo issues** — For discrete, single-repo work (bugs, features tied to one codebase). Created with `gh issue create`, can be referenced in commits (`fixes #123`), linked to PRs automatically.

- **Project draft items** — For cross-repo work, initiatives, spikes, and exploratory work with unclear repo scope. Created with `gh project item-create`, lives only in the project board.

### Configuration

Each repo specifies its GitHub Project in CLAUDE.md:

```markdown
## GitHub Project

github_project: owner/project-number
```

Examples:
```markdown
# User project
github_project: nclarke/1

# Org project
github_project: my-org/5
```

- If `github_project` is missing and agent needs to create an issue, prompt: "No project configured. Create as repo-only issue, or specify a project?"
- For cross-repo items, always ask which project to use

### Confirmation Required

Agent always proposes issue details (title, body, labels) and waits for approval before creating anything. Issues are visible to the whole team — no auto-creation.

## Integration Points

### 1. After Brainstorming (Design Completion)

**Trigger:** Brainstorming skill completes and writes design doc to `docs/plans/`

**Action:** Propose creating a feature issue linking to the design

**Agent behavior:**
1. After committing design doc, ask: "Create a tracking issue for this feature?"
2. If yes, propose issue details
3. Wait for approval/edits
4. Create issue and add to project

**Issue template:**
```
Title: [Feature] <brief description from design>
Body:
## Summary
<1-2 sentence summary>

## Design Document
See: docs/plans/YYYY-MM-DD-<topic>-design.md

## Acceptance Criteria
<extracted from design if present>
```

### 2. After Writing Plans (Task Breakdown)

**Trigger:** Writing-plans skill produces implementation plan

**Action:** Propose creating issues for major tasks

**Agent behavior:**
1. After plan is written, ask: "Create tracking issues for this plan?"
2. Present options:
   - A) Single parent issue linking to plan
   - B) Individual issues per major task
   - C) Skip issue creation
3. If A or B, propose issue details
4. Wait for approval, create issues

### 3. During Implementation (Bug Discovery)

**Trigger:** Agent discovers a bug, technical debt, or issue unrelated to current task

**When to trigger:**
- Bug found while working on something else
- Technical debt noticed but out of scope
- Edge case identified that needs future attention
- Dependency issue requiring separate investigation

**Agent behavior:**
1. Note the discovery: "I found an issue: <description>. This is separate from our current work."
2. Ask: "Create an issue to track this?"
3. If yes, propose issue with context
4. Continue with current task after issue created

**Issue template:**
```
Title: [Bug/Tech Debt] <brief description>
Body:
## Context
Discovered while working on: <current task>
Location: <file:line if applicable>

## Description
<what's wrong>

## Potential Impact
<severity, affected areas>
```

### 4. After Finishing Branch (Work Completion)

**Trigger:** Finishing-a-development-branch skill runs

**Action:** Update or close related issues

**Agent behavior:**
1. Check commit messages for issue references (`#123`, `fixes #456`)
2. Check if current branch name contains issue number
3. If related issues found, ask: "Update these issues? [list issues]"
4. Options: close, add comment, or skip
5. If PR created, issues auto-close via GitHub when PR merges (no action needed)

## Authentication

The `gh` CLI requires the `project` scope:

```bash
# Check current scopes
gh auth status

# Add project scope if missing
gh auth refresh -s project
```

## Deliverables

1. `skills/github-project-management/SKILL.md` — The workflow skill with integration point instructions
2. `skills/github-project-management/gh-reference.md` — CLI quick reference for `gh project` and `gh issue` commands

## CLI Reference Structure

The `gh-reference.md` file provides copy-pasteable commands:

- Prerequisites (auth, scopes)
- Project Operations (list, view, get IDs)
- Issue Operations (create, view, edit, close, add to project)
- Project Item Operations (list, create draft, edit fields, archive)
- Common Workflows (create + add to project, update status)

## What This Skill Is NOT

- Strategic planning (sprint planning, backlog grooming, roadmap organization)
- Automated issue creation without confirmation
- A replacement for human judgment on prioritization
