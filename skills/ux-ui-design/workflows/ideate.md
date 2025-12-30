<required_reading>
**Read these reference files as needed:**
1. `references/user-research.md` - Interview techniques, personas, journey maps
2. `references/usability-heuristics.md` - Understanding user needs
</required_reading>

<objective>
Understand users, define problems, and explore solutions before any design work begins. This phase prevents designing solutions for the wrong problems.

**You cannot skip this phase.** Without user understanding, you're guessing.
</objective>

<process>

<step_1>
**Gather User Context**

Before touching Figma, answer these questions with evidence (not assumptions):

| Question | How to Answer | Red Flag |
|----------|---------------|----------|
| **Who are the users?** | Roles, technical skill, context of use | "Everyone" or "Users will figure it out" |
| **What problem does this solve?** | Pain point, current workaround, frequency | "They need this feature" without evidence |
| **What's the context?** | When/where/on what devices? | "Desktop only" without validation |
| **What's success?** | How do users know it worked? | Vague outcomes like "better experience" |

**Methods to gather answers (in order of reliability):**

1. **Talk to actual users** (5 interviews reveal patterns)
   - Ask: "Walk me through the last time you tried to do X"
   - Ask: "What was frustrating about that?"
   - Don't ask: "Would you use feature Y?" (hypothetical = unreliable)

2. **Review existing data**
   - Support tickets (what do users complain about?)
   - Analytics (where do users drop off?)
   - Session recordings (where do users struggle?)

3. **Study competitive solutions**
   - How do 3-4 similar products handle this?
   - What patterns do they use?
   - Where do they fail?

4. **Validate assumptions with stakeholders**
   - PM/product owner for business context
   - Customer success for user pain points
   - Don't guess on requirements
</step_1>

<step_2>
**Define the Problem Statement**

Write a clear problem statement in this format:

```
[User type] needs a way to [user goal]
because [insight about their current situation].
We know this is true because [evidence].
```

**Example:**
```
Sales reps need a way to quickly log call notes on mobile
because they're often in the car between meetings and forget details.
We know this is true because 40% of CRM entries are made 2+ hours after calls,
and 3 support tickets this month mentioned "mobile note-taking."
```

**Red flags in problem statements:**
- No specific user type ("users" instead of "sales reps")
- Solution embedded in problem ("needs a button to...")
- No evidence cited
- Multiple problems in one statement (split them)
</step_2>

<step_3>
**Create User Artifacts (choose based on complexity)**

<for_simple_features>
**Minimal artifacts (1-2 screens, clear scope):**
- Problem statement (from Step 2)
- Success metrics (1-3 measurable outcomes)
- Key constraints (tech, design system, timeline)
</for_simple_features>

<for_complex_features>
**Full artifacts (2+ screens, new patterns, unclear scope):**

**User Persona** (if users are diverse):
```
Name: [Representative name]
Role: [Job title / user type]
Context: [When/where they use the product]
Goals: [What they're trying to achieve]
Frustrations: [Current pain points]
Quote: [Something they said in research]
```

**User Journey Map** (if multi-step flow):
```
Stage → [Stage 1] → [Stage 2] → [Stage 3] → [Stage 4]
Action → [What user does]
Thinking → [What user thinks]
Feeling → [Emotional state]
Pain Points → [Frustrations at this stage]
Opportunities → [Where we can help]
```

**Jobs to Be Done** (if motivations matter):
```
When [situation],
I want to [motivation],
so I can [expected outcome].
```
</for_complex_features>
</step_3>

<step_4>
**Explore Solution Directions**

Before committing to one approach, sketch 2-3 solution directions:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Option A** | [Brief description] | [Benefits] | [Drawbacks] |
| **Option B** | [Brief description] | [Benefits] | [Drawbacks] |
| **Option C** | [Brief description] | [Benefits] | [Drawbacks] |

**Criteria for evaluating:**
- Solves the user problem (from problem statement)
- Technically feasible
- Design system compatible
- Accessible by default
- Maintainable long-term

**Get stakeholder input:**
Use `AskUserQuestion` to validate direction:
- "Based on the research, here are 3 approaches. Which aligns best with project goals?"
- Include trade-offs in the question
</step_4>

<step_5>
**Document and Handoff**

Create ideation document with:
- Problem statement
- User context (persona/journey if applicable)
- Chosen solution direction with rationale
- Success metrics
- Constraints and considerations

**Proceed to Design phase** with:
- Clear problem definition
- Validated solution direction
- Success criteria to design toward
</step_5>

</process>

<validation_checklist>
Before proceeding to Design:
- [ ] Problem statement written with evidence
- [ ] User context documented (who, context, goals)
- [ ] Solution direction validated with stakeholders
- [ ] Success metrics defined
- [ ] Constraints identified (tech, design system, accessibility)
</validation_checklist>

<anti_patterns>
| Pattern | Why It Fails |
|---------|--------------|
| "Users want X" without evidence | You're guessing, not researching |
| Skipping research for "simple" features | Simple features still serve users with needs |
| Letting stakeholders define the problem | They have opinions, not research |
| Designing before defining success | You won't know if you solved the problem |
| Embedding solution in problem statement | Constrains exploration too early |
</anti_patterns>

<success_criteria>
Ideation is complete when:
- [ ] Problem statement is evidence-based, not assumption-based
- [ ] User context is documented and validated
- [ ] 2-3 solution directions explored with trade-offs
- [ ] One direction chosen with stakeholder alignment
- [ ] Success metrics are measurable (not "better UX")
- [ ] Ready to proceed to Design with clear direction
</success_criteria>
