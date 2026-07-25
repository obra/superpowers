# Superpowers Fork — V1 Multi-Agent Workflow Implementation Brief

## Mission

Adapt this Superpowers fork so Claude Code and OpenAI Codex collaborate deliberately at the stages where independent reasoning adds meaningful value.

The objective is **not** to build a general multi-agent platform.

The objective is to improve:

* design quality,
* specification quality,
* implementation quality,
* hallucination detection,
* simplicity,
* independent review,
* evidence-based completion,

while preserving Superpowers’ existing strengths.

Core principles:

> **Evidence before confidence.**

> **Simple before clever.**

> **Verify before merge.**

And:

> **Prefer the smallest change that produces the intended behavioral improvement.**

Read `WORKFLOW-MAP.md` before modifying the repository.

---

# 1. Important Existing Architecture

Do not assume the conceptual workflow discussed externally maps directly to current skill names.

Current Superpowers v6.2.0 effectively does:

```text
brainstorming
    → develops design
    → writes design/spec
    → self-reviews spec
    → user approves spec

writing-plans
    → creates detailed implementation plan

subagent-driven-development
    → implements
    → independently reviews
    → fixes/re-reviews
    → final whole-branch review
```

Therefore:

> `writing-plans` is not the spec-writing stage.

For V1, default to keeping **Brainstorm** and **Written Spec** as two clearly separated internal gates inside the existing `brainstorming` workflow.

Do not create a new standalone specification skill unless behavioral testing proves it is necessary.

---

# 2. Target V1 Workflow

```text
USER
  │
  ▼
SA / PRIMARY CLAUDE
Intent + orchestration
  │
  ▼
BRAINSTORM / DESIGN
  │
  ├── SA explores with user
  │
  ├── SA captures candidate design
  │
  ├── Claude Agent → constructive review
  │
  ├── Codex → adversarial review
  │
  └── SA → evidence-based synthesis
         │
         ├── material unresolved issue? → targeted repeat
         │
         ▼
   APPROVED DESIGN
         │
         ▼
WRITTEN SPEC
  │
  ├── SA/Claude writes spec
  │
  ├── existing self-review
  │
  ├── Codex adversarial/completeness review
  │
  └── SA synthesis
         │
         ▼
   CANONICAL SPEC
         │
         ▼
IMPLEMENTATION PLAN
   existing writing-plans workflow
         │
         ▼
IMPLEMENTATION ROUTING
      ┌──┴────────────────┐
      ▼                   ▼
HIGH-VALUE / RISK     ROUTINE / MECHANICAL
      │                   │
Codex implements      Sonnet implements
      │                   │
      └───────┬───────────┘
              ▼
    automated verification
              │
              ▼
     independent review
              │
      hallucination check
      simplicity check
      spec compliance
              │
              ▼
       fix / re-review
       existing bounded loop
              │
              ▼
        final verification
              │
              ▼
             DONE
```

---

# 3. Agent Roles

## 3.1 SA / Primary Claude Code Agent

SA owns:

* user intent,
* conversation,
* orchestration,
* stage transitions,
* synthesis,
* adjudication,
* final decisions,
* acceptance.

SA is not merely a judge between models.

SA owns the canonical understanding of what the user is trying to achieve.

When Claude and Codex disagree, SA must:

1. inspect the actual disagreement,
2. verify load-bearing factual claims where practical,
3. compare recommendations to approved user intent,
4. accept, reject, or modify findings,
5. escalate to the user only when a material unresolved decision genuinely remains.

Do not use majority voting.

Do not assume Codex is correct because it is adversarial.

Do not assume Claude is correct because it owns context.

---

## 3.2 Claude Subagent

Primary role:

> Constructive reasoning.

Use Claude to:

* expand incomplete ideas,
* identify missing possibilities,
* improve coherence,
* protect user intent,
* identify important implications,
* propose cleaner architecture,
* improve specification completeness.

Claude should generally ask:

> How can this design be made complete, coherent, practical, simple, and aligned with the user’s intent?

Claude is not primarily the hostile reviewer.

---

## 3.3 Codex

Codex has deliberately different roles depending on stage.

### During design/spec review

Primary role:

> Adversarial technical challenge.

Look for:

* unsupported assumptions,
* hallucinations,
* failure modes,
* hidden constraints,
* missing edge cases,
* technical infeasibility,
* unnecessary complexity,
* simpler alternatives,
* invented requirements,
* claims that require verification.

### During high-value/high-risk implementation

Primary role:

> Implementation owner.

Implement the canonical plan/spec without reopening broad ideation unless new evidence proves the approved design is invalid.

### During review of Sonnet-authored work

Primary role:

> Independent adversarial code reviewer.

---

## 3.4 Sonnet

Primary role:

> Economical implementation of routine, well-specified work.

Examples:

* simple CRUD,
* straightforward UI changes,
* boilerplate,
* low-risk configuration,
* small isolated refactors,
* routine tests,
* mechanical implementation from a precise plan.

Do not route work to Sonnet merely because it is cheaper if the task materially requires architectural judgment.

---

# 4. Codex Integration for V1

Use the official Claude Code Codex plugin available in the target environment.

Do **not** build custom MCP orchestration in V1.

The workflow should conceptually support these operations:

```text
request Codex adversarial design review

request Codex written-spec review

delegate high-value implementation to Codex

request Codex code review
```

Avoid scattering duplicated giant Codex prompts throughout multiple skills.

Prefer one reusable conceptual contract or shared rubric where it fits the existing Superpowers conventions.

Do not create a large abstraction layer merely to hide a command name.

The code/process should remain simple enough to migrate to `codex mcp-server` later if genuine limitations emerge.

---

# 5. Shared Review Philosophy

Where practical, centralize or consistently reuse the following standards.

Do not create duplicative review systems.

---

## 5.1 Evidence Check

Technical claims should be grounded in one or more of:

* repository source code,
* tests,
* approved spec,
* observed command output,
* authoritative documentation.

Where useful, classify a material claim as:

```text
VERIFIED
INFERRED
UNSUPPORTED
```

Definitions:

### VERIFIED

Supported directly by inspected evidence.

Example:

```text
VERIFIED:
package.json uses library X version Y.
```

### INFERRED

Reasonable conclusion from available evidence but not directly proven.

Example:

```text
INFERRED:
this appears to be the preferred repository pattern
because three similar modules use it.
```

### UNSUPPORTED

Stated as fact without sufficient evidence.

Example:

```text
UNSUPPORTED:
framework X supports configuration option Y.
```

Do not turn every review into a verbose evidence ledger.

Apply this classification to load-bearing claims.

---

# 6. Hallucination / Unsupported Assumption Check

Explicitly check for:

* invented APIs,
* nonexistent methods,
* wrong function signatures,
* incorrect configuration keys,
* unsupported library capabilities,
* wrong framework/version assumptions,
* nonexistent files/components,
* invented repository conventions,
* invented user requirements,
* imagined test coverage,
* claims that behavior was verified when it was not,
* claims that tests passed when they were not run,
* best practices applied without relevance to this codebase.

Core rule:

> **Never trust plausible-looking technical detail when it can reasonably be verified.**

Repository claims should be checked against the repository.

External technical claims should use authoritative/primary documentation when verification matters.

---

# 7. Simplicity / Overengineering Check

Every meaningful written-spec review and code review should explicitly ask:

> **Can this be materially simpler while still fully solving the current requirement?**

Look for:

* premature abstractions,
* speculative extensibility,
* unnecessary interfaces,
* unnecessary adapters,
* unnecessary factories,
* unnecessary service layers,
* excessive indirection,
* unnecessary dependencies,
* unnecessary configuration,
* duplicated concepts,
* abstractions with one implementation and no justified need,
* clever code where obvious code would work,
* infrastructure built for hypothetical future requirements.

Core principle:

> **Prefer the simplest clean solution that fully meets the current requirement and leaves a reasonable path to change later.**

Simple does not mean crude.

Simple does not mean brittle.

Do not reduce line count at the expense of:

* correctness,
* security,
* clear boundaries,
* maintainability,
* necessary testing.

Reviewers must have permission to conclude:

> This is technically valid but unnecessarily complicated. Rewrite it more simply.

---

# 8. Scope Discipline

Reviewers must not redesign simply because they prefer another architecture.

A recommended change needs a concrete reason.

Valid reasons include:

* correctness,
* reliability,
* security,
* meaningful simplicity,
* maintainability,
* compatibility,
* actual requirements,
* consistency with established repository patterns.

Preference is not sufficient.

Codex should not turn every adversarial review into a greenfield architecture exercise.

---

# 9. Stage 1 — Design / Brainstorm Review

Modify the existing `brainstorming` workflow minimally.

Do not invoke multiple agents on every conversational turn.

Allow SA and the user to first establish a coherent candidate design.

Then:

```text
Candidate Design
      │
 ┌────┴──────────┐
 ▼               ▼
Claude          Codex
constructive    adversarial
review          review
 └────┬──────────┘
      ▼
SA synthesis
```

---

## 9.1 Claude Constructive Review Contract

Claude should check:

* user-intent alignment,
* missing requirements,
* missing possibilities,
* important implications,
* architectural coherence,
* simpler or clearer design options,
* unresolved decisions,
* testability at a high level.

Do not rewrite merely to produce a different answer.

---

## 9.2 Codex Adversarial Design Review Contract

Use a focused role equivalent to:

```text
Adversarially review this proposed design.

Look specifically for:

1. Unsupported assumptions.
2. Requirements that appear to have been invented.
3. Failure modes and important edge cases.
4. Unnecessary complexity or overengineering.
5. A materially simpler approach that achieves the same outcome.
6. Technical claims that require verification.
7. Contradictions with stated user intent.
8. Dependencies or capabilities assumed to exist without evidence.

Do not redesign merely because you prefer another architecture.

Classify findings:

BLOCKER
IMPORTANT
OPTIONAL

For material factual claims where useful:

VERIFIED
INFERRED
UNSUPPORTED
```

---

## 9.3 SA Design Synthesis

SA should:

* compare both reviews against user intent,
* verify important factual disputes,
* accept useful findings,
* reject preference-based findings,
* simplify where justified,
* surface genuinely unresolved material decisions.

Only repeat review when a **material** unresolved issue remains.

Do not recursively rerun both agents merely because optional suggestions exist.

---

# 10. Stage 2 — Written Spec Review

Once design is resolved:

```text
Approved design
    ↓
Write design/spec document
    ↓
Existing self-review
    ↓
Codex adversarial/completeness review
    ↓
SA synthesis
    ↓
Canonical spec
    ↓
User review / approval
```

For V1, do **not** routinely ask Claude and Codex to each write a complete independent spec.

That creates unnecessary merge overhead.

Default pattern:

```text
SA/Claude writes
→ Codex attacks
→ SA synthesizes
```

Parallel independent specs may be reconsidered later only for unusually consequential architectural work.

---

## 10.1 Central Spec Review Question

Codex should answer:

> **Could another competent coding agent implement this specification without making material assumptions?**

---

## 10.2 Required Spec Review Areas

```text
BLOCKERS

AMBIGUITIES

UNSUPPORTED ASSUMPTIONS

HALLUCINATIONS / UNVERIFIED TECHNICAL CLAIMS

MISSING ACCEPTANCE CRITERIA

OVERENGINEERING

SIMPLER ALTERNATIVES

MISSING EDGE CASES

MISSING TEST REQUIREMENTS

TECHNICAL CLAIMS REQUIRING VERIFICATION
```

Codex identifies issues.

SA owns the canonical rewrite/synthesis.

---

# 11. Canonical Spec Standard

Before proceeding to `writing-plans`, the spec should be:

* aligned with approved user intent,
* sufficiently explicit to implement,
* clear about acceptance criteria,
* clear about material constraints,
* clear about important tests,
* free of known unsupported assumptions,
* grounded in actual repository reality where relevant,
* no more complex than necessary.

Preferred hierarchy:

```text
Correct
→ Simple
→ Clean
→ Tested
→ Documented
```

Do not default to:

```text
Flexible
→ Abstract
→ Extensible
→ Enterprise-ready
```

unless the actual requirement justifies those properties.

---

# 12. Implementation Plan

Preserve the existing `writing-plans` workflow unless testing exposes a real gap.

Do not add an independent plan-review committee merely because design/spec got one.

The existing plan self-review already checks many useful failure modes.

A future independent plan check is justified only if real tests show frequent problems such as:

* invented interfaces,
* hallucinated APIs,
* missed spec requirements,
* overcomplicated file/task decomposition.

V1 should avoid unnecessary stages.

---

# 13. Implementation Routing

Reuse and adapt the existing SDD model-selection mechanism.

Do not create a complex scoring engine.

Use two broad classes.

---

## 13.1 High-Value / High-Risk

Prefer Codex implementation.

Signals include:

* architecture changes,
* authentication,
* authorization,
* security-sensitive code,
* payments,
* migrations,
* data integrity,
* critical business logic,
* concurrency,
* broad cross-codebase effects,
* difficult integrations,
* changes where failure would be expensive.

Flow:

```text
Canonical plan/spec
    ↓
Codex implementation
    ↓
Automated verification
    ↓
Independent SA/Claude review
    ↓
Fix / re-review as existing workflow requires
    ↓
Final verification
```

---

## 13.2 Routine / Mechanical / Lower-Risk

Prefer Sonnet or suitable cheaper Claude model.

Signals include:

* isolated changes,
* highly explicit plan,
* one or two files,
* straightforward CRUD,
* simple UI,
* boilerplate,
* routine config,
* ordinary test additions,
* mechanical refactoring.

Flow:

```text
Canonical plan/spec
    ↓
Sonnet implementation
    ↓
Automated verification
    ↓
Independent review
        Codex when risk/value warrants
    ↓
Fix / re-review
    ↓
Final verification
```

Do not skip existing mandatory Superpowers review gates.

---

# 14. Independent Review Principle

A substantive implementation should not rely solely on the same model that wrote it to decide whether it is correct.

For Codex-authored high-value work:

```text
Primary independent review
    → SA / Claude
```

For Sonnet-authored work where cross-model review is justified:

```text
Primary adversarial review
    → Codex
```

Automated tests remain independent evidence regardless of model authorship.

---

# 15. Code Review Standard

Meaningful code review should explicitly cover:

---

## Spec Compliance

* Does implementation match the canonical spec/plan?
* Were requirements omitted?
* Were requirements invented?
* Did implementation silently change scope?

---

## Correctness

* Does behavior actually work?
* Are failure paths correct?
* Are important edge cases handled?

---

## Hallucination / Unsupported Assumptions

* Are APIs/methods/configuration real?
* Are dependency/version capabilities verified?
* Are repository assumptions accurate?
* Were claimed behaviors actually tested?
* Did implementation assume conventions that do not exist?

---

## Simplicity / Overengineering

Ask directly:

> Can this be materially simpler?

Check:

* unnecessary abstractions,
* unnecessary layers,
* unnecessary interfaces,
* duplicate concepts,
* excessive indirection,
* unjustified dependencies,
* speculative flexibility,
* configuration for hypothetical needs,
* cleverness where obvious code is better.

---

## Regression Risk

* What existing behavior could be affected?
* Have important callers/dependents been considered where relevant?
* Does the change alter shared contracts?

---

## Security

* Does the change introduce meaningful security risk?
* Are authentication/authorization boundaries preserved?
* Is sensitive data handled correctly?

---

## Test Quality

* Do tests validate actual behavior?
* Do tests merely validate mocks or implementation detail?
* Are required failure paths covered?
* Does reported test evidence correspond to the code being reviewed?

---

## Documentation

* Is non-obvious necessary behavior documented?
* Are material architectural choices recorded where justified?
* Is documentation being used to explain necessary complexity rather than excuse unnecessary complexity?

---

## Required Changes

Use existing severity conventions where possible.

Clearly distinguish:

```text
BLOCKER / CRITICAL

IMPORTANT

OPTIONAL / MINOR
```

Do not bury mandatory fixes among stylistic suggestions.

---

# 16. Reviewer Permission to Reject Complexity

Explicitly allow a reviewer to report:

> **This implementation meets the literal requirement but is unnecessarily complicated. Simplify it.**

This should be blocking only when the excess complexity creates a meaningful cost such as:

* maintainability damage,
* increased bug surface,
* unnecessary coupling,
* unnecessary dependencies,
* increased security risk,
* substantial cognitive overhead.

Do not block merely because an alternative style is marginally shorter.

---

# 17. Review Synthesis / Adjudication

Review findings are inputs, not commands.

SA must apply the principles already present in `receiving-code-review`.

For each material finding:

```text
UNDERSTAND
    ↓
VERIFY
    ↓
COMPARE TO SPEC / USER INTENT
    ↓
ACCEPT
or
MODIFY
or
REJECT WITH REASON
or
ESCALATE
```

Never blindly implement Codex suggestions.

Never dismiss Codex merely because its suggestion conflicts with the current implementation.

Evidence governs.

---

# 18. Verification Gate

Preserve the existing `verification-before-completion` hard gate.

No agent may claim:

```text
"This should work."

"Probably fixed."

"Tests should pass."

"Looks complete."
```

without fresh supporting evidence.

Completion requires the appropriate evidence for the project, such as:

* relevant tests run and pass,
* type checking passes,
* lint passes,
* build passes,
* required behavior exercised,
* review blockers resolved,
* requirements checked against canonical plan/spec.

Core rule:

> **Never claim a check passed unless it was actually run and its result observed.**

---

# 19. Decision Records

V1 may add a lightweight convention for material decisions.

Do not build a database or external memory system.

Suggested location:

```text
docs/decisions/
```

Suggested format:

```markdown
# Decision

## Context

## Options considered

## Claude perspective

## Codex challenge

## Decision

## Why

## Revisit when
```

Create records only for decisions worth remembering.

Examples:

* database choice,
* architecture boundary,
* major dependency selection,
* security model,
* consequential tradeoff.

Do not create records for trivial implementation details.

Decision records are optional in the first implementation if adding them would broaden scope.

---

# 20. V1 Non-Goals

Explicitly do **not** implement:

```text
CodeGraph

custom Codex MCP orchestration

persistent independent reviewer agents

external memory integration

NotebookLM integration

Obsidian / Karpathy Wiki integration

automated model voting

complex judge models

complex numeric risk scoring

large orchestration framework

unbounded agent review loops

large repository architecture rewrite
```

Do not solve hypothetical V2 problems.

---

# 21. Likely Files to Inspect / Modify

Start by inspecting these existing files:

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

only if tests show they need changes.

A reusable shared review standard may be appropriate.

Do not predetermine its exact name or structure.

Follow:

```text
skills/writing-skills/SKILL.md
```

for skill authoring conventions.

---

# 22. Required Implementation Discipline

Do not make broad edits immediately.

Follow this order.

---

## Step 1 — Read Existing Workflow

Read:

```text
WORKFLOW-MAP.md
```

Then inspect the actual current skill files.

Repository code is authoritative over this brief if upstream structure has changed.

---

## Step 2 — Confirm Codex Integration

Verify how the official Codex Claude Code plugin is actually invoked in the target environment.

Do not invent commands or assume remembered syntax.

Use actual installed plugin capabilities and authoritative documentation where needed.

Record any limitations that materially affect the design.

---

## Step 3 — Define Behavioral Contracts

Before editing, define the exact behavior expected for:

1. constructive design review,
2. adversarial design review,
3. SA synthesis,
4. adversarial written-spec review,
5. high-risk implementation delegation,
6. independent code review,
7. evidence/hallucination checking,
8. simplicity checking.

Keep contracts concise.

---

## Step 4 — Build Baseline Pressure Scenarios

Follow the existing `writing-skills` philosophy.

Capture how vanilla behavior performs before modification.

At minimum test scenarios for:

### Scenario A — Overengineering

A simple requirement tempts the model to create unnecessary architecture.

Measure whether current workflow catches it.

### Scenario B — Hallucinated Technical Capability

A plausible but nonexistent API/configuration is introduced.

Measure when it gets caught.

### Scenario C — Adversarial False Positive

Reviewer recommends unnecessary redesign.

Measure whether controller accepts it blindly.

### Scenario D — High-Risk Routing

Security/data/architecture change.

Expected future behavior: Codex implementation route.

### Scenario E — Low-Risk Routing

Small mechanical task.

Expected future behavior: economical path without needless committee overhead.

### Scenario F — Model Disagreement

Claude and Codex disagree materially.

Expected future behavior: SA evidence-based adjudication, not voting.

---

# 23. Implementation Order

Implement one stage at a time.

---

## Phase 1 — Design Review Gate

Modify `brainstorming` minimally to introduce:

```text
candidate design
→ Claude constructive review
+ Codex adversarial review
→ SA synthesis
```

Do not yet modify implementation routing.

Test this behavior.

Check:

* Does review happen only after coherent design exists?
* Does Codex find useful issues?
* Does Claude add complementary value?
* Does SA reject weak suggestions?
* Does the loop terminate cleanly?
* Is user intent preserved?
* Is token/process overhead reasonable?

Do not proceed until behavior is acceptable.

---

## Phase 2 — Written Spec Review Gate

Add:

```text
written spec
→ existing self-review
→ Codex adversarial/completeness review
→ SA synthesis
→ canonical spec
```

Test:

* hallucinated claims,
* missing acceptance criteria,
* ambiguity,
* unnecessary complexity,
* invented requirements,
* unimplementable assumptions.

Do not routinely generate two complete independent specs.

---

## Phase 3 — Shared Review Enhancements

Integrate explicit:

```text
Hallucination / Unsupported Assumption Check

Simplicity / Overengineering Check
```

into the smallest number of existing review surfaces necessary.

Avoid copying large duplicated rubrics everywhere.

Preserve existing:

* spec compliance,
* code quality,
* evidence,
* severity,
* review-package workflow.

---

## Phase 4 — Implementation Routing

Adapt the existing SDD model-selection logic.

Add explicit role awareness:

```text
high-value/high-risk
    → Codex

routine/mechanical
    → Sonnet / suitable cheaper Claude
```

Do not build numeric scoring.

Test routing against representative tasks.

---

## Phase 5 — Independent Review Routing

Ensure implementation authorship and review are appropriately independent.

Codex-written high-value work:

```text
→ SA/Claude review
```

Sonnet-written work where cross-model challenge is justified:

```text
→ Codex review
```

Preserve existing reviewer/fix-loop mechanics wherever possible.

---

## Phase 6 — Final Verification

Confirm existing verification behavior still works.

Do not weaken:

```text
verification-before-completion
```

or:

```text
finishing-a-development-branch
```

---

# 24. Acceptance Tests for V1

Run representative real tasks.

At minimum:

```text
1. Small bug fix

2. Simple feature

3. Cross-file feature

4. Architectural change

5. Ambiguous requirement

6. Task likely to trigger API/library hallucination

7. Task where overengineering is tempting

8. Security or data-sensitive change

9. Mechanical low-risk task

10. Scenario where Codex gives a plausible but bad recommendation
```

Compare behavior against vanilla Superpowers where practical.

Evaluate:

* Did Codex identify genuine issues?
* Did it create noise?
* Did Claude provide genuinely complementary reasoning?
* Did SA reject weak recommendations correctly?
* Were unsupported assumptions caught earlier?
* Were hallucinations caught before merge?
* Was overengineering reduced?
* Was simpler code preferred appropriately?
* Did implementation quality improve?
* Did expensive review happen only when useful?
* Did loops terminate?
* Did user intent remain authoritative?
* Did existing Superpowers strengths remain intact?

---

# 25. Definition of Done for V1

V1 is complete when:

* existing Superpowers workflow remains usable;
* candidate designs can receive constructive Claude + adversarial Codex review;
* SA owns synthesis and final decisions;
* written specs receive independent adversarial/completeness review;
* hallucination/unsupported-assumption checks are explicit;
* simplicity/overengineering checks are explicit;
* high-value/high-risk implementation can route to Codex;
* routine/mechanical work can route economically to Sonnet;
* implementation gets independent review appropriate to authorship/risk;
* existing bounded fix loops remain intact;
* completion still requires fresh verification evidence;
* generic Superpowers behavior degrades gracefully when Codex is unavailable;
* no CodeGraph has been added;
* no custom MCP orchestration has been added;
* no complex risk engine has been added;
* no unnecessary new top-level workflow architecture has been introduced;
* behavioral tests demonstrate actual improvement.

---

# 26. Final Design Constraint

The final result should feel like:

> **Superpowers with stronger reasoning discipline and deliberate asymmetric collaboration between Claude and Codex.**

It should not feel like:

> **a new multi-agent framework that happens to contain Superpowers.**

When uncertain between a sophisticated architecture and a smaller change:

1. verify what the current system already provides;
2. identify the actual missing behavior;
3. implement the smallest change that fills that gap;
4. test it;
5. add complexity only when evidence justifies it.
