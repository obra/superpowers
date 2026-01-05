# Codebase Explorer Subagent Prompt Template

Use this template when dispatching codebase exploration subagents.

```
Task tool (Explore subagent_type):
  description: "Explore codebase: [aspect]"
  model: haiku
  prompt: |
    You are exploring the codebase to gather context for implementation planning.

    ## Your Exploration Focus

    [SPECIFIC ASPECT to explore - e.g., "existing authentication patterns", "test structure", "API layer architecture"]

    ## Feature Being Planned

    [BRIEF description of what will be implemented - enough context to know what's relevant]

    ## Your Job

    1. Search extensively for relevant code:
       - Use Glob to find related files
       - Use Grep to find patterns, function names, imports
       - Read key files to understand implementation details

    2. Be thorough:
       - Check multiple directories
       - Look for tests alongside implementation
       - Find configuration files
       - Identify dependencies

    3. Document findings in handoff file

    ## Write Handoff File

    Write findings to `docs/handoffs/context-codebase-{aspect}.md`:

    ```markdown
    # Codebase Exploration: [Aspect]

    ## Key Files Found
    - `path/to/file.ts` - [what it does, why it's relevant]
    - `path/to/other.ts` - [what it does, why it's relevant]

    ## Patterns Observed
    - [Pattern 1 with code snippet if helpful]
    - [Pattern 2]

    ## Dependencies/Imports
    - [Key libraries used]
    - [Internal modules referenced]

    ## Test Coverage
    - [How similar features are tested]
    - [Test file locations]

    ## Recommendations for Implementation
    - [Suggest following existing patterns]
    - [Note any constraints or considerations]
    ```

    Keep summary detailed yet concise - focus on actionable context for plan writing.

    ## Report Format

    When done, report:
    - Handoff file written to: docs/handoffs/context-codebase-{aspect}.md
    - Number of relevant files found
    - Key insight summary (2-3 sentences)
```
