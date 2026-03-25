# TDD Verification Reviewer Prompt Template

Use this template when dispatching a TDD verification subagent.

**Purpose:** Verify that the implementer actually followed TDD (Red-Green-Refactor), not just "wrote tests after code."

**Dispatch timing:** After implementer reports DONE, before spec compliance review.

```
Task tool (general-purpose):
  description: "Verify TDD compliance for Task N"
  prompt: |
    You are verifying whether an implementer followed Test-Driven Development.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## What Implementer Claims

    [From implementer's report — files changed, tests written, etc.]

    ## Your Job

    Investigate the git history and file timestamps to determine whether tests
    were written BEFORE production code. This is not about whether tests exist —
    it's about whether the RED-GREEN-REFACTOR cycle was followed.

    ## Investigation Steps

    1. **Check git log for the task's commits:**
       - Run: `git log --oneline --name-only` for recent commits
       - Look at commit order: test files should appear in commits BEFORE
         or IN THE SAME commit as production code
       - If all tests appear in a single final commit with all production code,
         that's a red flag (batch commit, not TDD)

    2. **Check test file creation timestamps vs production files:**
       - Run: `git log --diff-filter=A --name-only` to see when files were first added
       - Test files (*.test.*, *.spec.*, test_*) should be created
         before or alongside their production counterparts

    3. **Check test quality signals:**
       - Do tests test BEHAVIOR (what it does) or IMPLEMENTATION (how it does it)?
       - Are there tests that just verify mocks exist? (anti-pattern)
       - Do tests have meaningful assertions or just "expect(true).toBe(true)"?
       - Are edge cases covered or just happy path?

    4. **Check for TDD anti-patterns:**
       - All tests passing immediately (never went RED)
       - Tests that mirror implementation structure 1:1 (written after, to match)
       - No refactoring commits (skipped REFACTOR phase)
       - Test file is a single large commit (batch-written after implementation)

    ## Report Format

    Report:
    - **TDD Compliance:** ✅ VERIFIED | ⚠️ PARTIAL | ❌ NOT FOLLOWED
    - **Evidence:** Specific git commits, timestamps, patterns observed
    - **Issues:** What went wrong (if any)
    - **Recommendation:** What to fix (if ⚠️ or ❌)

    **✅ VERIFIED:** Clear evidence of RED-GREEN-REFACTOR cycle.
    Tests created before or with production code. Incremental commits.

    **⚠️ PARTIAL:** Tests exist and are decent quality, but commit history
    suggests they may have been written after production code. Not a blocker
    if test quality is high, but flag it.

    **❌ NOT FOLLOWED:** No tests, or tests clearly written as afterthought.
    Production code committed without any test coverage. This IS a blocker —
    implementer must go back and follow TDD properly.
```
