# Lean Delivery Implementation Plan

> Execute with toolbelt:delivery.

**Goal:** Cut `skills/` from 32,752 words to under 13,500. Rebuild delivery around one strong implementer per PR with one independent review behind it. Move every check a script can do reliably out of prose and into a script.

**Architecture:** Four skills go away (`orchestrating`, `subagent-driven-development`, `dispatching-parallel-agents`, `writing-for-agents`), and so does the execution-tracks machinery. `delivery` absorbs what survives of the first two, and `writing-skills` absorbs the last. Plans state contracts and risks. Reviews scale to the risk the plan records for each PR. Tests that pin skill wording are replaced by one structural check.

**Tech Stack:** Markdown skills, bash tests under `tests/toolbelt/`, `scripts/lint-shell.sh`, `scripts/bump-version.sh`, the ux-capture Node script, `gh`.

**Sources:**
- The October 2026 retrospective across four workstreams, saved at `.toolbelt/brainstorm/2026-10-15-retrospective.md`.
- The FSMCRM PR review audit (PRs #1123–#1374), which supplied the sibling, enumeration, entry-point and sweep findings.
- Anthropic's prompting guidance for Opus 5.5 and Fable 5.1, and its skill authoring best practices.
- obra/superpowers changes since the fork at v6.1.1.

Codex reviewed two drafts (gpt-6-astra high, then gpt-6.1-sol high), and the findings of both rounds are folded in. A second session's retrospective added the implementer self-check, the monitor's wait rule, and the liveness check.

## Decisions this plan makes

These change behavior, so read them before the tasks.

1. **One implementer per PR.** The implementer receives every task brief for the PR at once and commits after each task. It works through every task without checking in. It stops only for a behavior, contract, or money decision the plan does not make. There are no per-task reviews or pause points. A task's `Verify` is its own focused check, not a gate.
2. **One local review per PR, before publish.** The plan's `Risk` column sets the review's effort. The PR's review providers are the second independent reviewer. There is no local re-review, because the providers' next round is the re-check.
   - `Risk: none` skips the local review. It applies to sweeps, codemods, and CI config.
   - **Large PRs split the review.** A boundary over 2,000 changed lines, or one spanning areas a single reader cannot hold (schema, jobs, and UI, for example), gets up to three reviewers in parallel. Each reviewer gets a slice of disjoint paths plus the full file list. The findings merge into one list.
3. **Parallelism is at the PR level.** Up to three implementers run at a time, each on an independent boundary with disjoint files. A project's worktree policy may set a lower limit. Execution tracks, sub-worktrees, and integration tasks are gone.
4. **Implementer reports come back as the reply.** Subagents cannot write outside their checkout, so the reply is the report. Delivery saves it to `<workspace>/boundary-N-report.md`, and the ledger gets one line pointing at it.
5. **Plans specify contracts, not code.**
   - Task fields are `Files`, `Contract`, `Proves`, and `Verify`.
   - A reference is a path and a symbol, never a line number. File lists are hints.
   - The plan gains a `## Risks` section and a `Risk` column in the PR table.
   - `writing-plans` shows one good task and lists what not to write.
6. **Plans catch what reviews kept catching.** Each of these traces to the FSMCRM audit.
   - A task that adds a member to a union, enum, status, event, or operation includes the search that finds every list of that type's members.
   - `## Risks` lists every other way into each invariant the change relies on (public link, import, replay, restore, worker, alternate actor), and the one shared guard each path calls.
   - A scripted rewrite names its exclusions and is run twice. The second run must change nothing.
7. **A finding is about a pattern, not a site.** Whoever fixes a review finding searches for the same defect elsewhere. They fix every sibling in the same push, or list each one left and why. The fix reply names the siblings, or names the search that found none.
8. **One testing rule, stated once in `test-driven-development`.**
   - Guards (permission checks, tenant filters, money math, rejection paths) and bug fixes are test-first, with the mutation check.
   - Everything else writes its tests alongside the code.
   - Each `Proves` line gets one focused test. Other skills cite this rule and do not restate it.
9. **Rebase once, at publish.** Delivery rebases an unpublished branch right before its review. The monitor owns rebasing after that, and the implementer never rebases. A behavior-neutral PR never waits on another workstream; the second one to merge rebases.
10. **A fresh monitor carries PRs to merge.**
    - A chain of stacked PRs has exactly one monitor. One monitor may carry several independent PRs.
    - After two provider rounds, some findings move to a `## Follow-ups` list in the PR body: those the provider rates below its top two severities, and that touch no data, security, or money. A project's PR policy can forbid this.
11. **Routing defaults.**
    - Implementer: high effort. Monitor: low effort, raised to medium for money PRs. Explorer: Sonnet, medium. Reviewer: high.
    - The reviewer runs on a different harness from the implementer's.
    - The Claude routing file says never to use the Explore agent.
12. **Sizing is advisory.** The target is three to nine tasks and 1,000–4,000 changed lines. Above 3,000 lines, the plan says why the PR stays one PR. A one-task PR is fine.
13. **Scripts take the deterministic checks.** A script is added only where its output is always right.
    - New `plan-check` lints a plan's structure.
    - `review-package` gains path slices.
    - New `pr-state` reports a PR's head, checks, reviews, and open threads. A policy file can name the project's own command instead.
    - New `dispatch-prompt` fills the implementer and reviewer templates into a prompt file and prints its path. The session agent dispatches "Read <path> and follow it" and never loads a template into its own context.
    - Skills call scripts as `bash scripts/<name>`, so a packager that strips executable bits does no harm.
14. **Tests check structure, not wording.**
    - The new `structure` checks in `test-doctrine.sh` cover: links and script paths resolve, `toolbelt:` names exist, no all-caps emphasis outside gate blocks, and no stock filler phrases.
    - The fifteen phrase-needle test files are deleted. Script and behavior tests stay.
15. **Prose follows current model guidance.**
    - Normal imperative sentences, with a reason in one clause where the rule is not obvious.
    - No MUST, CRITICAL, or ALWAYS outside `<HARD-GATE>`/`<ENTRY-GATE>` blocks. No "think carefully". No instructions to re-check finished work.
    - One positive example where a pattern is hard to describe.
    - Discretionary subagents only for large, independent work, never to double-check your own. The roles delivery, quick-task, and review require are not discretionary.
16. **Authoring guidance shrinks to one skill.**
    - `writing-for-agents` merges into `writing-skills`.
    - The pasted copy of Anthropic's best-practices page (5,802 words) becomes a link and the eight rules toolbelt uses.
    - `persuasion-principles.md` and `examples/CLAUDE_MD_TESTING.md` are deleted.
17. **`dispatching-parallel-agents` is deleted.** Current models over-delegate. The one rule worth keeping (Decision 15's subagent line) lives in `using-toolbelt`.
18. **Historical plans and specs are deleted.** That is 48,077 words in `docs/toolbelt/`, which no agent or tool reads. Git keeps them. This plan stays until it ships.

## What this plan does not change

These findings belong in the consuming project, not in a global plugin. Delivery and the implementer prompt point at `AGENTS.md` and `.toolbelt/worktree-policy.md` so a project can carry them:
- The deployment status note, lane ports, the heavy-command lock, `--maxWorkers`, "no app server", "no full suite", and the concurrency limit.
- Tracker wording.
- The related-tests script, lane creation, and cleanup.
- App-specific reviewer catches. These go in `docs/REVIEW-GUIDANCE.md`.

Cross-workstream notification means telling your human partner. Toolbelt assumes no notifier.

`.toolbelt/routing/<harness>.md` still overrides the bundled routing, and `.toolbelt/pr-policy.md` still overrides the follow-up rule and the PR-state command.

The edits fsmcrm needs are listed under **After release: fsmcrm**. They are its own quick-task in that repo, not part of these PRs.

## Global Constraints

- **No hard-coded names in skills.** Skills hard-code no repository, review provider, tracker, or model name. Model names live only in `skills/agent-routing/routing/*.md`.
- **Wording and handoffs.**
  - "Your human partner" stays.
  - One skill names exactly one next skill and says "Do NOT invoke any other skill."
- **Prose rules for every rewritten file:**
  - Decision 15.
  - One idea per sentence. Say each rule once. No metaphor.
  - A prohibition only where a positive instruction cannot carry it.
  - Keep exact commands, paths, and quoted user-facing messages verbatim unless a task changes them.
  - A skill's `description` says what triggers it, in third person, and never summarizes the workflow.
- **Word budget.**
  - `tests/toolbelt/test-word-counts.sh` sets each rewritten file's ceiling to its new count plus ten percent, rounded up to ten.
  - It also checks that all of `skills/**/*.md` sums to under 13,500 words.
  - The per-directory targets below sum to about 12,300. Each task meets its targets.
  - If a file cannot hold its rules under its target, report the count rather than dropping a rule.
  - The task that rewrites or deletes a file updates or removes its entry in `test-word-counts.sh` in the same commit.

| Directory | Today | Target |
|---|---|---|
| writing-skills + writing-for-agents | 11,354 | 1,500 |
| subagent-driven-development + orchestrating | 4,042 | 0 |
| brainstorming | 2,254 | 1,100 |
| writing-plans | 2,099 | 900 |
| interactive-design | 1,680 | 800 |
| ux-gate | 1,530 | 900 |
| test-driven-development | 1,322 | 900 |
| requesting-code-review | 1,251 | 900 |
| delivery (with the implementer prompt file) | 1,144 | 1,300 |
| systematic-debugging | 937 | 500 |
| pr-monitor | 872 | 500 |
| agent-routing (with routing files) | 827 | 550 |
| finishing-a-development-branch | 742 | 350 |
| using-git-worktrees | 699 | 400 |
| writing-specs | 519 | 350 |
| using-toolbelt | 514 | 350 |
| dispatching-parallel-agents | 300 | 0 |
| receiving-code-review | 246 | 220 |
| verification-before-completion | 230 | 150 |
| quick-task | 190 | 190 |

- **Codex manifest.** Codex `agents/openai.yaml` `short_description` is 25–64 bytes.
- **Version.** The version bumps to 10.0.0 in PR 2 with `scripts/bump-version.sh 10.0.0`.

## Known Gotchas

- **Tests run one file at a time.** Run one with `bash tests/toolbelt/<name>.sh`, or all of them with `for t in tests/toolbelt/test-*.sh; do bash "$t" || exit 1; done`. Changed shell files also pass `scripts/lint-shell.sh <file>`.
- **`ledger-append` rejects multiline input.** That is why the implementer reply is saved as its own file.
- **The Codex packaging test pins a script path.** `tests/codex/test-package-codex-plugin.sh` checks the executable bit of `skills/subagent-driven-development/scripts/task-brief`, both on disk and inside the tar archive.
- **`tests/claude-code/test-sdd-workspace.sh` does not call `claude`.** It is a local script test and moves to `tests/toolbelt/`. The two `test-subagent-driven-development*.sh` files do call `claude`, and they are deleted.
- **`tests/explicit-skill-requests/` names `subagent-driven-development`.**
- **`test-doctrine.sh` limits where certain text can appear.** It lists the files allowed a rationalization table and forbids "Iron Law" outside TDD.
- **The ux-capture regression wrapper prints `SKIP` without Playwright.** It takes the launcher path as its first argument.

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Risk | Independent verification |
|---|---|---|---|---|---|
| 1 | Delivery pipeline: one implementer and one review per PR, contract-level plans, scripted checks, structural tests | 1–6 | none | high | all `tests/toolbelt/test-*.sh` and `tests/codex/test-package-codex-plugin.sh` exit 0; `bash skills/writing-plans/scripts/plan-check docs/toolbelt/plans/2026-10-15-lean-delivery.md` exits 0 |
| 2 | Remaining skills, docs, and release 10.0.0 under the word budget | 7–9 | 1 | medium | all `tests/toolbelt/test-*.sh` exit 0, including the 13,500-word total; `scripts/bump-version.sh --check` reports 10.0.0; `git grep -l "subagent-driven-development\|toolbelt:orchestrating\|skills/orchestrating\|dispatching-parallel-agents\|writing-for-agents\|execution-tracks" -- skills docs/*.md README.md CLAUDE.md tests .codex-plugin` matches nothing |
| 3 | ux-capture stops reporting covered links and screen-reader-only text | 10 | none | medium | `bash tests/toolbelt/test-ux-capture-regressions.sh` exits 0 with no `SKIP` line; `bash tests/toolbelt/test-ux-capture.sh` exits 0 |

- **PR 1 stays one PR.** Its handoffs are circular: writing-plans hands to delivery, delivery's prompt cites the plan's task shape, and both use the routing roles. Merging half of it would leave contradictory handoffs.
- **PR 2 stacks on PR 1.** It edits the word-count test and the version that PR 1 also edits.
- **PR 3 is independent.** It is code with its own tests.

## Risks

- **Who else reads the scripts that move?** `task-brief`, `review-package`, `sdd-workspace`, and `ledger-append` are called by delivery, quick-task, requesting-code-review, pr-monitor, the Codex packaging test, and `test-sdd-workspace.sh`. Task 2 repoints every caller.
- **What does the installed copy still read?** Nothing on disk. Each harness installs a cached copy, and a session loads one version.
- **Other ways in:** none. These are markdown and local scripts with no runtime entry points.
- **Files another workstream claims:** none.
- **What else lists the removed skills?** `README.md`, `docs/`, `.codex-plugin/plugin.json` keywords, `tests/explicit-skill-requests/`, `using-toolbelt/references/codex-tools.md`, and `docs/porting-to-a-new-harness.md`. Task 9 runs the `git grep` in PR 2's verification row and updates every match.

### Task 1: tests check structure, not wording

Closes: Decision 14. This runs first so that later tasks do not edit needles they are about to delete.

**Files:**
- Modify: `tests/toolbelt/test-doctrine.sh`
- Delete: the needle tests `tests/toolbelt/test-delivery.sh`, `test-pr-monitor.sh`, `test-writing-plans.sh`, `test-ux-gate.sh`, `test-interactive-design.sh`, `test-orchestrating.sh`, `test-completion-contract.sh`, `test-reviewer-context.sh`, `test-quick-task.sh`, `test-fix-loop.sh`, `test-final-review-gate.sh`, `test-execution-tracks.sh`, `test-workflow-summary.sh`, `test-worktree-baseline.sh`, `test-worktree-source-ref.sh`
- Modify: `test-chain-rebase.sh` (drop its one needle check and keep the scripted walkthrough)
- Modify: `docs/testing.md`
- Modify: `CLAUDE.md` (its sentence on tests)

**Contract:** `test-doctrine.sh` keeps its current checks and adds a `structure` group that runs over `skills/`:
- Every relative `*.md` link and every `scripts/<name>` reference outside a code fence resolves from the citing file's skill directory, or from the repository root for the documented checkout commands such as `scripts/setup-codex-routing`.
- Every `toolbelt:<name>` names a directory under `skills/`.
- No standalone `MUST`, `NEVER`, `ALWAYS`, `CRITICAL`, or `IMPORTANT` appears outside `<HARD-GATE>`/`<ENTRY-GATE>` blocks or code spans.
- None of these stock phrases appears: "It's important to", "the whole point", "Remember,", "Note that", "In order to", "make sure to".

The "Iron Law" and rationalization-table allowances stay.

The kept tests are: `test-chain-rebase`, `test-claude-agent-definitions`, `test-doctrine`, `test-ledger-append`, `test-load-routing`, `test-token-audit`, `test-ux-capture`, `test-ux-capture-regressions`, and `test-word-counts`.

**Proves:**
- (guard) The structure group fails on each of five fixture skills under `tests/toolbelt/fixtures/doctrine/`: a broken link, a missing script, an unknown `toolbelt:` name, a stray `MUST`, and a stock phrase.
- (guard) A `MUST` inside a `<HARD-GATE>` block passes. An illustrative link inside a code fence passes. A checkout-relative `scripts/` command that exists at the repository root passes.

- Today's skills pass. This task fixes each failure in place with the smallest edit; today that is about 13 all-caps words and one stock phrase.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && scripts/lint-shell.sh tests/toolbelt/test-doctrine.sh`

### Task 2: delivery absorbs orchestrating and subagent-driven-development

Closes: Decisions 1–4, 7, 9, and 13 (`review-package` slices and the `bash scripts/` call style); recovery after interruption; the inefficiency log.

**Files:**
- Rewrite: `skills/delivery/SKILL.md`, `skills/delivery/branch-lifecycle.md`
- Create: `skills/delivery/implementer-prompt.md`, `skills/delivery/scripts/dispatch-prompt`
- Move: `skills/subagent-driven-development/scripts/{ledger-append,review-package,sdd-workspace,task-brief}` to `skills/delivery/scripts/`
  - `sdd-workspace` is renamed `workspace`, and every script that resolves it follows.
  - `task-brief` also copies `## Risks`.
  - `review-package` accepts `-- <pathspec>...` after HEAD and limits the diff to those paths. The commit list and the full `--stat` stay unsliced. A sliced package's default file name adds a short hash of its pathspec, so parallel slices of one range never share a file.
  - `task-brief` ends a task at the next `##` or `###` heading outside a code fence, so a trailing section such as `## After release` never lands in a brief.
- Modify: every `../subagent-driven-development/scripts/` reference under `skills/`
- Delete: `skills/orchestrating/` and `skills/subagent-driven-development/`
- Move: `tests/claude-code/test-sdd-workspace.sh` to `tests/toolbelt/test-workspace-scripts.sh`
- Modify: `tests/toolbelt/test-ledger-append.sh`, `tests/toolbelt/test-word-counts.sh`, `tests/codex/test-package-codex-plugin.sh`, `tests/claude-code/run-skill-tests.sh`

**Contract:** `delivery/SKILL.md` sections:
- **What you read.**
  - Read: the plan, this skill, `branch-lifecycle.md`, agent-routing with the routing text, using-git-worktrees with the worktree policy, the ledger, and the implementer's reply. Do not read `implementer-prompt.md` or `code-reviewer.md`; `dispatch-prompt` fills them.
  - Diffs, reviews, and logs move by path.
  - Check an implementer's claim against the diff before raising it to your human partner.
- **Before dispatch:** run `bash ../writing-plans/scripts/plan-check PLAN`. A failure goes back to planning.
- **Per boundary.**
  - Set up the branch point and worktree, then record the fork SHA. A boundary that follows interactive-design keeps the prototype branch, worktree, and baseline, and its review BASE is the commit before the prototype commits.
  - Run `bash scripts/dispatch-prompt implementer --plan PLAN --boundary N --worktree DIR`. Dispatch one implementer with "Read <printed path> and follow it", then record its agent id.
  - Statuses: `DONE` continues. `NEEDS_DECISION` goes to your human partner; append the ruling to the brief under `## Rulings` and resume the implementer. `BLOCKED` is retried once with what it asked for or a stronger routed model; a second `BLOCKED` goes to your human partner.
  - An implementer that cannot be resumed is replaced by a fresh one, given the briefs, the report so far, and the current head.
  - Run ux-gate when its entry condition holds, then the review, then publish.
  - Up to three implementers run at once.
  - Liveness: an agent with no new commit or output for 60 minutes gets its state checked. If it is stuck, stop it and replace it with a fresh one.
- **Review.**
  - Skip on `Risk: none`, and record `Review: skipped` as the gate evidence.
  - Otherwise, rebase an unpublished dependent boundary first, run `review-package --plan PLAN BASE HEAD`, and dispatch the reviewer at the row's effort. Give it the boundary number, its task set, and the brief paths whose `## Rulings` override the plan.
  - Build each reviewer's prompt with `bash scripts/dispatch-prompt reviewer --plan PLAN --boundary N --package FILE [--slice PATHS]` and dispatch "Read <printed path> and follow it."
  - Over 2,000 changed lines, or across separate areas, split the review into up to three reviewers, one per path slice (`review-package ... -- <paths>`), run in parallel, and merge their findings.
  - Critical and Important findings go to the same implementer in one dispatch.
  - No local re-review. A `plan-gap` finding goes to your human partner.
  - Record `Review: clean|fixed|skipped at <SHA>`.
- **Publish.**
  - Hand off to a pr-monitor with the worktree, target base, review SHA, and ledger path.
  - The first boundary of a chain starts a monitor. A dependent boundary resumes that chain's monitor. Independent boundaries may share one.
  - Check the ledger for a live monitor before starting another.
  - Keep delivering while monitors run.
- **On return.** Merged: confirm on the remote, then clean up per branch-lifecycle. Blocked: take it to your human partner and continue what it does not block.
- **Done** only when every boundary is merged and cleaned up, or blocked with your human partner told. Waiting on a monitor is not done.
- **Ledger.**
  - `ledger-append` runs at gates only, and each line ends with `Next: <event>`.
  - Save the implementer reply to `<workspace>/boundary-N-report.md`.
  - Before cleanup, append `## Inefficiencies`: every wait, repeat, or stop the run did not need.
- **Recovery.**
  - Read the ledger and `git log`, list worktrees, check live agents and remote PRs, then continue from the latest `Next:`.
  - Never redispatch a boundary already reviewed or published.
- **Questions.**
  - Only product, money, or cross-team questions go to your human partner, in plain words.
  - Decide everything else money-safely and note it in the ledger.

`branch-lifecycle.md` covers:
- The ledger record format.
- Rebase ownership.
- The two-case rebase recipe:
  - Parent moved: `git rebase --onto <parent-new> <parent-old> <branch>`.
  - Parent merged: `--onto` the base from the recorded old parent head, then retarget.
- Cleanup.

Drop the mid-boundary rebase check and the track rules.

`dispatch-prompt implementer`:
- Runs `task-brief` for each task in the boundary's PR row, in order.
- Fills `implementer-prompt.md`'s placeholders: brief paths, worktree, plan path, and the paths of `AGENTS.md` and `.toolbelt/worktree-policy.md` when they exist.
- Writes `<workspace>/boundary-N-implementer.md` and prints its path.
- Exits non-zero if the boundary is not in the table or any `[PLACEHOLDER]` is left unfilled.

`implementer-prompt.md` (under 350 words), read only by the implementer:
- **Inputs:** brief paths, worktree, plan path, and `AGENTS.md` and `.toolbelt/worktree-policy.md` when present.
- **Work:**
  - Carry every task in order, commit after each, and do not check in between tasks.
  - The file list is a hint. Edit coupled files and name them.
  - Stop with `NEEDS_DECISION` only for an unmade behavior, contract, or money decision. Make other calls and note them.
  - Tests follow toolbelt:test-driven-development. Run each task's `Verify` as printed when the task is done. At the end, run the related tests, typecheck, and lint once, per toolbelt:verification-before-completion; do not rerun the `Verify` commands separately.
  - Before replying, check the diff against the **Look for** list in `../requesting-code-review/code-reviewer.md`, and fix what it finds.
  - No subagents, no servers left running, no rebases.
- **Reply,** under 20 lines: status, commits, one line per task, drift and coupled files, and test commands with their last passing lines.
- **Fix dispatch reply:** one line per finding, either `fixed <sha>; siblings: <sites fixed | none (<search run>)>` or `REBUTTED: <evidence>`.

**Proves:**
- `review-package BASE HEAD -- <path>` writes a diff that contains only that path, while `## Files changed` lists every file.
- Two slices of one range, written at the same time, land in two different files.
- `task-brief` for the last task of a fixture plan stops before the trailing `##` section.
- `task-brief` against a fixture plan includes the fixture's `## Risks`.
- `dispatch-prompt implementer` on a fixture plan writes a prompt that names every brief of the boundary in order and contains no `[`-bracketed placeholder.
- (guard) `dispatch-prompt implementer` exits non-zero for a boundary not in the table.
- `ledger-append` passes from its new path.
- The Codex packaging test passes with the new path.

**Verify:** `for t in tests/toolbelt/test-workspace-scripts.sh tests/toolbelt/test-ledger-append.sh tests/toolbelt/test-chain-rebase.sh tests/toolbelt/test-word-counts.sh tests/codex/test-package-codex-plugin.sh; do bash "$t" || exit 1; done`

### Task 3: writing-plans and plan-check

Closes: Decisions 5, 6, and 12; plan-check from Decision 13. Also the review comment asking for a good-task example.

**Files:**
- Rewrite: `skills/writing-plans/SKILL.md`
- Create: `skills/writing-plans/scripts/plan-check`, `tests/toolbelt/test-plan-check.sh`, fixtures under `tests/toolbelt/fixtures/plan-check/`
- Delete: `skills/writing-plans/execution-tracks.md`
- Modify: `tests/toolbelt/test-word-counts.sh`

**Contract:** `writing-plans/SKILL.md`:
- **Shape.**
  - A PR boundary is an outcome a reviewer can judge alone.
  - Decision 12 sizing applies.
  - Independent boundaries list disjoint files. A dependent boundary names one predecessor.
  - The `Risk` column takes `high` (money, security, tenancy, migrations, shared contracts), `none` (sweep, codemod, CI config), or `medium` otherwise.
- **Detail.**
  - The plan writes contracts: names, shapes, signatures, error codes, states, owners, and exact values.
  - No SQL, code bodies, or tutorials.
  - References are a path and a symbol. File lists are hints.
- **Task fields:** `Files`, `Contract`, `Proves` (one line per decided behavior, with guards marked `(guard)`), and `Verify` (the command that proves the task).
  - A task adding an enum, union, status, event, or operation member pastes the search that finds every list of those members, plus the hits.
  - A scripted rewrite names its exclusions, and its `Verify` reruns it, ending in `git diff --exit-code`.
- **Sections:**
  - Goal, Architecture, Global Constraints, Known Gotchas, Data Model (when schema changes), Risks, PR Boundaries, then tasks.
  - `## Risks` answers four questions:
    - Who else reads or writes what this deletes, stops writing, or recalculates?
    - What does the previous release still read?
    - What other ways in reach each invariant, and which shared guard does each call?
    - Which touched files does another workstream claim?
- **One example task** of about 120 words, in the four fields, for a guard change.
- **A "Not this" list,** one line each: a code body, a line number, a step-by-step tutorial, a restated testing rule, a task that cannot be verified on its own.
- **Explore first:** name paths, signatures, and the precedent to copy. Dispatch an explorer only for a wide question.
- **Review:**
  - Run `bash scripts/plan-check PLAN` and fix what it reports.
  - Self-check against the spec, then run one cross-harness plan review.
  - Fix small gaps. A change of approach goes to your human partner.
- **Handoff:** approval, then `toolbelt:delivery`.

`plan-check PLAN` checks the following and exits non-zero with one line per error:
- A `## PR Boundaries` table with a `Risk` column whose values are `high`, `medium`, or `none`.
- Task numbers are unique, and the set of `### Task N` headings equals the set of tasks the PR rows assign. Each task is in exactly one row, and ranges like `1–7` expand.
- Every task has `**Files:**`, `**Contract:**`, `**Proves:**`, and `**Verify:**`.
- No `path.ext:NN` or "line NN" references inside a `### Task` section. Sections outside tasks may cite lines as evidence.
- A `## Risks` section exists.

Warnings, which do not fail: more than nine tasks in one PR.

**Proves:**
- (guard) Each of these fixtures fails with its own message: a missing Risk column, a bad Risk value, an orphan task, a row naming a task that does not exist, a duplicate task number, a missing field, a line-number reference, and no Risks section.
- A valid fixture and this plan both pass.
- Ten tasks in one PR warns and still exits 0.

**Verify:** `bash tests/toolbelt/test-plan-check.sh && bash tests/toolbelt/test-word-counts.sh && scripts/lint-shell.sh skills/writing-plans/scripts/plan-check`

### Task 4: review skills

Closes: Decision 7; rulings and scope reach the reviewer; the recurring provider catches.

**Files:**
- Rewrite: `skills/requesting-code-review/SKILL.md`, `skills/requesting-code-review/code-reviewer.md`, `skills/receiving-code-review/SKILL.md`
- Modify: `skills/delivery/scripts/dispatch-prompt` (reviewer mode), `tests/toolbelt/test-workspace-scripts.sh`, `tests/toolbelt/test-word-counts.sh`

**Contract:**
- **`dispatch-prompt reviewer`** fills `code-reviewer.md`: the package path, the plan, `[SCOPE]` from the boundary's PR row, `[RULINGS]` from the boundary's briefs that contain `## Rulings` (or `None`), and `[SLICE]` (or `all`). It writes `<workspace>/boundary-N-review[-<slice hash>].md`, prints the path, and exits non-zero on any unfilled placeholder.
- **`requesting-code-review`.** Four steps, under 150 words:
  - Pick the range. BASE is the recorded start or the merge-base, never `HEAD~1`.
  - Build the package with `bash ../delivery/scripts/review-package`.
  - Dispatch the reviewer.
  - Act on the verdict.
- **`code-reviewer.md` keeps** inputs by path, read-only, trace one hop, calibration by concrete scenario, the `plan-gap` label, severities, the output file, and the short reply.
- **`code-reviewer.md` adds:**
  - `[RULINGS]`: brief paths whose rulings override the plan.
  - `[SCOPE]`: the boundary and its tasks, so later PRs' work does not read as missing.
  - `[SLICE]`: the paths this reviewer owns, or `all`.
  - "Name the pattern and any sibling sites you saw."
  - One **Look for** checklist: races; deploy ordering against the previous release; one-time secrets stored or logged; system-actor and background paths for new commands; UI and API permission parity, including each button's gating against its endpoint's permission; moved behavior, checked on both the old and new path; every route that grants access; reuse of an existing owner; screens after an access error; stale drafts; refresh in both directions; empty, duplicate, concurrent, retried, partial, and large inputs; units, time zones, rounding, and encoding; lifecycle gaps.
- **`receiving-code-review`,** under 200 words:
  - Verify each item against the code.
  - Your human partner's feedback is trusted.
  - Push back with evidence.
  - Search for callers before calling something unused.
  - Sibling sweep: a finding about one site is a finding about the pattern. Search for it, then fix every match in the same push or list each one left and why.
  - The GitHub reply command.

**Proves:**
- `bash tests/toolbelt/test-doctrine.sh` reports no structure failures in these three files.
- `dispatch-prompt reviewer` on a fixture with one ruled brief lists that brief under rulings, names the boundary's tasks under scope, and leaves no placeholder.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-workspace-scripts.sh && bash tests/toolbelt/test-word-counts.sh`

### Task 5: pr-monitor, pr-state, finishing, worktrees

Closes: Decisions 9, 10, and 13 (`pr-state`); "fix with siblings" in the monitor loop; one PR closes a ticket.

**Files:**
- Rewrite: `skills/pr-monitor/SKILL.md`, `skills/finishing-a-development-branch/SKILL.md`, `skills/using-git-worktrees/SKILL.md`
- Create: `skills/pr-monitor/scripts/pr-state`, `tests/toolbelt/test-pr-state.sh`
- Modify: `tests/toolbelt/test-word-counts.sh`

**Contract:**
- **`pr-state <PR>`** uses `gh` to print one JSON object: `head` SHA, `checks` (`pass`, `fail`, `pending`, or `unavailable`, with failing names), `reviews` (author, state, and the commit each review covers), and `threads` (id, path, and author of each unresolved review thread, read through `gh api graphql`).
  - Findings are review threads only. A plain comment, such as a provider's "Running" notice, is never a finding.
  - Every list is read to its last page.
  - It exits 2 when `gh` is missing or unauthenticated. It exits 3 on an API error or an incomplete response, and never prints a partial object, so a failed read cannot look like zero threads.
- **`pr-monitor`:**
  - Carries one chain or a set of independent PRs.
  - Publishes without a local test run. The `Review:` record at head is the gate evidence, and CI is the merge gate.
  - Requests every policy provider when the PR opens. The 20-minute fallback stays.
  - Waiting on a provider or CI is not a reason to return. Wait again in the same turn until every PR is merged or blocked.
  - Each round reads `bash scripts/pr-state`, or the policy file's command.
  - Loop step: "Fix what is real, with its siblings (toolbelt:receiving-code-review), and run only the tests that cover the fix."
  - Applies Decision 10's follow-up rule unless the policy forbids it.
  - Chain and merge-bottom-up mechanics stay, shorter.
- **`finishing-a-development-branch`:**
  - Step 1 keeps the exact-head and docs-only exceptions, and skips the test run when the caller is delivery or pr-monitor.
  - Then: the base branch, the menu (verbatim), and the four actions.
  - The PR body closes a ticket only on the workstream's last PR.
- **`using-git-worktrees`:**
  - Keeps Step 0, the policy paragraph, Step 1's native-tool rule and git fallback (verbatim), Step 2, and Step 3's report block (verbatim).
  - Drops the track paragraph.

**Proves:**
- `pr-state` against a stubbed `gh` on `PATH` prints the expected JSON for a PR with one failing check, one review on an old commit, and two unresolved threads.
- (guard) `pr-state` exits 2 with no `gh`.
- (guard) `pr-state` exits 3 and prints nothing when the stubbed thread query fails on its second page.
- Threads spread across two pages are all reported, and a plain "Running" comment is not.

**Verify:** `bash tests/toolbelt/test-pr-state.sh && bash tests/toolbelt/test-chain-rebase.sh && bash tests/toolbelt/test-word-counts.sh && scripts/lint-shell.sh skills/pr-monitor/scripts/pr-state`

### Task 6: testing skills, ux-gate, routing, quick-task

Closes: Decisions 8, 11, and 17; one UX fix round; the pipeline half of the word budget.

**Files:**
- Modify: `skills/test-driven-development/SKILL.md`, `writing-good-tests.md`
- Modify: `skills/verification-before-completion/SKILL.md`
- Rewrite: `skills/ux-gate/SKILL.md`, `matrix.md`
- Modify: `skills/agent-routing/SKILL.md`, `routing/claude.md`, `routing/codex.md`
- Modify: `skills/quick-task/SKILL.md`, `skills/using-toolbelt/SKILL.md`, `references/codex-tools.md`
- Delete: `skills/dispatching-parallel-agents/`
- Modify: `tests/toolbelt/test-word-counts.sh`, `test-load-routing.sh`, `test-doctrine.sh`

**Contract:**
- **TDD.**
  - The Iron Law and the rationalization table stay.
  - Decision 8's rule replaces the exceptions sentence: a plan's `Contract` may require test-first elsewhere, and any other exception belongs to your human partner.
  - `writing-good-tests` reduces the mutation check to "break the guard, watch the test fail, restore it."
- **verification-before-completion.**
  - Run the related-tests command as the project prints it, never widened.
  - One run at the end of the PR, with typecheck and lint, is the gate.
- **ux-gate.**
  - One fix round, which recaptures only the pathways the fix touched.
  - Remaining blockers go to your human partner, and the rest become Minor findings.
  - No smoke pass.
- **Routing.**
  - Decision 11's defaults.
  - `agent-routing/SKILL.md`: the roles table; reviewer independence worded against the implementer's harness; "the plan's `Risk` column raises effort and never changes the model."
  - The outage override is reduced to its trigger, four constraints, and its end.
- **using-toolbelt.**
  - Drop the orchestrating sentence and the parallel-agents pointer.
  - Add Decision 15's subagent line, with its exemption for required roles.
- **quick-task.** The mini-plan is one task in one boundary with `Risk` set, uses Task 3's fields, passes `plan-check`, and cites delivery.
- **Word counts.** `test-word-counts.sh` takes the new ceilings for this task's files and drops `dispatching-parallel-agents`.

**Proves:**
- `test-doctrine.sh` passes.
- `test-load-routing.sh` passes.
- `grep -c "Explore" skills/agent-routing/routing/claude.md` is 1.
- `bash skills/writing-plans/scripts/plan-check` passes on the quick-task mini-plan example.

**Verify:** `for t in tests/toolbelt/test-*.sh tests/codex/test-package-codex-plugin.sh; do bash "$t" || exit 1; done`

### Task 7: writing-skills absorbs writing-for-agents

Closes: Decision 16.

**Files:**
- Rewrite: `skills/writing-skills/SKILL.md`, `skills/writing-skills/testing-skills-with-subagents.md`
- Delete: `skills/writing-skills/anthropic-best-practices.md`, `persuasion-principles.md`, `examples/`, and all of `skills/writing-for-agents/`
- Modify: `tests/toolbelt/test-word-counts.sh`, `tests/toolbelt/test-doctrine.sh`

**Contract:**
- **Description.** It triggers on creating or editing a skill, or editing any agent-consumed document (`AGENTS.md`, `CLAUDE.md`, a dispatch prompt).
- **Body,** under 900 words:
  - When a skill is warranted, and splitting by trigger.
  - The description rules.
  - Structure: progressive disclosure one level deep, and scripts for fragile deterministic steps.
  - The prose rules from Decision 15.
  - Gates: two or three sentences each. Rationalization tables only where a brief rule measurably failed.
  - The handoff rule.
  - A link to Anthropic's skill authoring best practices, and the eight rules from it that toolbelt applies, one line each.
- **`testing-skills-with-subagents.md`,** under 500 words: baseline without the skill, write the minimal fix, re-run under pressure, close the loophole, re-test when the model changes.

**Proves:** `test-doctrine.sh` passes, and its rationalization-table allowance no longer lists deleted files.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh`

### Task 8: brainstorming, writing-specs, interactive-design, systematic-debugging

Closes: the word targets for these four directories.

**Files:**
- Rewrite: `skills/brainstorming/SKILL.md`, `visual-companion.md`
- Rewrite: `skills/writing-specs/SKILL.md`
- Rewrite: `skills/interactive-design/SKILL.md`, `iteration-mode.md`
- Rewrite: `skills/systematic-debugging/SKILL.md`, `root-cause-tracing.md`, `condition-based-waiting.md`
- Modify: `tests/toolbelt/test-word-counts.sh`

**Contract:**
- **Behavior does not change.** Every gate, handoff, script command, and user-facing message stays verbatim. The cut comes from restatement, recap sections, and explanations a current model does not need.
- **brainstorming.** `visual-companion.md` keeps the start and stop commands, the loop, the event format, and a CSS class list of one line per class.
- **interactive-design.** Replace §4 and §6's SDD citations with delivery.
- **Targets** are from Global Constraints.

**Proves:**
- `test-doctrine.sh` and `test-word-counts.sh` pass.
- `tests/brainstorm-server/` passes (`npm test` in that directory), because its commands are unchanged.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh && (cd tests/brainstorm-server && npm test)`

### Task 9: docs, manifests, release

Closes: Decision 18; every live document names only live skills; version 10.0.0.

**Files:**
- Modify: `docs/WORKFLOW.md`, `docs/AGENTS-SNIPPET.md`, `docs/ADOPTING-IN-A-PROJECT.md`, `docs/porting-to-a-new-harness.md`, `README.md`, `CLAUDE.md`
- Modify: `.codex-plugin/plugin.json` keywords, `RELEASE-NOTES.md`, and version files via `scripts/bump-version.sh 10.0.0`
- Modify: `tests/explicit-skill-requests/` prompts and runners (SDD becomes delivery)
- Delete: `tests/claude-code/test-subagent-driven-development.sh`, `test-subagent-driven-development-integration.sh`
- Delete: `docs/toolbelt/plans/*` and `docs/toolbelt/specs/*` except this plan
- Modify: `tests/toolbelt/test-word-counts.sh` (the 13,500 total)

**Contract:**
- `WORKFLOW.md` and `AGENTS-SNIPPET.md` describe the new pipeline in their current two-paragraph budget.
- `ADOPTING-IN-A-PROJECT.md` adds two items:
  - `pr-policy.md` may name a PR-state command and forbid follow-ups.
  - The worktree policy may set the concurrency limit.
- `porting-to-a-new-harness.md` is cut to the hook contract and the steps, under 800 words.
- `CLAUDE.md` gains two lines:
  - "One implementer carries a PR. A skill that adds a per-task gate needs a measured failure first."
  - "Tests check structure and scripts, not wording."
- `RELEASE-NOTES.md` gets a 10.0.0 entry with one line per decision.

**Proves:**
- The `git grep` in PR 2's verification row is clean.
- The word total is under 13,500.
- `scripts/bump-version.sh --check` reports 10.0.0.

**Verify:** `for t in tests/toolbelt/test-*.sh tests/codex/test-*.sh tests/hooks/test-session-start.sh; do bash "$t" || exit 1; done && scripts/bump-version.sh --check`

### Task 10: ux-capture false alarms

Closes: the capture tool's false alarms on covered links and screen-reader text.

**Files:**
- Modify: `skills/ux-gate/scripts/ux-capture.mjs`
- Modify: `tests/toolbelt/ux-capture-regressions.cjs`, `tests/toolbelt/test-ux-capture-regressions.sh`, and fixtures under `tests/toolbelt/fixtures/`

**Contract:**
- **Stretched links.** An overlap finding is suppressed when all of these hold:
  - The covering element is an ancestor-positioned link or button.
  - Its box fully contains the covered element.
  - The covered element is not interactive.

  The suppression is recorded in `mechanical.json` under `suppressed`, with the selector and the reason.
- **Screen-reader-only elements.** The overflow, overlap, and clipped-text checks skip an element that is visually hidden for screen readers at the width being captured: computed size of at most 1×1 px, with `overflow: hidden` and `clip` or `clip-path` set. Class names never decide it.

**Proves:**
- (guard) A stretched-link card over a non-interactive title produces no findings and one `suppressed` entry.
- (guard) A stretched-link card over an interactive control still produces the overlap finding.
- (guard) A `.sr-only` span inside a button produces no findings.
- (guard) A visibly clipped span that is not screen-reader-hidden still fires `clipped-text`.
- (guard) An `.sr-only` span that a media query makes visible at a wider width is checked normally at that width.
- The existing regression fixtures still produce their findings.

**Verify:** `bash tests/toolbelt/test-ux-capture-regressions.sh` with Playwright installed and no `SKIP` in the output, then `bash tests/toolbelt/test-ux-capture.sh`

## After release: fsmcrm

Run this as a quick-task in `~/projects/fsmcrm` once 10.0.0 is installed. Each item below is a doc edit there, and nothing in toolbelt changes for it. Nothing in fsmcrm calls the scripts or skills this plan removes.

1. **Plan template.** `.codex/commands/write-plan.md` asks for a tutorial for a "mechanical" low-effort implementer, with line references and per-task test-first. Delete it, or replace it with a pointer to toolbelt:writing-plans.
2. **Routing files.** In `.toolbelt/routing/claude.md` and `codex.md`:
   - Rename the roles to `implementer`, `planner`, `explorer`, `errand`, `monitor`, and `reviewer`.
   - Word the reviewer as "the other harness from the implementer's".
   - Drop "you are the orchestrator above all else".
   - Keep one "never the Explore agent" line.
   - Decide the effort values yourself; the table in the review notes compares fsmcrm's to toolbelt's.
3. **Smoke pass.** `AGENTS.md:9` and `.toolbelt/ux-policy.md:31,59` mention the task smoke pass. Reword them to "touched screens once at one width", or drop them.
4. **Task gates and re-review.** In `.toolbelt/pr-policy.md:24` and `docs/REVIEW-GUIDANCE.md:36`, change "task gate" to "end of the PR" and delete the "delta re-gates" sentences.
5. **Report file.** In `AGENTS.md:113`, `pr-policy.md:20,24`, and `REVIEW-GUIDANCE.md:36`, change "report file" to "report". The Subagent Delegation rule in `AGENTS.md` and `delegation-policy.md` (reports move by path, "never pasted into a message") needs one exception: the implementer's short reply comes back as text and delivery saves it. Bulky evidence still moves by path.
6. **Follow-ups.** `pr-policy.md:18,33` (five-round convergence, tickets to the parent agent) conflicts with the two-round follow-up list. Keep the policy, or adopt the follow-up list.
7. **Missing project rules.** Add a concurrency limit equal to the number of lanes in `worktree-policy.md`. Add the heavy-command lock and `--maxWorkers`, and "no app server", to `AGENTS.md`. Add the app-specific reviewer catches to `REVIEW-GUIDANCE.md`. Their evidence is in the FSMCRM audit triage files.
8. **`pr-policy.md` command.** Name `poll-pr-state.sh` as the PR-state command so pr-monitor uses it instead of the bundled script.
