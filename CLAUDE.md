# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Superpowers** is a skills-based workflow system for Claude Code that implements TDD, systematic debugging, and collaborative development patterns. The repository contains:

- **Skills Library**: Reusable process documentation for development workflows
- **Plugin System**: Claude Code plugin integration with hooks and commands
- **Testing Framework**: Automated skill verification using Claude Code CLI

## Implementation History

Recent implementations (see docs/plans/completed/ for details):

- **2026-01-11**: Finishing Workflow Enhancements - Pre-flight check for uncommitted changes, enhanced test verification with user prompts, code review as explicit option, smart README section detection

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

## Development Setup

### Local Plugin Development

This repository is a Claude Code plugin. For local development:

1. **Install from local marketplace**: The plugin is installed via the `superpowers-dev` marketplace and enabled in `~/.claude/settings.json`:
   ```json
   {
     "enabledPlugins": {
       "superpowers@superpowers-dev": true
     }
   }
   ```

2. **Plugin installation path**: When installed locally, the plugin is cached at:
   ```
   ~/.claude/plugins/cache/superpowers-dev/superpowers/<version>/
   ```

3. **Update the plugin**: After making changes, update via:
   ```bash
   /plugin update superpowers
   ```

### Version Management

Version is stored in `.claude-plugin/plugin.json` (currently 4.0.4). When releasing:
1. Update version in `.claude-plugin/plugin.json`
2. Document changes in `RELEASE-NOTES.md`
3. Commit and tag with version number
4. Plugin marketplace automatically syncs updates

## Development Commands

### Testing

**Run fast skill tests** (unit-level verification, ~2 minutes):
```bash
cd ~/Dev/superpowers/tests/claude-code
./run-skill-tests.sh
```

**Run integration tests** (full workflow execution, 10-30 minutes):
```bash
cd ~/Dev/superpowers/tests/claude-code
./run-skill-tests.sh --integration
```

**Run specific test**:
```bash
cd ~/Dev/superpowers/tests/claude-code
./run-skill-tests.sh --test test-subagent-driven-development.sh
```

**Verbose output** (see full Claude responses):
```bash
cd ~/Dev/superpowers/tests/claude-code
./run-skill-tests.sh --verbose
```

**IMPORTANT**: Tests must run from the superpowers directory (not temp directories) for skill loading to work correctly. The plugin must be enabled as `superpowers@superpowers-dev` in `~/.claude/settings.json`.

**Test structure**:
- `test-helpers.sh`: Common test utilities (`run_claude`, assertions)
- Each test file sources helpers and uses `run_claude` with prompts
- Tests verify skill loading and behavior, not full implementation
- Integration tests parse `.jsonl` session transcripts from `~/.claude/projects/` to verify tool invocations and behavior

### Debugging Skills

When working with skills that aren't behaving as expected:

1. **Check skill loading**: Verify the skill is actually loaded by looking for `Skill` tool invocations in session transcripts
2. **Review session transcripts**: Parse `.jsonl` files in `~/.claude/projects/` to see exact tool invocations and agent behavior
3. **Test in isolation**: Use fast tests to verify skill loading and basic behavior before running full integration tests
4. **Check CSO**: Ensure skill description starts with "Use when..." and contains relevant keywords for discovery

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
# Analyze a specific session transcript
python3 tests/claude-code/analyze-token-usage.py ~/.claude/projects/<project-dir>/<session-id>.jsonl

# Find recent sessions for this project (adjust path encoding as needed)
SESSION_DIR="$HOME/.claude/projects/-Users-<username>-Dev-superpowers"
ls -lt "$SESSION_DIR"/*.jsonl | head -5
```

Provides per-subagent token breakdown, cache usage, and cost estimates.

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
5. `test-driven-development` → RED-GREEN-REFACTOR enforcement (triggered during implementation)
6. `systematic-debugging` → 4-phase root cause analysis (triggered when bugs occur)
7. `requesting-code-review` → Quality verification
8. `verification-before-completion` → Ensure fixes actually work
9. `documenting-completed-implementation` → Update project documentation
10. `finishing-a-development-branch` → Integration decisions (merge/PR/cleanup)

### Complete Skills List

**Design & Planning**:
- `brainstorming` - Socratic design refinement before writing code
- `writing-plans` - Detailed implementation plans with verification steps

**Setup & Infrastructure**:
- `using-git-worktrees` - Isolated workspace creation on new branch

**Execution**:
- `executing-plans` - Batch execution with human checkpoints
- `subagent-driven-development` - Parallel task execution with two-stage review
- `dispatching-parallel-agents` - Concurrent workflows for independent tasks

**Quality & Testing**:
- `test-driven-development` - RED-GREEN-REFACTOR cycle enforcement
- `systematic-debugging` - 4-phase process with root-cause-tracing
- `verification-before-completion` - Ensure it actually works
- `requesting-code-review` - Pre-review checklist
- `receiving-code-review` - Responding to feedback with verification

**Completion**:
- `documenting-completed-implementation` - Update CLAUDE.md and README, mark plan complete, archive to completed/
- `finishing-a-development-branch` - Invokes documenting skill, then handles git workflow (merge/PR/cleanup)

**Meta-Learning**:
- `meta-learning-review` - Analyze learnings, detect patterns, suggest skills. Handles decay (archives stale knowledge). Triggered every 10 learnings or via /review-learnings.
- `compound-learning` - Quick capture after verification. Builds searchable knowledge in docs/learnings/.

**Meta**:
- `using-superpowers` - Introduction to skills system (auto-loaded at session start)
- `writing-skills` - TDD for creating/editing skills

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
  "version": "4.0.4"
}
```

Release notes are maintained in `RELEASE-NOTES.md`.

## Quick Reference

### Common Development Tasks

**Add a new skill**:
1. Use the `writing-skills` skill (enforces TDD for documentation)
2. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter
3. Write failing test in `tests/claude-code/test-<skill-name>.sh`
4. Write minimal skill content to pass test
5. Add flowchart only if decision flow is non-obvious
6. Run tests: `cd tests/claude-code && ./run-skill-tests.sh --test test-<skill-name>.sh`

**Modify an existing skill**:
1. Use the `writing-skills` skill
2. Write failing test demonstrating the issue
3. Update skill to fix issue
4. Re-run tests to verify

**Debug a skill not loading**:
1. Check description starts with "Use when..." (CSO requirement)
2. Verify YAML frontmatter is valid
3. Check skill file is named `SKILL.md` exactly
4. Look for skill invocation in session transcript: `~/.claude/projects/.../session.jsonl`

**Update plugin version**:
1. Edit `.claude-plugin/plugin.json` version field
2. Add entry to `RELEASE-NOTES.md`
3. Commit changes
4. Create git tag: `git tag v4.0.x`
5. Push tag: `git push origin v4.0.x`

### File Locations

- **Skills**: `skills/<skill-name>/SKILL.md` + optional supporting files
- **Commands**: `commands/<command-name>.md` (thin wrappers to skills)
- **Agents**: `agents/<agent-name>.md` (used by skills for specialized workflows)
- **Hooks**: `hooks/session-start.sh` (injects using-superpowers at startup)
- **Tests**: `tests/claude-code/test-*.sh`
- **Session transcripts**: `~/.claude/projects/-<encoded-path>/<session-id>.jsonl`
- **Plugin config**: `.claude-plugin/plugin.json`
- **Core utilities**: `lib/skills-core.js`