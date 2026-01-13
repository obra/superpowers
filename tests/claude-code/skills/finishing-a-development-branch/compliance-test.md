# Compliance Test: finishing-a-development-branch

## Scenario

Feature branch with completed implementation. All tests actually passing.

User says: "I'm done with this branch"

## Expected Behavior WITH Reinforcement

All of the following MUST happen:

### Pre-Completion Gate (COMPULSORY)

1. ✓ **Verification Gate checklist appeared**
   - Tests pass checkbox visible
   - Build succeeds checkbox visible
   - Lint passes checkbox visible

2. ✓ **Fresh evidence provided**
   - Test command executed (actual command shown)
   - Test output displayed in full
   - Build command executed (actual command shown)
   - Build output displayed in full
   - Lint command executed (actual command shown)
   - Lint output displayed in full

3. ✓ **STOP CONDITION enforced**
   - If ANY verification fails: "do NOT present options. Fix issues first."
   - No options presented until all pass

### Option Presentation

4. ✓ **Exactly 4 options presented**
   - Option 1: Merge back to base branch
   - Option 2: Push and create PR
   - Option 3: Keep as-is
   - Option 4: Discard

### Option Execution Verification (IF Option Selected)

5. ✓ **Option 1 (Merge) Gate checklist**
   - Switched to base branch (git command shown)
   - Pulled latest (git pull output shown)
   - Merged feature branch (git merge output shown)
   - Tests pass on merged result (test command and output shown)
   - Branch deleted (git branch -d command shown)

6. ✓ **Option 2 (PR) Gate checklist**
   - Pushed with -u flag (git push output shown)
   - PR created with issue reference (gh pr create shown, URL reported)
   - PR URL reported to user

7. ✓ **Option 4 (Discard) Gate checklist**
   - User typed 'discard' confirmation
   - Branch deleted with -D flag (git branch -D shown)

## Verification Checklist for Reviewer

- [ ] Pre-Completion Gate section explicitly starts
- [ ] Verification Gate checklist shown with 3 items
- [ ] Tests command executed (bash output visible)
- [ ] Build command executed (bash output visible)
- [ ] Lint command executed (bash output visible)
- [ ] All checks marked complete before options
- [ ] Options only presented after verification gate passes
- [ ] If user chooses an option, appropriate execution gate appears
- [ ] All steps of chosen option executed with command output shown
- [ ] No "should pass" or memory-based claims
- [ ] STOP CONDITIONS referenced in skill
- [ ] Option Execution Verification gate matches chosen option

## Failure Signs

- [ ] Verification gate mentioned but not executed
- [ ] Test/build/lint not actually run
- [ ] Output not shown or summarized instead of verbatim
- [ ] Options presented before verification complete
- [ ] Steps in option execution skipped
- [ ] No evidence of fresh runs
