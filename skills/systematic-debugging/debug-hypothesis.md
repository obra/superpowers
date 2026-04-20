# Debug Hypothesis

Use this module before the standard `systematic-debugging` phases.

Its job is to stop guess-and-check debugging and force a minimal evidence loop before deeper investigation or fixes.

**Core principle:** you may not write a fix until you have evidence that your hypothesis is correct.

## Goal

- Capture the actual symptoms before interpretation
- Generate multiple possible causes instead of locking onto the first idea
- Define a minimal validation step for the current root hypothesis
- Record the reasoning in `DEBUG.md` so it survives context loss

## When to Use

- The root cause is not immediately obvious
- The bug survived one failed fix attempt
- The system is complex, multi-component, or timing-sensitive
- The issue is flaky, environment-specific, or hard to reason about from one stack trace
- You feel tempted to "just try something" before gathering evidence

## When to Keep It Brief

- A compiler, linter, or runtime error already points to a precise single-line cause
- The failure is a typo, missing import, or similarly mechanical issue

Even in those cases, do a short preflight instead of skipping it.

## Required Outputs

Write the following to `DEBUG.md` before continuing:

- `## Observations`
- `## Hypotheses`
- `## Experiments`

## The Loop

```
OBSERVE -> HYPOTHESIZE -> EXPERIMENT -> CONCLUDE
```

## Step 1: Observe

Write down raw facts before interpretation.

- Reproduce the bug and capture the exact error, crash, or wrong output
- Identify what works and what does not
- Note environment details if they could matter
- Separate known facts from assumptions

## Step 2: Hypothesize

Generate multiple possible causes.

- List 3-5 hypotheses when the cause is non-trivial
- For each one, record:
  - `Supports`
  - `Conflicts`
  - `Test`
- Mark one as the current `ROOT HYPOTHESIS`

Do not treat "I already know the issue" as a reason to skip this step.

## Step 3: Experiment

Define the smallest validation step for the current root hypothesis.

- Change one variable at a time
- Keep the experiment tiny
- Prefer logs, assertions, probes, or isolated checks over production fixes
- Record whether the hypothesis was confirmed, rejected, or inconclusive

## Step 4: Conclude

Decide what happens next before entering the main debugging workflow.

- If the hypothesis is confirmed, proceed into `systematic-debugging` with a grounded root-cause direction
- If rejected, promote the next hypothesis and repeat the loop
- If all hypotheses fail, gather more observations before proposing solutions

## Hard Rules

1. Write the reasoning to `DEBUG.md`
2. Do not write production fix code during Observe, Hypothesize, or Experiment
3. Do not skip hypotheses because one guess feels obvious
4. Do not bundle multiple changes into one experiment

## Common Failure Modes

| Failure | Correction |
|---|---|
| "Let me try a quick fix first" | Write the hypothesis and the validation step first. |
| "The error is obvious" | Record why it is obvious and what evidence confirms it. |
| "I only have one theory" | Generate alternatives across data, logic, environment, and state. |
| "I'll test two things at once" | Split the experiment so the result is interpretable. |

## Exit Criteria

You can continue into the standard `systematic-debugging` phases only after:

- Observations are written
- At least one explicit root hypothesis exists
- A minimal experiment is defined or executed
- The current next step is justified by evidence rather than guesswork
