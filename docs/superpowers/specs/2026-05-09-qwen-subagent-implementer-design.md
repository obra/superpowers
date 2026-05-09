# Qwen as Implementer in Subagent-Driven Development

**Date:** 2026-05-09
**Author:** Kyle Diedrick (with Claude)
**Status:** Approved, ready for implementation

## Problem

The `subagent-driven-development` skill dispatches all three roles (implementer, spec reviewer, code quality reviewer) as Claude subagents. Mechanical implementation tasks (writing a function, adding tests, threading a parameter) consume paid Claude API tokens unnecessarily. A local Qwen instance running via `llama.cpp` is already available via the `qwen-mcp` MCP server and can handle these tasks at zero marginal cost.

## Goals

- Replace Claude subagents in the implementer role with `delegate_to_qwen` MCP calls.
- Spec reviewer and code quality reviewer remain as Claude subagents (they require stronger judgment).
- Handle Qwen's fire-and-forget constraint: Claude as coordinator composes richer upfront context and asks the user for genuine unknowns before delegating.
- Map Qwen's `stop_reason` outputs to the skill's existing status handling.

## Non-goals

- Using Qwen for spec or code quality review.
- A tiered model-selection system (Qwen vs. Claude per task complexity) — this can be added later.
- Changes to the spec reviewer or code quality reviewer prompts.

## Architecture

No new files. Two targeted changes to the existing skill:

1. **`skills/subagent-driven-development/implementer-prompt.md`** — replaced with a Qwen-specific template describing how to call `mcp__qwen-mcp__delegate_to_qwen`.
2. **`skills/subagent-driven-development/SKILL.md`** — two additions: a context preparation step and a `stop_reason` mapping section.

## Context Preparation Phase

Before delegating to Qwen, Claude (as coordinator) runs a preparation step that replaces the old Q&A phase:

1. **Resolve from context** — read the task text and relevant files already known from the plan. Answer likely ambiguities using codebase structure, prior task results, and plan context.
2. **Ask the user** — if genuine ambiguity remains that Claude cannot resolve from context, ask the user directly (one question at a time) before delegating.
3. **Compose the delegation** — build the `delegate_to_qwen` call:
   - `task`: full task text from the plan + any resolved ambiguities inline
   - `working_dir`: project root or the relevant subtree
   - `context_hints`: files the coordinator already knows are relevant (referenced in plan, changed by prior tasks)

## stop_reason Mapping

| `stop_reason` | Action |
|---|---|
| `complete` | Proceed to spec review |
| `error` | Treat as BLOCKED — assess failure, escalate to user |
| `max_steps` / `timeout` / `token_limit` | Attempt task decomposition; if task is already atomic, escalate to user with `transcript_path` and partial `result` |

**Budget hit decomposition rule:** Inspect `result` and `files_changed`. If a clear remaining piece exists (e.g., function written but tests not written), split into sub-tasks and delegate each. If the task cannot be split further, escalate with the `transcript_path` so the user can inspect what Qwen did.

## Data Flow

```
coordinator reads plan
  → context preparation (resolve ambiguities / ask user)
  → delegate_to_qwen(task, working_dir, context_hints)
  → inspect stop_reason
      complete → spec review (Claude subagent)
      error    → BLOCKED, escalate
      budget   → decompose or escalate
  → spec review passes → code quality review (Claude subagent)
  → mark task complete
```

## Error Handling

- `stop_reason=error` covers connection failures and server errors from the MCP layer. The coordinator reports BLOCKED with the error details from Qwen's `result` field.
- Budget hits surface the `transcript_path` in any escalation message so the user has a direct path to inspect Qwen's partial work.
- The spec reviewer catches any gaps in Qwen's output the same way it would catch gaps from a Claude implementer.

## Testing

No automated tests for skill files. Validation is manual:
- Run a task through the updated skill and verify Qwen is called via `delegate_to_qwen`.
- Verify the context preparation step produces a complete `task` string (no ambiguities left unresolved).
- Verify `stop_reason=complete` proceeds to spec review.
- Verify a simulated budget hit triggers decomposition logic before escalation.
