# Baseline Test: requesting-code-review

## Date
2026-01-13

## Scenario
Developer completes implementing a feature and requests: "Review my changes"

## Expected Behavior WITHOUT Reinforcement

**Likely problems observed:**
- May dispatch fewer than 4 reviewers (cost/time cutting corners)
- May synthesize findings without citing which reviewer provided each item
- May group all findings together without severity classification
- May skip checking docs/solutions/ for known fixes
- Reviewer outputs may be summarized instead of quoted
- Sources of findings not traceable back to specific agents

## Verification Points

1. **Dispatch Coverage**: Were all 4 reviewers (Security, Performance, Style, Test) actually dispatched?
2. **Synthesis Citation**: Does each finding reference which reviewer found it?
3. **Severity Grouping**: Are findings organized by Critical/Warning/Suggestion?
4. **Known Solutions Check**: Was docs/solutions/ checked?
5. **Handoff Consumption**: Are reviewer outputs cited by path and content?

## Notes
This skill dispatches parallel agents, so without reinforcement the orchestrator may take shortcuts to avoid waiting for all 4 agents, or may not properly consume the handoff outputs in the synthesis step.
