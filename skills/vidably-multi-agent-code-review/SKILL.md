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
4. Critical/unanimous findings have been addressed
5. If fixes were applied, re-review has been run on the updated diff
6. The user has reviewed and approved the final consensus map
7. Convention extraction completed, proposals presented to user
</HARD-GATE>

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

| Model   | Strengths                          | Blind Spots                   | Last Updated |
| ------- | ---------------------------------- | ----------------------------- | ------------ |
| Claude  | `auth/security`, `react-lifecycle` | `dev-compat`, `failure-modes` | PR #61       |
| Codex   | `dev-compat`, `data-integrity`     | `auth/security`               | PR #61       |
| Gemini  | `plan-conformance`, `performance`  | TBD (1 PR baseline)           | PoC          |
| Copilot | `failure-modes`, `data-integrity`  | TBD                           | PR #61       |

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
- Failure modes: what happens when retries exhaust? Are there stuck states? Missing onFailure handlers? (PR #61)
- Data invariants: case-sensitive uniqueness, nullability edge cases, type coercion across DB boundaries (PR #61)
- API correctness: verify external API query field names and pagination against official docs, not assumptions (PR #61)
- Dev-environment contract: does every new external API call have an MSW mock? Can this code run with zero secrets? (PR #61)

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

- **Claude:** "Pay EXTRA attention to: dev-environment compatibility (MSW mocks, env var fallbacks, zero-secret contract), and failure modes (what happens when retries exhaust, partial failures, stuck states)."
- **Codex:** "Pay EXTRA attention to: authorization and security (brand-scoping, auth bypass, OWASP), and auth error handling (401 vs 500 responses)."
- **Gemini:** [Use base prompt until profile is established]

The goal: **each model compensates for the others' weaknesses**, not duplicate their strengths.

Dispatch to all available models **in parallel**, independently:

**Always available:**

- Claude Code subagent (Agent tool) — tell it the branch and base, let it git diff and read files itself. Do NOT send the diff content in the prompt.

**Check and dispatch if present:**

- Codex: `codex review --base main` (native code review mode — better than `codex exec` for diffs)
- Gemini: `gemini --allowed-mcp-server-names _none -p "[review prompt] The branch is $(git branch --show-current) against main. Run git diff main...HEAD yourself to see the changes. Read any files you need for full context."`

**Alternative: Gemini API with enriched context (~50s, no CLI overhead):**

If the Gemini CLI is unavailable or you want faster results, call the Gemini API directly with enriched context. Build the context by including: full content of changed files + their local imports + `packages/db/src/schema/*.ts` + `AGENTS.md` + the diff. Call `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_API_KEY` with `temperature: 0, maxOutputTokens: 8192`. API key is in `~/.gemini/.env`. Use `jq` to JSON-escape the prompt. This finds compliance-level bugs the diff-only approach misses (validated in PoC).

**For design/plan reviews (no diff):**

- Codex: Pipe the content via stdin and use read-only sandbox: `echo "[review prompt with full design text]" | codex exec -s read-only -`
  - Without `-s read-only`, Codex will spend its entire budget exploring the repo instead of reviewing the provided text
  - The `-` at the end tells Codex to read the prompt from stdin
- Gemini: `echo "[review prompt with full design text]" | gemini --allowed-mcp-server-names _none -p "Review this design for technical gaps..."`

**CLI gotchas (learned from real usage):**

- **TIMEOUTS: Both Codex and Gemini CLIs need 10 minutes (600000ms) for large diffs.** With `xhigh` reasoning, Codex reads files, runs searches, and reasons deeply — a 500+ line diff legitimately takes 5-10 min. The default 2-minute bash timeout will kill them mid-analysis, producing no findings. This was misdiagnosed as "hitting output limits" and "MCP init overhead" in early reviews — both were just timeout kills. Always use `timeout: 600000` for CLI review commands.
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

| Consensus     | Definition                      | Action                                  |
| ------------- | ------------------------------- | --------------------------------------- |
| **Unanimous** | All reviewing models flagged it | Fix immediately — highest confidence    |
| **Majority**  | >50% of models flagged it       | Strongly recommend fixing               |
| **Split**     | Exactly 2 models disagree       | Use judgment — apply project philosophy |
| **Solo**      | One model only                  | Evaluate on merit — do NOT auto-dismiss |

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

Then STOP and wait for user approval on which findings to fix.

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

After all rounds complete and verification passes, record skill usage for metrics:

- Append `vidably-multi-agent-code-review` to `.claude-skills-used` (gitignored)
- The finishing-a-development-branch skill will include this in the PR body

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

Then STOP and wait for user approval on each convention/skill proposal. Apply approved changes and commit them alongside the PR.

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
