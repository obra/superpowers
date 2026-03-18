# Review Accelerator Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-18-review-accelerator-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add an explicit user-initiated accelerated review mode for `superpowers:plan-ceo-review` and `superpowers:plan-eng-review` that uses reviewer subagents, preserves human approval authority, persists section packets, and updates the documented workflow in `README.md`.

**Architecture:** Keep the feature inside the existing CEO and ENG review skills by editing their `SKILL.md.tmpl` sources and regenerating checked-in `SKILL.md` files. Factor the subagent guidance into prompt assets, keep all authoritative writes with the main review agent, and verify the new contract through deterministic shell tests plus an opt-in prompt eval that checks activation and approval boundaries.

**Tech Stack:** Generated skill docs from `SKILL.md.tmpl`, markdown prompt assets, root README Mermaid diagrams, shell regression tests, Node skill-doc tests, opt-in eval tests

---

## What Already Exists

- `skills/plan-ceo-review/SKILL.md.tmpl` and `skills/plan-eng-review/SKILL.md.tmpl` already own the human review loops, approval headers, and terminal handoffs for spec and plan review.
- `scripts/gen-skill-docs.mjs` already regenerates checked-in `skills/*/SKILL.md` from the editable `.tmpl` sources and is validated by `node scripts/gen-skill-docs.mjs --check`.
- `skills/subagent-driven-development/` already contains prompt assets for subagent orchestration, so this repo has an established place for reusable reviewer-prompt content.
- `review/` already holds shared review-owned references like `review/checklist.md` and `review/TODOS-format.md`, so it is the natural home for a shared review-accelerator packet contract.
- `README.md` already documents the authoritative workflow state machine and Mermaid diagrams that the runtime and skills are expected to match.
- `tests/codex-runtime/test-workflow-sequencing.sh`, `tests/codex-runtime/test-runtime-instructions.sh`, and `tests/codex-runtime/test-workflow-enhancements.sh` already guard workflow contracts, generated-doc freshness, runtime asset presence, and README wording.
- `tests/evals/interactive-question-format.eval.mjs` and `tests/evals/README.md` already define the pattern for prompt-quality eval coverage on high-risk workflow instructions.

## Planned File Structure

- Create: `review/review-accelerator-packet-contract.md`
  Shared packet contract and reviewer-output reference used by both accelerated review skills.
- Create: `skills/plan-ceo-review/accelerated-reviewer-prompt.md`
  CEO-stage reviewer persona and section-packet drafting instructions.
- Create: `skills/plan-eng-review/accelerated-reviewer-prompt.md`
  ENG-stage reviewer persona and `SMALL CHANGE` / QA-handoff-aware drafting instructions.
- Create: `tests/evals/review-accelerator-contract.eval.mjs`
  Opt-in prompt eval for explicit activation, per-section approval, and human-only authority boundaries.
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
  Add accelerated review activation, section handling, fallback behavior, and prompt-asset references.
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
  Add accelerated review activation, `BIG CHANGE` / `SMALL CHANGE` handling, preserved outputs, QA handoff retention, and prompt-asset references.
- Modify: generated `skills/plan-ceo-review/SKILL.md` via `node scripts/gen-skill-docs.mjs`
- Modify: generated `skills/plan-eng-review/SKILL.md` via `node scripts/gen-skill-docs.mjs`
- Modify: `README.md`
  Update workflow explanation and Mermaid diagrams so accelerated review appears as an opt-in branch inside CEO and ENG review, not a new stage.
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
  Add deterministic assertions for explicit activation markers, section-packet approvals, preserved outputs, and main-agent-only writes.
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
  Require the new prompt/reference assets to exist and keep generated-skill freshness checks in the loop.
- Modify: `tests/evals/README.md`
  Document the new accelerator-specific prompt eval and when to run it.

## Not In Scope

- Any new runtime helper command or manifest schema inside `bin/superpowers-workflow-status`.
- Automatic or heuristic activation of accelerated review.
- Changing who owns approval authority or who writes approval headers.
- Extending acceleration mode into brainstorming, writing-plans, execution, QA-only, code review, or branch-finishing flows.
- Public CLI/status surfaces for accelerator packets beyond the persisted artifacts already described in the approved spec.
- Release-notes or versioning work unless the implementation ends up shipping user-visible behavior that now requires it.

## Implementation Notes

- Use `superpowers:writing-skills` before editing the review-skill templates so the generated-doc workflow and skill-authoring constraints stay front and center.
- Follow `superpowers:test-driven-development` for the deterministic shell-test portion of the work: add red contract assertions first, then update prompt assets and templates, then rerun the suites to green.
- Edit only `SKILL.md.tmpl` sources by hand. Regenerate `SKILL.md` artifacts with `node scripts/gen-skill-docs.mjs`; never hand-edit the generated files.
- Keep the accelerated packet schema, main-agent-only write authority, and section-boundary rules DRY by putting the shared packet contract in `review/review-accelerator-packet-contract.md` and referencing it from both review skills.
- Do not change the helper-backed artifact router. The behavior lives in the skill instructions, persisted markdown artifacts under `~/.superpowers/projects/<slug>/...`, and README documentation.
- Keep ENG `SMALL CHANGE` compressed by reviewer depth only: one primary issue per canonical ENG section, but still one packet and one approval checkpoint per section.
- For prompt/eval coverage, preserve the existing `interactive-question-format` eval and add a focused accelerator eval rather than inventing a broader evaluation framework.

## Diagrams

### Implementation Surface

```text
skills/plan-ceo-review/SKILL.md.tmpl ----+
                                         +--> node scripts/gen-skill-docs.mjs
skills/plan-eng-review/SKILL.md.tmpl ----+             |
                                                       v
                        generated skills/plan-*/SKILL.md updated contract
                                                       |
                 +-------------------------------------+------------------+
                 |                                                        |
                 v                                                        v
shared reviewer prompt/reference assets                        README.md workflow diagrams
                 |                                                        |
                 +------------------------------+-------------------------+
                                                |
                                                v
                              deterministic shell tests + opt-in prompt eval
```

### Test Review Diagram

```text
explicit user request
   |
   +--> includes accelerated/accelerator marker?
   |         |
   |         +--> no  --> normal CEO/ENG review wording remains unchanged
   |         |
   |         +--> yes --> accelerated mode instructions available
   |
   +--> reviewer prompt asset exists?
   |         |
   |         +--> no  --> runtime contract test fails
   |         |
   |         +--> yes --> template can reference shared packet contract
   |
   +--> CEO accelerated section flow
   |         |
   |         +--> direct human escalations
   |         +--> per-section approval
   |         +--> final human approval
   |
   +--> ENG accelerated section flow
   |         |
   |         +--> SMALL CHANGE keeps one primary issue per section
   |         +--> QA handoff still generated
   |         +--> normal execution handoff still preserved
   |
   +--> README / Mermaid docs align with shipped skill behavior
   |
   +--> prompt eval confirms human-only activation and approval authority
```

## Failure Modes

| Codepath | Realistic failure | Test? | Error handling? | User sees? |
| --- | --- | --- | --- | --- |
| `skills/plan-ceo-review/SKILL.md.tmpl` | accelerated mode can be inferred from vague wording like "make this fast" | Y | Y | explicit contract in docs/tests rejects ambiguous activation |
| `skills/plan-eng-review/SKILL.md.tmpl` | accelerated `SMALL CHANGE` silently collapses into one bundled approval round | Y | Y | deterministic workflow test catches section-approval regression |
| prompt assets | referenced reviewer prompt file is missing or renamed | Y | Y | runtime-instructions asset check fails before merge |
| generated `SKILL.md` docs | template changes land without regeneration | Y | Y | `node scripts/gen-skill-docs.mjs --check` fails |
| `README.md` | Mermaid diagram drifts and implies a separate workflow stage or automatic approval | Y | Y | workflow sequencing/docs tests fail |
| prompt-quality behavior | shell tests pass but prompts still leave room for agent-initiated acceleration or silent approval drift | Y | Y | accelerator eval fails with a focused contract summary |

No critical gap remains in this plan if the tests below are implemented exactly as written.

## Task 1: Add Red Coverage For The Accelerated Review Contract

**Files:**
- Create: `tests/evals/review-accelerator-contract.eval.mjs`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/evals/README.md`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [x] **Step 1: Add failing activation-marker assertions to `test-workflow-sequencing.sh`**
```bash
# Add require_pattern checks for:
# - explicit `accelerated` / `accelerator` activation markers in both review skills
# - invalid activation sources such as heuristic or agent-only activation
```

- [x] **Step 2: Add failing section-approval and write-authority assertions to `test-workflow-sequencing.sh`**
```bash
# Add require_pattern checks for:
# - section-packet / per-section approval language in both review skills
# - preserved CEO/ENG required outputs in accelerated mode
# - main-agent-only write authority
# - ENG `SMALL CHANGE` one-primary-issue-per-section behavior
# - persisted packet path under ~/.superpowers/projects/<slug>/...
# - resume allowed only from the last approved-and-applied section boundary
# - stale packet regeneration when the source artifact fingerprint changes
# - bounded retention language for accelerator artifacts
# - README wording that acceleration is opt-in and not a separate workflow stage
```

- [x] **Step 3: Extend runtime asset validation to cover the new prompt/reference files and their key contract strings**
```bash
# Add these files to FILES in tests/codex-runtime/test-runtime-instructions.sh:
"review/review-accelerator-packet-contract.md"
"skills/plan-ceo-review/accelerated-reviewer-prompt.md"
"skills/plan-eng-review/accelerated-reviewer-prompt.md"

# Add require_pattern checks in tests/codex-runtime/test-runtime-instructions.sh for:
# review/review-accelerator-packet-contract.md
# - "required packet fields"
# - "fail-closed validation rule"
# - "main-agent-only write authority"
# - "source artifact fingerprint"
# - "approved-and-applied"
# - "bounded retention"
# skills/plan-ceo-review/accelerated-reviewer-prompt.md
# - "Return a structured section packet only."
# - "Do not approve anything."
# - "Do not write files."
# skills/plan-eng-review/accelerated-reviewer-prompt.md
# - "Respect BIG CHANGE vs SMALL CHANGE."
# - "For SMALL CHANGE, return at most one primary issue per canonical ENG section."
# - "Do not write files or approve execution."
```

- [x] **Step 4: Add the new prompt-eval scaffold**
```js
// tests/evals/review-accelerator-contract.eval.mjs
// Read the generated CEO/ENG skill docs plus README excerpts from this branch.
// Ask the judge whether the contract clearly enforces:
// - explicit user-only activation
// - ambiguous wording alone does not activate acceleration
// - per-section human approval
// - no automatic CEO/ENG approval
// - main-agent-only writes
// - persisted-packet stale/regenerate language is present
```

- [x] **Step 5: Document the new eval in `tests/evals/README.md`**
```md
# Add a short entry that this eval covers:
- explicit user-only activation
- ambiguous wording does not activate acceleration
- per-section human approval
- no automatic approval-state changes
- main-agent-only write authority
- persisted-packet stale/regenerate language
```

- [x] **Step 6: Run the red workflow-sequencing test and capture the expected failure**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`  
Expected: FAIL with missing accelerated-review contract patterns in the existing skill docs or README.

- [x] **Step 7: Run the red runtime-instructions test and capture the expected failure**
Run: `bash tests/codex-runtime/test-runtime-instructions.sh`  
Expected: FAIL because the new prompt/reference files do not exist yet, so the existence and content assertions cannot pass.

- [x] **Step 8: Commit the red contract coverage**
```bash
git add tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/test-runtime-instructions.sh tests/evals/review-accelerator-contract.eval.mjs tests/evals/README.md
git commit -m "test: add review accelerator contract coverage"
```

## Task 2: Implement The Shared Packet Contract And CEO Accelerated Review Path

**Files:**
- Create: `review/review-accelerator-packet-contract.md`
- Create: `skills/plan-ceo-review/accelerated-reviewer-prompt.md`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md` via `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`

- [x] **Step 1: Create `review/review-accelerator-packet-contract.md` with the packet schema**
```md
# Review Accelerator Packet Contract

- required packet fields
- fail-closed validation rule
- high-judgment escalation categories
- main-agent-only write authority
- source artifact fingerprint
- approved-and-applied section-boundary resume rule
- bounded retention expectation
- fallback classes that map to manual review
```

- [x] **Step 2: Create `skills/plan-ceo-review/accelerated-reviewer-prompt.md`**
```md
# Accelerated CEO Reviewer Prompt

You are a founder/product/principal-strategy reviewer.
Return a structured section packet only.
Do not approve anything.
Do not write files.
Escalate any high-judgment issue individually.
```

- [x] **Step 3: Add explicit activation-marker rules to `skills/plan-ceo-review/SKILL.md.tmpl`**
```md
# Add or update instructions covering:
- explicit activation marker requirement
- invalid activation sources
- non-accelerated Step 0 mode selection
```

- [x] **Step 4: Add canonical section-boundary and packet-approval rules to `skills/plan-ceo-review/SKILL.md.tmpl`**
```md
# Add or update instructions covering:
- canonical CEO section boundaries
- per-section packet + approval flow
- persisted packet artifacts under ~/.superpowers/projects/<slug>/...
- resume only from the last approved-and-applied section boundary
- stale packet regeneration when the source artifact fingerprint changes
- bounded retention expectation for accelerator artifacts
- final human approval gate remains unchanged
```

- [x] **Step 5: Add preserved-output and write-authority rules to `skills/plan-ceo-review/SKILL.md.tmpl`**
```md
# Add or update instructions covering:
- required CEO review outputs still apply in accelerated mode
- TODO and delight questions remain individual human questions
- only the main review agent may write authoritative artifacts
```

- [x] **Step 6: Regenerate the checked-in CEO skill doc**
Run: `node scripts/gen-skill-docs.mjs`  
Expected: PASS and rewrite `skills/plan-ceo-review/SKILL.md` from the updated template without errors.

- [x] **Step 7: Run the targeted workflow contract test**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`  
Expected: still FAIL, but only on ENG-path or README assertions that have not been implemented yet.

- [x] **Step 8: Commit the CEO accelerated-review wiring**
```bash
git add review/review-accelerator-packet-contract.md skills/plan-ceo-review/accelerated-reviewer-prompt.md skills/plan-ceo-review/SKILL.md.tmpl skills/plan-ceo-review/SKILL.md
git commit -m "feat: add accelerated CEO review contract"
```

## Task 3: Implement The ENG Accelerated Review Path And Preserve ENG Outputs

**Files:**
- Create: `skills/plan-eng-review/accelerated-reviewer-prompt.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md` via `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`

- [x] **Step 1: Create `skills/plan-eng-review/accelerated-reviewer-prompt.md`**
```md
# Accelerated ENG Reviewer Prompt

You are a principal engineer reviewer.
Respect BIG CHANGE vs SMALL CHANGE.
For SMALL CHANGE, return at most one primary issue per canonical ENG section.
Do not write files or approve execution.
```

- [x] **Step 2: Add explicit activation and canonical section rules to `skills/plan-eng-review/SKILL.md.tmpl`**
```md
# Add or update instructions covering:
- explicit activation marker requirement
- invalid activation sources
- normal Step 0 scope choice and approval gate remain manual
- canonical ENG sections
```

- [x] **Step 3: Add `SMALL CHANGE` compression and packet-approval rules to `skills/plan-eng-review/SKILL.md.tmpl`**
```md
# Add or update instructions covering:
- SMALL CHANGE one-primary-issue-per-section behavior
- per-section packets and per-section approvals
- persisted packet resume only from approved-and-applied section boundaries
- fingerprint-based stale packet regeneration
- no bundled approval round for accelerated SMALL CHANGE
```

- [x] **Step 4: Add preserved-output and QA-handoff rules to `skills/plan-eng-review/SKILL.md.tmpl`**
```md
# Add or update instructions covering:
- preserved QA handoff artifact generation
- preserved TODO flow, failure-mode output, and execution handoff
- only the main review agent may write authoritative artifacts
```

- [x] **Step 5: Regenerate the checked-in ENG skill doc**
Run: `node scripts/gen-skill-docs.mjs`  
Expected: PASS and rewrite `skills/plan-eng-review/SKILL.md` from the updated template without errors.

- [x] **Step 6: Re-run the workflow contract test**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`  
Expected: FAIL only on the README contract or any remaining doc/eval gaps, not on CEO/ENG skill assertions.

- [x] **Step 7: Commit the ENG accelerated-review wiring**
```bash
git add skills/plan-eng-review/accelerated-reviewer-prompt.md skills/plan-eng-review/SKILL.md.tmpl skills/plan-eng-review/SKILL.md
git commit -m "feat: add accelerated ENG review contract"
```

## Task 4: Update README, Finish Coverage, And Verify The Full Contract

**Files:**
- Modify: `README.md`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/evals/README.md`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`

- [x] **Step 1: Update the README prose for accelerated review behavior**
```md
# README.md prose changes:
- describe accelerated review as an opt-in branch inside CEO/ENG review
- say only the user can initiate it
- say section and final approval remain human-owned
```

- [x] **Step 2: Update the README Mermaid diagrams for the accelerated branch**
```md
# Update Mermaid diagrams so acceleration is shown inside
# plan-ceo-review / plan-eng-review, not as a new workflow stage.
```

- [x] **Step 3: Finalize the deterministic test assertions**
```bash
# Ensure the shell suites now assert:
# - explicit activation marker requirement
# - preserved CEO/ENG outputs
# - prompt/reference asset existence plus key contract strings
# - persisted packet path / resume / stale-regeneration / retention rules
# - README workflow wording / Mermaid alignment
```

- [x] **Step 4: Update `tests/evals/README.md` with the finished accelerator-eval entry**
```md
# Add the new eval to:
- "Current evals cover"
- "How To Run" examples when multiple eval files are passed to `node --test`
- include the fixed accelerator-eval matrix and the baseline inputs:
  generated CEO/ENG `SKILL.md` plus README excerpts from the current branch
```

- [x] **Step 5: Run the skill-doc contract tests**
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`  
Expected: PASS with generated-skill contract and freshness coverage green.

- [x] **Step 6: Run the generated-skill freshness check**
Run: `node scripts/gen-skill-docs.mjs --check`  
Expected: PASS with no stale generated `SKILL.md` files.

- [x] **Step 7: Run the runtime-instructions test**
Run: `bash tests/codex-runtime/test-runtime-instructions.sh`  
Expected: PASS with the new prompt/reference assets present, generated-doc freshness intact, and prompt/reference content assertions satisfied.

- [x] **Step 8: Run the workflow-sequencing test**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`  
Expected: PASS with accelerated-review workflow assertions satisfied.

- [x] **Step 9: Run the workflow-enhancements test**
Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`  
Expected: PASS with README and workflow enhancement contracts still intact.

- [x] **Step 10: Run the opt-in prompt eval when eval credentials are available**
Run:

```bash
EVALS=1 \
OPENAI_API_KEY=... \
EVAL_MODEL=... \
node --test tests/evals/interactive-question-format.eval.mjs tests/evals/review-accelerator-contract.eval.mjs
```

Expected: PASS when eval credentials are present and the judge confirms:
- explicit user-only activation
- ambiguous wording does not activate acceleration
- per-section human approval remains required
- no automatic CEO/ENG approval
- main-agent-only writes
- persisted-packet stale/regenerate language is present

Otherwise intentionally skip this step and record that the eval environment was unavailable.

- [x] **Step 11: Commit the docs and verification finish**
```bash
git add README.md tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/test-runtime-instructions.sh tests/evals/README.md tests/evals/review-accelerator-contract.eval.mjs
git commit -m "docs: document accelerated review workflow"
```
