---
name: premise-check
description: "Validates whether proposed or in-progress work should exist before investing in it. Invoke BEFORE designing, planning, or building anything non-trivial — and WHEN new evidence arrives that could change the motivation for existing work. Triggers on: 'design a system', 'create a plan', 'build out the full version', 'extend this to handle', architecture proposals, or any moment where test results, research findings, or changed requirements weaken the original reason for doing something. Also triggers when you catch yourself updating a document's facts without reassessing its conclusions."
---

# Premise Check

## Why This Exists

It's easy to treat a design request as unconditional — "user asked me to design X, so I'll design the best X I can." But the right answer is sometimes "X shouldn't exist." Without a deliberate check, effort flows into comprehensive designs that solve problems that are already handled, cost more than they're worth, or whose motivation evaporated when new evidence arrived.

The most dangerous failure mode isn't building something wrong — it's building something unnecessary with conviction.

## When to Apply

- Before investing in any design, plan, or architecture proposal
- Before extending an existing system with significant new complexity
- When new evidence (test results, research, changed requirements) arrives that relates to the motivation behind proposed or in-progress work
- When you find yourself updating facts in a document without reassessing whether the document's conclusions still hold

## The Check

Answer these three questions honestly before proceeding:

1. **Does the problem actually exist, or is it already solved?**
   Look at what's already in place. Check whether existing mechanisms already cover the gap. If the problem was hypothetical when the work was proposed, has it since been confirmed or disproven?

2. **Is the proposed solution proportional to the problem?**
   Compare the complexity, maintenance burden, and token/time cost of the solution against the severity and frequency of the problem. A rare edge case doesn't justify a framework. Three lines of code don't need an abstraction.

3. **What's the cost of NOT building this?**
   If the answer is "nothing breaks, things are just slightly less elegant" — that's a strong signal to skip it.

## What to Do With the Answers

- If all three pass: proceed, but note why you believe the work is justified.
- If any answer is unfavorable: **say so directly**. Recommend against proceeding and explain why. Don't just note the concern and keep building — stop and surface the tradeoff to the user.
- If evidence has changed since the work was originally proposed: reassess the conclusions, not just the facts. Updated facts with unchanged conclusions is the specific failure mode this check exists to catch.
