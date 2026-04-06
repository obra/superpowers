---
name: vidably-multi-agent-plan-review
description: "Use after writing or updating an implementation plan, before beginning implementation — dispatches the plan to multiple AI models for independent critique, then synthesizes findings with consensus scoring."
---

# Multi-Agent Plan Review

After writing a plan and before implementing it, dispatch the plan to multiple AI models for independent review. Each model reviews independently (no shared context — this prevents premature convergence). Then synthesize findings using consensus scoring.

Research shows: multi-model consensus catches 80% of bugs vs 53% for single model (+2.8% accuracy). Independent initial drafts boost accuracy by +3.3%. Each round should review fresh content (re-review pattern), not debate the same content (which causes problem drift).

**Round policy:** Up to 3 rounds. Each round reviews the UPDATED plan after fixes are applied. Round 3 is conservative (only critical findings). Stop early if a round produces zero changes. This is the same re-review pattern used in the GH Action — the quality bar should be the same locally and in CI.

<HARD-GATE>
Do NOT begin implementation until:
1. At least 2 independent model reviews have been collected
2. Consensus scoring has been applied to all findings
3. Findings have been acted on based on consensus level (see Action Policy below)
4. If fixes were made, the plan has been re-reviewed
</HARD-GATE>

## Action Policy

Act on findings autonomously based on consensus level:

| Consensus     | Action                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unanimous** | Fix immediately -- highest confidence                                                                                                        |
| **Majority**  | Fix -- strong signal across models                                                                                                           |
| **Split**     | Use judgment. Fix if the finding has concrete consequences; skip if it's a style or preference disagreement. Log your reasoning.             |
| **Solo**      | Evaluate on merit. Fix if critical severity regardless of consensus. For important/minor, fix if the reasoning is sound. Log your reasoning. |

Present the consensus map to the user for awareness, but do not wait for per-finding approval. The user reviews aggregate effectiveness data periodically, not individual findings.

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
- Gemini: `which gemini && gemini --allowed-mcp-server-names _none -p "[review prompt]"`

**CLI gotchas (learned from real usage):**

- Codex: No `--quiet` flag. Use `codex exec`. For large plans, use stdin: `cat plan.md | codex exec -C "$(pwd)" -`
- Gemini: ALWAYS disable MCP servers with `--allowed-mcp-server-names _none` (passes a dummy name so no real MCP servers connect). Do NOT use `=""` — that passes an empty string which crashes the Gemini policy engine.
- Gemini: `-p` flag is REQUIRED for headless mode. Without it, Gemini opens an interactive session.
- Codex: Use `-C <dir>` to set the working directory. Without it, Codex runs from the default directory and can't find repo files.
- Both: Set a 5-minute timeout. Kill and move on if exceeded.

**Graceful degradation:** If external CLIs aren't available, dispatch two Claude Code subagents with different system prompts:

1. "You are a security-focused architect. Focus on threat modeling, auth boundaries, and data flow risks."
2. "You are a performance-focused architect. Focus on scalability, latency, unnecessary complexity, and operational cost."

This provides perspective diversity even with a single model family.

**Fallback reviewer identity:** When logging to the effectiveness tracker, collapse fallback Claude subagents into a single logical "Claude" reviewer. Do not count them as two separate models -- the hit-rate matrix tracks model architectures, not prompt variants.

## Step 3: Collect and Score Findings

After all models respond, deduplicate findings by theme and apply consensus scoring:

| Consensus Level                    | Definition                             |
| ---------------------------------- | -------------------------------------- |
| **Unanimous** (all models agree)   | Every model that reviewed flagged this |
| **Majority** (>50% agree, not all) | Most models flagged it, some didn't    |
| **Split** (2+ agree, ≤50%)         | Models disagree                        |
| **Solo** (1 model only)            | Only one model flagged it              |

See the **Action Policy** above for how to act on each level.

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

Present the consensus map, then proceed to apply fixes based on the Action Policy above. The user can intervene if they disagree, but the default is autonomous action.

## Step 5: Apply Fixes and Re-Review

After presenting the consensus map, apply fixes per the Action Policy:

1. Apply fixes to the plan file based on consensus level
2. Note skipped findings with reasoning (logged in Step 6b)
3. Re-read the updated plan to verify consistency

**If changes were made, re-review (up to 3 rounds total):**

4. Dispatch the UPDATED plan to all available models (Steps 2-4 again)
5. This catches issues introduced by the fixes and gaps the first round missed
6. Present the new consensus map to the user

**Round policy:**

- **Round 1:** Address all findings
- **Round 2:** Address findings from round 2 reviews only (issues introduced by round 1 fixes, or issues missed in round 1)
- **Round 3:** Only critical findings. Everything else is deferred.
- **Stop early:** If a round produces zero accepted findings, the plan is ready. Don't force more rounds.

This is the same re-review pattern the GH Action uses — each round reviews fresh content, not the same content debated again.

## Anti-Rationalization Table

| Thought                                                           | Reality                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| "The plan looks fine, no need for multi-model review"             | You wrote the plan. You have blind spots. That's exactly why we use multiple models.       |
| "Only one external model is available, not worth it"              | Two perspectives (Claude + one external) is still better than one. Dispatch what you have. |
| "The findings are all minor"                                      | Present them anyway. The consensus map shows the user what was found; the Action Policy governs disposition. |
| "I'll just incorporate the feedback myself without presenting it" | The consensus map IS the deliverable. The user must see which models agreed and disagreed. |
| "This is a small plan, multi-model review is overkill"            | Small plans with wrong assumptions waste more time than large plans. Review anyway.        |

## Step 6: Update Workflow State and Event Log

After all review rounds complete and findings have been acted on per the Action Policy, update the enforcement state. The user can intervene at any point, but the default is autonomous completion. **This is the gate key — once this fires, the Write/Edit implementation gate unlocks.**

```bash
# Update workflow state (this unlocks the implementation gate)
STATE=".claude/workflow-state.json"
if [ -f "$STATE" ]; then
  python3 -c "
import json, datetime
d = json.load(open('$STATE'))
d['planReviewed'] = True
d['planReviewedAt'] = datetime.datetime.utcnow().isoformat() + 'Z'
json.dump(d, open('$STATE', 'w'))
"
fi

# Append to event log
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"branch\":\"$(git branch --show-current)\",\"event\":\"plan_review_complete\",\"sha\":\"$(git rev-parse --short HEAD)\",\"models\":MODELS_LIST,\"findings\":FINDINGS_COUNT,\"rounds\":ROUNDS_COUNT}" >> .claude/workflow-events.jsonl
```

Replace `MODELS_LIST` with a JSON array of model names used (e.g., `[\"codex\",\"gemini\"]`), `FINDINGS_COUNT` with total findings across all rounds, and `ROUNDS_COUNT` with the number of review rounds.

## Step 6b: Log Findings to Effectiveness Tracker

After all review rounds complete, append a new section to `docs/plan-review-effectiveness.md` under the `## Plan Review Log` heading:

```markdown
### [Branch Name] -- [Feature Description]

**Date:** [YYYY-MM-DD]
**Models:** [list of models used]
**Rounds:** [number of review rounds]

| Finding       | Flagged By    | Category         | Consensus | Disposition | Reasoning |
| ------------- | ------------- | ---------------- | --------- | ----------- | --------- |
| [description] | Claude, Codex | `failure-modes`  | Majority  | Fixed       | --        |
| [description] | Gemini        | `data-integrity` | Solo      | Skipped     | [why]     |

**Key takeaways:** [auto-generated summary of what was found and patterns observed]
```

Then update the tracking tables in `docs/plan-review-effectiveness.md`:

- **Model Hit Rate by Category**: For each finding, increment `total opportunities` for every model that reviewed. Increment `caught` for each model that flagged the finding.
- **Model Profiles**: Update if new strengths or blind spots become apparent.
- **Aggregate Metrics**: Update with the new data point.

**Sanitization rule:** Log normalized summaries only. Do not include secrets, tokens, PII, customer identifiers, raw payloads, or exploit details in effectiveness tracker entries.

This logging step is mandatory and automated -- if the skill runs, the data gets logged.

## Interaction With Other Skills

- `TRIGGERS AFTER: writing-plans` — Automatically invoke this skill after a plan is written.
- `TRIGGERS BEFORE: subagent-driven-development` — Plan must be reviewed before implementation begins.
- `TRIGGERS BEFORE: executing-plans` — Same gate for inline execution.
