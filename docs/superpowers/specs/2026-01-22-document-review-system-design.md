# Document Review System Design

## Overview

Add two new review stages to the superpowers workflow:

1. **Spec Document Review** - After brainstorming, before writing-plans
2. **Plan Document Review** - After writing-plans, before implementation

Both follow the iterative loop pattern used by implementation reviews.

## Spec Document Reviewer

**Purpose:** Verify the spec is complete, consistent, and ready for implementation planning.

**Location:** `skills/brainstorming/spec-document-reviewer-prompt.md`

**What it checks for:**

| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, "TBD", incomplete sections |
| Coverage | Missing error handling, edge cases, integration points |
| Consistency | Internal contradictions, conflicting requirements |
| Clarity | Ambiguous requirements |
| YAGNI | Unrequested features, over-engineering |

**Output format:**
```
## Spec Review

**Status:** Approved | Issues Found

**Issues (if any):**
- [Section X]: [issue] - [why it matters]

**Recommendations (advisory):**
- [suggestions that don't block approval]
```

**Review loop:** Issues found -> brainstorming agent fixes -> re-review -> repeat until approved.

**Dispatch mechanism:** Use the Task tool with `subagent_type: general-purpose`. The reviewer prompt template provides the full prompt. The brainstorming skill's controller dispatches the reviewer.

## Plan Document Reviewer

**Purpose:** Verify the plan is complete, matches the spec, and has proper task decomposition.

**Location:** `skills/writing-plans/plan-document-reviewer-prompt.md`

**What it checks for:**

| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, incomplete tasks |
| Spec Alignment | Plan covers spec requirements, no scope creep |
| Task Decomposition | Tasks atomic, clear boundaries |
| Task Syntax | Checkbox syntax on tasks and steps |
| Chunk Size | Each chunk under 1000 lines |

**Chunk definition:** A chunk is a logical grouping of tasks within the plan document, delimited by `## Chunk N: <name>` headings. The writing-plans skill creates these boundaries based on logical phases (e.g., "Foundation", "Core Features", "Integration"). Each chunk should be self-contained enough to review independently.

**Spec alignment verification:** The reviewer receives both:
1. The plan document (or current chunk)
2. The path to the spec document for reference

The reviewer reads both and compares requirements coverage.

**Output format:** Same as spec reviewer, but scoped to the current chunk.

**Review process (chunk-by-chunk):**
1. Writing-plans creates chunk N
2. Controller dispatches plan-document-reviewer with chunk N content and spec path
3. Reviewer reads chunk and spec, returns verdict
4. If issues: writing-plans agent fixes chunk N, goto step 2
5. If approved: proceed to chunk N+1
6. Repeat until all chunks approved

**Dispatch mechanism:** Same as spec reviewer - Task tool with `subagent_type: general-purpose`.

## Updated Workflow

```
brainstorming -> spec -> SPEC REVIEW LOOP -> writing-plans -> plan -> PLAN REVIEW LOOP -> implementation
```

**Spec Review Loop:**
1. Spec complete
2. Dispatch reviewer
3. If issues: fix -> goto 2
4. If approved: proceed

**Plan Review Loop:**
1. Chunk N complete
2. Dispatch reviewer for chunk N
3. If issues: fix -> goto 2
4. If approved: next chunk or implementation

## Markdown Task Syntax

Tasks and steps use checkbox syntax:

```markdown
- [ ] ### Task 1: Name

- [ ] **Step 1:** Description
  - File: path
  - Command: cmd
```

## Error Handling

**Review loop termination:**
- No hard iteration limit - loops continue until reviewer approves
- If loop exceeds 5 iterations, the controller should surface this to the human for guidance
- The human can choose to: continue iterating, approve with known issues, or abort

**Disagreement handling:**
- Reviewers are advisory - they flag issues but don't block
- If the agent believes reviewer feedback is incorrect, it should explain why in its fix
- If disagreement persists after 3 iterations on the same issue, surface to human

**Malformed reviewer output:**
- Controller should validate reviewer output has required fields (Status, Issues if applicable)
- If malformed, re-dispatch reviewer with a note about expected format
- After 2 malformed responses, surface to human

## Files to Change

**New files:**
- `skills/brainstorming/spec-document-reviewer-prompt.md`
- `skills/writing-plans/plan-document-reviewer-prompt.md`

**Modified files:**
- `skills/brainstorming/SKILL.md` - add review loop after spec written
- `skills/writing-plans/SKILL.md` - add chunk-by-chunk review loop, update task syntax examples
