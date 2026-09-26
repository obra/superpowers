---
name: test-driven-development
description: Use while implementing any code. Enforce the RED-GREEN-REFACTOR cycle — write a failing test, watch it fail, implement the minimal code, watch it pass, then refactor.
---

# Test-Driven Development

**Announce:** "I'm using the test-driven-development skill."

## The cycle (RED-GREEN-REFACTOR)

1. **RED** — Write a failing test that defines "correct" for the next small behavior.
2. **Run it** to confirm it fails (and that it fails for the RIGHT reason — a real assertion, not an
   import error or typo).
3. **GREEN** — Write the minimal code to make it pass. Don't add anything extra.
4. **Run it** to confirm it passes.
5. **REFACTOR** — Clean up, keeping tests green.
6. **Commit.**

## Rules

- One behavior per test cycle. No test → no code.
- If a test doesn't fail first, you haven't written a test for a real behavior — check it.
- Do not write code before its test exists. If you already wrote code without a test, delete it and
  write the test first.
- Do not weaken or delete a failing test to make it pass; fix the code.
- Run the actual test command and report the real output. No claim of green without running it.

## Verification

After the cycle, run the project test command (from `AGENTS.md`, e.g. `pytest tests/ -q` or
`poetry run pytest tests/ -q`) and confirm green before committing. See
`verification-before-completion`.
