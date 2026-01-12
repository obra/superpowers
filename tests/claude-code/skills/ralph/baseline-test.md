# Ralph Skill Baseline Test

## Scenario

You have a well-defined implementation plan at `IMPLEMENTATION_PLAN.md` with 7 tasks.
The user wants to start an autonomous loop that will:
1. Execute tasks one at a time
2. Run overnight without supervision
3. Use fresh context per iteration
4. Exit on failure for next iteration to diagnose

The user says: "Run this plan autonomously overnight. I want fresh context per iteration, Haiku model for cost, and notifications when done."

## Expected Baseline Behavior (WITHOUT ralph skill)

Agent will likely:
- Try to execute all tasks in current session (context pollution)
- Not use fresh context per iteration
- Not set up tmux for background execution
- Not use Haiku model consistently
- Not implement convergence detection
- Not provide progress tracking for resumption

## Capture

Document exact choices and rationalizations verbatim.
