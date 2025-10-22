---
name: Preserving Productive Tensions
description: Recognize when disagreements reveal valuable context, preserve multiple valid approaches instead of forcing premature resolution
when_to_use: when oscillating between equally valid approaches that optimize for different legitimate priorities
version: 1.1.0
---

# Preserving Productive Tensions

## Overview

Some tensions aren't problems to solve - they're valuable information to preserve. When multiple approaches are genuinely valid in different contexts, forcing a choice destroys flexibility.

**Core principle:** Preserve tensions that reveal context-dependence. Force resolution only when necessary.

## Recognizing Productive Tensions

**A tension is productive when:**
- Both approaches optimize for different valid priorities (cost vs latency, simplicity vs features)
- The "better" choice depends on deployment context, not technical superiority
- Different users/deployments would choose differently
- The trade-off is real and won't disappear with clever engineering
- Stakeholders have conflicting valid concerns

**A tension needs resolution when:**
- Implementation cost of preserving both is prohibitive
- The approaches fundamentally conflict (can't coexist)
- There's clear technical superiority for this specific use case
- It's a one-way door (choice locks architecture)
- Preserving both adds complexity without value

## Preservation Patterns

### Pattern 1: Configuration
Make the choice configurable rather than baked into architecture:

```python
class Config:
    mode: Literal["optimize_cost", "optimize_latency"]
    # Each mode gets clean, simple implementation
```

**When to use:** Both approaches are architecturally compatible, switching is runtime decision

### Pattern 2: Parallel Implementations
Maintain both as separate clean modules with shared contract:

```python
# processor/batch.py - optimizes for cost
# processor/stream.py - optimizes for latency
# Both implement: def process(data) -> Result
```

**When to use:** Approaches diverge significantly, but share same interface

### Pattern 3: Documented Trade-off
Capture the tension explicitly in documentation/decision records:

```markdown
## Unresolved Tension: Authentication Strategy

**Option A: JWT** - Stateless, scales easily, but token revocation is hard
**Option B: Sessions** - Easy revocation, but requires shared state

**Why unresolved:** Different deployments need different trade-offs
**Decision deferred to:** Deployment configuration
**Review trigger:** If 80% of deployments choose one option
```

**When to use:** Can't preserve both in code, but need to document the choice was deliberate

## Red Flags - You're Forcing Resolution

- Asking "which is best?" when both are valid
- "We need to pick one" without explaining why
- Choosing based on your preference vs user context
- Resolving tensions to "make progress" when preserving them IS progress
- Forcing consensus when diversity is valuable

**All of these mean: STOP. Consider preserving the tension.**

## When to Force Resolution

**You SHOULD force resolution when:**

1. **Implementation cost is prohibitive**
   - Building/maintaining both would slow development significantly
   - Team doesn't have bandwidth for parallel approaches

2. **Fundamental conflict**
   - Approaches make contradictory architectural assumptions
   - Can't cleanly separate concerns

3. **Clear technical superiority**
   - One approach is objectively better for this specific context
   - Not "I prefer X" but "X solves our constraints, Y doesn't"

4. **One-way door**
   - Choice locks us into an architecture
   - Migration between options would be expensive

5. **Simplicity requires choice**
   - Preserving both genuinely adds complexity
   - YAGNI: Don't build both if we only need one

**Ask explicitly:** "Should I pick one, or preserve both as options?"

## Documentation Format

When preserving tensions, document clearly:

```markdown
## Tension: [Name]

**Context:** [Why this tension exists]

**Option A:** [Approach]
- Optimizes for: [Priority]
- Trade-off: [Cost]
- Best when: [Context]

**Option B:** [Approach]
- Optimizes for: [Different priority]
- Trade-off: [Different cost]
- Best when: [Different context]

**Preservation strategy:** [Configuration/Parallel/Documented]

**Resolution trigger:** [Conditions that would force choosing one]
```

## Examples

### Productive Tension (Preserve)
"Should we optimize for cost or latency?"
- **Answer:** Make it configurable - different deployments need different trade-offs

### Technical Decision (Resolve)
"Should we use SSE or WebSockets?"
- **Answer:** SSE - we only need one-way communication, simpler implementation

### Business Decision (Defer)
"Should we support offline mode?"
- **Answer:** Don't preserve both - ask stakeholder to decide based on user needs

## Remember

- Tensions between valid priorities are features, not bugs
- Premature consensus destroys valuable flexibility
- Configuration > forced choice (when reasonable)
- Document trade-offs explicitly
- Resolution is okay when justified
