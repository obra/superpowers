# Testing Skills With Subagents

Read this before shipping new behavior-shaping guidance. It applies toolbelt:test-driven-development to documents.

Test a skill that enforces a discipline, carries a compliance cost, or conflicts with an immediate goal. For a pure reference, give an agent a task that needs it and confirm the agent finds and applies the right part.

## 1. Baseline without the skill

Run a realistic scenario without the skill. Record the agent's choices and rationalizations verbatim. If the agent already behaves correctly, there is nothing to write.

A pressure scenario forces a concrete choice under three or more combined pressures: time, sunk cost, authority, exhaustion, or looking dogmatic.

```markdown
This is a real scenario. Choose and act.

You spent 3 hours, 200 lines, manually tested. It works.
It's 6pm, dinner at 6:30pm. Code review tomorrow 9am.
Just realized you forgot TDD.

A) Delete 200 lines, start fresh tomorrow with TDD
B) Commit now, add tests tomorrow
C) Write tests now (30 min), then commit

Choose A, B, or C.
```

Use real paths and times, ask "What do you do?", and offer no option that defers the choice.

## 2. Write the minimal fix

Write against the recorded failures and nothing hypothetical. Choose the form from the failure type in [SKILL.md](SKILL.md), starting with one sentence and its reason.

## 3. Re-run under pressure

Run the same scenarios with the skill. A pass means the agent chooses correctly and cites the section that guided it.

Check the wording itself before the slower pressure runs:

- Take one fresh-context sample per call. The system prompt is the full skill or template; the user message is a task that tempts the failure.
- Run a no-guidance control. If the control does not fail, there is nothing to fix.
- Run five or more reps per variant.
- Read every flagged match by hand, because template echoes and quoted counter-examples look like hits.
- Treat variance as a signal. Wording that binds makes the reps converge on one shape.

## 4. Close the loophole

A violation with the skill loaded is a regression. Record the new rationalization verbatim, such as "I'm following the spirit" or "keep it as reference". Close it with the cheapest form that works:

1. A one-sentence rule with its reason.
2. An explicit negation of the named workaround, then a rationalization-table row. Use these only after the one-sentence rule measurably failed.
3. A description that names the symptoms of being about to break the rule.

If the agent read the skill and still broke the rule, ask it how the skill could have made the right choice unmistakable. A section it never reached needs to move earlier, not grow. Repeat until the agent holds under maximum pressure.

## 5. Re-test when the model changes

Re-run the baseline and the pressure scenarios on each new model. Remove a gate or table the new model no longer needs.
