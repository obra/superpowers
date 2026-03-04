---
name: dynamic-model-selection
description: Use when dispatching subagents to select the right model (opus/sonnet/haiku) based on task complexity, optimizing cost while maintaining quality
---

# Dynamic Model Selection

## Overview

Not every task needs your most powerful model. Match model capability to task complexity to optimize cost without sacrificing quality.

**Core principle:** Use the cheapest model that can reliably complete the task.

## Model Tiers

| Tier | Model | Strengths | Cost |
|------|-------|-----------|------|
| **Tier 1** | `opus` | Architecture, debugging, complex reasoning, ambiguous specs | Highest |
| **Tier 2** | `sonnet` | Code generation from clear specs, refactoring, reviews | Medium |
| **Tier 3** | `haiku` | File search, formatting, commit messages, simple transforms | Lowest |

## Task Routing Table

### Tier 1: Opus (Complex Reasoning Required)

Use when the task requires judgment, creativity, or dealing with ambiguity.

| Task | Why Opus |
|------|----------|
| Architecture design | Requires trade-off analysis and system thinking |
| Debugging root cause analysis | Needs hypothesis generation and elimination |
| Spec interpretation with ambiguity | Needs nuanced understanding of intent |
| Cross-system refactoring | Must understand ripple effects across codebase |
| Security review | Requires adversarial thinking |
| Plan creation (writing-plans) | Needs deep understanding of project context |
| Brainstorming | Creative exploration of design alternatives |

### Tier 2: Sonnet (Clear Spec, Moderate Complexity)

Use when the task is well-defined but requires coding skill.

| Task | Why Sonnet |
|------|------------|
| Implementing plan tasks | Spec is clear, just needs solid execution |
| Code review (quality) | Pattern matching against known best practices |
| Spec compliance review | Comparing code against explicit requirements |
| Test writing from spec | Requirements are clear, need good test design |
| Refactoring within a file | Scope is contained, patterns are clear |
| Bug fix with known cause | Root cause identified, just needs the fix |

### Tier 3: Haiku (Mechanical/Formulaic Tasks)

Use when the task is repetitive, formulaic, or doesn't require deep reasoning.

| Task | Why Haiku |
|------|-----------|
| File search and exploration | Pattern matching, no reasoning needed |
| Commit message generation | Formulaic output from diff |
| Code formatting / linting fixes | Mechanical transformations |
| Simple rename refactors | Search and replace with validation |
| Generating boilerplate | Template-based output |
| Running and reporting test results | Execute and summarize |
| Documentation from existing code | Describe what's already written |

## Decision Flowchart

```dot
digraph model_selection {
    rankdir=TB;

    "New subagent task" [shape=box];
    "Requires judgment or creativity?" [shape=diamond];
    "Has clear spec/requirements?" [shape=diamond];
    "Mechanical or formulaic?" [shape=diamond];

    "opus" [shape=box style=filled fillcolor=lightyellow];
    "sonnet" [shape=box style=filled fillcolor=lightblue];
    "haiku" [shape=box style=filled fillcolor=lightgreen];

    "New subagent task" -> "Requires judgment or creativity?";
    "Requires judgment or creativity?" -> "opus" [label="yes"];
    "Requires judgment or creativity?" -> "Has clear spec/requirements?";
    "Has clear spec/requirements?" -> "sonnet" [label="yes"];
    "Has clear spec/requirements?" -> "opus" [label="no - ambiguous"];
    "sonnet" -> "Mechanical or formulaic?" [style=invis];
    "Has clear spec/requirements?" -> "Mechanical or formulaic?" [label="trivially simple"];
    "Mechanical or formulaic?" -> "haiku" [label="yes"];
    "Mechanical or formulaic?" -> "sonnet" [label="no"];
}
```

**Quick decision rule:**
1. Ambiguous, creative, or multi-system? → **opus**
2. Clear spec, real coding needed? → **sonnet**
3. Could a script do it? → **haiku**

## How to Apply

### In Agent Tool Calls

When dispatching subagents, set the `model` parameter:

```typescript
// Complex debugging - needs opus
Agent(subagent_type: "general-purpose", model: "opus",
  description: "Debug race condition in auth flow",
  prompt: "Investigate the intermittent auth failure...")

// Implementation from clear plan - sonnet is sufficient
Agent(subagent_type: "general-purpose", model: "sonnet",
  description: "Implement Task 3: Add user validation",
  prompt: "You are implementing Task 3...")

// File search and report - haiku handles this fine
Agent(subagent_type: "Explore", model: "haiku",
  description: "Find all auth-related files",
  prompt: "List all files related to authentication...")
```

### In Subagent-Driven Development

When executing a plan with subagent-driven-development:

| Subagent Role | Recommended Model | Rationale |
|---------------|-------------------|-----------|
| Implementer | `sonnet` | Clear spec from plan, needs solid coding |
| Spec reviewer | `sonnet` | Comparing code to explicit requirements |
| Code quality reviewer | `sonnet` | Pattern matching against best practices |
| Final cross-cutting reviewer | `opus` | Needs to see system-wide interactions |

**Exception:** If a task involves complex architecture or debugging, escalate the implementer to `opus`.

### In Parallel Agent Dispatch

When dispatching parallel agents:

```typescript
// Mix models based on each task's complexity
Agent(model: "sonnet", prompt: "Fix test timing in abort.test.ts...")  // Known issue
Agent(model: "opus", prompt: "Debug flaky race condition...")           // Unknown root cause
Agent(model: "haiku", prompt: "Update import paths in 5 files...")     // Mechanical
```

## Cost Impact

Typical subagent-driven-development session (5 tasks):

| Without model selection | With model selection |
|------------------------|---------------------|
| 5x implementer (opus) | 5x implementer (sonnet) |
| 5x spec reviewer (opus) | 5x spec reviewer (sonnet) |
| 5x quality reviewer (opus) | 5x quality reviewer (sonnet) |
| 1x final reviewer (opus) | 1x final reviewer (opus) |
| **16 opus calls** | **15 sonnet + 1 opus** |

## When to Escalate

Start with the recommended tier, but escalate if:

- **haiku → sonnet:** Task turns out more complex than expected, haiku produces low-quality output
- **sonnet → opus:** Implementation requires architectural decisions not covered in the spec, or encounters unexpected complexity
- **Any tier:** Subagent asks questions that suggest the task needs more reasoning power

## Red Flags

**Never use haiku for:**
- Tasks with ambiguous requirements
- Debugging unknown issues
- Architecture or design decisions
- Security-sensitive code review

**Never use opus for:**
- Simple file searches or grep operations
- Commit message generation
- Boilerplate code generation
- Running commands and reporting output

## Integration

This skill integrates with:
- **superpowers:dispatching-parallel-agents** - Set model per agent based on task complexity
- **superpowers:subagent-driven-development** - Set model per subagent role
- **superpowers:executing-plans** - Choose model based on task in current batch
