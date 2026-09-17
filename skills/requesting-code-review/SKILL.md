---
name: requesting-code-review
description: Use when independent code review would provide concrete value — e.g. security-sensitive, architecturally complex, or high-risk changes — not as a required step after every task
---

# Requesting Code Review

> Independent code review is optional. Use it when a second perspective provides concrete value; do not invoke it merely because a task has been completed.

Self-review, performed by the primary agent after implementation, is the default. Independent review is an additional capability the primary agent or the user can reach for deliberately, when the specific change warrants a second, unbiased perspective. It is not a gate every task must pass through, and it is not inherently more trustworthy than self-review — it's a different tool, useful for different situations.

## When Independent Review Is Worth Requesting

Good reasons to request independent review:

- security-sensitive changes
- complex architectural changes
- difficult concurrency or state-management logic
- high-risk refactoring
- subtle bugs where independent analysis is valuable
- changes with significant compatibility impact
- explicit user request
- the primary agent recognizes that independent reasoning would materially improve confidence
- a meaningful implementation checkpoint (see `subagent-driven-development`'s Checkpoint Reviews), where the accumulated changes are large, architecturally complex, security-sensitive, or would otherwise benefit from independent confidence before continuing with dependent work

Independent review may be requested at a meaningful implementation checkpoint to evaluate accumulated changes before continuing with dependent work. A checkpoint review — self- or independent — considers the accumulated changes since the previous checkpoint, or since implementation began if it is the first checkpoint; it is not scoped to a single task.

None of these are checklist requirements. This skill is not automatically invoked after every task in `subagent-driven-development` or `executing-plans`, and it is not a required gate in `finishing-a-development-branch`. If none of the above genuinely applies, self-review is enough — continue normally.

Reviewer agents are not inherently better than self-review; they trade the primary agent's full context for an independent, unbiased pass. That trade is worth making only when independence itself is the thing you need.

## Review Workflow

```text
Primary agent implementation
        ↓
Primary self-review
        ↓
Decision: Is independent review genuinely valuable?
        ↓
      NO → Continue normally
        ↓
      YES
        ↓
Define review scope
        ↓
Request independent review
        ↓
Receive findings
        ↓
Primary agent evaluates findings
        ↓
Valid findings?
   ↓              ↓
  YES             NO
   ↓               ↓
Fix + verify      Document/reject with reasoning
   ↓
Re-review only if necessary
        ↓
Continue
```

Routine fixes from a review do not warrant spinning up more agents. The primary agent applies them directly, the same way it would fix anything found in self-review.

## Requesting a Review

**1. Establish the review range.**

The normal case is reviewing uncommitted work in the current working tree.

Inspect:

```bash
git status
git diff
git diff --stat
git status --porcelain -uall
```

Use the repository's appropriate baseline for comparison. When the baseline branch is not already known, inspect the repository (for example with `git branch --show-current` and `git log`) rather than assuming a branch name.

When reviewing uncommitted work, the reviewer must evaluate the actual working-tree changes rather than relying on `HEAD` as the ending state.

If the work has already been committed and the user explicitly wants a commit/range reviewed, commit SHAs may be used instead.

**2. Define the review scope**, then dispatch a `general-purpose` subagent filling the template at [code-reviewer.md](code-reviewer.md).

Provide the reviewer with:

* `{DESCRIPTION}` — brief summary of what was built
* `{PLAN_OR_REQUIREMENTS}` — what it should do
* the appropriate baseline/reference for the changes being reviewed
* the relevant working-tree diff when the work is uncommitted
* files or components to examine
* specific risk areas
* tests already run

Give the reviewer exactly what it needs to evaluate the change — not the full session history.

The review target must match the actual state of the work. Do not review only committed history when the implementation currently exists as uncommitted working-tree changes.

## Findings

The reviewer should identify concrete issues, not just approve or reject. Useful categories:

- correctness
- missing requirements
- regressions
- edge cases
- security
- compatibility
- performance
- maintainability
- test coverage

The primary agent decides whether a finding is valid — do not blindly implement every reviewer suggestion. For each meaningful finding:

1. Understand the finding.
2. Determine whether it is valid.
3. Fix valid issues when appropriate.
4. Run relevant verification.
5. Re-review only when the change or risk genuinely justifies another pass.

If a finding is incorrect, explain why with technical reasoning and supporting code or test evidence rather than implementing feedback solely because it was suggested.

## No Mandatory Reviewer Loop

Do not run a fixed loop such as:

```text
Implementer
  ↓
Reviewer
  ↓
Fixer
  ↓
Reviewer
  ↓
Fixer
  ↓
Reviewer
```

Fixes are made by the primary agent, not a separate fixer agent. Re-review happens only when the user explicitly asks for repeated independent review, or the risk of the specific change genuinely calls for it — never on a fixed number of rounds by default.

## Relationship to Self-Review

**Self-review:** default, performed by the primary agent after implementation, every task.

**Independent review:** optional, performed when another perspective provides concrete value.

Independent review supplements self-review. It does not replace it, and it is not mandatory.

## Git Safety

Review is read-only with respect to the working tree and history. Git inspection (`git status`, `git diff`, `git log`, `git show`) is fine and expected; the review process is read-only with respect to the repository being reviewed. The reviewer must not modify, stage, commit, reset, restore, clean, or otherwise alter the user's working tree or Git history.

Do NOT automatically:

- `git add`
- `git commit`
- `git commit --amend`
- `git reset`
- `git restore`
- `git checkout --`
- `git rebase`
- `git merge`
- `git cherry-pick`
- `git stash`
- `git push`
- `git branch -d`
- `git branch -D`

Do not automatically create or delete branches, create or delete worktrees, discard user changes, or destructively clean the working tree. A review inspects and reports; it never mutates the tree it's reviewing. If an isolated working copy is genuinely required for a review, it must be separate from the user's working tree and must not be used to mutate the repository being reviewed.

## Existing User Changes

Before reviewing the current task, distinguish the task's own changes from unrelated changes already present in the working tree. Scope the review to the task. Do not recommend reverting, overwriting, or cleaning up unrelated user work merely because it falls outside the review scope. The review target is the current task's actual changes, whether those changes are committed, partially committed, or still uncommitted in the working tree.

## Output

A useful review reports:

- scope reviewed
- requirements considered
- findings, if any (severity/impact, evidence or reasoning, recommended action)
- whether additional review is warranted

Skip empty ceremony. If there's nothing meaningful to report, say so briefly — don't manufacture a long approval message to fill the format.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "This task finished, so I should get it reviewed" | Completion isn't a reason. Ask whether independent perspective would materially change confidence in *this* change. If not, self-review is enough. |
| "I'll dispatch a reviewer for everything just to be safe" | Ceremony isn't safety. Reserve independent review for changes where it actually earns its cost — security-sensitive, architecturally complex, high-risk, or explicitly requested. |
| "The reviewer needs my whole session history to understand the change" | Hand it precisely scoped context — what changed, why, and what to check — never your session's history. |
| "The reviewer found something, so I must implement it" | The primary agent decides validity. Push back with reasoning when the finding is wrong. |
| "One round of review wasn't enough, let's loop it" | Repeated review is for cases the user asks for or genuine risk justifies — not a default multi-round loop. |

## Red Flags

**Never:**
- Treat "task complete" as a trigger to request review
- Ignore Critical issues a review does surface
- Proceed with unfixed Important issues without a documented reason
- Implement reviewer feedback you have technical reason to disagree with, without pushing back first

See template at: [code-reviewer.md](code-reviewer.md)
