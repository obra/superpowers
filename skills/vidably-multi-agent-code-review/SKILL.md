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

## Step 3: Dispatch to Available Models

Construct the review prompt:

```
You are a senior engineer reviewing a code diff.

Review for:
1. Bugs, logic errors, and runtime failures
2. Security vulnerabilities (OWASP top 10, injection, auth bypass)
3. Type safety issues (any casts, missing null checks, unsafe assertions)
4. Unnecessary complexity (could be simpler or use a library default)
5. Missing error handling at system boundaries
6. Plan conformance (if a plan exists — does the code match the spec?)

For each finding:
- File and line number
- Severity: critical | important | minor
- What's wrong (specific, not vague)
- Why it matters (concrete consequence)
- Suggested fix (complete code, not "consider adding...")

Do NOT flag: style/formatting, missing comments, import ordering, test coverage for unchanged code, or suggestions that add complexity without proportional value.

[DIFF or FILE CONTENT]
```

Dispatch to all available models **in parallel**, independently:

**Always available:**

- Claude Code subagent (Agent tool) — tell it the branch and base, let it git diff and read files itself. Do NOT send the diff content in the prompt.

**Check and dispatch if present:**

- Codex: `codex review --base main` (native code review mode — better than `codex exec` for diffs)
- Gemini: `gemini --allowed-mcp-server-names="" -p "[review prompt] The branch is $(git branch --show-current) against main. Run git diff main...HEAD yourself to see the changes. Read any files you need for full context."`

**For design/plan reviews (no diff):**

- Codex: Pipe the content via stdin and use read-only sandbox: `echo "[review prompt with full design text]" | codex exec -s read-only -`
  - Without `-s read-only`, Codex will spend its entire budget exploring the repo instead of reviewing the provided text
  - The `-` at the end tells Codex to read the prompt from stdin
- Gemini: `echo "[review prompt with full design text]" | gemini --allowed-mcp-server-names="" -p "Review this design for technical gaps..."`

**CLI gotchas (learned from real usage):**

- Codex `review` mode is purpose-built for diffs — prefer it over `exec` for code review
- Codex `exec` for non-diff reviews MUST use `-s read-only` and pipe via stdin — otherwise it spirals into repo exploration and exhausts its budget without producing output (confirmed 2026-04-02, gpt-5.4)
- Codex: Use `--base main` to review the current branch against main
- Gemini: ALWAYS disable MCP servers (`--allowed-mcp-server-names=""`) — they cause indefinite hangs
- Gemini: Do NOT pipe diffs via stdin — large diffs cause ENAMETOOLONG errors. Instead, tell Gemini the branch name and let it git diff itself.
- Both CLIs: 5-minute timeout. Kill and continue if exceeded.

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

## Anti-Rationalization Table

| Thought                                                        | Reality                                                                                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "Tests pass, so the code is fine"                              | Tests verify behavior, not quality. Multi-model review catches design issues, security holes, and maintainability problems that tests can't. |
| "The diff is small, no need for multi-model review"            | Small diffs can introduce big bugs. A one-line auth bypass is a small diff. Review anyway.                                                   |
| "I'll just open the PR and let the GH Action review it"        | The GH Action takes 15+ minutes and costs CI time. Local review takes 2-3 minutes and catches issues before they're visible on the PR.       |
| "Only Codex is available, not enough for consensus"            | Two models (Claude + Codex) give you consensus/solo distinction. That's enough.                                                              |
| "The Codex review found nothing, so there's nothing to report" | Report that. "No findings from Codex" is useful signal — it means Claude's findings are solo (lower confidence).                             |

## Interaction With Other Skills

- `TRIGGERS AFTER: verification-before-completion` — Run this after code is verified but before claiming completion.
- `TRIGGERS BEFORE: finishing-a-development-branch` — Must complete before opening a PR.
- `COMPATIBLE WITH: requesting-code-review` — This is the multi-model version of the upstream code review skill.
