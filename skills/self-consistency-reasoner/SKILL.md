---
name: self-consistency-reasoner
description: >
  Internal reasoning technique invoked by systematic-debugging and
  verification-before-completion for high-stakes multi-step inference.
  Generates N independent reasoning paths and takes majority vote to
  surface confident-but-wrong single-chain failures. DO NOT invoke
  independently — this skill is embedded in the skills that need it.
---

# Self-Consistency Reasoner

A structured reasoning technique based on the Self-Consistency method (Wang et al., ICLR 2023).

**Core idea**: Complex problems often have multiple valid paths to the correct answer. Incorrect reasoning, even when confident-sounding, tends to scatter across different wrong answers. By generating N independent reasoning paths and taking majority vote, we reliably surface the correct answer and get a built-in confidence signal for free.

---

## When This Fires

This skill is invoked internally by:
- **systematic-debugging** — during root cause hypothesis generation (Phase 3)
- **verification-before-completion** — during evidence evaluation

It fires when:
- The reasoning requires 3+ non-trivial steps
- A single reasoning chain could make a wrong assumption or logical error
- The answer has a **fixed answer set** (a root cause, yes/no, a specific conclusion)
- Being wrong has real cost (wrong diagnosis wastes edits; false "done" wastes review cycles)

---

## How Many Paths to Generate

Scale paths to difficulty:

| Problem Type | Paths |
|---|---|
| Binary verification (does this evidence prove the claim?) | 3 paths |
| Root cause diagnosis with 2-3 candidates | 5 paths |
| Complex multi-factor diagnosis or high-stakes verification | 7 paths |

Default: **5 paths**. Research shows gains plateau quickly — 5 captures most of the benefit of 40.

---

## The Process

### Step 1: Generate N Independent Reasoning Paths

Produce each path **independently** — don't let earlier paths contaminate later ones. Vary your approach deliberately:

- Use a different starting point or framing
- Work forward from given info in one path, backward from the goal in another
- Decompose the problem differently across paths
- For debugging: start from different points in the call stack, assume different failure modes
- For verification: evaluate the evidence from different angles (what would prove it true? what would prove it false?)

Each path must end with a **clearly parsed final answer**.

> Diversity is the whole point. Paths that all use the same approach just give you one answer repeated — that's not self-consistency, it's greedy decoding in disguise.

### Step 2: Aggregate via Majority Vote

Collect the final answers from all N paths. The most frequent answer wins.

Compute confidence:
- **Consistency %** = (paths agreeing with majority answer) / (total paths)

### Step 3: Act on Results

- **100% agreement**: Proceed with high confidence.
- **60-99% agreement**: Proceed but note the minority view. In debugging, mention the alternative hypothesis; in verification, flag the uncertainty.
- **<=50% agreement**: **STOP.** Do not proceed. The problem is genuinely ambiguous or underspecified. Report the top 2 competing conclusions and the key assumption that splits the paths. Ask the user for clarification or gather more evidence.

---

## Output Format

Do **not** show all paths to the user. The process is internal. Surface only the aggregated result:

```
**[Diagnosis/Verdict]**: [the majority-vote answer]
**Confidence**: [X/N paths agree] [high/moderate/low]

[Only if confidence < 80%]: Brief note on minority conclusion and the key divergence point.
```

---

## Key Principles from the Research

- **Majority vote outperforms probability-weighted aggregation** — just count, don't weight
- **Consistency correlates with accuracy** — high agreement is a reliable proxy for correctness
- **Diversity beats quantity** — 5 genuinely different paths beats 10 paths that all reason the same way
- **Works for zero-shot CoT** — no few-shot examples needed

---

## Related Skills

- `systematic-debugging` — invokes SC during root cause hypothesis testing
- `verification-before-completion` — invokes SC during evidence evaluation
