# Context-Scout Subagent Prompt Template

Use this template when dispatching the context-scout subagent to gather all available project context before brainstorming begins.

## Dispatch

```text
Agent tool (general-purpose):
  description: "Scout project context for implementation"
  prompt: |
    You are gathering comprehensive project context to inform an autonomous implementation pipeline.

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

    {task_description}

    ## Your Job

    1. Scan codebase structure: README, CLAUDE.md, package.json (or equivalent manifest)
    2. Load PRD if it exists — auto-detect from `docs/` directory
    3. Load `docs/superpowers/design-principles.md` if it exists
    4. Load existing specs from `docs/superpowers/specs/`
    5. Identify testing frameworks, patterns, and conventions in use
    6. Detect type-checking and linting tools (e.g., tsc, mypy, go vet, eslint)
    7. Identify available expert skills from the Skill tool's system-reminder list
    8. Use context7 to fetch docs for detected frameworks/libraries
    9. Return the structured context summary below

    ## Discovery Steps

    - Run `ls` at project root to understand top-level structure
    - Check for manifest files: package.json, Cargo.toml, go.mod, pyproject.toml, Gemfile, etc.
    - Check for test directories: tests/, __tests__/, spec/, test/
    - Check for CI config: .github/workflows/, .circleci/, Jenkinsfile
    - Check for linter config: .eslintrc*, .prettierrc*, mypy.ini, .golangci.yml, tsc config in tsconfig.json
    - Grep for test commands in package.json scripts or Makefile
    - Read CLAUDE.md for project-specific instructions
    - Scan docs/ directory for PRD, specs, design principles

    ## Rules

    - Read-only — never modify any files
    - If a file doesn't exist, note its absence rather than failing
    - Be thorough — missing context causes downstream failures
    - Use context7 for any detected framework to fetch current docs

    ## Report Format

    CONTEXT_SUMMARY:
      project_type: "[web-app | api | cli | library | plugin | monorepo]"
      frameworks: ["[list of detected frameworks]"]
      test_framework: "[detected test framework, e.g., jest, pytest, go test]"
      test_command: "[command to run tests, e.g., npm test, pytest]"
      test_patterns: "[where tests live and naming conventions]"
      type_check_tool: "[tsc | mypy | go vet | null]"
      linter: "[eslint | ruff | golangci-lint | null]"
      existing_specs: ["[list of spec file paths in docs/superpowers/specs/]"]
      design_principles_path: "[path or null]"
      prd_path: "[path or null]"
      available_expert_skills: ["[list of skill names from system-reminder]"]
      codebase_structure_summary: "[2-3 sentence overview of project layout]"
      key_conventions: ["[list of conventions detected from existing code]"]
```

## Template Variables

| Variable | Source |
|----------|--------|
| `{task_description}` | Original task description from user |
