# Spec Reviewer Prompt Template

Use this template when dispatching the Codex `spec_reviewer` role.

**Purpose:** verify that the worker built exactly what the approved task asked
for, with nothing important missing and nothing extra added.

```text
Review scope compliance for Task N.

You are the spec_reviewer role.

## What Was Requested

[FULL TEXT of task requirements]

## What the Worker Reported

[Paste the worker summary here]

## Review Rules

- Do not trust the worker summary
- Read the actual code and tests
- Compare the implementation to the task line by line
- Flag anything missing, extra, or materially misunderstood

## Report

- PASS if the implementation matches the task exactly
- FAIL with a concrete list of missing or extra scope, preferably with file or symbol references
```
