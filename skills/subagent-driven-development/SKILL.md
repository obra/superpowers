---
name: subagent-driven-development
description: Use when executing a written implementation plan with independent tasks and you can use Codex collab multi-agents for per-task implementer and reviewers.
---

# Subagent-Driven Development

## Overview
Run each plan task with a fresh collab agent and enforce two-stage review (spec compliance first, then code quality). If collab agents fail to spawn, state that explicitly and fall back to sequential work. Never claim agents were spawned without tool calls.

## When to Use
- A written plan exists with multiple steps
- Tasks are mostly independent
- User asks for subagents, reviewers, or parallel execution

When NOT to use:
- Tasks are tightly coupled or share the same files
- No plan exists (create/clarify plan first)

## Core Principle
If collab is available, use `spawn_agent` for implementer + reviewers per task. Never claim subagents are unavailable without attempting to spawn, and never claim agents were spawned unless you called the tool.

## Process
1. Read the plan and extract tasks with full text.
2. For each task:
   - Dispatch implementer agent with full task text and constraints.
   - If implementer asks questions, answer and re-dispatch.
   - Dispatch spec reviewer agent; if issues found, re-dispatch implementer to fix, then re-review.
   - Dispatch code quality reviewer agent; if issues found, re-dispatch implementer to fix, then re-review.
3. Mark task complete only after both reviews approve.
4. After all tasks, optionally run a final holistic review agent.

## Collab Tool Checklist
- Call `spawn_agent` for each implementer/reviewer before claiming they exist.
- Use `wait` to gather results and cite which agent returned.
- If `spawn_agent` fails, say so and proceed sequentially.
- Do NOT say "spawned" or "spun up" in a response unless the tool call already happened in that response.
- If the skill is unexpectedly missing from the list, re-run bootstrap and proceed with this workflow anyway.

## Quick Reference
| Step | Action |
| --- | --- |
| Task execution | `spawn_agent` implementer per task |
| Spec review | `spawn_agent` spec reviewer after implementer |
| Quality review | `spawn_agent` quality reviewer after spec passes |
| Spawn fails | State failure and proceed sequentially |

## Example
User: "Execute this 3-step plan with subagents and reviews."

Actions:
1. Spawn implementer for Step 1.
2. Spawn spec reviewer for Step 1; fix issues if any.
3. Spawn quality reviewer for Step 1; fix issues if any.
4. Repeat for Steps 2 and 3.

## Common Mistakes
- Claiming subagents are unavailable without attempting `spawn_agent`
- Skipping spec review or doing quality review first
- Dispatching multiple implementers in parallel on shared files
- Proceeding without answering implementer questions
- Claiming agents were spawned without tool calls
 - Starting spec review before any implementation exists

## Rationalizations to Avoid
| Excuse | Reality |
| --- | --- |
| "Subagents aren't available in Codex" | Collab provides `spawn_agent`; attempt it first. |
| "Reviews are optional" | Two-stage review is mandatory. |
| "I can do both reviews myself" | Use separate agents to prevent bias. |
| "I already spawned them in my head" | Tool calls must actually be made. |
| "Spec review can come first to clarify" | Implementer goes first; spec review validates implementation. |
| "I'll pre-spawn reviewers to save time" | Spawn reviewers only after implementation exists. |
| "Skill not found, so I can't follow it" | Re-run bootstrap and apply this workflow anyway. |

## Red Flags
- No `spawn_agent` calls for implementer or reviewers
- Code quality review before spec compliance
- Proceeding after reviewer reports issues
- Claiming agents are spawned before calling `spawn_agent`
- Spec review requested before implementation

## Output Expectations
- Per task: implementer summary + spec review + quality review
- Clear list of fixes applied after each review
