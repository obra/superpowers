---
name: manus-planning
description: Use for complex multi-step tasks requiring persistent memory across context resets, long autonomous runs, or multi-session projects
---

# Manus-Style Planning

## Overview

Persistent file-based planning for complex tasks. Uses 3 markdown files as external memory that survives context resets, enabling work on tasks that span many tool calls or multiple sessions.

**Based on:** [planning-with-files](https://github.com/OthmanAdi/planning-with-files) by OthmanAdi

**Announce at start:** "I'm using the manus-planning skill for persistent tracking."

**Files location:** `docs/manus/` (tracked in git)

**When to use this vs native planning:**
- **Native (writing-plans + executing-plans):** Short tasks (<30 min), interactive development with human checkpoints
- **Manus (this skill):** Long autonomous runs, multi-session projects, tasks requiring >50 tool calls

## The 3 Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `task_plan.md` | Goal, phases, decisions, errors | Before major decisions |
| `findings.md` | Research, requirements, resources | After every 2 search/view operations |
| `progress.md` | Session log, test results, detailed actions | After completing actions |

## Phase 0: Initialization

### Existing Task Detection

Before creating files, check for existing manus task:

**Case A: No `docs/manus/task_plan.md` exists**
- Fresh start, proceed to file creation

**Case B: `task_plan.md` exists but NO `.active` marker**
- Previous task was completed
- Auto-archive: Move files to `docs/manus/archive/YYYY-MM-DD-<topic>/`
- Log: "Archived completed task to docs/manus/archive/..."
- Proceed to file creation

**Case C: `task_plan.md` exists AND `.active` marker exists**
- Active task in progress
- **Ask user:**
  ```
  There's an active manus task: "[goal from task_plan.md]"
  Current phase: [X of 5]

  Is your request:
  1. A continuation of this task (resume where you left off)
  2. A new separate task (archives existing task)
  ```
- If continuation: Skip to Phase 1 (resume work)
- If new task: Archive existing files, then proceed to file creation

### File Creation

1. Create `docs/manus/` directory if not exists
2. Create the 3 files from templates (see File Formats below)
3. **If coming from brainstorming:** Copy design document content into `findings.md` under "## Design Document" section
4. Create marker file `docs/manus/.active` (empty file to enable hooks)

## Phases 1-5: Core Work

### Phase 1: Requirements & Discovery
- Understand user needs
- Gather information about the codebase
- Document requirements in `findings.md`
- Update `task_plan.md` with refined goal

### Phase 2: Planning & Structure
- Decide technical approach
- Document decisions in `task_plan.md` Decisions table
- Break work into actionable steps

### Phase 3: Implementation
- Build the solution
- Can invoke other skills (TDD, debugging, code-review)
- Log actions in `progress.md`
- Log errors in both `task_plan.md` and `progress.md`

### Phase 4: Testing & Verification
- Run tests, verify functionality
- Document test results in `progress.md`
- Fix any issues found

### Phase 5: Delivery
- Final review
- Clean up code
- Prepare for handoff

## Core Rules

### Rule 1: Plan First
Never begin complex work without `task_plan.md` in place.

### Rule 2: The 2-Action Rule
After every 2 view/browser/search operations, IMMEDIATELY update `findings.md` with key discoveries. Visual and search results don't persist in context - save them to files.

### Rule 3: Read Before Deciding
Before major decisions or file modifications, re-read `task_plan.md` to maintain goal focus. The PreToolUse hook helps with this automatically.

### Rule 4: Update After Acts
After completing actions:
- Mark phase status in `task_plan.md`
- Log action details in `progress.md`
- Note any files modified

### Rule 5: Log All Errors
Every error goes into:
- `task_plan.md` Errors Encountered section (with resolution)
- `progress.md` Error Log (with timestamp and details)

## Completion

When all 5 phases are complete:

1. Mark all phases as `complete` in `task_plan.md`
2. **Remove marker file:** Delete `docs/manus/.active`
3. **Announce:** "I'm using the finishing-a-development-branch skill to complete this work."
4. **REQUIRED SUB-SKILL:** Use superpowers-ng:finishing-a-development-branch

## File Formats

### task_plan.md

```markdown
# [Task Name]

**Goal:** [One clear sentence - your north star]

**Current Phase:** [1-5] - [Phase Name]

## Phases

### Phase 1: Requirements & Discovery
- [ ] Understand user requirements
- [ ] Explore relevant codebase areas
- [ ] Document findings

**Status:** pending | in_progress | complete

### Phase 2: Planning & Structure
- [ ] Decide technical approach
- [ ] Document key decisions
- [ ] Break into actionable steps

**Status:** pending | in_progress | complete

### Phase 3: Implementation
- [ ] [Specific implementation tasks]

**Status:** pending | in_progress | complete

### Phase 4: Testing & Verification
- [ ] Run tests
- [ ] Verify functionality
- [ ] Fix issues

**Status:** pending | in_progress | complete

### Phase 5: Delivery
- [ ] Final review
- [ ] Clean up
- [ ] Handoff

**Status:** pending | in_progress | complete

## Key Questions
- [Important questions to answer during the task]

## Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| | | |

## Errors Encountered

| Error | Attempts | Resolution |
|-------|----------|------------|
| | | |

## Notes
- Remember to update phase status as you progress
- Re-read this file before major decisions
- Log all errors for future reference
```

### findings.md

```markdown
# Findings

## Requirements
[What the user requested - specific requirements]

## Design Document
[If coming from brainstorming, design content goes here]

## Research Findings
[Key discoveries from exploration, web searches, documentation]

## Technical Decisions
[Architecture and implementation choices with reasoning]

## Issues Encountered
[Problems and their resolutions - broader than coding errors]

## Resources
- [Useful URLs]
- [File paths]
- [API references]
- [Documentation links]

## Visual/Browser Findings
[CRITICAL: Information learned from images, PDFs, browser results - this content doesn't persist in context, save it here immediately]
```

### progress.md

```markdown
# Progress Log

## Session: [Date]

### Phase 1: Requirements & Discovery
**Status:** pending | in_progress | complete
**Started:** [timestamp]

**Actions:**
- [What was done]

**Files Modified:**
- [List of files]

### Phase 2: Planning & Structure
**Status:** pending | in_progress | complete
**Started:** [timestamp]

**Actions:**
- [What was done]

**Files Modified:**
- [List of files]

[Continue for each phase...]

## Test Results

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| | | | |

## Error Log

| Timestamp | Error | Resolution |
|-----------|-------|------------|
| | | |

## 5-Question Reboot Check
Use these questions to resume after context reset:

1. **Where am I?** [Current phase]
2. **Where am I going?** [Remaining phases]
3. **What's the goal?** [From task_plan.md]
4. **What have I learned?** [Key findings]
5. **What have I done?** [Completed actions]
```

## Context Reset Recovery

If context is cleared or compacted mid-task:

1. Read `docs/manus/task_plan.md` for goal and current phase
2. Read `docs/manus/progress.md` for what's been done
3. Read `docs/manus/findings.md` for research and decisions
4. Answer the 5-Question Reboot Check
5. Resume from current phase

## Remember

- Files are your external memory - use them
- Update frequently, not in batches
- The 2-Action Rule prevents losing research
- PreToolUse hook reminds you of the plan automatically
- Stop and ask when blocked, don't guess
