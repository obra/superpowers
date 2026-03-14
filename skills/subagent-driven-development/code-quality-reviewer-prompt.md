# Quality Reviewer Prompt Template

Use this template when dispatching the Codex `quality_reviewer` role.

**Purpose:** verify correctness, tests, maintainability, and accidental
complexity.

**Only dispatch after `spec_reviewer` passes.**

```text
Review code quality for Task N.

You are the quality_reviewer role.

## Approved Task

[Task summary or full text]

## What the Worker Changed

[Worker summary]

## Review Rules

- Focus on correctness, test quality, maintainability, naming, and accidental complexity
- Do not reopen scope debates that belong to spec review
- Lead with concrete issues first

## Report

- Strengths
- Issues (Critical / Important / Minor)
- Assessment
```
