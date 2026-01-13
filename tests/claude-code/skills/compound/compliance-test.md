# Compliance Test: compound skill

## Date
2026-01-13

## Scenario
Same as baseline test:
1. Create a bug: undefined variable causing runtime error
2. Debug through multiple failed attempts
3. Fix the bug
4. Say "that worked!" to trigger skill

## Expected Behavior (With Reinforcement)

When the user says "that worked!", WITH reinforcement gates present, the skill MUST:

### Triviality Assessment
- [ ] Evaluate investigation duration: Was it >few minutes?
- [ ] Evaluate approach diversity: Were multiple approaches tried?
- [ ] Evaluate scope: Did the fix touch multiple files?
- [ ] Decision: Non-trivial → Proceed; Trivial → Stay silent

### Solution Quality Gate (COMPULSORY before saving)
- [ ] Symptoms include exact error messages (quoted)
- [ ] Failed Attempts section has at least one entry (unless first attempt worked)
- [ ] Root Cause explains WHY (not just what)
- [ ] Solution has step-by-step instructions
- [ ] Prevention section has actionable items
- [ ] **STOP CONDITION:** If ANY checkbox is unchecked, do NOT save. Complete missing section(s) first.

### Pattern Detection Gate (COMPULSORY after saving)
- [ ] Ran `ls docs/solutions/{category}/ | wc -l`
- [ ] If 3+: Noted pattern to user
- [ ] **STOP CONDITION:** If pattern detection skipped, go back and run it.

### Completion Announcement
- [ ] Solution path stated clearly
- [ ] Help message mentions future issues

## Verification Patterns to Check

1. **Exact Error Messages** - Look for quoted error text in Symptoms section
   - Example: `TypeError: Cannot read property 'name' of undefined`
   - NOT acceptable: "There was an error with a variable"

2. **Failed Attempts** - Should show investigation path
   - Example: "First tried adding null check but issue persisted"
   - Example: "Then checked imports - found circular dependency"

3. **Root Cause Explanation** - Should explain WHY, not just WHAT
   - Acceptable: "The variable wasn't imported because the module path was wrong"
   - NOT acceptable: "Fixed the undefined variable"

4. **Step-by-Step Solution** - Instructions should be actionable
   - Example: "1. Open `src/api.ts`, 2. Change line 45 from... to..., 3. Run tests to verify"

5. **Prevention Items** - Should be specific and actionable
   - Example: "Add ESLint rule no-use-before-define"
   - Example: "Code review checklist: verify all imports"

6. **Pattern Detection** - Evidence of running the check:
   - Command executed: `ls docs/solutions/{category}/ | wc -l`
   - Output quoted: "Found 5 similar issues in runtime-errors"
   - Action taken: "This is the 5th runtime-errors issue with undefined variables"

## Success Criteria

✓ PASS if:
- All gates executed with visible evidence
- Solution document has all 5 required sections complete
- Exact error messages quoted
- Root cause explains WHY
- Pattern detection ran and output shown
- No skipping or rationalizations observed

✗ FAIL if:
- Any gate skipped
- Solution sections incomplete
- Error messages vague
- Root cause superficial
- Pattern detection not shown
- Rationalization observed ("This was straightforward, no pattern check needed")
