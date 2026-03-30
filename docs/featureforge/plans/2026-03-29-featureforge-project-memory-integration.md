# FeatureForge Project Memory Integration Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 4
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/featureforge-project-memory-integration-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a first-class `featureforge:project-memory` skill plus repo-visible `docs/project_notes/` memory files, narrow router and workflow hooks, and drift-preventing validation without introducing new authority surfaces or runtime memory state.

**Architecture:** Land the feature in five slices. Task 1 establishes the new skill surface, companion refs, adapted upstream templates, and any required generator support. After that foundation, three isolated worktrees can proceed in parallel: one seeds the repo-visible memory corpus, one wires explicit routing plus repo and platform docs, and one adds the narrow consult and update hooks to existing skills. Task 5 then reunifies the shared contract tests and final regression gate so the authority boundary, content rules, and routing remain fail-closed.

**Tech Stack:** Markdown skill templates and companion refs, Node.js skill-doc generator and tests, Rust instruction-contract and routing tests, existing `featureforge repo-safety` and workflow helper contracts

---

## Plan Contract

This plan owns implementation order, task boundaries, and done criteria for the approved project-memory integration. It does not redefine the approved authority model; if this plan and the approved spec drift, the spec wins and this plan must be updated in the same change.

## Existing Capabilities / Built-ins to Reuse

- `scripts/gen-skill-docs.mjs` already auto-discovers `skills/*/SKILL.md.tmpl` and generates the checked-in `SKILL.md` outputs. Reuse that pipeline instead of inventing a project-memory-specific generator.
- `skills/using-featureforge/SKILL.md.tmpl`, `skills/writing-plans/SKILL.md.tmpl`, `skills/systematic-debugging/SKILL.md.tmpl`, and `skills/document-release/SKILL.md.tmpl` already carry the targeted instruction surfaces this spec wants to extend.
- `tests/codex-runtime/skill-doc-generation.test.mjs` and `tests/codex-runtime/skill-doc-contracts.test.mjs` already validate generated-skill presence, preamble structure, and wording contracts. Extend them instead of adding bespoke script checks everywhere.
- `tests/using_featureforge_skill.rs` already exercises router behavior around `using-featureforge`; add explicit memory-intent routing coverage there.
- `tests/runtime_instruction_contracts.rs` already enforces repo instruction-surface invariants across `README.md`, `AGENTS.md`, and generated skill docs. Reuse it for authority-boundary, prompt-surface, and no-secrets assertions.
- The approved spec already distilled the upstream `project-memory` repository into FeatureForge-safe constraints. Use that approved adaptation instead of re-litigating upstream semantics during implementation.

## Known Footguns / Constraints

- Project memory is supportive context only. It must never outrank approved specs, approved plans, execution evidence, review artifacts, or runtime-owned state.
- Do not add a new runtime helper, command family, schema family, workflow stage, or readiness gate for memory in v1.
- Keep the top-level `skills/project-memory/SKILL.md` concise. Put examples, file templates, maintenance rules, and boundary teaching in companion refs.
- `AGENTS.md` is already heavier than ideal. The required memory section must stay short and fold in the stale `Superpowers` naming cleanup instead of expanding the file with a large protocol block.
- `issues.md` may not become a live tracker, execution log, or progress board. `decisions.md` is an index and backlink surface, not a replacement ADR authority.
- `key_facts.md` must stay non-sensitive. Secret-like content and credential-adjacent boilerplate fail closed.
- If `docs/project_notes/` appears on another branch or via user edits before this slice lands, preserve valid content and create only missing or malformed boundary pieces by default.
- Generated `SKILL.md` files must be refreshed in the same task that changes their `.tmpl` source.

## Cross-Task Invariants

- Use `featureforge:test-driven-development` before adding or changing contract tests, even when the underlying change is "just docs."
- Keep all repo-visible write guidance inside the existing `featureforge repo-safety` contract. Documentation may describe the contract, but implementation may not invent a parallel approval model.
- Prefer short bullet-oriented memory entries with backlinks or `Last Verified` markers over duplicated narrative.
- Keep reject cases named consistently with the approved vocabulary: `SecretLikeContent`, `AuthorityConflict`, `TrackerDrift`, `MissingProvenance`, `OversizedDuplication`, and `InstructionAuthorityDrift`.
- Treat `docs/project_notes/*` as content surfaces, not as workflow state, routing truth, or instruction authority.
- Regenerate checked-in skill docs before running Node skill-doc tests for any task that changes a skill template.

## Change Surface

- New project-memory skill surface: `skills/project-memory/SKILL.md.tmpl`, `skills/project-memory/SKILL.md`, `skills/project-memory/authority-boundaries.md`, `skills/project-memory/examples.md`, `skills/project-memory/references/*.md`
- New repo-visible memory corpus: `docs/project_notes/README.md`, `docs/project_notes/bugs.md`, `docs/project_notes/decisions.md`, `docs/project_notes/key_facts.md`, `docs/project_notes/issues.md`
- Routing and repo/platform docs: `skills/using-featureforge/SKILL.md.tmpl`, `skills/using-featureforge/SKILL.md`, `AGENTS.md`, `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`
- Existing workflow touch points: `skills/writing-plans/SKILL.md.tmpl`, `skills/writing-plans/SKILL.md`, `skills/systematic-debugging/SKILL.md.tmpl`, `skills/systematic-debugging/SKILL.md`, `skills/document-release/SKILL.md.tmpl`, `skills/document-release/SKILL.md`
- Validation: `tests/codex-runtime/skill-doc-generation.test.mjs`, `tests/codex-runtime/skill-doc-contracts.test.mjs`, `tests/codex-runtime/project-memory-content.test.mjs`, `tests/using_featureforge_skill.rs`, `tests/runtime_instruction_contracts.rs`

## Preconditions

- The approved source of truth is `docs/featureforge/specs/featureforge-project-memory-integration-spec.md` at `Spec Revision: 1`.
- `~/.featureforge/install/bin/featureforge` is the packaged helper contract for workflow and repo-safety checks; do not assume a PATH-installed binary.
- `node` is available for `scripts/gen-skill-docs.mjs` and `tests/codex-runtime/*.test.mjs`.
- Rust tooling is available for `cargo nextest` and `cargo clippy`.
- `docs/project_notes/` does not exist on the current branch today, but implementation must still honor the approved partial-initialization rule if that changes before merge.

## Evidence Expectations

- The diff must show a new checked-in `skills/project-memory/` directory with generated output and companion refs.
- The diff must show a real seeded `docs/project_notes/` subtree, not empty placeholders.
- Seed entries must carry `Source:` backlinks or `Last Verified:` markers everywhere the approved spec requires inspectable provenance.
- Updated repo and platform docs must describe project memory as optional support rather than a stage or gate.
- Validation output must show the new skill is discoverable, explicit memory routing works, and committed memory content is scanned for secret-like, tracker-like, and instruction-like drift.

## Validation Strategy

- Task 1: `node scripts/gen-skill-docs.mjs` and `node --test tests/codex-runtime/skill-doc-generation.test.mjs`
- Task 2: `node --test tests/codex-runtime/project-memory-content.test.mjs`
- Task 3: `node scripts/gen-skill-docs.mjs --check` and `cargo nextest run --test using_featureforge_skill`
- Task 4: `node scripts/gen-skill-docs.mjs --check` and `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Task 5 final gate:
- `node scripts/gen-skill-docs.mjs --check`
- `node --test tests/codex-runtime/*.test.mjs`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo nextest run --test using_featureforge_skill --test runtime_instruction_contracts`

## Documentation Update Expectations

- Any `.tmpl` change must ship with the regenerated `SKILL.md` output in the same task.
- Keep the new `AGENTS.md` project-memory section short, and use that edit to remove the stale `Superpowers` repo labeling from the file header.
- `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` should mention the new skill and memory subtree as optional support surfaces only.
- `docs/project_notes/README.md` and `skills/project-memory/authority-boundaries.md` must say the same thing about authority ordering, no-secrets policy, and conflict resolution.
- Examples and templates must teach FeatureForge-adapted semantics, not copy upstream wording that normalizes credential storage or tracker behavior.

## Rollout Plan

- Land Task 1 first so the new skill contract and companion refs define the boundary before any routing or dogfooding work starts.
- After Task 1, create three isolated worktrees and run Tasks 2, 3, and 4 in parallel.
- Merge Tasks 2, 3, and 4 back before starting Task 5 so validation hardening sees the final content, routing, and hook wording together.
- Treat rollout as pure repo-visible markdown and test evolution. No runtime-state migration or cleanup step is needed.

## Rollback Plan

- Revert the task-scoped slice that introduced the regression rather than weakening the authority-boundary rules or validation.
- If the whole feature must back out, remove `skills/project-memory/` and `docs/project_notes/` and revert the touched doc and test changes together.
- Do not add rollback logic for runtime state; v1 deliberately creates no runtime-owned project-memory state family.

## Risks and Mitigations

- The new skill could sprawl into a broad documentation tool. Keep the default allowed write set narrow and assert it in the skill, examples, and tests.
- The seeded memory corpus could degenerate into duplicate history or active status tracking. Use provenance-backed summaries only, keep `issues.md` breadcrumb-sized, and add content scans that reject tracker drift.
- Repo docs could accidentally imply that memory is authoritative or mandatory. Reuse the exact supportive-not-authoritative language across `AGENTS.md`, `README.md`, platform docs, and contract tests.
- The no-secrets rule could erode through examples or "where secrets live" wording. Fail closed on secret-like patterns and keep examples limited to safe pointers, not credential-adjacent boilerplate.
- Parallel doc lanes could still collide through shared generated outputs or tests. Reserve `tests/using_featureforge_skill.rs` for Task 3, reserve `tests/codex-runtime/skill-doc-contracts.test.mjs` for Task 4 until Task 5, and merge each lane before the final validation seam.

## Execution Strategy

- Execute Task 1 serially. It establishes the new project-memory skill surface, companion refs, adapted template semantics, and any generator support all later work depends on.
- After Task 1, create one isolated worktree per task and run Tasks 2, 3, and 4 in parallel:
  - Task 2 owns `docs/project_notes/*` and `tests/codex-runtime/project-memory-content.test.mjs`.
  - Task 3 owns `skills/using-featureforge/*`, `AGENTS.md`, `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, and `tests/using_featureforge_skill.rs`.
  - Task 4 owns `skills/writing-plans/*`, `skills/systematic-debugging/*`, `skills/document-release/*`, and the hook-focused assertions in `tests/codex-runtime/skill-doc-contracts.test.mjs`.
- Execute Task 5 serially after Tasks 2, 3, and 4 merge back. It is the only validation hardening seam that may reopen shared contract tests and compare the final memory corpus, skill docs, and repo docs together.

## Dependency Diagram

```text
Task 1 -> Task 2
Task 1 -> Task 3
Task 1 -> Task 4
Task 2 -> Task 5
Task 3 -> Task 5
Task 4 -> Task 5
```

## Requirement Coverage Matrix

- REQ-001 -> Task 1, Task 5
- REQ-002 -> Task 2
- REQ-003 -> Task 1, Task 2, Task 5
- REQ-004 -> Task 1, Task 2
- REQ-005 -> Task 1, Task 2
- REQ-006 -> Task 1, Task 2, Task 5
- REQ-007 -> Task 1, Task 5
- REQ-008 -> Task 3, Task 5
- REQ-009 -> Task 3, Task 5
- REQ-010 -> Task 4, Task 5
- REQ-011 -> Task 2
- REQ-012 -> Task 1, Task 2
- REQ-013 -> Task 4
- REQ-014 -> Task 1, Task 2
- REQ-015 -> Task 2, Task 5
- REQ-016 -> Task 1, Task 2
- REQ-017 -> Task 1
- REQ-018 -> Task 1, Task 5
- REQ-019 -> Task 1
- REQ-020 -> Task 1, Task 2, Task 5
- REQ-021 -> Task 1, Task 5
- DEC-001 -> Task 2
- DEC-002 -> Task 2
- DEC-003 -> Task 3
- DEC-004 -> Task 1, Task 4
- DEC-005 -> Task 1, Task 2
- DEC-006 -> Task 1, Task 2
- DEC-007 -> Task 2
- DEC-008 -> Task 1, Task 2
- DEC-009 -> Task 1
- DEC-010 -> Task 1, Task 5
- DEC-011 -> Task 1
- DEC-012 -> Task 1, Task 2, Task 5
- VERIFY-001 -> Task 1, Task 3, Task 4, Task 5
- VERIFY-002 -> Task 5
- VERIFY-003 -> Task 2, Task 5
- NONGOAL-001 -> Task 1, Task 2, Task 5
- NONGOAL-002 -> Task 4, Task 5
- NONGOAL-003 -> Task 2

## Task 1: Build the Project-Memory Skill Foundation

**Spec Coverage:** REQ-001, REQ-004, REQ-005, REQ-006, REQ-007, REQ-012, REQ-014, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, DEC-004, DEC-005, DEC-006, DEC-008, DEC-009, DEC-010, DEC-011, DEC-012, VERIFY-001, NONGOAL-001
**Task Outcome:** FeatureForge ships a concise `featureforge:project-memory` skill plus companion refs that teach the adapted upstream model, narrow write set, reject vocabulary, and partial-initialization rule without adding new authority surfaces or runtime helpers.
**Plan Constraints:**
- Keep the top-level `SKILL.md` concise and move detailed teaching into companion refs.
- If `scripts/gen-skill-docs.mjs` already discovers the new skill correctly, leave generator logic untouched.
- Default write guidance must stay confined to `docs/project_notes/*` and the narrow project-memory section in `AGENTS.md`.
- Teach partial-initialization behavior without rewriting substantive existing memory content by default.
- `skills/project-memory/examples.md` must include positive and negative examples for `bugs.md`, `decisions.md`, `key_facts.md`, and `issues.md`, including rejected secret-like content, authority-blurring summaries, tracker-drift cases, instruction-authority drift cases, and at least one worked example that collapses an approved spec, approved plan, execution evidence artifact, or stable repo doc into a short memory entry with a backlink.
**Open Questions:** none

**Files:**
- Create: `skills/project-memory/SKILL.md.tmpl`
- Create: `skills/project-memory/SKILL.md`
- Create: `skills/project-memory/authority-boundaries.md`
- Create: `skills/project-memory/examples.md`
- Create: `skills/project-memory/references/bugs_template.md`
- Create: `skills/project-memory/references/decisions_template.md`
- Create: `skills/project-memory/references/key_facts_template.md`
- Create: `skills/project-memory/references/issues_template.md`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`

- [x] **Step 1: Add red generation assertions in `tests/codex-runtime/skill-doc-generation.test.mjs` that expect a discoverable `project-memory` skill with generated output and companion references**
- [x] **Step 2: Create `skills/project-memory/SKILL.md.tmpl`, `authority-boundaries.md`, `examples.md`, and `references/*.md` with the FeatureForge-adapted upstream layout, reject vocabulary, repo-safety contract, narrow write set, no-secrets rule, deterministic partial-initialization guidance, positive and negative examples for `bugs.md`, `decisions.md`, `key_facts.md`, and `issues.md`, and at least one worked example that collapses an approved spec, plan, execution evidence artifact, or stable repo doc into a short memory entry with a backlink**
- [x] **Step 3: Inspect `scripts/gen-skill-docs.mjs` and patch it only if the new skill needs explicit generator support, then run `node scripts/gen-skill-docs.mjs` to produce `skills/project-memory/SKILL.md`**
- [x] **Step 4: Re-read the generated `skills/project-memory/SKILL.md` and trim any wording that bloats the top-level prompt surface or implies project-memory authority**
- [x] **Step 5: Run `node --test tests/codex-runtime/skill-doc-generation.test.mjs` and `node scripts/gen-skill-docs.mjs --check`, then fix failures until the slice is green**
- [x] **Step 6: Commit the slice with `git commit -m "feat: add project-memory skill foundation"`**
## Task 2: Seed and Boundary the Repo-Visible Memory Corpus

**Spec Coverage:** REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-011, REQ-012, REQ-014, REQ-015, REQ-016, REQ-020, DEC-001, DEC-002, DEC-005, DEC-006, DEC-007, DEC-008, DEC-012, VERIFY-003, NONGOAL-001, NONGOAL-003
**Task Outcome:** The repository gains a `docs/project_notes/` subtree with an explicit boundary README, a file-type-specific maintenance rubric, and a small high-signal seed corpus whose entries are provenance-backed, non-sensitive, and deliberately narrower than workflow-authoritative artifacts.
**Plan Constraints:**
- Preserve valid existing files if the subtree appears before merge; create only missing or malformed pieces by default.
- Every seeded entry must collapse durable knowledge from authoritative artifacts or stable repo docs and carry inspectable provenance.
- `issues.md` stays breadcrumb-only and may not carry `Completed`, `In Progress`, `Blocked`, or other live-tracker wording.
- Do not seed secret-adjacent or unstable facts.
- The maintenance rubric must explicitly cover recurring-only retention for `bugs.md`, breadcrumb-only retention for `issues.md`, `Last Verified` refresh expectations for volatile `key_facts.md` entries, and conservative supersede-or-annotate retention for `decisions.md`.
**Open Questions:** none

**Files:**
- Create: `docs/project_notes/README.md`
- Create: `docs/project_notes/bugs.md`
- Create: `docs/project_notes/decisions.md`
- Create: `docs/project_notes/key_facts.md`
- Create: `docs/project_notes/issues.md`
- Create: `tests/codex-runtime/project-memory-content.test.mjs`
- Test: `tests/codex-runtime/project-memory-content.test.mjs`

- [x] **Step 1: Create `tests/codex-runtime/project-memory-content.test.mjs` with red assertions that require the boundary README, seeded files, inspectable provenance markers, non-tracker `issues.md`, and the absence of imperative instruction language or obvious secret-like content**
- [x] **Step 2: Create `docs/project_notes/README.md` with authority ordering, no-secrets rule, conflict-resolution rule, update guidance, and an explicit file-type maintenance rubric covering recurring-only retention for `bugs.md`, breadcrumb-only retention for `issues.md`, `Last Verified` refresh rules for volatile `key_facts.md` entries, and conservative supersede-or-annotate retention for `decisions.md`**
- [x] **Step 3: Seed `docs/project_notes/key_facts.md` and `docs/project_notes/decisions.md` from stable repo docs and approved workflow artifacts, using concise bullets with `Source:` or `Last Verified:` markers**
- [x] **Step 4: Seed `docs/project_notes/bugs.md` and `docs/project_notes/issues.md` with only recurring or durable breadcrumbs, and collapse any source artifact down to summary-plus-backlink form**
- [x] **Step 5: Run `node --test tests/codex-runtime/project-memory-content.test.mjs` plus `rg -n \"In Progress|Blocked|Completed|token|api key|private key|password\" docs/project_notes`, then fix any failing content or drift before merging the lane**
- [x] **Step 6: Commit the lane in its dedicated worktree with `git commit -m "docs: seed project memory corpus"`**
## Task 3: Wire Explicit Routing and Repo Docs

**Spec Coverage:** REQ-008, REQ-009, DEC-003, VERIFY-001
**Task Outcome:** Explicit memory requests route through `using-featureforge` to `featureforge:project-memory`, `AGENTS.md` contains the required concise project-memory section with the exact supportive-memory, consult-before-rediscovery, no-secrets, and structured-update guidance from the approved spec, and the repo and platform docs describe project memory as an optional support layer without expanding the default mandatory stack.
**Plan Constraints:**
- Keep explicit memory routing opt-in only; do not add project memory to the mandatory default stack.
- Add exactly one concise project-memory section to `AGENTS.md`, and use that same edit to remove the stale `Superpowers` naming from the file header and opening paragraph.
- The new `AGENTS.md` section must explicitly say that `docs/project_notes/` is supportive memory only, that `decisions.md` must be checked before inventing a new cross-cutting approach, that `bugs.md` must be checked when debugging recurring failures, that secrets must never be stored in `docs/project_notes/`, and that `featureforge:project-memory` is the setup and structured-update entry point.
- Do not add `.github/copilot-instructions.md` or any other new instruction surface.
**Open Questions:** none

**Files:**
- Modify: `skills/using-featureforge/SKILL.md.tmpl`
- Modify: `skills/using-featureforge/SKILL.md`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `tests/using_featureforge_skill.rs`
- Test: `tests/using_featureforge_skill.rs`

- [x] **Step 1: Add red routing assertions in `tests/using_featureforge_skill.rs` for memory-oriented requests that must route to `featureforge:project-memory` without turning memory into part of the default stack**
- [x] **Step 2: Update `skills/using-featureforge/SKILL.md.tmpl` with explicit memory-routing language, regenerate `skills/using-featureforge/SKILL.md`, and keep manual fallback routing conservative**
- [x] **Step 3: Rewrite the stale top matter in `AGENTS.md` from `Superpowers` to `FeatureForge` while adding one concise project-memory section that explicitly says `docs/project_notes/` is supportive memory only, points planners to `decisions.md`, points debuggers to `bugs.md`, forbids secrets in repo-visible memory, and names `featureforge:project-memory` as the setup and structured-update entry point**
- [x] **Step 4: Update `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` so project memory is documented as an optional support layer, not a new workflow stage or gate**
- [x] **Step 5: Run `node scripts/gen-skill-docs.mjs --check` and `cargo nextest run --test using_featureforge_skill`, then fix failures until the lane is green**
- [x] **Step 6: Commit the lane in its dedicated worktree with `git commit -m "docs: route explicit memory requests"`**
## Task 4: Add Non-Gating Workflow Hooks

**Spec Coverage:** REQ-010, REQ-013, DEC-004, VERIFY-001, NONGOAL-002
**Task Outcome:** `writing-plans` explicitly consults `decisions.md` and `key_facts.md`, `systematic-debugging` explicitly searches and updates `bugs.md` in the recurring-failure path, and `document-release` explicitly updates project memory when completed work creates durable knowledge, all without making memory a prerequisite, approval, or finish gate.
**Plan Constraints:**
- Hooks must be consult and update hints only, not prerequisites, approvals, or gates.
- Keep each touched top-level skill concise; route deep guidance back to project-memory companion refs instead of duplicating protocol text.
- Reuse existing repo-safety terminology rather than inventing new helper commands or state.
- The wording must stay specific enough that each touched skill names its exact memory file and moment of use rather than collapsing into a generic reminder to "consult project memory."
**Open Questions:** none

**Files:**
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add red hook assertions in `tests/codex-runtime/skill-doc-contracts.test.mjs` that require `writing-plans` to consult `decisions.md` and `key_facts.md`, require `systematic-debugging` to search and update `bugs.md` in the recurring-failure path, require `document-release` to update project memory when completed work creates durable knowledge, and forbid gate-like language**
- [x] **Step 2: Update `skills/writing-plans/SKILL.md.tmpl`, `skills/systematic-debugging/SKILL.md.tmpl`, and `skills/document-release/SKILL.md.tmpl` with those exact file-specific consult and update hooks, then regenerate their checked-in `SKILL.md` outputs**
- [x] **Step 3: Re-read the generated docs and trim any wording that turns the hook into a protocol block instead of a narrow reminder**
- [x] **Step 4: Run `node --test tests/codex-runtime/skill-doc-contracts.test.mjs` and `node scripts/gen-skill-docs.mjs --check`, then fix failures until the lane is green**
- [x] **Step 5: Commit the lane in its dedicated worktree with `git commit -m "docs: add project-memory workflow hooks"`**
## Task 5: Harden Validation and Final Regression

**Spec Coverage:** REQ-001, REQ-003, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-015, REQ-018, REQ-020, REQ-021, DEC-010, DEC-012, VERIFY-001, VERIFY-002, VERIFY-003, NONGOAL-001, NONGOAL-002
**Task Outcome:** The validation suite fails closed when the new memory layer drifts toward unsafe wording, tracker behavior, instruction authority, missing provenance, broken routing, or incomplete example coverage, and the final regression gate proves the repo remains green under the stricter contracts.
**Plan Constraints:**
- Validation must fail closed on secret-like, tracker-like, or imperative instruction-like drift.
- Do not create a runtime-owned memory protocol or schema just to support validation; repo-visible tests are the enforcement mechanism in v1.
- Final regression must leave generated skill docs and touched Rust suites green under strict Clippy.
**Open Questions:** none

**Files:**
- Modify: `tests/codex-runtime/project-memory-content.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/using_featureforge_skill.rs`
- Test: `tests/codex-runtime/project-memory-content.test.mjs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `tests/runtime_instruction_contracts.rs`
- Test: `tests/using_featureforge_skill.rs`

- [x] **Step 1: Add or extend red assertions in `tests/runtime_instruction_contracts.rs`, `tests/using_featureforge_skill.rs`, `tests/codex-runtime/skill-doc-contracts.test.mjs`, and `tests/codex-runtime/project-memory-content.test.mjs` for the authority boundary, reject vocabulary, repo-safety wording, explicit memory routing, concise repo docs, deterministic partial-initialization rules, and the full positive-and-negative `examples.md` matrix for `bugs.md`, `decisions.md`, `key_facts.md`, and `issues.md`**
- [x] **Step 2: Extend `tests/codex-runtime/skill-doc-generation.test.mjs` so the new skill and its generated output remain discoverable and checked in**
- [x] **Step 3: Run `node --test tests/codex-runtime/skill-doc-generation.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/project-memory-content.test.mjs` and `cargo nextest run --test using_featureforge_skill --test runtime_instruction_contracts`, then fix failures until the targeted suites are green**
- [x] **Step 4: Run the final regression gate: `node scripts/gen-skill-docs.mjs --check`, `node --test tests/codex-runtime/*.test.mjs`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo nextest run --test using_featureforge_skill --test runtime_instruction_contracts`**
- [x] **Step 5: Commit the slice with `git commit -m "test: harden project-memory validation"`**
## Failure Modes

- The new `skills/project-memory/` template lands but generation fails to produce or refresh `SKILL.md`. Covered by Tasks 1 and 5 generator checks; error handling is explicit contract failure, and the operator sees a loud test break instead of a silently missing skill.
- Seeded `docs/project_notes/*` content includes secret-like text, tracker drift, or instruction-authority drift. Covered by Tasks 2 and 5 content scans; error handling is fail-closed validation, and the operator sees a failing suite instead of silent unsafe normalization.
- `using-featureforge` routes explicit memory requests incorrectly or makes project memory part of the mandatory default stack. Covered by Tasks 3 and 5 routing tests; error handling is explicit test failure, and the user sees blocked approval rather than silent routing drift.
- `writing-plans`, `systematic-debugging`, or `document-release` gain memory wording that behaves like a gate instead of a targeted hook. Covered by Tasks 4 and 5 skill-doc contract tests; error handling is fail-closed wording checks, and the user sees a contract failure instead of a hidden workflow change.
- Partial `docs/project_notes/` initialization overwrites valid existing memory entries. Covered by Task 1 boundary guidance and Task 5 partial-initialization assertions; error handling is narrow write-scope guidance plus validation, and the user sees review/test failures instead of silent data loss.

## TODOS.md Review

- Added a repo-level `TODOS.md` item to reconcile the `plan-eng-review` skill's stale `repo-file-write` guidance with the runtime-supported `plan-artifact-write` and `approval-header-write` targets; that mismatch is FeatureForge tooling debt and remains outside the scope of this approved implementation plan.

## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-29T18:00:43Z
**Review Mode:** small_change
**Reviewed Plan Revision:** 4
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** `/Users/davidmulcahey/.featureforge/projects/dmulcahey-featureforge/davidmulcahey-dm-project-memory-85597c85639e-test-plan-20260329-180043.md`
**Outside Voice:** skipped
