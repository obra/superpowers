# Baseline Capture: research

## Date
2026-01-13

## Scenario
Request: "Research this design" on a provided design doc

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- All 8 research agents dispatched
- Handoff Consumption Gate: Each agent's findings cited in synthesis
- Synthesis Verification Gate: Each agent named explicitly in synthesis
- Contradictions noted between agent findings
- Open questions identified

### What Currently Happens (Observed/Likely)
- Fewer than 8 agents dispatched
- Agent findings summarized without quotes
- Any agent's findings missing from synthesis
- "No relevant findings" claimed without evidence
- Contradictions not noted

## Observed Skipped Gates (Current Behavior)
- [ ] All 8 agents dispatched
- [ ] Handoff Consumption (all agents cited)
- [ ] Synthesis Verification (all agents named)

## Notes
Tests baseline behavior of research synthesis and agent coordination.

## Test Execution Method
Request: "Research this design"
Observe: How many agents? Are all findings synthesized?
Expected duration: 15 minutes
