---
name: receiving-code-review
description: Use when you receive review feedback on your work. Address findings constructively, re-verify, and iterate — don't argue or dismiss.
---

# Receiving Code Review

**Announce:** "I'm using the receiving-code-review skill."

## Treat feedback as signal

Review findings are a signal about the change, not an attack. Read them carefully and separate:

- **Substantive** — a real bug, edge case, or design concern. Address it.
- **Style / preference** — adjust if it aligns with the project's conventions; note it if it doesn't.

## Respond and iterate

1. Acknowledge the finding and state your plan to address it.
2. Fix the substantive issues (use `test-driven-development` / `systematic-debugging` as needed).
3. Re-run verification and confirm the fix (see `verification-before-completion`).
4. Reply with what you changed and how you verified it.

## Don't

- Don't dismiss a finding without engaging with it.
- Don't argue for the sake of arguing; if you disagree, explain your reasoning concisely and offer
  evidence.
- Don't weaken a test to silence a review point.

## After

If the reviewer approves, proceed. If new issues arise, address them before moving on.
