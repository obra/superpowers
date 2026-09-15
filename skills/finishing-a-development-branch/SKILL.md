---
name: finishing-a-development-branch
description: Use when implementation is complete and you need to verify the work, inspect the working tree, and hand off to the user
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify → Inspect → Report → Stop.

This skill does not finish branches by performing Git operations. Its job is to verify the completed work, inspect the working tree, report what it finds, and return control to the user. The user owns all repository history and publication decisions — staging, committing, pushing, merging, rebasing, creating pull requests, and deleting branches or worktrees.

**Announce at start:** "I'm using the finishing-a-development-branch skill to verify this work and report its state."

```text
Implementation complete
      ↓
Run final verification
      ↓
Inspect git status
      ↓
Inspect git diff
      ↓
Inspect untracked files
      ↓
Review what changed
      ↓
Report verification results
      ↓
STOP
      ↓
User decides whether to stage, commit, push, merge, create PR, etc.
```

## Step 1: Run Final Verification

Run the project's full relevant test suite and any other appropriate checks (type checking, linting, build) for the work that was done.

**If verification fails**, determine whether the failure is caused by the current task.

If the failure is within the scope of the current task, fix it, re-run verification, and continue only once verification passes.

If the failure is unrelated to the current task or cannot reasonably be fixed without a decision from the user, report the failure and stop:

```
Verification failing (<N> failures):

[Show failures]
```

Do not proceed to the hand-off on the strength of an earlier, stale test run — verify the tree as it exists right now.

**If verification passes:** continue to Step 2.

## Step 2: Inspect the Working Tree

Distinguish changes made during the current task from any unrelated changes that were already present in the working tree before this task began. Never revert, overwrite, or clean up unrelated user work — it belongs to the user, not to this task.

```bash
git status
git diff
git diff --stat
```

Explicitly inspect untracked files — they are easy to miss and often matter:

```bash
git status --porcelain -uall
```

For each untracked or modified file, understand whether it is:

* part of the current task's implementation
* pre-existing user work unrelated to this task
* a temporary or debug artifact that should not ship (e.g. scratch scripts, log dumps, editor swap files)

Flag anything in the third category in your report. Do not delete it yourself — that decision belongs to the user.

## Step 3: Review What Changed

Compare the diff against the intended scope of the task:

* Does every changed file belong to this task?
* Are there accidental or unrelated changes mixed in?
* Are there temporary/debug files or leftover scratch code?
* Does anything look like it silently reverts or overwrites pre-existing user work?

If something is wrong and it is within the scope of the current task to fix, fix it, then re-run the relevant verification from Step 1 before continuing.

## Step 4: Report and Stop

Report to the user:

* what was implemented
* what verification was run and its result
* a summary of `git status` / `git diff --stat`
* any untracked files and what they appear to be
* anything flagged as accidental, unrelated, or temporary
* the current working-tree state (branch, clean/dirty, ahead/behind if known)

Then **stop**. Return control to the user.

```
Verification passed. Working tree summary:

<git status / diff --stat summary>

Untracked files:
<list, with a note on what each appears to be>

Flagged for your attention:
<accidental changes, debug artifacts, or none>

Implementation is ready for your review. I have not staged, committed,
pushed, merged, or otherwise changed Git history — that's your call.
```

Do not present a menu of Git operations to choose from, and do not ask which one Superpowers should perform. The report states facts; it does not solicit a Git decision.

## What This Skill Must Not Do

Do not automatically perform any of the following:

* `git add`
* `git commit`
* `git commit --amend`
* `git reset`
* `git restore`
* `git checkout --`
* `git rebase`
* `git merge`
* `git cherry-pick`
* `git stash`
* `git push`
* `git branch -d`
* `git branch -D`

Also do not:

* create a pull request
* delete branches
* delete worktrees
* discard changes
* clean the working tree destructively
* move files around to "facilitate cleanup"
* invoke another finishing skill or workflow that performs Git mutations
* present a menu asking the user which Git operation Superpowers should perform

Completing implementation and passing verification is not permission to touch Git history. Do not infer permission from the fact that the work is done.

## If the User Explicitly Requests a Git Operation

If, after the report, the user explicitly asks for a specific Git operation (e.g. "merge this to main," "push and open a PR," "delete the branch"), handle that request directly per their instruction or the relevant skill for that operation. This skill's job ends at the report — it does not itself carry out branch integration or cleanup.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Tests passed earlier this session" | Run verification on the tree you are about to report on. A stale green run only proves the tree it ran on. |
| "They obviously want it merged" | Integration is the user's decision. Report and stop; do not act on an inference. |
| "I'll offer a menu of what to do next" | Reporting is not a menu. State what was verified and what the tree looks like, then stop. |
| "This debug file is harmless, I'll just remove it" | Flag it in the report. Removing files is a working-tree change the user did not ask for. |
| "The implementation is done, so a quick `git add` just tidies things up" | Staging is the user's decision, always. Never stage automatically. |
| "This unrelated change was probably already broken" | Don't touch it. Report it if relevant, but pre-existing unrelated work is not this task's to fix or revert. |
| "I'll just clean up the worktree since we're done" | This skill does not manage worktrees or branches. Leave that entirely to the user. |
