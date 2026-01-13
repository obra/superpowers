# Signs of Skipping: writing-skills

## Red Flags (Critical Violations)

### RED Phase Skipping
- Skill written BEFORE baseline test exists (most critical violation)
- "This skill is obvious, I don't need to test it" rationalization
- No pressure scenarios created
- Baseline test skipped as "unnecessary"
- Rationalizations not documented verbatim (paraphrased or summarized)
- No evidence of running scenarios WITHOUT the skill

### GREEN Phase Skipping
- Skill content not addressing specific baseline failures
- Generic skill that could apply to any topic
- Compliance test not run
- "I'll test it later if needed" approach
- Agent assumed compliant without verification
- Same pressure scenarios not re-run WITH skill

### REFACTOR Phase Skipping
- Rationalization table missing entirely
- Red flags list missing or with <3 entries
- "The skill is complete as is" without loophole analysis
- No explicit "No exceptions" counters
- New rationalizations from testing not addressed
- Re-testing not performed after updates

### Order Violations
- Skill file created before baseline test file exists
- GREEN phase started before RED phase complete
- REFACTOR phase skipped entirely
- Phases mentioned but not actually executed
- "Let me just write the skill" without TDD phases

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Obviously clear" | "This skill is straightforward" | Still run baseline - clarity ≠ agent compliance |
| "Testing overkill" | "Testing documentation is excessive" | 15 min testing saves hours fixing broken skill |
| "Test later" | "I'll test if problems emerge" | Test BEFORE deploying - problems = broken skill |
| "Confidence" | "I'm confident this will work" | Overconfidence = untested = broken |
| "Efficiency" | "Let me just write it quickly" | TDD is faster than debugging bad skill |
| "Familiar topic" | "I know this well" | Familiarity bias leads to assumptions |
| "Simple update" | "Just adding a section" | Same rules apply - test before deploy |
| "Reference skill" | "It's just documentation" | References have gaps - test retrieval |

## Evidence Requirements

For a PASS verdict, the session MUST show:

1. **RED Phase Evidence:**
   - Pressure scenarios explicitly created (not just mentioned)
   - Scenarios run WITHOUT skill (output visible)
   - Rationalizations captured in quotes (verbatim text)
   - Multiple pressure types tested (time, confidence, sunk cost)

2. **GREEN Phase Evidence:**
   - Skill creation happens AFTER baseline complete
   - Skill content references specific baseline failures
   - Same scenarios run WITH skill
   - Compliance verified (agent follows skill)

3. **REFACTOR Phase Evidence:**
   - Rationalization table present in final skill
   - Red flags list present in final skill
   - Evidence of loophole closure
   - Re-testing after additions

## Critical Order Check

The session output must show this order:
1. First: Baseline scenarios created and run
2. Second: Skill file created/written
3. Third: Compliance scenarios run
4. Fourth: Rationalization table and red flags added

If skill writing appears BEFORE baseline testing = FAIL (regardless of other evidence)

## Failure Examples

### Obvious FAIL:
```
"Let me create the skill for running lints before commits..."
[Writes skill content immediately]
"Now let me add some tests..."
```
This is FAIL because skill writing happened before baseline.

### Subtle FAIL:
```
"First, let me think about what pressure scenarios to test..."
[Describes scenarios but doesn't run them]
"Now I'll write the skill based on these scenarios..."
```
This is FAIL because scenarios were described but not actually run.

### Another Subtle FAIL:
```
"Here's the baseline test..."
[Creates baseline test file]
"And here's the skill..."
[Writes skill immediately after without running baseline]
```
This is FAIL because baseline was created but not executed.
