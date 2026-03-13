# Implementation Plan: refining-specs Skill

**Spec:** `docs/superpowers/specs/2026-03-13-refining-specs-design.md`
**Goal:** Create the refining-specs skill — 4 new files that pressure-test spec documents before plan generation by simulating plan derivation and fixing gaps autonomously.
**Template:** Mirror `skills/refining-plans/` structure and adapt terminology.

## Architecture Summary

```
commands/refine-specs.md          → entry point, invokes superpowers:refining-specs
skills/refining-specs/SKILL.md    → orchestrator: 3 phases (setup, iterate, report)
skills/refining-specs/spec-simulator-prompt.md  → subagent: simulate plan derivation, report gaps
skills/refining-specs/spec-fixer-prompt.md      → subagent: patch gaps inline, mark [inferred]
```

Flow: `/refine-specs` → SKILL.md orchestrates → dispatches spec-simulator (Task tool) → evaluates findings → dispatches spec-fixer (Task tool) → checks convergence → loops or reports.

## Tasks

### Task 1: Create `commands/refine-specs.md`
**Time:** 2 min
**Dependencies:** None
**Reference:** `commands/refine-plans.md`

- [ ] Create file at `commands/refine-specs.md`
- [ ] Use YAML frontmatter with:
  - `description: "Use when a spec needs pressure-testing before plan generation — iteratively simulates and refines until stable."`
  - `disable-model-invocation: true`
- [ ] Body: `Invoke the superpowers:refining-specs skill and follow it exactly as presented to you`
- [ ] Verify: matches spec's Command Definition section exactly

### Task 2: Create `skills/refining-specs/SKILL.md`
**Time:** 5 min
**Dependencies:** None (but read `skills/refining-plans/SKILL.md` as template)
**Reference:** `skills/refining-plans/SKILL.md`

- [ ] Create directory `skills/refining-specs/`
- [ ] Create file with YAML frontmatter:
  - `name: refining-specs`
  - `description: Use when a spec needs pressure-testing before plan generation, or when a spec has known gaps that need systematic discovery`
- [ ] Add title: `# Refining Specs`
- [ ] Add core principle: "Simulate plan derivation before writing plans — catch gaps in the spec, not during planning"
- [ ] Add announcement: "I'm using the refining-specs skill to pressure-test this spec."
- [ ] Add "When to Use" decision tree (graphviz dot):
  - "Have a written spec?" → yes → "Spec already tested?" → no → refining-specs
  - "Have a written spec?" → no → "Write a spec first"
  - "Spec already tested?" → yes, stable → "Generate plan"
- [ ] Add "The Process" section with graphviz flow diagram mirroring refining-plans but with spec terminology
- [ ] **Phase 1: Domain Detection**
  - Read spec, determine domain (backend, frontend, infrastructure, data, plugin-dev, ML/AI, devops, full-stack, other)
  - Generate role profiles:
    - spec-simulator: "Senior {domain} engineer who pressure-tests {technology} specs by attempting to derive implementation plans"
    - spec-fixer: "{domain} specialist who patches {technology} spec gaps while preserving design decisions"
  - Log detected domain and roles
- [ ] **Phase 2: Iteration Loop** (max 5)
  - Step 1: Dispatch spec-simulator — provide full spec text inline, role profile, iteration number, previous fixes summary
  - Step 2: Evaluate — no critical/important → CONVERGED
  - Step 3: Dispatch spec-fixer — provide spec file path, full spec text inline, critical + important findings, original snapshot. Instruct fixer to mark all inferred additions with `[inferred]` tag.
  - Step 3b: After fixer completes, re-read the spec file to get updated text for next simulation round (fixer edits in-place, so orchestrator must refresh its copy)
  - Step 4: Track per round: `Round {N}: critical={X} important={Y} minor={Z} → {signal}`
  - Step 5: Check convergence (CONVERGED / ESCALATE / CONTINUE rules from spec)
- [ ] **Phase 3: Report & Handoff**
  - Iteration summary table (Round, Critical, Important, Minor, Signal)
  - Two options: "Generate plan" (invoke superpowers:writing-plans) or "Refine again"
  - On ESCALATE: present stuck findings with context
- [ ] Document `[inferred]` tag in SKILL.md: note that the spec-fixer marks all inferred additions with `[inferred]` so downstream readers can distinguish original decisions from gap-fills
- [ ] Add "Red Flags" section:
  - Never skip simulation
  - Never let spec-fixer restructure the spec
  - Never continue after CONVERGED or ignore ESCALATE
  - Never run spec-fixer without simulation findings
  - Never modify the spec yourself (only spec-fixer subagent edits)

### Task 3: Create `skills/refining-specs/spec-simulator-prompt.md`
**Time:** 4 min
**Dependencies:** None (but read `skills/refining-plans/plan-simulator-prompt.md` as template)
**Reference:** `skills/refining-plans/plan-simulator-prompt.md`

- [ ] Create file with title: `# Spec-Simulator Subagent Prompt Template`
- [ ] Template structure (Task tool, general-purpose):
  - description: "Simulate spec: [spec name]"
  - Opening: "You are simulating plan derivation from a spec to surface gaps before plan generation."
  - `{role_profile}` placeholder
- [ ] Add `## Spec Content` section with `{spec_content}` placeholder
- [ ] Add `## Simulation Mindset` section:
  - "You are NOT writing a plan. You are simulating plan derivation."
  - "Walk through the spec as if about to write an implementation plan."
  - "For each section, attempt to derive concrete tasks. At each step, ask: 'Do I have everything I need to plan this?'"
  - "The throwaway plan skeleton stays in-context only — never written to disk"
  - `{iteration_context}` placeholder
- [ ] Add DO/DO NOT rules:
  - DO: Skip clear requirements silently, focus on WHAT decisions are missing, focus on affected sections if iteration > 1
  - DO NOT: Flag already-clear requirements, suggest HOW to implement
- [ ] Add `## Seven Gap Patterns` section (from spec):
  - Missing Decisions, Behavioral Ambiguity, Undefined Error Paths, Unstated Assumptions, Dependency Gaps, Conflict Detection, Sequencing Issues
  - Each with spec-specific description
- [ ] Add `## Severity Guidelines` table (Critical/Important/Minor with spec-context examples)
- [ ] Add `## Report Format` matching spec output format:
  - `FINDINGS: critical={N} important={M} minor={P}`
  - Each finding: section, requirement, concern, recommendation

### Task 4: Create `skills/refining-specs/spec-fixer-prompt.md`
**Time:** 4 min
**Dependencies:** None (but read `skills/refining-plans/plan-fixer-prompt.md` as template)
**Reference:** `skills/refining-plans/plan-fixer-prompt.md`

- [ ] Create file with title: `# Spec-Fixer Subagent Prompt Template`
- [ ] Template structure (Task tool, general-purpose):
  - description: "Fix spec gaps: [spec name]"
  - Opening: "You are applying targeted fixes to a spec based on simulation findings."
  - `{role_profile}` placeholder
- [ ] Add `## Spec File Path` section with `{spec_file_path}` placeholder
- [ ] Add `## Spec Text` section with `{spec_text}` placeholder
- [ ] Add `## Original Snapshot` section with `{original_snapshot}` placeholder
- [ ] Add `## Findings to Address` section with `{findings}` placeholder
- [ ] Add `## Fix Principles` section:
  - Minimal edits — change only what's needed
  - Preserve original voice — don't rewrite sections, patch gaps inline
  - Add clarifications where the gap exists — don't reorganize
  - Only fix critical and important — skip minor
  - Never restructure — only patch gaps
  - Preserve all design decisions — if the spec says "use X," never change that
  - If a recommendation conflicts with a stated design decision, note the conflict rather than forcing the fix
- [ ] Add `## [inferred] Tag Mechanism` section (NEW — not in plan-fixer):
  - Every piece of information added by the fixer that was not explicitly stated in the original spec MUST be tagged with `[inferred]` at the end of the added sentence or clause
  - Purpose: downstream readers can distinguish original spec decisions from inferred additions
  - Example: `The API returns user data as a JSON response body with standard REST envelope. [inferred]`
  - Never tag existing spec content — only new additions
- [ ] Add `## Your Job` section:
  1. Read the spec text above
  2. For each critical and important finding: locate section, apply fix using Edit tool on `{spec_file_path}`, mark inferences with `[inferred]`, preserve surrounding context
  3. Report what you changed (do NOT return full updated text — edits are in-place)
- [ ] Add `## Report Format` matching spec output format:
  - `FIXED: addressed={N} skipped={M}`
  - changes: severity, section, requirement, concern, recommendation, applied_change
  - skipped: severity, reason

### Task 5: Validation
**Time:** 2 min
**Dependencies:** Tasks 1-4

- [ ] Verify all 4 files exist
- [ ] Verify SKILL.md references `spec-simulator-prompt.md` and `spec-fixer-prompt.md`
- [ ] Verify command file invokes `superpowers:refining-specs`
- [ ] Verify no leftover "plan" references where "spec" should be
- [ ] Verify `[inferred]` tag mechanism documented in both SKILL.md and spec-fixer-prompt.md
- [ ] Verify convergence rules: 5 iterations, CONVERGED/ESCALATE/CONTINUE
