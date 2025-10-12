# Superpowers

Give Claude Code superpowers with a comprehensive skills library of proven techniques, patterns, and tools.

## Architecture

The superpowers plugin is a minimal shim that:
- Clones/updates the [superpowers-skills](https://github.com/joegoldin/superpowers-skills) repository to `~/.config/superpowers/skills/`
- Registers hooks that load skills from the local repository
- Offers users the option to fork the skills repo for contributions

All skills, scripts, and documentation live in the separate [superpowers-skills](https://github.com/joegoldin/superpowers-skills) repository. Edit skills locally, commit changes, and contribute back via pull requests.

**Skills Repository:** https://github.com/joegoldin/superpowers-skills

## What You Get

- **Testing Skills** - TDD, async testing, anti-patterns
- **Debugging Skills** - Systematic debugging, root cause tracing, verification
- **Collaboration Skills** - Brainstorming, planning, code review, parallel agents
- **Meta Skills** - Creating, testing, and contributing skills

Plus:
- **Slash Commands** - `/brainstorm`, `/write-plan`, `/execute-plan`
- **Skills Search** - Grep-powered discovery of relevant skills
- **Gap Tracking** - Failed searches logged for skill creation

## Learn More

Read the introduction: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Installation

### Via Plugin Marketplace (Recommended)

```bash
# In Claude Code
/plugin marketplace add joegoldin/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

The plugin automatically handles skills repository setup on first run.

### Verify Installation

```bash
# Check that commands appear
/help

# Should see:
# /brainstorm - Interactive design refinement
# /write-plan - Create implementation plan
# /execute-plan - Execute plan in batches
```

## Updating Skills

The plugin fetches and fast-forwards your local skills repository on each session start. If your local branch has diverged, Claude notifies you to use the pulling-updates-from-skills-repository skill.

## Contributing Skills

If you forked the skills repository during setup, you can contribute improvements:

1. Edit skills in `~/.config/superpowers/skills/`
2. Commit your changes
3. Push to your fork
4. Open a PR to `joegoldin/superpowers-skills`

## Quick Start

### Finding Skills

Find skills before starting any task:

```bash
${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills              # All skills with descriptions
${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills test         # Filter by pattern
${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills 'TDD|debug'  # Regex pattern
```

### Using Slash Commands

**Brainstorm a design:**
```
/brainstorm
```

**Create an implementation plan:**
```
/write-plan
```

**Execute the plan:**
```
/execute-plan
```

## What's Inside

### Skills Library

**Testing** (`skills/testing/`)
- test-driven-development - RED-GREEN-REFACTOR cycle
- condition-based-waiting - Async test patterns
- testing-anti-patterns - Common pitfalls to avoid

**Debugging** (`skills/debugging/`)
- systematic-debugging - 4-phase root cause process
- root-cause-tracing - Find the real problem
- verification-before-completion - Ensure it's actually fixed
- defense-in-depth - Multiple validation layers

**Collaboration** (`skills/collaboration/`)
- brainstorming - Socratic design refinement
- writing-plans - Detailed implementation plans
- executing-plans - Batch execution with checkpoints
- dispatching-parallel-agents - Concurrent subagent workflows
- remembering-conversations - Search past work
- using-git-worktrees - Parallel development branches
- requesting-code-review - Pre-review checklist
- receiving-code-review - Responding to feedback

**Meta** (`skills/meta/`)
- writing-skills - TDD for documentation, create new skills
- sharing-skills - Contribute skills back via branch and PR
- testing-skills-with-subagents - Validate skill quality
- pulling-updates-from-skills-repository - Sync with upstream
- gardening-skills-wiki - Maintain and improve skills

### Commands

- **brainstorm.md** - Interactive design refinement using Socratic method
- **write-plan.md** - Create detailed implementation plans
- **execute-plan.md** - Execute plans in batches with review checkpoints

### Tools

- **find-skills** - Unified skill discovery with descriptions
- **skill-run** - Generic runner for any skill script
- **search-conversations** - Semantic search of past Claude sessions (in remembering-conversations skill)

**Using tools:**
```bash
${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills              # Show all skills
${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills pattern      # Search skills
${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/skill-run <path> [args]  # Run any skill script
```

## How It Works

1. **SessionStart Hook** - Clone/update skills repo, inject skills context
2. **Skills Discovery** - `find-skills` shows all available skills with descriptions
3. **Mandatory Workflow** - Skills become required when they exist for your task
4. **Gap Tracking** - Failed searches logged for skill development

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Domain over implementation** - Work at problem level, not solution level

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/joegoldin/superpowers/issues
- **Marketplace**: https://github.com/joegoldin/superpowers-marketplace
