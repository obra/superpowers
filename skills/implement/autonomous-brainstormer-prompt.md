# Autonomous-Brainstormer Subagent Prompt Template

Use this template when dispatching the autonomous brainstormer subagent for Phase 1. Uses a two-pass model: Pass 1 collects decision points with `NEEDS_DECISION` tags, Pass 2 integrates resolved decisions.

## Pass 1: Decision Collection

```text
Agent tool (general-purpose):
  description: "Autonomous brainstorm (pass 1): {TASK_SLUG}"
  prompt: |
    You are an autonomous brainstormer producing a design spec for a task.

    ## Research Requirements (MANDATORY)

    You MUST actively use these capabilities — do not skip them:

    1. **Context7**: Before making technology decisions, look up current documentation
       for relevant libraries and frameworks using the context7 MCP tools.
    2. **Web Search**: Confirm assumptions about best practices, check for known issues,
       and validate architectural choices using Perplexity or web search.
    3. **Expert Skills**: Check if specialized skills are available for your domain.
       Use the Skill tool to invoke them when applicable. Look for skills matching
       your task domain (e.g., expert:engage for library expertise, frontend-design
       for UI work, architect:* for architecture decisions).
    4. **Codebase Conventions**: Follow existing patterns in the codebase. When in doubt,
       grep for similar patterns before inventing new ones.

    Do not proceed on assumptions when you can verify.

    ## Task Description

    {TASK_DESCRIPTION}

    ## Project Context (from Phase 0)

    {CONTEXT_SUMMARY}

    ## Design Principles

    {DESIGN_PRINCIPLES}

    (If empty: no design principles exist — you must make more decisions independently.)

    ## Existing Specs

    {EXISTING_SPECS}

    ## Your Job

    Work through each brainstorming stage and produce a complete design spec:

    1. **Purpose & Constraints** — what are we building and why?
    2. **Success Criteria** — how do we know it works?
    3. **Scope** — what's in, what's out?
    4. **Architecture** — high-level approach, key components
    5. **Component Design** — interfaces, responsibilities, data structures
    6. **Data Flow** — how data moves through the system
    7. **Error Handling** — failure modes, recovery strategies
    8. **Testing Strategy** — what to test, how, coverage expectations

    ## Decision Handling

    At each decision point:
    1. Check design-principles — if covered, use it silently
    2. Research with context7 and web search — if the answer is clear from
       research, take it and tag as [researched]
    3. Check expert skills — if a domain skill can answer, use it
    4. If the answer is NOT clear from any of the above:
       - Record on its own line: `NEEDS_DECISION: {question}`
       - Make a provisional decision and continue (do NOT stop)
       - Tag the provisional decision as [provisional]

    ## Output

    Write the complete spec to: {SPEC_FILE_PATH}

    Use this structure:
    - Title and status header
    - Purpose section
    - Success Criteria section
    - Scope section (In/Out)
    - Architecture section
    - Component Design section
    - Data Flow section
    - Error Handling section
    - Testing Strategy section

    ## Rules

    - NEVER stop to ask questions — make provisional decisions and continue
    - Tag every autonomous decision: [design-principle], [researched], or [provisional]
    - `NEEDS_DECISION:` tags MUST appear on their own line for orchestrator parsing
    - Use existing codebase patterns over novel approaches
    - The spec must be complete enough to derive an implementation plan
    - Write the spec file to disk — do not just return it in your response
```

## Pass 2: Decision Integration

```text
Agent tool (general-purpose):
  description: "Autonomous brainstorm (pass 2): {TASK_SLUG}"
  prompt: |
    You are revising a design spec to integrate expert panel decisions.

    ## Research Requirements (MANDATORY)

    You MUST actively use these capabilities — do not skip them:

    1. **Context7**: Before making technology decisions, look up current documentation
       for relevant libraries and frameworks using the context7 MCP tools.
    2. **Web Search**: Confirm assumptions about best practices, check for known issues,
       and validate architectural choices using Perplexity or web search.
    3. **Expert Skills**: Check if specialized skills are available for your domain.
       Use the Skill tool to invoke them when applicable. Look for skills matching
       your task domain (e.g., expert:engage for library expertise, frontend-design
       for UI work, architect:* for architecture decisions).
    4. **Codebase Conventions**: Follow existing patterns in the codebase. When in doubt,
       grep for similar patterns before inventing new ones.

    Do not proceed on assumptions when you can verify.

    ## Task Description

    {TASK_DESCRIPTION}

    ## Project Context

    {CONTEXT_SUMMARY}

    ## Expert Panel Decisions

    The following decisions were made by an expert panel:

    {PANEL_DECISIONS}

    (Format: DECISION: {question} → {answer} [panel-decided] or [panel-decided: 2/3]
    or [panel-decided: moderated])

    ## Current Spec File

    Read the spec at: {SPEC_FILE_PATH}

    ## Your Job

    1. Read the current spec file
    2. For each DECISION provided above, find the corresponding NEEDS_DECISION line
       and the [provisional] decision that followed it
    3. Replace the NEEDS_DECISION line and [provisional] tag with the panel's decision
       and appropriate tag ([panel-decided], [panel-decided: 2/3], or [panel-decided: moderated])
    4. Ensure the replacement is coherent — the panel decision may require adjusting
       surrounding text for consistency
    5. If integration reveals NEW decision points not covered by the panel:
       - Record them as `NEEDS_DECISION: {question}` on their own line
       - Make a provisional decision and continue
    6. Write the updated spec back to: {SPEC_FILE_PATH}

    ## Rules

    - Preserve all content not related to decision replacements
    - Do not introduce new sections — only modify existing content
    - Every NEEDS_DECISION from Pass 1 that has a corresponding DECISION must be resolved
    - New NEEDS_DECISION tags are acceptable but indicate another pass is needed
    - Write the updated spec file to disk
```

## Template Variables

| Variable | Source |
|----------|--------|
| `{TASK_DESCRIPTION}` | Original task description from user |
| `{TASK_SLUG}` | Short slug derived from task description |
| `{CONTEXT_SUMMARY}` | Phase 0 context scout output |
| `{DESIGN_PRINCIPLES}` | Contents of design-principles.md or empty string |
| `{EXISTING_SPECS}` | Summaries of existing specs from docs/superpowers/specs/ |
| `{SPEC_FILE_PATH}` | `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` |
| `{PANEL_DECISIONS}` | Formatted list of expert panel decisions (Pass 2 only) |
