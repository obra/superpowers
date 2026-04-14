---
name: vidably-multi-agent-code-review
description: "Use after implementation is complete and tests pass, before opening a PR — dispatches the code diff to multiple AI models for independent review, then synthesizes findings with consensus scoring."
---

# Multi-Agent Code Review (Local, Pre-PR)

After implementation is complete and local tests pass, dispatch the diff to multiple AI models for independent review before opening a PR. This catches bugs across model blind spots BEFORE they reach CI — faster and cheaper than waiting for the GH Action review.

Research shows: different model architectures have uncorrelated blind spots, and multi-model consensus catches 3-5x more bugs than single-pass review. Each round should review fresh code after fixes are applied (re-review pattern), not debate the same code (which causes problem drift).

**Round policy:** Up to 3 rounds. Each round reviews the UPDATED diff after fixes are applied. Round 3 is conservative (only critical). Stop early if a round produces zero changes. Same re-review pattern as the GH Action — the quality bar is the same locally and in CI.

<HARD-GATE>
Do NOT open a PR or invoke finishing-a-development-branch until:
1. Local verification passes (lint, typecheck, test, build)
2. At least 2 independent model reviews have been collected
3. Consensus scoring has been applied
4. Findings have been acted on based on consensus level (see Action Policy below)
5. If fixes were applied, re-review has been run on the updated diff
6. Convention extraction completed
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

### Convergence rule: dismissing 2+ reviewers requires a citation

When **two or more independent models** flag the same class of issue (`Unanimous` or `Majority`), rejection is only valid with a direct citation to an authoritative source:

1. **Installed SDK / library types** in `node_modules` (grep and quote the docstring).
2. **Current official API reference** by specific versioned URL — not marketing pages.
3. **Prior user instruction** with a direct quote that explicitly addresses the disputed design.

**No citation = accept the fix.** Prose reasoning alone ("I think Codex misunderstood…") is not a valid dismissal of converged findings. Writing confident rejection prose locks in a position before it's been verified — don't write it until the citation is in hand.

**Case study (PR #133):** Codex flagged Mux `master_access: 'temporary'` auto-reverts after 24h. Gemini echoed the next round. Both were rejected with prose calling it a misunderstanding. 10 seconds of `grep` on the installed SDK types would have surfaced the authoritative docstring confirming the finding. The rejection would have shipped the exact bug the PR was supposed to prevent. This rule exists so that mistake is not repeatable.

## Step 1: Prepare the Diff

Compute the diff against the base branch:

```bash
git diff main...HEAD
```

If the diff exceeds 500 lines, split into per-file chunks and review each chunk separately. Do NOT silently truncate — every changed line must be reviewed.

Also read the plan or spec if one exists — reviewers should check plan conformance, not just code quality.

## Step 2: Run Local Verification First

Before dispatching to models, run the full verification suite:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

If the diff touches pages or API routes:

```bash
pnpm --filter @vidably/web test:e2e
```

If the diff touches Shopify extensions:

```bash
shopify app build
```

Do NOT proceed to model review if verification fails. Fix first.

## Finding Categories

Tag every finding with a category. This taxonomy grows over time — add new categories in the Post-CI Retrospective (Step 9) when findings don't fit existing ones.

| Category           | What it covers                                                               | Source PR |
| ------------------ | ---------------------------------------------------------------------------- | --------- |
| `auth/security`    | Authorization bypass, injection, OWASP, auth error handling                  | baseline  |
| `failure-modes`    | Retry exhaustion, stuck states, partial failures, missing onFailure handlers | #61       |
| `data-integrity`   | Case sensitivity, uniqueness edge cases, nullability, type coercion          | #61       |
| `api-correctness`  | External API query format, field names, pagination, SDK usage                | #61       |
| `dev-compat`       | MSW mocks, env var assumptions, zero-secret contract compliance              | #61       |
| `react-lifecycle`  | useEffect deps, stale closures, re-render storms, ref stability              | #61       |
| `performance`      | N+1 queries, batch vs sequential, unnecessary computation                    | baseline  |
| `type-safety`      | any casts, missing null checks, unsafe assertions                            | baseline  |
| `plan-conformance` | Does the code match the spec/plan?                                           | baseline  |

## Model Profiles

Updated after each Post-CI Retrospective (Step 9). Use these to specialize prompts — emphasize each model's **blind spots**, not strengths.

| Model      | Strengths                                            | Blind Spots                                      | Last Updated |
| ---------- | ---------------------------------------------------- | ------------------------------------------------ | ------------ |
| Claude     | `auth/security`, `react-lifecycle`, `performance`    | `dev-compat`, `failure-modes`, `api-correctness` | PR #62-64    |
| Codex      | `dev-compat`, `data-integrity`                       | `auth/security`, `api-correctness`               | PR #62-64    |
| Gemini     | `plan-conformance`, `performance`                    | `failure-modes`, `auth/security`                 | PR #62-64    |
| Codex (CI) | `api-correctness`, `failure-modes`, `data-integrity` | —                                                | PR #62-64    |
| Copilot    | `failure-modes`, `api-correctness`                   | `auth/security`, `dev-compat`                    | PR #62-64    |

## Step 3: Dispatch to Available Models

Construct the **base review prompt**, then append model-specific emphasis from the blind spots column above:

```
You are a senior engineer reviewing a code diff.

Review for:
1. Bugs, logic errors, and runtime failures
2. Security vulnerabilities (OWASP top 10, injection, auth bypass)
3. Type safety issues (any casts, missing null checks, unsafe assertions)
4. Unnecessary complexity (could be simpler or use a library default)
5. Missing error handling at system boundaries
6. Plan conformance (if a plan exists — does the code match the spec?)

ALSO specifically check for (learned from past reviews):
- Failure modes: what happens when retries exhaust? Are there stuck states? Missing onFailure handlers? Do webhook error responses allow the sender to retry for compliance-critical topics? (PR #61, #62)
- Data invariants: case-sensitive uniqueness, nullability edge cases, type coercion across DB boundaries. For deletions/redactions, verify cascade behavior — nulling columns is not the same as deleting rows with FK cascades. (PR #61, #62)
- API correctness: verify external API query field names and pagination against official docs, not assumptions. For webhook payloads, check ALL fields in the spec (e.g., Shopify GDPR payloads include orders_to_redact, orders_requested). (PR #61, #62)
- Dev-environment contract: does every new external API call have an MSW mock? Can this code run with zero secrets? (PR #61)
- Compliance/PII: never log PII (email, name, order IDs) in compliance handlers — it defeats redaction by creating copies in log storage. (PR #62)
- Contract preservation: when migrating auth or refactoring, verify return types don't change (null → throw breaks callers). When fixing a pattern bug, grep for ALL instances of the same pattern. (PR #64)
- Webhook retry safety: when changing webhook error responses from 200 to 500, verify ALL handlers are idempotent. Non-idempotent handlers (insert without unique guard) must return 200 on error to prevent retry-induced data duplication. (PR #66)
- JSON serialization safety: when building strings for JSON output (especially script tags with JSON-LD), verify that escape sequences produce valid JSON. Backslash-bang is not a valid JSON escape — use Unicode escapes like `\u003C` instead. (PR #67)

For each finding:
- File and line number
- Severity: critical | important | minor
- Category: [from the Finding Categories table]
- What's wrong (specific, not vague)
- Why it matters (concrete consequence)
- Suggested fix (complete code, not "consider adding...")

Do NOT flag: style/formatting, missing comments, import ordering, test coverage for unchanged code, or suggestions that add complexity without proportional value.

[DIFF or FILE CONTENT]
```

**Per-model prompt specialization:** After the base prompt, append a section for each model emphasizing its blind spots:

- **Claude:** "Pay EXTRA attention to: dev-environment compatibility (MSW mocks, env var fallbacks, zero-secret contract), failure modes (retry exhaustion, partial failures, stuck states, webhook retry semantics), and API correctness (verify webhook payload fields against official spec, don't assume — check)."
- **Codex:** "Pay EXTRA attention to: authorization and security (brand-scoping, auth bypass, OWASP), auth error handling (401 vs 500 responses), and API correctness (verify all fields in external API payloads are consumed, not just the obvious ones)."
- **Gemini:** "Pay EXTRA attention to: failure modes (what happens when handlers throw — do callers get retries?), authorization/security (PII in logs, auth bypass), and contract preservation (do return types change when refactoring?)."

The goal: **each model compensates for the others' weaknesses**, not duplicate their strengths.

Dispatch to all available models **in parallel**, independently:

**Always available:**

- Claude Code subagent (Agent tool) — tell it the branch and base, let it git diff and read files itself. Do NOT send the diff content in the prompt.

**Check and dispatch if present:**

- Codex: `./tools/run-cli-review.sh codex review --base main` (wrapper captures timing, exit code, full output)
- Gemini: `./tools/run-cli-review.sh gemini --allowed-mcp-server-names _none -p "[review prompt] The branch is $(git branch --show-current) against main. Run git diff main...HEAD yourself to see the changes. Read any files you need for full context."`

**Alternative: Gemini API with enriched context (~50s, no CLI overhead):**

If the Gemini CLI is unavailable or you want faster results, call the Gemini API directly with enriched context. Build the context by including: full content of changed files + their local imports + `packages/db/src/schema/*.ts` + `AGENTS.md` + the diff. Call `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_API_KEY` with `temperature: 0, maxOutputTokens: 8192`. API key is in `~/.gemini/.env`. Use `jq` to JSON-escape the prompt. This finds compliance-level bugs the diff-only approach misses (validated in PoC).

**For design/plan reviews (no diff):**

- Codex: Pipe the content via stdin and use read-only sandbox: `echo "[review prompt with full design text]" | codex exec -s read-only -`
  - Without `-s read-only`, Codex will spend its entire budget exploring the repo instead of reviewing the provided text
  - The `-` at the end tells Codex to read the prompt from stdin
- Gemini: `echo "[review prompt with full design text]" | gemini --allowed-mcp-server-names _none -p "Review this design for technical gaps..."`

**CLI gotchas (learned from real usage):**

- **TIMEOUTS: Use `timeout: 1200000` (20 minutes) for all CLI review commands.** With `xhigh` reasoning, Codex reads files, runs web searches, and reasons deeply — it needs real time. The default 2-minute bash timeout will kill them mid-analysis, producing no findings. This was misdiagnosed as "hitting output limits" and "MCP init overhead" in early reviews — both were just timeout kills.
- **WRAPPER: Always use `./tools/run-cli-review.sh`** instead of calling CLI tools directly. It captures timing, exit code, signal info, and full output to `tools/review-logs/`. If a process is killed, it prints a WARNING automatically. A PostToolUse hook on Bash also detects timeout kills and injects a warning.
- **IF A CLI TOOL APPEARS TO FAIL: Invoke the `diagnosing-failures` skill** before proposing any workaround. List at least 3 possible root causes and check evidence against each.
- Codex `review` mode is purpose-built for diffs — prefer it over `exec` for code review
- Codex `exec` for non-diff reviews MUST use `-s read-only` and pipe via stdin — otherwise it spirals into repo exploration and exhausts its budget without producing output (confirmed 2026-04-02, gpt-5.4)
- Codex: Use `--base main` to review the current branch against main
- Gemini: ALWAYS disable MCP servers with `--allowed-mcp-server-names _none` (passes a dummy name so no real MCP servers connect). Do NOT use `=""` — that passes an empty string which crashes the Gemini policy engine.
- Gemini: Do NOT pipe diffs via stdin — large diffs cause ENAMETOOLONG errors. Instead, tell Gemini the branch name and let it git diff itself.

**Graceful degradation:** If no external CLIs are available:

1. Dispatch Claude subagent with security-focused prompt
2. Dispatch Claude subagent with maintainability-focused prompt
3. Two perspectives from one model family is still better than one perspective

## Step 4: Synthesize with Consensus Scoring

Deduplicate findings across models. Apply consensus scoring:

| Consensus     | Definition                      |
| ------------- | ------------------------------- |
| **Unanimous** | All reviewing models flagged it |
| **Majority**  | >50% of models flagged it       |
| **Split**     | Exactly 2 models disagree       |
| **Solo**      | One model only                  |

See the **Action Policy** above for how to act on each level.

**Critical finding from any model = fix it.** A solo critical (bug, security, data loss) should be fixed regardless of consensus. Consensus matters more for important/minor findings.

**Anti-sycophancy check:** If all models agree on a finding, verify it's genuine agreement, not just repeating the same training pattern. Check: does the finding reference a specific line and explain a concrete consequence?

## Step 5: Present Consensus Map

```markdown
## Pre-PR Code Review Consensus

### Models Consulted

- Claude Code subagent: [# findings]
- Codex: [# findings or "not available"]
- Gemini: [# findings or "not available"]

### Critical Findings (fix before PR)

| Finding           | File:Line       | Consensus | Models | Fix        |
| ----------------- | --------------- | --------- | ------ | ---------- |
| [bug description] | `src/foo.ts:42` | Unanimous | All    | [code fix] |

### Important Findings (recommend fixing)

| Finding | File:Line       | Consensus | Models        | Fix        |
| ------- | --------------- | --------- | ------------- | ---------- |
| [issue] | `src/bar.ts:78` | Majority  | Claude, Codex | [code fix] |

### Dismissed

- [finding] — [why: style preference / false positive / etc.]
```

Present the consensus map, then proceed to apply fixes based on the Action Policy above. The user can intervene if they disagree, but the default is autonomous action.

## Step 6: Apply Fixes, Re-Verify, and Re-Review

For each approved finding:

1. **Test-first fix (mandatory for control flow / sentinel changes):** Before applying the fix, write a test that would FAIL if the fix is wrong. Run it to confirm it fails with the current code. Then apply the fix and confirm it passes. This prevents fixes that "look right" but have a semantic flaw — the test is a proof that the fix works, not just that it compiles. Skip only for pure deletions or cosmetic changes.
2. Apply the fix
3. Re-run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
4. If any check fails, fix before continuing

**If fixes were made, re-review (up to 3 rounds total):**

5. Compute the UPDATED diff: `git diff main...HEAD`
6. Dispatch to all available models again (Steps 3-5)
7. Present the new consensus map to the user

**Round policy:**

- **Round 1:** Address all findings
- **Round 2:** Address findings from round 2 reviews only (issues introduced by round 1 fixes, or issues missed in round 1)
- **Round 3:** Only critical findings. Everything else is deferred.
- **Stop early:** If a round produces zero accepted findings, the code is ready. Don't force more rounds.

This is the same re-review pattern the GH Action uses — each round reviews fresh code, not the same code debated again.

After all rounds complete and verification passes, update the event log:

```bash
# Append structured event log entry
cat <<JSON | node scripts/measurement/emit-event.mjs
{
  "stage": "code_review",
  "event": "code_review_complete",
  "source": "skill",
  "payload": {
    "models": MODELS_LIST,
    "rounds": ROUNDS_COUNT,
    "findingCount": FINDINGS_COUNT
  }
}
JSON

# Refresh the local talk report (best effort)
node scripts/measurement/render-talk-report.mjs >/dev/null 2>&1 || true
```

Replace `MODELS_LIST` with a JSON array (e.g., `[\"codex\",\"gemini\"]`), `FINDINGS_COUNT` with total findings, and `ROUNDS_COUNT` with review rounds completed.

## Step 7: Convention Extraction

After all review rounds are complete and verification passes, automatically extract systemic lessons. This step runs every time — it's how the system self-improves.

**Read the project maturity level** from the `### Project Maturity` section of `AGENTS.md`. Use it to calibrate classifications below.

For each finding from all rounds (accepted, dismissed, and false positives), classify:

1. **CONVENTION GAP** — a rule in AGENTS.md would have prevented this finding from being written in the first place. Draft the exact addition: which section, what text, where it goes.
2. **SKILL GAP** — this skill or another skill should change its behavior. Draft the exact change to the skill file.
3. **MATURITY-GATED** — this finding is valid but appropriate for a higher maturity level than the current one. No action needed now. Note which level it belongs to.
4. **ONE-OFF** — specific to this code, no systemic lesson. No action needed.

Present each proposal:

| Finding       | Classification         | Proposed Change                                     |
| ------------- | ---------------------- | --------------------------------------------------- |
| [description] | Convention gap         | [exact text to add to AGENTS.md, including section] |
| [description] | Skill gap              | [exact change to skill file]                        |
| [description] | Maturity-gated (scale) | None — revisit at `scale`                           |
| [description] | One-off                | None                                                |

Then STOP and wait for user approval on each convention/skill proposal. Apply approved changes and commit them alongside the PR. (Convention proposals modify the review system itself, so they are excluded from the Action Policy and require explicit approval.)

## Step 8: Proceed to PR

After review is complete and verified, invoke `finishing-a-development-branch` to open the PR. The PR will then receive the GH Action review (Claude + Security + Codex) as a safety net, but most issues should already be caught by this local review.

## Step 9: Post-CI Retrospective (Self-Improvement Loop)

**Trigger:** After CI review comments appear on the PR. This step is MANDATORY — it's how the system learns. Do not skip it even if CI found nothing new.

**This step runs automatically.** Do not wait for the user to ask "why did CI catch that?" — the whole point is that the system reflects without being prompted.

### 9a: Collect CI Findings

```bash
# Pull all CI review comments
gh api repos/Vidably/app/pulls/<PR_NUMBER>/comments --jq '.[] | {user: .user.login, body: .body, path: .path, line: .line}'
gh api repos/Vidably/app/pulls/<PR_NUMBER>/reviews --jq '.[] | {user: .user.login, state: .state, body: .body}'
gh api repos/Vidably/app/issues/<PR_NUMBER>/comments --jq '.[] | select(.user.login | test("bot|copilot|codex|github-actions")) | {user: .user.login, body: .body}'
```

### 9b: Diff Against Local Findings

For each CI finding, classify:

| Classification                   | Meaning                                            | Action                                               |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| **Already fixed**                | Local review caught this and we fixed it before PR | None — CI reviewed stale code                        |
| **New — would have been caught** | Finding falls into an existing checklist category  | Investigate why the prompt didn't surface it         |
| **New — blind spot**             | Finding is a category we don't check for yet       | Add to Finding Categories table + evolving checklist |
| **New — model limitation**       | We check for this, but the model(s) missed it      | Update Model Profiles table                          |
| **False positive**               | CI flagged something that isn't actually an issue  | Note it — track CI false positive rate too           |

### 9c: Update the System

For each "New — blind spot" finding:

1. Add a row to the **Finding Categories** table with the source PR
2. Add a line to the **"ALSO specifically check for"** section of the review prompt (Step 3)
3. Add to the **per-model prompt specialization** if it maps to a model's blind spot

For each "New — model limitation" finding:

1. Update the **Model Profiles** table — if a model missed something in its blind spot despite the specialized prompt, escalate the emphasis
2. If a model consistently misses a category (3+ PRs), consider whether it's worth prompting for at all vs relying on other models

### 9d: Update review-effectiveness.md

Add a retrospective entry:

```markdown
### Post-CI Retrospective: PR #XX

| CI Finding    | Category        | Classification   | Action Taken        |
| ------------- | --------------- | ---------------- | ------------------- |
| [description] | `failure-modes` | New — blind spot | Added to checklist  |
| [description] | `auth/security` | Already fixed    | None (stale review) |

**CI-catches-local-missed (genuine):** X (down from Y last PR)
**New checklist items added:** Z
**Model profile updates:** [list]
```

### 9e: Verify Improvement Trend

Check the running trend in review-effectiveness.md:

- Is "CI catches local missed" trending down? If yes, the system is learning.
- If it's flat or rising, the retrospective isn't producing effective checklist items — flag this to the user.
- Are any categories consistently missed by ALL local models? That's a systemic gap — consider adding a 4th model or a specialized linter.

**The goal: CI should catch ZERO new findings that local review missed.** Every non-zero number is a learning opportunity, not a failure.

### 9f: Downstream Surprise Check

Check if this branch has upstream logs in `docs/research-effectiveness.md` or `docs/plan-review-effectiveness.md` by searching for the branch name.

If upstream logs exist, review each code review finding and ask: **could upstream (research or plan review) have caught this?**

For each finding where the answer is yes, route to the correct tracker:

1. If the upstream log was in `docs/plan-review-effectiveness.md`, add an entry to **its** Downstream Surprise Log.
2. If the upstream log was in `docs/research-effectiveness.md`, add an entry to **its** Downstream Surprise Log.
3. If both stages had the opportunity, add one entry to each.

Entry format:

```markdown
- **[Date]** -- Branch: `[branch-name]`. Code review found `[category]` issue: [one-line description]. [Research/Plan review] had the opportunity to catch this but didn't. (tagged_by: [agent], confidence: high/medium/low, reason: [one line])
```

This is agent-assisted tagging, not fully automatic. If confidence is "low," flag the entry for human review rather than auto-appending.

4. Note the category and model attribution -- this feeds into the upstream model profiles over time.

**Sanitization rule:** Log normalized summaries only. Do not include secrets, tokens, PII, customer identifiers, raw payloads, or exploit details in downstream surprise entries.

If no upstream logs exist for this branch, skip this step. Not every branch goes through the full chain, and that's fine -- the data accumulates over time.

## Anti-Rationalization Table

| Thought                                                        | Reality                                                                                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "Tests pass, so the code is fine"                              | Tests verify behavior, not quality. Multi-model review catches design issues, security holes, and maintainability problems that tests can't. |
| "The diff is small, no need for multi-model review"            | Small diffs can introduce big bugs. A one-line auth bypass is a small diff. Review anyway.                                                   |
| "I'll just open the PR and let the GH Action review it"        | The GH Action takes 15+ minutes and costs CI time. Local review takes 2-3 minutes and catches issues before they're visible on the PR.       |
| "Only Codex is available, not enough for consensus"            | Two models (Claude + Codex) give you consensus/solo distinction. That's enough.                                                              |
| "The Codex review found nothing, so there's nothing to report" | Report that. "No findings from Codex" is useful signal — it means Claude's findings are solo (lower confidence).                             |
| "CI didn't find anything new, skip the retrospective"          | Run it anyway. Confirming zero delta IS the measurement. And "already fixed" findings need classification too.                               |
| "I'll do the retrospective later"                              | Do it now, while CI comments are fresh. Later means never — the next task will take priority.                                                |

## Interaction With Other Skills

- `TRIGGERS AFTER: verification-before-completion` — Run this after code is verified but before claiming completion.
- `TRIGGERS BEFORE: finishing-a-development-branch` — Must complete before opening a PR.
- `TRIGGERS AFTER: CI review comments appear on PR` — Step 9 (Post-CI Retrospective) runs automatically.
- `COMPATIBLE WITH: requesting-code-review` — This is the multi-model version of the upstream code review skill.
