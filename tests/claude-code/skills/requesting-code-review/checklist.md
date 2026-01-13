# Checklist: requesting-code-review Compliance

## Context Gate (COMPULSORY)
- [ ] BASE_SHA captured via git command (git merge-base or similar)
- [ ] HEAD_SHA captured via git command (git rev-parse HEAD)
- [ ] Git diff generated and included in review context
- [ ] Summary of changes prepared for reviewers

## Dispatch Gate (COMPULSORY - all 4 required)
- [ ] Security Reviewer agent dispatched
- [ ] Performance Reviewer agent dispatched
- [ ] Style Reviewer agent dispatched
- [ ] Test Reviewer agent dispatched
- [ ] All 4 agents dispatched in parallel (single message with 4 Task calls)

## Agent Prompt Quality
- [ ] Each agent received git diff or file contents
- [ ] Each agent received summary of what was implemented
- [ ] Each agent received their specific checklist/focus area
- [ ] Model specified as haiku for each agent

## Handoff Consumption Gate (COMPULSORY)
- [ ] Each reviewer's output cited in synthesis
- [ ] Specific findings quoted from EACH reviewer (not summarized)
- [ ] Severity classifications traced back to which reviewer flagged them
- [ ] No reviewer's findings silently dropped

## Synthesis Gate (COMPULSORY)
- [ ] All 4 agents completed before synthesis
- [ ] Findings grouped by severity: Critical/Warning/Suggestion
- [ ] Each finding attributed to its source reviewer
- [ ] Unified checklist presented to user

## Review Completeness
- [ ] Security issues identified (missing null check, input validation)
- [ ] Performance issues identified (N+1 pattern)
- [ ] Style issues identified ('any' type usage)
- [ ] Test coverage gaps identified (edge cases)
