---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence must be attributed (what process wrote it, when) before it proves anything; evidence before assertions always
---

# Verification Before Completion

## Overview

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. ATTRIBUTE: What process wrote this output, and when? Output your own
   hand-run produced (to test the instrument) proves the instrument works
   and nothing else — it is not evidence the system acted.
5. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
6. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |
| System produced the log entry | Fresh entry written by the system acting | An entry your own hand-run probe wrote earlier |
| "It never ran" (log empty) | Independent probe confirms the instrument works where the system runs | Silence from an instrument whose output path depends on env vars you never inspected |
| User's control/guard is broken | A must-fire case producing no visible effect, after ruling out what could absorb the signal | An ask-pattern command ran without a visible prompt |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Citing an artifact without naming the process that wrote it and when
- Reading silence as absence without an independent positive probe
- Telling the user their own control/test/guard is broken without a must-fire test
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |
| "I ran the command and read the output" | Run by whom, writing what? Provenance of the output matters as much as its content |
| "The log is empty, so it never ran" | Silence is uninterpretable until the instrument is proven to work in the target environment |
| "It must not be running" | A missing effect is not evidence of absence where the signal can be swallowed elsewhere; report "I cannot demonstrate it fired" instead |

## Key Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

**Diagnostic probes:**
```
✅ Prove the probe fires (by hand) → clear it → let the system act → read fresh entries written by the system
❌ Prove the probe by hand → cite your own entry as proof the system acted
```

**Reading absence:**
```
✅ Independent positive probe in the target environment → then trust a zero as a real zero
❌ Empty log/zero matches → conclude the thing never happened
```

**Reporting on the user's existing tooling:**
```
✅ Find a case that MUST fire → verify it does → only then claim it works; if it must fire and visibly does not, first enumerate what could swallow the signal, test each, and only then report "broken"
❌ No visible effect in one case → tell the user their safety control is inert
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- Claims about absence ("never ran", "is not running")
- Claims about the user's own tooling ("your guard is broken")
- ANY communication suggesting completion/correctness
