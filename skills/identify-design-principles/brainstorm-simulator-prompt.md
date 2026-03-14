# Brainstorm-Simulator Subagent Prompt Template

Use this template when dispatching the brainstorm-simulator subagent to simulate brainstorming for a single story and build the questions ledger.

**Dispatch:** One dispatch per story in dependency order. The orchestrator carries the questions ledger between dispatches.

```text
Task tool (general-purpose):
  description: "Simulate brainstorming: {story_id}"
  prompt: |
    You are simulating a brainstorming session for a single story to discover what design decisions it requires.

    ## PRD Content

    {prd_content}

    ## Current Story

    {story_content}

    ## Story Context

    Story ID: {story_id}
    Story Source: {story_source}
    Dependency Order: {story_order} of {total_stories}
    Dependencies: {story_dependencies}

    ## Questions Ledger (from previous stories)

    {questions_ledger}

    ## Simulation Mindset

    You are about to brainstorm this story with a user. Role-play the brainstorming
    skill: what questions would you ask? What decisions need to be made before you
    could produce a spec?

    For each question you would ask:
    1. Always take the recommended approach to continue exploration
    2. When the answer is "both" or "all of the above," select those to cover maximum decision surface
    3. Use assumed answers from earlier stories (in the ledger) as established context

    ## Question Discovery Rules

    Walk through each brainstorming stage for this story:
    - Purpose and constraints
    - Success criteria
    - Scope boundaries
    - Architecture decisions
    - Component design
    - Data flow
    - Error handling
    - Testing strategy

    For each stage, ask: "What would I need the user to decide?"

    ## Output Format

    Return the UPDATED questions ledger (previous entries + new entries for this story).

    Each entry follows this schema:
    - question: "[the question text]"
      why_it_matters: "[what this decision unblocks]"
      story_id: "{story_id}"
      assumed_answer: "[recommended approach, or broadest option if no clear recommendation]"
      confidence: "clear-recommendation" | "no-clear-recommendation"

    QUESTIONS_LEDGER:
      - question: "[question text]"
        why_it_matters: "[what it unblocks]"
        story_id: "[which story triggered this]"
        assumed_answer: "[the assumed answer]"
        confidence: "clear-recommendation" | "no-clear-recommendation"

    ## Rules

    - Read-only — never modify any files
    - Carry forward ALL previous ledger entries unchanged — only ADD new entries for the current story
    - Do not duplicate questions already in the ledger — if a previous story covered the same decision, skip it
    - If a previous assumed answer informs this story's decisions, reference it rather than re-asking
    - If you would ask the same question but the context differs enough to warrant a different answer, add a new entry noting the distinction
```

**Context management for large story sets (>15 stories):**

When the orchestrator detects that the story count exceeds 15, it summarizes the accumulated ledger before passing it to the simulator. The summary retains:
- All assumed decisions (question + answer pairs)
- Dependency relationships
- Key constraints

It drops:
- Detailed "why it matters" rationale from already-processed stories
- Per-question confidence annotations from already-processed stories

The orchestrator performs this summarization, not the simulator subagent.
