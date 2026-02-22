---
name: service-delivery-system
description: Use when managing client service engagements from intake to delivery, coordinating multi-stage deliverables, tracking milestones across agency projects, or ensuring consistent quality before client handoff
---

# Service Delivery System

## Overview

A structured process for running client engagements from first contact to final delivery. Prevents dropped deliverables, scope creep, and inconsistent quality across agency work.

**Core principle:** Every engagement needs explicit scope, milestones, and acceptance criteria confirmed in writing before work begins.

## When to Use

- Starting a new client engagement or project
- Coordinating deliverables across multiple contributors or agents
- Hitting missed milestones or scope confusion mid-project
- Preparing to hand off work to a client

**Don't use when:** Work is purely internal with no client deliverable.

## The Six Stages

### Stage 1: Intake & Scoping

Capture before starting any work:
- Client name, contact, and communication channel
- Service type (match to catalog)
- Deliverable definition: what "done" looks like, in concrete terms
- Hard deadlines and milestones
- Acceptance criteria the client will use to approve delivery

**Output:** Scope document signed off by client before Stage 2 begins.

### Stage 2: Setup & Kickoff

- Create project workspace (see Directory Structure below)
- Assign a single delivery owner accountable for the engagement
- Break work into milestones with explicit dates
- Schedule client check-ins at 25%, 50%, 75% completion
- Confirm kickoff in writing

### Stage 3: Execution

- Track each milestone against committed dates
- Escalate blockers immediately—don't wait for the next check-in
- Log all client communications in `communications/`
- Version all deliverables (never overwrite without keeping prior version)

### Stage 4: Quality Review

Two-person review minimum before anything reaches the client.

Review checklist:
- [ ] Every scope item is complete
- [ ] Deliverables match agreed format and spec
- [ ] Client-facing content reviewed for accuracy and tone
- [ ] No known issues left open

Do not advance to Stage 5 with open review issues.

### Stage 5: Delivery & Handoff

- Package deliverables in the agreed format
- Include a delivery summary: what's included and how to use it
- Send and confirm receipt with the client
- Schedule a post-delivery check-in (1–2 weeks out) before closing the project

### Stage 6: Post-Delivery

- Collect client feedback (structured: what worked, what didn't)
- Document lessons learned in `review-notes.md`
- Archive project files
- Update service catalog if the engagement revealed gaps

## Directory Structure

```
services/
  catalog/
    <service-name>.md           # Definition, scope, standard timeline
  engagements/
    <YYYY-MM-DD>-<client>/
      scope.md                  # Approved scope document
      deliverables/             # Versioned work products
      communications/           # Client correspondence log
      review-notes.md           # QA notes + post-delivery feedback
```

## Quick Reference

| Stage | Required Output | Gate to Next Stage |
|-------|-----------------|--------------------|
| Intake | Scope document | Client written approval |
| Setup | Workspace + milestones | Team confirmed |
| Execution | Versioned deliverables | All milestones hit |
| Review | Checklist complete | Zero open issues |
| Delivery | Delivered + receipt confirmed | Client acknowledgment |
| Post-delivery | Feedback + archive | Filed and closed |

## Escalation Rules

- **Milestone slipping >20%:** Alert delivery owner immediately, don't absorb silently
- **Scope creep request:** Stop, re-scope, get written approval before continuing
- **Client unresponsive >2 business days:** Escalate to account lead
- **Open issues at review:** Fix before delivery—never ship known defects

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Starting work before written scope approval | Gate Stage 2 on explicit client sign-off |
| No milestone dates at kickoff | Set all dates in Stage 2, not mid-project |
| Single-person review | Minimum two reviewers—creator + independent |
| Delivering without confirming receipt | Follow up until client acknowledges |
| Skipping post-delivery check-in | Book it at kickoff so it doesn't get dropped |
| Scope creep absorbed silently | Every change goes through re-scoping, no exceptions |
