# Refining Specs Skill

A standalone skill and command that pressure-tests spec documents before plan generation. It iteratively simulates deriving an implementation plan from a spec, identifies gaps and contradictions, and autonomously patches them — without changing any stated design decision.

## Motivation

Today the pipeline is: brainstorming → spec → writing-plans → plan → refining-plans → execution. The brainstorming skill includes a lightweight spec-document-reviewer (completeness, contradictions, YAGNI), but it doesn't deeply test whether the spec contains enough information to produce a good plan. Gaps discovered during plan writing force expensive backtracking.

Refining-specs fills this gap by simulating plan generation from the spec, surfacing every point where the plan author would have to guess, and resolving those ambiguities autonomously before writing-plans is invoked.

## Scope

**New files:**
- `skills/refining-specs/SKILL.md` — main skill orchestration
- `skills/refining-specs/spec-simulator-prompt.md` — simulator subagent template
- `skills/refining-specs/spec-fixer-prompt.md` — fixer subagent template
- `commands/refine-specs.md` — `/refine-specs` command definition

**No changes to existing files.** The brainstorming skill's spec-document-reviewer remains as-is. This skill is standalone.

## Command Definition

`commands/refine-specs.md`:
```yaml
---
description: "Use when a spec needs pressure-testing before plan generation — iteratively simulates and refines until stable."
disable-model-invocation: true
---
Invoke the superpowers:refining-specs skill and follow it exactly as presented to you
```

## Orchestration Flow (SKILL.md)

**Announce at start:** "I'm using the refining-specs skill to pressure-test this spec." [inferred]

**When to Use decision tree:** Mirror refining-plans — "Have a spec?" → "Spec already tested?" → refining-specs / "Write a spec first" / "Generate plan". [inferred]

Three phases mirroring refining-plans:

### Phase 1: Setup

1. **Locate spec** — user provides path, or auto-detect most recent file in `docs/superpowers/specs/`
2. **Read and snapshot** — read the full spec text, store as original snapshot for drift detection
3. **Detect domain** — determine domain from spec content (backend, frontend, infrastructure, data, plugin-dev, ML/AI, devops, full-stack, other) and identify key technologies
4. **Generate role profiles:**
   - **spec-simulator:** "Senior {domain} engineer who pressure-tests {technology} specs by attempting to derive implementation plans"
   - **spec-fixer:** "{domain} specialist who patches {technology} spec gaps while preserving design decisions"

### Phase 2: Iteration Loop (max 5)

Each round:

1. **Dispatch spec-simulator subagent** (via Task tool, general-purpose) with:
   - Full spec text inline (not file path — simulator is read-only, so inline avoids file I/O and keeps the full text in context for analysis)
   - Role profile
   - Iteration number
   - Iteration context: if iteration 1, state "First pass — examine everything"; if iteration > 1, provide summary of previous fixes so simulator focuses on affected sections [inferred]

2. **Evaluate findings:**
   - No critical/important issues → **CONVERGED**, skip to Phase 3
   - Has findings → proceed to fix

3. **Dispatch spec-fixer subagent** (via Task tool, general-purpose) with:
   - Spec file path (fixer needs the path because it edits the file directly using the Edit tool for minimal inline patches) [inferred]
   - Full spec text inline (so fixer has full context without needing to re-read) [inferred]
   - Critical + important findings only
   - Original snapshot for drift reference

4. **Track per round:** `Round {N}: critical={X} important={Y} minor={Z} → {signal}` [inferred]

5. **Check convergence:**
   - No critical/important findings → **CONVERGED**
   - Critical count unchanged (round 2+) OR same concern persists (round 3+) → **ESCALATE**
   - Drift detected (spec changed direction from snapshot) → **ESCALATE**
   - Otherwise → **CONTINUE**

### Phase 3: Report & Handoff

Present refinement summary with iteration table:

```
| Round | Critical | Important | Minor | Fixes Applied |
|-------|----------|-----------|-------|---------------|
| 1     | 2        | 3         | 1     | 4             |
| 2     | 0        | 1         | 2     | 1             |
| 3     | 0        | 0         | 1     | —             |
```

Offer two options:
1. **Generate plan** — invoke `superpowers:writing-plans`
2. **Refine again** — run another pass

On ESCALATE: present stuck findings with context on what was tried. User can make the decision themselves and re-run, or accept the spec as-is with known gaps.

## Spec Simulator

**Purpose:** Attempt to generate a plan from the spec and report every point where it couldn't proceed without guessing.

**Process:**
1. Read the spec as if about to write an implementation plan
2. For each section, attempt to derive concrete tasks (file creates/modifies, step-by-step instructions, test commands)
3. Track every point where a guess, assumption, or decision was required
4. The throwaway plan skeleton stays in-context only — never written to disk

**Seven gap patterns:**

| Pattern | Spec Context |
|---------|-------------|
| Missing Decisions | Spec describes a requirement but never states how to implement it (e.g., "support caching" with no caching strategy) |
| Behavioral Ambiguity | Multiple valid interpretations that would produce different plans |
| Undefined Error Paths | Spec describes happy path but not failure modes |
| Unstated Assumptions | Spec assumes something about the codebase, environment, or dependencies without stating it |
| Dependency Gaps | Spec references something that isn't defined in the spec or codebase |
| Conflict Detection | Spec contradicts itself, or contradicts existing code/patterns |
| Sequencing Issues | Components described in an order that creates circular dependencies when planned |

**Severity levels:**

| Severity | Definition | Example |
|----------|-----------|---------|
| Critical | Blocks plan generation entirely | "Auth method not specified, entire flow depends on it" |
| Important | Needs clarification to produce a correct plan | "Error response format not defined for validation failures" |
| Minor | Nice to clarify but won't block plan generation | "Loading spinner behavior not specified" |

**Output format:**
```
FINDINGS: critical={N} important={M} minor={P}

critical:
  - section: [which spec section]
    requirement: [exact text from spec]
    concern: [what's missing or ambiguous]
    recommendation: [best-guess resolution]

important:
  - ...

minor:
  - ...
```

**Constraint:** The simulator never modifies the spec. It only reports findings. The simulator uses a Task tool (general-purpose) and has no file write access. [inferred]

## Spec Fixer

**Purpose:** Apply targeted patches to resolve findings, inferring missing details from context, without changing any stated design decision.

**Core constraints:**
- **Preserve all design decisions** — if the spec says "use WebSocket," the fixer never changes that
- **Minimal edits** — patch gaps inline, don't rewrite sections
- **Preserve voice** — don't change tone, style, or narrative structure
- **Never restructure** — no reorganizing sections or moving content around
- **Infer from context** — when the spec is silent on something, derive the answer from surrounding context (other spec sections, stated technology choices, architectural patterns)
- **Mark inferences** — every added inference gets an `[inferred]` tag inline

**Inference example:**

Before:
> The API returns user data.

After (if spec mentions JWT elsewhere and REST patterns):
> The API returns user data as a JSON response body with standard REST envelope `{ data, error, meta }`. [inferred] Authentication is validated via the JWT token specified in the Auth section. [inferred]

**Fixer mechanism:** The spec-fixer subagent receives the spec file path and uses the Edit tool for inline patches. It also receives the full spec text inline and the original snapshot so it can detect drift. It returns the report format below but does NOT return full updated text — it edits the file in place. [inferred]

**Red flags (never do):**
- Remove or contradict a stated decision
- Restructure the document
- Add features not implied by existing spec content
- Fix minor findings (only critical + important)

**Output format:**
```
FIXED: addressed={N} skipped={M}

changes:
  - severity: [critical|important]
    section: [which spec section]
    requirement: [exact text from spec]
    concern: [original concern]
    recommendation: [proposed resolution]
    applied_change: [what was changed]

skipped:
  - severity: [critical|important|minor]
    reason: [why skipped — e.g., "conflicts with design decision", "requires user input"]
```

## Convergence & Escalation

**CONVERGED:** No critical or important findings in current round. Spec is ready for plan generation.

**ESCALATE** (any of):
- Critical count unchanged between rounds (round 2+) — fixer can't resolve these
- Same specific concern appears 3+ rounds — recurring, needs human decision
- Drift detected: spec's direction shifted from the original snapshot — fixer went too far

**CONTINUE:** Any other state. Proceed to next simulation round.

**On ESCALATE:** Present stuck findings to user with context on what was tried. User can make the decision themselves and re-run, or accept the spec as-is with known gaps.

**Max iterations:** 5, then forced escalate regardless.

## What Stays the Same

- Brainstorming skill and its spec-document-reviewer — unchanged
- Writing-plans skill — unchanged, receives a refined spec as input
- Refining-plans skill — unchanged, operates on plans not specs
- Existing spec files — not modified
- All other commands and skills — not modified
