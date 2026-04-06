---
name: vidably-exhaustive-research
description: "Use when making a consequential decision — architecture, vendor/library choice, schema/data model, external services, or reusable UX patterns — before choosing an approach, exhaustively search for every possible solution and their tradeoffs."
---

# Exhaustive Research Before Decisions

Before any consequential decision, exhaustively search for every possible solution and their tradeoffs. Present structured options to the user. Do NOT proceed until the user approves an approach.

<HARD-GATE>
Do NOT implement, write code, or choose an approach until you have:
1. Triaged the decision as Type 1
2. Searched external sources (not just training data)
3. Presented 4+ options with tradeoffs
4. Received explicit user approval
</HARD-GATE>

## Step 0: Triage — Is This a Consequential Decision?

Before doing anything, classify the decision:

**Type 1 (irreversible or high-cost) — REQUIRES this skill:**

- Architecture patterns (state management, rendering strategy, data flow)
- Vendor or library choices (database, auth, payments, video processing)
- Schema or data model changes (new tables, field types, relationships)
- External service integrations (APIs, webhooks, event systems)
- Reusable UX patterns (design system choices, component architecture)

**Type 2 (reversible and low-cost) — SKIP this skill:**

- Bug fixes with obvious root cause
- UI tweaks (spacing, colors, copy)
- Already-specified decisions (plan says "use X")
- Standard library usage (which React hook, which utility function)
- Naming choices

If uncertain, ask the user: "This feels like it could go either way — is [decision] worth researching exhaustively, or should we just pick the obvious approach?"

## Step 1: Identify the Decision

State the specific decision clearly. Not "how to build X" (too broad). Instead:

- "Which state management approach for the video approval workflow"
- "Which upload library for the creator recording flow"
- "How to structure the evidence extraction pipeline"

## Step 2: Search External Sources

Your training data is stale. Search for current information before generating options.

Use WebSearch and WebFetch to find:

- **Official documentation** for relevant libraries/services
- **Expert blog posts** from recognized practitioners (not SEO content farms)
- **GitHub examples** of real implementations
- **Stack Overflow / community discussions** about tradeoffs people discovered in practice

Minimum 3 distinct sources. If you can't find 3, search with different terms or ask the user for leads.

Also dispatch to other models for additional perspectives if available:

- `codex exec "Research the best approaches for [decision]. List every viable option with concrete pros, cons, and code examples."` (if Codex CLI is available)
- `gemini --allowed-mcp-server-names _none -p "Research [decision]. What are the current best practices as of 2026? List every approach."` (if Gemini CLI is available)

Collect their responses and incorporate unique suggestions you didn't find yourself.

**Structured capture (for Step 7b logging):** Before synthesizing, record each model's raw option list separately in working memory, noting which options each model surfaced and any cited URLs. This is transient context only -- do not persist raw captures to files or logs (they may contain internal URLs or sensitive details). The per-model fields in the effectiveness tracker are derived from this captured data rather than reconstructed from memory.

## Step 3: Generate Exhaustive Options

List every viable approach, including unconventional ones. Minimum 4 options.

For each option, provide:

| Dimension            | What to include                                    |
| -------------------- | -------------------------------------------------- |
| **Approach**         | Name and one-line summary                          |
| **How it works**     | 3-5 sentence explanation                           |
| **Code sketch**      | Concrete code showing the pattern (not pseudocode) |
| **Pros**             | Specific, measurable benefits                      |
| **Cons**             | Specific, measurable costs                         |
| **Maintenance cost** | What does ongoing maintenance look like?           |
| **Migration cost**   | How hard is it to switch away from this later?     |

## Step 4: Rate and Compare

Present a rating table:

| Option   | Maintainability | Complexity | Extensibility | UX Quality | Total |
| -------- | :-------------: | :--------: | :-----------: | :--------: | :---: |
| Option A |        4        |     2      |       5       |     4      |  15   |
| Option B |        3        |     4      |       3       |     5      |  15   |
| ...      |                 |            |               |            |       |

Ratings are 1-5 (1 = worst, 5 = best). Lower complexity is better (inverted — a 5 means simplest).

## Step 5: Present Recommendation

After the table, state your recommendation and why. The recommendation should reference:

- Which option scores highest overall
- Which tradeoffs matter most for this specific project
- What the sources you consulted recommend
- What the other models suggested (if dispatched)

Then STOP and wait for user approval. Do not proceed until they choose.

## Step 6: Document the Decision

After user approves, append a decision record to the current spec or plan doc:

```markdown
## Decision: [Topic]

**Chosen:** [Option name]
**Rejected:** [Other options with one-line reasons]
**Sources consulted:** [URLs]
**Date:** [YYYY-MM-DD]
```

## Anti-Rationalization Table

| Thought                                          | Reality                                                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| "I already know the best approach"               | Your training data is stale. Search anyway. The best option in 2024 may not be the best in 2026.                                                   |
| "There are only 2 realistic options"             | You haven't looked hard enough. Search with different terms. Ask other models. Find at least 4.                                                    |
| "Official docs won't have this"                  | Search first, then claim that. You'd be surprised.                                                                                                 |
| "This is a simple choice, not worth researching" | Did you triage it? If it's Type 1, research it. If Type 2, skip the skill — don't rationalize skipping a Type 1.                                   |
| "The user is waiting, I should be fast"          | A wrong decision costs 10x more than 5 minutes of research. The user explicitly wants exhaustive research.                                         |
| "I searched and only found 2 options"            | Search with different terms. Try "[technology] alternatives 2026". Ask the user for leads. Dispatch to Codex or Gemini for different perspectives. |
| "This is just an implementation detail"          | Does it affect schema, vendor choice, or architecture? If yes, it's Type 1.                                                                        |
| "The previous conversation already decided this" | Verify the decision is still valid. Context may have changed. Sources may have updated.                                                            |
| "The other models didn't add anything new"       | Still document that you checked. The absence of new options is itself signal that you've covered the space.                                        |

## Step 7: Update Workflow State and Event Log

After the user approves an option (Step 5-6 complete), update the enforcement state:

```bash
# Update workflow state
STATE=".claude/workflow-state.json"
if [ -f "$STATE" ]; then
  python3 -c "
import json, datetime
d = json.load(open('$STATE'))
d['researchDone'] = True
d['researchAt'] = datetime.datetime.utcnow().isoformat() + 'Z'
json.dump(d, open('$STATE', 'w'))
"
fi

# Append to event log
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"branch\":\"$(git branch --show-current)\",\"event\":\"skill_complete\",\"skill\":\"vidably-exhaustive-research\",\"sha\":\"$(git rev-parse --short HEAD)\",\"options\":OPTIONS_COUNT,\"sources\":SOURCES_COUNT}" >> .claude/workflow-events.jsonl
```

Replace `OPTIONS_COUNT` and `SOURCES_COUNT` with the actual numbers from this research session.

## Step 7b: Log Research to Effectiveness Tracker

After the user approves an option, append a new section to `docs/research-effectiveness.md` under the `## Research Log` heading:

````markdown
### [Branch Name] -- [Decision Topic]

**Date:** [YYYY-MM-DD]
**Models:** [list of models consulted]

| Field                         | Value                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| **Per-model option count**    | Claude: X, Codex: Y, Gemini: Z                                                              |
| **Decision source**           | [which model(s) surfaced the chosen option]                                                 |
| **Per-model unique insights** | Claude: [one-liner or "none"]. Codex: [one-liner or "none"]. Gemini: [one-liner or "none"]. |
| **Source quality**            | Claude: pass/fail. Codex: pass/fail. Gemini: pass/fail.                                     |
| **Option overlap**            | [N options surfaced by 2+ models independently]                                             |
| **Downstream surprise**       | [left blank -- tagged during code review retro if applicable]                               |

**Decision:** [chosen option and one-line rationale]
````

Then update the **Aggregate Model Profiles** table in `docs/research-effectiveness.md`:

- **Tends to Surface Winning Option**: Update based on whether this model surfaced the chosen option.
- **Unique Insight Rate**: Update based on whether this model contributed insights no other model surfaced.
- **Source Quality Rate**: Update based on pass/fail for this session.

If the user rejects all options or abandons the decision, still log the entry with Decision: "[abandoned -- reason]". This tracks research quality even when it doesn't produce a decision.

**Sanitization rule:** Log normalized summaries only. Do not include secrets, tokens, PII, customer identifiers, raw payloads, or exploit details in effectiveness tracker entries.

This logging step is mandatory and automated -- if the skill runs, the data gets logged.

## Interaction With Other Skills

- `TRIGGERS BEFORE: brainstorming` — Research feeds into brainstorming options. If a Type 1 decision arises during brainstorming, pause and run this skill first.
- `TRIGGERS BEFORE: writing-plans` — Plans should reference decisions made through this skill.
- `COMPATIBLE WITH: systematic-debugging` — When debugging reveals a design flaw that requires an architectural decision, this skill applies.
