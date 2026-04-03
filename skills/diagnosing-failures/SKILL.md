---
name: diagnosing-failures
description: "Use when a tool, CLI, or process fails or produces unexpected results — BEFORE proposing any workaround. Forces exhaustive root cause analysis."
---

# Diagnosing Failures

## Overview

When something breaks, the natural instinct is to hypothesize a cause and build a workaround. This is wrong more often than you'd expect. This skill forces you to gather evidence and consider ALL possible causes before committing to a fix.

**The iron law: you must list at least 3 possible root causes before proposing any fix.**

If you can't think of 3, you don't understand the problem space well enough. The correct diagnosis is often not the first one that comes to mind.

**Origin:** In PR #62, Codex CLI was killed by a 2-minute bash timeout while actively working. This was misdiagnosed as "hitting output limits." The same root cause (timeout) was independently misdiagnosed for Gemini CLI as "MCP initialization overhead." An entire API workaround was built for a problem that only required changing `timeout: 120000` to `timeout: 1200000`. The user had to ask "are we 100% certain?" three times before the actual output was read.

## When to Use

- A CLI tool "hangs" or produces no output
- A process is "too slow"
- An agent reports a tool "failed" or "hit a limit"
- Something worked before and now doesn't
- You're about to say "X is broken, let me build Y to work around it"

**The trigger phrase in your own thinking: "I should build a workaround."** If you catch yourself thinking this, invoke this skill first.

## Step 1: Gather Raw Evidence

NOT summaries. NOT what an agent told you happened. The actual output.

- **Full output:** Read the raw stdout/stderr. If an agent ran the command, find the agent's tool result and read it.
- **Exit code:** Was it 0 (success), 1 (error), 137 (killed by signal), 143 (terminated)?
- **Timing:** How long did it run? What was the timeout set to? Did elapsed time equal the timeout?
- **Comparison:** Did similar tools/commands have the same issue? If two independent things "fail" the same way, suspect shared infrastructure (timeout, env, network), not the tools themselves.

**If you don't have the raw output, you don't have evidence. Go get it.**

## Step 2: List At Least 3 Root Causes

For whatever you observed, write down at least 3 possible explanations. Force yourself past the obvious first guess.

Example from the real incident:

| #   | Possible Root Cause                    | What evidence would confirm it                                                      | What evidence would rule it out                                 |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | CLI hit an internal output/token limit | Output ends with a truncation message or the CLI's own error                        | Output ends mid-sentence at exactly the timeout boundary        |
| 2   | Bash timeout killed the process        | Exit code 137, elapsed time equals timeout, output ends abruptly                    | Process exited on its own with exit code 0 or 1                 |
| 3   | MCP server initialization is slow      | Startup logs show MCP connection attempts, most time spent before first real output | First output appears quickly, most time is spent on actual work |

## Step 3: Check Evidence Against Each Hypothesis

For each root cause, check the confirming and ruling-out evidence. Eliminate hypotheses that don't fit the data. Be honest — if the evidence is ambiguous, say so.

**The correct diagnosis is the one the evidence supports, not the one that feels most plausible.**

## Step 4: Propose Solutions (Exhaustive)

Only after you have a confirmed root cause, list ALL possible solutions with tradeoffs. Don't jump to the first fix. The pattern:

| Solution | Effort | Addresses Root Cause? | Tradeoffs |
| -------- | ------ | --------------------- | --------- |
| ...      | ...    | ...                   | ...       |

Present to the user for decision unless the answer is obviously clear.

## Step 5: Measure

After applying the fix, confirm it actually worked. Add instrumentation so you'll know if the problem recurs. Log timing, exit codes, success/failure — whatever's relevant.

## Anti-Patterns

| Pattern                                                 | Why it's wrong                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| "Agent said it hit a limit"                             | Agents summarize — they can be wrong. Read the raw output.                   |
| "It's too slow, let me build a faster alternative"      | Define "too slow" with numbers. Measure first.                               |
| "Two tools are broken"                                  | Two tools failing the same way = one shared cause, not two independent bugs. |
| "I'll build a workaround and we can switch back later"  | Workarounds become permanent. Fix the root cause.                            |
| "The fix is obvious, I don't need to list alternatives" | The Gemini API workaround was "obvious" too. It was wrong.                   |
