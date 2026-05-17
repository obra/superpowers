---
name: dispatching-parallel-agents
description: >
  Use when 2+ tasks are independent and can run concurrently without
  file or state conflicts or sequential dependencies. Triggers on:
  "run these in parallel", "do these at the same time", plans with
  independent tasks, when subagent-driven-development identifies
  parallelizable work.
---

# Dispatching Parallel Agents

Use parallel subagents only for truly independent work.

You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

When you have multiple unrelated failures (different test files, different subsystems, different bugs), investigating them sequentially wastes time. Each investigation is independent and can happen in parallel.

## Decision Check

Use parallel dispatch when all are true:
- Problems have separate root causes.
- Tasks do not edit the same files.
- Tasks do not require shared intermediate state.

If any condition fails, run sequentially.

**Do not use when:**
- Failures are related — fixing one might fix others.
- The task is exploratory — you don't know what's broken yet.
- Agents would edit the same files or shared resources.
- Understanding the problem requires seeing the full system state.
- The task is content relay — fetching raw content (file contents, web pages, API responses) to bring back to the parent session. Agent results are compressed; raw content will be lost. Fetch it directly instead with Read (local files) or `curl` (URLs).

## Procedure

1. Split work into independent domains.
2. Write one focused prompt per domain.
3. Dispatch all agents in a **single message** with multiple parallel Agent tool calls. Do not dispatch sequentially across multiple messages — staggered dispatch delays start times, burns cache TTL, and undermines the parallelism.
4. Collect summaries and changed files.
5. Resolve conflicts between summaries and changed files.
6. Run integration verification: execute the full project test suite plus any cross-domain checks. Do not mark the wave complete until integration passes.

## Context Isolation

Never forward parent session context or history to subagents. Construct each subagent's prompt from scratch using only the items listed below. Subagents must not receive conversation history, prior reasoning chains, or context from other subagent runs.

**Why this is also the cache-optimal approach:** All subagents share the same system prompt prefix, which is cached by the API. By keeping each subagent's input as `[cached system prompt] + [small unique task prompt]`, every agent gets a cache hit on the heavy shared prefix and only pays full price for its small task-specific tail. Forwarding parent conversation history would make each subagent's prefix unique and large, breaking cache sharing and multiplying input token costs.

## Prompt Requirements

Each agent prompt must include:
- Exact scope
- Acceptance criteria
- Constraints (what not to touch)
- Required output format
- Skill leakage prevention: "You are a focused subagent. Do NOT invoke any skills from the superpowers-prepared plugin. Do NOT use the Skill tool. Your only job is the task described below."

### Example prompt

```markdown
Fix the 3 failing tests in src/agents/agent-tool-abort.test.ts:

1. "should abort tool with partial output capture" — expects 'interrupted at' in message
2. "should handle mixed completed and aborted tools" — fast tool aborted instead of completed
3. "should properly track pendingToolCount" — expects 3 results but gets 0

Your task:
1. Read the test file and understand what each test verifies.
2. Identify root cause — timing issues or actual bugs?
3. Fix the root cause. Do NOT just increase timeouts.
4. Do NOT change any files outside src/agents/agent-tool-abort.test.ts and its direct implementation file.

You are a focused subagent. Do NOT invoke any skills from the superpowers-prepared plugin.
Do NOT use the Skill tool. Your only job is the task described above.

Return: Summary of root cause and what you changed.
```

### Common mistakes

❌ **Too broad:** "Fix all the tests" — agent gets lost
✅ **Specific:** "Fix agent-tool-abort.test.ts" — focused scope

❌ **No context:** "Fix the race condition" — agent doesn't know where
✅ **With context:** Paste the error messages and test names

❌ **No constraints:** Agent might refactor everything
✅ **Constrained:** "Do NOT change files outside X"

❌ **Vague output:** "Fix it" — you don't know what changed
✅ **Specific output:** "Return summary of root cause and what you changed"

## Risks

- False independence assumptions
- Merge conflicts across shared files
- Inconsistent behavior across parallel fixes
- Cache TTL expiry for long-running tasks: the default prompt cache TTL is 5 minutes. If individual agent tasks are expected to run longer than that, the cache benefit diminishes. For very long tasks this is not a reason to avoid parallelism — it just means the input token saving is smaller.

When risk is high, fall back to sequential execution.
