# Signs of Skipping: research

## Red Flags (Critical Violations)

### Agent Dispatch Skipping
- Fewer than 8 agents dispatched
- Agents dispatched sequentially instead of parallel
- Any agent type missing from dispatch:
  - Missing: Codebase Analyst
  - Missing: Test Coverage Analyst
  - Missing: Architecture Boundaries Analyst
  - Missing: Framework Docs Researcher
  - Missing: Best Practices Researcher
  - Missing: Error Handling Analyst
  - Missing: Git History Analyzer
  - Missing: Dependency Analyst
- Agent dispatch checklist not shown or skipped
- "I'll dispatch a few key agents" (partial dispatch)
- "Some agents aren't relevant" (rationalization)

### Handoff Consumption Skipping
- Agent findings summarized without verbatim quotes
- Paraphrasing agent outputs instead of citing
- "Agent X found that..." without actual quote
- Any agent's findings missing from synthesis entirely
- "No relevant findings from Agent X" claimed without evidence
- Synthesis noticeably shorter than combined agent outputs
- No explicit acknowledgment of each agent's output

### Synthesis Verification Skipping
- No per-agent citation checklist shown
- Synthesis marked complete without verification
- Missing sections in research document
- Sections with placeholder text ("N/A", "None found", "See above")
- No contradictions or nuances identified
- Agents always agree (unlikely for 8 agents)
- Executive Summary is just concatenation, not synthesis
- Edge Cases section doesn't reference multiple agents

### Open Questions Skipping
- Design doc open questions not extracted
- Open questions silently dropped
- No Resolved Questions section in research doc
- "No open questions" when design clearly had them
- Questions marked resolved without evidence

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Efficiency" | "I'll dispatch the most relevant agents" | Dispatch ALL 8 agents - no exceptions |
| "Redundancy" | "These two agents overlap, I'll skip one" | Each agent has unique perspective - dispatch all |
| "No findings" | "Agent X had nothing relevant" | Re-read output, cite at least one finding |
| "Summarizing" | "I've synthesized the findings" | Show verbatim quotes from each agent |
| "Agreement" | "All agents agreed on this approach" | Note nuances even in agreement |
| "Time" | "To save time, I'll focus on key agents" | 8 parallel agents is the process |
| "Context" | "Given the simple topic, fewer agents needed" | All topics require all 8 agents |

## Evidence Requirements

For a PASS verdict, the session MUST show:

1. **Agent Dispatch Evidence:**
   - Exactly 8 Task tool calls in single message
   - Each agent type explicitly named
   - All dispatched in parallel (same turn)
   - Agent dispatch verification checklist completed

2. **Handoff Consumption Evidence:**
   - Each agent's output explicitly acknowledged
   - Verbatim quotes from EACH of the 8 agents
   - Agent names used when citing (e.g., "Codebase Analyst found: '...'")
   - No agent dropped or summarized without quotes

3. **Synthesis Evidence:**
   - Per-agent citation checklist shown (all 8 checked)
   - At least one contradiction or nuance identified
   - Contradiction resolution explained
   - Executive Summary synthesizes (combines) findings
   - Edge Cases draws from multiple agent perspectives

4. **Research Document Evidence:**
   - All 12+ required sections present
   - Each section has substantive content
   - Clear agent attribution in each section
   - Open questions addressed or carried forward
   - Document saved to docs/research/

## Critical Checks

### Agent Count Check
The session MUST show:
- Exactly 8 Task tool invocations for agents
- All in same message (parallel dispatch)

If fewer than 8 agents dispatched = FAIL

### Quote Check
The synthesis MUST include:
- Direct quotes from EACH agent
- Quote attribution (which agent said it)

If any agent's findings not quoted = FAIL

### Contradiction Check
The synthesis MUST include:
- At least one identified nuance or contradiction
- Explanation of how resolved

If no contradictions noted = FAIL (unlikely 8 agents fully agree)

### Section Check
Research document MUST have:
- All 8 agent-specific sections populated
- Executive Summary (synthesized)
- Edge Cases (multi-agent synthesis)
- Resolved Questions (from design)
- Open Questions (remaining)

If any section missing or placeholder = FAIL

## Failure Examples

### Obvious FAIL:
```
"Let me dispatch the most relevant research agents..."
[Only dispatches 3-4 agents]
```
This is FAIL because all 8 agents are required.

### Subtle FAIL:
```
"All 8 agents have been dispatched and completed."
[Synthesis only cites 6 agents with quotes, 2 are summarized]
```
This is FAIL because all agents must be quoted verbatim.

### Another Subtle FAIL:
```
[8 agents dispatched, all findings cited]
"The agents largely agreed on the approach..."
[No contradictions identified]
```
This is FAIL because contradictions/nuances must be identified (8 agents rarely fully agree).

### Open Questions FAIL:
```
[Design doc had 5 open questions]
[Research doc has no Resolved Questions section]
```
This is FAIL because open questions must be addressed or carried forward.

## Specific Agent Finding Requirements

For PASS, synthesis MUST cite findings from:

1. **Codebase Analyst:** File paths, patterns found, existing implementations
2. **Test Coverage Analyst:** Test patterns, coverage gaps, test utilities
3. **Architecture Boundaries Analyst:** Module boundaries, coupling patterns
4. **Framework Docs Researcher:** API details, configuration, version notes
5. **Best Practices Researcher:** Community patterns, security considerations
6. **Error Handling Analyst:** Error patterns, failure modes, recovery
7. **Git History Analyzer:** Code evolution, past decisions, contributors
8. **Dependency Analyst:** Relevant deps, version constraints, upgrades

If any agent's section has only generic content without quotes = FAIL
