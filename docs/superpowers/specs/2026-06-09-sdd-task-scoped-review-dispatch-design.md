# SDD Task-Scoped Review Dispatch

Make subagent-driven-development's per-task reviews cheaper and faster without weakening them, by scoping per-task review prompts to the task and stopping redundant work — while final branch review stays broad.

## Problem

Per-task code quality reviewers in SDD routinely do branch-review-scale work on single-task diffs. Evidence from real sessions on this machine:

- In one SDD session, 7/8 quality reviewers ran repo-wide greps; the most expensive ran 50+ Bash commands over ~200 seconds. Quality reviewers cost 4-8× what spec reviewers cost on the same tasks.
- Spec reviewers, whose prompt contains "Only read files in this diff. Do not crawl the broader codebase," stayed tight: 6-16 tool calls, 14-65 seconds.
- No reviewer ran heavy tests autonomously. Every package-wide or repeated test run observed was explicitly requested by a controller-written prompt ("check all uses," "run tests if useful, especially race-focused ones," "does anything else read `Meta()`?").

Root causes, in order of impact:

1. **The per-task quality prompt inherits a merge-readiness review.** `code-quality-reviewer-prompt.md` delegates to `requesting-code-review/code-reviewer.md`, which asks about architecture, scalability, security, production readiness, and ends with "Ready to merge?" That frame licenses branch-level breadth on a one-task diff. The spec prompt's diff-scope guard was never carried over.
2. **The controller gets no guidance on writing reviewer prompts**, so it invents open-ended directives ("check all uses") that reviewers interpret literally.
3. **Duplicated work across the pipeline.** The quality template's "Plan alignment" dimension re-checks what the spec reviewer just verified. Reviewers re-run test suites the implementer already ran (and reported, with TDD evidence) on identical code.
4. **Per-task and final review share one template**, so there is no representation of "per-task narrow, final broad" anywhere.

A field report (`~/2026-06-09-code-quality-reviewer-scope-budget-issue.md`) first flagged this. Its cited session and headline numbers could not be verified, but its qualitative diagnosis was confirmed against two real local sessions. One correction to it: cross-cutting audits (lock ordering, changed contracts) are sometimes the *correct* review method — the fix must gate breadth behind a stated concrete risk, not forbid it.

## Goals

- Per-task reviews scoped to the task: diff-first reading, justified broadening, no redundant test runs.
- Final whole-branch review keeps its current breadth.
- No reduction in what reviews catch.

## Non-goals / explicitly preserved

- **Full re-reviews stay.** When a reviewer re-reviews after a fix, it still reviews the whole task at full reading breadth. (It does not re-run tests the implementer just ran on the amended code.)
- **The two review stages stay separate.** Spec compliance and code quality remain independent subagents, serially gated. No merging.
- **The coordinator keeps model judgment.** No forced model tier for reviews, in either direction.
- **`requesting-code-review/` is untouched.** It remains the broad template for final branch review and ad-hoc review.
- Review ordering (spec before quality), the fix-and-re-review loops, and the requirement to fix Critical/Important findings are unchanged.

## Design

### Shared principle: don't re-run tests on code that hasn't changed

The implementer's report includes test results and TDD RED/GREEN evidence for exactly the code under review. Reviewers verify by reading. A reviewer runs a test only when reading raises a specific doubt that no existing run answers — and then a focused test, not a suite. After a fix, the implementer re-runs tests on the amended code; the re-reviewer does not repeat that run. This principle appears in both reviewer prompts and in the controller guidance.

### 1. New file: `skills/subagent-driven-development/code-quality-reviewer-prompt.md` becomes self-contained

Stop delegating to `requesting-code-review/code-reviewer.md`. The per-task quality reviewer gets its own scoped prompt template:

- **Framing:** "You are reviewing one task's implementation for code quality." A task-scoped gate, not a merge review.
- **Spec compliance is settled:** spec review already passed; do not re-litigate requirements or plan alignment.
- **Review dimensions kept:** code quality (clarity, duplication, error handling), test quality (real behavior, not mocks), maintainability, and the existing SDD-specific checks (single responsibility, independent testability, file structure from plan, file growth contributed by this change). Dropped: plan alignment, security/scalability/production-readiness dimensions, merge verdict.
- **Scope budget:** start from `git diff BASE..HEAD`; read changed files first; inspect adjacent code only to evaluate a concrete risk you can name. Cross-cutting changes — lock ordering, changed function/API contracts, shared mutable state — are legitimate named risks that justify checking call sites. Do not crawl the codebase by default.
- **Test budget:** the shared principle above, plus: no package-wide suites, race detectors, or repeated/high-count runs unless you have first named a specific suspected flake or race. Otherwise, recommend heavy validation in the report instead of running it.
- **Read-only rule** kept (no mutating the working tree, index, HEAD, or branch state).
- **Verdict:** Strengths / Issues (Critical/Important/Minor) / "Task quality: Approved | Needs fixes."

### 2. `skills/subagent-driven-development/spec-reviewer-prompt.md` cleanups

- Remove the `git worktree add` how-to sentence. The read-only rule stays; a diff-scoped spec review never needs a checkout of another revision.
- Resolve the tension between the diff-only guard and "verify everything independently": spec compliance is judged by reading the diff against the requirements. The implementer's TDD evidence covers "it runs" — apply the shared test principle.
- New third verdict channel: requirements that cannot be verified from the diff (live in unchanged code, span tasks) are reported as explicit "⚠️ Cannot verify from diff — controller should check X" items, instead of either crawling or silently passing.
- Replace the fabricated premise "The implementer finished suspiciously quickly" with grounded skepticism: treat the implementer's report as unverified claims about the code. Same distrust, no invented fact.

### 3. `skills/subagent-driven-development/SKILL.md` controller changes

- **Model Selection:** replace "Architecture, design, and review tasks: use the most capable available model" with judgment guidance — pick reviewer models the way implementer models are picked, scaled to the diff's size, complexity, and risk.
- **Reviewer prompt construction** (new guidance near Red Flags): when dispatching reviewers, do not write open-ended directives ("check all uses," "run race tests if useful") without a concrete task-specific reason; do not ask reviewers to re-run tests the implementer already ran on the same code; per-task reviews are task-scoped gates — the broad review happens once, at the final whole-branch review.
- **Final review stays broad, explicitly:** the final whole-branch reviewer dispatch uses `requesting-code-review/code-reviewer.md`. The Integration section's note that `superpowers:requesting-code-review` provides "the code review template for reviewer subagents" is corrected to apply to the final review only.
- Flowchart topology is unchanged.

## What this does not fix (known, deferred)

The spec reviewer judges against task text the controller pasted; it cannot catch requirements dropped during the controller's extraction from the plan. That is an architectural property of "controller provides full text," not a prompt problem, and is out of scope here.

## Verification

- Plugin infrastructure tests (`tests/`) still pass.
- Run the SDD skill-behavior evals in the `evals/` submodule before and after the change. Reviews must still catch seeded issues; per-task reviewers should show less repo-wide exploration and fewer redundant test runs.
