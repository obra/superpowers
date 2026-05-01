---
name: model-assignment
description: Use when assigning models to agents in team-driven-development — determines Opus or Sonnet based on task difficulty, with mandatory Opus for Audit Agent
---

# Model Assignment

## Overview

Not all tasks require the same model capability. This skill defines mandatory rules for which model each agent uses, optimizing cost without sacrificing quality on critical paths.

**Core principle:** Hard tasks get Opus, easy tasks get Sonnet. Audit Agent ALWAYS gets Opus — no exceptions.

**Announce at start:** "I'm using the model-assignment skill to determine the right model for each agent."

## Mandatory Assignments (Non-Negotiable)

| Agent Role | Model | Override Allowed? |
|-----------|-------|-------------------|
| **Audit Agent** | Opus | **NO — always Opus** |
| **Team Lead** | Opus | **NO — always Opus** |

<HARD-GATE>
Audit Agent MUST run on Opus.
"Sonnet is good enough for validation" is NEVER true.
The Audit Agent catches subtle issues that require Opus-level reasoning.
Downgrading it defeats the purpose of having a dedicated validator.
</HARD-GATE>

## Worker Model Assignment

Workers are assigned models based on task difficulty:

```dot
digraph model_decision {
    "Assess task" [shape=box];
    "Complex logic or architecture?" [shape=diamond];
    "Security-critical code?" [shape=diamond];
    "Multi-system integration?" [shape=diamond];
    "New patterns or novel approach?" [shape=diamond];
    "Assign Opus" [shape=box style=filled fillcolor=orange];
    "Simple CRUD or config?" [shape=diamond];
    "Boilerplate or repetitive?" [shape=diamond];
    "Assign Sonnet" [shape=box style=filled fillcolor=lightblue];
    "Assign Opus (default)" [shape=box style=filled fillcolor=orange];

    "Assess task" -> "Complex logic or architecture?";
    "Complex logic or architecture?" -> "Assign Opus" [label="yes"];
    "Complex logic or architecture?" -> "Security-critical code?" [label="no"];
    "Security-critical code?" -> "Assign Opus" [label="yes"];
    "Security-critical code?" -> "Multi-system integration?" [label="no"];
    "Multi-system integration?" -> "Assign Opus" [label="yes"];
    "Multi-system integration?" -> "New patterns or novel approach?" [label="no"];
    "New patterns or novel approach?" -> "Assign Opus" [label="yes"];
    "New patterns or novel approach?" -> "Simple CRUD or config?" [label="no"];
    "Simple CRUD or config?" -> "Boilerplate or repetitive?" [label="yes"];
    "Simple CRUD or config?" -> "Assign Opus (default)" [label="no"];
    "Boilerplate or repetitive?" -> "Assign Sonnet" [label="yes"];
    "Boilerplate or repetitive?" -> "Assign Opus (default)" [label="no — when in doubt, use Opus"];
}
```

## Difficulty Criteria

### High Difficulty → Opus

- New architectural patterns or system design
- Complex business logic with multiple conditions
- Security-critical code (auth, encryption, access control)
- Multi-system integration (API + DB + cache + queue)
- Performance-critical hot paths
- Data migration or schema changes
- Error recovery and fault tolerance
- Concurrent/parallel processing logic
- Tasks with ambiguous requirements needing interpretation

### Low Difficulty → Sonnet

- Simple CRUD operations with clear patterns
- Configuration file changes
- Boilerplate code generation following existing patterns
- Simple test additions following existing test patterns
- CSS/styling changes
- Copy/text updates
- Adding fields to existing forms
- Simple environment variable additions
- README or documentation updates

## Quick Reference

| Task Type | Model | Reason |
|-----------|-------|--------|
| New API endpoint with auth | Opus | Security + integration |
| Add field to existing form | Sonnet | Simple pattern following |
| Database migration | Opus | Data integrity critical |
| Update error message text | Sonnet | Simple text change |
| Implement caching layer | Opus | Architecture decision |
| Add unit test for existing fn | Sonnet | Pattern following |
| WebSocket real-time feature | Opus | Complex concurrency |
| Add route to existing router | Sonnet | Boilerplate |
| Payment processing | Opus | Security + business logic |
| Rename variable across files | Sonnet | Mechanical change |

## When In Doubt

**Default to Opus.** The cost difference is small compared to the cost of a subtle bug from under-powered reasoning. If you're spending more than 10 seconds deciding, just use Opus.

## Red Flags - STOP and Reconsider

**Never:**
- Assign Sonnet to Audit Agent
- Assign Sonnet to security-critical tasks
- Downgrade from Opus mid-task to save cost
- Override mandatory Opus assignments for any reason
- Assign Sonnet when requirements are ambiguous

## Integration

**Called by:**
- **superpowers:team-driven-development** — Model assignment before worker dispatch

**Pairs with:**
- **superpowers:context-window-management** — Model choice affects context efficiency
