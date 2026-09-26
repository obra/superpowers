# Agent & Skill Lessons — Pending Review

The capture queue for the `improving-harness` skill. Append observed instruction defects to
**Pending**; the skill moves entries to **Applied** or **Declined** on review.

**Capture bar (all four):** observed (not hypothetical), traceable to instructions (not a
model mistake under correct instructions), root cause (not symptom), not already in
**Declined**.

**Where to append:** the main checkout's copy of this file. If you are in a ticket worktree,
resolve the main checkout root with `dirname "$(git rev-parse --git-common-dir)"` and append
there — not your worktree's copy, which strands when the implementer commits only its ticket
paths.

**Where in the file:** insert the new entry at the END of the **Pending** section —
immediately above the `## Applied` heading. Never append to the end of the file: that
lands the entry below **Declined**, outside the section the review reads, and it is never
seen again.

**Before appending:** grep **Pending** and `.agentic-engineering/lessons/INDEX.md` for the entry's
target file and its root-cause nouns. A near-hit gets a dated addendum under the existing
entry ("second instance: …") instead of a new entry — a repeat raises priority, it does not
duplicate.

**Queue structure:** three sections — **Pending** (open entries), **Applied** (compressed
one-liners the index is generated from), **Declined** (settled — never re-propose).

## Pending

<!-- Template for new Pending entries (insert new entries ABOVE the "## Applied" heading):

### <short title>
- **Observed:** <YYYY-MM-DD>
- **Agent/skill:** <which .claude/agents/*.md, procedures/*.md, or .claude/skills/**/SKILL.md>
- **Scope:** <local | upstream> — local = a fact about this project (lands in
  docs/agent_invariants.md or CLAUDE.md); upstream = a defect in the generic agent
  instructions every project using the template shares
- **What went wrong:** <one line, the actual failure>
- **Root cause in instructions:** <the gap; what rule is missing or wrong>
- **Suggested fix:** <the rule to add/change, or "see review">
-->

### parallel-tickets-one-coordinator-each
- **Observed:** 2026-09-25
- **Agent/skill:** `.agents/skills/using-agentic-engineering/SKILL.md`, `.agents/skills/orchestrated-delivery/SKILL.md`, `.agents/agents/code-coordinator/agent.md`
- **Scope:** upstream
- **What went wrong:** Parent agent planned to spawn three `code-implementer` agents directly for three independent GitHub tickets, treating "never parallel tickets inside orchestrated-delivery" as "parent must not fan out ticket work."
- **Root cause in instructions:** Routing says independent domains use `dispatching-parallel-agents` and "never parallel tickets inside orchestrated-delivery," and orchestrated-delivery lists parallel ticket execution as out of scope / "do not run parallel dispatches." Nowhere states the intended fan-out: for N independent tickets the parent spawns N `code-coordinator` agents (one ticket each); each coordinator runs the serial implement → (harden) → review loop alone. "No parallel" applies inside one coordinator's loop, not across coordinators.
- **Suggested fix:** In `using-agentic-engineering` routing and `orchestrated-delivery` Constraints / Out of scope, state positively: multiple independent tickets → one `code-coordinator` per ticket (parallel OK at parent); a single coordinator never parallel-dispatches tickets. Update `code-coordinator` agent description from "serial ship" only to mention single-ticket ownership when spawned per ticket.

### gh-keyring-needs-unsandboxed-shell
- **Observed:** 2026-09-25
- **Agent/skill:** `.agents/skills/orchestrated-delivery/SKILL.md` (Pre-flight), `.agents/skills/implementing-a-ticket/SKILL.md`
- **Scope:** local
- **What went wrong:** Coordinator for #2362 stopped at pre-flight reporting invalid keyring token / Forbidden, and asked the user to `gh auth refresh`, while the parent session's identical `gh auth status` succeeded under Shell `required_permissions: ["all"]`.
- **Root cause in instructions:** Pre-flight treats any `gh auth` failure as human re-auth. It does not distinguish Cursor sandbox keyring denial from a genuinely invalid token, and does not require retrying `gh` with unsandboxed/`all` permissions before surfacing blocked.
- **Suggested fix:** In orchestrated-delivery Pre-flight (and implementer preflight): if `gh auth status` fails with keyring/invalid-token under the default sandbox, retry once with unrestricted/`all` permissions; only surface `gh-not-authenticated` if that retry also fails. State that `gh`/`git push` on macOS keyring hosts need unsandboxed shell in this environment (`docs/agent_invariants.md` → Project tool rules).

### parallel-tickets-shared-brainstorm-gate
- **Observed:** 2026-09-25
- **Agent/skill:** `.agents/skills/orchestrated-delivery/procedures/review-gate.md`, `docs/agent_invariants.md`
- **Scope:** local
- **What went wrong:** Parallel ticket coordinators each re-ran full `test_command` (including `tests/brainstorm-server`) before spawning reviewers; they collided on port 3334 and shared `/tmp/brainstorm-test`, orphaned `server.cjs` processes (PPID 1), and stalled in wait/kill loops until "repeated resume attempts made no progress" — never reaching `falsifying-review`.
- **Root cause in instructions:** Nothing says parallel coordinators must not concurrently run gates that share fixed ports/temp dirs, or that pre-review full-suite is deferrable when another ticket already owns those resources. Kill-by-name is banned but orphans from interrupted suites are not called out as expected under parallel dispatch.
- **Suggested fix:** In review-gate / Project tool rules: when multiple ticket worktrees are live, spawn the reviewer first; run `test_command` only with exclusive access (ports 3333/3334 and `/tmp/brainstorm-test` free; kill only confirmed orphan PIDs whose command line names a worktree path). Document that brainstorm-server tests are not parallel-safe across worktrees.

### coordinator-stalls-before-reviewer-spawn
- **Observed:** 2026-09-25
- **Agent/skill:** `.agents/skills/orchestrated-delivery/SKILL.md`, code-coordinator agent
- **Scope:** local (Cursor harness interaction)
- **What went wrong:** Multiple code-coordinator review-continuation agents stopped with "repeated resume attempts made no progress" after loading skills / retrying sandboxed `gh`, before ever invoking Task to spawn `code-quality-reviewer`. PRs sat unreviewed for hours; parent had to spawn reviewers directly.
- **Root cause in instructions:** No fallback when the coordinator agent itself is the failure mode (stall before child spawn). No rule that the parent orchestrating thread may (or must) spawn `code-quality-reviewer` directly after N coordinator stalls at the same step.
- **Suggested fix:** In orchestrated-delivery / using-agentic-engineering: if a per-ticket coordinator dies twice before spawning the reviewer while the PR+worktree are ready, the parent spawns `code-quality-reviewer` directly and continues the gate from the verdict hand-back.

## Applied

<!-- Compressed form, one per applied lesson — the index script reads exactly this shape:

### <slug> (<YYYY-MM-DD>)
<one line: what landed and where>
-->

## Declined

<!-- ### <short title> — declined <YYYY-MM-DD>: <the user's reason, verbatim if given> -->
