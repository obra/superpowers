# Ralph Iteration Prompt

This prompt is fed to Claude CLI for each iteration.

## Context Loading

Read these files fresh each iteration:
1. `specs/*.md` - Requirements
2. `IMPLEMENTATION_PLAN.md` - Task queue
3. `.ralph/progress.txt` - Iteration history
4. `GUARDRAILS.md` - Rules and limits

## Iteration Flow

1. **Orient**: Parse progress.txt, identify current state
2. **Select Task**: Pick ONE uncompleted task from plan
3. **Check**: Verify task not already done (search codebase)
4. **Implement**: Use hyperpowers:test-driven-development
5. **Validate**: Use hyperpowers:verification-before-completion
6. **Review**: Use hyperpowers:requesting-code-review
7. **Update**: Write outcome to progress.txt
8. **Commit**: Git commit the changes
9. **Exit**: End iteration (loop restarts fresh)

## Failure Handling

On ANY failure:
1. Write failure details to progress.txt
2. Include learnings for next iteration
3. Exit immediately (code 1)

Next iteration will diagnose with FRESH context.

## Exit Codes

- 0: Task completed successfully
- 1: Task failed (next iteration will retry)
- 2: Plan exhausted (all tasks done)
- 3: Stuck detected (3+ similar iterations)
- 4: Hard limit reached
