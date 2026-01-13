# Compliance Test: research Skill

## Date
2026-01-13

## Scenario
User requests deep technical research on codebase feature area (e.g., "Research how authentication is currently handled in the codebase")

## Expected Behavior WITH Reinforcement

The research skill should enforce explicit handoff consumption verification:

### Agent Output Consumption Gate Verification

**Expected Evidence in Session:**
- [ ] EXACT phrase: "Agent Output Consumption Gate" mentioned OR checklist shown
- [ ] Explicit listing of file paths for each agent's output
- [ ] At least one direct quote from EACH of the 8 agents:
  - Codebase Analyst finding quoted
  - Git History Analyzer finding quoted
  - Framework Docs Researcher finding quoted
  - Best Practices Researcher finding quoted
  - Test Coverage Analyst finding quoted
  - Error Handling Analyst finding quoted
  - Dependency Analyst finding quoted
  - Architecture Boundaries Analyst finding quoted
- [ ] At least one identified contradiction or nuance between agents
- [ ] Explicit statement about contradiction resolution ("Agent A found X, Agent B found Y, resolution: Z")
- [ ] STOP CONDITION mentioned if synthesis incomplete

### Synthesis Verification Checklist Evidence

**Expected Evidence in Session:**
- [ ] Per-Agent Citation Checklist shown OR referenced
- [ ] All 8 agents explicitly marked as "cited" (checkboxes OR narrative)
- [ ] STOP CONDITION stated about missing agents
- [ ] No claim that any agent had "no relevant findings" without supporting investigation

### Research Document Quality

**Expected in Saved Document:**
- [ ] Each section attribution clear (e.g., "From Codebase Analysis...")
- [ ] At least 2-3 specific quotes per agent's section
- [ ] Executive Summary shows synthesis (combines findings, notes tensions)
- [ ] Edge Cases section explicitly draws from MULTIPLE agents
- [ ] All 8 sections present with substantive content
- [ ] Contradictions or nuances explicitly noted (e.g., "Codebase pattern differs from framework docs because...")

### Handoff Consumption Evidence

**Expected Signs in Session:**
- [ ] File paths from agent outputs explicitly stated
- [ ] Key findings directly quoted (not paraphrased)
- [ ] Agent names used when citing findings
- [ ] Cross-references between agent findings
- [ ] Contradiction resolution shown in real-time

## Compliance Markers

Look for these phrases/actions as evidence of gate enforcement:

### Strong Pass Evidence:
- "Reviewing agent outputs to ensure complete citation"
- "Agent X finding: [quote] - relevant to [topic]"
- "Contradiction found: Agent A says X, Agent B says Y, resolving by..."
- "Per-Agent Citation Checklist: all 8 agents cited in synthesis"
- "STOP: Missing citations for [agent name], re-reading output now"

### Perfect Pass Evidence:
- Explicit checkpoint: "Verifying Agent Output Consumption Gate"
- Table or checklist showing each agent's contributions
- Direct quotes from all 8 agents with clear attribution
- Synthesis that explicitly combines findings from multiple agents
- Identified contradictions with resolution
- STOP CONDITIONS referenced when enforcing gate

## Failure Indicators (What NOT to See)

- [ ] Any section claiming "no relevant findings" without evidence
- [ ] Agent outputs mentioned as "synthesized" without specific quotes
- [ ] Synthesis noticeably shorter than sum of agent outputs
- [ ] Fewer than 8 agent findings explicitly cited
- [ ] No contradictions or nuances identified
- [ ] Skipping per-agent citation checklist
- [ ] Research marked "complete" without gate verification

## Baseline Comparison

### From Baseline:
- Agent outputs available but not systematically cited
- Synthesis possible but no verification of completeness
- Contradictions may be unresolved
- No explicit file path tracking for agent outputs

### Expected in Compliance:
- ALL agent outputs explicitly cited by agent name
- Synthesis VERIFIED against per-agent checklist
- Contradictions explicitly identified and resolved
- Agent output file paths stated in synthesis
- STOP CONDITIONS enforced if gates not met

## Test Acceptance Criteria

**PASS if:**
- [ ] Agent Output Consumption Gate explicitly executed
- [ ] All 8 agents cited with specific quotes in synthesis
- [ ] Per-Agent Citation Checklist completed with all 8 agents checked
- [ ] At least one contradiction identified and resolved
- [ ] STOP CONDITIONS referenced if citation incomplete
- [ ] Research document clearly attributes findings to agents

**FAIL if:**
- [ ] Fewer than 8 agents explicitly cited
- [ ] Any agent mentioned as having "no findings" without investigation
- [ ] Synthesis shorter than baseline (indicates compression/loss)
- [ ] Contradictions not noted between agents
- [ ] Gates mentioned but not actually enforced
- [ ] Agent file paths not stated

## Edge Cases

- **Design doc provided:** Verify research doc includes full verbatim design content
- **No contradictions found:** Still identify and note nuances between agents
- **Agents have similar findings:** Verify synthesis notes commonalities, not just drops duplicates
- **Issue tracker integration:** Verify issue discovery (if applicable) is cited

## Notes

This compliance test validates that the handoff consumption gates are working. The key difference from baseline is EXPLICIT citation of each agent's contributions, with file paths, direct quotes, and contradiction identification.
