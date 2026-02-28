# Design: Persistent Validator Pool for Subagent-Driven Development

**Date:** 2026-02-28  
**Status:** Under review  
**Scope:** `skills/subagent-driven-development/` + prompt templates

---

## Problem

Two confirmed failure modes in `subagent-driven-development`:

### 1. Phantom Completion

Tasks marked done but containing hallucinated or incomplete implementations. Observed more frequently on larger multi-step plans.

**Root cause:** The spec reviewer accepts plausible prose narratives without requiring verifiable evidence. Neither the implementer nor the reviewer is currently required to produce concrete, auditable output (test command output, git diff stat, file:line citations per requirement). A reviewer "told" to read code can still write a passing verdict without doing so.

### 2. Slow Validation

The sequential two-stage review pipeline (spec → quality) runs as fresh subagents per task. Each has ~30–60s startup overhead plus must re-read the codebase. On a 10-task plan with team mode: implementers parallelize, but the review pipeline still serializes.

---

## Solution: Two Independent Phases

Phase 1 ships first and standalone. Phase 2 is gated on an explicit SDK validation test.

---

## Phase 1: Mandatory Evidence Citations (prompt-only, ships now, both modes)

Directly addresses phantom completion. No architectural change. Works in both team mode and standard sequential mode.

Evidence citation requirements are the **single source of truth** for review quality across both modes. All other differences between team mode and standard mode review flows are intentional scope differences, not contradictions.

### implementer-prompt.md changes

Add a mandatory evidence section before "Report Format." The implementer must include:

- The exact test command run and its full output (paste — do not summarize)
- `git diff --stat` output
- List of new/modified files with approximate line counts of substantive new code
- If the task specifies a demonstrable behavior: the exact command that exercises it and its output

A completion report without this evidence is incomplete. The controller (team lead or main agent) must reject it and ask for re-submission with evidence included.

### spec-reviewer-prompt.md changes

Add mandatory citation requirement. For each requirement in the task spec, the reviewer must:

- Cite the specific `file:line` where it is implemented
- Include the function signature or a 2–3 line code excerpt as evidence
- Mark requirements with no citation found as ❌ MISSING

A ✅ approval without per-requirement citations is invalid. The controller must reject prose-only verdicts and request citations. This makes rubber-stamping immediately detectable.

---

## Phase 2: Persistent Validator Pool (structural)

### Blocking Prerequisite: SDK Memory Validation Test

**Before starting Phase 2 implementation, run this test:**

1. Create a team with one general-purpose agent member
2. Send message: "Remember the number 42. Acknowledge when you have it."
3. Wait for acknowledgment
4. Send second message: "What number did I ask you to remember?"
5. **If the agent answers "42"** → SDK retains context between SendMessage calls → proceed with Phase 2 as designed
6. **If the agent fails to recall** → SDK does not retain context → use the Phase 2 Fallback (combined-review-only) instead; abandon persistent topology

### Team Topology

```
- team-lead (orchestrator)
- implementer-1, implementer-2, implementer-3  ← parallel
- validator-1, validator-2                      ← persistent, combined spec+quality
```

### Validator Idle State Tracking

Validators declare state via TaskUpdate:
- Receiving a review request → `TaskUpdate(status: "in_progress", owner: "validator-N")`
- Returning a verdict → `TaskUpdate(status: "completed")` then notify team lead via SendMessage

Team lead checks TaskList before routing. If both validators show `in_progress`, team lead waits rather than sending to a mid-review validator.

### Combined Spec+Quality Review Pass

Each validator runs a single combined pass:

1. Receive: full task spec, implementer report + evidence, BASE_SHA, HEAD_SHA
2. Read git diff for the task (BASE_SHA → HEAD_SHA)
3. **Infer dependencies:** Read the task spec for references to prior tasks (e.g., "uses the authentication module from task 3," "extends the schema created in task 2"). For each inferred dependency, re-read that prior task's git diff from VCS. Do not rely on memory of prior approvals — re-read from source. (Note: writing-plans should include explicit dependency statements in task specs to make this reliable; implicit dependencies that go unmentioned in the spec may not be caught.)
4. **Spec compliance:** For each requirement in the task spec, cite `file:line` with code excerpt. Mark missing, extra, or misunderstood requirements.
5. **Code quality:** Assess naming, testing, YAGNI, pattern consistency on the same code pass.
6. Return structured verdict with separate spec section and quality section, both with citations.

**If spec fails:** Only spec issues are acted on. Quality issues are noted but not required to fix yet. Re-review after spec fix covers both sections again.

### Re-Review Loop Bound

Maximum **3 review cycles per task.** After 3 rejections:
- Team lead pauses plan execution
- Reports sticking point to the human with full history of rejection reasons
- Human decides: redesign the task, provide clarification, or accept as-is

### Context Poisoning Mitigation

If a validator incorrectly approves task N, downstream tasks may be reviewed against a false baseline.

**Proactive (re-read rule):** Validator infers and re-reads dependencies from VCS on every review. Memory of prior approval is not substituted for reading source.

**Reactive (bounded re-open):** If a downstream task's review reveals that an upstream approval was wrong, the team lead may flag the upstream task for one re-review. Cap: one re-open per task, maximum.

**Re-open cascade handling:** When task N is re-opened:
- Any downstream tasks that are **in-progress**: pause them immediately; implementers hold until task N's fix is confirmed
- Any downstream tasks that are **completed**: flag them for re-review after task N's fix is confirmed; they re-enter the review queue before the plan can advance past them

**Validator rotation (large plans):** For plans with more than 8 tasks, start a fresh validator after every 5 tasks completed. **Explicit tradeoff:** plans with >8 tasks are exactly the ones most likely to have cross-task gaps — rotation partially resets the cross-task memory that would catch them. The re-read rule still protects against gaps where the task spec explicitly mentions prior tasks; undeclared implicit cross-task dependencies may not be caught after a rotation. Rotation trades full cross-task coverage for bounded context cost. Document this explicitly in SKILL.md so users of large plans understand the limitation.

### Validator Failure Recovery

If a validator does not respond within 60 seconds of receiving a review request:
1. Team lead sends one follow-up ping
2. If no response within 30 additional seconds: treat validator as failed
3. Fall back to a fresh subagent review for that task using Phase 1 strengthened prompts (combined spec+quality in single pass)
4. Mark the failed validator's team slot unavailable; do not attempt to reuse it

### Phase 2 Fallback: Combined-Review-Only (if SDK memory not retained)

If the SDK validation test shows no context retention, abandon the persistent team member topology. Instead:

- Keep fresh subagents per review (as today)
- Merge spec and quality review into a single combined-review subagent (eliminating the sequential two-stage dependency)
- Launch the combined review in parallel while the next implementer starts work (not blocked sequentially)
- This still saves one agent invocation per task and removes the spec→quality sequential bottleneck, without relying on context retention

---

## Files to Change

### Phase 1 (ships now):
- `implementer-prompt.md` — add mandatory evidence section before report format
- `spec-reviewer-prompt.md` — add mandatory file:line citation requirement per requirement

### Phase 2 (after SDK validation):
- `SKILL.md` — update team composition, process diagram, red flags, add context rotation rule with explicit cross-task limitation disclosure
- `spec-reviewer-prompt.md` — extend to combined spec+quality validator prompt
- `code-quality-reviewer-prompt.md` — **delete.** Before deleting: run `grep -r "code-quality-reviewer-prompt" .` in the repo root and update any found references. If clean, delete directly.

### Not changed:
- `executing-plans` skill: unchanged
- Standard (non-team) `subagent-driven-development` mode: Phase 1 prompt hardening only; structural flow unchanged
- All other skills: unchanged

---

## Success Criteria

### Phase 1
- No phantom completions in a 5-task test. Verified by: (a) every ✅ verdict from the spec reviewer contains file:line citations, and (b) an auditor manually verifies that 3 randomly sampled citations — drawn from different tasks — correctly implement the stated requirement when read in context (not just that the file and line exist, but that the code at that location actually does what the requirement says)
- Both standard mode and team mode produce citation-backed verdicts under the same strengthened prompts

### Phase 2 (applicable only if SDK memory retention confirmed)
- Per-task review latency reduced by ≥40% vs. current sequential two-stage fresh-subagent flow (measured wall-clock on a 5-task plan)
- Validator correctly identifies a planted cross-task gap in an integration test: task N's spec mentions using a function from task N-2 that was never implemented; validator infers the dependency, re-reads task N-2's diff, and flags the gap
- Re-review loop bound triggers correctly: a task stuck in rejection escalates to human after exactly 3 cycles, not before and not after
- Re-open cascade: when task N is re-opened, in-progress downstream tasks are visibly paused before task N's fix is confirmed
