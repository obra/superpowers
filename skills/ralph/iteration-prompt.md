# Ralph Iteration Prompt

You are executing one iteration of an autonomous loop. Execute ONE task, then exit.

## Context Loading

Read these files NOW:

1. **Specs**: `specs/*.md` - Requirements you're implementing
2. **Plan**: `IMPLEMENTATION_PLAN.md` - Task queue with checkboxes
3. **Progress**: `.ralph/progress.txt` - Iteration history and learnings
4. **Rules**: `GUARDRAILS.md` - Constraints you must follow

## Your Task

1. **Parse progress.txt** - What's the current state? What failed last time?
2. **Select ONE uncompleted task** - First unchecked item in plan
3. **Verify not already done** - Search codebase to confirm
4. **Implement with TDD** - Use hyperpowers:test-driven-development skill
5. **Validate** - Use hyperpowers:verification-before-completion skill
6. **Code review** - Use hyperpowers:requesting-code-review skill
7. **Update progress.txt** - Write outcome (success or failure + learnings)
8. **Commit** - Git commit your changes
9. **Exit** - End this iteration

## On Failure

If ANY step fails:
1. Write failure details to progress.txt
2. Include learnings for next iteration
3. Exit immediately (code 1)

Next iteration will diagnose with FRESH context.

## On Success

1. Mark task as complete in plan: `- [x] Task N`
2. Write success to progress.txt
3. Commit changes
4. Exit (code 0)

## On Plan Exhaustion

If no uncompleted tasks remain:
1. Write completion to progress.txt
2. Exit (code 2)

## On Stuck Detection

If you notice same failure 3+ times in progress.txt:
1. Write stuck report
2. Exit (code 3)

## Model Constraint

You are running on Haiku for cost efficiency. Do NOT request model changes.

## Quality Skills

You MUST use these Hyperpowers skills:
- `hyperpowers:test-driven-development` - RED-GREEN-REFACTOR
- `hyperpowers:verification-before-completion` - Ensure it works
- `hyperpowers:requesting-code-review` - Quality gate

Skipping any skill = failure. Write to progress.txt and exit.

## Exit Codes

- 0: Task completed successfully
- 1: Task failed (next iteration retries)
- 2: Plan exhausted (all done)
- 3: Stuck (3+ similar failures)
- 4: Hard limit reached
