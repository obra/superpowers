---
name: scope-drift-check
description: Use at implementation checkpoints and final verification to judge whether accumulated changes are still within the requested task's scope — distinguishes required/supporting work from incidental/unrelated additions. Judgement-based, not a metric or file/line-count rule.
---

# Scope Drift Check

## Central Rule

> Are the current changes necessary to accomplish the original task, or has the work expanded beyond what was requested?

This is a judgement check, not a metric. It exists to catch quiet scope expansion — extra files, extra refactors, extra "while I'm in here" changes — before they get folded into the task silently. It is not a checklist to run after every small edit, and it does not impose file counts, line-count limits, or numerical scope scores.

---

## The Four Categories

Classify each meaningfully distinct piece of accumulated work:

### Required
Changes directly necessary to fulfil the task as requested. Keep these without comment.

### Supporting
Changes that are not the literal requested change but are genuinely necessary for correctness, integration, compatibility, testing, or verification of the requested change. Keep these — but be able to state the specific reason each is necessary. If you can't articulate the dependency, it may actually be Incidental.

### Incidental
Useful improvements discovered while working that are not required for the requested task to be complete and correct. Do not fold these in silently. Surface them as potential follow-up work instead.

### Unrelated
Changes that do not materially contribute to completing the requested task at all. These should not be part of this change.

---

## Handling Each Category

- **Required / Supporting** — remain in the change. For Supporting changes, state the reason (e.g. "the existing interface didn't expose X, so it had to change to make the requested behaviour possible").
- **Incidental** — don't include automatically. Name it: what it is, why it might be worth doing later, and why it isn't part of this task.
- **Unrelated** — don't include. If it's already been introduced during this task, remove it or split it into a separate task rather than leaving it bundled in.

---

## Current Intent Takes Precedence

A request can legitimately expand mid-conversation — "fix X" can become "fix X and also refactor Y" once the user says so. When that happens, the scope to check against is the *current* explicit intent, not the original wording. This skill checks drift against what has actually been authorized in the conversation so far, not a frozen initial sentence.

Distinguish authorized expansion from silent expansion: the user saying "yes, also do Y" is authorization. Deciding on your own that Y would be good to do while you're in the area, without asking, is what this skill flags as Incidental.

---

## What This Skill Does NOT Do

Do not introduce:

* maximum file counts
* maximum lines-changed limits
* maximum number of components
* time-boxes
* numerical scope scores or thresholds

None of these correlate reliably with whether work is in scope — a one-line change can be Unrelated, and a ten-file change can be entirely Required. Judge each change against the categories above, using the actual task and conversation as context.

---

## Output

Report a concise result, for example:

* **Scope remains aligned** — everything reviewed is Required or obviously Supporting.
* **Supporting changes identified and justified** — list them with the one-line reason each is necessary.
* **Potential scope drift detected** — Incidental work has crept in; name it and recommend deferring it.
* **Unrelated improvement discovered — defer unless explicitly requested** — name it, and leave it out without the user's explicit go-ahead.

Skip the ceremony when there's nothing to say. "Scope remains aligned" is a complete report — don't manufacture caveats to fill the format.

---

## When to Run This

At meaningful checkpoints, per `superpowers:subagent-driven-development`'s Checkpoint Reviews, and again as part of final verification before hand-off. Not after every small task — scope drift is a property of accumulated work, and checking it constantly is itself the kind of process overhead this skill exists to avoid.

---

## Primary Agent Performs This

This is lightweight reasoning the primary agent does directly, as part of its own checkpoint and final-verification work — not a separate scope-analysis agent and not a reviewer subagent. Do not spawn a subagent for this check by default.

Independent review remains available per `superpowers:requesting-code-review` when the accumulated change is large, complex, or otherwise warrants a second perspective. This skill doesn't change that policy — it just gives whoever is reviewing (primary agent or independent reviewer) a concrete question to check.

---

## Git Safety

This is a judgement check, not a Git operation. It does not stage, commit, revert, or otherwise mutate Git history. Deciding to leave Incidental or Unrelated edits out of the current change means not writing them, or removing them from the working tree directly if already added this task — never resetting, stashing, or reverting via Git. The user owns Git history and staging.
