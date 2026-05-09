---
# Qwen Implementer Delegation Template

Use this template when delegating an implementation task to Qwen via the `mcp__qwen-mcp__delegate_to_qwen` MCP tool.

## Context Preparation (do this before delegating)

1. **Resolve from context** — use what you know from the plan, codebase structure, and prior tasks to preemptively answer likely ambiguities. Include those answers inline in the `task` string.
2. **Ask the user** — if genuine ambiguity remains that you cannot resolve from context, ask the user directly (one question at a time) before delegating.
3. **Identify relevant files** — note which files prior tasks changed and which files the plan explicitly references for this task. These go in `context_hints`.

## Delegation Call

```
mcp__qwen-mcp__delegate_to_qwen:
  task: |
    ## Task

    [FULL TEXT of task from plan — paste it here, do not make Qwen read the plan file]

    ## Context

    [Scene-setting: where this fits in the plan, what prior tasks did, architectural context.
     Include answers to any ambiguities you resolved above.]

    ## Done when

    [Concrete acceptance criteria from the plan, stated plainly]

    ## On completion

    Reply with a concise summary covering:
    - What you implemented
    - Which files you changed (list them)
    - What tests you ran and their results
    - Any issues or concerns

  working_dir: [absolute path to project root or relevant subtree]
  context_hints:
    - [file changed by a prior task that this task depends on]
    - [file the plan explicitly references for this task]
```

## After Delegation

Inspect the response fields:

- **`result`** — Qwen's summary of what it did (or partial progress if stopped early)
- **`files_changed`** — files Qwen wrote or edited
- **`commands_run`** — commands Qwen executed
- **`stop_reason`** — see "Handling Qwen stop_reason" in SKILL.md
- **`transcript_path`** — full JSONL transcript; include this path in any escalation to the user
---