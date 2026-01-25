---
name: dispatching-parallel-agents
description: Use when multiple independent investigations or tasks can run concurrently and Codex collab multi-agents can reduce wall-clock time.
---

# Dispatching Parallel Agents

## Overview
Use Codex collab multi-agents (`spawn_agent` + `wait`) to run independent workstreams in parallel. Do not default to "subagents unavailable" when the collab feature is present, and never claim agents were spawned without calling the tool.

## When to Use
- 2+ independent tasks or investigations with minimal shared state
- User asks for "multi-agent", "subagents", "parallel agents", or "split into agents"
- Pressure to reduce wall-clock time (incident response, deadline, multiple failures)

When NOT to use:
- Tasks are coupled and must be sequenced
- Shared state or overlapping files would conflict
- Only one small task exists

## Core Principle
If collab is available, attempt `spawn_agent` first. Only fall back to sequential work if agent spawning fails.

## Process
1. Identify independent domains and name each task clearly.
2. Draft one focused prompt per task (scope, constraints, expected output).
3. Dispatch agents in parallel using `spawn_agent` (or `multi_tool_use.parallel` for 2+ agents).
4. `wait` for results, then integrate and resolve conflicts.
5. If `spawn_agent` fails or is unavailable, state that explicitly and proceed sequentially.

## Collab Tool Checklist
- Call `spawn_agent` for each independent task before claiming any agents were created.
- Use `wait` to collect results and cite which agent returned.
- If a tool call fails, say so and switch to sequential work.
- If collab is disabled, suggest the user enable it via `/experimental` to use multi-agents, then proceed sequentially.

## Quick Reference
| Situation | Action |
| --- | --- |
| User requests parallel agents | Use `spawn_agent` per task and `wait` for results |
| Subagents requested for testing | Use collab agents to run RED/GREEN scenarios |
| Spawn fails | Tell the user and switch to sequential work |
| Tasks are coupled | Do not parallelize; do sequential with clear checkpoints |

## Example
User: "We have 3 independent failures; use multi-agents."

Actions:
1. Spawn three agents with focused prompts.
2. Wait for each to return.
3. Summarize results and propose next steps.

```text
Agent A: UI error root cause and files
Agent B: API timeout diagnosis and logs needed
Agent C: Scheduler flake reproduction + stabilization ideas
```

## Common Mistakes
- Claiming agents were spawned without actually calling `spawn_agent`
- Saying "subagents aren't available in Codex" when collab is enabled
- Parallelizing tasks that share the same files or state
- Asking each agent to read the entire repo instead of giving tight scope

## Rationalizations to Avoid
| Excuse | Reality |
| --- | --- |
| "Subagents aren't available in Codex" | Collab provides `spawn_agent`; attempt it first. |
| "I'll just interleave updates instead" | Use true parallel agents when tasks are independent. |
| "I can say I spawned agents" | Never claim tool use without actually calling it. |
| "I already described the agents; no tool call needed" | Description is not execution. Call `spawn_agent`. |

## Red Flags
- No `spawn_agent` calls when user explicitly asked for parallel agents
- "Parallel-style" work without attempting collab agents
- Multiple tasks share files or shared state but were still parallelized

## Output Expectations
- One short summary per agent
- Consolidated next steps with any conflicts called out
