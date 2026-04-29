---
name: pi-review
description: Use when needing external code review of git changes or design document review before implementation, or when the user asks for a pi review
---

# Pi Review

Use the `reviewer` subagent to get an independent review of code changes or design documents.

## Default Model

The `reviewer` builtin agent defaults to `openai-codex/gpt-5.5`. If the user does not specify a model, use the builtin default. To override, pass `model` to the subagent call or set a persistent override in `.pi/settings.json`:

```json
{
  "subagents": {
    "agentOverrides": {
      "reviewer": {
        "model": "deepseek/deepseek-v4-pro"
      }
    }
  }
}
```

## When to Use

- When you want an independent second opinion on code or a design document
- Before implementing a design doc — catch gaps and missing steps early
- Before committing — review uncommitted changes
- Before creating a PR — review branch changes
- After a complex change — get independent review from a fresh context

## Two Modes

### 1. Design Doc Review

Review a design document by dispatching the `reviewer` agent with the file in `reads`:

```typescript
subagent({
  agent: "reviewer",
  task: `Review ${filePath} for correctness, completeness, and potential issues. Focus on: async/await patterns, SQLite concurrency, Flask route safety, and whether the semaphore approach is appropriate for the resolver.`,
  reads: [filePath],
  output: "review-design.md",
});
```

Then read `review-design.md` and present the findings.

**Custom focus areas:** replace the prompt with project-specific focus bullets.

### 2. Code Diff Review

Review git changes by passing the diff in the task or letting the reviewer inspect it directly:

```typescript
// Let reviewer inspect the repo and diff directly
subagent({
  agent: "reviewer",
  task: "Review the uncommitted changes in this repo for bugs, security vulnerabilities, missing error handling, and code quality issues. Inspect git diff directly.",
  output: "review-diff.md",
});
```

Or, for a specific base branch:

```typescript
subagent({
  agent: "reviewer",
  task: "Review the changes on the current branch compared to main for bugs, security vulnerabilities, missing error handling, and code quality issues. Inspect git diff main... directly.",
  output: "review-branch.md",
});
```

The `reviewer` agent has access to `bash`, `read`, and other tools, so it can run `git diff` itself and inspect files directly.

### 3. Specific Commit Review

```typescript
subagent({
  agent: "reviewer",
  task: `Review commit ${sha} for bugs, security vulnerabilities, missing error handling, and code quality issues. Inspect the commit directly.`,
  output: "review-commit.md",
});
```

## Quick Reference

| Want to review... | Approach                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| Design doc        | `subagent({ agent: "reviewer", reads: [file], task: "Review..." })`      |
| Uncommitted work  | `subagent({ agent: "reviewer", task: "Review uncommitted changes..." })` |
| Branch vs main    | `subagent({ agent: "reviewer", task: "Review changes vs main..." })`     |
| Single commit     | `subagent({ agent: "reviewer", task: "Review commit <sha>..." })`        |

## Context Mode

- **Fresh context (default)** — the reviewer starts with minimal history and inspects the repo/diff directly. Best for adversarial code review.
- **Forked context** — `context: "fork"` creates a branched child that inherits parent session history. Use only when you want the reviewer to understand the design decisions that led to the current code.

```typescript
// Fresh adversarial review (default)
subagent({
  agent: "reviewer",
  task: "Review the auth module for security issues",
});

// Forked review with inherited context
subagent({ agent: "reviewer", task: "Review my approach", context: "fork" });
```

## Review Output

The `reviewer` agent can:

- Identify bugs, security issues, and quality problems
- Suggest fixes and improvements
- Edit code directly when appropriate

Capture structured output with the `output` parameter, then read it and present findings to the user organized by severity.

## Related Skills

- For iterative doc refinement (review → fix → re-review until clean), use `pi-refine` instead.
