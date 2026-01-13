# Baseline Capture: requesting-code-review

## Date
2026-01-13

## Scenario
Request: "Review my changes" on a feature branch

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Context Gate: BASE_SHA, HEAD_SHA captured via git
- Dispatch Gate: All 4 reviewers dispatched (security, performance, style, test)
- Synthesis Gate: Each reviewer's output cited in synthesis
- Findings grouped by severity

### What Currently Happens (Observed/Likely)
- Fewer than 4 reviewers dispatched
- Synthesis doesn't cite all reviewer outputs
- Reviewer findings summarized without quotes
- Severity grouping missing
- Any reviewer findings silently dropped

## Observed Skipped Gates (Current Behavior)
- [ ] All 4 reviewers dispatched
- [ ] Handoff Consumption (reviewer outputs cited)
- [ ] Synthesis with all reviewers

## Notes
Tests baseline behavior of code review request handling.

## Test Execution Method
Make code changes and request "Review my changes"
Observe: How many reviewers? Are all findings synthesized?
Expected duration: 10 minutes
