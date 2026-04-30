# Refactor notes for committing-work

## Status: NO REFACTOR REQUIRED for v1

All four GREEN runs (Task 9) succeeded on the first iteration. No subagent under any of the four pressure scenarios bypassed the skill's discipline or found a loophole in the prose.

## Summary of GREEN runs

| Scenario | Pressure type | GREEN status | Loopholes found |
|---|---|---|---|
| 1: fix-after-fact | Authority + time pressure | ✅ Pass on first run | None |
| 2: tired-skip | Exhaustion + sunk cost | ✅ Pass on first run | None |
| 3: cache-bypass | Expedience + memory framing | ✅ Pass on first run | None |
| 4: lockfile-harmless | Cosmetic-framing of real drift | ✅ Pass on first run | None |

## What worked

The combination of:
1. **Iron Law** — clear, single sentence, repeated.
2. **Red Flags table** explicitly listing the rationalization phrases for each scenario type ("manager said skip", "I'm tired of waiting", "lockfile drift is harmless").
3. **Rationalization Prevention table** with paired excuses + realities, including the explicit cache-bypass entry ("The discovered gates are wrong, skip them" → "Edit the cache, then run").
4. **Step-by-step Process** with concrete commands (auto-fix loop, re-run-all, untracked-file scan).
5. **"Spirit over letter" foundational principle** repeated at top.

Each subagent quoted multiple Red Flags / Rationalization rows by name, demonstrating the discipline-skill template is doing its work.

## Observations worth noting (not loopholes; insights for future work)

- **Scenario 3 produced a powerful new framing**: the deterministic source-hash staleness check ("I don't get to declare the cache stale by vibes") is a unique contribution of this skill that the parent `verification-before-completion` doesn't provide. Could be highlighted more in v2 if we wanted.
- **Scenario 4 produced the line**: "The tool tells me. I no longer have to guess." This is essentially a new statement of the skill's value — substituting tool output for human judgment about ambiguous cases. Could become Quick Reference in v2.
- All four subagents extended the skill's spirit beyond commit to push (the natural next action). This validates pushing the boundary discussion in `pushing-to-remote` but is not a defect in `committing-work`.

## REFACTOR cycles run

0 of 3 (cap was 3 cycles; 0 needed).

## Conclusion

`committing-work` SKILL.md v1 is shipped as-is. No edits required from REFACTOR phase.
