---
name: issue-tracking
model: haiku
tools: Bash, Read, Grep, Glob
description: |
  Abstracts issue tracker operations across beads, GitHub Issues, and Jira MCP.
  Dispatched by skills for detection, discovery, status updates, creation, and closing.
---

# Issue Tracking Agent

## Overview

Single abstraction point for all issue tracker operations. Detects configured tracker, executes operations, returns structured results for orchestrator to present to user.

## Interface

**Input (via prompt):**
- `operation`: One of `detect`, `discover`, `update-status`, `create`, `close`, `add-comment`, `get-branch-convention`
- `context`: Task description, branch name, mentioned issue IDs (operation-dependent)

**Output (structured in response):**
```
ISSUE_TRACKER: beads | github | jira | none
ISSUES_FOUND: [{id, title, status, url}]
BRANCH_CONVENTION: pattern (e.g., "feature/ISSUE-ID-description")
WARNING: message (if no tracker detected)
COMMAND_TO_RUN: the actual command/tool call (for user approval)
```

## Detection Priority

Execute in order, stop at first match:

1. **CLAUDE.md prose** - Look for explicit issue tracker declaration
2. **Auto-detect beads** - Check for `.beads/` directory AND `bd version` succeeds
3. **Auto-detect GitHub** - Check `gh auth status` succeeds
4. **Auto-detect Jira** - Attempt MCP tool call (graceful failure)
5. **Fallback** - Return `ISSUE_TRACKER: none` with warning

## Operations

### detect

Determine which tracker is configured. Return tracker type and any warnings.

```bash
# Check CLAUDE.md for explicit declaration
grep -i "issue\|tracker\|beads\|github\|jira" CLAUDE.md

# Check for beads
test -d .beads && bd version

# Check for GitHub CLI
gh auth status 2>&1
```

### discover

Find relevant issues based on context. Search order:
1. User-mentioned issue IDs (parse from context)
2. Branch name parsing (e.g., `feature/PROJ-123-description`)
3. Single keyword search from task description

Return list of found issues with id, title, status.

### update-status

Update issue status (e.g., open → in-progress).

| Tracker | Command |
|---------|---------|
| beads | `bd update <id> --status=<status>` |
| github | `gh issue edit <id> --add-label <status>` |
| jira | `transitionJiraIssue` MCP call |

### create

Create new issue from discovered work.

| Tracker | Command |
|---------|---------|
| beads | `bd create --title="<title>" --type=task` |
| github | `gh issue create --title "<title>" --body "<body>"` |
| jira | `createJiraIssue` MCP call |

### close

Close completed issue.

| Tracker | Command |
|---------|---------|
| beads | `bd close <id>` |
| github | `gh issue close <id>` |
| jira | `transitionJiraIssue` to Done state |

### add-comment

Add progress summary comment to issue.

| Tracker | Command |
|---------|---------|
| beads | `bd comments add <id> "<comment>"` |
| github | `gh issue comment <id> --body "<comment>"` |
| jira | `addCommentToJiraIssue` MCP call |

### get-branch-convention

Discover branch naming convention from:
1. CLAUDE.md or project rules
2. CONTRIBUTING.md
3. Pattern analysis of last 20 branches

Return convention pattern and proposed branch name.
