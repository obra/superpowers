---
name: Documentation Management
description: Holistic documentation management - updates README, CHANGELOG, API docs, and guides based on code changes
when_to_use: after implementing features, fixing bugs, or when documentation is outdated across multiple files
version: 1.0.0
---

# Documentation Management

Intelligently manage project documentation by analyzing what actually happened and updating ALL relevant docs accordingly.

## Approach

1. **Analyze the entire conversation** - Understand the full scope of changes
2. **Read ALL documentation files** - README, CHANGELOG, docs/*, guides, everything
3. **Identify what changed** - Features, architecture, bugs, performance, security, etc
4. **Update EVERYTHING affected** - Not just one file, but all relevant documentation
5. **Maintain consistency** - Ensure all docs tell the same story

**Don't make assumptions** - Look at what ACTUALLY changed and update accordingly. If you refactored the entire architecture, update architecture docs, README, migration guides, API docs, and anything else affected.

## Technique 1: Documentation Overview

Use when you need to understand current documentation state:

1. **Glob** all markdown files (README, CHANGELOG, docs/*)
2. **Read** each documentation file
3. **Analyze** documentation coverage
4. **Present** organized summary

Output format:
```
DOCUMENTATION OVERVIEW
├── README.md - [status: current/outdated]
├── CHANGELOG.md - [last updated: date]
├── CONTRIBUTING.md - [completeness: 85%]
├── docs/
│   ├── API.md - [status]
│   └── architecture.md - [status]
└── Total coverage: X%

KEY FINDINGS
- Missing: Setup instructions
- Outdated: API endpoints (3 new ones)
- Incomplete: Testing guide
```

## Technique 2: Smart Update

Use when you need to synchronize documentation with current codebase:

1. **Analyze current codebase** to understand implementation
2. **Compare** code reality vs documentation
3. **Identify** what needs updating:
   - New features not documented
   - Changed APIs or interfaces
   - Removed features still in docs
   - New configuration options
   - Updated dependencies

4. **Update systematically:**
   - README.md with new features/changes
   - CHANGELOG.md with version entries
   - API docs with new endpoints
   - Configuration docs with new options
   - Migration guides if breaking changes

## Technique 3: Session Documentation

Use after a long coding session to capture all changes:

1. **Analyze conversation history**
2. **List all changes made**
3. **Group by feature/fix/enhancement**
4. **Update appropriate docs**

Updates will follow the project's documentation style and conventions, organizing changes by type (Added, Fixed, Changed, etc.) in the appropriate sections.

## Technique 4: Context-Aware Updates

Use based on what happened in the session:

- **After new feature**: Update README features, add to CHANGELOG
- **After bug fixes**: Document in CHANGELOG, update troubleshooting
- **After refactoring**: Update architecture docs, migration guide
- **After security fixes**: Update security policy, CHANGELOG
- **After performance improvements**: Update benchmarks, CHANGELOG

## Core Principles

### Smart Documentation Rules

1. **Preserve custom content** - Never overwrite manual additions
2. **Match existing style** - Follow current doc formatting
3. **Semantic sections** - Add to correct sections
4. **Version awareness** - Respect semver in CHANGELOG
5. **Link updates** - Fix broken internal links

### ALWAYS

- Read existing docs completely before any update
- Find the exact section that needs updating
- Update in-place, never duplicate
- Preserve custom content and formatting
- Only create new docs if absolutely essential (README missing, etc)

### NEVER

- Delete existing documentation
- Overwrite custom sections
- Change documentation style drastically
- Add AI attribution markers
- Create unnecessary documentation

### Preserve Custom Content

Respect and preserve marked custom sections:
```markdown
<!-- CUSTOM:START -->
User's manual content preserved
<!-- CUSTOM:END -->
```

## CHANGELOG Management Patterns

**Smart CHANGELOG handling:**
- Groups changes by type (Added, Changed, Deprecated, Removed, Fixed, Security)
- Suggests version bump (major/minor/patch) based on semver principles
- Links to relevant PRs/issues when available
- Maintains chronological order (newest at top)
- Follows [Keep a Changelog](https://keepachangelog.com/) format

**Version Suggestion Logic:**
- MAJOR: Breaking changes, API changes, removed features
- MINOR: New features, enhancements, deprecations
- PATCH: Bug fixes, documentation, internal changes

## Documentation Types Managed

- **API Documentation** - Endpoints, parameters, responses
- **Database Schema** - Tables, relationships, migrations
- **Configuration** - Environment variables, settings
- **Deployment** - Setup, requirements, procedures
- **Troubleshooting** - Common issues and solutions
- **Performance** - Benchmarks, optimization guides
- **Security** - Policies, best practices, incident response

## Smart Features

- **Version Detection** - Auto-increment version numbers
- **Breaking Change Alert** - Warn when docs need migration guide
- **Cross-Reference** - Update links between docs
- **Example Generation** - Create usage examples from tests
- **Diagram Updates** - Update architecture diagrams (text-based)
- **Dependency Tracking** - Document external service requirements

## Team Collaboration

- **PR Documentation** - Generate docs for pull requests
- **Release Notes** - Create from CHANGELOG for releases
- **Onboarding Docs** - Generate from project analysis
- **Handoff Documentation** - Create when changing teams
- **Knowledge Transfer** - Document before leaving project

## Quality Checks

Before completing, verify:
- **Doc Coverage** - Report undocumented features
- **Freshness Check** - Flag stale documentation
- **Consistency** - Ensure uniform style across docs
- **Completeness** - Verify all sections present
- **Accuracy** - Compare docs vs actual implementation

## Workflow Integration

### After Analyzing Code
After analyzing the codebase, update docs to match reality:
1. Complete codebase analysis to understand current state
2. Compare implementation vs documentation
3. Update docs systematically

### After Fixing Technical Debt
After fixing issues, document changes:
1. Fix technical debt items
2. Verify everything works
3. Document changes in appropriate files

### After Major Refactoring
After architectural changes, update all affected docs:
1. Fix code structure and imports
2. Format code
3. Update architecture docs, migration guides, README

### Before Creating PR
Before submitting work, ensure documentation is current:
1. Review code changes
2. Update docs to reflect any changes or findings
3. Verify documentation completeness

### After Adding Features
After implementing new functionality, document the new API:
1. Implement feature
2. Test functionality
3. Document the new API/features

## Simple Usage Patterns

The skill adapts based on context:
- **Fresh project?** Show what docs exist
- **Just coded?** Update the relevant docs
- **Long session?** Document everything
- **Just fixed bugs?** Update CHANGELOG

No need to specify arguments - understand context from the conversation and adapt accordingly.

## Completion Protocol

After analysis, ask: "How should I proceed?"
- Update all outdated docs
- Focus on specific files
- Create missing documentation
- Generate migration guide
- Skip certain sections

This keeps documentation as current as code while supporting the entire development lifecycle.
