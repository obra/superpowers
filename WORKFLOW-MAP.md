# Superpowers Current Workflow Map

> Snapshot inspected: Superpowers v6.2.0.
>
> Purpose: document how the current workflow actually operates before adding the V1 Claude + Codex multi-agent changes.
>
> This document is primarily descriptive. It identifies likely insertion points for V1 but does not assume implementation details that have not yet been tested.

---

# 1. Executive Summary

Superpowers is already a structured software-development methodology rather than a loose collection of prompts.

Its primary feature-development flow is:

```text
Conversation starts
    ↓
using-superpowers
    ↓
brainstorming
    ├─ inspect project context
    ├─ clarify intent
    ├─ propose approaches
    ├─ present design
    ├─ user approves design
    ├─ write design/spec document
    ├─ self-review written spec
    └─ user approves written spec
    ↓
writing-plans
    ├─ map files and responsibilities
    ├─ create bite-sized implementation tasks
    ├─ define tests and verification
    ├─ self-review plan
    └─ choose execution mode
    ↓
using-git-worktrees
    ├─ isolate work
    ├─ setup project
    └─ verify clean baseline
    ↓
subagent-driven-development
    OR
executing-plans
    ↓
test-driven-development
    ↓
per-task independent review
    ↓
fix / re-review loop
    ↓
whole-branch final review
    ↓
verification-before-completion
    ↓
finishing-a-development-branch
```

The most important structural finding for this fork is:

> **Current Superpowers does not have a separate Brainstorm → Spec skill boundary.**

The `brainstorming` skill currently:

1. develops the design,
2. gets user approval,
3. writes the design/spec document,
4. self-reviews it,
5. gets user approval of the written spec,
6. invokes `writing-plans`.

`writing-plans` is therefore **not the spec-writing stage**. It converts an already-approved spec into a detailed implementation plan.

The conceptual workflow being added in this fork is:

```text
Brainstorm
→ multi-perspective review
→ synthesis
→ written spec
→ adversarial spec review
→ canonical spec
→ implementation plan
→ implementation
→ independent review
→ verification
```

For V1, the smallest-change hypothesis is:

> Keep Brainstorm and Spec as two clearly separated internal review gates inside the existing `brainstorming` skill rather than immediately introducing a new top-level specification skill.

Only split them later if behavior testing shows agents consistently blur or skip the distinction.

---

# 2. Core Principles for the Fork

The fork should preserve and strengthen the existing Superpowers philosophy.

Three additional phrases summarize the intended direction:

> **Evidence before confidence.**

> **Simple before clever.**

> **Verify before merge.**

A useful responsibility model is:

```text
Models reason.
Evidence verifies.
SA decides.
```

Where:

* **SA / primary Claude Code agent** owns user intent, orchestration, synthesis, and final decisions.
* **Claude subagents** primarily provide constructive/contextual reasoning.
* **Codex** primarily provides adversarial review and high-value implementation.
* **Sonnet** handles suitable routine/mechanical implementation.
* **Tests, repository evidence, and authoritative documentation** verify technical claims.

No model is automatically authoritative merely because it sounds confident.

---

# 3. Repository Areas Relevant to the Workflow

The methodology is primarily implemented under:

```text
skills/
```

Relevant skills include:

```text
skills/using-superpowers/
skills/brainstorming/
skills/writing-plans/
skills/using-git-worktrees/
skills/subagent-driven-development/
skills/executing-plans/
skills/test-driven-development/
skills/requesting-code-review/
skills/receiving-code-review/
skills/verification-before-completion/
skills/finishing-a-development-branch/
skills/systematic-debugging/
skills/writing-skills/
```

Default design/spec location:

```text
docs/superpowers/specs/
```

Default implementation-plan location:

```text
docs/superpowers/plans/
```

Skill behavior changes should follow the existing `writing-skills` methodology and be tested as behavioral changes rather than treated as ordinary prose edits.

---

# 4. Entry Point: `using-superpowers`

Path:

```text
skills/using-superpowers/SKILL.md
```

## Current Responsibility

This is the workflow bootstrap.

It requires the agent to:

* check for relevant skills before acting,
* use process skills before implementation skills,
* invoke `brainstorming` before creative development work,
* invoke `systematic-debugging` before bug-fix work,
* respect user/project instructions above skill defaults.

Typical routing:

```text
"Let's build X"
    → brainstorming

"Fix this bug"
    → systematic-debugging
```

## V1 Implication

Do not embed Codex calls directly here.

This skill should remain the high-level router.

Cross-model orchestration belongs inside the workflow stages that actually need it.

---

# 5. Design and Spec Stage: `brainstorming`

Path:

```text
skills/brainstorming/SKILL.md
```

## Current Responsibility

Despite its name, `brainstorming` currently owns both design discovery and written-spec creation.

Current flow:

```text
Explore project context
    ↓
Ask clarifying questions
    ↓
Propose 2–3 approaches
    ↓
Present design sections
    ↓
User approves design?
    ├─ no → revise
    └─ yes
         ↓
Write design/spec document
         ↓
Self-review written spec
         ↓
User reviews written spec?
    ├─ changes → revise
    └─ approved
         ↓
Invoke writing-plans
```

## Existing Strengths

The skill already enforces:

* no implementation before design approval,
* YAGNI,
* alternative approaches before commitment,
* alignment to user intent,
* following existing codebase patterns,
* avoiding unrelated refactoring,
* bounded components and clear responsibilities.

The written-spec self-review currently checks:

* placeholders,
* contradictions,
* scope,
* ambiguity.

## Current Gap

The design and written spec are primarily reviewed by:

* the primary agent itself,
* the user.

There is no deliberate independent constructive + adversarial model review before the design/spec becomes canonical.

## Natural V1 Insertion Point A — Design Review

After a coherent design has been developed, but before it is treated as final:

```text
SA develops candidate design with user
    ↓
Candidate design is coherent
    ↓
Claude constructive review
+
Codex adversarial review
    ↓
SA evaluates both
    ↓
SA synthesizes revised design
    ↓
Material unresolved issue?
    ├─ yes → targeted repeat
    └─ no → approved design
```

Claude should primarily ask:

* What important possibility is missing?
* Is the architecture coherent?
* Does this fully solve the user’s actual problem?
* Is there a cleaner or simpler formulation?
* Are important constraints or implications missing?

Codex should primarily ask:

* What assumptions are unsupported?
* What can fail?
* What requirements appear invented?
* What technical claim needs verification?
* What is unnecessarily complex?
* Is there a materially simpler approach?
* Does anything contradict stated user intent?

SA owns synthesis.

Neither Claude nor Codex decides automatically.

## Natural V1 Insertion Point B — Written Spec Review

After the design/spec document has been written:

```text
Write design/spec
    ↓
Existing self-review
    ↓
Independent adversarial spec review
    ↓
SA synthesis / corrections
    ↓
Canonical written spec
    ↓
User review / approval
```

The central spec-review question should be:

> Could another competent coding agent implement this without making material assumptions?

The review should explicitly check:

```text
BLOCKERS

AMBIGUITIES

UNSUPPORTED ASSUMPTIONS

HALLUCINATED OR UNVERIFIED TECHNICAL CLAIMS

MISSING ACCEPTANCE CRITERIA

OVERENGINEERING

SIMPLER ALTERNATIVES

MISSING EDGE CASES

MISSING TEST REQUIREMENTS

TECHNICAL CLAIMS REQUIRING VERIFICATION
```

## V1 Boundary Decision

Default V1 approach:

```text
Keep both gates inside brainstorming:
1. Candidate-design review.
2. Written-spec review.
```

Do not create a standalone `specification` skill unless behavioral testing shows a real need.

---

# 6. Implementation Planning: `writing-plans`

Path:

```text
skills/writing-plans/SKILL.md
```

## Current Responsibility

This skill receives an approved spec and creates the implementation plan.

It handles:

* scope checking,
* file/responsibility mapping,
* task decomposition,
* exact interfaces,
* TDD steps,
* verification commands,
* commit steps,
* plan self-review,
* execution handoff.

Default output:

```text
docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md
```

## Existing Strengths

The skill already forbids vague or incomplete plans.

Examples of prohibited plan failures include:

* `TBD`,
* `TODO`,
* unspecified error handling,
* undefined functions/types,
* vague test instructions,
* interfaces referenced but never defined.

It already encourages:

* DRY,
* YAGNI,
* clear responsibilities,
* small focused files,
* established codebase patterns,
* avoiding gratuitous restructuring.

## V1 Implication

Do not confuse this with the written-spec stage.

The V1 spec adversarial review should happen **before** `writing-plans`.

A lightweight independent implementation-plan review may be added later if testing shows that plans frequently:

* invent APIs,
* introduce unnecessary architecture,
* fail to cover spec requirements,
* create avoidable complexity.

Do not add another review stage merely for symmetry.

---

# 7. Workspace Gate: `using-git-worktrees`

Path:

```text
skills/using-git-worktrees/SKILL.md
```

## Current Responsibility

Before implementation:

* detect whether work is already isolated,
* prefer native worktree support,
* fall back to Git worktrees,
* setup dependencies,
* run baseline tests.

Important rule:

```text
Never start implementation on main/master
without explicit user consent.
```

## V1 Implication

No major redesign is needed.

Claude/Sonnet/Codex should all operate inside the workspace created or validated by the existing mechanism.

Do not create competing workspace behavior.

---

# 8. Main Implementation Orchestrator: `subagent-driven-development`

Path:

```text
skills/subagent-driven-development/SKILL.md
```

Supporting files include:

```text
implementer-prompt.md
task-reviewer-prompt.md
re-review-prompt.md
scripts/
```

## Current Responsibility

Current pattern:

```text
Read plan
    ↓
Pre-flight plan check
    ↓
For each task:
    create task brief
    ↓
    dispatch fresh implementer
    ↓
    implement + test + commit + self-review
    ↓
    create review package
    ↓
    dispatch independent reviewer
    ↓
    findings?
       ├─ no → complete task
       └─ yes → bounded fix/re-review loop
    ↓
Next task
    ↓
Whole-branch final review
    ↓
Finish branch
```

## Existing Separation of Roles

The controller coordinates.

Implementers implement.

Reviewers review independently.

The controller does not casually fix reviewed code itself.

This is already close to the intended V1 role separation.

## Existing Model Routing

The current skill already distinguishes:

```text
Mechanical implementation
    → cheaper/faster model

Integration and judgment
    → standard model

Architecture/design/final review
    → most capable model
```

## V1 Implication

Do not create a parallel numeric risk engine.

Adapt the existing routing logic into explicit role-aware routing.

Conceptually:

```text
ROUTINE / MECHANICAL / LOWER-RISK
    → Sonnet or suitable cheaper Claude model

HIGH-VALUE / HIGH-RISK
    → Codex implementation
```

Examples that should lean Codex:

* architectural changes,
* authentication,
* authorization,
* security-sensitive logic,
* payments,
* database migrations,
* data integrity,
* critical business logic,
* broad cross-codebase behavior,
* difficult integration changes.

Examples that can lean Sonnet:

* isolated mechanical changes,
* straightforward CRUD,
* simple UI work,
* boilerplate,
* routine config,
* small well-specified refactors,
* straightforward test additions.

This is guidance, not a rigid classifier.

SA remains responsible for routing.

## Existing Fix Loop

The SDD workflow already has bounded remediation:

* rounds 1–3: original implementer,
* rounds 4–5: fresh/more capable implementer,
* after round 5: adjudication,
* unresolved load-bearing issue: stop/escalate.

This must be preserved.

Do not add an unbounded “Fusion” discussion loop beside it.

---

# 9. Implementer Contract

Path:

```text
skills/subagent-driven-development/implementer-prompt.md
```

## Existing Requirements

Implementers already must:

* implement exactly the task,
* ask rather than guess,
* stop/escalate unexpected architecture decisions,
* follow planned file structure,
* avoid unrelated restructuring,
* test,
* verify,
* commit,
* self-review,
* report evidence.

Existing self-review includes:

```text
Did I avoid overbuilding (YAGNI)?
Did I only build what was requested?
Did I follow existing patterns?
```

## V1 Enhancement

Strengthen the implementer contract with an explicit rule:

> Never rely on a plausible technical fact when it can reasonably be verified.

Material technical claims should be distinguishable as:

```text
VERIFIED
INFERRED
UNSUPPORTED
```

This applies especially to:

* APIs,
* library capabilities,
* configuration options,
* framework behavior,
* file paths,
* repository conventions,
* dependency versions.

Do not require verbose evidence tagging for every trivial statement.

Use it when a claim materially affects implementation.

---

# 10. Per-Task Independent Review

Path:

```text
skills/subagent-driven-development/task-reviewer-prompt.md
```

## Current Responsibility

Each substantive task gets independent review for:

1. spec compliance,
2. code/task quality.

The reviewer receives:

* task brief,
* global constraints,
* implementer report,
* diff/review package.

The reviewer is explicitly told not to trust the implementer report blindly.

## Existing Simplicity Controls

The current rubric already checks:

* extra functionality,
* overengineering,
* unneeded nice-to-haves,
* DRY without premature abstraction.

## Existing Evidence Controls

The reviewer already:

* verifies claims against the diff,
* cites evidence,
* reports unverifiable requirements,
* limits broader codebase exploration to named risks.

## V1 Enhancement

Make two checks first-class and explicit.

### Hallucination / Unsupported Assumption Check

Ask:

* Does every claimed API/method/config/file/version actually exist?
* Is behavior being inferred from memory instead of verified?
* Were repository patterns invented?
* Were requirements invented?
* Are tests being claimed to cover behavior they do not cover?
* Is an implementation based on a capability unsupported by the project’s actual dependency version?

Where useful classify:

```text
VERIFIED
INFERRED
UNSUPPORTED
```

### Simplicity / Overengineering Check

Ask:

> Can this be materially simpler while still fully meeting the requirement?

Look for:

* premature abstraction,
* unnecessary interfaces,
* unnecessary factories,
* unnecessary service layers,
* excessive indirection,
* unnecessary dependencies,
* speculative extensibility,
* duplicate concepts,
* configuration added for hypothetical future needs,
* clever code where obvious code would work.

Reviewers must be allowed to say:

> This is technically valid but unnecessarily complicated. Simplify it.

But a merely different stylistic preference is not enough to block progress.

---

# 11. Final Code Review: `requesting-code-review`

Paths:

```text
skills/requesting-code-review/SKILL.md
skills/requesting-code-review/code-reviewer.md
```

## Current Responsibility

Used for major work and whole-branch review.

Current checks include:

* plan alignment,
* code quality,
* architecture,
* testing,
* security,
* production readiness,
* integration with surrounding code.

## V1 Enhancement

Make the final reviewer explicitly answer:

```text
1. Is any material technical claim unsupported
   by source, tests, spec, or authoritative docs?

2. Is any part materially more complex than required?

3. Is there a simpler clean solution whose absence
   creates enough maintenance/correctness/security cost
   to justify blocking merge?
```

Do not block merely because the reviewer can imagine a different design.

---

# 12. Receiving Review: `receiving-code-review`

Path:

```text
skills/receiving-code-review/SKILL.md
```

## Current Responsibility

This skill already prevents blind obedience to reviewers.

Current pattern:

```text
Read
→ understand
→ verify against codebase reality
→ evaluate for this codebase
→ accept or push back
→ implement with tests
```

It already contains YAGNI checks for reviewer suggestions.

## V1 Relevance

This is the closest existing pattern to the intended **SA synthesis/adjudication role**.

Codex is not the final authority.

When Codex raises a finding, SA should:

1. understand it,
2. verify it where practical,
3. compare it to user intent and approved spec,
4. accept, reject, or modify it,
5. escalate to the user only when a material decision truly remains unresolved.

Preference-based redesign should be rejected.

Evidence-backed material risk should be addressed.

---

# 13. Verification: `verification-before-completion`

Path:

```text
skills/verification-before-completion/SKILL.md
```

## Existing Core Rule

```text
NO COMPLETION CLAIMS WITHOUT
FRESH VERIFICATION EVIDENCE
```

The current gate requires:

1. identify what proves the claim,
2. run it,
3. inspect output and exit status,
4. verify the evidence supports the claim,
5. only then state success.

It already rejects:

* “should pass,”
* stale test results,
* trusting agent reports,
* partial verification,
* assuming tests prove all requirements.

## V1 Implication

Do not build a second verification framework.

Extend the same philosophy earlier in the lifecycle:

```text
Evidence before confidence.
```

Design/spec/review claims should also distinguish verified repository facts from inference.

---

# 14. Final Integration: `finishing-a-development-branch`

Path:

```text
skills/finishing-a-development-branch/SKILL.md
```

## Current Responsibility

```text
Run full tests
    ↓
Detect environment
    ↓
Confirm base branch
    ↓
Present integration options
    ├─ merge
    ├─ PR
    └─ keep branch
```

## V1 Implication

No major change is required.

Multi-agent reasoning and review should finish before this stage.

---

# 15. Alternate Execution: `executing-plans`

Path:

```text
skills/executing-plans/SKILL.md
```

This is a lower-capability/fallback execution path.

It:

* loads and critically reviews the plan,
* executes sequentially,
* runs specified verification,
* stops rather than guessing,
* hands off to branch finishing.

V1’s richest Claude + Codex orchestration will naturally target the subagent-capable path.

Shared standards should still degrade gracefully when Codex is unavailable.

The generic Superpowers workflow must not become unusable merely because the Codex plugin is absent.

---

# 16. Bug-Fix Path: `systematic-debugging`

Path:

```text
skills/systematic-debugging/SKILL.md
```

Bugs follow a separate process:

```text
Reproduce
→ gather evidence
→ root cause
→ pattern analysis
→ hypothesis
→ failing test
→ minimal fix
→ verify
```

Existing strengths include:

* evidence first,
* no guessing,
* minimal hypotheses,
* root-cause focus,
* no “while I’m here” refactoring,
* architecture escalation after repeated failed fixes.

## V1 Implication

Do not force every bug through the full brainstorm/spec process.

Possible future Codex roles include:

* adversarial root-cause review,
* independent challenge after repeated failed hypotheses,
* review of high-risk fixes.

These are not required for the first V1 implementation unless needed for consistency.

---

# 17. Skill Modification Discipline: `writing-skills`

Path:

```text
skills/writing-skills/SKILL.md
```

Superpowers treats skill changes as behavioral changes.

The existing philosophy is effectively TDD for process documentation:

```text
Pressure scenario
→ observe baseline behavior
→ minimally modify skill
→ verify behavior changes
→ close loopholes
```

V1 must follow this principle.

Do not edit several skill files and assume behavior improved.

Representative pressure scenarios should include:

### Overengineering temptation

Agent proposes:

```text
interface
→ adapter
→ service
→ factory
→ configuration layer
```

for a requirement that could be solved cleanly with one small module.

Expected behavior:

* reviewer identifies unnecessary complexity,
* simpler solution is preferred.

### Hallucinated API

Agent confidently plans around a nonexistent or unsupported API/configuration option.

Expected behavior:

* unsupported claim is caught before implementation or merge,
* source/docs verification is requested.

### Codex false positive

Codex proposes technically valid but unnecessary redesign.

Expected behavior:

* SA verifies,
* rejects preference-only redesign,
* preserves approved intent.

### High-risk routing

Security/data/architecture change.

Expected behavior:

* stronger implementation/review path selected.

### Low-risk routing

Small mechanical change.

Expected behavior:

* no expensive committee workflow,
* simple implementation path used.

### Review-loop control

Claude and Codex disagree.

Expected behavior:

* SA adjudicates,
* targeted follow-up only when material,
* no recursive debate.

---

# 18. Current Strengths to Preserve

V1 must not weaken the following.

## User Intent Is Authoritative

The user approves design/spec before implementation planning.

## Design Gates Implementation

No code before design approval.

## Evidence Already Matters

Completion claims require verification.

## Simplicity Is Already Core

Existing skills enforce:

* YAGNI,
* minimal implementation,
* no unrelated refactoring,
* DRY without premature abstraction,
* rejection of unnecessary extras.

## Independent Review Already Exists

Implementer self-review does not replace independent review.

## Reviewer Feedback Is Not Automatically Authoritative

Feedback should be verified and challenged when appropriate.

## Review Loops Are Bounded

Existing fix-loop breaker behavior should remain.

## Model Capability Routing Already Exists

Adapt it.

Do not build a competing system.

---

# 19. Gaps V1 Actually Needs to Fill

## Gap 1 — No Independent Design-Stage Multi-Perspective Review

Needed:

```text
Claude constructive review
+
Codex adversarial review
→ SA synthesis
```

## Gap 2 — No Explicit Cross-Model Written-Spec Review

The written spec currently gets self-review and user review, but not deliberate independent adversarial technical review.

## Gap 3 — Hallucination Checks Are Distributed

The existing system reduces hallucinations but lacks one explicit shared rubric for:

```text
VERIFIED
INFERRED
UNSUPPORTED
```

## Gap 4 — Simplicity Checks Can Be Buried

YAGNI exists throughout the framework, but V1 wants a direct:

> Am I overengineering this?

gate during spec and code review.

## Gap 5 — Model Routing Is Generic

Current model routing is capability-tier based.

V1 adds deliberate role asymmetry:

```text
SA / primary Claude
    → intent, orchestration, synthesis

Claude subagent
    → constructive/contextual reasoning

Codex
    → adversarial review
    → high-value/high-risk implementation

Sonnet
    → routine/mechanical implementation
```

## Gap 6 — Codex Is Supported as a Runtime, Not Yet as Claude’s Collaborator

Superpowers already runs under Codex.

V1 instead needs a Claude Code workflow that deliberately delegates selected reasoning/review/implementation work to Codex through the official Claude Code Codex plugin.

---

# 20. Proposed V1 Mapping

```text
using-superpowers
    ↓
brainstorming
    ├─ existing exploration
    ├─ existing clarification
    ├─ approaches
    ├─ candidate design
    │
    ├─ NEW: DESIGN REVIEW GATE
    │      Claude constructive review
    │      + Codex adversarial review
    │      → SA synthesis
    │      → targeted repeat only if material
    │
    ├─ write design/spec
    ├─ existing self-review
    │
    ├─ NEW: WRITTEN SPEC REVIEW GATE
    │      unsupported assumptions
    │      hallucinations
    │      simplicity / overengineering
    │      completeness
    │      acceptance criteria
    │      testability
    │      → SA synthesis
    │
    └─ user approves canonical spec
          ↓
writing-plans
    ├─ existing plan generation
    └─ existing self-review
          ↓
using-git-worktrees
          ↓
subagent-driven-development
    │
    ├─ MODIFY existing model routing
    │      high-value/high-risk → Codex
    │      routine/mechanical → Sonnet
    │
    ├─ existing implementation evidence
    │
    ├─ MODIFY reviewer rubric
    │      explicit hallucination check
    │      explicit simplicity check
    │
    ├─ existing bounded fix/re-review
    │
    └─ existing final whole-branch review
          ↓
verification-before-completion
          ↓
finishing-a-development-branch
```

---

# 21. Likely V1 Touchpoints

Likely existing files to inspect and potentially modify:

```text
skills/brainstorming/SKILL.md

skills/subagent-driven-development/SKILL.md
skills/subagent-driven-development/implementer-prompt.md
skills/subagent-driven-development/task-reviewer-prompt.md

skills/requesting-code-review/code-reviewer.md
```

Potentially:

```text
skills/writing-plans/SKILL.md
skills/receiving-code-review/SKILL.md
```

only where behavioral testing demonstrates a need.

A small reusable review standard may be useful.

Conceptually:

```text
skills/<evidence-and-simplicity-review>/
    SKILL.md
```

or a shared supporting rubric referenced by existing review skills.

The exact structure and name should follow `skills/writing-skills/SKILL.md`.

Do not assume a new standalone specification skill is necessary.

---

# 22. V1 Non-Goals

Do not add:

```text
CodeGraph

custom Codex MCP orchestration

persistent reviewer agents

external memory integration

NotebookLM integration

Obsidian / Karpathy Wiki integration

automated model voting

complex judge models

complex numeric risk scoring

unbounded review loops

large repository restructuring
```

These may be reconsidered after V1 produces real usage evidence.

---

# 23. Recommended Next Step

Before modifying skills:

1. Read `V1-IMPLEMENTATION-BRIEF.md`.
2. Confirm the official Codex Claude Code plugin integration available in the target environment.
3. Define exact behavioral contracts for:

   * design review,
   * written-spec review,
   * Codex implementation delegation,
   * Codex code review,
   * SA synthesis/adjudication.
4. Build pressure/evaluation scenarios.
5. Capture baseline behavior.
6. Implement one stage at a time.
7. Start with the smallest useful change to `brainstorming`.
8. Test before moving to implementation routing.

Default architectural hypothesis:

> **Preserve Superpowers. Extend its existing workflow rather than building a new orchestration platform beside it.**

The V1 fork should feel like:

> **Superpowers with stronger multi-model reasoning discipline.**

Not:

> a separate multi-agent framework bolted onto Superpowers.
