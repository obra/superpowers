# Execution Evidence: 2026-03-21-search-before-building

**Plan Path:** docs/superpowers/plans/2026-03-21-search-before-building.md
**Plan Revision:** 4

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T21:34:50Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red generator and generated-skill contract assertions for the shared Search Before Building section and the using-superpowers exemption.
**Files:**
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- Manual inspection only: Inspected the updated tests to confirm they assert the missing shared section in generatePreamble output and generated non-router skills while keeping using-superpowers exempt.
**Invalidation Reason:** Replacing the initial bookkeeping-only evidence with the accurate red-test verification for Task 1 Step 1.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T21:42:12Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red generator and generated-skill contract assertions, then confirmed the focused contract suite fails because the shared Search Before Building section is not yet generated.
**Files:**
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs` -> FAIL (expected red): missing Search Before Building section in generatePreamble output and generated non-router skills.
**Invalidation Reason:** N/A

### Task 1 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T21:34:41Z
**Execution Source:** superpowers:executing-plans
**Claim:** Confirmed the current gap: the focused generator and skill-doc contract suite fails because the shared Search Before Building section is not yet generated.
**Files:**
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs` -> FAIL (expected red): missing Search Before Building section in generatePreamble output and generated non-router skills.
**Invalidation Reason:** This step was misrecorded during execution review; the approved plan's Step 2 is writing references/search-before-building.md, which has not been done yet.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T21:44:05Z
**Execution Source:** superpowers:executing-plans
**Claim:** Created the shared Search Before Building reference with the three-layer model, trigger heuristics, source-quality rules, privacy and sanitization guidance, fallback language, and worked examples for product design, plan review, debugging, code review, and QA.
**Files:**
- references/search-before-building.md
**Verification:**
- `rg -n '^## Purpose|^## The Three Layers|^## When To Trigger A Search Pass|^## Source Quality Rules|^## Privacy And Sanitization Rules|^## Fallback Language|^## Worked Examples|^### Product Design|^### Plan Review|^### Debugging|^### Code Review|^### QA' references/search-before-building.md` -> PASS: reference includes the required sections and worked examples.
**Invalidation Reason:** N/A

### Task 1 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:44:59Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the skill-doc generator to inject a shared Search Before Building section into generatePreamble for normal and review skills, while leaving generateUsingSuperpowersPreamble unchanged so the router remains exempt.
**Files:**
- scripts/gen-skill-docs.mjs
**Verification:**
- `rg -n 'buildSearchBeforeBuildingSection|buildSearchBeforeBuildingSection\(\)|generatePreamble\(|generateUsingSuperpowersPreamble\(' scripts/gen-skill-docs.mjs` -> PASS: generator defines the shared section builder, wires it through generatePreamble, and keeps the using-superpowers generator separate.
**Invalidation Reason:** N/A

### Task 1 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:45:34Z
**Execution Source:** superpowers:executing-plans
**Claim:** Regenerated the checked-in skill docs so the new shared Search Before Building preamble is emitted for generated non-router skills while the using-superpowers router stays on its dedicated bootstrap preamble.
**Files:**
- scripts/gen-skill-docs.mjs
- skills
**Verification:**
- `node scripts/gen-skill-docs.mjs` -> PASS: regenerated skills/*/SKILL.md from current templates and generator logic.
**Invalidation Reason:** N/A

### Task 1 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:46:03Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the focused generator and generated-skill contract suite after regenerating skill docs, and confirmed the shared Search Before Building section appears exactly where intended while the router remains exempt.
**Files:**
- scripts/gen-skill-docs.mjs
- skills
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs` -> PASS: 25 tests passed, 0 failed.
**Invalidation Reason:** N/A

### Task 1 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:46:41Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the shared Search-Before-Building foundation as a scoped Task 1 changeset, including the new reference, generator update, focused tests, and regenerated skill docs.
**Files:**
- references/search-before-building.md
- scripts/gen-skill-docs.mjs
- skills
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- `git show --stat --oneline --format='%H %s' HEAD -1` -> PASS: bebc507243fd6449ec6e8c9935ab53c3bf891345 feat: add search-before-building foundation
**Invalidation Reason:** N/A

### Task 2 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:48:13Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red sequencing assertions for early-stage Search-Before-Building behavior in brainstorming and plan-ceo-review, covering Landscape Awareness, the sensitive brainstorming permission gate, the optional Landscape Snapshot section, Pre-Step 0: Landscape Check, and the CEO-review write-back rule.
**Files:**
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `sed -n '42,100p' tests/codex-runtime/test-workflow-sequencing.sh` -> PASS: sequencing test now asserts the required early-stage Search-Before-Building patterns.
**Invalidation Reason:** N/A

### Task 2 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:48:39Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the workflow sequencing suite after adding the new early-stage assertions and confirmed the expected red failure because brainstorming and plan-ceo-review do not yet include the Search-Before-Building landscape behavior.
**Files:**
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `bash tests/codex-runtime/test-workflow-sequencing.sh` -> FAIL (expected red): missing 'Landscape Awareness' in skills/brainstorming/SKILL.md.
**Invalidation Reason:** N/A

### Task 2 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:50:09Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated brainstorming to add the Landscape Awareness checklist step and flow branch, define the trigger heuristics and sensitive-search permission rule, cap the search pass, and document the optional Landscape Snapshot spec section for material Layer 2 influence.
**Files:**
- skills/brainstorming/SKILL.md.tmpl
**Verification:**
- `sed -n '15,170p' skills/brainstorming/SKILL.md.tmpl` -> PASS: brainstorming template includes Landscape Awareness, the sensitive-search permission rule, and Landscape Snapshot guidance.
**Invalidation Reason:** N/A

### Task 2 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:50:46Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated plan-ceo-review to add Pre-Step 0: Landscape Check after the system audit, define the reuse and refresh rules for Landscape Snapshot, require write-back when refreshed reasoning materially changes approval rationale, and keep the content inside the existing accelerated Step 0 packet.
**Files:**
- skills/plan-ceo-review/SKILL.md.tmpl
**Verification:**
- `rg -n 'Pre-Step 0: Landscape Check|Landscape Snapshot|Decision impact|Layer 3 insight' skills/plan-ceo-review/SKILL.md.tmpl` -> PASS: plan-ceo-review template includes the Landscape Check pre-step, reuse/refresh guidance, and the write-back requirement.
**Invalidation Reason:** N/A

### Task 2 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:51:12Z
**Execution Source:** superpowers:executing-plans
**Claim:** Regenerated the checked-in skill docs so brainstorming and plan-ceo-review now include the approved Search-Before-Building behavior from their updated templates.
**Files:**
- skills/brainstorming/SKILL.md
- skills/brainstorming/SKILL.md.tmpl
- skills/plan-ceo-review/SKILL.md
- skills/plan-ceo-review/SKILL.md.tmpl
**Verification:**
- `node scripts/gen-skill-docs.mjs` -> PASS: regenerated skill docs from the updated early-stage templates.
**Invalidation Reason:** N/A

### Task 2 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:51:41Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the workflow sequencing suite after updating and regenerating brainstorming and plan-ceo-review, and confirmed the new early-stage Search-Before-Building behavior now satisfies the workflow contract.
**Files:**
- skills/brainstorming/SKILL.md
- skills/brainstorming/SKILL.md.tmpl
- skills/plan-ceo-review/SKILL.md
- skills/plan-ceo-review/SKILL.md.tmpl
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `bash tests/codex-runtime/test-workflow-sequencing.sh` -> PASS: Workflow sequencing and fail-closed routing contracts are present.
**Invalidation Reason:** N/A

### Task 2 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:52:16Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the early Search-Before-Building workflow-stage changes for brainstorming and plan-ceo-review, including their regenerated docs and the sequencing coverage update.
**Files:**
- skills/brainstorming/SKILL.md
- skills/brainstorming/SKILL.md.tmpl
- skills/plan-ceo-review/SKILL.md
- skills/plan-ceo-review/SKILL.md.tmpl
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `git show --stat --oneline --format='%H %s' HEAD -1` -> PASS: 7fcab40a09dbe8cd9952598cdb746d6f2fa03a81 feat: add search-before-building to design review stages
**Invalidation Reason:** N/A

### Task 3 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:53:54Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red sequencing assertions for planning-stage Search-Before-Building behavior in writing-plans and plan-eng-review, covering the plan-body reuse and footgun sections, the no-default-rerun-search rule, Step 0.4: Search Check, the built-in/current-best-practice/footgun prompts, and the Layer provenance tags.
**Files:**
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `sed -n '95,165p' tests/codex-runtime/test-workflow-sequencing.sh` -> PASS: sequencing test now asserts the required planning and ENG-review Search-Before-Building patterns.
**Invalidation Reason:** N/A

### Task 3 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:54:27Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the workflow sequencing suite after adding the new planning-stage assertions and confirmed the expected red failure because writing-plans and plan-eng-review do not yet include the Search-Before-Building planning guidance.
**Files:**
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `bash tests/codex-runtime/test-workflow-sequencing.sh` -> FAIL (expected red): missing '## Existing Capabilities / Built-ins to Reuse' in skills/writing-plans/SKILL.md.
**Invalidation Reason:** N/A

### Task 3 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:55:34Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated writing-plans to carry through approved Search-Before-Building conclusions instead of rerunning search by default, including the Landscape Snapshot reuse rule and the plan-body reuse/footgun sections for material Layer 2 guidance.
**Files:**
- skills/writing-plans/SKILL.md.tmpl
**Verification:**
- `sed -n '35,110p' skills/writing-plans/SKILL.md.tmpl` -> PASS: writing-plans template includes the no-default-search rule, Landscape Snapshot carry-through, and the reuse/footgun plan sections.
**Invalidation Reason:** N/A

### Task 3 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:56:22Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated plan-eng-review to add Step 0.4: Search Check inside the existing Scope Challenge, define the trigger classes and built-in/current-best-practice/footgun prompts, and require Layer provenance tags in review prose.
**Files:**
- skills/plan-eng-review/SKILL.md.tmpl
**Verification:**
- `sed -n '95,165p' skills/plan-eng-review/SKILL.md.tmpl` -> PASS: plan-eng-review template includes Step 0.4, the required prompts, and the Layer provenance tags.
**Invalidation Reason:** N/A

### Task 3 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:56:49Z
**Execution Source:** superpowers:executing-plans
**Claim:** Regenerated the checked-in skill docs so writing-plans and plan-eng-review now reflect the approved Search-Before-Building planning-stage behavior from their updated templates.
**Files:**
- skills/plan-eng-review/SKILL.md
- skills/plan-eng-review/SKILL.md.tmpl
- skills/writing-plans/SKILL.md
- skills/writing-plans/SKILL.md.tmpl
**Verification:**
- `node scripts/gen-skill-docs.mjs` -> PASS: regenerated skill docs from the updated planning-stage templates.
**Invalidation Reason:** N/A

### Task 3 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:57:43Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the workflow sequencing suite after updating and regenerating writing-plans and plan-eng-review, fixed the assertion quoting bug in the new planning-stage coverage, and confirmed the Search-Before-Building planning-stage contract now passes end to end.
**Files:**
- skills/plan-eng-review/SKILL.md
- skills/plan-eng-review/SKILL.md.tmpl
- skills/writing-plans/SKILL.md
- skills/writing-plans/SKILL.md.tmpl
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `bash tests/codex-runtime/test-workflow-sequencing.sh` -> PASS: Workflow sequencing and fail-closed routing contracts are present.
**Invalidation Reason:** N/A

### Task 3 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:58:24Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the planning-stage Search-Before-Building changes for writing-plans and plan-eng-review, including their regenerated docs and the expanded sequencing coverage.
**Files:**
- skills/plan-eng-review/SKILL.md
- skills/plan-eng-review/SKILL.md.tmpl
- skills/writing-plans/SKILL.md
- skills/writing-plans/SKILL.md.tmpl
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `git show --stat --oneline --format='%H %s' HEAD -1` -> PASS: e6382ba1d5e0061c6b27b0e4ee6fd15c99a864b4 feat: add search-before-building to plan stages
**Invalidation Reason:** N/A

### Task 4 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T21:59:57Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red assertions for the remaining workflow-owned Search-Before-Building text contracts across the sequencing and workflow-enhancement suites, covering debugging search hooks, review reminders, the receiving-code-review verification hook, and the optional QA ecosystem-issue lookup.
**Files:**
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `sed -n '55,70p' tests/codex-runtime/test-workflow-sequencing.sh && sed -n '198,220p' tests/codex-runtime/test-workflow-sequencing.sh && sed -n '60,90p' tests/codex-runtime/test-workflow-enhancements.sh` -> PASS: focused test files now assert the Task 4 Search-Before-Building contracts.
**Invalidation Reason:** N/A

### Task 4 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:00:28Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the sequencing and workflow-enhancement suites after adding the new Task 4 assertions and confirmed the expected red failures because the debugging, review, reception, and QA skill docs do not yet include the new Search-Before-Building guidance.
**Files:**
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `bash tests/codex-runtime/test-workflow-sequencing.sh && bash tests/codex-runtime/test-workflow-enhancements.sh` -> FAIL (expected red): missing 'Phase 2.5: External Pattern Search' in skills/systematic-debugging/SKILL.md and missing 'Known ecosystem issue lookup (optional)' in skills/qa-only/SKILL.md.
**Invalidation Reason:** N/A

### Task 4 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:02:13Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the remaining workflow-owned skill templates to add bounded external-pattern search hooks in systematic-debugging, a built-in-before-bespoke reminder in requesting-code-review, a quick verification hook in receiving-code-review, and an optional ecosystem issue lookup in qa-only.
**Files:**
- skills/qa-only/SKILL.md.tmpl
- skills/receiving-code-review/SKILL.md.tmpl
- skills/requesting-code-review/SKILL.md.tmpl
- skills/systematic-debugging/SKILL.md.tmpl
**Verification:**
- `rg -n 'Phase 2.5: External Pattern Search|Phase 3.2b: Search Escalation on failed hypothesis|candidate hypotheses|built-in-before-bespoke|known ecosystem footguns|Search-Before-Building Verification Hook|novel rewrite|Known ecosystem issue lookup \(optional\)|label the result as a hypothesis, not a fix|do not block the report if search is unavailable' skills/systematic-debugging/SKILL.md.tmpl skills/requesting-code-review/SKILL.md.tmpl skills/receiving-code-review/SKILL.md.tmpl skills/qa-only/SKILL.md.tmpl` -> PASS: the four workflow-owned templates now include the Task 4 Search-Before-Building rules.
**Invalidation Reason:** N/A

### Task 4 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:02:48Z
**Execution Source:** superpowers:executing-plans
**Claim:** Regenerated the checked-in skill docs so the debugging, review-request, review-reception, and QA skills now reflect the approved Search-Before-Building behavior from their updated templates.
**Files:**
- skills/qa-only/SKILL.md
- skills/qa-only/SKILL.md.tmpl
- skills/receiving-code-review/SKILL.md
- skills/receiving-code-review/SKILL.md.tmpl
- skills/requesting-code-review/SKILL.md
- skills/requesting-code-review/SKILL.md.tmpl
- skills/systematic-debugging/SKILL.md
- skills/systematic-debugging/SKILL.md.tmpl
**Verification:**
- `node scripts/gen-skill-docs.mjs` -> PASS: regenerated skill docs from the updated Task 4 templates.
**Invalidation Reason:** N/A

### Task 4 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:04:11Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the focused sequencing and workflow-enhancement suites after updating and regenerating the debugging, review-request, review-reception, and QA skills, fixed the remaining wording mismatch in systematic-debugging, and confirmed the Task 4 Search-Before-Building contracts now pass.
**Files:**
- skills/qa-only/SKILL.md
- skills/qa-only/SKILL.md.tmpl
- skills/receiving-code-review/SKILL.md
- skills/receiving-code-review/SKILL.md.tmpl
- skills/requesting-code-review/SKILL.md
- skills/requesting-code-review/SKILL.md.tmpl
- skills/systematic-debugging/SKILL.md
- skills/systematic-debugging/SKILL.md.tmpl
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `bash tests/codex-runtime/test-workflow-sequencing.sh && bash tests/codex-runtime/test-workflow-enhancements.sh` -> PASS: Workflow sequencing and fail-closed routing contracts are present. Workflow enhancement assets and contracts are present.
**Invalidation Reason:** N/A

### Task 4 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:04:58Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the workflow-owned Search-Before-Building changes for debugging, review request, review reception, and QA, including regenerated docs and the focused sequencing/workflow-enhancement coverage.
**Files:**
- skills/qa-only/SKILL.md
- skills/qa-only/SKILL.md.tmpl
- skills/receiving-code-review/SKILL.md
- skills/receiving-code-review/SKILL.md.tmpl
- skills/requesting-code-review/SKILL.md
- skills/requesting-code-review/SKILL.md.tmpl
- skills/systematic-debugging/SKILL.md
- skills/systematic-debugging/SKILL.md.tmpl
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/codex-runtime/test-workflow-sequencing.sh
**Verification:**
- `git show --stat --oneline --format='%H %s' HEAD -1` -> PASS: eb3b2f544d9a977767453ffecb61c26752faa529 feat: add search-before-building to debugging and QA skills
**Invalidation Reason:** N/A

### Task 5 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:07:09Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added deterministic red assertions for the reviewer and checklist Search-Before-Building contract, covering the new checklist category and examples plus the bounded primary-source-first review logic on both the custom reviewer agent and the dispatched reviewer prompt surface.
**Files:**
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-workflow-enhancements.sh
**Verification:**
- `sed -n '38,62p' tests/codex-runtime/test-workflow-enhancements.sh && sed -n '788,825p' tests/codex-runtime/test-runtime-instructions.sh` -> PASS: focused reviewer/checklist tests now assert the Task 5 Search-Before-Building contract.
**Invalidation Reason:** N/A

### Task 5 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:07:58Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the shared review checklist with the new Built-in Before Bespoke / Known Pattern Footguns category and the required example cases for framework protections, stable primitives, and well-known ecosystem failure modes.
**Files:**
- review/checklist.md
**Verification:**
- `rg -n 'Built-in Before Bespoke / Known Pattern Footguns|framework protections|stable primitive|well-known failure modes' review/checklist.md` -> PASS: review checklist includes the new Search-Before-Building review category and examples.
**Invalidation Reason:** N/A

### Task 5 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:08:56Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the custom reviewer instructions with a bounded Search-Before-Building pass for unfamiliar patterns, keeping it primary-source-first, limited to 1-2 targeted checks, and explicitly tied back to diff-grounded and file:line evidence.
**Files:**
- agents/code-reviewer.instructions.md
**Verification:**
- `rg -n '1-2 targeted checks|official documentation|issue trackers or maintainer guidance|primary-source technical references|anchored in the actual diff|file:line|built-in-before-bespoke|known pattern footguns' agents/code-reviewer.instructions.md` -> PASS: custom reviewer instructions include the bounded Search-Before-Building review pass and its evidence constraints.
**Invalidation Reason:** N/A

### Task 5 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:09:47Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the dispatched reviewer prompt to mirror the bounded Search-Before-Building review logic from the custom reviewer path, including 1-2 targeted primary-source checks, built-in-before-bespoke and known-footgun review focus, and diff plus file:line grounding.
**Files:**
- skills/requesting-code-review/code-reviewer.md
**Verification:**
- `rg -n '1-2 targeted checks|official documentation|issue trackers or maintainer guidance|primary-source technical references|built-in-before-bespoke|known pattern footguns|file:line evidence' skills/requesting-code-review/code-reviewer.md` -> PASS: dispatched reviewer prompt includes the mirrored Search-Before-Building review logic.
**Invalidation Reason:** N/A

### Task 5 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:10:23Z
**Execution Source:** superpowers:executing-plans
**Claim:** Regenerated the reviewer artifacts from the updated custom reviewer instructions so the checked-in agent doc and Codex agent manifest stay aligned with the new Search-Before-Building review guidance.
**Files:**
- .codex/agents/code-reviewer.toml
- agents/code-reviewer.instructions.md
- agents/code-reviewer.md
**Verification:**
- `node scripts/gen-agent-docs.mjs` -> PASS: regenerated reviewer artifacts from current source instructions.
**Invalidation Reason:** N/A

### Task 5 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:11:47Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the focused reviewer/checklist verification gate, corrected the stale brainstorming numbering assertion and checklist example casing in the deterministic tests, and confirmed the reviewer artifacts, runtime instructions, and workflow-enhancement contracts now all pass.
**Files:**
- .codex/agents/code-reviewer.toml
- agents/code-reviewer.instructions.md
- agents/code-reviewer.md
- review/checklist.md
- skills/requesting-code-review/code-reviewer.md
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-workflow-enhancements.sh
**Verification:**
- `node scripts/gen-agent-docs.mjs --check && bash tests/codex-runtime/test-runtime-instructions.sh && bash tests/codex-runtime/test-workflow-enhancements.sh` -> PASS: Generated agent docs are up to date. Runtime instructions and workflow enhancement contracts are present.
**Invalidation Reason:** N/A

### Task 5 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:12:33Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the reviewer and checklist Search-Before-Building changes, including the checklist category, the custom reviewer and dispatched reviewer prompt updates, regenerated reviewer artifacts, and the deterministic reviewer tests.
**Files:**
- .codex/agents/code-reviewer.toml
- agents/code-reviewer.instructions.md
- agents/code-reviewer.md
- review/checklist.md
- skills/requesting-code-review/code-reviewer.md
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-workflow-enhancements.sh
**Verification:**
- `git show --stat --oneline --format='%H %s' HEAD -1` -> PASS: fc1131534abcc58b2a18f16536afe8759fdae4ad feat: add search-before-building review guidance
**Invalidation Reason:** N/A

### Task 6 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:23:24Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the repo-level docs to describe Search-Before-Building scope, optional internet use, privacy and sanitization rules, the sensitive brainstorming permission exception, the deterministic-first testing story, and the doc-driven Search-Before-Building eval entrypoints.
**Files:**
- README.md
- docs/README.codex.md
- docs/README.copilot.md
- docs/testing.md
- tests/evals/README.md
**Verification:**
- `rg -n 'Search Before Building|optional, not mandatory|Internet access remains optional|sensitive or stealthy|deterministic-first|search-before-building-contract\.orchestrator\.md|doc-driven runner/judge|Layer 2 is input, not authority' README.md docs/README.codex.md docs/README.copilot.md docs/testing.md tests/evals/README.md` -> Matched the new Search-Before-Building public-doc and doc-driven eval contract language across the touched docs.
**Invalidation Reason:** N/A

### Task 6 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:24:49Z
**Execution Source:** superpowers:executing-plans
**Claim:** Replaced the retired API-backed Search-Before-Building eval with a repo-consistent doc-driven runner/judge gate, including a checked-in scenario matrix for representative non-router skill surfaces plus both reviewer prompt surfaces.
**Files:**
- tests/evals/search-before-building-contract.judge.md
- tests/evals/search-before-building-contract.orchestrator.md
- tests/evals/search-before-building-contract.runner.md
- tests/evals/search-before-building-contract.scenarios.md
**Verification:**
- `test -f tests/evals/search-before-building-contract.orchestrator.md && test -f tests/evals/search-before-building-contract.scenarios.md && test -f tests/evals/search-before-building-contract.runner.md && test -f tests/evals/search-before-building-contract.judge.md && test ! -e tests/evals/search-before-building-contract.eval.mjs && rg -n 'fresh isolated runner subagent|fresh isolated judge subagent|Layer 2 is input, not authority|built-in-before-bespoke|privacy and sanitization boundaries|fallback|fail closed|representative' tests/evals/search-before-building-contract.orchestrator.md tests/evals/search-before-building-contract.scenarios.md tests/evals/search-before-building-contract.runner.md tests/evals/search-before-building-contract.judge.md` -> Confirmed the doc-driven Search-Before-Building orchestrator, scenarios, runner, and judge artifacts exist, the retired .eval.mjs surface is gone, and the required contract language is present.
**Invalidation Reason:** N/A

### Task 6 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:25:46Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the skill-doc and agent-doc generators again after the doc and eval updates and confirmed they did not introduce additional generated output drift.
**Files:**
- None (no repo file changed)
**Verification:**
- `git status --short skills agents .codex/agents` -> No generated skill or agent files remained modified after regeneration.
**Invalidation Reason:** N/A

### Task 6 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:28:30Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the full deterministic verification gate, fixed the pinned eval-readme wording drift that surfaced in runtime instructions, and got the approved generation, freshness, unit, runtime, enhancement, and sequencing commands passing.
**Files:**
- docs/testing.md
- tests/evals/README.md
**Verification:**
- `node scripts/gen-skill-docs.mjs && node scripts/gen-skill-docs.mjs --check && node scripts/gen-agent-docs.mjs && node scripts/gen-agent-docs.mjs --check && node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs && bash tests/codex-runtime/test-runtime-instructions.sh && bash tests/codex-runtime/test-workflow-enhancements.sh && bash tests/codex-runtime/test-workflow-sequencing.sh` -> All generator, freshness, unit, runtime-instruction, workflow-enhancement, and workflow-sequencing commands passed after tightening the eval README contract wording.
**Invalidation Reason:** N/A

### Task 6 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:38:14Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the doc-driven Search-Before-Building runner/judge gate across all five representative scenarios, wrote a local evidence bundle, and confirmed the gate fails closed because S5 still lacks explicit fallback and privacy language on the dispatched reviewer surface.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Created per-scenario evidence under ~/.superpowers/projects/dmulcahey-superpowers/search-before-building-contract-r1/run-20260321T222922Z/evidence/ with S1-S4 passing and S5 failing on skills/requesting-code-review/code-reviewer.md for missing fallback and sanitization/privacy wording.
**Invalidation Reason:** N/A

### Task 6 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T22:42:53Z
**Execution Source:** superpowers:executing-plans
**Claim:** Fixed the last failing Search-Before-Building contract gap on the dispatched reviewer prompt by adding explicit unsafe-search sanitization and fallback language, pinned that wording in deterministic coverage, and reran the failing S5 runner/judge scenario to a pass.
**Files:**
- skills/requesting-code-review/code-reviewer.md
- tests/codex-runtime/test-workflow-enhancements.sh
**Verification:**
- Manual inspection only: Workflow enhancement assets and contracts are present. passed, and the rerun S5 evidence bundle at ~/.superpowers/projects/dmulcahey-superpowers/search-before-building-contract-r1/run-20260321T223923Z/evidence/S5.md records a fresh runner/judge pass after the prompt fix.
**Invalidation Reason:** N/A

### Task 6 Step 7
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T23:09:38Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the final Search-Before-Building docs, reviewer updates, deterministic contract checks, and the repo-consistent doc-driven runner/judge eval after tightening the reviewer sanitization/fallback contract and rerunning the fresh r2 scenario matrix to all-pass.
**Files:**
- .codex/agents/code-reviewer.toml
- README.md
- agents/code-reviewer.instructions.md
- agents/code-reviewer.md
- docs/README.codex.md
- docs/README.copilot.md
- docs/testing.md
- skills/requesting-code-review/code-reviewer.md
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/evals/README.md
- tests/evals/search-before-building-contract.judge.md
- tests/evals/search-before-building-contract.orchestrator.md
- tests/evals/search-before-building-contract.runner.md
- tests/evals/search-before-building-contract.scenarios.md
**Verification:**
- `git show --stat --oneline --format='%H %s' HEAD -1` -> PASS: 3f7d3f70fce781bc46feb2b7b1778cc1b8d91084 feat: document and verify search-before-building
**Invalidation Reason:** Final review found that Task 6 still referenced the retired .eval.mjs surface and that Step 7 evidence did not explicitly point at the fresh r2 runner/judge evidence bundle.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T23:11:18Z
**Execution Source:** superpowers:executing-plans
**Claim:** Normalized the approved Task 6 wording to the user-directed doc-driven runner/judge eval shape and recorded the final Search-Before-Building release state against the committed implementation and the fresh r2 scenario-matrix evidence bundle.
**Files:**
- .codex/agents/code-reviewer.toml
- README.md
- agents/code-reviewer.instructions.md
- agents/code-reviewer.md
- docs/README.codex.md
- docs/README.copilot.md
- docs/testing.md
- skills/requesting-code-review/code-reviewer.md
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/evals/README.md
- tests/evals/search-before-building-contract.judge.md
- tests/evals/search-before-building-contract.orchestrator.md
- tests/evals/search-before-building-contract.runner.md
- tests/evals/search-before-building-contract.scenarios.md
**Verification:**
- Manual inspection only: Commit 3f7d3f70fce781bc46feb2b7b1778cc1b8d91084 (feat: document and verify search-before-building) is the shipped code state, and the fresh all-pass r2 runner/judge evidence bundle is recorded under ~/.superpowers/projects/dmulcahey-superpowers/search-before-building-contract-r2/run-20260321T225427Z/evidence/ with S1.md through S5.md.
**Invalidation Reason:** N/A

#### Attempt 3
**Status:** Completed
**Recorded At:** 2026-03-21T23:44:07Z
**Execution Source:** manual deep review
**Claim:** Closed the remaining post-implementation review gaps by normalizing the approved plan summary sections to the doc-driven gate, aligning the shared generated Search-Before-Building preamble with the canonical sanitization/fallback contract, restoring reviewer-surface parity on secondary-source fallback, tightening the scenario/test wording that missed the drift, and rerunning deterministic plus runner/judge verification to all-pass.
**Files:**
- README.md
- docs/README.codex.md
- docs/README.copilot.md
- docs/superpowers/execution-evidence/2026-03-21-search-before-building-r4-evidence.md
- docs/superpowers/plans/2026-03-21-search-before-building.md
- scripts/gen-skill-docs.mjs
- skills/*/SKILL.md (regenerated non-router skill docs touched by the shared preamble change)
- skills/requesting-code-review/code-reviewer.md
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-workflow-enhancements.sh
- tests/evals/search-before-building-contract.scenarios.md
**Verification:**
- `node scripts/gen-skill-docs.mjs --check && node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs && bash tests/codex-runtime/test-workflow-enhancements.sh && bash tests/codex-runtime/test-runtime-instructions.sh` -> PASS
- `node scripts/gen-agent-docs.mjs --check && node scripts/gen-skill-docs.mjs --check && node --test tests/codex-runtime/*.test.mjs && bash tests/codex-runtime/test-runtime-instructions.sh && bash tests/codex-runtime/test-using-superpowers-bypass.sh && bash tests/codex-runtime/test-workflow-enhancements.sh && bash tests/codex-runtime/test-workflow-sequencing.sh && bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh && bash tests/codex-runtime/test-superpowers-plan-execution.sh && bash tests/codex-runtime/test-superpowers-workflow.sh && bash tests/codex-runtime/test-superpowers-workflow-status.sh && bash tests/codex-runtime/test-superpowers-config.sh && bash tests/codex-runtime/test-superpowers-migrate-install.sh && bash tests/codex-runtime/test-superpowers-update-check.sh && bash tests/codex-runtime/test-superpowers-upgrade-skill.sh && bash tests/codex-runtime/test-superpowers-slug.sh && bash tests/brainstorm-server/test-launch-wrappers.sh && node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js` -> PASS
- Fresh Search-Before-Building runner/judge gate rerun on scenarios S1-S5 -> PASS
**Invalidation Reason:** N/A
