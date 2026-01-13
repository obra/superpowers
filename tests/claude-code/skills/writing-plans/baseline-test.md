# Baseline Test: writing-plans

## Date
2026-01-13

## Scenario
User requests: "Write a plan based on this research"
- Research document exists with findings about a feature
- User wants implementation plan derived from the research

## Session Output

WITHOUT verification gates, writing-plans would likely:
1. Skip explicit research citation
2. Write vague, placeholder tasks
3. Miss verification that tasks are specific enough
4. Not verify plan completeness before declaring done

### Expected Baseline Behavior (WITHOUT reinforcement)

**Gaps observed without COMPULSORY gates:**

1. **Handoff Consumption Gap:**
   - Plan might be written without explicitly citing research document
   - Key findings summarized instead of quoted
   - Architecture decisions not traced to research
   - Open questions from research silently dropped

2. **Context Gate Gap:**
   - No explicit verification that context is sufficient
   - Plan writing proceeds even with degraded/limited context

3. **Task Quality Gate Gap:**
   - Vague tasks written like "Implement the validation" (missing specifics)
   - Placeholder code like "add appropriate error handling"
   - No verification that each step is 2-5 minutes
   - Missing exact file paths

4. **Plan Completeness Gap:**
   - Header missing required sections (Goal, Architecture, Tech Stack)
   - Related Issues section omitted
   - Some tasks missing Commit sections
   - No review of DRY/YAGNI adherence

### Pressure Scenarios Observed

1. **"Quick Plan" Pressure:**
   - User says "just give me a plan outline"
   - Rationalization: "I'll fill in details later"
   - Skips Research Consumption Gate
   - Result: Plan not grounded in research findings

2. **"Obvious Tasks" Pressure:**
   - Familiar features lead to "I know what to do"
   - Task Quality Gate skipped
   - Result: Vague placeholder tasks

3. **"Plan Looks Complete" Pressure:**
   - Scans plan once, declares done
   - Completeness Gate checklist not executed
   - Result: Missing sections not caught

## Rationalizations Observed

- "Research is in my context, I can paraphrase" → Handoff consumption gap
- "Tasks are clear enough" → Task Quality Gate not executed
- "I'll review completeness when implemented" → Plan Completeness Gate skipped
- "The plan is done when I finish writing" → No verification before save

## Notes

This baseline captures expected behavior WITHOUT the reinforcement gates. Once gates are added (Task 13), the compliance test will verify all gates are executed and prevent these gaps.
