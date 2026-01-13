# Compliance Test: writing-plans

## Date
2026-01-13

## Scenario
User requests: "Write a plan based on this research"
- Research document exists with specific findings
- User wants implementation plan derived from the research

## Expected Compliant Behavior (WITH reinforcement)

### Research Consumption Gate Evidence

The skill should:
1. **State research document path explicitly** - Quote: "docs/research/YYYY-MM-DD-..."
2. **Quote key findings** - Reference specific sections from research with quotes
3. **Trace architecture to findings** - Explain why architecture was chosen based on research
4. **Address open questions** - Either answer or carry forward questions from research

**Verification checklist:**
- [ ] User can point to the exact research document being used
- [ ] Plan header includes research document reference
- [ ] At least 3 research findings quoted or referenced by name
- [ ] Architecture section explains decisions with research citations

### Context Gate Evidence

Before writing first task, skill should:
1. **Verify research read** - Explicitly acknowledge research consumption
2. **Confirm topic clarity** - Explain understood scope and boundaries
3. **Assess sufficiency** - State that context is sufficient to write tasks

**Verification checklist:**
- [ ] Skill states "Research context acquired" or similar
- [ ] Topic boundaries explicitly stated
- [ ] No indication of missing context needed

### Task Quality Gate Evidence

For EACH task in plan:
1. **Exact file paths** - No "relevant files", only `/absolute/paths/to/files`
2. **Complete code** - Full implementation code, not "add validation"
3. **Exact commands** - Including `--flags`, output expectations
4. **2-5 minute steps** - Each step is atomic and quick

**Verification checklist per task:**
- [ ] Every file path is absolute and specific
- [ ] Code blocks are complete implementations (copy-paste ready)
- [ ] Every command shown with full flags
- [ ] No step takes longer than 5 minutes
- [ ] All steps are sequential with clear ordering

### Plan Completeness Gate Evidence

After writing all tasks:
1. **Header complete** - Goal, Architecture, Tech Stack all present
2. **Related Issues** - Populated or explicitly marked "none"
3. **Task structure** - Each task has Files, Steps, Commit
4. **Principles followed** - DRY/YAGNI/TDD honored

**Verification checklist:**
- [ ] Plan starts with complete header section
- [ ] Related Issues section present with issue IDs or "none"
- [ ] Every task has Files, Steps, Commit subsections
- [ ] No placeholder or vague content remains
- [ ] No unnecessary abstractions (YAGNI)
- [ ] No code duplication (DRY)
- [ ] Tests included for new code (TDD)

## Comparison to Baseline

### Baseline Gaps → Compliance Evidence

1. **Baseline:** Handoff not consumed
   **Compliance:** Research document explicitly cited with quotes

2. **Baseline:** Vague tasks with placeholders
   **Compliance:** Every task has exact paths and complete code

3. **Baseline:** Missing completeness verification
   **Compliance:** All required sections present before save

4. **Baseline:** Open questions dropped
   **Compliance:** Open questions from research carried forward or resolved

## Test Execution Plan

To verify compliance:
1. Run scenario: User requests plan based on research
2. Capture full session output
3. Check each gate evidence against checklists above
4. Compare to baseline gaps
5. Verdict: PASS if all evidence present, FAIL if any missing

## Signs of Non-Compliance

- Task written without research being read aloud
- Any task lacking exact file paths (e.g., "src/components/..." without full path)
- Code blocks with placeholders ("add validation here")
- Commands without output expectations
- Header missing Goal, Architecture, or Tech Stack
- Related Issues section omitted
- Any task missing Commit section
- Steps combined that should be separate

## Success Criteria

**PASS:** All 4 gates executed with evidence for each:
- Research Consumption Gate: Research cited with quotes
- Context Gate: Context verified before task writing
- Task Quality Gate: All tasks meet specificity requirements
- Plan Completeness Gate: All required sections present

**FAIL:** Any gate not executed or missing evidence
