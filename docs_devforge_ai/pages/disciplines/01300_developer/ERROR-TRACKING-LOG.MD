# Agent Error Tracking and Learning Log

## Purpose
This document tracks errors encountered during agent development, their symptoms, root causes, and implemented fixes. Used for learning purposes and preventing recurrence of similar issues.

## Error Index

| Error ID | Title | Date | Status | Priority | Category |
|----------|-------|------|--------|----------|----------|
| ERR-001 | [Specialist Analysis Generating Hypothetical Content](#error-specialist-analysis-generating-hypothetical-content) | 2026-01-16 | Fixed | High | Correspondence Agent / Specialist Analysis |
| ERR-002 | [HITL Tasks Not Assigned to Specialists](#error-hitl-tasks-not-assigned-to-specialists) | 2026-01-16 | Fixed | High | Correspondence Agent / HITL System |

---

## Error Tracking Template
Use this template for each error entry:

```markdown
## Error: [Descriptive Error Title] {#error-descriptive-error-title}

**Error ID:** ERR-XXX
**Date:** YYYY-MM-DD
**Reported By:** [Name/Agent]
**Status:** [Open/In Progress/Fixed/Closed]
**Priority:** [Critical/High/Medium/Low]
**Category:** [Agent Type/Component/Area]

### Symptoms
- [Clear description of what was observed]
- [Error messages, logs, or user reports]
- [Impact on system/user experience]

### Root Cause Analysis
- [What caused the error]
- [Technical details]
- [Code/component involved]
- [Environmental factors]

### Reproduction Steps
1. [Step by step to reproduce]
2. [Required conditions/data]
3. [Test cases that trigger the error]

### Fix Implementation
- [Code changes made]
- [Files modified]
- [Testing performed]
- [Validation steps]

### Prevention Measures
- [Code review changes]
- [Testing improvements]
- [Documentation updates]
- [Process changes]

### Lessons Learned
- [Key insights]
- [Best practices identified]
- [Future considerations]

### Related Issues
- [Links to related errors/PRs]
- [Similar patterns identified]
```

---

## Error: Specialist Analysis Generating Hypothetical Content {#error-specialist-analysis-generating-hypothetical-content}

**Error ID:** ERR-001
**Date:** 2026-01-16
**Reported By:** Construct AI Development Team
**Status:** Fixed
**Priority:** High
**Category:** Correspondence Agent / Specialist Analysis

### Symptoms
- Specialist analysis outputs started with "Given the constraints and requirements of the task, without access to the actual project correspondence"
- LLM was generating hypothetical scenarios instead of analyzing provided correspondence content
- Analysis lacked specific references to actual correspondence text
- Impact: Specialist reviews contained generic content instead of evidence-based analysis

### Root Cause Analysis
- Specialist prompts stated "You will receive the following inputs" implying future receipt rather than current availability
- Context preparation lacked clear demarcation that correspondence content was actually provided
- No validation to ensure correspondence content was present before LLM analysis
- LLM interpreted the prompt language as indicating lack of access to actual correspondence

### Reproduction Steps
1. Submit correspondence through the 00435 correspondence workflow
2. Wait for specialist analysis phase (Step 4)
3. Review specialist analysis outputs in HITL modal
4. Observe introductory hypothetical language instead of direct correspondence analysis

### Fix Implementation
- Updated all specialist prompt files (16/18) to explicitly state "You ARE receiving the actual correspondence content in this prompt"
- Changed "Input Data Context" section to "CRITICAL INPUT DATA - ACTUAL CORRESPONDENCE IS PROVIDED BELOW"
- Enhanced context preparation with clear section headers and warnings against hypothetical content
- Added validation checks to ensure correspondence content exists (minimum 10 characters) before LLM calls
- Added logging to verify content validation passed

**Files Modified:**
- `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/*.md` (16 files)
- `client/src/pages/00435-contracts-post-award/components/agents/correspondence-04-domain-specialist-agent.js`

### Prevention Measures
- Implement content validation in all agent workflows before LLM calls
- Use explicit language in prompts about data availability
- Add clear demarcation in context preparation
- Include validation logging for debugging future issues

### Lessons Learned
- LLM behavior is highly sensitive to prompt language and perceived data availability
- "Will receive" vs "Are receiving" creates different LLM interpretations
- Clear section headers and explicit warnings help guide LLM behavior
- Validation at multiple levels prevents downstream issues

### Related Issues
- None identified at this time
- Monitor for similar issues in other agent workflows

---

## Error: HITL Tasks Not Assigned to Specialists {#error-hitl-tasks-not-assigned-to-specialists}

**Error ID:** ERR-002
**Date:** 2026-01-16
**Reported By:** Construct AI Development Team
**Status:** Fixed
**Priority:** High
**Category:** Correspondence Agent / HITL System

### Symptoms
- HITL tasks were being created successfully for specialist analyses
- Tasks appeared in the system but were not assigned to any specialists
- Specialists reported not receiving HITL tasks in their dashboards
- Tasks remained in "pending" status without assignees

### Root Cause Analysis
- HITL task creation was working correctly via `/api/tasks/hitl` POST endpoint
- Backend automatically calls `hitlAssignmentService.assignHITLTask()` during creation
- Specialist agent was attempting manual assignment via non-existent endpoint
- Manual assignment calls were failing silently, leaving tasks unassigned
- No error handling for failed manual assignment attempts

### Reproduction Steps
1. Submit correspondence through the 00435 workflow
2. Wait for specialist analysis phase completion
3. Check HITL tasks in the system - they exist but are unassigned
4. Verify specialists' My Tasks dashboards show no HITL tasks
5. Confirm tasks remain in "pending" status indefinitely

### Fix Implementation
- Removed manual HITL assignment logic from specialist agent
- Let backend handle automatic assignment during task creation
- Simplified HITL creation flow to rely on existing assignment service
- Added proper logging for assignment status
- Ensured error handling doesn't break the workflow

**Files Modified:**
- `client/src/pages/00435-contracts-post-award/components/agents/correspondence-04-domain-specialist-agent.js`

**Key Changes:**
- Removed POST call to `/api/tasks/hitl/{id}/assign`
- Relied on automatic assignment during POST to `/api/tasks/hitl`
- Added logging confirmation that backend handles assignment

### Prevention Measures
- Document HITL assignment flows and responsibilities
- Avoid manual assignment calls when automatic assignment exists
- Add validation that tasks are properly assigned after creation
- Include assignment status in task creation responses
- Test HITL workflows end-to-end including assignment verification

### Lessons Learned
- HITL assignment happens automatically during task creation - don't duplicate it
- Manual assignment attempts can silently fail and mask real issues
- Backend services handle complex assignment logic (discipline matching, workload balancing)
- Always verify the full workflow including automatic processes

**Date:** YYYY-MM-DD
**Reported By:** [Name/Agent]
**Status:** [Open/In Progress/Fixed/Closed]
**Priority:** [Critical/High/Medium/Low]
**Category:** [Agent Type/Component/Area]

### Symptoms
- [Clear description of what was observed]
- [Error messages, logs, or user reports]
- [Impact on system/user experience]

### Root Cause Analysis
- [What caused the error]
- [Technical details]
- [Code/component involved]
- [Environmental factors]

### Reproduction Steps
1. [Step by step to reproduce]
2. [Required conditions/data]
3. [Test cases that trigger the error]

### Fix Implementation
- [Code changes made]
- [Files modified]
- [Testing performed]
- [Validation steps]

### Prevention Measures
- [Code review changes]
- [Testing improvements]
- [Documentation updates]
- [Process changes]

### Lessons Learned
- [Key insights]
- [Best practices identified]
- [Future considerations]

### Related Issues
- [Links to related errors/PRs]
- [Similar patterns identified]