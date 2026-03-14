# Dependency-Analyzer Subagent Prompt Template

Use this template when dispatching the dependency-analyzer subagent to produce a dependency graph and ordered processing sequence for stories.

```text
Task tool (general-purpose):
  description: "Analyze story dependencies"
  prompt: |
    You are analyzing story dependencies to determine processing order for brainstorm simulation.

    ## PRD Content

    {prd_content}

    ## Stories

    {stories}

    ## Your Job

    1. Read all story definitions and the PRD
    2. For each story, identify:
       - What it depends on (other stories that must be understood first)
       - What it enables (other stories that depend on it)
    3. Produce a topological ordering — stories with no dependencies first
    4. If you detect a cycle, report it clearly

    ## Dependency Detection Rules

    - A story depends on another if it references concepts, APIs, data models, or flows defined by that other story
    - Shared infrastructure (auth, database) creates implicit dependencies — stories that define infrastructure come before stories that consume it
    - If two stories are truly independent (no shared concepts), they have no dependency relationship
    - When in doubt about a dependency, include it — false positives are less harmful than false negatives for ordering

    ## Report Format

    DEPENDENCY_ANALYSIS:
      status: success | cycle_detected
      cycle_details: "[description of cycle, if any]"
      stories:
        - id: "[story identifier]"
          source: "[file path or github issue reference]"
          title: "[brief story title]"
          depends_on: ["[list of story ids this depends on]"]
          order: [processing order number, 1-based]
          reasoning: "[brief explanation of dependency placement]"

    ## Rules

    - Read-only — never modify any files
    - If a story references a GitHub issue, use the issue title and body as the story content
    - If story content is ambiguous, note it in the reasoning field
    - Order must be deterministic — when two stories have equal priority, order alphabetically by id
```
