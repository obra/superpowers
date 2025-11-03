# Changelog

## Fork Information

**Forked from**: [obra/superpowers](https://github.com/obra/superpowers) v3.2.2
**Marketplace**: `jthurlburt/claude-settings`

This is a personal fork with additional skills and enhancements borrowed from multiple sources.

## [Unreleased]

### Added

- Knowledge management integration: Opt-in [ADR](https://adr.github.io/) (Architecture Decision Records) and DISCOVERIES patterns from [Microsoft Amplifier](https://github.com/microsoft/amplifier) (2025-11-03)
  - `/setup-knowledge-management` slash command with embedded templates
  - 9 skills updated to integrate with `docs/decisions/` and `docs/discoveries/` when present
  - Skills fall back to `mem` for personal tracking when patterns not enabled
  - Comprehensive integration documented in `docs/decisions/001-adopt-knowledge-management.md`

## Attribution

Skills and concepts borrowed from:

- [obra/superpowers](https://github.com/obra/superpowers) - Base framework and core skills
- [superpowers-skills](https://github.com/obra/superpowers-skills) - Problem-solving patterns
- [CCPlugins](https://github.com/brennercruvinel/CCPlugins) - Development workflow skills
- [claude-codex-settings](https://github.com/fcakyon/claude-codex-settings/tree/main) - Enhancement concepts and hooks
- [Microsoft Amplifier](https://github.com/microsoft/amplifier) - Ambiguity and tension management patterns

## Added Skills

**From superpowers-skills:**

- `simplification-cascades` - Find unifying principles that eliminate components
- `collision-zone-thinking` - Force unrelated concepts together for innovation
- `meta-pattern-recognition` - Spot universal patterns across domains
- `inversion-exercise` - Flip assumptions to reveal alternatives
- `scale-game` - Test at extremes to expose fundamental truths
- `when-stuck` - Dispatch router to appropriate problem-solving technique
- `tracing-knowledge-lineages` - Understand technical decision evolution
- `preserving-productive-tensions` - Recognize when to preserve multiple approaches

**From CCPlugins:**

- `documentation-management` - Holistic documentation maintenance
- `predict-issues` - Proactive problem identification with risk assessment
- `code-and-project-cleanup` - Safe cleanup of code and project artifacts

**New skills:**

- `extracting-patterns-from-projects` - Systematic analysis methodology for external projects (2025-10-23)
- `enhancing-superpowers` - Project-specific integration guide for superpowers (2025-10-23)

## Enhanced Skills

Skills with added capabilities from concept extraction:

**brainstorming:**

- External source adaptation pattern
- Progressive reasoning framework (steel man alternatives, bias checking)

**systematic-debugging:**

- Auto-fix patterns with skill linkage for common test failures

**predict-issues:**

- Security-specific risk analysis (exploitability, exposure, blast radius)

**executing-plans:**

- Continuous validation between tasks (type checks, import validation)

**finishing-a-development-branch:**

- Documentation synchronization check
- Optional commit history cleanup guidance

**writing-plans:**

- Existing pattern survey before planning

**receiving-code-review:**

- Pattern alignment checks before implementing feedback

**dispatching-parallel-agents:**

- Generalized from debugging-only to cover research, analysis, and any parallel tasks (2025-10-23)

## Structural Changes

- Flattened skills directory structure (removed nested categories)
- Standardized skill names to Title Case per Anthropic guidelines
- Added hooks from claude-codex-settings for session management
