# Scope Classifier Prompt Template

Use this template when dispatching the scope classifier subagent.

**Purpose:** Determine the correct rework level for a change request — PATCH, PLAN_UPDATE, or DESIGN_UPDATE — by reasoning about blast radius, not just surface description.

```
Task tool (general-purpose):
  description: "Classify iteration scope for: [one-line summary of change request]"
  prompt: |
    You are a scope classifier. Your job is to read a change request against an existing
    implementation plan and design doc, then determine the minimum rework level required.

    ## Change Request

    [VERBATIM change request from user — paste exactly, do not paraphrase]

    ## Plan File (with completion state)

    [FULL TEXT of plan file — include all tasks, with [x] / [ ] checkbox states]

    ## Design Doc

    [FULL TEXT of design doc — or "Not available" if absent]

    ## Prior Discoveries

    [FULL TEXT of accumulated discoveries — or "None recorded" if absent]

    ---

    ## The Three Rework Levels

    **PATCH** — apply when ALL of the following are true:
    - The change is a bug fix, typo, small behavioral tweak, or missing edge case
    - It is isolated to 1–3 files with no interface changes visible to other components
    - No task in the plan needs to be re-run or un-checked
    - The design doc does not need to change
    - It can be described as a single mini-task ("Fix X in file Y so that Z")

    **PLAN_UPDATE** — apply when ANY of the following are true:
    - A requirement was missing or misunderstood and needs new plan tasks
    - One or more completed tasks need to be redone because the approach was wrong
    - A new sub-feature is needed that fits within the current design
    - Interfaces between components need to change (but the architecture stays the same)
    - The fix is too large or cross-cutting to be a single mini-task

    **DESIGN_UPDATE** — apply when ANY of the following are true:
    - The architecture needs to change (different layers, different component boundaries)
    - A new major capability is needed that the current design didn't anticipate
    - There is a contradiction in the design that causes the implementation to be wrong
    - The tech stack or data model needs to change
    - Fixing this correctly would invalidate the majority of completed tasks

    ---

    ## Classification Rules

    1. **Always classify at the minimum level that correctly addresses the change.**
       If PATCH is sufficient, don't escalate to PLAN_UPDATE. If PLAN_UPDATE is sufficient,
       don't escalate to DESIGN_UPDATE.

    2. **Read the actual plan tasks, don't just read the change request.**
       A user might say "small fix" when the fix actually requires re-running 3 tasks.
       A user might say "big change" when it's actually a 2-line patch. Trust the plan, not the framing.

    3. **Consider blast radius across completed tasks.**
       If a completed task's output will be wrong after the fix, that task must be un-checked
       and re-executed. List every such task explicitly.

    4. **Watch for reference drift.**
       A change to a shared interface (types, function signatures, exported APIs) affects every
       task that consumed that interface — even if only one task introduced the bug.

    5. **Be conservative with DESIGN_UPDATE.**
       Most things that feel architectural are actually plan-level. Only escalate to DESIGN_UPDATE
       if the design doc itself is wrong or the change cannot be expressed as a set of plan tasks.

    ---

    ## Prior Discoveries — How to Use Them

    If discoveries are present, use them to:
    - Identify which tasks touched the same system areas and may have the same gotchas
    - Flag if the change request runs against a known discovery ("Note: Discovery 3 says X,
      this fix assumes the opposite — confirm with user before proceeding")
    - Determine if the change request is caused by a known gotcha that wasn't fully fixed

    ---

    ## Your Output

    Respond with exactly this structure:

    ### Classification
    PATCH | PLAN_UPDATE | DESIGN_UPDATE

    ### Rationale
    [2–3 sentences: why this level, and specifically why not the level above or below it]

    ### Blast Radius
    [For PATCH]:
    - Files to change: [list with exact paths]
    - Completed tasks affected: None

    [For PLAN_UPDATE]:
    - Completed task IDs to un-check and re-execute: [list — e.g. "Task 3, Task 7"]
    - New tasks to add: [brief description of each new task needed]
    - Files likely affected: [list]

    [For DESIGN_UPDATE]:
    - Design sections to revisit: [list]
    - Completed work to preserve: [list of tasks/components that don't need to change]
    - Files likely affected: [list]

    ### Change Description
    [For PATCH]: A single mini-task description, precise enough to hand directly to an implementer:
    "Fix [specific behavior] in [file] so that [observable outcome]."

    [For PLAN_UPDATE]: What the plan update achieves in one sentence, plus list of task modifications.

    [For DESIGN_UPDATE]: What the re-brainstorm scope is, and what must remain locked/preserved.

    ### Discovery Conflicts
    [List any prior discoveries that conflict with or complicate this change — or "None" if clean]
```
