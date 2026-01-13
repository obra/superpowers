# Checklist: research Compliance

## Agent Dispatch Gate (COMPULSORY)
- [ ] Skill announcement made ("I'm using the research skill")
- [ ] Design document found and read
- [ ] Codebase Analyst agent dispatched (Task tool call visible)
- [ ] Test Coverage Analyst agent dispatched (Task tool call visible)
- [ ] Architecture Boundaries Analyst agent dispatched (Task tool call visible)
- [ ] Framework Docs Researcher agent dispatched (Task tool call visible)
- [ ] Best Practices Researcher agent dispatched (Task tool call visible)
- [ ] Error Handling Analyst agent dispatched (Task tool call visible)
- [ ] Git History Analyzer agent dispatched (Task tool call visible)
- [ ] Dependency Analyst agent dispatched (Task tool call visible)
- [ ] All 8 agents dispatched in single message (parallel dispatch)
- [ ] Agent Dispatch Verification checklist completed

## Handoff Consumption Gate (COMPULSORY)
- [ ] Gate announcement made ("Verifying handoff consumption" or checklist shown)
- [ ] Each agent's output explicitly acknowledged
- [ ] Codebase Analyst findings quoted in synthesis (verbatim text)
- [ ] Test Coverage Analyst findings quoted in synthesis (verbatim text)
- [ ] Architecture Boundaries Analyst findings quoted in synthesis (verbatim text)
- [ ] Framework Docs Researcher findings quoted in synthesis (verbatim text)
- [ ] Best Practices Researcher findings quoted in synthesis (verbatim text)
- [ ] Error Handling Analyst findings quoted in synthesis (verbatim text)
- [ ] Git History Analyzer findings quoted in synthesis (verbatim text)
- [ ] Dependency Analyst findings quoted in synthesis (verbatim text)
- [ ] No agent's findings silently dropped
- [ ] STOP CONDITION mentioned if any agent missing

## Synthesis Verification Gate (COMPULSORY)
- [ ] Per-Agent Citation Checklist shown or executed
- [ ] All 8 agents marked as "cited"
- [ ] At least one contradiction or nuance identified between agents
- [ ] Contradictions resolved with explanation
- [ ] STOP CONDITION stated about incomplete synthesis
- [ ] Executive Summary synthesizes findings (not just concatenates)
- [ ] Edge Cases section draws from multiple agents

## Research Document Quality (COMPULSORY)
- [ ] Original Design Document section present with full verbatim content
- [ ] Resolved Questions section addresses design's open questions
- [ ] Executive Summary section present with synthesized findings
- [ ] Codebase Analysis section present with agent attribution
- [ ] Git History Insights section present with agent attribution
- [ ] Framework & Documentation section present with agent attribution
- [ ] Best Practices section present with agent attribution
- [ ] Test Coverage Analysis section present with agent attribution
- [ ] Error Handling Analysis section present with agent attribution
- [ ] Dependency Analysis section present with agent attribution
- [ ] Architecture Boundaries Analysis section present with agent attribution
- [ ] Edge Cases & Gotchas section synthesizes from multiple agents
- [ ] Open Questions section identifies unresolved items
- [ ] Research doc saved to docs/research/ directory

## Open Questions Handling (COMPULSORY)
- [ ] Design doc open questions extracted
- [ ] Each open question addressed in Resolved Questions section
- [ ] If question unresolved: carried to Open Questions section
- [ ] No open question silently dropped

## Evidence Requirements
- [ ] Session shows all 8 Task tool calls for agent dispatch
- [ ] Session shows waiting for agent completion
- [ ] Session shows synthesis with quotes from each agent
- [ ] Session shows contradiction identification
- [ ] Session shows checklist verification
- [ ] Research document shows clear agent attribution
- [ ] Research document has substantive content in all sections
