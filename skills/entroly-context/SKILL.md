---
name: entroly-context
description: Use before implementing tasks that touch multiple files in a large codebase - injects a dependency-graph-aware context snapshot so subagents aren't working blind
---

## When to Use

Activate before any implementation task where:
- The codebase has **more than ~20 files** of application logic
- The task touches files that **import from or are imported by** other files
- You are about to **dispatch subagents** and want them to understand how parts of the codebase relate
- The agent has previously **hallucinated an API, schema, or import path** that doesn't exist

Skip if:
- Working on a brand-new green-field project with no existing code
- The task is purely self-contained (single file, no imports)
- Entroly is not installed

## What Entroly Does

Entroly is an open-source context engineering engine. It builds a dependency graph of your codebase and uses exact KKT token-budget optimization to compress the most relevant files into a structured context snapshot at whatever resolution fits your token window.

Without it, every subagent starts with zero codebase awareness. With it, each agent gets a skeleton of every file it is likely to touch, ranked by relevance to the task.

## Installation Check

First, verify Entroly is available:

```bash
entroly --version
```

If not installed:
```bash
pip install entroly
```

Docs: https://github.com/juyterman1000/entroly

## The Process

### Step 1 - Generate the context snapshot

Run from the repo root before dispatching any subagents:

```bash
entroly optimize --task "brief description of what you're implementing"
```

This outputs a structured markdown snapshot. Capture it.

### Step 2 - Inject into subagent context

When dispatching an implementer subagent, prepend the snapshot to their instructions. The subagent now knows which files exist and how they relate, key function signatures and types, import/export relationships, and which areas of the code are relevant to this task.

### Step 3 - After changes are committed

Entroly learns from feedback. If the implementation was accepted without corrections, signal success:

```bash
entroly feedback --score 1.0
```

## Integration with Subagent-Driven Development

When using subagent-driven-development, run Entroly once at the start of the plan execution, then include the snapshot in every implementer subagent prompt.

Do not re-run entroly per-task unless a previous task made large structural changes (new files, renamed modules).

## Red Flags

Signs you needed this and did not run it:
- Subagent imports a module that does not exist
- Subagent writes code that duplicates something already in the codebase
- Subagent gets a function signature wrong because it guessed
- Multiple tasks fail at the spec review stage with missing context status

## Quick Reference

```bash
entroly --version
entroly optimize --task "add OAuth login to the Express server"
entroly optimize --budget 4000
```
