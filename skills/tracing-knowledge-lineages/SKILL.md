---
name: Tracing Knowledge Lineages
description: Understand how ideas evolved over time to find old solutions for new problems and avoid repeating past failures
when_to_use: when questioning "why do we use X", before abandoning approaches, or evaluating "new" ideas that might be revivals
version: 1.1.0
---

# Tracing Knowledge Lineages

## Overview

Ideas have history. Understanding why we arrived at current approaches - and what was tried before - prevents repeating failures and rediscovers abandoned solutions.

**Core principle:** Before judging current approaches or proposing "new" ones, trace their lineage.

## When to Trace Lineages

**Trace before:**

- Proposing to replace existing approach (understand why it exists first)
- Dismissing "old" patterns (they might have been abandoned for wrong reasons)
- Implementing "new" ideas (they might be revivals worth reconsidering)
- Declaring something "best practice" (understand its evolution)

**Red flags triggering lineage tracing:**

- "This seems overcomplicated" (was it simpler before? why did it grow?)
- "Why don't we just..." (someone probably tried, what happened?)
- "This is the modern way" (what did the old way teach us?)
- "We should switch to X" (what drove us away from X originally?)

## Tracing Techniques

### Technique 1: Decision Archaeology

Search for when/why current approach was chosen:

1. **Check decision records** (common locations: `docs/decisions/`, `docs/adr/`, `.decisions/`, architecture decision records)
2. **Search conversations** (the memory system: local-semantic-memory)
3. **Git archaeology** (`git log --all --full-history -- path/to/file`)
4. **Ask the person who wrote it** (if available)

**Document:**

```markdown
## Lineage: [Current Approach]

**When adopted:** [Date/commit]
**Why adopted:** [Original problem it solved]
**What it replaced:** [Previous approach]
**Why replaced:** [What was wrong with old approach]
**Context that drove change:** [External factors, new requirements]
```

### Technique 2: Failed Attempt Analysis

When someone says "we tried X and it didn't work":

**Don't assume:** X is fundamentally flawed
**Instead trace:**

1. **What was the context?** (constraints that no longer apply)
2. **What specifically failed?** (the whole approach or one aspect?)
3. **Why did it fail then?** (technology limits, team constraints, time pressure)
4. **Has context changed?** (new tools, different requirements, more experience)

**Document:**

```markdown
## Failed Attempt: [Approach]

**When attempted:** [Timeframe]
**Why attempted:** [Original motivation]
**What failed:** [Specific failure mode]
**Why it failed:** [Root cause, not symptoms]
**Context at time:** [Constraints that existed then]
**Context now:** [What's different today]
**Worth reconsidering?:** [Yes/No + reasoning]
```

### Technique 3: Revival Detection

When evaluating "new" approaches:

1. **Search for historical precedents** (was this tried before under different name?)
2. **Identify what's genuinely new** (vs. what's rebranded)
3. **Understand why it died** (if it's a revival)
4. **Check if resurrection conditions exist** (has context changed enough?)

**Common revival patterns:**

- Microservices ← Service-Oriented Architecture ← Distributed Objects
- GraphQL ← SOAP ← RPC
- Serverless ← CGI scripts ← Cloud functions
- NoSQL ← Flat files ← Document stores

**Ask:** "What did we learn from the previous incarnation?"

### Technique 4: Paradigm Shift Mapping

When major architectural changes occurred:

**Map the transition:**

```markdown
## Paradigm Shift: From [Old] to [New]

**Pre-shift thinking:** [How we thought about problem]
**Catalyst:** [What triggered the shift]
**Post-shift thinking:** [How we think now]
**What was gained:** [New capabilities]
**What was lost:** [Old capabilities sacrificed]
**Lessons preserved:** [What we kept from old paradigm]
**Lessons forgotten:** [What we might need to relearn]
```

## Search Strategies

**Where to look for lineage:**

1. **Decision records** (common locations: `docs/decisions/`, `docs/adr/`, `.adr/`, or search for "ADR", "decision record")
2. **Conversation history** (search with memory system: mcp**local-semantic-memory**search_content or mcp**local-semantic-memory**search_semantic)
3. **Git history** (`git log --grep="keyword"`, `git blame`)
4. **Issue/PR discussions** (GitHub/GitLab issue history)
5. **Documentation evolution** (`git log -- docs/`)
6. **Team knowledge** (ask: "Has anyone tried this before?")

**Search patterns:**

```bash
# Find when approach was introduced
git log --all --grep="introduce.*caching"

# Find what file replaced
git log --diff-filter=D --summary | grep pattern

# Find discussion of abandoned approach
git log --all --grep="remove.*websocket"
```

## Red Flags - You're Ignoring History

- "Let's just rewrite this" (without understanding why it's complex)
- "The old way was obviously wrong" (without understanding context)
- "Nobody uses X anymore" (without checking why it died)
- Dismissing approaches because they're "old" (age ≠ quality)
- Adopting approaches because they're "new" (newness ≠ quality)

**All of these mean: STOP. Trace the lineage first.**

## When to Override History

**You CAN ignore lineage when:**

1. **Context fundamentally changed**
   - Technology that didn't exist is now available
   - Constraints that forced decisions no longer apply
   - Team has different capabilities now

2. **We learned critical lessons**
   - Industry-wide understanding evolved
   - Past attempt taught us what to avoid
   - Better patterns emerged and were proven

3. **Original reasoning was flawed**
   - Based on assumptions later proven wrong
   - Cargo-culting without understanding
   - Fashion-driven, not needs-driven

**But document WHY you're overriding:** Future you needs to know this was deliberate, not ignorant.

## Documentation Format

When proposing changes, include lineage:

```markdown
## Proposal: Switch from [Old] to [New]

### Current Approach Lineage

- **Adopted:** [When/why]
- **Replaced:** [What it replaced]
- **Worked because:** [Its strengths]
- **Struggling because:** [Current problems]

### Previous Attempts at [New]

- **Attempted:** [When, if ever]
- **Failed because:** [Why it didn't work then]
- **Context change:** [What's different now]

### Decision

[Proceed/Defer/Abandon] because [reasoning with historical context]
```

## Examples

### Good Lineage Tracing

"We used XML before JSON. XML died because verbosity hurt developer experience. But XML namespaces solved a real problem. If we hit namespace conflicts in JSON, we should study how XML solved it, not reinvent."

### Bad Lineage Ignorance

"REST is old, let's use GraphQL." (Ignores: Why did REST win over SOAP? What problems does it solve well? Are those problems gone?)

### Revival with Context

"We tried client-side routing in 2010, abandoned it due to poor browser support. Now that support is universal and we have better tools, worth reconsidering with lessons learned."

## Remember

- Current approaches exist for reasons (trace those reasons)
- Past failures might work now (context changes)
- "New" approaches might be revivals (check for precedents)
- Evolution teaches (study the transitions)
- Ignorance of history = doomed to repeat it
