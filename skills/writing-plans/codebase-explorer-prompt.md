# Codebase Explorer Subagent Prompt Template

Use this template when dispatching codebase exploration subagents. The Explore subagent returns findings as text; the orchestrator writes the handoff file.

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

    3. Return findings in structured format

    ## Output Format (return this structured text)

    CODEBASE EXPLORATION: [Aspect]
    ==============================

    Key Files Found:
    - `path/to/file.ts` - [what it does, why it's relevant]
    - `path/to/other.ts` - [what it does, why it's relevant]

    Patterns Observed:
    - [Pattern 1 with code snippet if helpful]
    - [Pattern 2]

    Dependencies/Imports:
    - [Key libraries used]
    - [Internal modules referenced]

    Test Coverage:
    - [How similar features are tested]
    - [Test file locations]

    Recommendations for Implementation:
    - [Suggest following existing patterns]
    - [Note any constraints or considerations]

    ==============================

    Keep summary detailed yet concise - focus on actionable context for plan writing.
```

## Write Handoff File (Orchestrator Responsibility)

After the subagent returns, the orchestrator writes findings to `docs/handoffs/context-codebase-{aspect}.md`.

**Why this pattern?**
- Explore subagents have read-only tools (Glob, Grep, Read) - no Write access
- Orchestrator handles all file writing for consistency
- Subagent focuses on exploration, orchestrator handles handoff management
