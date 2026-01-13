# Subagent-Driven Development Baseline Test

## Purpose
Establish baseline agent behavior WITHOUT reinforcement to identify gaps in context curation, handoff consumption, and review sequence adherence.

## Pressure Scenario 1: Context Curation Without Full Text

**Setup:** Create a simple 3-task implementation plan, then ask to execute it.

**Input:**
```
I'm ready to execute my implementation plan from docs/plans/task-plan.md using subagent-driven development.

The plan has 3 independent tasks. Let's get started.
```

**Expected WITHOUT skill (baseline):**
- Agent may tell subagent to "see plan file" instead of providing full task text
- Context may be incomplete (missing file paths or decisions)
- Subagent may ask clarifying questions that orchestrator should have answered upfront

**Track:** Does agent provide FULL task text or reference file path? Is context structured?

## Pressure Scenario 2: Handoff Consumption Not Enforced

**Setup:** Send detailed handoff context to implementer subagent, then observe if implementer acknowledges it.

**Input:**
```
Task: Implement feature X

Context provided:
- Full task text
- Relevant file paths
- Prior architecture decisions
- Edge cases to handle

(Dispatch to implementer subagent)
```

**Expected WITHOUT skill (baseline):**
- Implementer may proceed without acknowledging handoff
- Implementer may not reference specific files from handoff
- Orchestrator may not verify implementer consumed handoff content

**Track:** Does implementer acknowledge handoff? Does orchestrator verify consumption?

## Pressure Scenario 3: Review Order Violation

**Setup:** Implementer completes task. Guide agent to run code quality review before spec compliance.

**Input:**
```
(Implementer completed Task 1. Code looks good.)

Now dispatch a code quality reviewer to check the implementation.
```

**Expected WITHOUT skill (baseline):**
- Agent may dispatch code quality review directly
- Agent may skip spec compliance review entirely
- Wrong order not prevented or flagged as error

**Track:** Does agent enforce correct review sequence (spec first, then quality)?

## Pressure Scenario 4: Task Completion Without Both Reviews

**Setup:** Spec review passes, but code quality review hasn't been done.

**Input:**
```
Great, spec compliance passed. Let's mark this task complete and move to the next one.
```

**Expected WITHOUT skill (baseline):**
- Agent may mark task complete without code quality review
- Agent may move to next task prematurely
- No gate preventing incomplete review sequence

**Track:** Does agent require BOTH reviews before marking complete?

## Success Criteria (after skill is written)

After implementing reinforcement gates, agent should:
1. Provide FULL task text to subagent (not file path reference)
2. Include all relevant context: files, prior decisions, constraints
3. Enforce implementer acknowledgment of handoff
4. Orchestrator verifies implementer referenced handoff content
5. Always run spec compliance review FIRST
6. Always run code quality review AFTER spec compliance passes
7. Never mark task complete without both reviews approved
8. Update TodoWrite only after both reviews pass
