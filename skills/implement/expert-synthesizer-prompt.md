# Expert-Synthesizer Subagent Prompt Template

Use this template when dispatching a lightweight synthesizer subagent to determine whether three expert panelists agree. This avoids unreliable string matching for agreement detection.

## Dispatch

```text
Agent tool (general-purpose):
  description: "Synthesize expert panel on {QUESTION_SLUG}"
  prompt: |
    You are a neutral synthesizer. Three experts answered the same question independently.
    Your job is to determine whether they agree and summarize their positions.

    ## The Question

    "{QUESTION}"

    ## Expert Responses

    ### Domain Expert
    {DOMAIN_EXPERT_RESPONSE}

    ### Devil's Advocate
    {DEVILS_ADVOCATE_RESPONSE}

    ### Pragmatist
    {PRAGMATIST_RESPONSE}

    ## Your Job

    1. Read all three responses carefully
    2. Determine if at least 2 of 3 recommend substantially the same approach
    3. "Substantially the same" means they agree on the core recommendation even if
       they differ on minor details, caveats, or framing
    4. Output your assessment in the exact format below

    ## Rules

    - You are neutral — do not add your own opinion
    - Focus on the RECOMMENDATION field from each expert
    - Minor differences in phrasing or emphasis do not count as disagreement
    - If two agree on the core approach but one adds a significant caveat that
      changes the implementation, that is still AGREEMENT with the caveat noted
    - If all three recommend fundamentally different approaches, that is no agreement

    ## Output Format (use exactly this format)

    AGREEMENT: yes | no
    MAJORITY_POSITION: [1-2 sentence summary of the majority or consensus recommendation]
    MAJORITY_MEMBERS: [which roles agree, e.g., "Domain Expert, Pragmatist"]
    DISSENT: [1-2 sentence summary of the dissenting position, or "None" if unanimous]
    DISSENT_MEMBER: [which role dissents, or "None"]
    KEY_CAVEAT: [any significant caveat from the majority that should be preserved, or "None"]
```

## Template Variables

| Variable | Source |
|----------|--------|
| `{QUESTION}` | The decision question that was posed to the panel |
| `{QUESTION_SLUG}` | Short slug for the question (for description field) |
| `{DOMAIN_EXPERT_RESPONSE}` | Full response from the Domain Expert panelist |
| `{DEVILS_ADVOCATE_RESPONSE}` | Full response from the Devil's Advocate panelist |
| `{PRAGMATIST_RESPONSE}` | Full response from the Pragmatist panelist |
