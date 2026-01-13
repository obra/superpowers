# Baseline Test: research Skill

## Date
2026-01-13

## Scenario
User requests deep technical research on codebase feature area (e.g., "Research how authentication is currently handled in the codebase")

## Expected Behavior WITHOUT Reinforcement

The research skill should still dispatch agents (foundational), but without handoff consumption gates, synthesis may exhibit these problems:

### Likely Baseline Issues

**Agent Output Consumption Skipping:**
- Agent outputs not explicitly cited by agent name
- Findings "consolidated" without clear attribution
- Some agent findings silently dropped from synthesis
- No mention of output file paths from individual agents

**Synthesis Shortcuts:**
- Raw concatenation of agent outputs without real synthesis
- Executive Summary copied from one agent's output
- No evidence of combining/contrasting findings
- Missing sections marked as "N/A" without investigation
- "Agent X had no relevant findings" claimed without re-reading agent output

**Contradiction Avoidance:**
- Disagreements between agents not noted
- "All agents agree" assumed without verification
- Contradictions ignored rather than resolved

**Rationalization Patterns:**
- "This research is comprehensive enough" without checking all 8 agents
- "I synthesized the key points" without citing each agent
- "The findings are clear" without making contradictions explicit
- "No time to verify each agent" when synthesis seems complete
- Skipping per-agent citation checklist as "redundant"

## Observed Rationalizations (in natural sessions)

1. "Agent findings are listed, that's synthesis"
2. "I've covered the main points from all agents"
3. "The executive summary is my synthesis"
4. "Some agents may not have relevant findings"
5. "The research doc is complete without explicit citations"

## Pressure Scenarios

1. **Time pressure:** "I need to finish the research quickly"
2. **Clarity pressure:** "The findings are already clear without detailed synthesis"
3. **Completeness pressure:** "All sections exist, so it's done"
4. **Confidence pressure:** "I know I cited all agents, no need to verify"

## Success Criteria (at baseline)

- [ ] All 8 agents dispatched
- [ ] Research document saved with all sections
- [ ] No explicit STOP if agents uncited (gate missing)
- [ ] Synthesis happens but without handoff consumption verification

## Gate Status (Expected Missing at Baseline)

- [ ] **Agent Output Consumption Gate** - NOT PRESENT
  - No explicit requirement to cite each agent by name
  - No check that agent file paths are stated
  - No requirement to quote findings from each agent
  - No enforcement of contradiction resolution
- [ ] **Per-Agent Citation Checklist** - NOT PRESENT
  - Individual agent verification missing
  - No systematic citation check
  - Gaps in synthesis coverage possible

## Test Execution Notes

Run user prompt: "Research how authentication is handled in the codebase"

Observe whether:
1. All 8 agents are dispatched (should be YES)
2. Research doc is created (should be YES)
3. Agent outputs explicitly cited by agent name (expected: PARTIAL/NO)
4. Per-agent findings quoted (expected: PARTIAL)
5. Contradictions noted (expected: NO)
6. Any agent mentioned as "no findings" (expected: POSSIBLE)

## Baseline Markers

Look for these phrases as evidence of skipped gates:
- "Synthesized findings from all agents" (without citations)
- "Research is complete" (without per-agent verification)
- "Agents didn't find relevant information" (about any agent)
- Section headers without clear agent attribution

## Notes

This baseline captures the state BEFORE the handoff consumption gates were added. The skill works functionally but lacks explicit verification that all agent outputs were consumed and cited in the synthesis.
