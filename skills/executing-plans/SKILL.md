---
name: executing-plans
description: Use when executing a written plan and you can use Codex collab agents to parallelize independent steps safely.
---

# Executing Plans (Collab + FD-Safe)

## Overview
Execute written plans with collab agents when steps are independent, and keep file descriptor usage safe by limiting concurrent agents and closing them after use.

## When to Use
- A written plan exists (2+ steps)
- Some steps can run independently
- User requests multi-agent or faster execution

When NOT to use:
- Steps are tightly coupled or touch the same files
- Plan text is missing or ambiguous (request it first)

## Core Principle
Parallelize only independent steps, and manage agent lifecycle explicitly to avoid FD exhaustion.

## Process
1. Read the full plan and list each step verbatim.
2. Tag each step as **independent** or **coupled** (shared files/state).
3. If independent:
   - Dispatch one agent per step using `spawn_agent` (or `multi_tool_use.parallel`).
   - Limit concurrency to a small batch (e.g., 3–5 agents at a time).
4. If coupled:
   - Execute sequentially with clear checkpoints.
5. Always `wait` for results, then `close_agent` to release resources.
6. Summarize outcomes and conflicts, then proceed to next batch.

## FD Hygiene Rules
- Do not leave spawned agents unclosed.
- Use batching to avoid spikes in open descriptors.
- If you hit "too many open files", stop spawning agents and close existing ones before proceeding.
- If the skill is missing from the list, re-run bootstrap and proceed with this workflow anyway.
- If collab is disabled, suggest enabling `/experimental` multi-agents, then proceed sequentially.

## Quick Reference
| Situation | Action |
| --- | --- |
| Independent steps | Spawn agents (batched), wait, close agents |
| Coupled steps | Sequential execution |
| User asks to parallelize despite shared files | Refuse and explain conflict risk |
| FD pressure | Reduce concurrency, close agents immediately |

## Example
User: "We have a 4-step plan; all independent. Use multi-agents."

Actions:
- Spawn 4 agents (or two batches of 2).
- Wait for each result.
- Close each agent.
- Integrate results and note any conflicts.

## Common Mistakes
- Parallelizing steps that touch the same files
- Spawning too many agents at once
- Forgetting to close agents after use
- Claiming agents were spawned without tool calls

## Rationalizations to Avoid
| Excuse | Reality |
| --- | --- |
| "Parallelize anyway" | Shared files = conflict risk. Do sequential. |
| "More agents is faster" | Too many agents = FD exhaustion. Batch. |
| "I can leave agents open" | Close agents to release resources. |
| "Skill not found, so I can't follow it" | Re-run bootstrap and apply this workflow anyway. |

## Red Flags
- No `close_agent` calls after `wait`
- Large agent fan-out without batching
- Parallelizing steps with shared files

## Output Expectations
- Per-step summary
- Conflict notes
- Clear next batch or sequential checkpoint
