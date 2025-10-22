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

