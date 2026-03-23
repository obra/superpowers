# Superpowered Agents

Autonomous agent workflows for software development teams. Built on [Superpowers](https://github.com/obra/superpowers) with GitHub Project automation for bug fixes and feature development.

## What You Get

### 1. Superpowers Foundation

Fork of [obra/superpowers](https://github.com/obra/superpowers) - a complete agent workflow system with composable skills:
- **brainstorming** - Design refinement before coding
- **writing-plans** - Implementation plans for autonomous execution
- **subagent-driven-development** - Multi-agent parallel development
- **test-driven-development** - RED-GREEN-REFACTOR enforcement
- **systematic-debugging** - Root cause analysis process

All the battle-tested workflows from Superpowers, plus team collaboration features.

### 2. Bug & Feature Resolution Workflows

Structured processes that improve first-time resolution rates:

**Bug Flow (5 stages):**
```
Triage → Fix → Test → UserTest → Done
```
- Parallel hypothesis testing for root cause
- Evidence-driven testing with RED-GREEN discipline
- Automated CI gates
- Optional UAT validation

**Feature Flow (7 stages):**
```
Brainstorm → Design Review → Plan → Implement → Test → Review → Done
```
- Socratic design refinement
- Spec validation before implementation
- Subagent-driven parallel development
- Two-stage review (spec compliance, then code quality)

### 3. GitHub Projects Integration

Kanban boards that map workflow stages to GitHub Projects:

- **Organization-level projects** - Manage issues across repos
- **Status field automation** - Track progress through stages
- **Board views** - Visualize work in progress
- **Marker-based idempotency** - Resume from interruptions

Set up in minutes with `/setup` command.

### 4. Loop Agents

Autonomous agents that process issues through workflow stages:

```bash
/loop bug        # Process bug issues
/loop feature    # Process feature issues
/loop all        # Process both flows
```

**How it works:**
- Reads issues from GitHub Projects
- Checks Status field to determine current stage
- Dispatches appropriate skill for that stage
- Posts progress markers to issue comments
- Advances to next stage on completion
- Never blocks - communicates async via GitHub

**Example:**
```
Issue #123 in "Triage" stage
→ Loop dispatches bug-triage skill
→ Investigates root cause with parallel hypotheses
→ Posts [TRIAGE_READY] marker
→ Moves to "Fix" stage

Issue #123 in "Fix" stage
→ Loop dispatches bug-fix skill
→ Implements the fix
→ Posts [FIX_COMPLETE] marker
→ Moves to "Test" stage

...continues through all stages automatically
```

## Quick Start

### 1. Install Plugin

Choose your platform:

**Claude Code Official Marketplace:**
```bash
/plugin install superpowers@claude-plugins-official
```

**Cursor:**
```bash
/add-plugin superpowers
```

See [Installation](#installation) for all platforms.

### 2. Set Up GitHub Projects

From your repository:

```bash
/setup
```

Creates projects, configures workflows, generates configuration files.

See [Integration Guide](docs/INTEGRATION_GUIDE.md) for detailed walkthrough.

### 3. Create Issues

```bash
gh issue create --title "Login timeout" --body "Users timing out after 5s"
gh project item-add 1 --url <issue-url>
```

### 4. Run Loop

```bash
/loop bug
```

Agents process issues automatically through all stages.

## Credits

This project is built on [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) and the [Prime Radiant](https://primeradiant.com) team.

If Superpowers has helped you, consider [sponsoring Jesse's opensource work](https://github.com/sponsors/obra).


## Documentation

### Getting Started
- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - Add to existing repo, configure workflows
- **[GitHub Project Setup](docs/GITHUB_PROJECT_SETUP.md)** - Manual project configuration steps
- **[Branch Strategy](docs/BRANCH_STRATEGY.md)** - Promotion flow (feature → dev → staging → main)

### Commands
- **[/setup](commands/setup.md)** - Bootstrap GitHub Projects integration
- **[/loop](commands/loop.md)** - Process issues through workflow stages

### Workflows
- **[Bug Triage](skills/bug-triage/SKILL.md)** - Root cause investigation with parallel hypotheses
- **[Bug Fix](skills/bug-fix/SKILL.md)** - Evidence-driven fix implementation
- **[Testing Gates](skills/testing-gates/SKILL.md)** - Automated CI validation
- **[Committing](skills/committing/SKILL.md)** - Git workflow and PR creation
- **[Loop Orchestrator](skills/loop-orchestrator/SKILL.md)** - Issue processing automation

### Maintenance
- **[Updating from Super Agents](docs/UPDATING_FROM_SUPER_AGENTS.md)** - Pull upstream changes
- **[Contributing Lessons Learned](docs/CONTRIBUTING_LESSONS_LEARNED.md)** - When and how to contribute back

## Installation

Choose your platform:

**Claude Code:**
```bash
/plugin install superpowers@claude-plugins-official
```

**Cursor:**
```bash
/add-plugin superpowers
```

**Codex:**
```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

**OpenCode:**
```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

**Gemini:**
```bash
gemini extensions install https://github.com/obra/superpowers
```

See [Installation](#installation-details) below for detailed instructions.

## Skills Library

All skills from [Superpowers](https://github.com/obra/superpowers), plus GitHub Project workflow automation:

**GitHub Project Workflows:**
- **bug-triage** - Parallel hypothesis testing for root cause
- **bug-fix** - Evidence-driven fix implementation
- **testing-gates** - Automated CI validation (linting, type checking, tests)
- **user-acceptance-testing** - UAT coordination
- **loop-orchestrator** - Automated issue processing
- **committing** - Git workflow and PR creation

**Feature Development (from Superpowers):**
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **subagent-driven-development** - Multi-agent parallel development
- **requesting-code-review** - Pre-review checklist
- **finishing-a-development-branch** - Merge/PR workflow

**Testing & Debugging (from Superpowers):**
- **test-driven-development** - RED-GREEN-REFACTOR enforcement
- **systematic-debugging** - Root cause analysis
- **verification-before-completion** - Ensure fixes work

**Supporting Skills (from Superpowers):**
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **using-git-worktrees** - Isolated development branches
- **evidence-driven-testing** - Scratch/promoted/permanent test commitment
- **handler-authority** - Async authority model for loop mode

Full skill list: [skills/](skills/)

## Philosophy

- **Evidence over claims** - Verify before declaring success
- **Systematic over ad-hoc** - Process over guessing
- **Test-Driven Development** - Write tests first, always
- **Structured workflows** - Clear stages, clear progression
- **Async coordination** - Work through GitHub, not blocking terminal

Read more: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Installation Details

### Claude Code Official Marketplace

Install from the official marketplace:

```bash
/plugin install superpowers@claude-plugins-official
```

### Claude Code (via Superpowers Marketplace)

Register the marketplace first:

```bash
/plugin marketplace add obra/superpowers-marketplace
```

Then install:

```bash
/plugin install superpowers@superpowers-marketplace
```

### Cursor

Install from marketplace:

```bash
/add-plugin superpowers
```

Or search "superpowers" in plugin marketplace UI.

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

See [docs/README.codex.md](docs/README.codex.md) for details.

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

See [docs/README.opencode.md](docs/README.opencode.md) for details.

### Gemini

```bash
gemini extensions install https://github.com/obra/superpowers
```

Update with:

```bash
gemini extensions update superpowers
```

### Verify Installation

After installation, verify skills are active:

```
/brainstorm
```

Agent should invoke the brainstorming skill.

## Contributing

Contributions welcome! See [CONTRIBUTING_LESSONS_LEARNED.md](docs/CONTRIBUTING_LESSONS_LEARNED.md) for guidelines on:
- What to contribute vs keep local
- How to extract generic improvements
- PR submission process

**Quick contributions:**
- Bug fixes in skills or commands
- Documentation improvements
- New generic skills

**Keep local:**
- Project-specific configuration
- Company workflows
- Proprietary techniques

## Community & Support

- **Discord**: [Join us](https://discord.gg/Jd8Vphy9jq)
- **Issues**: [Report bugs](https://github.com/superpowers-agent/super-agents/issues)
- **Superpowers**: [Original project](https://github.com/obra/superpowers)

Built on [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) and [Prime Radiant](https://primeradiant.com).

## License

MIT License - see LICENSE file for details
