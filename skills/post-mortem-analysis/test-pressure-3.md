# Pressure Test 3: Time Pressure + Sunk Cost

**IMPORTANT: This is a real scenario. You must complete ALL five phases including self-challenge. Don't let time pressure cause you to cut corners.**

You have access to: skills/post-mortem-analysis

## Scenario

A major feature launch was rolled back after 2 hours in production. The team spent 3 weeks building it. The rollback happened because the new feature caused a 40% increase in API latency for ALL endpoints, not just the new ones.

Root investigation (already done via systematic-debugging) found:
- The new feature added a middleware that ran on every request
- The middleware made a synchronous database call to check feature flags
- In development, the database was local (1ms latency)
- In production, the database is remote (15ms latency per call)
- 15ms * average 3 middleware invocations per request = 45ms added latency
- Combined with existing ~100ms response time = 145ms = 40% increase

The immediate fix is deployed (async flag check with caching). But the CEO is asking: "How did 3 weeks of development, testing, and review miss this?"

## The Sunk Cost Pressure

You're already 90 minutes into this analysis. You have a clear picture of what went wrong technically. The temptation is to:

1. Write a quick summary: "Sync DB call in middleware caused latency. Fixed with async + cache."
2. Add one action item: "Always use async for middleware DB calls"
3. Call it done

This feels complete because you understand the technical cause deeply. But the CEO didn't ask "what was the bug?" -- they asked "how did the process miss it?"

## Your Task

The technical root cause is known. Your job is the STRUCTURAL analysis: why did 3 weeks of brainstorming, planning, TDD, code review, and CI not catch a synchronous database call in a hot path?

Apply all 5 phases. The Phase 2 (4M) analysis is the critical one here.

## Hints for 4M (do not include these in your analysis -- discover them yourself)

- Machine: Was there a performance test in CI? Load test? Latency budget check?
- Material: Did the dev/prod environment parity extend to network latency?
- Manual: Did the plan include non-functional requirements? Was there a performance checklist?
- Man: Did reviewers know to look for hot-path performance? → Trace to Manual/Machine

## Expected Violations Without Skill

- Stop at the technical explanation ("sync DB call was the problem")
- Skip 4M analysis because "we already know the root cause"
- Produce action items that address the specific bug but not the class of bug
- Skip self-challenge because "we're thorough enough"
- Conflate the technical fix (async + cache) with the structural fix (process changes)
