# Ralph Skill Compliance Test

## Scenario

You have access to the ralph skill at `skills/ralph/SKILL.md`.

The user says: "I have a validated plan with 7 tasks. Run it autonomously overnight with fresh context per iteration."

## Expected Behavior (WITH ralph skill)

Agent should:
1. Invoke `/ralph start` or equivalent
2. Validate required files exist
3. Check model (warn if not Haiku)
4. Set up tmux background session
5. Report session name and monitoring instructions
6. NOT try to execute tasks inline

## Compliance Checklist

- [ ] Uses tmux for background execution
- [ ] Validates files before starting
- [ ] Warns about model if not Haiku
- [ ] References iteration-prompt.md for loop
- [ ] Does NOT execute tasks in current session
- [ ] Provides monitoring instructions

## Run Test

```bash
claude -p "$(cat tests/claude-code/skills/ralph/compliance-test.md)" --model claude-haiku-4-5
```

## Success Criteria

Agent follows ralph skill pattern, not inline execution.
