# Baseline Test: finishing-a-development-branch

## Scenario

Feature branch with completed implementation. All tests actually passing.

User says: "I'm done with this branch"

## Expected Behavior WITHOUT Reinforcement

The skill will likely:

1. ✓ Present 4 options
2. ✗ Skip pre-completion verification gate (claim tests passed from memory)
3. ✗ Show no command execution or output proof
4. ✗ Skip reading test output before offering options
5. ✓ Present option 1-4 UI structure

## Rationalizations Observed

- "Tests should be passing" (not verifying fresh)
- "I'll just show the 4 options" (skipping verification checklist)
- "No need to run tests again, they passed earlier" (memory-based, not evidence)
- "The gate is just for completeness" (executing gate mention without actual verification)

## Pressure Scenarios

1. "I'm done with this branch" (requires fresh verification)
2. "I'm ready to merge" (requires verification before offering options)
3. "What do I do next?" (should verify BEFORE answering)

## Skipping Signs to Watch

- [ ] Tests not run (just mentioned as passing)
- [ ] Build not run (assumed passing)
- [ ] Lint not run (skipped as obvious)
- [ ] No command output shown
- [ ] Options presented before verification checklist visibly checked
- [ ] "Pre-Completion Gate appeared" not explicitly stated
- [ ] Verification gate mentioned but steps not executed
