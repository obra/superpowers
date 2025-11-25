# GitHub Review Mechanics (For Reviewers)

Command reference for code-reviewer agents analyzing PRs hosted on GitHub.

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

## Fetching PR Content

### Basic PR Information
```bash
# Overview: title, body, state, author
gh pr view <number>

# View the actual code changes
gh pr diff <number>

# Check CI/build status
gh pr checks <number>
```

### Existing Discussion
```bash
# Get comments and reviews as JSON
gh pr view <number> --json comments,reviews,reviewRequests

# Get line-specific review comments with file and line info
gh api repos/{owner}/{repo}/pulls/{number}/comments

# Extract specific fields for processing
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --jq '.[] | {id, path, start_line, line, body}'
```

**Multi-line comments:** `start_line` shows where comment begins, `line` shows where it ends. If `start_line` is null, it's a single-line comment.

## Posting Review Findings

**IMPORTANT:** Only post to GitHub AFTER:
1. Reporting complete findings to parent agent
2. Receiving explicit permission to post

### General PR Comment
```bash
gh pr comment <number> --body "Review summary:
- Finding 1
- Finding 2
..."
```
**Use for:** Overall summary, non-code-specific observations

### Formal Review
```bash
# Comment only (no approval/rejection)
gh pr review <number> --comment --body "Reviewed changes. See inline comments for details."
```
**Use for:** Structured review submission

### Line-Specific Comments
```bash
# Post comment on specific line
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  -f body="Issue: [description]" \
  -f path="src/file.ts" \
  -f commit_id="$(gh pr view <number> --json headRefOid -q .headRefOid)" \
  -F line=42

# Post comment spanning multiple lines
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  -f body="Issue: [description]" \
  -f path="src/file.ts" \
  -f commit_id="$(gh pr view <number> --json headRefOid -q .headRefOid)" \
  -F start_line=40 \
  -F line=45
```
**Use for:** Inline feedback on specific code locations

## Forbidden Actions

**NEVER do any of the following:**

| Action | Why Forbidden |
|--------|---------------|
| `gh pr close` | Closing PRs is human decision |
| `gh pr merge` | Merging is human decision |
| `gh pr review --approve` | Approval requires human judgment |
| `gh pr review --request-changes` | Blocking PRs requires human judgment |
| `git push --force` | Destructive to PR history |
| Post without permission | Parent agent must approve first |
