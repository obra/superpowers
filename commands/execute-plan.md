---
name: execute-plan
description: "Use when executing an implementation plan. Offers batch, validated-batch, subagent, or one-shot approaches."
disable-model-invocation: true
---

Execute an implementation plan. First, determine which execution style to use.

**COMPULSORY: Always ask the user which approach they want. Never skip this question.**

## Step 1: Parse Arguments

- Plan path: First non-flag argument (e.g., `docs/hyperpowers/plans/feature.md`)
- `--batch-size=N`: Optional, passed to batch-development (default: 3)

## Step 2: Present Choice (MANDATORY)

Use AskUserQuestion with these options:

**Question:** "How would you like to execute this plan?"

| Option | Label                                    | Description                                                                                                             |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A      | Batch (human checkpoints) (Recommended)  | Execute tasks in batches, pause for your feedback after each batch. You stay in control.                                |
| B      | Validated Batch (parallel validation)    | Intelligent batching based on buildability + 3 parallel validators after each batch. Best balance of speed and quality. |
| C      | Subagent (automated reviews)             | Fresh subagent per task with automated spec + code quality reviews. Faster, less interaction.                           |
| D      | One Shot (not recommended)               | Execute ALL tasks without pauses, then build+test. Requires solid plan. No checkpoints until build completes.           |

**This question is COMPULSORY. Never skip it, never assume a default.**

## Step 3: Invoke Chosen Skill

- If Batch: `Skill(hyperpowers:batch-development, args: "<plan-path> --batch-size=N")`
- If Validated Batch: `Skill(hyperpowers:validated-batch-development, args: "<plan-path>")`
- If Subagent: `Skill(hyperpowers:subagent-driven-development, args: "<plan-path>")`
- If One Shot: `Skill(hyperpowers:one-shot-development, args: "<plan-path>")`

Pass the plan path as the argument to the skill.

## Red Flags

| Violation                    | Why It's Critical                         | Recovery                       |
| ---------------------------- | ----------------------------------------- | ------------------------------ |
| Skipping the choice question | User loses control over execution style   | Present AskUserQuestion        |
| Assuming a default           | Different users want different approaches | Always ask                     |
| Not passing batch-size arg   | User's preference ignored                 | Parse and forward --batch-size |
