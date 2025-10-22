# Rejected Features Log

This document tracks features evaluated but not integrated during repository consolidation.

Each rejection includes reasoning to prevent future reconsideration without new context.

---

## superpowers-skills

### remembering-conversations
- **Source**: superpowers-skills/skills/collaboration/remembering-conversations/
- **Type**: Skill with custom tooling
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Redundant with existing local-semantic-memory MCP server. User is developing V2 of memory server that will incorporate this functionality as a plugin. Custom tooling adds maintenance burden without providing capability advantage over the existing MCP server implementation.

### gardening-skills-wiki
- **Source**: superpowers-skills/skills/meta/gardening-skills-wiki/
- **Type**: Skill with bash tooling
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Architecture mismatch. Designed for INDEX.md-based wiki structure, but superpowers uses Claude Code first-party skills system without INDEX files. Bash scripts expect structure that doesn't exist. Would require complete rewrite for minimal benefit.

### pulling-updates-from-skills-repository
- **Source**: superpowers-skills/skills/meta/pulling-updates-from-skills-repository/
- **Type**: Skill
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Architecture mismatch. Designed for tracking single upstream (obra/superpowers-skills). This consolidation is one-way merge from multiple sources. Update model after consolidation will be manual feature evaluation, not automated git sync. Skill becomes obsolete post-consolidation.

---

## CCPlugins

### implement
- **Source**: CCPlugins/commands/implement.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. External source adaptation (GitHub URLs, docs) with pattern matching to project architecture
  2. Pattern discovery - analyzing codebase to understand existing conventions
  3. Smart repo sampling for large external sources
  4. Source-analysis.md artifact - deep comparison between original and implementation
  5. Dependency resolution/mapping to existing project dependencies
- **Reason**: Significant overlap with existing brainstorm/write-plan/execute-plan workflow. Complex session state management. Better to enhance existing skills with these concepts than duplicate workflow.

### refactor
- **Source**: CCPlugins/commands/refactor.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. Continuous validation after EVERY change - guarantees no breakage during refactoring
  2. De-para mapping - before/after tracking for migrations (helps teams understand changes)
  3. Auto-fix broken references - automatically update imports, type definitions, references
  4. Pattern migration tracking - map old patterns to new patterns with status
  5. Multi-phase validation gates - coverage check, import verification, build/test, type checking, dead code detection
  6. Complexity hotspot detection - identify code areas needing refactoring
- **Reason**: Heavy 6-phase workflow with complex session state management. Core safety concepts (continuous validation, de-para mapping) would enhance existing workflows without duplicating infrastructure. Overlap with existing systematic-debugging skill.

### contributing
- **Source**: CCPlugins/commands/contributing.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. Automatic issue discovery - scan remote repo for bugs/features matching your changes
  2. Smart matching algorithm - link code changes to existing issues by keyword/file analysis
  3. Proactive issue creation - create issues in project style if no matches exist
  4. Context detection - adapts to active session vs post-implementation vs cold start vs mid-dev
  5. Mandatory pre-flight checks - STOP if build/test/lint fails (hard gate)
  6. PR style matching - analyze existing PRs to match project tone/format
  7. Git workflow detection - identify Git Flow, GitHub Flow, GitLab Flow, or custom
  8. Smart PR splitting - detect multiple features and suggest logical split
- **Reason**: Duplicates existing finishing-a-development-branch skill. Core concepts (automatic issue discovery, context detection, mandatory checks, style matching) would enhance existing skill without duplicating workflow.

### test
- **Source**: CCPlugins/commands/test.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. Auto-fix patterns for common test failures - async/timing, mocks, imports, types, null handling, off-by-one errors
  2. Log/console pattern detection - memory leaks, port conflicts, permission errors, timeouts, module resolution
  3. Build/compilation verification before tests - catch build failures early
  4. Context-aware test selection - test only modified files vs full suite based on situation
  5. Failure analysis workflow - parse output, read failing test, read implementation, analyze passing tests, apply fix
  6. Coverage gap identification - identify untested code paths and suggest critical missing tests
  7. Flaky test pattern detection - analyze intermittent failures
- **Reason**: Heavy workflow automation with dependencies on non-existent commands (/scaffold, /fix-todos, /security-scan, /format, /create-todos, /explain-like-senior, /review, /session-end) and session context (CLAUDE.md). Core troubleshooting patterns valuable but context-detection orchestration is command-level, not teachable technique. Existing test-driven-development and testing-anti-patterns skills cover philosophy; this adds troubleshooting patterns.

### scaffold
- **Source**: CCPlugins/commands/scaffold.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. Pattern discovery from existing codebase - analyze project structure to understand conventions
  2. Convention replication - automatically match naming, file organization, architecture patterns
  3. Incremental generation with checkpoints - break large scaffolding into manageable steps
  4. Project-specific templates - generate code matching existing patterns rather than generic templates
- **Reason**: Session state infrastructure (scaffold/plan.md, scaffold/state.json) adds complexity. Pattern discovery concept valuable for enhancing existing planning workflows without dedicated session state management. Resume capability useful but heavyweight for scaffolding use case.

### security-scan
- **Source**: CCPlugins/commands/security-scan.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. Multi-dimensional vulnerability assessment - authentication, injection, secrets, dependencies, configuration
  2. Risk-based prioritization - Critical/High/Medium/Low categorization with remediation order
  3. Extended thinking for complex threats - chain vulnerabilities, business logic flaws, timing attacks
  4. Secrets detection patterns - hardcoded credentials, API keys, configuration exposures
  5. Incremental remediation workflow - fix, verify, update plan, move to next
  6. Safe remediation patterns - secrets to env vars, hardcoded to config, weak validation to strong
- **Reason**: Session state infrastructure (security-scan/plan.md, security-scan/state.json) adds complexity. Security analysis concepts valuable but dedicated command with state management may be overkill. Better as enhancement to systematic-debugging or as security analysis patterns within existing workflows.

### understand
- **Source**: CCPlugins/commands/understand.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. 5-phase discovery process - project understanding, architecture, patterns, dependencies, synthesis
  2. Technology stack detection - identify frameworks, libraries, build tools, testing setup
  3. Pattern recognition across codebase - naming conventions, architectural patterns, code organization
  4. Integration point mapping - identify how components connect and communicate
  5. Mental model generation - create comprehensive understanding for onboarding/context
  6. Systematic codebase analysis technique - structured approach to exploring unfamiliar codebases
- **Reason**: Excellent analysis technique but as command it's workflow automation. The systematic discovery process is teachable and valuable for enhancing brainstorming or codebase exploration. Better as analysis pattern/technique within existing skills than standalone command.

### todos-to-issues
- **Source**: CCPlugins/commands/todos-to-issues.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Rejection Reason**: GitHub-specific workflow automation, not a teachable technique. Value is in automating issue creation rather than teaching systematic approach. Pre-flight checks concept already captured in contributing evaluation. TODO extraction is simple grep. This is utility automation rather than skill/pattern. If needed later, could be simple script but doesn't fit skill/command framework.

### commit

- **Source**: CCPlugins/commands/commit.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Decision**: EXTRACT_CONCEPTS (not full integration)
- **Concepts to Extract**:
  1. Pre-commit quality gates - MUST run build/test/lint before allowing commit
  2. Commit message generation from change analysis - analyze diff to determine type, scope, and description
  3. Conventional commit format - type (feat/fix/docs/style/refactor/test/chore), optional scope, clear subject
  4. Staged vs unstaged awareness - handle both scenarios intelligently
  5. Error recovery - handle commit failures with clear guidance
- **Reason**: Core workflow patterns valuable but full command is automation. Pre-commit gates and message generation from change analysis are concepts that enhance git workflow. Repository has no existing commit command/policy, so these patterns fill a gap conceptually.

### review

- **Source**: CCPlugins/commands/review.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Redundant with existing code review infrastructure. Base repo already has comprehensive code review skills (requesting-code-review, receiving-code-review) and code-reviewer agent. Sub-agent specialization concept (security, performance, quality, architecture perspectives) interesting but existing skills already provide systematic review processes. No significant new concepts beyond what's already captured.

---

## claude-codex-settings

### explain-architecture-pattern

- **Source**: claude-codex-settings/.claude/commands/explain-architecture-pattern.md
- **Type**: Command
- **Evaluated**: 2025-10-22
- **Rejection Reason**: Primarily reference material - catalog of common architectural patterns with example output format. Actual pattern recognition is basic Claude capability. The value is in comprehensive list and structured format, but doesn't constitute teachable technique or systematic process. Educational content/templates rather than skill. Pattern explanation already within base capabilities without dedicated command.

