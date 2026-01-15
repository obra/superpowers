---
description: Execute an implementation plan using your preferred approach
---

Execute an implementation plan. First, determine which execution style to use.

**COMPULSORY: Always ask the user which approach they want. Never skip this question.**

## Step 1: Parse Arguments

- Plan path: First non-flag argument (e.g., `docs/plans/feature.md`)
- `--batch-size=N`: Optional, passed to batch-development (default: 3)

## Step 2: Present Choice (MANDATORY)

Use AskUserQuestion with these options:

**Question:** "How would you like to execute this plan?"

| Option | Label | Description |
|--------|-------|-------------|
| A | Batch (human checkpoints) (Recommended) | Execute tasks in batches, pause for your feedback after each batch. You stay in control. |
| B | Subagent (automated reviews) | Fresh subagent per task with automated spec + code quality reviews. Faster, less interaction. |

**This question is COMPULSORY. Never skip it, never assume a default.**

## Step 3: Invoke Chosen Skill

- If Batch: `Skill(hyperpowers:batch-development, args: "<plan-path> --batch-size=N")`
- If Subagent: `Skill(hyperpowers:subagent-driven-development, args: "<plan-path>")`

Pass the plan path as the argument to the skill.

Follow the chosen skill EXACTLY.

These skills are available in the skills folder within the hyperpowers claude plugin. ONLY search there, do NOT look for development skills in the repo you are working in, or in other plugins. Do not assume you know how to develop without finding the SKILL.md file.

## Red Flags

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Skipping the choice question | User loses control over execution style | Present AskUserQuestion |
| Assuming a default | Different users want different approaches | Always ask |
| Not passing batch-size arg | User's preference ignored | Parse and forward --batch-size |
