# Toolbelt Release Notes

Toolbelt is a fork of [Superpowers](https://github.com/obra/superpowers). It diverged at upstream v6.1.1 (2026-07-02); every release up to and including that one is upstream's work, and those notes live at https://github.com/obra/superpowers.

## v10.2.0 (2026-10-24)

Specs and plans now say what the app already has, so work reuses it instead of building a second copy beside it.

- **Every plan task carries a `Reuses:` line.** It names the existing code the task uses or extends, the shared piece it creates, or why there is none. `plan-check` requires it, and a bare `none` fails. Add `Reuses:` lines to in-flight plans before delivery, or delivery will send them back to planning.
- **Every spec has a What already exists section.** At the level of screens and concepts, it says where the app already shows the information or makes the calculation, and what has to stay the same when it appears in more than one place.
- **A new `lookup` route takes narrow questions.** It answers by path, symbol, and one line, and stops at the first complete answer. Wide questions still go to `explorer`. A project routing file with no `lookup` line keeps working: lookups use its `explorer` route.
- **UX review compares against the matching screen.** When a plan or prototype ledger names a screen to match, ux-gate captures that screen beside the changed one and the reviewer reports differences in hierarchy, spacing, information order, and actions that nothing explains. The matching screen is a reference only, so a problem already on it never fails the gate.

## v10.1.0 (2026-10-20)

Cuts CI spent on tiny PRs and blind reruns.

- **A quick task may carry several small fixes.** Each fix is one task in the same mini-plan, and they ship together in one PR.
- **Plans fold tiny boundaries into a neighbor.** A boundary under about 100 changed lines joins a neighbor unless it needs its own release order, `Risk`, or revert.
- **Monitors read a failure before rerunning.** A failing check's log is read first, and a rerun happens only for a cause outside the PR.

## v10.0.0 (2026-10-17)

Rebuilds delivery around one strong implementer per PR with one independent review behind it, moves deterministic checks into scripts, and cuts `skills/` from 32,752 words to under 13,500.

- **One implementer per PR.** It receives every task brief at once, commits after each task, and stops only for a behavior, contract, or money decision the plan does not make. No per-task reviews or pause points.
- **One local review per PR, before publish.** The plan's `Risk` column sets its effort, and `Risk: none` skips it. Boundaries over 2,000 changed lines split the review across up to three reviewers. The PR's review providers are the second reviewer.
- **Parallelism is per PR.** Up to three implementers run on independent boundaries; a worktree policy may set a lower limit. Execution tracks, sub-worktrees, and integration tasks are gone.
- **Implementer reports come back as the reply.** Delivery saves each to `boundary-N-report.md`, and the ledger points at it.
- **Plans specify contracts, not code.** Tasks carry `Files`, `Contract`, `Proves`, and `Verify`; plans gain `## Risks` and a `Risk` column.
- **Plans catch what reviews kept catching:** the search for every list of a new union member, every other way into each invariant, and scripted rewrites run twice.
- **A finding is about a pattern.** Whoever fixes a finding fixes every sibling the same search finds, or lists each one left.
- **One testing rule, stated once** in test-driven-development: guards and bug fixes are test-first with the mutation check; everything else writes tests alongside.
- **Rebase once, at publish.** Delivery rebases before the review; the monitor owns rebasing after that.
- **A fresh monitor carries PRs to merge,** one per chain. After two provider rounds, low-severity findings that touch no data, security, or money may move to a `## Follow-ups` list, unless the PR policy forbids it.
- **Routing defaults:** high-effort implementer and reviewer, low-effort monitor (medium for money PRs), and a reviewer on a different harness from the implementer.
- **Sizing is advisory:** three to nine tasks and 1,000–4,000 changed lines per PR.
- **Scripts take the deterministic checks:** new `plan-check`, `pr-state`, and `dispatch-prompt`, and `review-package` path slices.
- **Tests check structure, not wording.** `test-doctrine.sh` checks links, script paths, skill names, all-caps emphasis, and filler phrases; the phrase-needle tests are deleted.
- **Prose follows current model guidance:** plain imperative sentences, no shouting outside gate blocks, and subagents only for large independent work.
- **Authoring guidance is one skill.** `writing-for-agents` merges into `writing-skills`, and the pasted best-practices page becomes a link and eight rules.
- **`dispatching-parallel-agents` is deleted.** Its one surviving rule lives in `using-toolbelt`.
- **Historical plans and specs are deleted** from `docs/toolbelt/`. Git keeps them.
- **Breaking:** `orchestrating`, `subagent-driven-development`, `dispatching-parallel-agents`, and `writing-for-agents` are removed. Delivery's scripts live under `skills/delivery/scripts/`.

## v9.0.0 (2026-10-14)

Cuts the repeated checking and orchestrator churn that made long deliveries slow and expensive.

- **Test what changed; CI runs the full suite.** Implementers, reviewers, and monitors run the tests related to the changed files plus incremental typecheck and lint. Publishing a PR no longer runs the full suite locally; merging locally without CI still does.
- **First-run notes replace seen-red fights.** Implementers note each new test's first failing run. Reviewers judge whether the test is good, and never send work back only because the note is missing.
- **Per-task review only for risky tasks.** Tasks touching money, auth, tenant scoping, migrations, or shared contracts carry `Review: per-task`; the rest are covered by the boundary's final review. One implementer may carry a whole boundary.
- **Append-only ledger at gates.** `subagent-driven-development/scripts/ledger-append` writes timestamped lines; orchestrating owns the list of allowed lines. No per-turn status writes.
- **Open questions don't stall the run.** Impactful questions go to your human partner, unblocked work continues, and anything blocking for a day is raised.
- **Same-file boundaries combine or stack** under one monitor; task size limits are higher. Plans hold decisions, contracts, and risks, not implementation code. UX gate gets one fix round. Sweeps never block merges.
- **Local-gate carry uses `git patch-id --verbatim`**, so whitespace changes no longer carry. Provider reviews run again on every new code head.
- **Breaking:** plans no longer carry an `## Agent Routing` section. Routing comes only from the routing text (or your human partner's direct instruction); ledger routes are audit records.

## v8.0.0 (2026-09-26)

Agent routing is plain English, one file per orchestrating harness, instead of JSON behind a resolver script.

- **Routing is text you edit.** A project writes `.toolbelt/routing/claude.md` and `.toolbelt/routing/codex.md` in its own words, including judgment calls like "low or medium depending on depth." A session-start hook injects the file for the running harness in an `<AGENT-ROUTING>` block, so a model never has to pick its own file. Bundled defaults live in `skills/agent-routing/routing/`.
- **One edit reaches every worktree.** The hook reads the file from the main checkout, not the current branch, so branches cut before a routing change no longer carry a stale copy.
- **Codex needs one setup step.** Codex no longer runs plugin hooks: run `scripts/setup-codex-routing` once per machine, then trust the hook when Codex next starts.
- **Breaking:** `.toolbelt/agents.json`, `skills/agent-routing/defaults.json`, and `resolve-agent` are removed. A plan's `## Agent Routing` section is now plain words that override the routing text for that plan.
- Bundled Claude agents add Sonnet 5.5 (low, medium, high, xhigh) and Haiku 5.5 (medium, high, xhigh).

## v7.13.0 (2026-09-23)

Rewrites the workflow prompts for Opus 5.5: less restatement, and decisions move into the plan so implementers only write code.

- **Plans own the decisions.** Each task carries a Contract, Decisions, a Proves list (behaviors the plan decided, plus `(guard)` items that must be seen failing), and a Verify mode: `test-first`, `test-with`, or `checks-only`. Tasks can be larger (up to about 15 files); split them when parts can run in parallel. Plans wait for approval unless the session says otherwise.
- **Implementers decide only code.** Names, signatures, error codes, data shapes, and file lists come from the plan; anything else is NEEDS_CONTEXT, and your human partner's answer becomes a ruling appended to the task brief. Implementers test the happy path and every behavior the contract implies, not only the Proves list, and run a mutation check.
- **Reviewers look past the plan.** Task and final reviewers check unhandled inputs and states, data mishandling, lifecycle gaps, and broken callers, tracing one hop out. Every finding needs a reachable scenario. `plan-mandated` and `plan-gap` findings go to your human partner, not the fix loop. The fix loop always re-reviews, for up to two rounds.
- **Shorter supporting skills.** TDD, writing-good-tests, requesting and receiving code review, and systematic-debugging are rewritten short; debugging's pressure tests, creation log, and defense-in-depth doc are removed.
- **Delivery, pr-monitor, finishing, and worktrees are restructured.** One ledger line per boundary, rebase records, and cleanup steps delivery can run itself. SDD refuses to implement on main or master, and a sandboxed worktree fallback branches in place.
- Bundled Codex agents route to GPT-6 models.

## v7.12.2 (2026-09-22)

- Claude routes and bundled agents move from Opus 5 to Opus 5.5 (`opus-5-5`, `claude-opus-5-5`).

## v7.12.1 (2026-09-20)

- Agents stop the long-running processes they started — dev servers, watchers, browsers — before their final report, or name what they left running and who stops it. The rule lives in verification-before-completion; interactive-design, ux-gate, and finishing-a-development-branch each stop what they start.

## v7.12.0 (2026-09-16)

Reduces what the orchestrator reads after an audited delivery whose root session carried 764K characters of unnecessary reports, reviews, and skills.

- **Reviews are files.** Task reviewers, re-reviewers, the final code reviewer, and the UX reviewer write their report to a review file and return a short verdict: counts, one line per Critical, Important, or ⚠️ item, and the path. The implementer fixes from that file; fix dispatches and re-reviews carry the path, never pasted findings.
- **The orchestrator reads return messages only.** Briefs, reports, reviews, diffs, logs, and capture evidence move between agents by path, and the orchestrator asks the owning agent for an excerpt rather than opening the file.
- **pr-monitor publishes and owns the PR through merge.** Delivery hands it the branch once the final review is clean; it runs finishing-a-development-branch, opens the PR, fixes findings inline in its own session, and lets the awaited providers' next round re-review, with no local review of fix rounds and no fixer dispatch. It returns on merge, a durable blocker, or a design decision requiring escalation, never on a round count. Project policies no longer decide who fixes.
- **New `orchestrating` skill.** The session agent's complete read list: the plan, delivery and branch-lifecycle.md, SDD and its prompt templates, parallel-tracks.md when needed, code-reviewer.md, agent-routing and its brief, using-git-worktrees, ledgers, and script-returned paths. Every other skill is a dispatch target, so the orchestrator never opens pr-monitor, ux-gate, finishing-a-development-branch, or project policies those agents read. Delivery and SDD enter through it.
- **`scripts/token-audit`.** Reads one Codex rollout or Claude Code transcript, follows its child sessions, and prints per-agent token totals, the largest tool outputs classified by what was read, wait and repeat-read counts, and the biggest context jumps with the call that caused each. No more hand-parsing session logs to find waste.
- **ux-gate runs in a dispatched gate runner.** The runner captures, dispatches the UX reviewer, and returns the verdict and review-file path; the orchestrator routes the file to the owning implementer and resumes the runner. Implementers author their own smoke matrix from the ux-gate reference and project policy instead of receiving one built by the orchestrator.
- **Implementers can rebut.** A finding that is wrong for the codebase gets a `REBUTTED:` row with the reasoning and evidence instead of a code change; the re-review judges whether the reasoning holds, and the orchestrator adjudicates rather than re-dispatching.

## v7.11.1 (2026-09-15)

- The no-polling rule in subagent-driven-development now applies between waits only: after a wait times out, the agent inspects the task once and decides whether to wait again or stop it.

## v7.11.0 (2026-09-15)

Cuts the usage cost of long-running sessions, measured across 115K Claude Code requests.

- **No polling.** Implementer prompts, the SDD orchestrator, delivery, and pr-monitor all say the same thing: wait with one blocking call, never poll, sleep-loop, tail logs, or run keep-alive commands. A subagent cannot end its turn while background work runs, and every extra turn re-sends its whole context.
- **Compaction injects a pointer.** The SessionStart hook injects the full using-toolbelt skill on startup and clear only; after a compaction it injects three lines, since the harness re-injects invoked skills itself.
- **pr-monitor defers to the project policy** on who fixes findings and how to wait. Without a policy it fixes inline and waits one bounded interval.
- **Routing has three layers, not five.** `agents.json` keeps `roles` and `reviewer_specialties`; the `harnesses` and `workflows` layers are retired and fail resolution with a message. Workflow-specific routes live in the plan.

## v7.10.0 (2026-09-07)

Shortens skill instructions and adds portable browser evidence capture for frontend verification.

- Removes repeated instructions, vague wording, unsupported claims, and project-specific examples.
- Limits UX model review to new flows, material interaction/layout/responsive changes, or explicit requests. Screenshot coverage scales with the change; task smoke checks need no model reviewer.
- Adds browser capture with keyboard and focus assertions, optional image-free steps, accessibility and font checks, and errors that block verification instead of passing silently.
- Keeps parallel tracks within one PR boundary, serializes primary-worktree operations, and preserves recovery records until delivery finishes.

## v7.9.0 (2026-09-01)

Rewrites the planning and delivery skills in plain language and changes the
rules they carry: plans ship work in parallel tracks, review closes without a
second pass when nothing downstream depends on it, and delivery can run
dependent pull requests as a chain.

- **Execution tracks are the default in plans.** `writing-plans` requires a
  track breakdown, and a task's Files block is closed at 8 files.
- **The plan template's RED step names one failure per test.** A guard counts
  as proven red only when it is shown failing against code that lacks the
  guard.
- **The fix loop re-reviews only when it must.** A task returns to the
  reviewer when its Produces block is non-empty or a finding was Critical;
  otherwise the orchestrator closes it against a fix-report table.
- **Delivery runs dependent boundaries as PR chains.** Each chain gets one
  `pr-monitor`, and ownership of a branch passes to the monitor once the
  branch is published.
- **`pr-monitor` owns a chain by four rules** — lowest layer first, fix in the
  owning layer with a layer-by-layer rebase, one topology writer, merge
  bottom-up — and stops waiting on a review provider after 20 minutes.
- **`using-git-worktrees` accepts a caller-named source ref** instead of always
  branching from the current head.
- **Plain-language rewrite with enforced word-count ceilings.** The planning,
  execution, and shipping skills were rewritten to one idea per sentence with
  restatements and rhetorical framing removed;
  `tests/toolbelt/test-word-counts.sh` now fails on any of those files that
  grows past its ceiling.

## v7.8.0 (2026-08-12)

Adds a second frontend-first path to brainstorming's offer, integrating the
claude-design-handoff plugin.

- **Frontend-first offer gains a Claude Design variant.** When the
  `design-fidelity-prep` skill is available (claude-design-handoff plugin),
  the offer names both paths: build the real frontend in-repo
  (interactive-design, unchanged) or design on the Claude Design canvas first,
  with the repo prepped by design-fidelity-prep and implementation re-entering
  through design-fidelity-implement. Checklist item 6, the terminal-state
  line, and After the Design carry the new conditional exit. Without that
  skill installed, brainstorming is unchanged.

## v7.4.1 (2026-08-05)

Constrains the task reviewer's evidence gathering. Production AGX logs showed
high-effort reviewers re-reading documents, opening other tasks' briefs and
reports, running `git blame`/`git log` archaeology, tracing untouched code
across the app, and re-running test suites — roughly 3× the implementation
time spent on review.

- **The task reviewer gets a closed evidence set.** Brief, report, review
  guidance, and diff file — each read once. Reads beyond those four must
  verify a specific suspected finding and be named in the report; git
  history, other tasks' artifacts, the plan/spec, and untouched code beyond
  one targeted look per finding are out of scope regardless of
  justification. At most one focused test run. Thoroughness is measured by
  findings per read, not reads.

## v7.4.0 (2026-08-01)

Recalibrates planning and dispatch prompts for near-parity implementers. The old split — a strong planner writing code for a weak implementer — produced plans up to 9,861 lines (72% code fences) of never-executed code that implementers copied with the authority of an approved document. The new split: the plan decides everything; the implementer writes the code.

- **Plans specify contracts, not implementations.** `writing-plans` gains a Plan Altitude section: complete code only for the data model (schema, migrations, shared types — once, in a `## Data Model` section at the top); signature stubs with error behavior for functions; exact method/path/shape/status for endpoints; one line per test (name — setup — assertion); `path:line` precedent for anything with one. The altitude test replaces "show the code": a step is specified when two capable implementers would produce behaviorally interchangeable code. Self-review, the cross-harness plan gate, and the plan reviewer prompt all police altitude. Verified by micro-test: 4/4 new-wording reps produced contract-shaped tasks; 2/2 old-wording controls reproduced the full-code failure.
- **The implementer prompt sheds low-trust guardrails.** The mandated mutate-and-revert ritual for negative tests becomes a principle with the evidence method left to the implementer; three separate ask/escalate blocks collapse into one with concrete triggers; file organization within the task's surface is the implementer's call, reported rather than halted on. The gate-is-a-separate-command rule leaves the standing prompt (it remains in `subagent-driven-development` and as a `writing-plans` gotcha class for the plans that need it).
- **Discovered out-of-scope bugs get an explicit policy.** Fix inline when trivial and tightly coupled to the change; otherwise report for the controller to plan. Never expand the diff chasing one.
- **Reviewers read what judgment needs.** The task reviewer's diff-only mandate (with its carve-outs) becomes one principle: start from the diff, read further only where a judgment needs it, name what you checked. The whole-branch reviewer drops its twenty-question checklist battery and DO/DON'T list — dimensions plus calibration carry the review. The anti-thrash guards stay: reviewers still don't re-run suites to confirm reports, and implementers still never arrange their own review.

## v7.3.1 (2026-07-30)

Fixes agent routing when Toolbelt is installed as a plugin rather than checked
out inside the consuming project.

- **The routing resolver is anchored to its installed skill directory.**
  `agent-routing` now invokes `resolve-agent` from the absolute directory that
  contains its loaded `SKILL.md`, instead of treating `scripts/resolve-agent`
  as relative to the consuming project's working directory. `using-toolbelt`
  explicitly loads the routing skill before dispatch, while `writing-plans`
  and `writing-specs` defer to that single path contract instead of publishing
  duplicate project-relative commands.

## v7.3.0 (2026-07-28)

Leaner planning guidance and updated default agent routes.

- **Brainstorming drops two redundant mandates.** The one-question-per-message and repeated YAGNI rules are gone, leaving the surrounding guidance to scale discovery and design to the work.
- **Plan review is explicitly cross-family.** A plan written by Claude must be reviewed by GPT, and vice versa, rather than relying on model-identity independence alone.
- **Default routes reflect the daily workflow.** Claude Opus 5 now leads implementation, exploration, planning, errands, and monitoring, while Codex GPT-5.6 Sol leads independent review; native dispatch and in-context bounded reads are preferred where available.

## v7.2.0 (2026-07-26)

Six guardrails closing gaps the same parallel-lane run exposed after v7.1.0 shipped.

- **A gate is a separate command.** Toolbelt mandates a project's quiet-run wrapper for suite output but never said what it costs: a buffered wrapper releases nothing until the command exits, so any check reading that command's own output confirms the precondition only after every write has landed. `subagent-driven-development` and the implementer prompt now state that a check deciding whether something runs is its own command, run to completion first, and `writing-plans` carries the timing variant of "checks that can't fail."
- **Deletions account for the coverage they remove.** Tests for behaviour a deletion keeps share files, blocks, and fixtures with tests for behaviour it removes, so a change correct about code is silently wrong about coverage — the compiler is quiet, the suite is green, and the assertions are gone. A new gotcha class requires the coverage-delta inventory and relocation proved green before the delete lands; the task reviewer checks for it.
- **Orchestrator returns carry a question.** The rule against progress check-ins covered only a human partner. It now covers a dispatched orchestrator returning to its dispatcher: return a decision you cannot make, a completed handoff, or a durable block.
- **Completion notifications are not terminality.** Background agents notify whenever they momentarily hold no live children, and one task may notify several times. `delivery` reads terminality from the monitor's returned merge state and the PR itself.
- **Provider staleness is a named condition.** `pr-monitor` keeps a consecutive-miss count per provider and records a provider silent across two requested heads in the PR body *before* merging, leaving the policy file to decide whether it blocks. A provider that never recovers withdraws its independent judgement from every head after the first while all the merge conditions still read clean.
- **The documented SDD workspace path matches the one the script creates** (`<plan-basename>-<digest>`).

## v7.1.0 (2026-07-26)

A comparison against upstream Superpowers v6.2.0, plus findings from an overnight run of eight PRs across five parallel worktree lanes. The theme is catching problems before implementation rather than improvising around them mid-task.

### Planning

- **`writing-plans` explores before it drafts.** It went from scope check straight to file structure, mapping files and drawing task boundaries without reading the code those tasks would touch. It now fans out explorers per surface first, hunts a named taxonomy of gotchas — assertions that can never pass, checks that can't fail, tooling traps, ordering prerequisites, shared contracts, environment drift — and requires each one leave the pass either resolved in the plan or named with an instruction to escalate. A gotcha that is neither is a plan defect, alongside the other placeholder failures. Findings land per-task and plan-wide, and the plan reviewer may fan out its own explorers rather than reading the plan as a document.
- **Plans get a review gate.** Required, mirroring the one `writing-specs` already had, resolved through a new `plan` reviewer specialty. Note that independence is enforced on model identity, not family: configure the `plan` specialty to a different family than `planner` if you want cross-family review.

### Subagent-driven development

- **The fix loop is bounded.** Three rounds per task: rounds 1-2 resume the original implementer, round 3 dispatches a fresh one. At the cap a breaker trips — adjudicate each open finding, park it with a ruling in the ledger, or stop on load-bearing ones. Previously "repeat until approved," with no exit. Adjudicating before the cap is forbidden; it is pre-judging with a different name.
- **Re-reviews are scoped.** A new template verdicts each finding ADDRESSED or NOT ADDRESSED, confines new-breakage hunting to the fix diff, and routes out-of-scope observations to the ledger where they cannot extend the loop.
- **Workspaces are scoped per plan.** A flat `.toolbelt/sdd/` meant two plans overwrote each other's `task-N` briefs and misread each other's ledgers. Directories are now the plan basename plus a digest of its repo-relative path, so same-named plans in different directories stay separate.
- **Negative assertions carry evidence they can fail.** For any test asserting an absence, a guard, or a negative, the implementer reports its TDD RED or a recorded mutate-and-revert; the reviewer treats a missing demonstration as a finding. Tests that pass while proving nothing were the dominant defect class across the observed run.

### Delivery and integration

- **A PR ends in a named owner.** `finishing-a-development-branch` creates the PR and hands it to `pr-monitor`, or returns it to a caller that already owns monitoring. "PR is open" is not a terminal state.
- **Monitors escalate instead of overruling reviewers.** A monitor that suspects a finding is invalid takes it to the orchestrator or a high-effort reviewer with code evidence. Complying with a wrong finding and rebutting a right one are both real failures, and neither is a low-effort judgement.
- **Squash merges are never judged from commit ancestry**, which shows every branch commit as unmerged.
- **Concurrent slices that edit the same files are one PR**, however cleanly the outcomes divide. Sequential slices may revisit a file once the first has merged.
- **A dead-looking agent that owns external state gets that state checked** before a second owner is created.

### Testing and configuration

- **`testing-anti-patterns.md` became `writing-good-tests.md`** — shorter, and adds name-the-break, mirror assertions, change detectors, behavior-not-text, the rule that an absence assertion must exclude its own evidence, and a mutation check.
- **New optional `.toolbelt/worktree-policy.md`** for port ranges, sidecar containers, per-worktree data, and teardown, read by `using-git-worktrees` before it creates anything. Parallel lanes that each grab the default database, API, and web ports collide in ways that read as code bugs.
- **Bundled reviewer specialties now resolve.** They were only ever consulted in project config, so the bundled `code`, `spec`, and `ux` routes had no effect on `--reviewer-specialty` lookups. Precedence is project specialty, project role, bundled specialty, bundled role.

## v7.0.0 (2026-07-25)

The first Toolbelt release. Everything since the fork point, in one version — the
major bump marks the break, not a single change within it. Installs are not
compatible with the `superpowers`/`workstack-` names; see the migration table in
[docs/ADOPTING-IN-A-PROJECT.md](docs/ADOPTING-IN-A-PROJECT.md).

### Identity

- **Renamed the framework to Toolbelt.** Package, both plugin manifests, both marketplace manifests, the session-start hook, and every skill that named the framework. `using-superpowers` became `using-toolbelt`, and the bootstrap it injects now says "You have a toolbelt." The `workstack-*` skills lost their prefix — `workstack-delivery` is `delivery`, `workstack-quick-task` is `quick-task`, and so on — and `tests/workstack/` became `tests/toolbelt/`.
- **Rewrote CLAUDE.md and README for this fork.** CLAUDE.md was entirely upstream-contribution guidance — rejection rates, PR templates, which branch to target — all of it false here and all of it loaded into every session before anything else. It now covers how skills are structured, what must not be broken, the no-project-assumptions constraint, and the acceptance test. The `.github` issue and PR templates and `FUNDING.yml` are gone.
- **Dropped the telemetry beacon.** The brainstorming visual companion loaded its logo from `primeradiant.com` with the version string attached, which upstream documents as a usage beacon. A renamed fork should not be reporting Superpowers versions to anyone. Branding is local text now, the env-var opt-outs went with it, and the branding test asserts the inverse of what it used to: no remote asset references in the served HTML at all.
- **Removed the upstream-tracking apparatus.** The divergence allowlist, its checker script, `UPSTREAM-UPDATES.md`, and the tests that enforced them existed to keep a merge path open. There is no upstream remote and no plan to merge back.

### Harnesses

- **Dropped every harness except Claude Code and Codex.** Cursor, Kimi, OpenCode, Pi, and Antigravity lose their plugin manifests, install docs, tool-mapping references, hook configs, and test suites; the dead Gemini extension manifest and `GEMINI.md` go with them, and the Copilot CLI branch is out of the session-start hook. That is roughly 2,000 lines of support for platforms this fork does not use. `docs/porting-to-a-new-harness.md` still describes the hook contract if one gets added back.

### Delivery

- **A delivery pipeline for approved plans.** `delivery` takes an approved plan, selects one shippable slice, runs it through subagent-driven development, and hands the PR to `pr-monitor`, which owns it through CI, review providers, fix loops, and merge. `quick-task` is the small-change entry point: decision-complete work, one PR, a scratch mini-plan, no product shaping. `ux-gate` verifies changed user-visible surfaces by scripted capture rather than interactive browsing. `finishing-a-development-branch` gained a declared completion route so the pipeline can hand off to it without ambiguity.
- **Consolidated the pipeline down to its entry points.** The first pass shipped seven public skills — `workstack-start`, `-resume`, `-slice-gate`, `-spec-review`, and their reference docs. Those seams were plan bookkeeping the plan itself already carried, so they were folded into `delivery` and `quick-task`, taking about 680 lines with them.
- **PR monitoring can run in the background.** The orchestrator may start the next task while a monitor runs, when the work is independent and at most one PR is in flight. The monitor's return is always processed, and a merged PR rebases in-flight lanes before their final review.
- **Verification and UX capture are proportional to change risk.** A verification-scope ladder — focused tests while iterating, affected package suites at the task gate, one workspace run at the final gate, CI owns post-push regression — replaces running the full suite at every step. UX capture matrices are enumerated from the diff and the acceptance criteria instead of imposed wholesale by the plan.

### Skills

- **Subagents are routed by logical role from a session-start brief.** Two routing systems had been running side by side: core skills hard-coded "Subagent (general-purpose)" in six places while the delivery skills resolved logical roles through `resolve-agent`. Core skills now name a role, and `using-toolbelt` loads the routing brief before the first dispatch. `resolve-agent --brief` resolves every role in one call — harness, model, effort, per-role instructions, reviewer specialties. Reviewer independence would normally break under a single session-start call, since the author's model is not knowable then, so the brief emits a reviewer per author model and the rule stays fail-closed. The `operator` role is renamed `errand` and bounded to side work: it never edits repository files.
- **Nothing under `skills/` assumes a specific project.** The plugin installs globally, so hard-coded repo paths resolved nowhere in a consuming project. Scripts are referenced relative to their own skill directory, Linear is generalized to "the issue tracker", and per-project behavior comes from optional files in the consuming repo — `.toolbelt/agents.json`, `.toolbelt/pr-policy.md`, `docs/REVIEW-GUIDANCE.md`, `AGENTS.md`. `.toolbelt/` is also where scratch lands: `sdd/`, `quick/`, `brainstorm/`.
- **Split `writing-specs` out of `brainstorming` and removed `executing-plans`.** Spec writing and its document gate were a distinct entry condition buried inside brainstorming; they get their own skill and their own description. `executing-plans` overlapped with the delivery path and is gone.
- **Condensed the core skills.** `test-driven-development`, `systematic-debugging`, `receiving-code-review`, `dispatching-parallel-agents`, and `writing-skills` were written for models that needed the process restated three times. Roughly 1,200 lines of restatement removed; the forceful blocks — hard gates, entry gates, Red Flags tables, rationalization lists — are preserved verbatim, because that phrasing is what survives compaction. `subagent-driven-development`, `brainstorming`, `requesting-code-review`, `writing-plans`, and `verification-before-completion` got the same treatment.
