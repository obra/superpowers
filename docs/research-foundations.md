# Research Foundations

The Vidably custom skills are designed based on empirical research on multi-agent AI workflows, not intuition. This document cites the sources and explains how each finding shaped the skill design.

## Key Research

### 1. Consensus beats voting for code review

**Source:** [Voting or Consensus? Decision-Making in Multi-Agent Debate](https://arxiv.org/html/2502.19130v4) (arXiv, 2025)

**Finding:** On knowledge tasks (like code review), consensus-based approaches outperform voting by +2.8% accuracy. On reasoning tasks, voting is better (+13.2%).

**Implication:** Code review is primarily a knowledge task ("does this code have a bug?"), so our skills use consensus scoring, not majority vote. The consensus map in our review skills reflects this — we track which models agreed and use that to weight confidence, not to count ballots.

### 2. Independent initial drafts prevent groupthink

**Source:** Same arXiv paper (2502.19130v4)

**Finding:** "All-Agents Drafting" (each agent produces an independent analysis before seeing others) boosts accuracy by +3.3%. "Collective Improvement" (limited cross-agent communication) yields +7.4%.

**Implication:** Our review skills dispatch to each model independently with no shared context. Each model reviews the code/plan in isolation, then we synthesize after collection. This is why the skills say "do not share one model's findings with another" during the dispatch phase.

### 3. More debate rounds hurts performance

**Source:** Same arXiv paper (2502.19130v4)

**Finding:** Adding more discussion rounds **reduces** performance due to "problem drift" — models start optimizing for agreement rather than accuracy. Consensus converges naturally in 1.42 rounds on average.

**Implication:** Our skills use exactly 1 round of independent review + synthesis. No iterative debate. The GH Action uses max 3 rounds, but only because synthesis may push code changes that introduce new issues — each round reviews a new diff, not the same one repeatedly.

### 4. Multi-model review catches 3-5x more bugs

**Source:** [Multi-Model AI Code Review: Iterative Consensus Ensemble](https://zylos.ai/research/2026-02-17-multi-model-ai-code-review) (Zylos Research, 2026)

**Findings:**

- 7-15 percentage point improvement over best single model
- 3-5x more bugs found than single-pass review
- Only 3 misclassifications across 24+ total rounds (very low false positive rate)
- 60-70% of bugs discovered in the first half of rounds

**Implication:** Multi-model review has a strong empirical basis. The low false-positive rate means the findings are actionable, not noisy. The first-round discovery rate justifies our 1-round design — most value comes immediately.

### 5. Severity × agreement is the best scoring formula

**Source:** [calimero-network/ai-code-reviewer](https://github.com/calimero-network/ai-code-reviewer) (production system, 2025)

**Finding:** Ranking findings by `severity × agreement_count` dramatically reduces false positives compared to flat lists. The more models that independently flag the same issue, the higher confidence it's real.

**Implication:** Our consensus map tiers (Unanimous/Majority/Split/Solo) are a categorical version of this scoring. Unanimous critical > Solo critical > Unanimous minor.

### 6. Anti-sycophancy detection is essential

**Source:** [msitarzewski/duh](https://github.com/msitarzewski/duh) (multi-model consensus engine, 2025)

**Finding:** Models in debate tend toward sycophantic agreement. The duh project uses:

- Forced disagreement in the Challenge phase
- Jaccard similarity ≥ 0.7 for convergence detection
- Epistemic confidence caps by domain (factual 95%, technical 90%, creative 85%)
- Minority viewpoints preserved even after convergence

**Implication:** Our code review skill includes an "anti-sycophancy check" — when all models agree, verify it's genuine agreement (references a specific line, explains a concrete consequence) rather than parroting the same training pattern.

### 7. Different model architectures have uncorrelated blind spots

**Source:** Zylos ICE research + Milvus research (referenced in our GH Action synthesis prompt)

**Finding:** Claude, GPT, and Gemini find different categories of bugs. Claude tends to catch architectural and type safety issues. Codex catches logic errors and edge cases. Gemini catches consistency and documentation issues. Their blind spots don't overlap.

**Implication:** This is the entire justification for multi-model review. If all models found the same bugs, there would be no reason to use multiple. The uncorrelated blind spots mean each additional model adds genuine coverage.

### 8. Research-first workflows produce better decisions

**Source:** [Addy Osmani's LLM Coding Workflow](https://addyosmani.com/blog/ai-coding-workflow/) (2025) + UC San Diego/Cornell study on developer agency (2025)

**Findings:**

- Osmani's "Waterfall in 15 Minutes" — collaborative spec → reasoning model plan → iterate until coherent — consistently produces better outcomes than "just start coding"
- UCSD/Cornell found that professional developers "retain agency in software design, insist on fundamental software quality attributes, and deploy explicit control strategies"

**Implication:** Our exhaustive-research skill enforces research before decisions, but the Type 1/Type 2 triage ensures developers retain agency over when to apply the full process. The skill enhances human decision-making, not replaces it.

## How This Shaped Each Skill

| Skill                               | Key Research Inputs                                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **vidably-exhaustive-research**     | Research-first (Osmani), Type 1/Type 2 triage (UCSD/Cornell), multi-model perspective gathering (arXiv independent drafts)                         |
| **vidably-multi-agent-plan-review** | Independent dispatch (arXiv +3.3%), consensus scoring (arXiv +2.8%), severity × agreement (calimero-network), 1-round limit (arXiv, problem drift) |
| **vidably-multi-agent-code-review** | Uncorrelated blind spots (Zylos), 3-5x bug detection (Zylos), anti-sycophancy (duh), graceful degradation to persona diversity                     |

## Further Reading

- [obra/superpowers](https://github.com/obra/superpowers) — The upstream framework these skills extend
- [BryanHoo/superpowers-ccg](https://github.com/BryanHoo/superpowers-ccg) — Multi-CLI integration via MCP routing
- [ComposioHQ/agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator) — Production multi-agent orchestration with git worktrees
- [Virtua Cloud tutorial](https://www.virtua.cloud/learn/en/tutorials/ai-code-review-github-actions-vps) — Dual-model CI review with aggregation workflow
