---
name: agent-architecture-audit
description: Use before releasing any agent or LLM-powered application. Audits the full agent stack for hidden prompt conflicts, memory pollution, tool discipline failures, context duplication, hidden repair loops, and rendering corruption. Produces severity-ranked findings with code-first fixes. Essential for developers building agent applications or using LLM APIs.
---

# Agent Architecture Audit

## Overview

When you wrap an LLM in an agent system — with prompts, tools, memory, history, and platform layers — the wrapper itself often becomes the failure point, not the model.

**Core principle:** The base model is rarely the problem. The wrapper architecture corrupts good answers into bad behavior.

**This skill audits the agent system itself, not the user's domain tasks.**

## When to Use

**MANDATORY for:**
- Releasing any agent application
- Shipping LLM-powered features to production
- Adding tool calling, memory, or multi-step workflows to an LLM integration
- Agent behavior degrades after adding wrapper layers
- User reports "the agent is getting worse" or "tools are flaky"

**Especially critical when:**
- You've added new prompt layers, tool definitions, or memory systems
- Different agents in your system behave inconsistently
- The same model works fine in a playground but breaks inside your wrapper
- You're debugging agent behavior for more than 15 minutes

**Do not use for:**
- General code debugging (use `systematic-debugging`)
- Code review (use `requesting-code-review`)
- Writing new features

## The 12-Layer Stack

Every agent system has these layers. Any of them can corrupt the answer:

1. **System prompt** — persona, instructions, guardrails
2. **Session history** — previous turns injected as context
3. **Long-term memory** — retrieved knowledge across sessions
4. **Distillation** — compressed summaries of prior context
5. **Active recall** — recap/re-summary layers
6. **Tool selection** — routing to the right tool
7. **Tool execution** — actually calling the tool and observing
8. **Tool interpretation** — parsing tool output
9. **Answer shaping** — formatting the final response
10. **Platform rendering** — transport-layer mutation (UI, API, CLI)
11. **Hidden repair loops** — fallback/retry agents running silently
12. **Persistence** — stale state, cached artifacts, expired sessions

## Common Failure Patterns

### 1. Wrapper Regression
The base model produces correct answers, but the wrapper layer (prompt + tools + memory) makes it worse.

**Symptoms:**
- Model works fine in playground, breaks in your app
- Added a new prompt layer, existing behavior degraded
- Agent sounds confident but is confidently wrong

### 2. Memory Contamination
Old topics leak into new conversations through history, memory retrieval, or distillation artifacts.

**Symptoms:**
- Agent brings up unrelated past topics
- User corrections don't stick (old memory overwrites new)
- Same-session artifacts re-enter as pseudo-facts

### 3. Tool Discipline Failure
Tools are declared in the prompt but not enforced in code. The model skips them or hallucinates execution.

**Symptoms:**
- "Must use tool X" in prompt, but model answers without calling it
- Tool results look correct but were never actually executed
- Different tools fight over the same responsibility

### 4. Rendering/Transport Corruption
The agent's internal answer is correct, but the platform layer mutates it during delivery.

**Symptoms:**
- Logs show correct answer, user sees broken output
- Markdown rendering, JSON parsing, or streaming fragments corrupt valid responses
- Hidden fallback agent quietly replaces the answer

### 5. Hidden Agent Layers
Silent repair, retry, summarization, or recall agents run without explicit contracts.

**Symptoms:**
- Output changes between internal generation and user delivery
- "Auto-fix" loops run a second LLM pass the user doesn't know about
- Multiple agents modify the same output without coordination

## Audit Workflow

### Phase 1: Scope

Define what you're auditing:

- **Target system** — what agent application?
- **Entrypoints** — how do users interact with it?
- **Model stack** — which LLM(s) and providers?
- **Symptoms** — what does the user report?
- **Time window** — when did it start?
- **Layers to audit** — which of the 12 layers apply?

### Phase 2: Evidence Collection

Gather evidence from the codebase:

- **Source code** — agent loop, tool router, memory admission, prompt assembly
- **Logs** — historical session traces, tool call records
- **Config** — prompt templates, tool schemas, provider settings
- **Memory files** — SOPs, knowledge bases, session archives

Use `rg` to search for anti-patterns:
- Tool requirements expressed only in prompt text (not code)
- Multiple agents modifying the same output
- Memory admission without user-correction priority
- Fallback loops that run additional LLM calls

### Phase 3: Failure Mapping

For each finding, document:

- **Symptom** — what the user sees
- **Mechanism** — how the wrapper causes it
- **Source layer** — which of the 12 layers
- **Root cause** — the deepest cause
- **Evidence** — file:line or log:row reference
- **Confidence** — 0.0 to 1.0

### Phase 4: Fix Strategy

Default fix order (code-first, not prompt-first):

1. **Code-gate tool requirements** — enforce in code, not just prompt
2. **Remove or narrow hidden repair agents** — make fallback explicit
3. **Reduce context duplication** — same info through prompt + history + memory + distillation
4. **Tighten memory admission** — user corrections > agent assertions
5. **Tighten distillation triggers** — don't compress what shouldn't be compressed
6. **Reduce rendering mutation** — pass-through, don't transform
7. **Convert to typed JSON envelopes** — structured internal flow, not freeform prose

## Severity Model

| Level | Meaning |
|-------|---------|
| `critical` | Agent can confidently produce wrong operational behavior |
| `high` | Agent frequently degrades correctness or stability |
| `medium` | Correctness usually survives but output is fragile or wasteful |
| `low` | Mostly cosmetic or maintainability issues |

## Output Format

Present findings to the user in this order:

1. **Severity-ranked findings** (most critical first)
2. **Architecture diagnosis** (which layer corrupted what, and why)
3. **Ordered fix plan** (code-first, not prompt-first)

Do not lead with compliments or summaries. If the system is broken, say so directly.

## Anti-Patterns to Avoid

- ❌ Saying "the model is weak" without falsifying the wrapper first
- ❌ Saying "memory is bad" without showing the contamination path
- ❌ Letting a clean current state erase a dirty historical incident
- ❌ Treating markdown prose as a trustworthy internal protocol
- ❌ Accepting "must use tool" in prompt text when code never enforces it
