# Batch Development Baseline Test

## Purpose

Document expected behavior of batch-development skill WITHOUT verification gates.
This establishes a baseline before reinforcement.

## Test Scenario

Given a plan with 6 tasks and batch-size=2, Claude should:

1. Load the plan and analyze it
2. Present branch creation offer (if on main)
3. Present status update offer (if issue tracked)
4. Execute tasks 1-2
5. Report results and wait for feedback
6. Receive feedback, execute tasks 3-4
7. Report results and wait for feedback
8. Receive feedback, execute tasks 5-6
9. Report results and wait for feedback
10. Run verification-before-completion
11. Cleanup transient files
12. Run finishing-a-development-branch

## Expected Behavior WITHOUT Gates

- May proceed to next batch without waiting for feedback
- May skip batch verifications
- May not present pre-execution offers
- May report "ready" before verification complete

## Baseline Violations to Look For

1. **Proceeding without feedback**: Moving to next batch without user response
2. **Skipping verifications**: Not running tests after each task
3. **Missing offers**: Not presenting branch/status offers at start
4. **False confidence**: Saying "ready for feedback" before verification
