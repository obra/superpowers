# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Superpowers is a complete software development workflow for coding agents, built on a composable "skills" system. It's distributed as a Claude Code plugin that provides structured workflows for brainstorming, planning, implementation, testing, and code review.

### Core Architecture

**Skills System**
- Skills are markdown documents (SKILL.md) with YAML frontmatter defining name and description
- Each skill lives in `skills/<skill-name>/SKILL.md`
- Skills can reference supporting files in their directory
- Skills are loaded via the Skill tool in Claude Code
- The `lib/skills-core.js` module provides skill discovery and resolution logic
- Skills support shadowing: personal skills override superpowers skills

**Plugin Structure**
- `.claude-plugin/plugin.json` - Plugin metadata
- `.claude-plugin/marketplace.json` - Development marketplace configuration
- `commands/` - Slash command definitions that invoke skills
- `hooks/` - Session hooks that inject skill content
- `agents/` - Agent prompt templates for subagent workflows
- `skills/` - Core skills library
- `lib/` - Shared JavaScript utilities
- `tests/` - Automated test suite

**Key Skills**
- `brainstorming` - Socratic design refinement before implementation
- `writing-plans` - Creates bite-sized implementation plans (2-5 min tasks)
- `executing-plans` - Batch execution with checkpoints
- `subagent-driven-development` - Dispatches subagents per task with two-stage review
- `test-driven-development` - RED-GREEN-REFACTOR cycle enforcement
- `systematic-debugging` - 4-phase root cause analysis
- `using-git-worktrees` - Isolated workspace creation
- `finishing-a-development-branch` - Merge/PR decision workflow

### Workflow Architecture

Superpowers enforces a mandatory workflow:
1. **Brainstorming** → Design document in `docs/plans/YYYY-MM-DD-<topic>-design.md`
2. **Git Worktree** → Isolated workspace on new branch
3. **Writing Plans** → Implementation plan in `docs/plans/YYYY-MM-DD-<feature>.md`
4. **Subagent-Driven Development** → Fresh subagent per task with spec compliance review, then code quality review
5. **TDD** → RED-GREEN-REFACTOR: failing test first, minimal code, frequent commits
6. **Code Review** → Review against plan by severity (critical issues block)
7. **Finishing** → Verify tests, present merge/PR/keep/discard options

## Development Commands

### Testing

Run fast unit tests (verifies skill loading and requirements):
```bash
cd tests/claude-code
./run-skill-tests.sh
```

Run integration tests (full workflow execution, 10-30 minutes):
```bash
cd tests/claude-code
./run-skill-tests.sh --integration
```

Run specific test with verbose output:
```bash
cd tests/claude-code
./run-skill-tests.sh --verbose --test test-subagent-driven-development.sh
```

Set custom timeout (useful for CI):
```bash
cd tests/claude-code
./run-skill-tests.sh --timeout 900
```

**Requirements for Testing:**
- Must run from the superpowers plugin directory (not temp directories)
- Claude Code CLI must be installed (`claude --version`)
- Local dev marketplace enabled: `"superpowers@superpowers-dev": true` in `~/.claude/settings.json`

### Token Analysis

Analyze token usage from test transcripts:
```bash
cd tests/claude-code
./analyze-token-usage.py path/to/transcript.jsonl
```

## Skill Development

### Creating New Skills

Follow the TDD approach defined in `skills/writing-skills/SKILL.md`:

1. **RED**: Run pressure scenario without skill, document agent failures
2. **GREEN**: Write skill addressing specific violations, verify compliance
3. **REFACTOR**: Close loopholes while maintaining compliance

Skills live in personal directories (`~/.claude/skills` for Claude Code).

### Skill File Structure

```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed for complex techniques
```

### Skill Frontmatter Format

```markdown
---
name: skill-name
description: Use when [condition] - [what it does]
---

# Skill Title

[Skill content...]
```

### Testing Skills

Integration tests verify skills work end-to-end by:
- Running Claude Code in headless mode with the skill
- Parsing session transcripts (`.jsonl` files)
- Verifying skill invocation, subagent dispatch, and implementation correctness
- Checking git commits show proper workflow

See `docs/testing.md` for detailed testing methodology.

## Plugin System

### Commands

Commands in `commands/` directory are slash commands available to users:
- `/brainstorm` → Invokes `superpowers:brainstorming` skill
- `/write-plan` → Invokes `superpowers:writing-plans` skill
- `/execute-plan` → Invokes `superpowers:executing-plans` skill

Command files use YAML frontmatter with `disable-model-invocation: true` to mark them as user-only.

### Hooks

`hooks/session-start.sh` runs on SessionStart events (startup, resume, clear, compact).

It injects the `using-superpowers` skill content into every session, ensuring Claude knows:
- How to find and use skills
- The requirement to check for skills before any response
- Skill priority (process skills before implementation skills)

### Agents

`agents/` contains prompt templates for subagent workflows:
- `code-reviewer.md` - Code review agent for requesting-code-review skill
- Subagent prompts are in skill directories (e.g., `skills/subagent-driven-development/`)

## Critical Implementation Patterns

### Plan Documents

Plans MUST include this header:
```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence]

**Architecture:** [2-3 sentences]

**Tech Stack:** [Key technologies]

---
```

### Task Granularity

Each task is a single action (2-5 minutes):
- "Write the failing test" - one task
- "Run it to make sure it fails" - one task
- "Implement minimal code" - one task
- "Run tests and verify they pass" - one task
- "Commit" - one task

### Subagent Review Order

Subagent-driven-development enforces two-stage review:
1. **Spec compliance review** - Does it meet requirements?
2. **Code quality review** - Is the code well-written?

Spec compliance comes FIRST. Never skip to code quality.

## Philosophy and Principles

- **Test-Driven Development**: Write tests first, always
- **Systematic over ad-hoc**: Process over guessing
- **Complexity reduction**: Simplicity as primary goal
- **Evidence over claims**: Verify before declaring success
- **YAGNI**: You Aren't Gonna Need It - minimal implementation only
- **DRY**: Don't Repeat Yourself
- **Frequent commits**: Commit after each passing test

## Repository Organization

**Skills** (`skills/`)
- Each directory is a self-contained skill with SKILL.md
- Supporting files (prompts, references) live alongside SKILL.md
- Skills can be nested but typically aren't

**Documentation** (`docs/`)
- `docs/plans/` - Design documents and implementation plans
- `docs/testing.md` - Testing methodology
- `docs/README.codex.md` - Codex installation guide
- `docs/README.opencode.md` - OpenCode installation guide
- `docs/windows/` - Windows-specific documentation

**Tests** (`tests/`)
- `tests/claude-code/` - Claude Code skill tests
- `tests/skill-triggering/` - Skill triggering behavior tests
- `tests/subagent-driven-dev/` - Subagent workflow tests

**Libraries** (`lib/`)
- `lib/skills-core.js` - Core skill system utilities (frontmatter extraction, skill resolution, path finding)

## Important Notes

- Skills are invoked via the Skill tool, NEVER by reading skill files directly
- The using-superpowers skill is automatically injected into every session
- Personal skills shadow superpowers skills (name conflicts resolved by personal taking precedence)
- Integration tests must run from the plugin directory, not temp directories
- Plan documents should be saved to `docs/plans/YYYY-MM-DD-<feature>.md`
- Design documents should be saved to `docs/plans/YYYY-MM-DD-<topic>-design.md`
