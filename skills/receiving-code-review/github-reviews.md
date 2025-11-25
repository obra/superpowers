# GitHub Review Mechanics (For Implementers)

Command reference for agents responding to PR feedback on GitHub.

## Prerequisites

**Required:**
1. Repository remote hosted on github.com
2. GitHub CLI (`gh`) installed and authenticated

**Verify before first use (skip if already confirmed):**
```bash
# Check remote is GitHub
git remote get-url origin  # Should contain "github.com"

# Check gh CLI available
gh --version
```

**If checks fail:** Use alternative workflow or ask your human partner for guidance.

## Reading Review Feedback

### Basic View
```bash
# Overview with comments
gh pr view <number>

# View what changed
gh pr diff <number>

# Check CI status
gh pr checks <number>
```

### Structured Data
```bash
# Get comments, reviews, and pending reviewers
gh pr view <number> --json comments,reviews,reviewRequests

# Get line-specific review comments with full context
gh api repos/{owner}/{repo}/pulls/{number}/comments

# Extract key fields for processing
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --jq '.[] | {id, path, start_line, line, body}'
```

**Multi-line comments:** `start_line` shows where comment begins, `line` shows where it ends. If `start_line` is null, it's a single-line comment.

## Responding to Feedback

### General PR Comment
```bash
gh pr comment <number> --body "Addressed review feedback:
- Fixed validation logic per comment on utils.py:42
- Refactored error handling per comment on api.py:15
All changes pushed in commit abc123"
```
**Use for:** Summarizing multiple fixes, providing overall context

### Reply to Specific Thread
```bash
# First, get comment IDs
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --jq '.[] | {id, path, line, body}'

# Reply to specific comment thread
gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/replies \
  -f body="Fixed in commit abc123. [Technical explanation]"
```
**Use for:**
- Answering technical questions
- Providing file/line-specific context
- Pushing back on suggestions with reasoning
- Threading discussion to maintain context

### Editing Your Own Comments
```bash
gh api repos/{owner}/{repo}/pulls/comments/{comment_id} \
  -X PATCH \
  -f body="Corrected: [updated text]"
```
**Use for:** Fixing errors in your own posts (not others')

## Commit Strategy

```bash
# One commit per distinct fix (preferred)
git commit -m "Fix: [specific issue from review]"

# Push changes (triggers notification to reviewers)
git push
```

**Commit messages should:**
- Reference what review feedback was addressed
- Be specific, not just "address review comments"

**When to push:**
- After fixing all related items
- After all items if changes are tightly coupled
- Incrementally if fixes are independent

## Requesting Re-Review

```bash
# 1. Push your changes first
git push

# 2. Verify CI passes before requesting re-review
gh pr checks <number>

# 3. Request re-review (only after CI is green)
gh pr edit <number> --add-reviewer @username

# Or request from a team
gh pr edit <number> --add-reviewer @org/team
```

**When to request:**
- After implementing ALL feedback items
- After pushing changes
- After CI checks pass

**Note:** Pushing commits notifies reviewers automatically. Only use explicit re-review request when you need formal re-review.

## Forbidden Actions

**NEVER do any of the following:**

| Action | Why Forbidden |
|--------|---------------|
| Mark comments as resolved | Reviewer's responsibility, not yours |
| `gh pr close` | Closing PRs is human decision |
| `gh pr merge` | Merging is human decision |
| `gh pr review --approve` | Cannot approve your own work |
| `git push --force` | Destructive to PR history |
