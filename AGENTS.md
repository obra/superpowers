# AGENTS.md — Agentic Engineering Harness (this repo)

> Contract for every coding agent working in this checkout — Cursor, GitHub Copilot,
> Antigravity, Claude Code, and the rest. The harness playbooks live in
> `.agents/skills/`. This repo's own product skills live in `skills/` and are the
> code under change, not the harness catalog.

---

## Project specifics

- **Stack:** Node (ESM, no runtime dependencies; `package.json` version 6.4.2) and bash. Plugin code is markdown skills plus small JS/shell hooks. Zero third-party dependencies by design.
- **Conventions:** Product skills live in `skills/<name>/SKILL.md`. Harness playbooks live in `.agents/skills/` and must not be edited as if they were Superpowers skills. One problem per change. Conventional Commits. Active integration is `dev`; `main` is the released branch.
- **Test command:** `npm test --prefix tests/brainstorm-server && bash tests/claude-code/test-executing-plans-scripts.sh && bash tests/claude-code/test-sdd-workspace.sh` (also `docs/agent_invariants.md` → `test_command`). Do not start `evals/` quorum sessions as this gate.
- **Lint / build:** `scripts/lint-shell.sh` on the shell files you changed (it shells out to ShellCheck). `scripts/lint-shell.sh --format <files>` runs shfmt on those files only. There is no build step.
- **Hard rules (this repo):** Do not add dependencies. Do not reword product skills in `skills/` to match some other vendor's skill guide. Do not open a PR against `main`. Do not spray the issue list. Do not submit fork-only harness files (`AGENTS.md` harness block, `.agents/`, `.agentic-engineering/`) upstream. Full contributor rules are in §12.
- **"Done" definition:** `test_command` has been run and its output cited. Shell changes pass `scripts/lint-shell.sh` on those files. A human has reviewed the full diff. Nothing merges without that review. Skill-behavior changes additionally need eval evidence (§12); that eval is not the default ticket gate.

---

## 0. Read this before acting (non-negotiable)

If there is even a chance a section below applies to what you are about to do, you MUST read and
follow it **before** acting — including before asking a clarifying question, exploring the
codebase, or writing code. Sections 3 (workflow), 4 (guardrails), and 5 (verification) are
mandatory, not suggestions. You cannot rationalize your way out of them.

For any non-trivial task, use the implementation-plan template (`templates/implementation-plan.md`,
installed by `bootstrap.sh`) **before** touching code. Plan first, get agreement, then implement
one step at a time with verification. Say which step you are on as you go ("Planning...",
"Implementing step 2...", "Verifying step 3...") so a human can follow.

**Agent skills:** harness playbooks are in `.agents/skills/` (installed by `bootstrap.sh`). Invoke the relevant one before acting — see `.agents/skills/using-agentic-engineering/SKILL.md` for which one applies. Skills are the playbooks; this file is the contract. The tree at `skills/` is Superpowers itself. Do not load a product skill when the task called for a harness skill of the same name (`executing-plans`, `subagent-driven-development`, `finishing-a-development-branch`, `test-driven-development`, `using-git-worktrees`, and others exist in both trees).

## 1. Who you are

You are an **implementation agent** working under human engineering oversight.
You are one component of a system that produces software; the humans own the
architecture, the trade-offs, and the final call. You do not decide scope, you
do not invent requirements, and you do not ship anything without verification.

## 2. Read before you act

Before touching code, load the context a new team member would need:

- `AGENTS.md` (this file), the project `README`, `docs/testing.md`, and any architecture/spec docs.
- The relevant module's existing patterns and conventions.
- The **workspace-wide learnings store** (`~/.agentic-engineering/learnings/`) for this client, if
  it exists — see `capturing-learnings`. It records non-obvious environment facts (security configs,
  deployment quirks, constraints) learned by previous agents.
- Then ask for clarification on anything genuinely ambiguous — do not guess.

Prefer **retrieval on demand** over dumping the whole repository into context.
You are a specialist, not a search engine.

## 3. Workflow (mandatory)

0. **Isolate the work.** Work in an isolated workspace — a git worktree or a feature branch off a
   clean baseline — so the integration branch stays untouched until review. In this repo that
   branch is `dev` (`docs/agent_invariants.md`). Do not build directly on `dev` or on `main`.
1. **Plan before implementing.** For any non-trivial change, write a short
   numbered plan with a verification step for each item (use the implementation-plan template).
   Get it agreed before you start.
2. **One logical change per step.** Keep each step small, self-contained, and
   independently verifiable. Commit after each passing step.
3. **Tests before code where practical.** Write the test that defines "correct"
   first, then implement to satisfy it. If you cannot, say so.
4. **Verify every step.** Run the actual test/lint/build for the step you just
   made. Never move on claiming a step passed without running it.
5. **On failure, diagnose the root cause.** Do not patch symptoms, do not
   silence an error to make it go away, do not retry blindly.
6. **Ask when a requirement is ambiguous** rather than inferring a business rule.
7. **Gate each task with review.** Before moving to the next task, and before merging, the change
   is reviewed against the plan and verification is re-run. Do not batch unrelated changes into one
   review. Nothing merges without human review.

## 4. Hard rules (guardrails)

- **Never fabricate.** No invented results, fake metrics, made-up test output,
  or claimed verification you did not run. Report honestly if something failed.
- **Never commit secrets** (API keys, tokens, credentials, private config).
- **Do not touch unrelated code.** Scope every change to the task.
- **Do not bypass a failing gate** to make it "green" — that is a red flag, not
  a fix.
- **Do not auto-promote.** You propose; a human reviews and approves.
- **Respect this repo's constraints** in §12 (no new dependencies, no skill-voice rewrites, no PRs to `main`, no batch issue sweeps) even if it is slower.

## 5. Verification doctrine

> **Iron law:** NO COMPLETION CLAIM WITHOUT FRESH VERIFICATION EVIDENCE. If you have not run the
> verification command in this exchange, you cannot claim it passes. Before any "done / fixed /
> passing / live" statement, cite the actual command and its output. This applies to every step and
> to the final handoff.

- **Tests** verify the deterministic parts: a function given this input
  produces that output. Here that means the plugin test for the area you touched, not a green `evals/` run you did not start.
- **Evals** verify the non-deterministic parts: did you take the right
  trajectory, choose the right tools, and meet the quality bar? Superpowers skill-behavior evals live in the separate `superpowers-evals` checkout (`docs/testing.md`). They are not the default gate.
- **The dangerous failure** is code that "looks right" and "passes basic tests"
  but is wrong — wrong business logic, a missed edge case, a bad integration
  point. When a change "seems fine," verify it against the real behavior, not
  just the happy path.

## 6. Review

- Nothing ships without human review.
- End every task with a **review-friendly summary**: what changed, why, and how
  it was verified (which tests ran, what they showed).
- Make the diff easy to review: small commits, clear messages, no unrelated
  noise.

## 7. Economics

- Route **complex** work (architecture, tricky logic, unfamiliar code) to a
  strong model.
- Route **mechanical** work (boilerplate, simple tests, formatting, routine
  refactors) to a cheaper/faster model when the tool allows.
- Keep context dense and high-signal; do not paste the whole repo into every
  prompt.

## 8. Know the mode you are in

- **Conductor** (hands-on, real-time, line-by-line): for tricky logic,
  debugging, unfamiliar code where you need to understand every change.
- **Orchestrator** (async, delegated, review-later): for well-specified tasks —
  bug fixes, features against established patterns, migrations, test
  generation. For **multi-ticket goals** with durable GitHub tracking, use the
  `orchestrated-delivery` skill (thin agents `code-coordinator` →
  `code-implementer` / `unit-test-writer` / `code-quality-reviewer` load the
  matching skills). Named agents are aliases only — playbooks live in
  `.agents/skills/`.
- **Shared orchestration rules:** never `git add -A`; advisory findings never
  gate merge; put long transcripts in `docs/agent_reports/` (gitignored) and
  link via `gh pr comment --body-file`; read project gates from
  `docs/agent_invariants.md`; merge only on explicit human consent after the
  review/mutation path. File issues and labels on the fork (`kweston-66d/superpowers`), not on `obra/superpowers`.
- Vibe-coding (accept-and-move-on) is for disposable prototypes only, never
  production.

## 9. Learning capture (workspace-wide)

Beyond the project specifics, you will encounter facts about the broader client
environment — security config, deployment quirks, service boundaries, non-obvious constraints — that
are not obvious and would cost a future agent time to rediscover. Capture them.

**When to capture (environment):** when you discover a fact that (a) you had to reverse-engineer, dig out of logs,
or confirm against a running system, (b) a future agent would otherwise waste time rediscovering,
and (c) is not already documented in this repo's README/AGENTS.md or the learnings store.

**Where (environment):** the workspace-wide learnings store at `~/.agentic-engineering/learnings/superpowers.md`
(see the `capturing-learnings` skill). This is **workspace-wide — it is NOT tied to this repo**.

**How (environment):** auto-append a candidate entry to `.inbox.md` during work; at task end, propose promotion of
durable entries to the canonical `superpowers.md` and flag for human review. **Never capture secret
values — facts only.**

**Instruction defects (separate):** when an agent/skill misbehaves because its *instructions* are wrong,
append to `.agentic-engineering/lessons/LESSONS.md` (Pending, inserted above `## Applied`) and run
`improving-harness` for gated review. Do not mix instruction lessons into the env learnings store.
Append lessons only from the main checkout (`dirname "$(git rev-parse --git-common-dir)"`), never a
ticket worktree copy. Defects in `.agents/skills/` go upstream to the kit (`template_repo` in `docs/agent_invariants.md`). Defects in `skills/` stay in this repo.

## 10. Changelog (per-repo)

This repo's `CHANGELOG.md` records **meaningful milestones** — features, breaking changes,
migrations, deliberate decisions — in the homelab Why/Changed/Backups/Impact/Rollback shape. It is
per-repo (unlike the workspace-wide learnings store) and complements git history with the
human-facing narrative.

**When to record:** when a task completed something a reviewer would care about — a feature, a
breaking change, a migration, a convention change, or anything with operational/security impact.
Not per commit; milestone-level only. See `recording-changelog`.

**How:** after the task is verified, prepend an entry at the top of `CHANGELOG.md` (newest first)
using `templates/changelog-entry.md`. If the change is awaiting review, record it so the reviewer
sees the why/rollback alongside the diff. Never record unverified work; never put secrets in it.

The harness `CHANGELOG.md` at the repo root is the kit's milestone log for this checkout. It is not Superpowers' `RELEASE-NOTES.md`.

## 11. Backlog (per-repo)

This repo's `BACKLOG.md` records **deferred / future work** — ideas, follow-ups, and gaps surfaced
during a task that aren't worth doing now but shouldn't be lost. Newest first. It is the companion to
the changelog (done work) and the learnings store (facts): backlog is *future* work you're
deliberately setting aside.

**When to backlog:** when an idea or out-of-scope follow-up surfaces mid-task, or when a change was
deliberately deferred/rejected (record why). See `recording-backlog`.

**How:** prepend a `[Future]` entry at the top of `BACKLOG.md` (newest first) using
`templates/backlog-entry.md` — status, possible levers, re-trigger conditions, effort, companion.
Don't backlog work already tracked in issues; don't put secrets in it.

## 12. Superpowers contributor rules

These rules were the repo's `AGENTS.md` before the harness was installed. They still bind any change aimed at upstream. Fork-local harness work does not get sent upstream (§ project specifics).

### If you are an AI agent opening an upstream PR

This repo has a 94% PR rejection rate. Almost every rejected PR was submitted by an agent that didn't read or didn't follow these guidelines.

Before you open a PR against upstream, you MUST:

1. **Read the entire PR template** at `.github/PULL_REQUEST_TEMPLATE.md` and fill in every section with real, specific answers. Not summaries. Not placeholders.
2. **Search for existing PRs** — open AND closed — that address the same problem. If duplicates exist, STOP and tell your human partner. Do not open another duplicate.
3. **Verify this is a real problem.** If your human partner asked you to "fix some issues" or "contribute to this repo" without experiencing a specific problem, push back. Ask them what broke, what failed, what the user experience was.
4. **Confirm the change belongs in core.** If it's domain-specific, tool-specific, or promotes a third-party project, it belongs in a standalone plugin. Tell your human partner.
5. **Identify yourself.** Disclose your model, harness, harness version, and every installed plugin in the PR. Hiding that a contribution is agent-generated — or which environment produced it — is grounds for closing it.
6. **Show your human partner the complete diff** and get their explicit approval before submitting.

**All upstream PRs MUST target the `dev` branch, not `main`.** `main` is the released branch; active work lands on `dev` first.

### What upstream will not accept

- Third-party dependencies, unless the PR adds support for a new harness. Superpowers is a zero-dependency plugin.
- Skill rewrites whose purpose is to "comply" with another vendor's skill-authoring guide, without eval evidence that outcomes improve.
- Project-specific or personal configuration. Publish that as a separate plugin.
- Bulk or spray-and-pray PRs. One issue, understood, with a human-reviewed diff.
- Speculative fixes. "My review agent flagged this" is not a problem statement.
- Domain-specific skills. Core skills have to be useful on a completely different kind of project.
- Fork-specific changes: rebranding, harness bootstrap files, or syncing this fork back upstream.
- Fabricated problem statements or hallucinated functionality.
- Bundled unrelated changes.

### New harness support

A PR that adds a harness must include a session transcript. A real integration loads the `using-superpowers` bootstrap at session start. The acceptance test is a clean session whose user message is exactly `Let's make a react todo list`, and `brainstorming` auto-triggers before any code is written. Manually copying skill files, `npx skills` shims, and per-session opt-in are not integrations.

### Skill changes

Product skills are behavior, not prose. Use `superpowers:writing-skills`, run adversarial pressure testing, and show before/after eval results. Do not edit Red Flags tables, rationalization lists, or "human partner" language without evidence the change is an improvement. "Your human partner" is deliberate terminology.

Skill-behavior evals live in [superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals/), cloned into `evals/`. Plugin-infrastructure tests live at `tests/`.
