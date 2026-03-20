---
name: code-review-agent
description: Use when reviewing PRs, applying code review feedback, resolving merge conflicts, or merging changes to the codebase.
---

# Code Review Agent

## Overview

Automates PR code reviews end-to-end: fetch details, analyze changes, apply fixes, handle conflicts, verify builds, and merge.

## When to Use

- User asks to "review", "merge", or "handle" a PR
- Code review feedback needs to be applied
- Merge conflicts need resolution
- Verifying PR changes before merge
- Closing/merging PRs with follow-up commits

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. FETCH PR details (title, body, files, state, diff)         │
├─────────────────────────────────────────────────────────────────┤
│  2. FETCH & ANALYZE PR comments (code review feedback)        │
│     - Get all comments including agent reviews                  │
│     - Parse actionable items (suggestions, required changes)   │
│     - Map comments to specific files/line numbers              │
├─────────────────────────────────────────────────────────────────┤
│  3. ANALYZE changes (diff, conflicts, mergeability)            │
├─────────────────────────────────────────────────────────────────┤
│  4. APPLY FIXES                                                │
│     - Implement comment feedback                               │
│     - Resolve merge conflicts                                   │
│     - Address style/quality issues                             │
├─────────────────────────────────────────────────────────────────┤
│  5. VERIFY (build, test, lint)                                │
├─────────────────────────────────────────────────────────────────┤
│  6. COMMIT & PUSH changes                                      │
│     - Reference original comments in commit if applicable       │
├─────────────────────────────────────────────────────────────────┤
│  7. REPLY TO COMMENTS (acknowledge fixes)                      │
├─────────────────────────────────────────────────────────────────┤
│  8. MERGE PR (squash/rebase/merge)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Fetch PR Details

```bash
# Get PR metadata
gh pr view {PR_NUMBER} --repo {OWNER}/{REPO} \
  --json title,body,state,mergeable,mergeStateStatus,files,additions,deletions

# Get full diff
gh pr diff {PR_NUMBER} --repo {OWNER}/{REPO}

# Check merge status
gh pr view {PR_NUMBER} --repo {OWNER}/{REPO} \
  --json mergeable,mergeStateStatus,reviewDecision
```

## Step 2: Fetch & Analyze PR Comments

**Get all comments (including code review feedback):**
```bash
# Get all PR comments
gh api repos/{OWNER}/{REPO}/pulls/{PR_NUMBER}/comments \
  --jq '.[] | {id, path, line, side, body, user: .user.login, createdAt}'

# Get review comments with diff context
gh api repos/{OWNER}/{REPO}/pulls/{PR_NUMBER}/reviews \
  --jq '.[] | {state, body, user: .user.login, comments: .comments | length}'

# Get combined issue comments
gh issue view {PR_NUMBER} --repo {OWNER}/{REPO} --comments
```

**Parse actionable items from comments:**

| Comment Pattern | Action |
|-----------------|--------|
| "suggestion:" / "nit:" | Optional improvement, address if trivial |
| "should", "must", "required" | Mandatory fix |
| "security", "vulnerability", "SQL injection" | Critical, fix immediately |
| "test", "coverage" | Add/update tests |
| "style", "formatting", "lint" | Run linter/formatter |
| "architecture", "design" | Review with @oracle if complex |

**Map comments to files:**
```bash
# Extract file-specific feedback
gh api repos/{OWNER}/{REPO}/pulls/{PR_NUMBER}/comments \
  --jq '[.[] | select(.path != null) | {path, line, body}]'
```

**Categorize feedback:**
1. **Blocking** - Must fix before merge (bugs, security, broken builds)
2. **Requested Changes** - Reviewer explicitly requested changes
3. **Suggestions** - Optional improvements
4. **Questions** - Need clarification before acting

## Step 3: Analyze Changes

**Check mergeability:**
- `mergeStateStatus: "BLOCKED"` → Needs reviews/approvals
- `mergeStateStatus: "DIRTY"` → Has conflicts
- `mergeStateStatus: "UNSTABLE"` → Checks failing
- `mergeable: "CONFLICTING"` → Needs conflict resolution

**Identify files changed:**
- Security-sensitive files (auth, WebSocket, database)
- Infrastructure files (CI/CD, Dockerfile)
- Core logic vs. boilerplate

**Cross-reference:** Compare comment feedback against changed files to ensure all review items are addressed.

## Step 6: Apply Fixes

**Priority order for fixes:**
1. Security vulnerabilities → Fix immediately
2. Bugs/breaking changes → Fix before merge
3. Reviewer-requested changes → Address all
4. Suggestions/nits → Address if trivial, note if skipped

### Implementing Comment Feedback

```bash
# 1. Read the file mentioned in comment
read {file_path}

# 2. Apply the fix
edit {file_path} --oldString "{original}" --newString "{fixed}"

# 3. Verify build still passes
go build ./...

# 4. Push the fix
git add {file_path}
git commit -m "fix: address comment on {file_path}"
git push
```

**Tracking comment resolution:**
```bash
# List unresolved comments
gh api repos/{OWNER}/{REPO}/pulls/{PR_NUMBER}/comments \
  --jq '[.[] | select(.resolved == false) | {path, line, body}]'
```

### Merge Conflict Resolution

```bash
# Fetch the PR branch
git fetch origin {BRANCH_NAME}

# Merge master into PR branch to resolve
git checkout {BRANCH_NAME}
git merge origin/master

# Resolve conflicts, then:
git add -A
git commit -m "Merge: resolve conflicts with master"
git push

# Alternative: rebase
git rebase origin/master
# Resolve conflicts, then:
git rebase --continue
git push --force-with-lease
```

## Step 4: Verify

**Always run verification before claiming success:**

```bash
# Build
cd backend && go build ./...

# Test (if tests exist)
go test ./...

# LSP diagnostics (if available)
lsp_diagnostics on changed files
```

## Step 5: Commit & Push

**When committing fixes based on review comments:**
```bash
# Reference the comment/feedback in commit
git commit -m "fix: address PR review comments

- {specific fix 1}
- {specific fix 2}

Closes #${PR_NUMBER}"
```

## Step 7: Reply to Comments

**Acknowledge fixes with a PR comment:**
```bash
# Reply to a specific comment
gh api repos/{OWNER}/{REPO}/pulls/{PR_NUMBER}/comments/{COMMENT_ID} \
  --method POST \
  --field body="Thanks for the feedback! Applied the fix in commit {SHA}"

# Add general comment acknowledging all changes
gh pr comment {PR_NUMBER} --repo {OWNER}/{REPO} --body "Addressed all review comments. Ready for re-review."
```

**Comment templates:**
```markdown
<!-- Security fix acknowledged -->
Fixed the SQL injection vulnerability. Parameterized the query.

<!-- Style fix acknowledged -->
Applied formatting fixes. Runs `gofmt` in CI now.

<!-- Architecture question addressed -->
Refactored as suggested. Moved validation to separate layer.
```

## Step 8: Merge PR

```bash
# Stage specific files (avoid 'nul' and other OS artifacts)
git add backend/internal/api/websocket.go .jules/sentinel.md

# Commit with descriptive message
git commit -m "{EMOJI} {TYPE}: {Brief description}

{Bullet points of changes if multiple}

PR #${PR_NUMBER}"

# Push
git push
```

## Step 8: Merge PR

```bash
# Squash merge (default, clean history)
gh pr merge {PR_NUMBER} --repo {OWNER}/{REPO} --squash --delete-branch

# Rebase merge (preserves commits)
gh pr merge {PR_NUMBER} --repo {OWNER}/{REPO} --rebase --delete-branch

# Regular merge (preserves all commits)
gh pr merge {PR_NUMBER} --repo {OWNER}/{REPO} --merge --delete-branch
```

**If PR is not mergeable:**
```bash
# Check why
gh pr view {PR_NUMBER} --json mergeStateStatus,mergeable

# If DIRTY/CONFLICTING → Resolve conflicts first
# If UNSTABLE → Wait for checks to pass
# If BLOCKED → Request review or approve
```

## Quick Reference

| Task | Command |
|------|---------|
| Fetch PR | `gh pr view {N} --repo {R} --json title,body,files,state` |
| Get diff | `gh pr diff {N} --repo {R}` |
| Check merge | `gh pr view {N} --json mergeable,mergeStateStatus` |
| List PRs | `gh pr list --repo {R} --state all --limit 20` |
| Merge | `gh pr merge {N} --squash --delete-branch` |
| Close | `gh pr close {N} --comment "{reason}"` |
| Build | `go build ./...` |
| Fetch branch | `git fetch origin {branch}` |
| Rebase | `git rebase origin/master` |
| Push | `git push --force-with-lease` |
| **Comment Commands** | |
| Get review comments | `gh api repos/{O}/{R}/pulls/{N}/comments` |
| Get reviews | `gh api repos/{O}/{R}/pulls/{N}/reviews` |
| Get issue comments | `gh issue view {N} --comments` |
| Add PR comment | `gh pr comment {N} --body "{text}"` |
| List unresolved | `gh api ... --jq '[.[] \| select(.resolved==false)]'` |

## Common Patterns

### PR Already Merged
```bash
# Check if PR is already merged
gh pr view {N} --json state
# If state = "MERGED" → Inform user, no action needed
```

### PR Based on Stale Branch
```bash
# PR was created from old branch, master moved forward
# Option 1: Re-create PR from current master
# Option 2: Apply fix directly to master (if fix is simple)

git checkout master
# Apply the intended changes directly
git commit -m "..."
git push
# Close original PR with explanation
```

### Multiple PRs to Process
```bash
# Get list of PRs
gh pr list --repo {R} --state open

# Process each one:
# 1. Fetch and review
# 2. Apply fixes if needed
# 3. Merge if ready
# 4. Move to next
```

### Handling Multi-Agent Review Comments

When multiple agents have reviewed the PR:

```bash
# 1. Get all comments grouped by author
gh api repos/{O}/{R}/pulls/{N}/comments \
  --jq '[.[] | {author: .user.login, path, body}] | group_by(.author)'

# 2. Identify overlapping feedback (same issue noted by multiple agents)
# 3. Prioritize: security > correctness > style

# 4. Track resolution
gh api repos/{O}/{R}/pulls/{N}/comments \
  --jq '[.[] | select(.resolved == false)] | length'
# Should be 0 before merge
```

**Comment triage approach:**
1. **Consolidate duplicates** - If 3 agents say the same thing, fix once
2. **Resolve conflicts** - If agents disagree, use judgment or escalate
3. **Acknowledge all** - Reply to each thread confirming fix or providing rationale

## Anti-Patterns

- **Don't merge without verifying build passes**
- **Don't close PRs without documenting why**
- **Don't force push to shared branches without warning**
- **Don't assume PR is still valid—check mergeStateStatus first**
- **Don't skip conflict resolution—always verify resolved correctly**
- **Don't ignore review comments—address or acknowledge every one**
- **Don't leave unresolved comments before merge**
- **Don't close comment threads without explanation**

## Environment Notes

**Windows-specific:**
- Use double quotes for paths with spaces
- Avoid `cd && cmd` pattern—use `workdir` parameter instead
- Watch for `nul` file artifact from `git add -A`

**Non-interactive:**
- All commands must complete without prompts
- Use `--yes` / `--force` flags preemptively
- Never use editors, pagers, or REPLs
