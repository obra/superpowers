# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Personal Rule
Always respond in *Simplified Chinese/中文*

## Project Overview

**Horspower** is a Chinese-enhanced fork of [obra/superpowers](https://github.com/obra/superpowers) - a skills library for Claude Code that provides composable workflows for software development. It's a plugin that injects skills at session start and provides slash commands for common workflows.

**Key concept:** Skills are Markdown files with YAML frontmatter that Claude invokes via the `Skill` tool. The `using-horspowers` skill (originally called `using-superpowers` in the upstream project) is injected automatically at session start via a hook.

## Running Tests

```bash
# Run fast tests (default)
./tests/claude-code/run-skill-tests.sh

# Run integration tests (slow, 10-30 minutes)
./tests/claude-code/run-skill-tests.sh --integration

# Run specific test with verbose output
./tests/claude-code/run-skill-tests.sh --test test-subagent-driven-development.sh --verbose
```

**Important:** Tests must run FROM the horspowers directory, not from temp directories. Integration tests create real projects and execute full workflows.

## Architecture

### Skill Structure

Each skill lives in `skills/<skill-name>/SKILL.md`:

```yaml
---
name: skill-name
description: Use when [condition] - [what it does]
---

# Skill Title

## Overview
...

## The Process
...
```

- **Frontmatter:** `name` (lowercase kebab-case), `description` (trigger-only, no process details)
- **Description trap:** Never include workflow steps in description - Claude will follow description instead of reading the skill
- **Cross-references:** Use `horspowers:skill-name` format for internal references

### Slash Commands

Commands in `commands/` are user-only wrappers around skills:

```yaml
---
description: Brief description
disable-model-invocation: true
---

Invoke the horspowers:skill-name skill and follow it exactly as presented to you
```

The `disable-model-invocation: true` prevents Claude from invoking commands - only users can invoke slash commands.

### Session Start Hook

`hooks/session-start.sh` injects `using-horspowers` skill content into every session via `additionalContext`. The hook uses a polyglot wrapper (`run-hook.cmd`) for cross-platform support.

### Skill Resolution

- Personal skills (`~/.claude/skills/`) override horspowers skills
- Use `horspowers:` prefix to force using a horspowers skill
- Skills are discovered by finding `SKILL.md` files recursively

## The Horspower Workflow

1. **brainstorming** - Refine ideas through questions, present design in sections
2. **using-git-worktrees** - Create isolated workspace on new branch
3. **writing-plans** - Break work into bite-sized tasks (2-5 min each)
4. **subagent-driven-development** or **executing-plans** - Execute with reviews
5. **test-driven-development** - RED-GREEN-REFACTOR cycle
6. **requesting-code-review** - Pre-review checklist
7. **finishing-a-development-branch** - Merge/PR decision workflow

## Key Skills

**Process skills (run first):**
- `brainstorming` - Design refinement before implementation
- `systematic-debugging` - 4-phase root cause process

**Implementation skills:**
- `test-driven-development` - TDD workflow with anti-patterns reference
- `writing-plans` - Detailed implementation plans
- `executing-plans` - Batch execution with checkpoints

**Collaboration skills:**
- `subagent-driven-development` - Two-stage review: spec compliance THEN code quality
- `using-git-worktrees` - Parallel development branches
- `finishing-a-development-branch` - Branch completion options
- `receiving-code-review` - Responding to feedback

**Meta skills:**
- `using-horspowers` - Introduction to skills system
- `writing-skills` - Creating and testing new skills

## Testing Methodology

Skills are tested using headless Claude Code sessions:

```bash
claude -p "prompt" --allowed-tools=all --add-dir "$TEST_DIR" --permission-mode bypassPermissions
```

Session transcripts (`.jsonl` files) are parsed to verify:
- Skill tool was invoked
- Subagents were dispatched
- Files were created
- Tests pass
- Git commits show proper workflow

See `docs/testing.md` for detailed testing guidance.

## Skill Authoring

When creating new skills:

1. Follow patterns in `writing-skills/SKILL.md`
2. Use imperative descriptions: "You MUST use this when..."
3. Keep descriptions trigger-only - don't summarize the process
4. Use DOT flowcharts for non-obvious decision points
5. Test using the methodology in `writing-skills/testing-skills-with-subagents.md`

**Token efficiency:** Aim for under 500 lines per skill. Use progressive disclosure - hide details behind "See X" references.

## Platform Support

- **Claude Code:** Native plugin via marketplace (this repo)
- **Codex:** See `docs/README.codex.md` - uses `lib/skills-core.js`
- **OpenCode:** See `docs/README.opencode.md` - shares `lib/skills-core.js`

## Common Pitfalls

**The Description Trap:** If description summarizes the workflow, Claude follows description instead of reading the skill. Keep descriptions trigger-only: "Use when X" not "Use when X to do Y via Z".

**Rationalization:** Agents think "I know what this means" and skip skill invocation. The `using-horspowers` skill lists 12+ rationalization patterns to counter this.

**Test before implementing:** The `test-driven-development` skill deletes any code written before tests. Always invoke TDD before implementation tasks.

**Merge without testing:** The `finishing-a-development-branch` skill verifies tests pass BEFORE presenting merge/PR options.

## Files of Interest

- `plugin.json` - Plugin metadata
- `hooks/hooks.json` - Hook registration
- `lib/skills-core.js` - Shared utilities for Codex/OpenCode
- `agents/code-reviewer.md` - Code reviewer agent definition
- `RELEASE-NOTES.md` - Version history with detailed changelogs
