---
name: subagent-delegation
description: Use before executing any non-trivial task to decide whether to delegate to a subagent or execute inline. Covers research-heavy tasks, independent parallel work, fresh-perspective review, pre-commit verification, and pipeline workflows. When in doubt, bias toward delegating.
---

# Subagent Delegation

<SUBAGENT-STOP>
You are a subagent executing a delegated task. Do not apply this skill — proceed directly with your task.
</SUBAGENT-STOP>

## Overview

Two separate reasons to delegate — most people only know one:

1. **Context isolation**: The subagent does the heavy lifting in its own context and returns only what you need. Raw file reads, search results, and intermediate comparisons stay out of your main thread.

2. **Independent judgment**: A subagent starts fresh, unburdened by your conversation history, assumptions, and blind spots. For review and verification tasks, this independence is the point — you cannot give an unbiased opinion of your own work.

**Core question:** should this task happen here, or over there?

## When to Delegate

Delegate when **any** of these apply:

| Signal | Threshold | Why |
|---|---|---|
| **Research-heavy** | 10+ files to explore | Raw reads pollute context; you need synthesized findings |
| **Multiple independent tasks** | 3+ pieces with no dependencies | Parallel subagents finish faster; each stays focused |
| **Fresh perspective needed** | Review, verification, challenging assumptions | Subagent doesn't inherit your blind spots |
| **Verification before committing** | Pre-commit quality check | Independent eyes catch what familiarity obscures |
| **Pipeline workflow** | Distinct phases with clear file-based handoffs | Each stage benefits from focused context |

**When in doubt, delegate.** A healthy main context is worth more than the overhead of spawning a subagent.

## When to Keep Inline

Hard blockers — keep inline when **any** of these are true:

- **Tight feedback loop** — debugging where you need error → hypothesis → fix → observe in one thread
- **Context-state dependency** — step B needs the full conversational output of step A, and that state can't be written to a file. Note: if the dependency is a *file* (step A writes `spec.md`, step B reads it), that's a pipeline — delegate each stage with file-based handoffs
- **Shared file writes** — task writes to files the main thread is also modifying (conflict risk)
- **Agent coordination** — subagents can't talk to each other; tasks requiring inter-agent negotiation stay inline
- **Truly trivial** — a single-function lookup or single-file read with minimal output

## How to Delegate

### 1. Choose subagent type

| Task nature | subagent_type |
|---|---|
| Read files, explore codebase, search, analyze | `Explore` |
| Plan an approach, design a solution | `Plan` |
| Write files, run commands, make changes | `general-purpose` |

### 2. Write a prompt with two contracts

Every delegated prompt must specify:

**Input Contract:**
- One-sentence task background
- Specific resources to access (file paths, repos, search terms)
- Explicit scope boundary ("only look at X, ignore Y")
- For fresh-perspective tasks: "Do not use context from the main conversation — evaluate independently"

**Output Contract:**
- The conclusion (direct answer, not a narrative)
- Key evidence with `file:line` references or direct quotes
- Material gaps or uncertainties
- **Prohibited:** raw file dumps, unstructured summaries, preamble without substance

**Template:**

```
[One sentence: what you're trying to learn, verify, or review]

Access: [specific files, directories, repos, or search scope]
Do not: [explicit out-of-scope items]
[Fresh perspective: "Do not use context from the main conversation — evaluate independently."]

Return:
- Conclusion: [direct answer]
- Evidence: [findings with file:line refs]
- Gaps: [anything you couldn't determine]
```

## Output Quality Gate

When the subagent returns:
- Is the conclusion actionable? (specific finding, not vague summary)
- Does the evidence back it? (file:line refs or direct quotes)
- Does it cover the scope you asked for?

If too vague: re-delegate once with a more explicit Output Contract. If still insufficient: bring inline — some tasks need the iterative loop.

## Relationship to Other Skills

This skill is a **pre-execution layer** — it runs before other skills, not instead of them.

- `dispatching-parallel-agents`: coordinates multiple subagents once you've decided to delegate. Use this skill to decide *whether* to delegate; use that skill to coordinate *how* when 3+ tasks run in parallel.
- `subagent-driven-development`: a full SDD workflow for executing implementation plans. This skill is the simpler, earlier question: does *this task* belong in a subagent at all?
- After deciding inline: proceed with brainstorming, TDD, debugging, or whichever skill applies.

## Examples

**Delegate:**
- "Read the auth implementation in this repo and summarize how it works" → research-heavy → `Explore` subagent
- "Check whether our implementation matches this spec" → verification → `Explore` subagent, output: pass/fail + gaps
- "Review this implementation before I commit — I want unbiased eyes" → fresh perspective → read-only subagent, "evaluate independently"
- "Design API contract, then implement endpoints, then write tests" → pipeline with file handoffs → chain subagents, each reads previous stage's output file

**Keep inline:**
- Debugging a failing test → tight feedback loop
- Editing a file based on earlier context in this conversation → context-state dependency
- Looking up one specific function → trivial
