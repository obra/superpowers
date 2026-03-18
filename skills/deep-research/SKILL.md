---
name: deep-research
description: Use when brainstorming completes and a spec is approved — researches the current state of the art for all technologies and patterns in the spec before any implementation begins
---

# Deep Research

## Overview

Before building anything, research the current state of the art. This skill activates automatically after brainstorming produces an approved spec. It ensures agents work with verified, current knowledge rather than potentially outdated training data.

**This step runs 100% of the time.** No exceptions, no shortcuts, no "I already know this."

## When to Use

- Immediately after brainstorming produces an approved spec
- Before any implementation planning begins
- The spec references any technology, library, pattern, or protocol

## When NOT to Use

- Never skip this step. It always runs after brainstorming.
- The only exception: if the user explicitly says "skip research."

## Process

```dot
digraph deep_research {
    "Receive approved spec" [shape=doublecircle];
    "Extract technologies\nand patterns from spec" [shape=box];
    "Formulate research questions\n(specific, answerable)" [shape=box];
    "Research using tools\n(context7, WebSearch, WebFetch)" [shape=box];
    "Cross-reference\nmultiple sources" [shape=diamond];
    "Gaps remain?" [shape=diamond];
    "Synthesize findings\ninto research brief" [shape=box];
    "Hand off to skills-audit" [shape=doublecircle];

    "Receive approved spec" -> "Extract technologies\nand patterns from spec";
    "Extract technologies\nand patterns from spec" -> "Formulate research questions\n(specific, answerable)";
    "Formulate research questions\n(specific, answerable)" -> "Research using tools\n(context7, WebSearch, WebFetch)";
    "Research using tools\n(context7, WebSearch, WebFetch)" -> "Cross-reference\nmultiple sources";
    "Cross-reference\nmultiple sources" -> "Gaps remain?";
    "Gaps remain?" -> "Research using tools\n(context7, WebSearch, WebFetch)" [label="yes"];
    "Gaps remain?" -> "Synthesize findings\ninto research brief" [label="no"];
    "Synthesize findings\ninto research brief" -> "Hand off to skills-audit";
}
```

### 1. Extract Technologies and Patterns

From the approved spec, list every technology, library, framework, pattern, and protocol the implementation requires.

### 2. Formulate Research Questions

Turn each technology/pattern into specific, answerable questions:

```
# BAD: vague
"How do WebSockets work?"

# GOOD: specific and actionable
"What is the recommended WebSocket library for Rust/axum in 2025?"
"What reconnection strategy do production WebSocket servers use?"
"How do you handle auth on WebSocket upgrade requests?"
```

### 3. Research Using Available Tools

Priority order:
1. **context7** (`resolve-library-id` → `query-docs`) — latest official docs
2. **WebSearch** — landscape, comparisons, community consensus
3. **WebFetch** — specific articles, documentation pages

**Dispatch parallel research agents** for independent topics.

### 4. Cross-Reference and Validate

- Confirm patterns across 2-3 sources minimum
- Prefer official documentation over blog posts
- Prefer recent content (last 12 months)
- Note version-specific details

### 5. Produce Research Brief

```markdown
## Research Brief: [Topic]

### Context
What we're building and why research was needed.

### Key Findings
- **Pattern 1**: Description, trade-offs, when to use
- **Pattern 2**: Description, trade-offs, when to use

### Recommended Approach
Which pattern fits our use case and why.

### Implementation Notes
- Libraries and versions
- Configuration gotchas
- Common pitfalls

### Sources
- [Source 1]: What it confirmed
- [Source 2]: What it confirmed
```

## Red Flags

| Signal | Action |
|--------|--------|
| Only one source for a critical decision | Search more |
| All sources are 2+ years old | Search for recent updates |
| Conflicting advice | Dig deeper, understand why |
| "I already know this" | Check anyway — assumptions rot |
| Research exceeding 30 minutes | Scope down to decision points |

## Output

The research brief feeds directly into **skills-audit**. Invoke the skills-audit skill next.

## Why This Step Cannot Be Audited

Deep research captures new knowledge. You cannot audit new knowledge against old knowledge — that defeats the purpose. This is the only step in the ultrapowers pipeline that skips auditing.
