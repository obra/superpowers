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

**Implication:** Our local skills use exactly 1 round of independent review + synthesis. No iterative debate.

**Important distinction: debate vs re-review.** The arXiv finding applies to _debate_ (same models discussing the same content repeatedly). Our GH Action uses _re-review_ (each round reviews a NEW diff after synthesis pushes fixes). These are different patterns:

|                     | Debate (what research tested)        | Re-review (what our GH Action does)               |
| ------------------- | ------------------------------------ | ------------------------------------------------- |
| Context             | Same content, shared findings        | New diff each round                               |
| Goal                | Converge on opinion                  | Catch new/remaining bugs                          |
| Drift risk          | High — models optimize for agreement | Low — new code = fresh analysis                   |
| Diminishing returns | After ~1.4 rounds                    | After 2-3 rounds (synthesis stops finding issues) |

**Our decision:** We use up to 3 rounds everywhere — both local skills and GH Action — because both are re-review patterns (fresh content each round). We initially designed local skills with 1 round to be "fast," but realized that's optimizing for speed over quality with no research basis. A bad plan wastes more time than an extra review round.

**Why not 1 round locally?** There's no quality argument for a different bar between local and CI. Both patterns review fresh content after fixes. The arXiv drift warning doesn't apply to re-review. If 3 rounds is the right number for CI quality, it's the right number for local quality.

**Why not unlimited rounds?** Diminishing returns. Our data from PR #10 shows: round 1 found 5 issues, round 2 found 6 issues (in the fixed code), round 3 found 0 critical issues. The convergence signal is "zero accepted findings" — that's when we stop, regardless of round count. The 3-round cap prevents pathological cases.

**Why the escalating policy (all → new-only → critical-only)?** Prevents the synthesis from endlessly polishing. Round 1 is the broad sweep. Round 2 catches issues introduced by round 1 fixes. Round 3 is a safety net for anything truly dangerous. This graduated approach matches our observed data: most value comes in rounds 1-2, round 3 is clean-up.

**Why not the debate pattern (same content, multiple rounds)?** The arXiv paper is clear: debate performance degrades after ~1.4 rounds. Models start optimizing for agreement. We explicitly avoid this by ensuring each round reviews different content (the updated plan or diff after fixes). The skill instructions say "dispatch the UPDATED plan/diff" — never the same content twice.

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

## Design Decisions and Rejected Alternatives

### Consensus scoring vs majority voting

**Chosen:** Consensus scoring (Unanimous/Majority/Split/Solo tiers with severity × agreement weighting)

**Rejected:** Simple majority voting (≥50% of models agree → accept)

**Why:** The arXiv paper (2502.19130) shows consensus outperforms voting by +2.8% on knowledge tasks like code review. Voting treats all findings as equal; consensus allows a solo critical security finding to outrank a unanimous minor style issue. The calimero-network production system validates this — their `severity × agreement` formula dramatically reduced false positives vs flat lists.

**Why not voting:** Voting is better for reasoning tasks (+13.2%), but code review is a knowledge task. Voting also creates a "tyranny of the majority" where a genuine insight from one model gets dismissed because the others missed it.

### Independent dispatch vs shared context

**Chosen:** Each model reviews independently with no access to other models' findings.

**Rejected:** Sequential review where each model sees prior models' findings (debate/chain pattern).

**Why:** The arXiv paper found independent initial drafts boost accuracy by +3.3%. Shared context causes premature convergence — models anchor on the first model's opinion rather than forming their own. The duh project specifically designed forced disagreement to counter this.

**Why not shared context:** Sharing findings sounds efficient (avoid duplicates), but it introduces sycophantic agreement. Models seeing Claude's findings tend to agree with Claude rather than find new issues. The uncorrelated blind spots (Zylos) only work if models review independently.

### Re-review pattern vs debate pattern

**Chosen:** Up to 3 rounds of re-review (each round reviews UPDATED content after fixes)

**Rejected:** Iterative debate (models discuss the same content back and forth)

**Why:** The arXiv paper is unambiguous — debate performance degrades after ~1.4 rounds due to problem drift. But re-review doesn't suffer this because the content changes between rounds. Our PR #10 data confirms: round 1 found 5 issues, round 2 found 6 new issues in the fixed code. Round 2 was productive because it reviewed different code.

**Why not debate:** Models optimizing for agreement is exactly the failure mode we want to avoid. Re-review avoids it structurally — there's nothing to "agree" on because the code changed.

### Type 1/Type 2 triage vs always-on research

**Chosen:** Triage gate — only Type 1 (consequential) decisions get the full exhaustive research treatment.

**Rejected:** Apply exhaustive research to every decision regardless of impact.

**Why:** The UCSD/Cornell study found professional developers "deploy explicit control strategies" — they need agency over when process is applied. Multiple review rounds (Gemini, Codex, our own experience) flagged that forcing 4+ options on trivial choices causes "skill fatigue" where developers learn to bypass the skill entirely. The triage gate channels the rigor where it matters.

**Why not always-on:** A Type 2 decision (variable naming, UI spacing) has a reversal cost of minutes. Spending 5 minutes researching 4 options for it is a net time loss. The skill should amplify good judgment, not replace it with process.

### Persona diversity fallback vs single-model review

**Chosen:** When external CLIs aren't available, dispatch two Claude Code subagents with different system prompts (security-focused, maintainability-focused).

**Rejected:** Just use one Claude Code review and accept the coverage gap.

**Why:** The Zylos research shows different perspectives find different bugs. While two Claude subagents don't have truly uncorrelated architectures (same underlying model), persona prompting shifts attention and produces measurably different findings. The BryanHoo/superpowers-ccg project routes by domain (backend → Codex, frontend → Gemini) for the same reason.

**Why not just one review:** The whole value proposition of multi-agent review is perspective diversity. Gracefully degrading to "one review" abandons the methodology entirely. Persona diversity is an imperfect substitute, but it's better than nothing.

### File-based synthesis output vs PR comment posting

**Chosen:** Synthesis agent writes `synthesis-summary.md`, workflow validates and posts it.

**Rejected:** Synthesis agent posts PR comments directly via `gh pr comment`.

**Why:** We discovered (the hard way, PR #10) that `claude-code-action` in agent mode silently denies write tool permissions — the agent tried 116 times to write/post and was denied every time. File-based output decouples creation from posting, allows the workflow to validate required sections exist, and posts a visible warning if the agent fails to produce the summary. The agent's job is analysis; the workflow's job is delivery.

**Why not direct posting:** It worked conceptually but failed operationally. The action's permission model is designed for read-only review, not write operations. Even with `--allowedTools`, the file-based approach is more robust because it's verifiable before posting.

### Anti-rationalization tables vs trust-the-model

**Chosen:** Every skill includes an explicit table of "thoughts vs reality" for known failure modes.

**Rejected:** Trust the model to follow instructions without listing escape hatches.

**Why:** The obra/superpowers framework battle-tested this approach extensively. Their TDD skill has 12+ entries. In our own usage, the synthesis agent skipped writing the summary file twice — exactly the failure mode the anti-rationalization table was designed to prevent. These tables work because LLMs are excellent at rationalizing shortcuts; the tables pre-empt the specific rationalizations we've observed.

**Why not trust the model:** We literally watched it happen. Two synthesis runs with "CRITICAL: you MUST write synthesis-summary.md" in the prompt, and the agent still didn't write it (partly due to permissions, partly due to rationalization). Anti-rationalization tables aren't paranoia — they're learned from real failure modes.

## How This Shaped Each Skill

| Skill                               | Key Research Inputs                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **vidably-exhaustive-research**     | Research-first (Osmani), Type 1/Type 2 triage (UCSD/Cornell), multi-model perspective gathering (arXiv independent drafts)                                                     |
| **vidably-multi-agent-plan-review** | Independent dispatch (arXiv +3.3%), consensus scoring (arXiv +2.8%), severity × agreement (calimero-network), up to 3 re-review rounds (arXiv re-review vs debate distinction) |
| **vidably-multi-agent-code-review** | Uncorrelated blind spots (Zylos), 3-5x bug detection (Zylos), anti-sycophancy (duh), graceful degradation to persona diversity, file-based synthesis output (PR #10 failure)   |

## Further Reading

- [obra/superpowers](https://github.com/obra/superpowers) — The upstream framework these skills extend
- [BryanHoo/superpowers-ccg](https://github.com/BryanHoo/superpowers-ccg) — Multi-CLI integration via MCP routing
- [ComposioHQ/agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator) — Production multi-agent orchestration with git worktrees
- [Virtua Cloud tutorial](https://www.virtua.cloud/learn/en/tutorials/ai-code-review-github-actions-vps) — Dual-model CI review with aggregation workflow
