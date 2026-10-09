---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Get an independent review of finished work: after a major feature, before merging, or when your human partner asks. Subagent-driven development runs its own reviews; this is for work outside it. The reviewer gets context you construct, never your session's history.

1. **Pick the range.** BASE is the commit recorded before the work began, or `git merge-base origin/main HEAD`; never `HEAD~1`, which drops every commit but the last and leaves the reviewer approving a diff that isn't the work. HEAD is `git rev-parse HEAD`.
2. **Build the review package.** `../subagent-driven-development/scripts/review-package BASE HEAD` writes the commit list, stat summary, and diff with context to one file and prints its path. The diff never enters your context.
3. **Dispatch the reviewer** with [code-reviewer.md](code-reviewer.md), filling its placeholders. Route a `reviewer` with specialty `code` through toolbelt:agent-routing, so the review comes from a different harness than yours.
4. **Act on the verdict.** Whoever fixes reads the review file; you read only the returned verdict. Fix Critical and Important findings before proceeding, note Minor ones, and push back with technical reasoning where the reviewer is wrong.
