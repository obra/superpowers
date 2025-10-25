# Superpowers

Give Claude Code superpowers with a comprehensive skills library of proven techniques, patterns, and workflows.

## What You Get

**27 Production-Ready Skills:**
- **Testing Skills** (4) - TDD, async testing, anti-patterns
- **Debugging Skills** (4) - Systematic debugging, root cause tracing, verification
- **Collaboration Skills** (9) - Brainstorming, planning, code review, parallel agents
- **Technical & Productivity Skills** (7) - PDF processing, content writing, brand guidelines, email automation
- **Meta Skills** (3) - Creating, testing, and sharing skills

**Plus:**
- **Cross-Platform Support** - Claude Code, Claude Desktop, and Claude API/SDK
- **Slash Commands** - `/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`
- **ZIP Distribution** - Import skills into Claude Desktop
- **Automatic Integration** - Skills activate automatically when relevant
- **Consistent Workflows** - Systematic approaches to common engineering tasks

## Learn More

Read the introduction: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Installation

### For Claude Code (Recommended)

**Via Plugin Marketplace:**
```bash
# In Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**Verify Installation:**
```bash
# Check that commands appear
/help

# Should see:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

### For Claude Desktop

1. **Download a skill ZIP:**
   - Browse to `skills/{skill-name}/{skill-name}-skill.zip`
   - All 27 skills include ZIP files

2. **Import into Claude Desktop:**
   - Open Claude Desktop
   - Go to **Profile → Skills → Import Skill**
   - Select the ZIP file

**Example:**
```bash
# Import PDF processor skill
skills/pdf-processor/pdf-processor-skill.zip
```

### For Claude API/SDK

Load skills programmatically in your code:

```python
from anthropic import Anthropic

# Load a skill
with open('skills/pdf-processor/SKILL.md', 'r') as f:
    skill_content = f.read()

# Use with Claude API
client = Anthropic(api_key="your-api-key")
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    system=f"{skill_content}\n\nUse this skill to complete the task.",
    messages=[{"role": "user", "content": "Extract text from document.pdf"}]
)
```

See [USAGE_GUIDE.md](USAGE_GUIDE.md) for detailed platform-specific instructions.

## Quick Start

### Using Slash Commands

**Brainstorm a design:**
```
/superpowers:brainstorm
```

**Create an implementation plan:**
```
/superpowers:write-plan
```

**Execute the plan:**
```
/superpowers:execute-plan
```

### Automatic Skill Activation

Skills activate automatically when relevant. For example:
- `test-driven-development` activates when implementing features
- `systematic-debugging` activates when debugging issues
- `verification-before-completion` activates before claiming work is done

## What's Inside

### Skills Library (27 Total)

**Testing** (4 skills)
- **test-driven-development** - RED-GREEN-REFACTOR cycle
- **condition-based-waiting** - Async test patterns
- **testing-anti-patterns** - Common pitfalls to avoid
- **testing-skills-with-subagents** - Validate skill quality

**Debugging** (4 skills)
- **systematic-debugging** - 4-phase root cause process
- **root-cause-tracing** - Find the real problem
- **verification-before-completion** - Ensure it's actually fixed
- **defense-in-depth** - Multiple validation layers

**Collaboration** (9 skills)
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with quality gates

**Technical & Productivity** (7 skills)
- **pdf-processor** - Comprehensive PDF manipulation toolkit
- **content-research-writer** - Research-enhanced writing with citations
- **brand-guidelines** - Corporate branding and styling automation
- **gmail-intelligence** - Email analysis and automation
- **invoice-organizer** - Financial document processing
- **notion-template-processor** - Database automation
- **youtube-transcript-downloader** - Video content extraction

**Meta** (3 skills)
- **writing-skills** - Create new skills following best practices
- **sharing-skills** - Contribute skills back via branch and PR
- **using-superpowers** - Introduction to the skills system

### Commands

All commands are thin wrappers that activate the corresponding skill:

- **brainstorm.md** - Activates the `brainstorming` skill
- **write-plan.md** - Activates the `writing-plans` skill
- **execute-plan.md** - Activates the `executing-plans` skill

## How It Works

1. **SessionStart Hook** - Loads the `using-superpowers` skill at session start
2. **Skills System** - Uses Claude Code's first-party skills system
3. **Automatic Discovery** - Claude finds and uses relevant skills for your task
4. **Mandatory Workflows** - When a skill exists for your task, using it becomes required

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Domain over implementation** - Work at problem level, not solution level

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

**Quick Process:**

1. Fork the repository
2. Create a branch: `git checkout -b skill/your-skill-name`
3. Use the template: `cp templates/SKILL.md skills/your-skill-name/SKILL.md`
4. Follow the `writing-skills` skill for creating new skills
5. Use the `testing-skills-with-subagents` skill to validate quality
6. Create ZIP file: `cd skills/your-skill-name && zip -r your-skill-name-skill.zip SKILL.md`
7. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete skill authoring guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update superpowers
```

## License

MIT License - see LICENSE file for details

## Documentation

- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Platform-specific deployment instructions
- **[IMPORT_GUIDE.md](IMPORT_GUIDE.md)** - Importing skills from other repositories
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Complete contribution guidelines
- **[templates/](templates/)** - Skill creation templates
- **[examples/](examples/)** - Example implementations

## Support

- **Issues**: https://github.com/obra/superpowers/issues
- **Marketplace**: https://github.com/obra/superpowers-marketplace

## Acknowledgments

- **Anthropic** - For Claude Code and the skills system
- **Claude AI Community** - For feedback and contributions
- **All Contributors** - Thank you for making this collection better!
