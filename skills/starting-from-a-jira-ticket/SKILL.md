---
name: starting-from-a-jira-ticket
description: Use when starting work from a Jira ticket - fetches the ticket, branches from the fetched default branch, and routes into the right process skill
---

# Starting From a Jira Ticket

## Overview

**Core principle:** Fetch the ticket → verify a clean tree → branch from a
freshly fetched default → route by issue type.

The branch name is the only thing carrying ticket identity forward. Get it
right here and `finishing-a-development-branch` builds a PR that links back to
the ticket with no extra bookkeeping.

**Announce at start:** "I'm using the starting-from-a-jira-ticket skill to set
up work on <KEY>."

## Step 1: Get the Ticket Key

Take the key from your human partner's message. If there isn't one, ask for it.

Valid keys match `[A-Z][A-Z0-9]+-[0-9]+` — `ABC-123`, `PLAT2-45`. If what you
have doesn't match, ask rather than guessing.

## Step 2: Fetch the Ticket

Check whether a Jira or Atlassian MCP tool is available in this session.

**If one is available:** fetch the issue and record its summary, description,
issue type, status, and acceptance criteria.

**If none is available:** say so once, then ask your human partner to paste the
ticket:

```
No Jira MCP tool in this session. Paste the ticket (summary, type,
description, acceptance criteria) and I'll work from that.
```

Never invent ticket contents. A guessed summary is wrong twice — it names the
branch and it seeds the design that follows.

## Step 3: Preflight

```bash
git status --porcelain
```

**Output is non-empty:** stop. Report the dirty files and ask your human
partner to commit or stash them. Never auto-stash — uncommitted work carried
onto a ticket branch contaminates the PR, and a stash you created is a stash
they don't know about.

## Step 4: Determine the Base Branch

```bash
git fetch origin
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')
DEFAULT=${DEFAULT:-$(git remote show origin | sed -n 's/.*HEAD branch: //p')}
```

Always fetch first. Branching from a stale local ref produces conflicts at PR
time that look real but aren't.

If `origin/dev` exists and the repo's `CLAUDE.md` or `AGENTS.md` says work
lands on an integration branch rather than the default, ask which base to use
before branching.

**A branch for this ticket already exists, local or remote:**

```bash
git branch -a --list "*<KEY>*"
```

If that prints anything, stop and offer to check the existing branch out
instead of creating a second one — a teammate may have already pushed it.

## Step 5: Create the Branch

Pick the prefix from the Jira issue type:

| Jira issue type | Branch prefix |
|-----------------|---------------|
| Bug | `fix` |
| Story, Task, Improvement | `feat` |
| anything else | `chore` |

Build the slug from the first three or four meaningful words of the summary:
lowercase, hyphen-separated, stopwords dropped. Keep the key uppercase and
intact.

`ABC-123 "Add retry to webhook sender"` (Story) becomes
`feat/ABC-123-add-retry-webhook`.

Run this as one shell invocation — shell variables set in Step 4 do not
survive into a new tool call, so `DEFAULT` has to be resolved again here:

```bash
BRANCH="feat/ABC-123-add-retry-webhook"
git fetch origin
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')
DEFAULT=${DEFAULT:-$(git remote show origin | sed -n 's/.*HEAD branch: //p')}
git checkout -b "$BRANCH" "origin/$DEFAULT"
```

Work happens in the current checkout. This skill does not create a worktree.
If your human partner wants one, invoke `superpowers:using-git-worktrees`
**first** and give it this branch name — it creates the branch itself
(`git worktree add ... -b "$BRANCH_NAME"`), so running it after this step
either collides with the branch just created or invents a new name and loses
the ticket key.

## Step 6: Route by Issue Type

Report the branch and the base it came from, then hand off:

| Jira issue type | Next skill |
|-----------------|------------|
| Bug | `superpowers:systematic-debugging` |
| everything else | `superpowers:brainstorming` |

Pass the ticket summary, description, and acceptance criteria into that skill as
pre-loaded context so it starts from what the ticket already says instead of
re-asking.

Say the route out loud so your human partner can redirect in one word:

```
Branch feat/ABC-123-add-retry-webhook created from origin/main.
Story ticket, so I'm starting brainstorming. Say "debug" if this is
really a bug hunt.
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| No ticket key given | Ask for it |
| No Jira MCP | Ask for a paste, then continue |
| Dirty working tree | Stop, report, ask commit-or-stash |
| `origin/dev` plus repo docs naming it | Ask which base |
| Branch for key already exists, local or remote | Offer checkout, don't create a second |
| Bug ticket | Route to systematic-debugging |
| Any other type | Route to brainstorming |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The ticket key tells me enough, skip the fetch" | A guessed summary is wrong twice — in the branch name and in the design built on it. |
| "The working tree is only a little dirty" | Branch from a clean tree or stop. Unrelated changes ride along into the PR. |
| "I'll stash it for them, it's reversible" | Never auto-stash. A stash your human partner didn't ask for is work they can't find. |
| "Local main is probably current" | Always `git fetch` first. Stale bases manufacture conflicts. |
| "No Jira MCP, I'll work from the key alone" | Ask for a paste. Working blind is how the wrong thing gets built. |
| "This ticket is obviously a bug, type says Task" | Route on the ticket's type. If it looks wrong, say so and let your human partner decide. |
| "I'll create the worktree too, it's tidier" | This skill branches in place. Worktrees are a separate, explicit choice. |
