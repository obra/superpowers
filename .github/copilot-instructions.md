# Superpowers Skills Library

This repository contains the **Superpowers** skills library—a comprehensive collection of Agent Skills for software development workflows, built on proven engineering practices.

## What This Repository Provides

Superpowers is a skills library that teaches AI coding agents:
- **Test-Driven Development** (TDD) with RED-GREEN-REFACTOR workflows
- **Systematic Debugging** using 4-phase root cause analysis
- **Collaborative Planning** with brainstorming and implementation plans
- **Code Review** processes and quality standards
- **Git Workflows** including worktree management
- **Subagent Coordination** for parallel development tasks

## How to Use These Skills

Skills are located in the `skills/` directory. Each skill is a self-contained folder with:
- `SKILL.md` - Main instructions with YAML frontmatter
- Supporting resources (scripts, examples, references) as needed

### Automatic Loading

GitHub Copilot automatically discovers and loads skills based on:
1. The skill's `description` field in its SKILL.md frontmatter
2. The context of your current task or query

Example: When you ask "help me debug this race condition", Copilot automatically loads the `systematic-debugging` skill.

### Explicit Invocation

You can also invoke skills directly:
- `/brainstorming` - Start design exploration
- `/test-driven-development` - Apply TDD workflow
- `/systematic-debugging` - Use structured debugging
- `/writing-plans` - Create implementation plans
- `/requesting-code-review` - Pre-review checklist

Type `/skills` in Copilot Chat to see all available skills.

## Skills Philosophy

All skills in this library follow these principles:

1. **Test-Driven Development** - Write tests first, always
2. **Systematic over ad-hoc** - Process over guessing
3. **Complexity reduction** - Simplicity as primary goal
4. **Evidence over claims** - Verify before declaring success

## Key Skills

### Testing
- **test-driven-development** - RED-GREEN-REFACTOR cycle with anti-patterns reference

### Debugging
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting)
- **verification-before-completion** - Ensure fixes are actually fixed

### Collaboration
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

### Meta
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Installation

This repository is meant to be consumed by AI coding agents. See installation instructions:
- [GitHub Copilot](.copilot/INSTALL.md)
- [Claude Code](https://github.com/obra/superpowers#claude-code-via-plugin-marketplace)
- [Cursor](https://github.com/obra/superpowers#cursor-via-plugin-marketplace)
- [Codex](.codex/INSTALL.md)
- [OpenCode](.opencode/INSTALL.md)

## Learn More

- **Main Documentation**: [README.md](../README.md)
- **Copilot Integration**: [docs/README.copilot.md](../docs/README.copilot.md)
- **Blog Post**: https://blog.fsck.com/2025/10/09/superpowers/
- **Skills Standard**: https://agentskills.io

## Contributing

To add new skills or improve existing ones:
1. Follow the `writing-skills` skill guidelines
2. Test with multiple AI agents
3. Submit a pull request

See [skills/writing-skills/SKILL.md](../skills/writing-skills/SKILL.md) for the complete guide.
