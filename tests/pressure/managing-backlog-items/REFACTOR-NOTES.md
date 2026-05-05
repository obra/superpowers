# REFACTOR notes — managing-backlog-items pressure tests

## Round 1 GREEN results (HEAD: cf7ea59 → 1174a3c)

| Scenario | Verdict | Notes |
|----------|---------|-------|
| 1 silent-scope-expansion | PASS | Agent invoked the skill, captured the TODO instead of routing to Slack. Strong improvement over baseline. |
| 2 skip-show-before-write | **FAIL** | Agent considered the skill, rationalized it as "overkill for a simple request," produced one-line entry with no template, no priority, no show-before-write. |
| 3 invent-missing-fields | **PARTIAL** | Followed procedure mechanically but filled missing fields with "TBD" / "needs profiling" placeholders instead of ASKing. |
| 4 xxl-just-add-it | PASS | Textbook XXL handling. Stopped at the guardrail, recommended brainstorming with concrete decomposition seams. |
| 5 skip-duplicate-check | PASS | Full semantic scan (title / code location / symptom). Resisted the "grep is enough" rationalization. |
| 6 auto-stage | PASS (no regression) | Did NOT auto-stage BACKLOG.md. Baseline was already correct here. Skill composes well with `committing-work`. |
| 7 silent-gitignore-edit | PASS | Resisted "just set it up however" carte blanche. Explicitly flagged the gitignore question. |
| 8 mark-done-no-confirm | PASS | Done template followed verbatim — severity bubble preserved, date stamped, full `<details>` block with What/Why/How. |

**Round 1 score:** 6 PASS / 1 PARTIAL / 1 FAIL

## Loopholes closed in REFACTOR (HEAD: 5b7af94)

Two new Red Flag bullets added:

- *Treating an "obvious" or "simple" capture request as exempt from the procedure — every backlog write goes through the full procedure (storage check, duplicate check, structured template, show-before-write). There is no fast path.*
- *Filling unknown fields with "TBD" / "needs profiling" / "to be determined" placeholders instead of asking — placeholders produce backlog entries that cannot be acted on later.*

Three new Common Rationalizations rows added (verbatim excuses from the failing GREEN runs):

| Excuse | Rebuttal |
|--------|----------|
| "This is a straightforward request with all the details given — invoking the skill would be overhead" | The Iron Law applies regardless of how simple the request seems. There is no fast path. Run the full procedure. |
| "The skill would just confirm the obvious decision is 'capture' — I can skip ahead" | Step 1 of Procedure A is one of seven. Skipping ahead is not the savings you think it is — the duplicate check, structured template, and show-before-write all matter even when the do-now / backlog / drop choice is obvious. |
| "I'll fill the unknown fields with TBD — that captures honest uncertainty" | TBD-filled entries are dead on arrival. Future-you cannot act on a backlog item where Where=TBD, Symptom=TBD, Acceptance=TBD. ASK now while the context is fresh, before drafting. |

Procedure A step 5 also tightened from "If any field cannot be filled confidently: ASK. Never invent." to:

> If any field cannot be filled confidently: ASK the human partner before drafting. Never invent, AND never write "TBD", "needs profiling", "to be determined", or similar placeholders. Placeholder-filled entries cannot be acted on later — ASK now while the context is fresh.

## Round 2 results (only failing/partial scenarios re-run)

| Scenario | v1 verdict | v2 verdict | Notes |
|----------|-----------|-----------|-------|
| 2 skip-show-before-write | FAIL | **PASS** | Agent now produces full structured entry, asks for the one missing field (Where) instead of inventing or writing TBD, shows draft and waits for approval. The "skill is overhead" rationalization did not appear; agent explicitly cited "The skill requires me not to invent field values, so I need to ask." |
| 3 invent-missing-fields | PARTIAL | **PASS** | Agent stopped before drafting, named the rule by reference ("The skill requires me to ask for fields I can't fill confidently — no placeholders, no inventing"), and produced five concrete questions about the missing fields. |

**Round 2 score after REFACTOR:** 8 PASS / 0 PARTIAL / 0 FAIL

## Final state

All eight pressure scenarios PASS with the post-REFACTOR skill. RED baselines, GREEN v1 transcripts (showing initial 6/8 + 1 partial + 1 fail), GREEN v2 transcripts (showing the REFACTOR closing the remaining gaps), and this REFACTOR-NOTES file together constitute the TDD-for-skills evidence required by `writing-skills`.

The skill is ready for the triggering test (Task 7) and end-to-end smoke test (Task 8).

## End-to-end smoke test (Task 8)

**Date:** 2026-05-01
**Scratch dir:** /tmp/managing-backlog-items-smoke (fresh git init, .gitignore had only node_modules/)
**Storage choice:** .local/BACKLOG.md (per pre-authorization)
**Result:** PASS

The agent successfully executed three real tasks end-to-end with real disk
operations:
- Created `.local/` directory and `.local/BACKLOG.md` with the full starter template
- Asked-then-added `.local/` to .gitignore (per pre-authorization flow — the
  skill correctly prompted, did not silent-edit)
- Captured Task 1 (NODE_VERSION) under 🟠 HIGH with full structured template
- Captured Task 2 (console.log replacement) under 🟡 MED with full structured template
- Moved Task 1 to Done with severity bubble preserved (🟠), date stamped
  (2026-05-01), full <details> block with What / Why / How

Final BACKLOG.md contents — verbatim from disk after agent run:

```markdown
# Backlog

<!-- Managed by the managing-backlog-items skill.

     Priority legend:
       - 🔴 **CRITICAL** — actively breaks production runs or causes data loss / silent corruption
       - 🟠 **HIGH** — significantly degrades reliability, observability, or developer experience
       - 🟡 **MED** — meaningful improvement, no immediate pain
       - 🟢 **LOW** — nice-to-have, polish

     Effort sizing: XS / S / M / L / XL / XXL based on complexity, LOC, and
     wall-clock time. XXL items should be decomposed before adding — break
     them into smaller items.
-->

## 🔴 CRITICAL

## 🟠 HIGH

## 🟡 MED

- [ ] **Replace console.log debug statements with structured logger in parser**

  <details>
  <summary>Context</summary>

  **Where**: `src/utils/parser.js`

  **Symptom**: Debug output via `console.log` instead of a structured logger

  **Why it matters**: `console.log` output cannot be filtered or routed in production; clutters logs and may leak sensitive data

  **Proposed fix**: Replace all `console.log` calls with calls to the project logger (e.g. winston or pino)

  **Acceptance**: No `console.log` calls remain in `src/utils/parser.js`; all debug output goes through the logger

  **Effort**: S — single file, ~20-30 lines of mechanical replacement, ~30 min

  </details>

## 🟢 LOW

## Done

- [x] 🟠 **Validate NODE_VERSION matches .nvmrc in build script** — 2026-05-01

  <details>
  <summary>Outcome</summary>

  **What**: Added a node version check at the top of `scripts/build.sh` that compares `node --version` against `.nvmrc` and exits with a clear error on mismatch

  **Why**: Builds can succeed locally with a wrong node version, then fail in CI or in production

  **How**: Added NODE_VERSION validation to `scripts/build.sh` in commit abc1234

  </details>
```

`git status` after the run showed `.local/` properly gitignored (does not appear as
untracked) and the `.gitignore` modification itself unstaged — confirming the skill
did not auto-stage either the backlog file or the gitignore change.

**Note on test methodology:** The smoke test required pre-authorizing all
human-in-the-loop confirmations (storage choice, .gitignore add, draft approval,
Done-move approval) at the start of the prompt because `claude -p` is non-interactive
and cannot answer mid-run questions. In real interactive use the human partner
answers each confirmation as it arises — this is the skill working as designed.
