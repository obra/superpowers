---
name: verification-no-test-command
description: Use when about to claim work is complete and there is no test, linter or build that could prove it - reports, recipes, research answers, correspondence, prompt audits. Defines what counts as evidence when there is no external judge. Companion to verification-before-completion, which covers work that does have one.
---

# Verification When There Is No Test Command

## Why this exists

`verification-before-completion` assumes an external judge: a test suite, a
linter, an exit code. The machine says pass or fail and you cannot argue with it.

Most work has no such judge. Nothing can run a report, a recipe or a research
answer and return "correct". The rule does not change — **no completion claim
without evidence** — only what evidence means.

## The failure this stops

Reporting what you INTENDED to produce rather than what is actually on disk.

**If you have not re-opened the artifact in this message, you have not checked
it.** You are remembering your own intentions, which is exactly the state in
which things get missed.

## Two levels, in this order

### 1. Prove whatever CAN be proven

Some things are as binary as a test suite:

| Claim | Evidence |
|---|---|
| Followed the required structure | Open the file. Name each required section and where it appears. |
| Sources cited | Every claim carries a reference, present and in the required format |
| Standing constraints held | Re-read start to finish. A constraint honoured in step 1 and dropped in step 8 is a failure. |
| Findings are real | Every finding points at a location — a line, a quoted span. A finding with no location was recalled, not read. |
| Data reconciles | Totals add up; numbers in the summary match numbers in the table |
| Nothing was truncated | The output ends where it should, not mid-section |

### 2. For everything else, account for the request in full

- Break what was asked into its separate parts.
- Open what you actually produced.
- Confirm each part is addressed.
- **State plainly anything you did not do.**

Four of five things done is not "done". Say which four.

## What this does NOT claim

Confirming that work is complete, consistent and within spec does not make it
correct. A recipe can hang together perfectly and still taste wrong; a report can
follow its structure and still reach the wrong conclusion.

**Say which you verified: that the work is *complete*, not that it is *right*.**

## Relationship to verification-before-completion

Same law, different evidence. Where a command exists, run it — that skill governs.
Where none exists, this one does. Enable both.
