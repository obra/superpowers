# Documentation Explorer Subagent Prompt Template

Use this template when dispatching documentation exploration subagents.

```
Task tool (general-purpose):
  description: "Explore docs: [topic]"
  model: haiku
  prompt: |
    You are exploring documentation to gather context for implementation planning.

    ## Documentation Topic

    [SPECIFIC documentation area - e.g., "React Router v7 data loading", "Prisma relations", "Jest mocking"]

    ## Why This Is Needed

    [Context from codebase exploration - what we found that needs documentation lookup]

    ## Your Job

    1. Find official documentation:
       - Use WebSearch to find official docs
       - Use WebFetch to read documentation pages
       - If MCP tools available for the library, prefer those

    2. Focus on:
       - API signatures and parameters
       - Configuration options
       - Best practices from docs
       - Common patterns shown in examples
       - Version-specific details (match what codebase uses)

    3. Document findings in handoff file

    ## Write Handoff File

    Write findings to `docs/handoffs/context-docs-{topic}.md`:

    ```markdown
    # Documentation: [Topic]

    ## Source
    - [URLs or MCP sources used]

    ## API Reference
    - [Key functions/methods with signatures]
    - [Required parameters and types]
    - [Return values]

    ## Configuration
    - [Relevant config options]
    - [Default values]

    ## Patterns from Docs
    - [Recommended approaches from official docs]
    - [Code snippets if helpful]

    ## Gotchas/Warnings
    - [Things docs say to avoid]
    - [Common mistakes mentioned]

    ## Version Notes
    - [Version this applies to]
    - [Any version-specific considerations]
    ```

    Keep summary detailed yet concise - include exact API details needed for implementation.

    ## Report Format

    When done, report:
    - Handoff file written to: docs/handoffs/context-docs-{topic}.md
    - Documentation sources used
    - Key finding summary (2-3 sentences)
```
