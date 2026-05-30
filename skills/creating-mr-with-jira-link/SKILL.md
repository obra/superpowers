---
name: creating-mr-with-jira-link
description: Use when work on a branch is done and you need to open a merge request AND record it on the matching Jira User Story. Triggers: "tạo merge và comment vào jira", "push branch và tạo MR", "create MR and link to Jira US", "open merge request rồi báo Jira". Covers GitLab repos (glab) and Jira Cloud via the Atlassian MCP.
---

# Creating a Merge Request + Linking to Jira

## Overview
Two steps, one flow: open a merge request for the current branch, then comment the MR URL onto the related Jira User Story so the ticket is traceable. Rino repos live on **GitLab** (use `glab`, NOT `gh`) and Jira is **Jira Cloud** via the Atlassian MCP.

## Before you start
- Branch is pushed-able and work is committed.
- Know the US key (e.g. `TEAM2-545`). Often it's the branch prefix.
- `glab auth status` is logged in; Atlassian MCP tools are available.

## Steps

### 1. Detect host — pick the right CLI
```bash
git remote -v | head -1
```
- `gitlab.com` → use `glab` (NEVER `gh` — it will error with "gh auth login").
- `github.com` → use `gh`.

### 2. Push the branch
```bash
git push -u origin "$(git branch --show-current)"
# verify it landed:
git ls-remote --heads origin "$(git branch --show-current)" | head -1
```

### 3. Find the default/target branch
```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```
Rino repos are usually `main` or `master` — confirm, don't assume.

### 4. Create the MR (GitLab)
```bash
glab mr create \
  --source-branch "$(git branch --show-current)" \
  --target-branch <TARGET> \
  --title "<US-KEY>: <short summary>" \
  --description "$(cat <<'EOF'
## Summary
- <what changed>

## Test Plan
- [ ] <verification step>

🤖 Generated with Claude Code
EOF
)" \
  --remove-source-branch --yes
```
`--yes` skips prompts; `--remove-source-branch` auto-deletes branch on merge. The command prints the MR URL — capture it.

### 5. Comment the MR link on the Jira US
Use the Atlassian MCP `addCommentToJiraIssue`. `cloudId` is the site host (e.g. `rinoeduai.atlassian.net`); `issueIdOrKey` is the US key; `contentFormat: "markdown"`.

Body should include: MR URL, branch → target, 1-line what/why, and (if multiple repos) a roll-up list of all MRs for the US.

## Quick reference
| Thing | Value |
|---|---|
| GitLab CLI | `glab` (not `gh`) |
| Jira cloudId | site host, e.g. `rinoeduai.atlassian.net` |
| MR title | `<US-KEY>: <summary>` |
| Comment tool | `addCommentToJiraIssue` (markdown) |

## Common mistakes
- **Using `gh` on a GitLab remote** → "gh auth login" error. Always check `git remote -v` first.
- **Assuming target branch** → `master` vs `main` differ per repo; read `origin/HEAD`.
- **Forgetting the Jira comment** → the MR alone leaves the US untraceable. The link-back is the point of this skill.
- **Wrong US key** → don't guess; confirm from branch name or ask.
- **One US spanning multiple repos** → comment ALL MR links in one Jira roll-up so reviewers merge them together.
