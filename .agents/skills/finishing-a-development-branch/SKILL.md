---
name: finishing-a-development-branch
description: Use when all tasks in a plan are complete and verified, or when opening/editing a PR for a ticketed change. Verify the full suite, write the PR description (schema below), present merge/PR/keep/discard options, and clean up the isolated workspace.
---

# Finishing a Development Branch

**Announce:** "I'm using the finishing-a-development-branch skill."

## 1. Verify

Run the full test/lint/build suite fresh on the branch and confirm green (see
`verification-before-completion` — no claim without fresh evidence). For ticketed
orchestrated work, also honor gates in `docs/agent_invariants.md`.

## 2. Review

Ensure the diff was reviewed. For merge-gating ticketed work prefer `falsifying-review`;
otherwise `requesting-code-review`. Nothing merges without human review / consent.

## 3. PR description schema (canonical)

When opening or editing a PR body, use this schema only (do not invent a parallel copy).
A description is a **merge aid, not a report.** Target under ~40 lines.

### Closing reference first

Above every section, one line per issue:

```
Closes #<n>
```

Only the keyword form closes (`Closes` / `Fixes` / `Resolves` and tenses). One issue per line.
Keep the body line even when the commit subject also carries `Closes #<n>` (squash merges).

### Sections in order

1. **`## Background`** — optional; omit when Overview/Changes suffice.
2. **`## Overview`** — two to four sentences at behaviour altitude.
3. **`## Changes`** — bullets that scan without opening the diff; group by behaviour, not file.
4. **`## Notes for reviewers`** — risks, unverified claims, deferred work; omit heading if empty (never write "None").

### Never in a PR description

- Acceptance-criteria checklist (lives on the issue)
- Gate command transcripts / raw logs
- Secrets, tokens, env values
- Restating the full issue body

## 4. Present options

Summarize the change and present to the human:
- Merge / open a PR to the integration branch (`docs/agent_invariants.md` → `base_branch`, else main).
- Keep the branch for more work.
- Discard the changes.

For `orchestrated-delivery`, merge only on explicit human consent after the review/mutation gate.

## 5. Clean up

After the human decides, clean up the isolated workspace (remove the worktree/branch if merged or
discarded). Leave the integration branch clean.
