---
name: deliberation
description: >
  Use BEFORE brainstorming when facing a complex architectural, technology,
  or design decision where the options are not yet well-defined or the
  problem itself may need reframing. Assembles named stakeholder perspectives
  that each speak once without debate, then surfaces where they converge and
  where real tension remains — without forcing a premature choice. Triggers
  on: "should we use X or Y", "not sure which approach", "evaluate these
  options", "what are the trade-offs between", "help me think through this
  decision", "architecture decision", "technology choice". Routed by
  using-superpowers before brainstorming when the decision space is unclear.
---

# Deliberation

Surface genuine tension in a decision before committing to a direction.

## When to use

Some decisions get worse when you're forced to choose too early. Use deliberation when:

- The options themselves are not yet well-defined
- The problem may be framed incorrectly (the real question hasn't been asked)
- Multiple legitimate constraints pull in different directions
- Brainstorming feels premature — there's no clear "right shape" for the solution yet

**Do not use for:** decisions that are already well-framed with clear options. Those go directly to `brainstorming`. Deliberation is for when you're not yet ready for options.

## Procedure

### 1. Name the decision

State the decision being deliberated in one sentence. Be precise — a vague decision produces vague perspectives.

> Example: "Should we migrate the authentication layer from JWT to session cookies?"

### 2. Identify 3–5 genuine stakeholder perspectives

Choose perspectives that have real, distinct stakes in the decision. Each perspective represents a legitimate set of constraints or values — not a person, but a role with a coherent viewpoint.

Good perspectives for technical decisions:
- **The Security Engineer** — attack surface, credential management, audit trail
- **The Developer Experience Advocate** — implementation complexity, debugging, onboarding
- **The Ops/Infrastructure Engineer** — deployment, scaling, observability, failure modes
- **The Maintainability Advocate** — long-term code health, testability, cognitive load
- **The Performance Engineer** — latency, throughput, caching, resource cost
- **The User/Product Perspective** — visible user impact, reliability, behaviour changes

Choose only perspectives with genuine stakes in *this specific decision*. Three well-chosen perspectives beat five generic ones.

### 3. Let each perspective speak once

For each perspective in turn:
- State what this perspective most values in the context of this decision
- Identify the specific concern or constraint it sees
- Name what it would lose in each direction being considered

**Ground rules:**
- Each perspective speaks once only — no rebuttal, no scoring, no debate
- Do not rank or evaluate perspectives as they speak
- Do not let one perspective address another's concerns

### 4. Listen for convergence and tension

After all perspectives have spoken, identify:

**Convergence** — where all (or most) perspectives agree, despite coming from different values. These points are load-bearing: a decision that violates them will cause problems regardless of which option is chosen.

**Live tension** — where perspectives genuinely disagree and no option fully satisfies all of them. These are the real trade-offs. Do not paper over them — surface them explicitly.

**Reframes** — where the act of hearing all perspectives reveals that the original decision was mis-stated, and the real question is something else entirely.

### 5. Output

```
## Deliberation: [Decision statement]

### Perspectives

**[Perspective name]**
Values: [What this perspective cares about most]
Concern: [The specific risk or constraint it sees]
What it loses going left: [Downside of option A]
What it loses going right: [Downside of option B]

[Repeat for each perspective]

### Convergence
[Points where perspectives agree regardless of their different values]

### Live Tension
[Where perspectives genuinely disagree — the real trade-offs that cannot be avoided]

### Reframe (if applicable)
[If the deliberation revealed that the original question was wrong, state the better question here]

### Next step
[One of:
- "proceed to brainstorming with this framing"
- "return to user — the decision needs more information before proceeding"
- "the reframe changes the scope — revisit premise-check before continuing"
  *(Loop guard: if premise-check has already been invoked for this task, skip it and proceed directly to brainstorming. Never cycle between deliberation and premise-check more than once.)*
]
```

## Rules

- Do not force a conclusion. The output is clarity about the decision space, not a recommendation.
- Do not let any perspective "win" the deliberation. All tensions remain visible.
- If the deliberation reveals a reframe, do not proceed to brainstorming until the reframe is acknowledged by the user.
- Keep each perspective to 3–5 sentences. Deliberation is not brainstorming — it is structured listening.
- If fewer than 3 genuine perspectives exist for this decision, the decision is probably already well-framed. Use `brainstorming` instead.
