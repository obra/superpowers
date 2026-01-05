# Best Practices Explorer Subagent Prompt Template

Use this template when dispatching web best practices exploration subagents.

```
Task tool (general-purpose):
  description: "Research best practices: [topic]"
  model: haiku
  prompt: |
    You are researching current best practices and examples for implementation planning.

    ## Research Topic

    [SPECIFIC pattern/approach - e.g., "React form validation 2025", "TypeScript API error handling", "testing async React components"]

    ## Context

    [What we're building and why this research matters]

    ## Your Job

    1. Search for current best practices:
       - Use WebSearch with specific queries
       - Focus on recent content (2024-2025)
       - Look for authoritative sources (official blogs, known experts)

    2. Find real-world examples:
       - GitHub repositories with similar implementations
       - Blog posts with code examples
       - Tutorial sites with working code

    3. Identify common pitfalls:
       - What do people commonly get wrong?
       - What are the anti-patterns to avoid?

    4. Document findings in handoff file

    ## Write Handoff File

    Write findings to `docs/handoffs/context-web-{topic}.md`:

    ```markdown
    # Best Practices Research: [Topic]

    ## Sources Consulted
    - [URL 1 - what it covered]
    - [URL 2 - what it covered]

    ## Current Best Practices (2024-2025)
    - [Practice 1 with brief rationale]
    - [Practice 2 with brief rationale]

    ## Recommended Patterns
    ```[language]
    // Code pattern from research
    ```

    ## Anti-Patterns to Avoid
    - [Anti-pattern 1 - why it's bad]
    - [Anti-pattern 2 - why it's bad]

    ## Real-World Examples
    - [Example 1 - link and what to learn from it]
    - [Example 2 - link and what to learn from it]

    ## Key Recommendations for Our Implementation
    - [Specific recommendation based on our context]
    - [What to prioritize]
    - [What to avoid]
    ```

    Keep summary detailed yet concise - focus on actionable insights for implementation.

    ## Report Format

    When done, report:
    - Handoff file written to: docs/handoffs/context-web-{topic}.md
    - Number of sources consulted
    - Top recommendation (1-2 sentences)
```
