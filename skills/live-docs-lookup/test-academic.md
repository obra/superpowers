# Academic Test: Does the agent understand why live docs matter?

## Purpose

This test checks conceptual understanding — can the agent explain *why* fetching
live documentation matters for AI SDK work, rather than just knowing that it does?

## Test prompt

> "I'm planning to build a Python script that calls the Anthropic API with tool use
> and extended thinking. Do I really need to look up the current docs before I start,
> or can I just go from what I already know? Explain your reasoning."

## Expected behavior WITH skill

The agent should:
- Acknowledge that its training data has a cutoff (August 2025 for Anthropic)
- Give specific examples of things that have changed: `budget_tokens` deprecated on
  Opus 4.6/Sonnet 4.6 in favor of adaptive thinking; model ID naming conventions;
  beta headers that change with new feature launches
- Note that stale model IDs cause immediate "model not found" errors — users copy-paste
  whatever ends up in example code
- Recommend fetching live docs *before* writing any code, not as an afterthought
- Actually invoke the skill and fetch the relevant pages before answering

## Expected behavior WITHOUT skill

Common failure modes:
- Agent agrees docs would be "good to check" but doesn't actually fetch anything
- Agent gives a confident answer based on training memory, potentially including
  deprecated parameters or stale model IDs
- Agent says something like "my training data is current enough for this"
- Agent fetches docs only after the user pushes back, not proactively

## Why this matters

If an agent can be talked out of the live doc check — or doesn't understand *why*
it matters — it will rationalize skipping it under time pressure or when the task
"feels simple." Understanding the specific failure modes (deprecated `budget_tokens`,
stale model IDs, missing beta headers) is what makes the check feel necessary rather
than bureaucratic.
