---
name: model-selection
description: Use when spawning Task agents or choosing response depth - prevents cost waste on simple tasks and capability gaps on complex ones
---

# Model Selection for Cost Efficiency

## Quick Reference

| Task Type | Model | Examples |
|-----------|-------|----------|
| Bulk/mechanical | Haiku | Formatting, renaming, summarizing docs |
| Variants/drafts | Haiku | Copy options, UI text, boilerplate |
| Quick lookups | Haiku | File searches, fact Q&A, exploration |
| Most coding | Sonnet | Features, bug fixes, refactors (<5 files) |
| High-leverage | Opus | Architecture, security, critical specs, refactors (5+ files) |
| After 2 failures | Escalate | Haiku→Sonnet→Opus |

## Default: Sonnet

Use Sonnet for most tasks. It balances reasoning quality with cost.

## Use Haiku For

When spawning Task agents, use `model: haiku` for:

- **Bulk transformations**: Renaming, formatting, mechanical changes
- **Reading/summarizing**: Scanning many files, summarizing docs
- **Generating variants**: Copy options, UI text alternatives, boilerplate
- **First drafts**: Exploratory work, rough outlines
- **Quick Q&A**: Fact lookup, simple searches
- **"Good enough" tasks**: Where perfection isn't required

Example Task call with Haiku:
```json
{
  "model": "haiku",
  "subagent_type": "Explore",
  "description": "Find auth files",
  "prompt": "List all files related to authentication"
}
```

## Use Opus Directly For

These tasks skip Sonnet and go straight to Opus:

- **Core architecture**: System design, major structural decisions
- **Hard bugs**: Especially after initial debugging fails
- **Critical specs**: Requirements that must be precise
- **Security-sensitive code**: Auth, encryption, input validation
- **Complex refactors**: Changes spanning 5+ files
- **User-marked important**: When user says "this is critical" or "get this right"

Example Task call with Opus:
```json
{
  "model": "opus",
  "subagent_type": "Plan",
  "description": "Design auth system",
  "prompt": "Design the authentication architecture..."
}
```

## Escalation Rules

**What counts as failure:**
1. Agent returns error or says it couldn't complete
2. Output is clearly wrong or low-quality
3. User says result isn't good enough

**Escalation flow:**
```text
Attempt 1: Use model per rules above
    ↓ failure
Attempt 2: Same model, adjust prompt
    ↓ failure
Attempt 3: Escalate one tier
```

**Escalation path:**
- Haiku failure → Sonnet (not directly to Opus)
- Sonnet failure → Opus

**Tracking:**
- Count failures per-task, not globally
- Reset when task succeeds or user moves on

## Enforcement

**For Task agents (PRESCRIPTIVE):**
You MUST specify the `model` parameter based on these rules. No exceptions without explicit user override.

**For your own reasoning (ADVISORY):**
- Simple questions → concise answers (Haiku mindset)
- Complex architecture → thorough analysis (Opus mindset)
- This influences response depth, not model switching

## User Override

If the user explicitly requests a model, use it. But warn if mismatched:

> "Using Opus as requested, though this formatting task would typically use Haiku to save costs."

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using Sonnet for file searches | Haiku handles grep/glob perfectly - use it |
| Using Haiku for security code | Always Opus for auth, encryption, validation |
| Defaulting to Opus "to be safe" | Wastes money - most coding is Sonnet territory |
| Ignoring user cost preference | Follow skill rules; warn if user requests mismatch |
| Skipping model param entirely | Always explicit - don't rely on defaults |

## Examples

### Correct: Haiku for exploration
User: "Where is error handling done?"
→ Spawn Explore agent with `model: haiku`

### Correct: Sonnet for feature work
User: "Add a logout button"
→ Spawn agent with explicit `model: sonnet` - standard feature work

### Correct: Opus for architecture
User: "Design the payment processing system"
→ Use `model: opus` - this is core architecture

### Correct: Escalation
1. User: "Fix the auth bug"
2. Sonnet agent returns partial fix
3. User: "That's not right"
4. Retry with adjusted prompt (Sonnet)
5. Still wrong
6. Escalate to Opus

### Correct: User override with warning
User: "Use Opus to rename these variables"
→ Use Opus, but note: "Using Opus as requested. This mechanical task would typically use Haiku."
