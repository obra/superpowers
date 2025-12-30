<overview>
User research reveals who users are, what they need, and how they behave. This reference covers research methods, personas, journey maps, and user testing.
</overview>

<research_methods>

<interviews>
**User Interviews**

Purpose: Deep understanding of user needs, behaviors, motivations

**Preparation:**
- Define research questions
- Recruit 5-8 participants (reveals patterns)
- Prepare discussion guide (not rigid script)
- Plan 45-60 minute sessions

**Good questions:**
- "Walk me through the last time you..." (behavior)
- "What was the hardest part about..." (pain points)
- "How do you currently..." (current workflow)
- "Tell me about a time when..." (stories)

**Avoid:**
- "Would you use a feature that..." (hypothetical)
- "Do you like..." (leading)
- "Don't you think..." (leading)
- Yes/no questions (limited insight)

**Analysis:**
- Transcribe or take detailed notes
- Look for patterns across interviews
- Note quotes for evidence
- Identify needs, frustrations, goals
</interviews>

<surveys>
**Surveys**

Purpose: Quantitative validation, scale understanding

**When to use:**
- Validate patterns from interviews
- Measure satisfaction (NPS, CSAT)
- Prioritize features
- Segment users

**Best practices:**
- Keep short (5-10 minutes)
- Start with easy questions
- Use rating scales consistently
- Include open-ended question for context
- Test survey before sending
</surveys>

<usability_testing>
**Usability Testing**

Purpose: Observe users attempting tasks with your product

**Types:**
- Moderated: Facilitator guides, can ask follow-ups
- Unmoderated: User self-guides, recorded for review
- Remote: Via video call
- In-person: Observer in room

**Sample size:**
- 5 users find ~85% of usability issues
- More users for quantitative metrics
- Test with diverse user types

**Task format:**
```
Task: [What to accomplish]
Scenario: [Context/why they're doing this]
Success: [What completion looks like]
```

**What to observe:**
- Where users hesitate
- What they click that doesn't work
- What they say they're looking for
- Expressions of confusion or frustration
- Time to complete tasks
</usability_testing>

<analytics>
**Analytics Review**

Purpose: Understand actual behavior at scale

**Key metrics:**
- Task completion rate
- Time on task
- Drop-off points in funnels
- Click/scroll heatmaps
- Error rates
- Feature adoption

**Tools:**
- Google Analytics / Mixpanel
- Hotjar / FullStory (session recordings)
- LogRocket (debugging + UX)
</analytics>

</research_methods>

<personas>

<what_are_personas>
Personas are fictional representations of user types based on research. They make user needs tangible and memorable for the team.
</what_are_personas>

<persona_template>
```
┌─────────────────────────────────────────────────────────┐
│  [Photo]    NAME: [Descriptive name]                    │
│             ROLE: [Job title / user type]               │
│             AGE: [Age range]                            │
├─────────────────────────────────────────────────────────┤
│  CONTEXT                                                 │
│  • When/where they use the product                      │
│  • Technical proficiency                                │
│  • Device preferences                                   │
├─────────────────────────────────────────────────────────┤
│  GOALS                                                   │
│  • What they're trying to achieve                       │
│  • Success looks like...                                │
├─────────────────────────────────────────────────────────┤
│  FRUSTRATIONS                                            │
│  • Pain points with current solutions                   │
│  • Barriers they face                                   │
├─────────────────────────────────────────────────────────┤
│  QUOTE                                                   │
│  "[Something they said in research]"                    │
└─────────────────────────────────────────────────────────┘
```
</persona_template>

<persona_best_practices>
**Do:**
- Base on real research data
- Focus on behavior, not demographics
- Include goals and frustrations
- Use realistic names and photos
- Keep to 3-5 primary personas

**Don't:**
- Make up personas without research
- Create too many personas
- Focus on demographics over behavior
- Use stereotypical representations
</persona_best_practices>

</personas>

<journey_maps>

<what_are_journey_maps>
Journey maps visualize the user's end-to-end experience, including actions, thoughts, feelings, and pain points across each stage.
</what_are_journey_maps>

<journey_map_template>
```
STAGE      │ Awareness   │ Consideration │ Purchase    │ Onboarding  │ Usage
───────────┼─────────────┼───────────────┼─────────────┼─────────────┼──────────
ACTIONS    │ What user   │ What user     │ What user   │ What user   │ What user
           │ does        │ does          │ does        │ does        │ does
───────────┼─────────────┼───────────────┼─────────────┼─────────────┼──────────
THINKING   │ What they   │ What they     │ What they   │ What they   │ What they
           │ wonder      │ compare       │ decide      │ learn       │ use
───────────┼─────────────┼───────────────┼─────────────┼─────────────┼──────────
FEELING    │ 😐 Curious  │ 🤔 Uncertain  │ 😰 Anxious  │ 😊 Hopeful  │ 😃 Satisfied
───────────┼─────────────┼───────────────┼─────────────┼─────────────┼──────────
PAIN       │ Hard to     │ Can't compare │ Checkout    │ Complex     │ Missing
POINTS     │ find info   │ options       │ confusing   │ setup       │ features
───────────┼─────────────┼───────────────┼─────────────┼─────────────┼──────────
OPPORTUN-  │ Better SEO  │ Comparison    │ Simpler     │ Guided      │ Feature
ITIES      │ content     │ page          │ checkout    │ tutorial    │ education
```
</journey_map_template>

<journey_map_uses>
**Use journey maps to:**
- Identify pain points in the experience
- Find opportunities for improvement
- Align team on user experience
- Prioritize feature development
- Design cohesive experiences
</journey_map_uses>

</journey_maps>

<jobs_to_be_done>

<jtbd_framework>
**Jobs to Be Done (JTBD)**

Focus on the underlying motivation, not just the action.

**Format:**
```
When [situation],
I want to [motivation],
so I can [expected outcome].
```

**Example:**
```
When I'm running late for a meeting,
I want to quickly update my teammates,
so I can let them know without interrupting my commute.
```
</jtbd_framework>

<jtbd_questions>
**Discovery questions:**
- What triggered you to look for a solution?
- What were you trying to accomplish?
- What alternatives did you consider?
- What made you choose this solution?
- How do you know when the job is done?
</jtbd_questions>

</jobs_to_be_done>

<synthesizing_research>

<affinity_mapping>
**Affinity Mapping**

1. Write each observation on a sticky note
2. Group related notes together
3. Name each group (theme)
4. Identify patterns across groups
5. Prioritize themes by frequency/importance
</affinity_mapping>

<insight_format>
**Insight Format:**
```
Observation: [What we saw/heard]
Insight: [What it means]
Implication: [What we should do about it]
```

**Example:**
```
Observation: 5/8 users looked for search first
Insight: Users expect to find content through search, not browsing
Implication: Make search prominent and improve search functionality
```
</insight_format>

</synthesizing_research>
