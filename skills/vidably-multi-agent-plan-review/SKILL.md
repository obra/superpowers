---
name: vidably-multi-agent-plan-review
description: "Use after writing or updating an implementation plan, before beginning implementation — dispatches the plan to multiple AI models for independent critique, then synthesizes findings with consensus scoring."
---

# Multi-Agent Plan Review

After writing a plan and before implementing it, dispatch the plan to multiple AI models for independent review. Each model reviews independently (no shared context — this prevents premature convergence). Then synthesize findings using consensus scoring.

Research shows: multi-model debate catches 80% of bugs vs 53% for single model, and consensus-based approaches outperform voting for knowledge tasks like review (+2.8% accuracy). Independent initial drafts are critical — they boost accuracy by +3.3%.

<HARD-GATE>
Do NOT begin implementation until:
1. At least 2 independent model reviews have been collected
2. Consensus scoring has been applied to all findings
3. The user has reviewed and approved the consensus map
</HARD-GATE>

## Step 1: Prepare the Plan for Review

Read the plan file. Verify it's complete (not a draft or placeholder). If incomplete, tell the user it's not ready for review.

Construct the review prompt — this exact prompt goes to every model:

```
You are a senior software architect reviewing an implementation plan.

Review for:
1. Missing steps or gaps — are there steps that should exist but don't?
2. Over-engineering — is anything unnecessarily complex for the stated goals?
3. Feasibility — are any steps impossible or unrealistic?
4. Ordering issues — are dependencies between steps correct?
5. Simpler alternatives — could any step be achieved more simply?

For each finding: state what's wrong, why it matters, and what to do instead. Only flag substantive concerns — not style, formatting, or documentation.

Here is the plan:

[PLAN CONTENT]
```

## Step 2: Dispatch to Available Models

Dispatch the plan to all available models **in parallel** for independent review. Each model must review independently — do not share one model's findings with another.

**Always available:**

- Claude Code subagent (use the Agent tool with a fresh subagent)

**Check availability and dispatch if present:**

- Codex: `which codex && codex exec -C "$(pwd)" "[review prompt]"`
- Gemini: `which gemini && gemini --allowed-mcp-server-names="" -p "[review prompt]"`

**CLI gotchas (learned from real usage):**

- Codex: No `--quiet` flag. Use `codex exec`. For large plans, use stdin: `cat plan.md | codex exec -C "$(pwd)" -`
- Gemini: MCP servers can hang indefinitely. ALWAYS use `--allowed-mcp-server-names=""` for non-interactive mode.
- Gemini: `-p` flag is REQUIRED for headless mode. Without it, Gemini opens an interactive session.
- Codex: Use `-C <dir>` to set the working directory. Without it, Codex runs from the default directory and can't find repo files.
- Both: Set a 5-minute timeout. Kill and move on if exceeded.

**Graceful degradation:** If external CLIs aren't available, dispatch two Claude Code subagents with different system prompts:

1. "You are a security-focused architect. Focus on threat modeling, auth boundaries, and data flow risks."
2. "You are a performance-focused architect. Focus on scalability, latency, unnecessary complexity, and operational cost."

This provides perspective diversity even with a single model family.

## Step 3: Collect and Score Findings

After all models respond, deduplicate findings by theme and apply consensus scoring:

| Consensus Level                    | Definition                             | Default Action                              |
| ---------------------------------- | -------------------------------------- | ------------------------------------------- |
| **Unanimous** (all models agree)   | Every model that reviewed flagged this | Fix it — high confidence                    |
| **Majority** (>50% agree, not all) | Most models flagged it, some didn't    | Likely fix — investigate carefully          |
| **Split** (2+ agree, ≤50%)         | Models disagree                        | Use judgment — apply project philosophy     |
| **Solo** (1 model only)            | Only one model flagged it              | Evaluate independently — don't auto-dismiss |

**Scoring formula:** `severity × agreement_count` — findings flagged by more models rank higher.

**Solo findings deserve attention.** Research shows different model architectures have uncorrelated blind spots. A solo security finding may be the most important one. Evaluate on merit, not consensus alone.

## Step 4: Present Consensus Map

Present findings to the user in this format:

```markdown
## Plan Review Consensus — [Plan Name]

### Models Consulted

- Claude Code subagent: [summary of review]
- Codex: [summary or "not available"]
- Gemini: [summary or "not available"]

### Findings (ranked by severity × agreement)

| Finding | Consensus | Models        | Severity  | Recommendation            |
| ------- | --------- | ------------- | --------- | ------------------------- |
| [issue] | Unanimous | All 3         | Critical  | Fix before implementation |
| [issue] | Majority  | Claude, Codex | Important | Recommend fixing          |
| [issue] | Solo      | Gemini        | Important | Evaluate — [reasoning]    |

### Recommended Plan Changes

1. [specific change with location in plan]
2. ...

### No Action Needed

- [findings that were evaluated and dismissed with reasoning]
```

Then STOP and wait for user approval.

## Step 5: Apply Approved Changes

After user reviews the consensus map:

- Apply approved changes to the plan file
- Note rejected findings and reasons
- Re-read the updated plan to verify consistency

## Anti-Rationalization Table

| Thought                                                           | Reality                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| "The plan looks fine, no need for multi-model review"             | You wrote the plan. You have blind spots. That's exactly why we use multiple models.       |
| "Only one external model is available, not worth it"              | Two perspectives (Claude + one external) is still better than one. Dispatch what you have. |
| "The findings are all minor"                                      | Present them anyway. The user decides what's minor, not you.                               |
| "I'll just incorporate the feedback myself without presenting it" | The consensus map IS the deliverable. The user must see which models agreed and disagreed. |
| "This is a small plan, multi-model review is overkill"            | Small plans with wrong assumptions waste more time than large plans. Review anyway.        |

## Interaction With Other Skills

- `TRIGGERS AFTER: writing-plans` — Automatically invoke this skill after a plan is written.
- `TRIGGERS BEFORE: subagent-driven-development` — Plan must be reviewed before implementation begins.
- `TRIGGERS BEFORE: executing-plans` — Same gate for inline execution.
