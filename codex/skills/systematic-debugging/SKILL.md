---
name: systematic-debugging
description: Use when encountering any bug, test failure, build failure, flaky behavior, performance problem, or unexpected technical behavior before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and often hide the real defect. Always identify the root cause before changing implementation code.

Core principle: no fixes before root-cause investigation.

## When To Use

Use this for:
- Test failures, build failures, and CI failures
- Production bugs and unexpected behavior
- Flaky tests, timing problems, hangs, and race conditions
- Integration failures across services, tools, config, or environments
- Any issue where the first fix seems "obvious" but has not been proven

Do not skip this because the issue looks small, urgent, or familiar.

## Phase 1: Root Cause Investigation

Complete this phase before proposing or applying a fix.

1. Read errors completely.
   - Read full stack traces, warnings, exit codes, file paths, and line numbers.
   - Do not summarize an error until you have inspected the exact message.

2. Reproduce consistently.
   - Record the exact command, inputs, environment, and observed output.
   - If the issue is intermittent, gather enough runs or logs to identify the pattern.

3. Check recent changes.
   - Inspect `git diff`, relevant recent commits, dependency changes, config changes, and environment differences.
   - Preserve unrelated user or worker changes.

4. Instrument component boundaries.
   - For multi-component flows, log or inspect what enters and exits each boundary.
   - Verify environment/config propagation at each layer.
   - Run once to determine where the value or state first becomes wrong.

5. Trace bad data backward.
   - Start where the symptom appears.
   - Ask what called this code and what value it passed.
   - Keep tracing until you find the original trigger.
   - Fix at the source, then add guardrails where the bad value crosses boundaries.

## Phase 2: Pattern Analysis

Find the working pattern before writing the fix.

- Locate similar working code in the same repository.
- Read reference implementations completely when applying an existing pattern.
- List concrete differences between working and broken paths.
- Identify required dependencies, config, environment, assumptions, and ownership boundaries.

## Phase 3: Hypothesis And Minimal Test

Use one hypothesis at a time.

1. State the hypothesis: "I think X is the root cause because Y."
2. Define the smallest observation or change that can confirm or refute it.
3. Test only that variable.
4. If refuted, update the hypothesis. Do not stack speculative fixes.
5. If you do not understand the evidence, say so and gather more data or ask for help.

## Phase 4: Fix The Cause

Only start implementation after the root cause is supported by evidence.

1. Create a failing test or deterministic reproduction.
   - Prefer an automated test.
   - If no harness exists, use the smallest repeatable script, command, fixture, or documented manual check.

2. Implement one focused fix.
   - Address the proven root cause.
   - Avoid unrelated cleanup and opportunistic refactors.

3. Verify.
   - Confirm the new test or reproduction now passes.
   - Run relevant regression checks.
   - Confirm the original symptom is gone.

4. If the fix fails, stop and re-investigate.
   - After three failed fix attempts, question the architecture or core assumptions before trying another fix.

## Debugging Techniques

### Backward Tracing

When an error appears deep in the stack:
- Identify the immediate failing operation.
- Inspect who called it.
- Inspect what value was passed.
- Repeat until the origin is found.
- Fix at the origin and add validation at downstream layers.

Useful instrumentation pattern:

```typescript
console.error("DEBUG before dangerous operation", {
  value,
  cwd: process.cwd(),
  stack: new Error().stack,
});
```

Use output streams that actually appear in the current test runner or CI logs.

### Defense In Depth

For bugs caused by invalid input or state, add checks where they matter:
- Entry validation rejects invalid inputs at API or command boundaries.
- Business logic validation enforces operation-specific assumptions.
- Environment guards prevent dangerous behavior in test, CI, or production contexts.
- Debug logging preserves enough context to investigate if a guard trips.

### Condition-Based Waiting

For flaky async tests, wait for the condition being asserted rather than sleeping for an arbitrary duration.

```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const result = condition();
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
}
```

Arbitrary waits are acceptable only when testing known timing behavior; document the timing reason.

### Team Debugging

Use subagents only when the user explicitly asks for subagents, delegation, parallel agent work, reviewer workflow, or team workflow.

When team debugging is active:
- Form 2-4 mutually exclusive, testable hypotheses.
- Assign one read-only investigator per hypothesis with exact scope.
- Pass each investigator the symptoms, evidence, files to inspect, and a requirement not to modify files.
- Ask investigators to report `CONFIRMED`, `REFUTED`, or `INCONCLUSIVE` with file and line evidence.
- Synthesize the reports before assigning any fix.

## Red Flags

Stop and return to investigation if you catch yourself:
- Proposing a fix before explaining the root cause.
- Trying a change just to see what happens.
- Bundling multiple speculative changes.
- Skipping a reproduction because the fix seems simple.
- Treating an error at the symptom location instead of tracing its source.
- Attempting a fourth fix after three failed attempts without revisiting assumptions.

## Completion Standard

Before saying the issue is fixed, provide:
- Root cause and evidence.
- The focused change made.
- The failing test, reproduction, or deterministic check used.
- Fresh verification command output from the current turn.
