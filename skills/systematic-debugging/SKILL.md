---
name: systematic-debugging
description: >
  Invoke BEFORE attempting any fix when a bug, test failure, error, warning,
  unexpected behavior, or performance regression appears. Enforces hypothesis-driven
  root cause analysis — no fix without evidence. Triggers on: error messages, stack
  traces, "it's broken", "not working", "bug", test failures, blank/white screens,
  "works locally but not in production", performance degradation, console warnings,
  "can't figure out why". Also routed by using-superpowers for debugging tasks.
---

# Systematic Debugging

Do root-cause investigation before proposing fixes.

## Iron Law

**No fix without evidence for root cause.**

This is non-negotiable. Every fix must trace back to a proven root cause. A fix applied without understanding why it works is not a fix — it is a mask.

## Four Phases

### Phase 0: Check Known Issues
- If `known-issues.md` exists at the project root, search it for the error message, error code, or failing test name.
- If a match is found, try the documented solution **first**. If it resolves the issue, stop — no further investigation needed.
- If no match or the documented solution doesn't work, proceed to Phase 1.

### Phase 1: Investigate
- Read the **full** error output — not just the last line.
- Reproduce the bug reliably. If you cannot reproduce, you cannot fix. For tests that fail only in certain orderings (test pollution), run `find-polluter.sh` from this skill's directory to identify which test is corrupting shared state.
- Check recent changes — what changed since it last worked?
  - If `context-snapshot.json` exists at the project root: read it. The `changed_files` and `recent_commits` fields answer this immediately without additional git commands.
  - Otherwise: run `git log --oneline -10` and `git diff HEAD~1..HEAD --name-only`.
- Add instrumentation (logging, breakpoints) at component boundaries.
- **Multi-component systems:** When the system has multiple components (CI → build → signing, API → service → database), add diagnostic logging at EACH component boundary before proposing fixes:
  ```
  For EACH component boundary:
    - Log what data enters the component
    - Log what data exits the component
    - Verify environment/config propagation
    - Check state at each layer

  Run once to gather evidence showing WHERE it breaks
  THEN analyze evidence to identify the failing component
  THEN investigate that specific component
  ```
  Example (multi-layer system):
  ```bash
  # Layer 1: Workflow
  echo "=== Secrets available in workflow: ==="
  echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

  # Layer 2: Build script
  echo "=== Env vars in build script: ==="
  env | grep IDENTITY || echo "IDENTITY not in environment"

  # Layer 3: Signing script
  echo "=== Keychain state: ==="
  security list-keychains
  security find-identity -v

  # Layer 4: Actual signing
  codesign --sign "$IDENTITY" --verbose=4 "$APP"
  ```
  This reveals which layer fails (e.g., secrets → workflow OK, workflow → build FAILS).
- Trace data/control flow backward from the error to its source.

### Phase 2: Compare Patterns
- Find a known-good implementation in the repo that does something similar.
- Compare: behavior, config, assumptions, environment.
- List concrete differences — these are your investigation leads.

### Phase 3: Hypothesize and Test

**Self-Consistency Gate** — Before committing to a hypothesis, apply multi-path reasoning (see `self-consistency-reasoner`):

1. Generate 3-5 **independent** root cause hypotheses. Vary your approach: trace forward from inputs, backward from the error, from recent changes, from similar past bugs.
2. For each path, reason independently to a conclusion — do not let earlier hypotheses contaminate later ones.
3. Take the majority-vote diagnosis. Report confidence:
   - **High** (80-100% agreement): proceed to test the majority hypothesis.
   - **Moderate** (60-79%): proceed but note the minority hypothesis — test it next if the majority fails.
   - **Low** (<=50%): **STOP.** Do not pick a hypothesis. The bug is ambiguous or multi-causal. Gather more evidence (add logging, reproduce under different conditions) before choosing a direction.

Then for the selected hypothesis:
- State it clearly before testing it.
- Run the **smallest** possible test/change to validate or disprove it.
- If disproven, discard it entirely and form a new hypothesis.
- **Never stack guesses.** One hypothesis at a time, tested in isolation.

### Phase 4: Fix and Verify
- Add a failing regression test that reproduces the bug **first**.
- Apply **one** focused fix — never bundle multiple changes.
- Re-run the full test suite and confirm the issue is resolved.

## Rationalization Table — Do Not Skip Investigation

| Temptation | Why it fails |
|---|---|
| "I know what the bug is" | You had a hypothesis, not proof. Test it. |
| "Quick fix, investigate later" | Later never comes. The mask becomes permanent debt. |
| "It's obviously this one line" | Obvious bugs get fixed in 5 minutes. If it were obvious, it would be fixed already. |
| "Let me try a few things" | Shotgun debugging creates new bugs and wastes time. |
| "The error message tells me exactly what's wrong" | Error messages describe symptoms, not causes. |
| "I'll just revert to a known-good state" | Reverts don't teach you what broke or prevent recurrence. |

## Escalation Rule

If 3 fix attempts fail, **stop**. Do not attempt a fourth. Discuss architecture with the user before continuing. The bug may indicate a design flaw, not a code defect.

## Red Flags

If you catch yourself doing any of these, **restart from Phase 1**:

- "Quick fix now, investigate later"
- Changing multiple things in one attempt
- Proposing a fix without reproduction evidence
- Claiming success without re-running verification
- "It should work now" without running the test
- Copy-pasting a fix from elsewhere without understanding why it works

## Supporting References

- `root-cause-tracing.md` — trace bugs backward through the call stack
- `defense-in-depth.md` — validation at every data layer
- `condition-based-waiting.md` — replace timeouts with condition polling

## Post-Fix: Update Knowledge Base

After resolving a bug:

1. **Recurring error?** (environment-dependent, configuration, platform-specific, external-state) → offer to add the error→solution mapping to `known-issues.md` using the format defined in `error-recovery`.

2. **Permanent constraint discovered?** (API limitation, platform behavior, library quirk that will never change) → offer to add it to `project-map.md` Critical Constraints section via `context-management`. These are facts every future session needs, not just error→fix mappings.

## Related Skills

- `self-consistency-reasoner` — multi-path reasoning for root cause diagnosis
- `test-driven-development` — write the regression test before the fix
- `verification-before-completion` — prove the fix with fresh evidence
- `error-recovery` — consult and update project-specific known issues
