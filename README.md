# Superpowers

Give Claude Code superpowers with a comprehensive skills library of proven techniques, patterns, and tools.

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
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

That's it! On first session, the plugin automatically:

- Sets up `~/.config/superpowers/` as your personal skills repository
- Initializes git repo for version control
- Makes core skills searchable alongside your personal skills
- Adds `/brainstorm`, `/write-plan`, and `/execute-plan` commands
- Offers to create public GitHub repo for sharing your skills

### Verify Installation

```bash
# Check that commands appear
/help

# Should see:
# /brainstorm - Interactive design refinement
# /write-plan - Create implementation plan
# /execute-plan - Execute plan in batches
```

## Quick Start

### Your Personal Skills

Write your own skills to `~/.config/superpowers/skills/`:

- All personal skills automatically discovered by search tools
- Personal skills shadow core skills when names match
- Version controlled with git
- Optional: Share on GitHub and contribute back to core

See `skills/meta/writing-skills` for how to create new skills.
See `skills/meta/sharing-skills` for how to contribute to core.

### Finding Skills

Find both personal and core skills before starting any task:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/find-skills              # All skills with descriptions
${CLAUDE_PLUGIN_ROOT}/scripts/find-skills test         # Filter by pattern
${CLAUDE_PLUGIN_ROOT}/scripts/find-skills 'TDD|debug'  # Regex pattern
```

### Using Slash Commands

**Brainstorm a design:**

```bash
/brainstorm
```

**Create an implementation plan:**

```bash
/write-plan
```

**Execute the plan:**

```bash
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

- setting-up-personal-superpowers - Personal skills repository setup
- writing-skills - TDD for documentation, create new skills
- sharing-skills - Contribute skills back to core
- testing-skills-with-subagents - Validate skill quality
- gardening-skills-wiki - Maintain and improve skills

### Commands

- **brainstorm.md** - Interactive design refinement using Socratic method
- **write-plan.md** - Create detailed implementation plans
- **execute-plan.md** - Execute plans in batches with review checkpoints

### Tools

**In `scripts/` directory:**

- **find-skills** - Unified skill discovery with descriptions (replaces list-skills + skills-search)
- **skill-run** - Generic runner for any skill script (searches personal then core)

**Skill-specific tools:**

- **search-conversations** - Semantic search of past Claude sessions (in remembering-conversations skill)

**Using scripts:**

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/find-skills                 # Show all skills
${CLAUDE_PLUGIN_ROOT}/scripts/find-skills pattern         # Search skills
${CLAUDE_PLUGIN_ROOT}/scripts/skill-run <path> [args]     # Run any skill script
```

## How It Works

1. **SessionStart Hook** - Auto-setup personal skills repo, inject core skills context
2. **Two-Tier Skills** - Personal skills (`~/.config/superpowers/skills/`) + Core skills (plugin)
3. **Skills Discovery** - `find-skills` searches both locations with descriptions
4. **Shadowing** - Personal skills override core skills when paths match
5. **Mandatory Workflow** - Skills become required when they exist for your task
6. **Gap Tracking** - Failed searches logged to `~/.config/superpowers/search-log.jsonl`

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Domain over implementation** - Work at problem level, not solution level

## Personal Superpowers Directory

The plugin auto-creates your personal superpowers directory on first session.

**Default location:** `~/.config/superpowers/`

**Customize via environment variables:**

**Set exact location:**

```bash
export PERSONAL_SUPERPOWERS_DIR="$HOME/my-superpowers"
```

*Note: `XDG_CONFIG_HOME` is also honored as a fallback if `PERSONAL_SUPERPOWERS_DIR` is unset.*

**Structure:**

```text
~/.config/superpowers/        # (or your custom location)
├── .git/                     # Git repository
├── .gitignore                # Ignores logs and indexes
├── README.md                 # About your personal superpowers
├── skills/                   # Your personal skills
│   └── your-skill/
│       └── SKILL.md
├── search-log.jsonl          # Failed skill searches (not tracked)
└── conversation-index/       # Indexed conversations (not tracked)
```

**Why git?** Track your skills evolution, share with others, contribute back to core.

## Contributing

**Write personal skills:**

1. Create in `~/.config/superpowers/skills/your-skill/`
2. Follow TDD process in `skills/meta/writing-skills`
3. Commit to your personal repo

**Share with everyone:**

1. Follow workflow in `skills/meta/sharing-skills`
2. Fork → Branch → Copy → PR to core
3. Keep personal version or delete after merge

**Missing a skill?** Edit `skills/REQUESTS.md` or open an issue

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: <https://github.com/obra/superpowers/issues>
- **Marketplace**: <https://github.com/obra/superpowers-marketplace>
