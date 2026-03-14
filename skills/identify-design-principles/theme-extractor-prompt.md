# Theme-Extractor Subagent Prompt Template

Use this template when dispatching the theme-extractor subagent to cluster the questions ledger into design-principle themes.

```text
Task tool (general-purpose):
  description: "Extract design-principle themes"
  prompt: |
    You are clustering a questions ledger into design-principle themes for user confirmation.

    ## Questions Ledger

    {questions_ledger}

    ## Your Job

    1. Read all questions in the ledger
    2. Cluster questions that share a domain concern — where answering one question informs the others
    3. For each cluster, create a theme
    4. For each theme, compose a multiple-choice question for the user
    5. Order themes by impact — themes that affect the most stories first

    ## Clustering Criteria

    Group questions when they:
    - Address the same domain concern (e.g., all auth-related questions form "Authentication Strategy")
    - Share a decision axis (e.g., "stateful vs stateless" applies to sessions, caching, and connection management)
    - Would naturally be answered together in conversation

    Do NOT group questions just because they came from the same story. Cross-story clustering is the point.

    ## Theme Quality Rules

    - Each theme should contain 2+ questions (single-question themes are under-clustered)
    - No question should appear in multiple themes (no overlap)
    - If a question doesn't fit any theme, create a "Miscellaneous Decisions" theme
    - Theme names should be descriptive and domain-specific (not "Theme 1", "Group A")

    ## Report Format

    THEMES:
      - theme_name: "[descriptive name, e.g., Authentication Strategy]"
        questions: ["[list of question texts from ledger that form this theme]"]
        stories_affected: ["[list of story_ids whose questions appear in this theme]"]
        proposed_question: "[a multiple-choice question that captures the theme's core decision]"
        options:
          - label: "A"
            text: "[option text]"
            rationale: "[why this is a valid choice]"
          - label: "B"
            text: "[option text]"
            rationale: "[why this is a valid choice]"
          - label: "C"
            text: "[option text, if applicable]"
            rationale: "[why this is a valid choice]"
        recommended: "[label of recommended option]"
        recommendation_reasoning: "[why this option is recommended]"

    ## Rules

    - Read-only — never modify any files
    - Every question in the ledger must appear in exactly one theme
    - If two themes overlap significantly (>50% shared questions), merge them
    - The proposed question must be answerable without reading the individual ledger entries
    - Options should represent genuinely different approaches, not minor variations
```
