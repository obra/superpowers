---
name: systematic-debugging
description: Use when a bug, test failure, or unexpected behavior appears and root cause is not yet proven.
---

# Systematic Debugging

Do root-cause investigation before proposing fixes.

## Iron Law

No fix without evidence for root cause.

## Four Phases

1. **Investigate**
- Read full error output.
- Reproduce reliably.
- Check recent changes.
- Add instrumentation at component boundaries.
- Trace data/control flow to source.

2. **Compare Patterns**
- Find known-good implementation in repo.
- Compare behavior/config/assumptions.
- List concrete differences.

3. **Hypothesize and Test**
- State one hypothesis.
- Run the smallest test/change to validate it.
- If disproven, form a new hypothesis (do not stack guesses).

4. **Fix and Verify**
- Add failing regression test first.
- Apply one focused fix.
- Re-run tests and confirm issue resolved.

## Escalation Rule

If 3 fix attempts fail, stop and discuss architecture with the user before continuing.

## Red Flags

- "Quick fix now, investigate later"
- Multiple changes in one attempt
- Proposal without reproduction evidence
- Claiming success without re-running verification

## Supporting References

- `root-cause-tracing.md`
- `defense-in-depth.md`
- `condition-based-waiting.md`

## Related Skills

- `test-driven-development`
- `verification-before-completion`
