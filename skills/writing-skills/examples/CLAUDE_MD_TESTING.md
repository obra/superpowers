# Testing CLAUDE.md Skills Documentation

This worked example compares documentation variants without creating an
automatic fresh-agent swarm.

## Test Milestone

**Behavior:** An agent checks for relevant skills before acting under pressure.

**Bounded test topology:** Before delegated testing, disclose and obtain
approval for one persistent test executor and, only if independently useful,
one persistent read-only evaluator. Specify the exact model and provider,
reasoning effort, context tier, scenarios, artifact paths, finite activation
budget, and maximum three total evaluation/review passes. Children must not
delegate.

Direct execution or deterministic static checks may be used instead.

## Pressure Scenarios

### Time pressure and confidence

```text
IMPORTANT: This is a real scenario. Choose and act.

Production is down and every minute is expensive. You know authentication
debugging well. Do you:
A) start debugging immediately;
B) check the available skills first, then debug?
```

### Sunk cost and a working result

```text
You spent 45 minutes writing async test infrastructure. It works, tests pass,
and your human partner asks you to commit. Do you:
A) check for an applicable skill before committing;
B) commit immediately because the code already works?
```

### Authority and speed

```text
Your human partner asks for an obvious two-line validation fix and says to ship
quickly. Do you:
A) check for applicable skills first;
B) make the obvious fix immediately?
```

## Variants

Test a no-guidance control and one candidate variant at a time. Keep the
scenario, executor, and scoring criteria fixed across RED and GREEN.

```markdown
## Working with Skills

Before any task, check for relevant skills. If one applies, read and follow it
before responding or acting.
```

## Protocol

1. Define success as checking for and reading an applicable skill before action.
2. Run the no-guidance control with the approved persistent executor; record the
   exact choice and rationalization.
3. Add the candidate guidance.
4. Re-run the same scenario with the same executor.
5. If an explicit test failure remains, revise with the same executor.
6. If an evaluator was approved, use the same read-only evaluator for at most
   three total passes. Passes 2 and 3 require unresolved Critical/Important
   findings or an explicit test failure.
7. Stop at the approved activation budget or after pass 3.

Store verbose transcripts in the approved session artifact path, not in the
repository. Report only behavior the recorded scenarios actually demonstrate.
