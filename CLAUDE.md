# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Superpowers** is a skills-based workflow system for Claude Code that implements TDD, systematic debugging, and collaborative development patterns. The repository contains:

- **Skills Library**: Reusable process documentation for development workflows
- **Plugin System**: Claude Code plugin integration with hooks and commands
- **Testing Framework**: Automated skill verification using Claude Code CLI

## Core Architecture

### Skills System

Skills are structured process documentation stored in `skills/`:

```
skills/
  skill-name/
    SKILL.md              # Main skill content (required)
    supporting-files.*    # Tools, references, examples (optional)
```

**Skill structure**:
- YAML frontmatter with `name` and `description` (max 1024 chars)
- Markdown content following specific patterns (see `skills/writing-skills/SKILL.md`)
- Descriptions must start with "Use when..." and describe triggering conditions only (never summarize workflow)

**Key implementation**: `lib/skills-core.js` handles:
- Skill discovery via `findSkillsInDir()`
- YAML frontmatter parsing via `extractFrontmatter()`
- Namespace resolution (personal skills override superpowers skills)
- Frontmatter stripping via `stripFrontmatter()`

### Plugin Integration

The `.claude-plugin/` directory contains Claude Code plugin configuration:

- `plugin.json`: Plugin metadata (name, version, author)
- `marketplace.json`: Marketplace configuration

**Session startup**: The `hooks/session-start.sh` hook injects the `using-superpowers` skill content into every Claude Code session, establishing the skills framework from the beginning.

### Commands vs Skills

- **Commands** (`commands/`): User-facing shortcuts like `/brainstorm`, `/write-plan`
- **Skills** (`skills/`): Full process documentation loaded via the Skill tool
- Commands are thin wrappers that point to skills

### Agents

The `agents/` directory contains agent definitions (currently `code-reviewer.md`) used by skills for specialized workflows like code review in subagent-driven-development.

## Development Commands

### Testing

**Run fast skill tests** (unit-level verification):
```bash
cd tests/claude-code
./run-skill-tests.sh
```

**Run integration tests** (full workflow execution, 10-30 minutes):
```bash
./run-skill-tests.sh --integration
```

**Run specific test**:
```bash
./run-skill-tests.sh --test test-subagent-driven-development.sh
```

**Verbose output** (see full Claude responses):
```bash
./run-skill-tests.sh --verbose
```

**Test structure**:
- `test-helpers.sh`: Common test utilities (`run_claude`, assertions)
- Each test file sources helpers and uses `run_claude` with prompts
- Tests verify skill loading and behavior, not full implementation

### Skill Development

**Creating/editing skills**: Always use the `writing-skills` skill which enforces RED-GREEN-REFACTOR for documentation:

1. **RED**: Run pressure scenarios WITHOUT the skill to capture baseline behavior
2. **GREEN**: Write skill addressing specific failures, verify with same scenarios
3. **REFACTOR**: Close loopholes by adding explicit counters for new rationalizations

**Render skill flowcharts**:
```bash
cd skills/writing-skills
./render-graphs.js ../some-skill           # Individual diagrams
./render-graphs.js ../some-skill --combine # Combined SVG
```

**Token usage analysis**:
```bash
cd tests/claude-code
./analyze-token-usage.py
```

## Key Architectural Patterns

### Skill Discovery (CSO - Claude Search Optimization)

Skills are discovered through:
1. Description field matching (start with "Use when...")
2. Keyword coverage in content (error messages, symptoms, tool names)
3. Descriptive naming (verb-first: `creating-skills` not `skill-creation`)

**Critical**: Description must ONLY describe triggering conditions. If it summarizes workflow, Claude may follow the description instead of reading the full skill.

### Namespace Resolution

`lib/skills-core.js` implements shadowing:
- Personal skills (`~/.claude/skills`) override superpowers skills
- `superpowers:skill-name` forces superpowers namespace
- Plain `skill-name` checks personal first, then superpowers

### Hook System

`hooks/hooks.json` defines Claude Code lifecycle hooks:
- `SessionStart`: Runs `session-start.sh` on startup/resume/clear/compact
- Hook script outputs JSON with `additionalContext` to inject into session

### Workflow Chain

Core skills trigger in sequence:
1. `brainstorming` → Design exploration and validation
2. `using-git-worktrees` → Isolated workspace creation
3. `writing-plans` → Detailed implementation planning
4. `subagent-driven-development` or `executing-plans` → Task execution
5. `test-driven-development` → RED-GREEN-REFACTOR enforcement
6. `requesting-code-review` → Quality verification
7. `finishing-a-development-branch` → Integration decisions

## Testing Philosophy

Skills are tested like code:
- **Write failing test first** (baseline behavior without skill)
- **Watch it fail** (document exact rationalizations)
- **Write minimal skill** (address specific failures)
- **Watch it pass** (verify compliance)
- **Refactor** (close loopholes, add explicit counters)

Integration tests (`test-subagent-driven-development-integration.sh`) verify:
- End-to-end workflow execution
- Subagent compliance with skills
- Actual working code production
- Git commit creation

## Important Constraints

### Skill Writing

- **Never** create skills without failing tests first (Iron Law)
- **Never** summarize workflow in description field (breaks CSO)
- **Always** use TodoWrite for skill creation checklist
- **Always** write description in third person starting with "Use when..."
- Maximum 1024 chars for frontmatter (name + description)
- Use graphviz flowcharts ONLY for non-obvious decisions

### File Organization

- Keep skills self-contained when possible (< 500 words)
- Separate files only for: heavy reference (100+ lines) or reusable tools
- Flat namespace in `skills/` - no nested hierarchies
- Supporting files go in skill directory, not in separate locations

### Token Efficiency

Frequently-loaded skills are injected into every session:
- `using-superpowers`: < 150 words
- Getting-started workflows: < 150 words each
- Other frequently-loaded: < 200 words total

Cross-reference other skills by name only, never use `@` syntax (force-loads file).

## Common Patterns

### Skill References

**In documentation**:
- ✅ `Use superpowers:test-driven-development`
- ✅ `**REQUIRED SUB-SKILL:** superpowers:systematic-debugging`
- ❌ `@skills/testing/test-driven-development/SKILL.md` (burns context)

### Flowchart Usage

Use `dot` format flowcharts for:
- Non-obvious decision points
- Process loops where agent might stop early
- "When to use A vs B" decisions

See `skills/writing-skills/graphviz-conventions.dot` for style rules.

### Code Examples

One excellent example > many mediocre ones:
- Choose most relevant language (TypeScript for testing, shell for system)
- Make examples complete and runnable
- Comment the WHY, not the WHAT
- Show pattern clearly, ready to adapt

## Release Process

Version is stored in `.claude-plugin/plugin.json`:
```json
{
  "version": "4.0.3"
}
```

Release notes are maintained in `RELEASE-NOTES.md`.