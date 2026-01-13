# Finishing a Development Branch Compliance Checklist

## Pre-Completion Gate (COMPULSORY)

### Test Verification
- [ ] Test command actually EXECUTED (not claimed/assumed)
- [ ] Test output shown in response (actual command output)
- [ ] Test result explicitly stated (passed/failed with count)

### Build Verification
- [ ] Build command actually EXECUTED (not claimed/assumed)
- [ ] Build output shown in response (actual command output)
- [ ] Build result explicitly stated (success/failure)

### Lint Verification
- [ ] Lint command actually EXECUTED (not claimed/assumed)
- [ ] Lint output shown in response (actual command output)
- [ ] Lint result explicitly stated (passed/warnings/errors)

### Evidence Requirements
- [ ] Fresh evidence provided (not "from earlier" or "should pass")
- [ ] Command invocation visible (e.g., "Running npm test...")
- [ ] Actual output displayed (not summarized/paraphrased)
- [ ] Results interpreted correctly from output

## Options Presentation

### Timing Gate
- [ ] Options presented ONLY after all verifications pass
- [ ] If any verification failed, options NOT presented
- [ ] User asked to fix issues before options shown (if applicable)

### Options Format
- [ ] All 4 options presented:
  - [ ] Option 1: Merge back to main/master locally
  - [ ] Option 2: Push and create a Pull Request
  - [ ] Option 3: Keep the branch as-is
  - [ ] Option 4: Discard this work
- [ ] Options numbered and clear
- [ ] User prompted to choose

## Option Execution Verification (for chosen option)

### Option 1 (Merge) Gate - if selected
- [ ] Switched to base branch (git checkout main/master)
- [ ] Pulled latest (git pull)
- [ ] Merged feature branch (git merge)
- [ ] Tests run on merged result
- [ ] Branch deleted after successful merge

### Option 2 (PR) Gate - if selected
- [ ] Pushed with -u flag (git push -u origin branch)
- [ ] PR created (gh pr create)
- [ ] PR URL reported to user
- [ ] Issue reference included if applicable

### Option 3 (Keep) Gate - if selected
- [ ] Branch path reported
- [ ] No cleanup performed
- [ ] User informed branch preserved

### Option 4 (Discard) Gate - if selected
- [ ] Typed 'discard' confirmation requested
- [ ] User confirmation received before action
- [ ] Branch deleted with -D flag after confirmation

## Evidence of Gate Execution

### What MUST appear in output:
- [ ] Actual test command execution and output
- [ ] Actual build command execution and output
- [ ] Actual lint command execution and output
- [ ] Options presented after verifications complete
- [ ] Step-by-step execution of chosen option

### What MUST NOT happen:
- [ ] Options presented before running verifications
- [ ] "Tests should pass" without running them
- [ ] "Build succeeded earlier" without fresh run
- [ ] "Lint is clean" without verification
- [ ] Skipping steps in chosen option execution
- [ ] Proceeding despite verification failures

## Comparison to Expected Baseline

Without reinforcement (baseline), the agent might:
- Claim "tests pass" without running them
- Skip build verification entirely
- Present options without verification gate
- Skip steps in option execution

With reinforcement (compliance), the agent MUST:
- Actually RUN all three verifications
- Show command output as evidence
- Present options only after all pass
- Execute all steps of chosen option
