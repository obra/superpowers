---
name: exploring-codebase-context
description: Use when planning, debugging, security review, or migration work requires understanding unfamiliar or multiple codebase areas and direct exploration would consume substantial parent context
---

# Exploring Codebase Context

## Overview

Delegate bounded, read-only repository research and return one evidence-backed context brief. The parent agent owns scope, synthesis, and every downstream decision.

## Exploration Contract

Before reading implementation files, define:

- **Objective:** the decision or workflow this research must unblock.
- **Known facts:** established context that should not be rediscovered.
- **Unknowns:** concrete questions, not broad topics.
- **Scope:** allowed packages, directories, or subsystems.
- **Stop condition:** what evidence makes the next workflow safe to continue.

Exploration never edits files and never expands into implementation, design, diagnosis, or audit conclusions.

## Workflow

### 1. Take a surface snapshot

Read only applicable repository instructions, the top-level structure, primary manifests, working-tree status, recent history, and targeted search results. Do not open every search hit.

Follow the shortest evidence chain: authoritative entry point, direct contract or data edge, then tests or history only when the question requires verification or the implementation is ambiguous. Do not recursively map adjacent callers.

### 2. Apply the delegation gate

| Observed scope | Action |
|---|---|
| One known module and no more than three targeted files | Research directly |
| Two or more independent domains | Delegate by domain |
| Implementation point is unclear | Delegate discovery |
| More than five files are likely required | Delegate bounded questions |

When uncertain, delegate one discovery question first; do not fan out speculative tasks.

### 3. Dispatch bounded explorers

Read [references/context-explorer.md](references/context-explorer.md) and instantiate it for each question. Use isolated context where supported. Run independent questions in parallel and dependent questions sequentially.

One explorer owns one domain and one answerable question. Do not give explorers the full conversation when the objective, known facts, and constraints are sufficient.

### 4. Synthesize the context brief

Produce a decision-ready brief, not a subsystem inventory. A finding belongs only when omitting it could change the next workflow's scope, feasible approaches, material risks, or verification strategy.

Return:

1. Direct answers to the defined unknowns.
2. Decision-affecting findings with inline repository paths.
3. Unknowns that still block the defined objective.

Do not enumerate every component, invariant, test, or file read. Include a flow or component map only when the caller could choose the wrong boundary without it.

Surface-snapshot facts such as unrelated working-tree changes or recent commits are orientation data, not report findings, unless the objective depends on them.

Verify primary files yourself only when reports conflict, evidence is missing, or a claim controls a high-impact decision.

### 5. Stop

Stop each explorer as soon as its question has primary evidence or a documented evidence gap. Stop the overall exploration as soon as the defined decision is unblocked. Hand the context brief to the calling workflow; do not continue into its work.

## Common Mistakes

- **"Understand this subsystem"** is not a question. Name the decision and unknown.
- Overlapping explorer scopes duplicate reading. Partition by independent boundary.
- Raw trees, file dumps, and process narration consume the context the skill exists to protect.
- A catalog of everything discovered is not a context brief. Filter by effect on the next decision.
- A report that proposes fixes has crossed into another workflow.
- More research after the stop condition is met is context waste.
