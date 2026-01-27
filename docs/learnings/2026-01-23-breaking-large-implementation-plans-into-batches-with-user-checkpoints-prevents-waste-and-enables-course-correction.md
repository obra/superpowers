---
date: 2026-01-23
tags: [planning, batch-execution, checkpoints, workflow]
workflow: [executing-plans, writing-plans]
---

# Breaking large implementation plans into batches with user checkpoints prevents waste and enables course correction

## Problem

When executing a implementation plan with multiple tasks (at least 5) for the schedule manager Lambda, there was a risk of:
- Building all components without feedback, then discovering fundamental issues
- User disengagement during long silent implementation periods
- Missing opportunities to adjust approach based on early results

## Solution

Divided the 10 tasks into 4 batches with explicit user checkpoints:
- **Batch 1 (Tasks 1-3)**: Lambda handler structure, SAM template, IAM permissions
- **Batch 2 (Task 4)**: Deploy Lambda (with build fixes discovered during execution)
- **Batch 3 (Tasks 5-7)**: Client library, API route updates, dependency installation
- **Batch 4 (Tasks 8-10)**: End-to-end deployment, documentation, TODO updates

After each batch:
1. Reported what was implemented
2. Showed verification output (build logs, deployment status, test results)
3. Stated "Ready for feedback"
4. Waited for explicit "continue" signal

This approach caught issues early (build problems in Batch 2, wrong IAM role in Batch 4) and kept user engaged throughout.

## Prevention

**Always use batched execution for multi-step implementations:**
- Break plans into 3-5 task batches (not single tasks, not all at once)
- Natural batch boundaries: structure → deploy → integrate → verify
- Report + verify + wait after each batch
- User controls pacing with "continue" signals

**Benefits:**
- Early error detection (build issues found in Batch 2, not Batch 4)
- User can course-correct mid-implementation
- Transparent progress without overwhelming detail
- Natural points to ask clarifying questions

**Red flags:**
- Executing entire 10-task plan silently
- Only reporting at the end
- No intermediate verification steps
