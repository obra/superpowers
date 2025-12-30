<required_reading>
**Read these reference files as needed:**
1. `references/user-research.md` - Testing techniques
2. `references/usability-heuristics.md` - Evaluation criteria
3. `references/accessibility.md` - Testing with real users
</required_reading>

<objective>
Incorporate user feedback and refine designs based on real usage. Iteration closes the loop between design hypothesis and user reality.

**Iteration is not optional.** First designs are hypotheses. User testing reveals reality.
</objective>

<when_to_iterate>
**Trigger iteration when:**
- New feature ships → gather initial user feedback
- User testing session completed → incorporate findings
- Analytics show drop-off → investigate and fix
- Support tickets mention UX issue → validate and address
- Accessibility testing reveals issues → fix and verify
- Design assumptions need validation → test with users
</when_to_iterate>

<process>

<step_1>
**Gather User Feedback**

Multiple methods, different insights:

<usability_testing>
**Moderated usability testing (5 users reveals 85% of issues):**

1. Define tasks for users to complete
2. Observe users attempting tasks (no helping!)
3. Note where they struggle, succeed, express confusion
4. Ask follow-up questions after each task

**Task format:**
```
Task: [Specific goal]
Scenario: [Context/setup]
Success criteria: [What completion looks like]
```

**Example:**
```
Task: Add a new contact to your address book
Scenario: Your friend just gave you their phone number
Success criteria: Contact appears in list with name and number
```

**What to observe:**
- Where do users hesitate?
- What do they click that doesn't work?
- What do they say they're looking for?
- How do they describe what they're doing?
- Where do they get stuck or give up?
</usability_testing>

<analytics_review>
**Quantitative data analysis:**

- **Funnel drop-off** - Where do users abandon flows?
- **Click patterns** - What do users click (and not click)?
- **Time on task** - How long do actions take?
- **Error rates** - How often do users hit errors?
- **Feature adoption** - What percentage use the feature?

**Questions to answer:**
- Where are users struggling? (high time, many errors)
- What are users ignoring? (low interaction)
- Where do users abandon? (funnel drop-off)
</analytics_review>

<feedback_collection>
**Direct user feedback:**

- Support tickets mentioning UX issues
- In-app feedback (thumbs up/down, comments)
- User interviews
- NPS/CSAT survey comments
- App store reviews

**Categorize feedback:**
- Usability issues (can't figure out how)
- Feature requests (want something new)
- Bugs (broken functionality)
- Accessibility issues (can't access)
</feedback_collection>
</step_1>

<step_2>
**Analyze and Prioritize Findings**

**Document each finding:**
```
Finding: [What was observed]
Frequency: [How many users affected]
Severity: [Critical/High/Medium/Low]
Evidence: [Source: usability test, analytics, feedback]
```

**Prioritization matrix:**
| | High Frequency | Low Frequency |
|---|---|---|
| **High Severity** | Fix immediately | Fix soon |
| **Low Severity** | Batch into update | Consider for future |

**Critical findings (fix before next release):**
- Users cannot complete core tasks
- Accessibility barriers
- Confusion causing abandonment
- Error states not handled

**High findings (schedule soon):**
- Confusion that causes delays
- Workarounds users have to use
- Missing feedback/states
- Inconsistencies

**Medium/Low findings (batch together):**
- Polish opportunities
- Minor confusion (users recover)
- Enhancement ideas
</step_2>

<step_3>
**Generate Design Hypotheses**

For each significant finding, create a hypothesis:

```
We observed: [User behavior/problem]
We believe: [Root cause]
We think: [Proposed solution] will fix this
We'll know we're right when: [Success metric]
```

**Example:**
```
We observed: 60% of users don't complete the sign-up form
We believe: Users are confused by the password requirements
We think: Showing requirements as they type will fix this
We'll know we're right when: Completion rate increases to 80%+
```

**Avoid solutioning too fast:**
- Understand the problem before proposing solutions
- Consider multiple solutions
- Validate solution approach before implementing
</step_3>

<step_4>
**Design Iteration**

Return to Design workflow with:
- Clear problem to solve (from findings)
- Success metric to hit (from hypothesis)
- Constraints from original implementation

**Iteration design principles:**
- Minimal change for maximum impact
- Don't redesign for its own sake
- Preserve what's working
- Test new design before implementing

**A/B testing considerations:**
- For significant changes, consider A/B test
- Define clear success metric
- Run until statistically significant
- Document learnings regardless of outcome
</step_4>

<step_5>
**Implement Iteration**

Follow Implement workflow with iteration focus:

- [ ] Changes are minimal and targeted
- [ ] Original functionality preserved
- [ ] Accessibility maintained or improved
- [ ] Design system compliance maintained
- [ ] Easy to roll back if needed

**Feature flags for risky changes:**
```javascript
if (featureFlags.newSignupFlow) {
  return <NewSignupForm />;
}
return <CurrentSignupForm />;
```
</step_5>

<step_6>
**Validate Iteration**

After implementing changes:

**Quantitative validation:**
- Monitor the success metric from hypothesis
- Compare before/after metrics
- Check for unintended regressions

**Qualitative validation:**
- Quick usability test with 2-3 users
- Verify the problem is solved
- Check for new problems introduced

**Document outcomes:**
```
Hypothesis: [What we thought would work]
Change: [What we implemented]
Result: [What actually happened]
Learning: [What we now know]
Next steps: [What we'll do with this learning]
```
</step_6>

</process>

<iteration_types>

<quick_fix>
**Quick fixes (1-2 hour turnaround):**
- Copy changes (unclear labels, confusing text)
- Visual tweaks (spacing, alignment)
- Micro-interactions (feedback, states)
- Bug fixes with clear cause

Process: Identify → Fix → Verify → Ship
</quick_fix>

<targeted_improvement>
**Targeted improvements (1-2 days):**
- Usability issues with clear solution
- Accessibility fixes
- Missing states or feedback
- Component-level redesign

Process: Research → Hypothesize → Design → Implement → Validate
</targeted_improvement>

<major_iteration>
**Major iterations (1+ weeks):**
- Flow redesign based on user testing
- New features based on user feedback
- Significant UI overhaul
- Accessibility remediation

Process: Full Ideate → Design → Review → Implement → Iterate cycle
</major_iteration>

</iteration_types>

<anti_patterns>
| Pattern | Why It Fails |
|---------|--------------|
| "Users will adapt" | If users have to adapt, design failed |
| Redesigning without data | Opinion-driven, not evidence-driven |
| Changing everything at once | Can't tell what worked |
| Ignoring small problems | They accumulate into big problems |
| Only quantitative data | Misses the "why" behind numbers |
| Only qualitative data | Misses scale and frequency |
| Solutioning before understanding | Fixes symptoms, not causes |
</anti_patterns>

<continuous_improvement>
**Build iteration into your process:**

1. **Ship with feedback mechanisms** - Always include ways for users to report issues
2. **Monitor key metrics** - Track task completion, errors, time on task
3. **Regular user testing** - Monthly or per-release testing sessions
4. **Review support tickets** - Categorize UX issues, identify patterns
5. **A11y audits** - Regular accessibility testing with real assistive tech users

**Iteration never ends.** Good UX is continuously refined based on user reality.
</continuous_improvement>

<success_criteria>
Iteration is complete when:
- [ ] User feedback gathered from multiple sources
- [ ] Findings documented and prioritized
- [ ] Hypotheses formed for significant issues
- [ ] Design iterations completed and reviewed
- [ ] Changes implemented with accessibility maintained
- [ ] Results validated against success metrics
- [ ] Learnings documented for future reference
- [ ] Next iteration planned (continuous improvement)
</success_criteria>
