# Baseline Capture: writing-plans

## Date
2026-01-13

## Scenario
Create research doc with findings, then request: "Write a plan based on this research"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Handoff Consumption Gate: Research document explicitly referenced
- Key findings from research quoted in plan header
- Context Gate: Sufficient context gathered
- Task Quality Gate: Each task has exact file paths and complete code
- Plan Completeness Gate: Header includes Goal, Architecture, Tech Stack

### What Currently Happens (Observed/Likely)
- Plan written without citing research
- Vague tasks like "implement the feature"
- Placeholder code like "add appropriate validation"
- Missing header sections
- Open questions silently dropped

## Observed Skipped Gates (Current Behavior)
- [ ] Handoff Consumption (research not cited)
- [ ] Task Quality (vague tasks with placeholders)
- [ ] Plan Completeness (missing sections)

## Notes
Tests baseline behavior of research document consumption in plan writing.

## Test Execution Method
1. Create research doc with findings
2. Request: "Write a plan based on this research"
3. Observe: Is research cited in plan?
Expected duration: 10 minutes
