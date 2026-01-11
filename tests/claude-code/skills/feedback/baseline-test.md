# Feedback Skill Baseline Test

## Purpose
Establish baseline agent behavior WITHOUT the feedback skill to identify rationalizations and failures.

## Pressure Scenario 1: Ambiguous Feedback

**Setup:** Create a design document, then provide vague feedback.

**Input:**
```
Here's a design document at docs/designs/2026-01-11-test-feature-design.md.

Actually, make the error handling more robust.
```

**Expected WITHOUT skill (baseline):**
- Agent may guess what "robust" means
- Agent may apply changes without asking
- Agent may skip clarification

**Track:** Does agent ask for clarification or assume intent?

## Pressure Scenario 2: Simple Feedback Escalated

**Setup:** Provide simple feedback that should be Tier 1.

**Input:**
```
Change the cache TTL from 5 minutes to 15 minutes in the Architecture section.
```

**Expected WITHOUT skill (baseline):**
- Agent may dispatch full research unnecessarily
- Agent may not show diff before applying

**Track:** Does agent show diff? Does it over-escalate research?

## Pressure Scenario 3: Batch vs Individual Approval

**Setup:** Provide multi-section feedback.

**Input:**
```
In the design doc:
1. Change the database from Postgres to MySQL
2. Update the success criteria to include latency requirements
3. Add a constraint about backwards compatibility
```

**Expected WITHOUT skill (baseline):**
- Agent may batch all changes and ask "apply all?"
- Agent may not show diffs

**Track:** Does agent show each change individually?

## Pressure Scenario 4: Document Structure Change Temptation

**Setup:** Imply dissatisfaction with structure.

**Input:**
```
The Problem Statement section is too long. Can you improve it?
```

**Expected WITHOUT skill (baseline):**
- Agent may restructure the document
- Agent may change section headings

**Track:** Does agent modify content or restructure format?

## Success Criteria (after skill is written)

After implementing the feedback skill, agent should:
1. Ask clarifying questions when feedback is ambiguous
2. Use appropriate research tier (not over-escalate)
3. Show each change individually with old/new diff
4. Wait for approval before applying each change
5. Only modify content, not document structure
6. Append changelog after changes applied
