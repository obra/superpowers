# Reuse-First Planning Implementation Plan

> Execute with toolbelt:delivery.

**Goal:** Specs and plans find what the app already has (shared components, helpers, services, middleware, and screens that show the same information) and tell the implementer to use it. Features stop rebuilding the same thing in several places, and similar screens stop drifting apart.

**Architecture:** The reuse decision is made once: in the spec at the level of screens and concepts, and in the plan as paths and symbols. It reaches the implementer through a required per-task `Reuses:` field. Searching is delegated, through a new `lookup` route for narrow questions and the existing `explorer` route for wide ones, so the planner's own context stays small. The implementer prompt, code reviewer, interactive-design, and ux-gate each check that decision instead of making their own. In a second PR, a user-only `configure-routing` skill writes a project's routing file with the exact job names the skills use.

**Background (for the implementer):** The lean rewrite (`4c7edbc`) cut the plan fields that used to say "this already exists, use it": compare `git show 96f72fb:skills/writing-plans/SKILL.md` with the current file. Superpowers (`../superpowers/skills/test-driven-development/SKILL.md`) shows the `<Good>`/`<Bad>` example style borrowed here. Your human partner's framing: a plan task is like an exam handed to the implementer. It states the problem and what done means (Contract, Proves), what may and may not be touched (Files, constraints, Risk), how it connects to other tasks (Interfaces), and the existing code they may use (`Reuses:`). How to build it is the implementer's choice.

## Global Constraints

- Nothing under `skills/` names a specific project, path, or component from a consuming repository. Examples use generic paths such as `src/components/line-items-table.tsx`.
- Write plain instructions that say what to look for, when, and what to do. No slogans: instead of "extend the owner, never fork it", write "use or extend the shared component instead of building a second one beside it".
- Plans and specs carry contracts, never code bodies. New wording must not invite signature stubs, `path:line` references, or step-by-step tutorials.
- Keep "your human partner" wording. Each skill that hands off still names exactly one next skill and says "Do NOT invoke any other skill"; a user-only skill such as `configure-routing` ends without a handoff.
- Scripts are referenced relative to their own skill directory.
- Tests check structure and scripts, never wording.
- Word ceilings in `tests/toolbelt/test-word-counts.sh` may rise to fit added meaning: set each touched ceiling to the new count plus about 5%, and raise the whole-tree total to match.
- A shared piece is justified by a named second user: an existing screen or caller, or one planned in the same spec or plan. A planner who expects a second user but cannot name one says so in `Reuses:`, and your human partner decides at plan approval.

## Known Gotchas

- Both harnesses run an installed copy, not this checkout (`CLAUDE.md` "Verifying a change"). Reinstall before any live check.
- `plan-check` runs in delivery (`skills/delivery/SKILL.md` step 1) and quick-task. Requiring `**Reuses:**` breaks every plan the test suite expects to pass that lacks it: the `tests/toolbelt/fixtures/plan-check/*.md` fixtures, `skills/quick-task/mini-plan-example.md`, the example task in `skills/writing-plans/SKILL.md`, and `docs/toolbelt/plans/2026-10-15-lean-delivery.md`, which `tests/toolbelt/test-plan-check.sh` lists as must-pass.
- agent-routing tells an agent to stop when the routing text names no route for a role it needs. Projects whose routing files predate `lookup` would stop at the first lookup unless `lookup` falls back (Task 6).
- `test-doctrine.sh` checks links, script paths, skill names, all-caps emphasis, and filler phrases; new text must pass it.
- writing-skills says frontmatter is `name` and `description` only; a user-only skill needs a stated exception (Task 7).

## Risks

- **Who else reads what this changes?** `delivery/scripts/task-brief` copies each task's full text, so `Reuses:` and `Interfaces:` reach the implementer with no script change. `plan-check` is read by delivery and quick-task. The bundled routing files are read by `hooks/session-start` and `test-load-routing.sh`. Consuming projects' routing files are read by agent-routing.
- **What does the previous release still read?** Plans written before this release lack `Reuses:` and fail `plan-check` at delivery. That failure already sends the plan back to planning; the release note tells your human partner to add `Reuses:` lines to in-flight plans. Project routing files without a `lookup` line keep working through the fallback.
- **Other ways in:** quick-task mini-plans pass through the same `plan-check`. interactive-design's frontend-first path builds UI before any plan exists, so Task 5 covers it. Writing-specs runs without writing-plans in context, so Task 3 restates the search rule.
- **Workstream claims:** none known; `main` is clean at `281d8b3`.

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Risk | Independent verification |
|---|---|---|---|---|---|
| 1 | Specs and plans record reuse decisions, delivery and review enforce them, and search is delegated by size; release 10.2.0 | 1–6, 8 | none | high | `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-plan-check.sh && bash tests/toolbelt/test-word-counts.sh && bash tests/toolbelt/test-load-routing.sh && bash tests/toolbelt/test-ux-capture.sh` |
| 2 | Your human partner sets routing by describing it, through a user-only skill; release 10.3.0 | 7 | 1 | medium | `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh && bash tests/toolbelt/test-claude-agent-definitions.sh` |

### Task 1: writing-plans finds what exists and records it per task

**Files:** `skills/writing-plans/SKILL.md`, `tests/toolbelt/test-word-counts.sh`

**Reuses:** the current `## Explore first`, `## Task fields`, `## Example task`, and `## Review` sections of `skills/writing-plans/SKILL.md`, and the `<Good>`/`<Bad>` convention from Superpowers' `test-driven-development`. Restore the purpose of the old `Decisions:` and `Interfaces:` fields (`96f72fb`), not their form.

**Contract:**

`## Explore first` is rewritten to say, in plain language:
- For each thing the work will show, calculate, save, or send, find out whether the app already does it: a shared component showing the same information on another screen, a service or helper that already makes the decision or does the math, middleware already on the request path. Search by domain words, screen labels, and the calculation, not only by the name you planned to give the new thing.
- Delegate the search through agent-routing whenever the answer is not in a file you already know. A narrow question goes to `lookup`. A wide question goes to `explorer`: map a system, find competing implementations, list affected callers. Keep searching as new questions come up while the plan takes shape; there is no single search step.
- A `lookup` brief asks for path, symbol, and one line on what it does, and ends: "Stop as soon as you have found the answer." An `explorer` brief ends: "What would a competent implementer, working only from a written plan, get wrong here?"
- The first time the planner delegates, it tells your human partner in one line which routes it is using and that they can name a different model. It does not wait for a reply.
- Exploring is done when every task's `Reuses:` can be filled in without guessing.

`## Task fields` gains, between Contract and Proves:
- **Reuses:** existing code this task uses or extends instead of writing its own, as path, symbol, and a few words on what it does; or the shared piece this task creates and its users in this plan; or `none — <why>`, naming the search that found nothing. For anything a user sees, it also names the screen to match, what must look the same, what legitimately differs, and which side owns each difference.
- **Interfaces:** only on a task whose output another task in the plan uses: what it consumes and produces, by name and shape.

A new `## Shared pieces` section, after `## Detail`, says:
- When nothing exists yet but the information will appear on more than one screen, plan it as a shared piece and name the other screens in `Reuses:`. If you expect more screens but cannot name one, say so, and your human partner decides at plan approval.
- A shared piece owns what must look and behave the same. Each screen passes in what differs, as data, columns, or callbacks. The shared piece never checks which screen or record type is calling it. Business rules stay with the screen's own save path or the backend.
- The planner may propose a new shared component, helper, or service when it makes the app look, perform, or hold up better, and says why.
- Moving existing screens onto a new shared piece is planned in the same plan, split into PRs by the normal size rule. Deferring the move is your human partner's decision at plan approval, never a silent Follow-up.
- A `<Good>`/`<Bad>` pair for `Reuses:`, each with a one-line reason. Good names a generic line-items component by path and symbol, what it owns, what this screen passes in, the screen to match, and the shared line-total helper. Bad says "use existing components where possible", which leaves the implementer to find the component and make the decision the plan should have made.
- A `<Good>`/`<Bad>` pair for a shared piece. Good: the estimate screen passes its extra Frequency and Discount columns into the shared table. Bad: the shared table takes a `kind` prop and branches on `kind === "estimate"` inside, so every new record type edits the shared table.

`## Detail` gains: "The plan holds the decisions the implementer cannot make alone. If a plan is longer than the code it describes, it contains code; replace the bodies with contracts."

`## Example task` gains a `**Reuses:**` line. `## Review` step 3's reviewer brief adds: challenge each `Reuses:` and every `none`, and look for anything the plan rebuilds that already exists. The ceiling for this file rises per Global Constraints.

**Proves:**
- The skill names `lookup` and `explorer` and says which question goes to which.
- The example task passes the updated `plan-check`.
- No line in the skill names a consuming project's path or component.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh`

### Task 2: plan-check requires Reuses

**Files:** `skills/writing-plans/scripts/plan-check`, `tests/toolbelt/test-plan-check.sh`, `tests/toolbelt/fixtures/plan-check/*.md`, `skills/quick-task/mini-plan-example.md`, `tests/toolbelt/test-word-counts.sh`

**Reuses:** the required-field loop in `plan-check`'s `END` block and the fixture-per-case pattern in `tests/toolbelt/test-plan-check.sh`.

**Contract:** `plan-check` reports `Task N has no **Reuses:**` for a task without the field, and `Task N: Reuses is a bare "none"; say why` when the field's value is `none` with nothing after it. `none — <text>` passes. Existing fixtures gain a `Reuses:` line so each still fails only for its own reason. Two new fixtures cover a missing `Reuses:` and a bare `none`. The quick-task example gains `**Reuses:** none — copy-only change; no component involved`. In the test's must-pass list, `docs/toolbelt/plans/2026-10-15-lean-delivery.md` is replaced by this plan, `docs/toolbelt/plans/2026-10-24-reuse-first-planning.md`; the historical plan is left unedited. The header comment's list of checks names the new ones.

**Proves:**
- (guard) A task without `**Reuses:**` fails with the named error.
- (guard) `**Reuses:** none` fails; `**Reuses:** none — searched for X` passes.
- `valid.md`, `mini-plan-example.md`, and this plan pass.

**Verify:** `bash tests/toolbelt/test-plan-check.sh`

### Task 3: writing-specs names what already exists

**Files:** `skills/writing-specs/SKILL.md`, `tests/toolbelt/test-word-counts.sh`

**Reuses:** the current `## 2. Write the spec` and `## 3. Review` sections. The reviewer question comes from Superpowers' `brainstorming/builder-check-prompt.md`, folded into the existing spec reviewer rather than a new dispatch.

**Contract:** "Follow existing patterns" is replaced by a required **What already exists** section in every spec. For each piece of information the feature shows and each calculation or decision it makes, the section names where the app already shows or does it (by screen), the shared piece that owns it, or that none exists. When the same thing will appear in more than one place, it says whether it is shared from the start, what must stay the same everywhere, and what each place may do differently. It names screens and concepts, not files; paths and symbols belong to the plan. The skill restates the search rule itself, since writing-plans is not loaded yet: delegate searches through agent-routing, narrow questions to `lookup` (stop at the first complete answer) and wide ones to `explorer`, on direct entry and when arriving from brainstorming, with the same one-line, non-blocking notice to your human partner on the first delegation. The spec reviewer's brief adds: "Where would you have to guess, and what would you build that probably already exists?"

**Proves:**
- The skill requires the section and states that it names screens and concepts, not files.
- The skill carries the `lookup`/`explorer` rule and the first-delegation notice.
- The reviewer brief includes the already-exists question.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh`

### Task 4: implementer and code reviewer hold the reuse decision

**Files:** `skills/delivery/implementer-prompt.md`, `skills/requesting-code-review/code-reviewer.md`, `tests/toolbelt/test-word-counts.sh`

**Reuses:** the implementer prompt's `## Work` and `## Fix dispatches` sections, and the code reviewer's `## Look for` list, `## Output` section, and `plan-gap` label.

**Contract:**

Implementer prompt:
- A brief's `Reuses:` is a decision. If the named piece does not fit, or a shared piece inside this PR's outcome is clearly better, switch to it or create it, and report the change under Drift with the search that found it.
- Before writing a component, helper, service, or calculation the brief does not mention, search for an existing one.
- The sentence "Stop with `NEEDS_DECISION` only for a behavior, contract, or money decision the plan does not make." becomes: stop with `NEEDS_DECISION` for a behavior, contract, or money decision the plan does not make, or when using or creating the shared piece would change a screen or caller outside this PR's outcome.
- In `## Fix dispatches`, siblings inside this PR's outcome are fixed; siblings outside it are listed with their location, never fixed by widening the PR.

Code reviewer:
- The bullet "Reuse of an existing owner." is replaced by one bullet: check the diff against each task's `Reuses:`; where the diff adds a component, helper, service, or calculation, search the domain words and screen labels for an existing one; a new shared piece must not branch on which caller is using it.
- `## Output` gains one rule: a new copy of an existing shared piece is Important. Label it `plan-gap` only when the plan's `Reuses:` was silent or wrong about it.

**Proves:**
- The implementer prompt states the outcome-bounded freedom and the widened stop sentence.
- The `## Look for` list has the same number of bullets as before.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh`

### Task 5: interactive-design and ux-gate compare against the matching screen

**Files:** `skills/interactive-design/SKILL.md`, `skills/ux-gate/SKILL.md`, `skills/ux-gate/matrix.md`, `tests/toolbelt/test-word-counts.sh`

**Reuses:** interactive-design's `## 1. Setup` and `## 7. The ledger`; ux-gate's `## 1. Coverage`, the Pass 2 text in `## 3. Review`, and matrix.md's pathway and step fields. matrix.md's `referenceScreens` is not used, because it captures whole routes at the first viewport and cannot open a panel.

**Contract:**
- interactive-design, before the first edit: find, delegating the search when needed, the existing screens that show the same information and the shared pieces they use. Record in the ledger header the screen each surface matches and any intended difference. Add "matches <screen> in hierarchy, spacing, information order, and actions" to the Acceptance criteria.
- ux-gate: when the plan's `Reuses:` or the prototype ledger names a screen to match, the matrix captures it as its own pathway, with whatever steps reach the matching state (for example, opening the slide-out panel), at the same viewports and themes as the changed surface. The reviewer receives it beside the changed surface. Pass 2 adds: judge the changed surface against that screen and report unexplained differences in hierarchy, spacing, information order, and actions.
- matrix.md documents that a matching screen is captured as a pathway and how to mark it as a comparison (a naming convention or an existing field; no capture-script change). ux-gate tells the gate runner that the matching pathway is unchanged code: its stills are references and its mechanical results are ignored, so a pre-existing problem on that screen never fails the gate for the changed one.

**Proves:**
- ux-gate's Coverage step names the matching-screen pathway and where it comes from (plan or ledger).
- interactive-design's ledger header records the matched screen.
- `test-ux-capture.sh` passes unchanged.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh && bash tests/toolbelt/test-ux-capture.sh`

### Task 6: a `lookup` route

**Files:** `skills/agent-routing/SKILL.md`, `skills/agent-routing/routing/claude.md`, `skills/agent-routing/routing/codex.md`, `tests/toolbelt/test-load-routing.sh` (only if it asserts the role list), `tests/toolbelt/test-word-counts.sh`

**Reuses:** the `## Roles` table in `skills/agent-routing/SKILL.md` and the one-line-per-job format of the bundled routing files.

**Search pasted for every list of roles:** `git grep -nE '\b(implementer|planner|explorer|errand|monitor|reviewer)\b' -- skills hooks tests | grep -iE 'role|route'`. Hits to update: the Roles table and both bundled routing files. Add any further hit your own run finds.

**Contract:**
- The Roles table gains `lookup`: "Narrow, specific codebase or web questions, answered by path, symbol, and one line. Read-only; stops at the first complete answer." `explorer` becomes: "Read-only mapping of a system, competing implementations, or affected callers."
- Both bundled routing files gain, in their existing line format: `lookup (narrow questions; stops at the first answer): haiku 5-5 medium. If unavailable, gpt 6 luna medium.`
- agent-routing's no-route rule gains one exception: when the routing text names no `lookup` route, use its `explorer` route.

**Proves:**
- Both bundled routing files carry the `lookup` line.
- A routing text with no `lookup` line resolves lookups to its `explorer` route.
- `test-load-routing.sh` passes.

**Verify:** `bash tests/toolbelt/test-load-routing.sh && bash tests/toolbelt/test-word-counts.sh`

### Task 7: user-only configure-routing skill

**Files:** `skills/configure-routing/SKILL.md`, `skills/configure-routing/agents/openai.yaml`, `skills/agent-routing/SKILL.md` (the Setup section points to it), `skills/writing-skills/SKILL.md` (frontmatter exception), `tests/toolbelt/test-word-counts.sh`, `RELEASE-NOTES.md`, the version files `.version-bump.json` lists

**Reuses:** `skills/ux-gate/agents/openai.yaml` for the openai.yaml shape; the bundled `routing/*.md` files as the template the skill writes from; the precedence and setup rules already in `skills/agent-routing/SKILL.md`. Codex's user-only setting is documented at `~/.codex/skills/.system/skill-creator/references/openai_yaml.md`.

**Contract:**
- `configure-routing` runs only when your human partner invokes it by name: frontmatter `disable-model-invocation: true`, and `policy: allow_implicit_invocation: false` in its `agents/openai.yaml`. Its `description` says what it does for a person reading a command list: "Write or update this project's agent routing file from a plain-language description." No other skill names it as a next skill.
- writing-skills' frontmatter rule gains one exception: a skill only your human partner starts may add `disable-model-invocation: true`.
- Your human partner describes the routing they want in their own words. The skill writes `.toolbelt/routing/claude.md` and/or `.toolbelt/routing/codex.md` in the project's main checkout. Each file has one line per job, using exactly the job names in agent-routing's Roles table, each with model, effort, and a fallback, plus any free-text detail they give. A job they leave out keeps the bundled default's line, and the skill says which.
- It shows the full new file before writing and writes only after they confirm. It reminds them that a new session picks up the file, and that Codex needs `scripts/setup-codex-routing` once per machine.
- A 10.3.0 `RELEASE-NOTES.md` entry announces `configure-routing`, and every file `.version-bump.json` lists reads 10.3.0.

**Proves:**
- (guard) The frontmatter carries `disable-model-invocation: true` and the openai.yaml carries `allow_implicit_invocation: false`.
- The skill's job-name list matches agent-routing's Roles table.

**Verify:** `bash tests/toolbelt/test-doctrine.sh && bash tests/toolbelt/test-word-counts.sh && bash tests/toolbelt/test-claude-agent-definitions.sh`

### Task 8: release 10.2.0

**Files:** `RELEASE-NOTES.md`, the version files `.version-bump.json` lists

**Reuses:** the 10.1.0 entry in `RELEASE-NOTES.md` and the version-bump convention of commit `3ded555`.

**Contract:** A 10.2.0 entry covers: the required `Reuses:` field (in-flight plans need it before delivery), the spec's What already exists section, the `lookup` route and its fallback to `explorer`, and matching-screen comparison in ux-gate. Every file `.version-bump.json` lists reads 10.2.0. This task ships in PR 1 so the breaking `plan-check` change never sits on `main` under the old version.

**Proves:**
- Every file `.version-bump.json` lists reads 10.2.0.

**Verify:** `bash tests/toolbelt/test-doctrine.sh`

## Not in this plan

Which other skills should become user-only commands. The quorum's candidates for your human partner to decide: `finishing-a-development-branch` (after separating the publish step pr-monitor needs) and `writing-skills` in toolbelt; `docs-prune`, `cycle-planning`, `research-crm-feature`, and `ui-review-screenshots` in FSMCRM. Convert none until `configure-routing` proves user-only skills work in both harnesses.

## After merge (your human partner)

Reinstall in both harnesses per `CLAUDE.md`, then in a fresh session confirm:
- `configure-routing` does not trigger on its own and runs when invoked by name, in Claude Code and in Codex.
- The "react todo list" acceptance test still triggers brainstorming.
- A planning session on a feature showing information the app already shows produces a spec "What already exists" section and `Reuses:` lines naming the shared pieces.
