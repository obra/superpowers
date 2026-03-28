# FeatureForge Workflow Boundary Hardening

**Workflow State:** CEO Approved
**Spec Revision:** 3
**Last Reviewed By:** plan-ceo-review

## Problem Statement

FeatureForge has already moved major workflow decisions into the Rust runtime, but the workflow still has four boundary gaps and one throughput gap that let work move too far on trust, prose, or manual coordination:

- first human entry into `using-featureforge` is documented as session-entry-gated, but the active contract coverage still does not prove that a fresh session must hit `featureforge session-entry resolve --message-file <path>` before any normal stack, spec-review routing, plan-review routing, or execution-preflight logic can run
- `writing-plans` can produce a draft implementation plan that then flows straight into `plan-eng-review`, but there is no dedicated independent subagent fidelity gate that proves the written plan fully captures the approved spec before engineering review starts
- approved plans are not yet required to be parallel-first artifacts, so FeatureForge can still approve plans that are comprehensive but not decomposed for the fastest safe execution path; today there is no parseable dependency graph, write-scope law, or explicit serial-only justification that would let the runtime maximize safe parallelism
- `subagent-driven-development` already has per-task reviewer loops, but the workflow does not yet define one authoritative, runtime-trusted rule that every completed execution unit must earn an independent pass receipt before the next unit, dependent unit, integration step, or downstream completion can proceed, and `executing-plans` does not currently enforce the same standard
- the execution workflow still treats worktrees as optional manual prep and actively discourages parallel implementation subagents, which means the harness is not yet optimized to get comprehensive correct results as fast as possible while staying safe
- even where worktrees exist, the workflow does not yet require reviewed work to reconcile back onto the active execution branch and clean up temporary worktrees at regular safe barriers, so isolated work can linger outside the authoritative branch and workspace sprawl can accumulate until the very end
- final whole-diff review freshness is enforced through artifact headers, but the system does not yet require runtime-owned proof that the review result came from a dedicated reviewer independent of the main implementation context and tied to the current diff or approved plan state

This is one systemic defect, not seven isolated ones: from plan creation through final review, FeatureForge still allows too much progress on the strength of controller memory, artifact headers, or human discipline, while also leaving safe throughput on the table because plans and execution modes are not yet forced into a parallel-first shape and temporary isolated work is not yet reconciled back into the authoritative branch on a runtime-owned cadence.

## Desired Outcome

After this hardening slice lands:

- a fresh human session cannot reach normal FeatureForge routing until the session-entry gate resolves first
- every newly written or revised plan must be a parallel-first artifact: it must expose the fastest safe execution topology, explicit unit dependencies, explicit write scope, and explicit reasons when some work must remain serialized
- `writing-plans` must guide planners to turn that topology into clean parallel development lanes when possible: lanes should own disjoint write scope or explicitly reserve shared hotspot files behind serial seam-extraction or reintegration slices instead of claiming nominal parallelism over the same hot files
- a newly written or revised plan cannot enter `plan-eng-review` until a dedicated independent subagent or equivalent fresh-context plan-fidelity review has passed for that exact plan revision and approved spec revision
- engineering review cannot approve a plan that fails to maximize safe parallelism or fails to explain why a serialized step is unavoidable
- engineering review must pressure-test whether claimed parallelism is real against the concrete task/file ownership model; "parallel on paper but overlapping on hotspot files without an explicit serial seam" is a review failure
- the execution harness must recommend the fastest safe topology for the approved plan, preferring worktree-backed parallel subagent execution when eligible units exist, while retaining authority to downgrade a slice to a more conservative runtime topology when live execution evidence proves the planned parallel path unsafe and to carry that downgrade history forward as runtime guidance for reruns that match the same approved plan revision plus relevant execution context unless fresh static proof and current-run readiness checks support the original path; a later successful restored run in that same context must supersede the conservative default while preserving the history for observability
- isolated worktrees become temporary execution surfaces rather than long-lived shadow branches: repo-writing units must produce one final reviewed checkpoint commit, and after a unit or reviewed parallel batch passes, the runtime must reconcile that reviewed checkpoint back onto the active execution branch through an identity-preserving path that keeps the reviewed commit in authoritative history; if reconciliation would require rewriting it, the runtime must block for a new reviewed checkpoint instead of silently changing what ships
- each completed execution unit cannot advance to dependent work, integration, the next serial unit, or downstream final review until an independent unit-review receipt is in pass state, and any earlier pass receipt touched by a runtime topology downgrade must survive current-state revalidation before it remains authoritative
- final whole-diff review cannot complete until a dedicated reviewer independent of the implementation context produces a pass receipt tied to the current diff or approved plan state; when the run recorded execution-time topology downgrades, that reviewer must also explicitly inspect and pass those deviations before final review can succeed
- designated review stages are terminal verification gates for their unit of work and do not trigger recursive review-of-review loops

The result should be one tighter workflow law: runtime owns entry, topology truth, and review receipts; plans are written for safe parallel execution by default; controllers coordinate worktrees and reviewer dispatch; markdown skills describe the law rather than standing in for it.

## Scope

In scope:

- strict first-entry gating for `using-featureforge`
- a mandatory independent subagent-based plan-fidelity review pass after `writing-plans` and before `plan-eng-review`
- a parallel-first plan contract that forces approved plans to expose dependency, write-scope, workspace, and scheduling truth
- explicit planner guidance and reviewer pressure-testing for clean parallel lane decomposition, not just nominal concurrent task labels
- mandatory engineering-review enforcement that plans maximize safe parallel execution rather than merely describe correct work
- worktree-backed parallel execution support in the harness and the execution skills
- runtime-owned reconciliation and cleanup of temporary worktrees at regular safe execution barriers
- mandatory independent pass receipts for each completed execution unit across supported execution modes
- a mandatory dedicated final-review path for `requesting-code-review`
- runtime-owned review receipts authoritative enough for routing and finish gating to reject self-certified or stale review claims
- deterministic contract coverage and at least one end-to-end regression per workstream

Out of scope:

- the separate runtime-dependency-policy and shell-safe helper-output TODO
- arbitrary free-form distributed execution outside plan-declared execution units and runtime-owned coordination
- weakening the single-authoritative-writer rule for execution state
- requiring recursive review-of-review for designated review stages
- replacing existing freshness headers when additive receipt/provenance data is sufficient
- migration, upgrade, or grandfathering behavior for pre-existing approved plans, in-flight execution runs, or partially-written runtime artifacts from earlier versions

## Requirement Index

- [REQ-001][behavior] The initial human entry path for `using-featureforge` must invoke `featureforge session-entry resolve --message-file <path>` before normal stack setup, workflow routing, or approved-plan handoff logic runs.
- [REQ-002][behavior] If session-entry resolution returns `needs_user_choice`, that question must become the first surfaced response and later helpers must not become the first place a missing or malformed decision appears.
- [REQ-003][behavior] Fresh-session routing coverage must prove that representative intents for spec review, plan review, and execution preflight cannot bypass the first-entry session gate.
- [REQ-004][behavior] `writing-plans` must emit a parallel-first plan contract for every execution-bound spec. Each approved plan must expose parseable execution-unit dependency truth, explicit write scope, explicit workspace/isolation expectations, and a fastest-safe schedule for the covered work.
- [REQ-005][behavior] If any work remains serialized, the plan must record an explicit technical reason for serialization, such as dependency order, overlapping write scope, shared migration window, or other named hazard. Silent serial-by-default planning is not allowed.
- [REQ-006][behavior] After `writing-plans` creates or revises a plan, FeatureForge must require a plan-fidelity review executed by a dedicated independent subagent or equivalent fresh-context reviewer that is distinct from both the plan-writing context and the later `plan-eng-review` context. That review must verify the plan fully and accurately captures the approved spec, including the spec `Requirement Index` and the plan's execution-topology claims, before `plan-eng-review` may begin.
- [REQ-007][behavior] Workflow routing and engineering-review entry must fail closed when the latest plan-fidelity review receipt for the current plan revision and approved spec revision is missing, stale, malformed, or not pass.
- [REQ-008][behavior] `plan-eng-review` approval must fail closed when the plan lacks parseable execution-topology metadata, fails to maximize safe parallelism, or leaves serialized work unjustified.
- [REQ-033][behavior] `writing-plans` must teach planners to decompose the fastest safe topology into clean parallel development lanes when the repo and requirement graph allow it. At minimum the written guidance must require planners to identify disjoint write ownership where possible and to carve explicit serial seam-extraction or reintegration tasks around shared hotspot files when full disjointness is not practical.
- [REQ-034][behavior] `plan-eng-review` must pressure-test claimed parallelism against the concrete task/file ownership model. If supposedly parallel lanes still collide on hotspot files, giant shared tests, or unspecified reintegration seams, engineering review must either force a cleaner decomposition or explicitly serialize the work with a named reason.
- [REQ-009][behavior] The execution harness must compute and expose the fastest safe execution topology for the approved plan from plan metadata, workspace readiness, isolated-agent availability, and current run state, preferring worktree-backed parallel execution when eligible units exist and downgrading to a more conservative topology when live execution evidence invalidates the planned parallel path.
- [REQ-010][behavior] Repo-writing execution units that run in parallel must each receive isolated worktree or equivalent isolated branch-backed workspace authority with non-overlapping write scope. The coordinator/runtime remains the only authoritative writer of execution state and receipt truth.
- [REQ-011][behavior] Both `featureforge:subagent-driven-development` and `featureforge:executing-plans` must honor the harness-selected topology, including required worktree routing or provisioning, bounded parallel dispatch, and explicit reason-coded fallback to serial execution when parallelism is unsafe or unavailable. Once implementation has started, execution-time topology downgrades must be recorded in authoritative runtime state without mutating the approved plan artifact.
- [REQ-012][behavior] The runtime must create a first-class authoritative `WorktreeLease` artifact for every temporary execution workspace it expects to reconcile later. At minimum the artifact must bind execution unit identity, source branch, authoritative integration branch, worktree path, workspace status, and cleanup status.
- [REQ-013][behavior] `WorktreeLease` uses stable fail-closed lifecycle states. At minimum the runtime must distinguish `open`, `review_passed_pending_reconcile`, `reconciled`, and `cleaned`, and reject unknown or malformed states.
- [REQ-014][behavior] Gates, status, operator output, dependency indexing, and cleanup truth must trust the authoritative `WorktreeLease` artifact family and its indexed fingerprints rather than relying only on ad hoc harness-state fields.
- [REQ-015][behavior] The primary safe interval for reconciliation and cleanup is the barrier immediately after a unit or reviewed parallel batch has all required unit-review receipts in pass state and before dependent work, downstream integration, or the next batch is released.
- [REQ-016][behavior] Per-unit immediate reconciliation is allowed only when the runtime can prove from approved-plan dependency truth, write-scope truth, and current run state that no still-running sibling unit in the same parallel batch can be destabilized by that reconcile. Otherwise the runtime must wait for the full reviewed batch barrier.
- [REQ-017][behavior] At the chosen safe barrier, the runtime/coordinator must reconcile the reviewed final unit checkpoint commit back onto the active execution branch through an identity-preserving fast-forward or merge path that keeps that reviewed commit object in authoritative branch history, record the authoritative result, and then close and clean up the temporary `WorktreeLease`. Long-lived unreconciled worktrees are not a valid steady state.
- [REQ-018][behavior] Any execution unit that mutates repo state may create intermediate local commits inside its temporary worktree, but it must produce exactly one final reviewed unit checkpoint commit before that unit can be considered complete or eligible for authoritative reconciliation. Dirty worktree state alone is not sufficient authoritative reconcile input.
- [REQ-019][behavior] Each completed execution unit must be provisional until an independent reviewer verifies that the unit fully and accurately satisfies its approved contract and emits a pass receipt for that exact unit.
- [REQ-020][behavior] The unit-review receipt must be runtime-owned and must bind at least the approved plan path, approved plan revision, execution unit identifier, source task packet or equivalent approved unit contract, reviewed repo/worktree target, the single final reviewed checkpoint commit SHA for repo-writing units, and reviewer verdict.
- [REQ-021][behavior] If identity-preserving reconciliation would require rewriting the reviewed checkpoint, conflict resolution that changes reviewed content, or landing a different commit object on the active execution branch, the runtime must fail closed on the unsafe parallel path, downgrade the affected slice to a more conservative runtime topology for the current run without mutating the approved plan artifact, and require a new reviewed checkpoint plus fresh independent review before downstream progress may continue.
- [REQ-022][behavior] Execution may not integrate a unit into downstream progress, start dependent units, or enter final review until all prerequisite unit-review receipts are pass and current for the exact unit revisions being relied on. When runtime downgrades an execution slice to a more conservative topology, previously passing sibling receipts remain current only if runtime can prove that the reviewed checkpoint, dependency baseline, and reconcile assumptions they were approved against still match the current execution state; otherwise those receipts become stale and must be re-earned.
- [REQ-023][behavior] `gate-finish` and branch-completion routing must fail closed when any required `WorktreeLease` for the active execution run remains open, unreconciled, or uncleaned.
- [REQ-024][behavior] `requesting-code-review` must dispatch or resume a dedicated reviewer independent of the implementation context before any final whole-diff review claim is considered valid.
- [REQ-025][behavior] Final-review freshness must require a runtime-owned pass receipt plus exact diff or approved-plan linkage strong enough to reject review results that came from the main implementation context or from a stale review target. When the active run recorded one or more execution-time topology downgrades, the final-review receipt must also bind explicit reviewer disposition of those recorded deviations; when no such deviations occurred, no special deviation audit is required.
- [REQ-026][behavior] Designated review stages are terminal gates for their reviewed unit of work and do not themselves require another independent review receipt.
- [REQ-027][behavior] Status, operator output, and execution observability must expose the selected execution topology, active isolated worktrees, active `WorktreeLease` artifacts, reconciliation state, cleanup state, blocked review receipts, reason-coded serial fallbacks or parallel blockers, and any execution-time deviation from the approved plan topology.
- [REQ-028][behavior] Contract tests must fail closed when the first-entry gate is skipped, when plans omit required parallel-execution truth, when `plan-eng-review` is reachable without a passing plan-fidelity receipt, when execution advances or integrates without a passing unit-review receipt, when repo-writing units attempt review or reconcile without exactly one final reviewed checkpoint commit, when the harness permits unsafe parallel execution, when per-unit immediate reconciliation is allowed without the required proof, when reconcile attempts rewrite or replace a reviewed checkpoint commit on the active branch, when execution-time topology downgrades are not reason-coded and surfaced without mutating the approved plan artifact, when reviewed work is not reconciled back to the active branch at a safe barrier, when temporary `WorktreeLease` artifacts remain open past finish gating, or when final review is satisfied without a dedicated independent-review receipt linked to the current diff or plan state and, when required, explicit pass disposition for recorded execution deviations.
- [REQ-029][behavior] If a prior run recorded an execution-time topology downgrade for a slice, future runs must treat that history as authoritative runtime guidance for topology selection on that slice only when the run matches the same approved plan revision plus the relevant execution context. At minimum that context key must include the approved plan revision, branch/base lineage or equivalent integration context, and the primary downgrade reason class from the closed repo-wide runtime-owned vocabulary. The default rerun posture for a matching context is conservative reuse of the learned downgrade unless current static proof and lightweight readiness checks for the current run show the original parallel path is safe again. At minimum those checks must cover current dependency truth, write-scope separation, workspace hygiene, and required worktree availability. This guidance must live in runtime state, not as a mutation of the approved plan artifact.
- [REQ-030][behavior] If a later run in the same approved plan revision and matching execution context successfully restores and completes the original parallel path, runtime must mark the older conservative guidance for that context as superseded for future default topology selection while preserving the downgrade and restore history for observability, auditability, and final-review context.
- [REQ-031][behavior] Every execution-time topology downgrade record must include both a primary reason class from the closed repo-wide runtime-owned vocabulary and a required shared structured detail payload. The allowed primary classes in this slice are exactly `write_scope_overlap`, `dependency_mismatch`, `workspace_unavailable`, `reconcile_conflict`, `baseline_drift`, and `policy_safety_block`. The shared detail payload must include `trigger_summary`, `affected_units`, `blocking_evidence`, and `operator_impact`, and may include optional extra notes. `blocking_evidence` must itself include a short `summary` plus `references` to concrete runtime artifacts, fingerprints, or equivalent authoritative evidence when such evidence exists for the downgrade event. `operator_impact` must itself include `severity`, `changed_or_blocked_stage`, and `expected_response`; `severity` uses the closed values `info`, `warning`, and `blocking`. Context matching and rerun-guidance reuse must key only on the primary reason class, while diagnostics, observability, and final-review workflows must retain and surface the structured detail payload. Unknown primary classes, missing required detail fields, malformed required evidence references, or unknown `operator_impact.severity` values fail closed.
- [REQ-032][behavior] Execution-time topology downgrade history remains runtime execution-state guidance for matching reruns, observability, and final-review context. It must not automatically block, mutate, or become a mandatory input to later `writing-plans` or `plan-eng-review` cycles for new plan revisions.
- [DEC-001][decision] These TODOs ship as one workflow-boundary hardening spec with five workstreams rather than as disconnected artifacts.
- [DEC-002][decision] Runtime-owned review receipts are authoritative for plan-fidelity review, execution-unit review, and final whole-diff review; controller-written prose or headers alone are not sufficient trust sources.
- [DEC-003][decision] All execution-bound plans are parallel-first by default. Serialized work is an exception that must be named and justified, not the unexamined default.
- [DEC-004][decision] Safe execution speed comes from isolated worktrees plus bounded parallel subagent execution, while authoritative execution state remains single-writer and runtime-owned.
- [DEC-005][decision] The active execution branch remains the authoritative integration surface. Temporary worktrees are disposable execution surfaces that must reconcile back into that branch at runtime-owned safe barriers, preserve the reviewed checkpoint commit in authoritative history, and then be cleaned up.
- [DEC-006][decision] Dedicated-reviewer provenance extends the current review artifact contract; it does not replace existing freshness checks for plan revision, branch, base branch, head SHA, generator, or repo.
- [DEC-007][decision] Branch completion is the final cleanup backstop, not the primary cleanup point. Regular barrier reconciliation and cleanup belong inside the execution harness.
- [DEC-008][decision] `WorktreeLease` is a first-class authoritative harness artifact family rather than a state-only bookkeeping field.
- [DEC-009][decision] Repo-writing execution units reconcile through one final reviewed checkpoint commit per unit; dirty worktree state alone is not authoritative reconcile truth.
- [DEC-010][decision] Reconciliation is identity-preserving: the reviewed checkpoint commit that earned the pass receipt is the commit object that must appear in authoritative branch history. If reconcile would require rewrite or content-changing conflict resolution, the unit must produce a new reviewed checkpoint instead.
- [DEC-011][decision] Once implementation starts, the approved plan artifact stays fixed. If live execution evidence proves a planned-parallel slice unsafe, runtime may downgrade that slice to a more conservative topology for the current run, but it must record the deviation authoritatively instead of rewriting the plan mid-run. Earlier pass receipts survive only when runtime can prove that their reviewed checkpoint and execution assumptions still hold after the downgrade.
- [DEC-012][decision] Designated review stages are terminal gates for their reviewed unit of work and do not recurse into review-of-review loops.
- [DEC-013][decision] Runtime learns from execution-time topology downgrades through a hybrid context key rather than plan revision alone. Prior downgrade history guides reruns conservatively only when the approved plan revision and the relevant execution context match, unless both current static proof and lightweight current-run readiness checks support restoring the original parallel path.
- [DEC-014][decision] A successful restored run supersedes older conservative guidance for the same learned context. The system keeps the downgrade and restore record, but future matching runs should not stay conservative by default once that context has already succeeded under the restored path.
- [DEC-015][decision] Downgrade matching uses one small repo-wide runtime-owned primary reason-class enum for stability: `write_scope_overlap`, `dependency_mismatch`, `workspace_unavailable`, `reconcile_conflict`, `baseline_drift`, and `policy_safety_block`. Every downgrade record also carries one shared required structured detail payload for diagnostics, observability, and review; `blocking_evidence` uses a shared `summary + references` shape, and `operator_impact` uses a shared `severity + changed_or_blocked_stage + expected_response` shape.
- [DEC-016][decision] Runtime learning from execution-time topology downgrades stays execution-owned in this slice. Later planning and engineering review do not ingest that history as a mandatory contract input.
- [DEC-017][decision] This slice assumes a fresh-start version boundary. New behavior starts from clean state; the runtime does not need to upgrade, classify, or grandfather in-flight work from earlier versions.
- [DEC-018][decision] Parallel-first planning means cleanly mergeable lane ownership, not merely concurrent task labels. When full disjointness is not practical, plans should isolate shared hotspot files behind explicit serial seam-extraction or reintegration slices instead of pretending the overlapping work is safely parallel.
- [VERIFY-001][verification] Each workstream must add or tighten red deterministic tests before the behavior change lands.
- [VERIFY-002][verification] The release-facing validation matrix must include the contract suites that protect these boundaries and the topology-selection rules.
- [NONGOAL-001][non-goal] Do not broaden this slice into a general workflow redesign or a repo-wide dependency-purge effort.
- [NONGOAL-002][non-goal] Do not weaken existing finish-gate freshness checks while adding authoritative review receipts.
- [NONGOAL-003][non-goal] Do not add migration gates, compatibility shims, or upgrade logic for pre-existing plans or execution runs in this slice.

## Repo Reality Check

The current repository already shows where the gaps are:

- [`skills/using-featureforge/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md) says supported entry paths must call `featureforge session-entry resolve --message-file <path>` before the normal stack, but the active tests only prove generic supported-entry behavior rather than downstream-route exclusion.
- [`tests/using_featureforge_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/using_featureforge_skill.rs) has a useful supported-entry harness already, but it does not currently prove that fresh-session messages aiming at spec review, plan review, or execution preflight are blocked by the first-entry gate.
- [`skills/using-featureforge/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md) currently routes from approved spec to `writing-plans` and from draft plan to `plan-eng-review`, which means there is no dedicated independent-subagent post-plan-writing gate today.
- [`skills/writing-plans/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/writing-plans/SKILL.md) emphasizes comprehensiveness and task traceability, but it does not yet require parseable dependency truth, write-scope truth, or explicit parallel scheduling in the plan contract.
- [`skills/plan-eng-review/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/plan-eng-review/SKILL.md) requires `Requirement Coverage Matrix`, task structure, and execution mode headers, but it does not yet block approval when a plan is comprehensive while still serial-by-default or missing explicit execution-topology truth.
- those same planning and review skills also do not yet tell the planner or reviewer to pressure-test whether the proposed parallel lanes are actually clean against the repo's hotspot files and shared integration seams, which means a plan can still claim parallelism that collapses into merge-conflict-heavy worktree churn.
- [`skills/executing-plans/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/executing-plans/SKILL.md) explicitly says "Do not auto-clean the workspace and do not auto-create a worktree" and that workspace preparation is the user's responsibility, which is the opposite of a runtime-driven safe-throughput model.
- [`skills/subagent-driven-development/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/subagent-driven-development/SKILL.md) already contains per-task spec-review and code-quality-review loops, but it still says "Do not auto-create a worktree" and "Dispatch multiple implementation subagents in parallel" is a red flag, so the current skill deliberately avoids the execution topology the user now wants.
- [`skills/using-git-worktrees/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-git-worktrees/SKILL.md) already gives FeatureForge a safety-minded isolated-workspace path, which means the repo has a strong primitive to reuse rather than inventing a second workspace story.
- [`skills/dispatching-parallel-agents/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/dispatching-parallel-agents/SKILL.md) already documents how FeatureForge should coordinate independent subagents, but that logic is not yet part of the canonical execution workflow.
- [`skills/finishing-a-development-branch/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/finishing-a-development-branch/SKILL.md) already has a terminal `git-worktree-cleanup` path, which is useful as a final backstop, but today it is too late and too optional to enforce regular cleanup during execution.
- [`docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md`](/Users/dmulcahey/development/skills/superpowers/docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md) explicitly kept broader parallel task execution out of scope, so the current harness spec stops short of the parallel-first execution model this hardening slice now needs.
- [`src/contracts/harness.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/harness.rs) already defines the first-class authoritative harness artifact families `ExecutionContract`, `EvaluationReport`, and `ExecutionHandoff`, so it is the natural contract surface for a new authoritative `WorktreeLease` artifact instead of burying lease truth only in runtime state JSON.
- [`skills/subagent-driven-development/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/subagent-driven-development/SKILL.md) already says the coordinator owns every `git commit`, which means a final commit-backed unit checkpoint fits the existing authority boundary better than dirty-tree review or dirty-tree reconcile.
- [`src/execution/harness.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/harness.rs) and [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs) already track worktree-related provenance such as `write_authority_worktree` and `repo_state_baseline_worktree_fingerprint`, which means runtime already has useful primitives for isolated-workspace authority and provenance.
- [`tests/workflow_runtime.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_runtime.rs) already proves same-branch worktrees can share authoritative execution state, which gives this slice a good starting point for a runtime-owned lease and reconciliation model instead of a skill-only cleanup convention.
- [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs) enforces final-review freshness through headers like `Source Plan Revision`, `Branch`, `Base Branch`, `Head SHA`, `Result`, `Generated By`, and `Repo`, but it does not yet require runtime-owned proof that the review itself came from a dedicated reviewer independent of the implementation context.

## Architecture

The design keeps authority local to the layer that can actually enforce it, while turning speed into a runtime-owned concern instead of a manual best effort:

```text
human entry
   |
   v
featureforge session-entry resolve
   |
   +--> needs_user_choice -> bypass question shown immediately -> stop
   |
   +--> enabled / bypassed -> workflow routing


approved spec
   |
   v
writing-plans
   |
   v
draft plan with:
- requirement coverage
- execution-unit dependency truth
- write scopes
- workspace/isolation expectations
- fastest-safe schedule
   |
   v
independent plan-fidelity reviewer subagent
   |
   v
runtime-owned plan-fidelity receipt (pass required)
   |
   v
plan-eng-review
   |
   v
engineering-approved plan
```

The execution portion becomes topology-aware:

```text
engineering-approved plan
   |
   v
featureforge plan execution recommend
   |
   +--> serial fallback (reason-coded, justified by plan, environment, or live execution conflict)
   |
   +--> parallel batch N
           |
           +--> unit A -> isolated worktree A -> implementer -> independent unit reviewer(s) -> pass receipt
           |
           +--> unit B -> isolated worktree B -> implementer -> independent unit reviewer(s) -> pass receipt
           |
           +--> unit C -> isolated worktree C -> implementer -> independent unit reviewer(s) -> pass receipt
           |
           v
     WorktreeLease(review_passed_pending_reconcile, reviewed_commit_sha)
           |
           v
     identity-preserving barrier reconciliation onto active execution branch
           |
           +--> authoritative WorktreeLease(reconciled)
           |
           +--> authoritative WorktreeLease(cleaned)
           |
           v
     next dependency-unblocked batch or final whole-diff review
```

The governing rule is:

- runtime owns entry, topology truth, receipt truth, and final gating
- the active execution branch is the authoritative integration surface for the run
- plans must expose enough structure for runtime to choose the fastest safe schedule
- controllers own orchestration, worktree coordination, and reviewer dispatch
- implementers and reviewers may produce candidate artifacts, but they do not become authoritative by themselves
- review stages are terminal gates for their unit of work
- markdown skills may narrate the contract, but they may not be the only place it exists

## Delivery Model

Ship this slice in five ordered workstreams:

1. strict first-entry session gate
2. independent plan-fidelity gate between `writing-plans` and `plan-eng-review`
3. parallel-first plan contract and engineering-review enforcement
4. worktree-backed parallel execution and independent execution-unit review gates
5. dedicated final-review receipts and finish-gate trust hardening

The ordering is intentional:

- Workstream 1 closes the earliest human-entry failure first.
- Workstream 2 hardens plan-writing handoff before engineering review can rely on it.
- Workstream 3 makes the approved plan structurally usable for fast safe execution.
- Workstream 4 teaches the harness and execution skills to exploit that structure while preserving fail-closed review law.
- Workstream 5 tightens the final whole-diff gate on top of the earlier receipt model.

## Workstream 1: Strict First-Entry Session Gate

**Goal**

Make the first supported `using-featureforge` entry path provably session-entry-gated, not just documented that way.

**Contract**

- The first supported human entry path must call `featureforge session-entry resolve --message-file <path>` before computing `_SESSIONS`, running `update-check`, touching workflow routing, or reading approved artifact state.
- `needs_user_choice` must always surface as the first user-visible response for a fresh or malformed decision state.
- Messages that would otherwise route toward planning or execution must still hit the gate first when the session decision is missing.
- Existing enabled, bypassed, and explicit-reentry behavior stays intact.

Representative fresh-session intents that must stay blocked by the gate until resolution:

- "help me brainstorm a feature"
- "review this spec"
- "review this implementation plan"
- "resume this approved plan" or execution-preflight entry

**Expected touch points**

- [`skills/using-featureforge/SKILL.md.tmpl`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md.tmpl)
- [`skills/using-featureforge/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md)
- [`tests/using_featureforge_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/using_featureforge_skill.rs)
- [`tests/runtime_instruction_contracts.rs`](/Users/dmulcahey/development/skills/superpowers/tests/runtime_instruction_contracts.rs)
- workflow-routing fixtures that currently assume routing can start before the gate

**Tests to add first**

- extend the existing supported-entry harness in [`tests/using_featureforge_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/using_featureforge_skill.rs) so fresh-session messages targeting spec review, plan review, and execution preflight still return `first_response_kind = bypass_prompt`
- doc-contract checks that `using-featureforge` does not describe later helpers as fallback first-entry decision makers
- one end-to-end route test that proves a fresh session cannot reach downstream review or execution entrypoints without the gate firing first

**Acceptance criteria**

- a missing or malformed session decision cannot reach normal-stack initialization
- a fresh session cannot route into spec review, plan review, or execution preflight before the gate resolves
- enabled and explicit-reentry sessions still proceed normally after the gate

## Workstream 2: Independent Plan-Fidelity Gate

**Goal**

Require an independent subagent pass receipt after `writing-plans` completes and before `plan-eng-review` may begin.

**Contract**

- Creating or revising a plan is provisional until a dedicated independent subagent reviewer or equivalent fresh-context reviewer verifies that the plan fully and accurately captures the approved spec.
- That reviewer must be distinct from both the `writing-plans` context that produced the draft and the later `plan-eng-review` context that decides engineering approval. This is a real workflow stage, not an honor-system self-check.
- The reviewer must compare the written plan against the exact approved spec path and revision, including the spec `Requirement Index` and any scope-affecting CEO-review decisions already accepted into the spec body.
- The reviewer must also verify that the plan's execution-topology claims are faithful to the approved scope rather than dropping requirements to make the schedule look cleaner or faster.
- The resulting plan-fidelity receipt must be runtime-owned and must bind at least:
  - approved spec path
  - approved spec revision
  - plan path
  - plan revision
  - reviewer provenance strong enough to prove the receipt came from the dedicated independent reviewer stage
  - verdict
- `plan-eng-review` entry and workflow routing must fail closed when the latest matching plan-fidelity receipt is missing, stale, malformed, or not pass.
- `plan-eng-review` itself remains the terminal engineering review stage for the plan artifact; it does not require a review-of-review receipt.

**Expected touch points**

- [`skills/writing-plans/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/writing-plans/SKILL.md)
- [`skills/plan-eng-review/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/plan-eng-review/SKILL.md)
- [`skills/using-featureforge/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md)
- workflow routing/runtime code that decides when `plan-eng-review` is available
- plan-contract or plan-state runtime surfaces that can validate spec-plan fidelity
- [`tests/contracts_spec_plan.rs`](/Users/dmulcahey/development/skills/superpowers/tests/contracts_spec_plan.rs)
- [`tests/workflow_runtime.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_runtime.rs)
- [`tests/runtime_instruction_contracts.rs`](/Users/dmulcahey/development/skills/superpowers/tests/runtime_instruction_contracts.rs)

**Tests to add first**

- routing/runtime tests that fail when `plan-eng-review` becomes reachable without a passing plan-fidelity receipt for the current plan revision or when the receipt lacks dedicated-reviewer provenance
- doc-contract assertions that `writing-plans` hands off through a dedicated independent-subagent fidelity gate instead of directly to engineering review or to a self-review step
- spec/plan contract tests that fail when the fidelity receipt target does not match the approved spec revision or current plan revision

**Acceptance criteria**

- a newly written or revised plan cannot enter `plan-eng-review` without a passing dedicated independent-subagent plan-fidelity receipt
- editing the plan or changing the source spec revision stales the earlier receipt automatically
- `plan-eng-review` remains a terminal plan-review stage rather than the start of a recursive review chain

## Workstream 3: Parallel-First Plan Contract and Engineering-Review Enforcement

**Goal**

Make every engineering-approved plan structurally ready for the fastest safe execution path instead of merely being correct in prose.

**Contract**

- `writing-plans` must stop producing serial-by-accident plans. Every execution-bound plan must expose parseable execution units, dependency edges, explicit write scope, and explicit workspace expectations that the harness can consume.
- Each execution unit must say enough for the runtime and reviewers to answer these questions deterministically:
  - what requirement IDs does this unit satisfy
  - what other units must pass first
  - what files or write scope does it own
  - whether it requires an isolated worktree
  - whether it can run in parallel with sibling units
- The plan must include an execution-topology view that shows the fastest safe batch order for the whole plan. ASCII is sufficient as long as the machine-readable task metadata and the human-readable diagram agree.
- If work is serialized, the plan must name the hazard that forced serialization. Allowed reasons are expected to be concrete and reviewable, such as dependency order, overlapping write scope, migration sequencing, or integration risk that cannot be isolated safely.
- `writing-plans` must guide planners to optimize for clean parallel lane ownership, not just dependency metadata. When full disjointness is not practical, the plan must isolate shared hotspot files behind explicit serial seam-extraction or reintegration tasks instead of labeling overlapping work as parallel by default.
- `plan-eng-review` must treat "correct but needlessly serial" as a review failure, not as a style suggestion. The engineering reviewer is responsible for forcing the plan into its fastest safe shape before approval.
- `plan-eng-review` must also treat "parallel on paper but still overlapping on hotspot files or unspecified reintegration seams" as a review failure. The reviewer is responsible for pressure-testing merge economics and worktree cleanliness, not just the dependency graph.
- The approved plan contract should remain minimal and parseable. This is not permission to turn plan files into orchestration novels.

**Expected touch points**

- [`skills/writing-plans/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/writing-plans/SKILL.md)
- [`skills/plan-eng-review/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/plan-eng-review/SKILL.md)
- [`tests/codex-runtime/fixtures/plan-contract/valid-plan.md`](/Users/dmulcahey/development/skills/superpowers/tests/codex-runtime/fixtures/plan-contract/valid-plan.md)
- [`tests/contracts_spec_plan.rs`](/Users/dmulcahey/development/skills/superpowers/tests/contracts_spec_plan.rs)
- [`src/contracts/plan.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/plan.rs)
- [`src/contracts/runtime.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/runtime.rs)
- [`tests/runtime_instruction_contracts.rs`](/Users/dmulcahey/development/skills/superpowers/tests/runtime_instruction_contracts.rs)

**Tests to add first**

- plan-contract tests that fail when approved plans omit dependency truth, write scope, workspace/isolation truth, or a justified serial-only reason
- plan-contract or fixture coverage that fails when a plan claims parallel lanes without either disjoint write ownership or an explicit serial seam around shared hotspot files
- fixture coverage for at least one valid multi-batch parallel plan and one valid fully serialized plan with named hazards
- doc-contract assertions that `writing-plans` describes clean lane decomposition as required behavior and that `plan-eng-review` pressure-tests claimed parallelism against concrete file ownership rather than optional optimization

**Acceptance criteria**

- an engineering-approved plan always exposes a parseable fastest-safe execution topology
- an engineering-approved plan's claimed parallel lanes correspond to a concrete file-ownership model the reviewer can pressure-test
- serialized work is always explicitly justified
- hotspot files are either isolated behind explicit serial seam tasks or the affected work is named and justified as serialized
- the plan contract stays deterministic enough for runtime and test fixtures to reject drift

## Workstream 4: Worktree-Backed Parallel Execution and Independent Execution-Unit Review Gates

**Goal**

Teach the harness and the execution skills to exploit the parallel-first plan contract safely, using isolated worktrees and independent reviewers as the throughput-and-correctness default.

**Contract**

- `featureforge plan execution recommend` must stop behaving like a coarse serial-vs-session-choice helper. It must expose the selected execution topology and the reason it chose it.
- When the approved plan exposes independent repo-writing units and isolated-agent support is available, the harness must prefer bounded parallel execution in isolated worktrees.
- `featureforge:using-git-worktrees` must become a canonical workspace-isolation path for execution, not just optional manual setup. The execution workflow may still ask for confirmation when policy or branch safety requires it, but "workspace prep is the user's job" is no longer good enough as the default story.
- `featureforge:dispatching-parallel-agents` should inform the execution workflow's orchestration model for independent units. Parallel dispatch is allowed only for units whose dependency and write-scope truth make parallelism safe.
- `featureforge:subagent-driven-development` and `featureforge:executing-plans` must both honor the same runtime-selected topology law:
  - parallel units get isolated worktrees or equivalent isolated branch-backed workspace authority
  - implementers work only inside the unit contract they were assigned
  - independent reviewers run after unit work completes
  - coordinator/runtime records authoritative state and receipts
- The active execution branch remains the authoritative integration branch for the run. Temporary worktrees are disposable execution surfaces, not alternate long-lived homes for completed work.
- Runtime must maintain a first-class authoritative `WorktreeLease` artifact family for temporary execution surfaces alongside the existing authoritative harness artifact families. The lease lifecycle is not only a mutable field inside harness state.
- At minimum `WorktreeLease` must capture: execution unit identity, active execution branch, temporary worktree path, repo/worktree provenance, current lease state, cleanup state, and the authoritative fingerprint of any reviewed work being reconciled.
- Any execution unit that mutates repo state may create intermediate local commits in its temporary worktree, but it must produce exactly one final reviewed unit checkpoint commit before the reviewer pass can become authoritative. Dirty worktree state alone does not satisfy this contract.
- `WorktreeLease` uses stable fail-closed lifecycle states. At minimum the runtime must distinguish `open`, `review_passed_pending_reconcile`, `reconciled`, and `cleaned`, and gates must reject unknown, malformed, or stale lease states.
- Status, workflow doctor/handoff, and `gate-finish` must trust the authoritative `WorktreeLease` artifact family plus indexed fingerprints instead of inferring cleanup truth solely from ad hoc state overlays.
- The primary cleanup interval is the unit or batch barrier after required unit reviews pass.
- The runtime may reconcile a single unit before the rest of its batch only when it can prove from approved-plan dependency truth, write-scope truth, and current run state that no still-running sibling can be destabilized by that reconcile.
- If that proof is missing, incomplete, or stale, the runtime must wait for the full reviewed batch barrier.
- If live execution evidence shows that an approved parallel slice was too optimistic, the runtime may downgrade that slice to a more conservative topology for the current run, including serial execution, without reopening plan review or mutating the approved plan artifact.
- Every such downgrade record must carry a primary reason class from the closed repo-wide runtime-owned vocabulary plus the shared required structured detail payload. In this slice the allowed primary classes are `write_scope_overlap`, `dependency_mismatch`, `workspace_unavailable`, `reconcile_conflict`, `baseline_drift`, and `policy_safety_block`. The shared detail payload must include `trigger_summary`, `affected_units`, `blocking_evidence`, and `operator_impact`, with optional extra notes. `blocking_evidence` must include a short `summary` plus `references` to concrete runtime artifacts, fingerprints, or equivalent authoritative evidence when available. `operator_impact` must include `severity`, `changed_or_blocked_stage`, and `expected_response`, with `severity` constrained to `info`, `warning`, or `blocking`; matching and reuse rely on the class, while review and diagnostics must surface the structured detail.
- If a previous run with the same approved plan revision and matching relevant execution context already recorded such a downgrade, future runs should start from that conservative learned posture for the affected slice unless current static proof and lightweight readiness checks for the current run both show the original parallel path is safe again.
- If a later run in that same learned context successfully restores and completes the original parallel path, runtime should preserve the downgrade and restore record but treat the older conservative guidance as superseded for future default topology selection.
- That learned guidance is for runtime topology selection and review context only. It does not automatically reopen or constrain later `writing-plans` or `plan-eng-review` work for new plan revisions.
- After such a downgrade, already-passing sibling units keep their authoritative receipts only when runtime can prove that their reviewed checkpoint, dependency baseline, and reconcile assumptions still match the current run state. Runtime must mark the rest stale and send them back through independent review before relying on them.
- At the chosen safe barrier the coordinator/runtime must reconcile the reviewed final unit checkpoint commit back onto the active execution branch through an identity-preserving fast-forward or merge path, then remove the temporary worktree and mark the lease closed before releasing dependent work.
- If that reconcile would require rewriting the reviewed checkpoint, content-changing conflict resolution, or landing a different commit object on the active branch, the runtime must fail closed on the unsafe topology, reopen the affected unit or batch under a more conservative runtime topology, and require a new reviewed checkpoint plus fresh independent review.
- `featureforge:finishing-a-development-branch` remains the final zero-open-worktree backstop through `gate-finish`, but it must not be the first place the system tries to reconcile or clean up temporary execution worktrees.
- Existing per-task spec-review and code-quality-review loops may remain as the concrete reviewer stack for a unit if their aggregate result becomes the authoritative runtime-owned unit-review receipt.
- A unit is not truly complete when the implementer stops. It is complete only when the independent review gate passes for that unit and the coordinator/runtime can safely rely on it for integration or downstream dependency release.
- Runtime must fail closed on unsafe parallelism. If write scopes overlap, dependencies are unmet, worktree prep fails, reconciliation back onto the active branch fails, cleanup fails, or the authoritative baseline drifts in a way that invalidates a reviewed unit, the affected unit must block, reopen, or re-review instead of silently continuing.
- Authoritative execution state remains single-writer. Parallelism lives in candidate work and isolated workspaces, not in concurrent authoritative state mutation.

**Expected touch points**

- [`skills/using-git-worktrees/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-git-worktrees/SKILL.md)
- [`skills/dispatching-parallel-agents/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/dispatching-parallel-agents/SKILL.md)
- [`skills/executing-plans/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/executing-plans/SKILL.md)
- [`skills/subagent-driven-development/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/subagent-driven-development/SKILL.md)
- [`src/contracts/harness.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/harness.rs)
- [`src/execution/authority.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/authority.rs)
- [`src/execution/dependency_index.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/dependency_index.rs)
- [`src/execution/harness.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/harness.rs)
- [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs)
- [`src/execution/gates.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/gates.rs)
- [`src/execution/observability.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/observability.rs)
- [`tests/contracts_execution_harness.rs`](/Users/dmulcahey/development/skills/superpowers/tests/contracts_execution_harness.rs)
- [`tests/plan_execution.rs`](/Users/dmulcahey/development/skills/superpowers/tests/plan_execution.rs)
- [`tests/workflow_runtime.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_runtime.rs)
- [`tests/workflow_shell_smoke.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_shell_smoke.rs)
- [`skills/finishing-a-development-branch/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/finishing-a-development-branch/SKILL.md)
- [`tests/runtime_instruction_contracts.rs`](/Users/dmulcahey/development/skills/superpowers/tests/runtime_instruction_contracts.rs)

**Tests to add first**

- recommendation/runtime tests that prefer worktree-backed parallel execution when the approved plan exposes eligible independent units
- fail-closed tests that reject unsafe parallel dispatch when write scope overlaps, dependencies are unmet, or required isolated worktree state is missing
- contract tests for `WorktreeLease` parsing, validation, lifecycle-state vocabulary, and fingerprint/index integration
- execution-state tests that fail when a unit is marked complete, integrated, or dependency-releasing without a passing independent unit-review receipt
- tests that reject repo-writing unit review or reconcile when there is no final reviewed checkpoint commit SHA, when multiple candidate checkpoint commits are presented as authoritative, when the receipt SHA does not match the reconciled commit, or when reconciliation lands a rewritten or replacement commit instead of the reviewed checkpoint
- runtime tests that force a planned-parallel slice into a live reconcile conflict and verify that execution downgrades that slice to a reason-coded conservative topology without mutating the approved plan artifact
- runtime tests that verify topology downgrades preserve only the sibling unit-review receipts whose reviewed checkpoint, dependency baseline, and reconcile assumptions still match current state, while invalidating the rest
- runtime tests that verify prior downgrade history is reused only for runs whose approved plan revision and relevant execution context match the recorded context key, and that restoring the original parallel path still requires both current static proof and successful lightweight readiness checks for the current run
- runtime tests that reject downgrade records with unknown primary reason classes, missing required structured detail fields, missing `blocking_evidence.summary`, malformed required evidence references, missing `operator_impact.changed_or_blocked_stage`, missing `operator_impact.expected_response`, or unknown `operator_impact.severity` values, verify the closed repo-wide enum exactly matches the allowed class set, and verify rerun matching keys on the closed primary class rather than structured detail contents
- runtime tests that verify a successful restored run in the same learned context marks older conservative guidance as superseded for future default topology selection while retaining the historical records for observability
- routing/runtime tests that verify recorded downgrade history does not by itself make later `writing-plans` or `plan-eng-review` unavailable for new plan revisions
- hybrid-reconciliation tests that allow immediate single-unit reconcile only when the runtime can prove sibling safety, and otherwise require the full reviewed batch barrier
- runtime tests that fail when reviewed work is not reconciled back to the active execution branch and the temporary worktree lease is not closed at the first safe barrier
- finish-gate tests that fail when any execution worktree lease remains open, unreconciled, or uncleaned
- doc-contract assertions that remove the current "worktree is optional manual prep" and "never dispatch multiple implementation subagents in parallel" rules from the canonical execution path

**Acceptance criteria**

- both execution modes can exploit approved-plan parallelism safely
- repo-writing parallel units run in isolated worktrees by default
- repo-writing units return from temporary worktrees as one final reviewed checkpoint commit rather than dirty-tree state
- the runtime may reconcile an early-passing unit before the rest of its batch only when it can prove that still-running siblings cannot be destabilized
- when live execution shows a planned-parallel slice is unsafe, runtime may downgrade that slice conservatively for the current run without rewriting the approved plan
- after a runtime topology downgrade, only receipts whose reviewed checkpoint and execution assumptions still match current state remain authoritative; the rest are re-reviewed
- prior downgrade history becomes runtime guidance only for reruns whose approved plan revision and relevant execution context match the recorded context key, so affected slices start conservative unless current static proof and lightweight current-run readiness checks restore the original parallel path
- downgrade records always carry a closed repo-wide primary reason class plus the shared required structured detail payload, including `blocking_evidence.summary`, authoritative `references` when available, and structured `operator_impact` fields, so rerun matching stays stable while review context stays concrete
- a successful restored run in that same learned context supersedes the older conservative default for future matching runs while keeping the history visible
- execution-time downgrade history stays runtime-owned and does not become a mandatory input to later planning cycles
- reviewed work returns to the active execution branch at unit or batch barriers with the reviewed checkpoint commit preserved in authoritative history, and temporary worktrees are cleaned up on that cadence
- if reconcile would need to rewrite the reviewed checkpoint, the unit blocks for a new reviewed checkpoint and re-review instead of shipping a derivative commit
- every completed unit requires an independent pass receipt before dependent progress, integration, or final review can proceed
- finish routing refuses to proceed while any required execution worktree lease is still open
- runtime clearly explains every serial fallback and every blocked parallel path

## Workstream 5: Dedicated Final-Review Receipts and Finish-Gate Trust

**Goal**

Make final whole-diff review valid only when a dedicated reviewer independent of the implementation context produces a passing authoritative receipt for the current target.

**Contract**

- `requesting-code-review` must dispatch or resume a dedicated reviewer before making any final whole-diff review claim.
- The main implementation session may prepare context and act on findings, but it may not self-satisfy the final review gate.
- Final-review freshness must require a runtime-owned receipt plus exact target linkage strong enough to answer these questions deterministically:
  - was this review produced by a dedicated reviewer independent of the implementation context
  - was the review aimed at the current `HEAD` and exact reviewed base or diff range
  - when plan-routed, was the review tied to the current approved plan revision and execution state
- When execution recorded one or more topology downgrades, the final reviewer must explicitly inspect those authoritative deviation records and pass them before final review can pass. If no downgrade occurred, final review remains the normal whole-diff path without a mandatory deviation section.
- The persisted code-review artifact may still carry additive provenance headers, but finish gating must trust the runtime-owned receipt as the authoritative source.
- `requesting-code-review` is the terminal final-review stage for the whole diff; it does not require a review-of-review receipt.

**Expected touch points**

- [`skills/requesting-code-review/SKILL.md.tmpl`](/Users/dmulcahey/development/skills/superpowers/skills/requesting-code-review/SKILL.md.tmpl)
- [`skills/requesting-code-review/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/requesting-code-review/SKILL.md)
- [`skills/requesting-code-review/code-reviewer.md`](/Users/dmulcahey/development/skills/superpowers/skills/requesting-code-review/code-reviewer.md)
- downstream skills that depend on final-review truth, especially branch-completion or release-ready routing
- [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs)
- artifact-parsing or fixture helpers where new final-review receipt linkage becomes part of authoritative freshness checks
- [`tests/plan_execution.rs`](/Users/dmulcahey/development/skills/superpowers/tests/plan_execution.rs)
- [`tests/workflow_runtime.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_runtime.rs)
- [`tests/workflow_shell_smoke.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_shell_smoke.rs)
- [`tests/runtime_instruction_contracts.rs`](/Users/dmulcahey/development/skills/superpowers/tests/runtime_instruction_contracts.rs)
- [`tests/codex-runtime/skill-doc-contracts.test.mjs`](/Users/dmulcahey/development/skills/superpowers/tests/codex-runtime/skill-doc-contracts.test.mjs)

**Tests to add first**

- doc-contract assertions that `requesting-code-review` requires a dedicated reviewer path before final-approval claims
- runtime and workflow tests that fail when a final review receipt is missing, stale, or not tied to the current diff or approved plan state
- runtime and workflow tests that fail when a run with recorded execution-time topology downgrades reaches final pass without explicit reviewer disposition of those deviations
- shell-smoke or fixture parity coverage showing that same-session self-certification does not satisfy final review

**Acceptance criteria**

- final whole-diff review cannot be satisfied without a dedicated independent reviewer receipt
- when execution recorded topology downgrades, final review cannot pass without explicit reviewer disposition of those deviations
- the persisted code-review artifact records additive provenance, but finish routing trusts the runtime-owned receipt
- finish routing rejects older review artifacts or receipts that do not match the current target

## Cross-Cutting Validation

The final validation surface for this slice must include at least:

```bash
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
cargo nextest run --test contracts_spec_plan --test contracts_execution_harness --test using_featureforge_skill --test runtime_instruction_contracts --test workflow_runtime --test workflow_shell_smoke --test plan_execution
```

Change-scoped commands may be narrower during implementation, but the release-facing matrix must cover:

- first-entry supported-routing behavior
- plan-fidelity gating before engineering review, including dedicated independent-subagent reviewer provenance
- parallel-first plan-contract enforcement
- topology recommendation and safe parallel execution behavior
- barrier reconciliation and worktree-lease cleanup behavior
- execution-unit receipt enforcement across execution modes
- final-review receipt freshness and provenance

## Rollout and Rollback

Rollout expectations:

- land the workstreams in order
- assume fresh-start rollout semantics: there is no in-flight plan or execution-run migration path to support in this slice
- regenerate checked-in skill docs in the same slice that changes their templates
- treat plan-fidelity, unit-review, and final-review receipts as authoritative immediately when their corresponding workstream lands
- land plan-contract changes before execution-topology changes so the runtime never has to guess safe parallelism from under-specified plans
- land worktree-lease and barrier-reconciliation enforcement before relying on finish-stage cleanup as proof the execution path is clean

Rollback expectations:

- roll back to a clean earlier version rather than trying to downgrade in-flight plans or execution runs across contract shapes
- revert the specific workstream slice instead of weakening the new contract tests
- if a receipt-enforcement workstream rolls back after new receipt data is introduced, revert both the writing or recording path and the downstream trust gate together so the system does not require receipts it no longer writes
- if the parallel-execution workstream rolls back, also roll back any plan-contract fields or recommendation outputs whose only purpose was the new topology law
- if barrier reconciliation rolls back, also roll back any finish-gate requirement that assumes zero open worktree leases

## Risks and Mitigations

- Risk: the workflow becomes a recursive review machine.
  Mitigation: designated review stages are explicitly terminal gates for their reviewed unit of work and do not trigger review-of-review recursion.
- Risk: plans become bloated because "parallel-first" gets interpreted as "describe everything forever."
  Mitigation: require parseable dependency, write-scope, and scheduling truth, but keep the contract minimal and machine-checkable.
- Risk: aggressive parallelism causes merge conflicts or stale reviewed units.
  Mitigation: parallel execution is allowed only for units with safe dependency and write-scope truth; runtime blocks on overlap, drift, or stale receipts.
- Risk: identity-preserving reconcile causes rework when plan decomposition is poor and supposedly parallel units collide at integration time.
  Mitigation: treat repeated reconcile failures as evidence that the plan boundaries or write-scope claims were too optimistic for this run; downgrade the affected slice to a more conservative runtime topology and require a new reviewed checkpoint rather than weakening review-to-ship identity with silent rewrite.
- Risk: throughput drops because execution review rules diverge between `subagent-driven-development` and `executing-plans`.
  Mitigation: make both execution modes converge on one authoritative topology and receipt model, even if their session transport differs.
- Risk: worktree sprawl or manual workspace management becomes another source of operator pain.
  Mitigation: make workspace isolation a canonical runtime-guided path with explicit status and cleanup responsibility instead of an ad hoc manual suggestion.
- Risk: reviewed work sits safely in a worktree but never actually returns to the active branch, so the authoritative branch drifts from what reviewers passed.
  Mitigation: make branch reconciliation part of the same runtime-owned barrier that closes unit-review success, and block dependent work plus finish readiness when reconciliation has not completed.
- Risk: stale receipts cause confusing downstream failures after plan or task edits.
  Mitigation: bind every receipt to exact spec, plan, unit, worktree target, and diff identity so stale-state rejection is deterministic and explainable.
- Risk: a runtime topology downgrade either throws away too much review work or trusts the wrong earlier passes.
  Mitigation: use prove-it invalidation: preserve only the receipts whose reviewed checkpoint, dependency baseline, and reconcile assumptions still match current state, and deterministically stale the rest.
- Risk: execution deviations become invisible by the time the run reaches final whole-diff review.
  Mitigation: make final review deviation-aware only when runtime recorded topology downgrades, and require explicit reviewer disposition of those authoritative deviation records before final pass.
- Risk: the system relearns the same unsafe parallel slice on every rerun of the same approved plan revision.
  Mitigation: carry downgrade history forward as authoritative runtime guidance for that plan revision, while still allowing restoration of the original parallel path only when static analysis and lightweight current-run readiness checks both justify it.
- Risk: learned downgrade guidance overgeneralizes across materially different execution contexts and blocks safe parallelism unnecessarily.
  Mitigation: key downgrade history to approved plan revision plus the relevant execution context, including at least branch/base lineage or equivalent integration context and downgrade reason class, before reusing that guidance.
- Risk: conservative runtime guidance stays sticky even after the same context has already proven the restored parallel path is safe.
  Mitigation: mark the older conservative guidance as superseded after a successful restored run in that same learned context, while preserving both downgrade and restore history for observability.
- Risk: free-form downgrade reasons make matching brittle or, if overcompressed, leave reviewers without enough context.
  Mitigation: use one small repo-wide primary reason-class enum for matching and require one shared structured detail payload on every downgrade record for diagnostics and review.
- Risk: downgrade evidence becomes too hand-wavy for final review or rerun analysis to trust.
  Mitigation: require `blocking_evidence` to carry both a short summary and concrete runtime-artifact or fingerprint references when available, so the record stays auditable without exploding into per-class schemas.
- Risk: operator impact becomes too vague to drive the right response when a downgrade happens mid-run.
  Mitigation: require `operator_impact` to carry a closed severity plus the changed or blocked stage and expected response, so runtime, controllers, and reviewers see the same actionable impact record.
- Risk: execution-time runtime learning bleeds back into later planning workflows and undermines the rule that once implementation starts, getting the work done takes priority.
  Mitigation: keep downgrade history execution-owned in this slice; it guides matching reruns and review context, but does not become a mandatory planning or engineering-review input for later plan revisions.
- Risk: implementation gets dragged into version-to-version migration logic for stale in-flight work and loses the fresh-start execution model.
  Mitigation: treat each version as a fresh start in this slice; do not design migration or grandfathering paths for pre-existing plans or runs.

## Testable Acceptance Summary

- A fresh session with no decision file cannot reach normal stack setup, spec review, plan review, or execution preflight before the session-entry gate resolves.
- A newly written or revised plan cannot enter `plan-eng-review` without a passing dedicated independent-subagent plan-fidelity receipt tied to the current approved spec and plan revision.
- Every engineering-approved plan exposes a parseable fastest-safe execution topology, and any serialized work is explicitly justified.
- The execution harness prefers worktree-backed parallel execution when the approved plan exposes eligible independent units and the environment can support it safely.
- If live execution proves a planned-parallel slice unsafe, runtime downgrades that slice conservatively for the current run, records the deviation authoritatively, and leaves the approved plan artifact unchanged.
- Repo-writing reviewed units come back from temporary worktrees as one final reviewed checkpoint commit, and dirty worktree state alone does not satisfy authoritative reconcile.
- Reviewed work always reconciles back onto the active execution branch at unit or batch safe barriers, preserves the reviewed checkpoint commit in authoritative history, and temporary execution worktrees are cleaned up on that cadence.
- After a runtime topology downgrade, only the earlier unit-review receipts whose reviewed checkpoint and runtime assumptions still match current state remain valid; the rest are re-reviewed.
- Prior downgrade history guides reruns conservatively by default only when the approved plan revision and relevant execution context match the recorded context key, unless current static proof and lightweight current-run readiness checks restore the original parallel path.
- A successful restored run in that same learned context supersedes the older conservative default for future matching runs, but the downgrade and restore records remain available for observability and audit.
- Execution-time topology downgrades always record one repo-wide closed primary reason class plus the shared required structured detail payload, including `blocking_evidence.summary`, authoritative `references` when available, and structured `operator_impact`, so runtime matching is stable and reviewer context stays concrete.
- Execution-time topology downgrade history remains runtime-owned guidance rather than a mandatory input to later planning or engineering-review cycles.
- This slice assumes fresh-start versions and does not include migration or grandfathering behavior for pre-existing plans or in-flight runs.
- Every completed execution unit requires a passing independent unit-review receipt before dependent work, integration, or downstream final review may proceed.
- When execution recorded topology downgrades, final whole-diff review explicitly inspects and passes those deviations before the run can finish.
- Finish readiness fails while any required execution worktree lease is still open, unreconciled, or uncleaned.
- Final whole-diff review requires a dedicated independent reviewer receipt tied to the current diff or approved plan state.
- The deterministic Node and Rust contract suites fail closed when any of these hardened boundaries or topology rules drift.

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-27T14:43:43Z
**Review Mode:** expansion
**Reviewed Spec Revision:** 3
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** fresh-context-subagent
