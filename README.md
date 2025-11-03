# Superpowers

A comprehensive skills library of proven techniques, patterns, and workflows for AI coding assistants.

## What You Get

- **Testing Skills** - TDD, async testing, anti-patterns
- **Debugging Skills** - Systematic debugging, root cause tracing, verification
- **Collaboration Skills** - Brainstorming, planning, code review, parallel agents
- **Development Skills** - Git worktrees, finishing branches, subagent workflows
- **Automation Skills** - Playwright browser testing, iOS simulator automation
- **Productivity Skills** - File organization, Gmail automation, Notion integration
- **Document Skills** - Word, PDF, Excel, PowerPoint creation and manipulation
- **Creative & Media Skills** - Visual design, image enhancement, GIFs, video downloads
- **Business & Research Skills** - Lead research, competitor analysis, NotebookLM integration
- **AI Prompt Engineering** - Expert techniques for Veo3, Midjourney, DALL-E, Flux, Stable Diffusion, Claude, ChatGPT, Gemini
- **Meta Skills** - Creating, testing, and sharing skills

Plus:
- **Slash Commands** - `/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`
- **Automatic Integration** - Skills activate automatically when relevant
- **Consistent Workflows** - Systematic approaches to common engineering tasks

## Learn More

Read the introduction: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Installation

### Claude Code (via Plugin Marketplace)

```bash
# In Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Verify Installation

```bash
# Check that commands appear
/help

# Should see:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

### Codex (Experimental)

**Note:** Codex support is experimental and may require refinement based on user feedback.

Tell Codex to fetch https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md and follow the instructions.

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

### Skills Library

**Testing** (`skills/testing/`)
- **test-driven-development** - RED-GREEN-REFACTOR cycle
- **condition-based-waiting** - Async test patterns
- **testing-anti-patterns** - Common pitfalls to avoid

**Debugging** (`skills/debugging/`)
- **systematic-debugging** - 4-phase root cause process
- **root-cause-tracing** - Find the real problem
- **verification-before-completion** - Ensure it's actually fixed
- **defense-in-depth** - Multiple validation layers

**Collaboration** (`skills/collaboration/`)
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with quality gates

**Meta** (`skills/meta/`)
- **writing-skills** - Create new skills following best practices
- **sharing-skills** - Contribute skills back via branch and PR
- **testing-skills-with-subagents** - Validate skill quality
- **using-superpowers** - Introduction to the skills system

**Automation** (`skills/automation/`)
- **playwright-browser-automation** - Browser testing and automation with Playwright
- **ios-simulator-testing** - iOS app testing with accessibility-first navigation

**Productivity** (`skills/productivity/`)
- **file-organizer** - Intelligent file and folder organization with duplicate detection
- **gmail-intelligence** - Analyze Gmail data, process email threads, and automate workflows
- **notion-template-processor** - Fill Notion database templates and deliver via email

**Document Skills** (`skills/documents/`)
- **docx** - Create and edit Word documents with tracked changes and formatting
- **pdf** - Extract text/tables, create, merge, and split PDFs
- **xlsx** - Create Excel spreadsheets with formulas and data analysis
- **pptx** - Create PowerPoint presentations with layouts and charts

**Creative & Media** (`skills/creative/`)
- **canvas-design** - Visual art creation in PNG and PDF formats
- **image-enhancer** - Upscale and improve image resolution and clarity
- **slack-gif-creator** - Create animated GIFs optimized for Slack
- **theme-factory** - Apply professional themes to documents and slides
- **video-downloader** - Download videos from multiple platforms

**Business & Research** (`skills/business/`)
- **lead-research-assistant** - Identify and qualify potential business leads
- **competitive-ads-extractor** - Analyze competitor advertising strategies
- **notebooklm** - Query NotebookLM for source-grounded, citation-backed answers

**AI Prompt Engineering** (`skills/`)
- **prompt-engineer** - Expert prompt engineering for video generation (Veo3), image creation (Midjourney, DALL-E, Flux, Stable Diffusion), and conversational AI (Claude, ChatGPT, Gemini) with platform-specific techniques, parameters, and best practices

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

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating new skills
4. Use the `testing-skills-with-subagents` skill to validate quality
5. Submit a PR

See `skills/meta/writing-skills/SKILL.md` for the complete guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update superpowers
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/obra/superpowers/issues
- **Marketplace**: https://github.com/obra/superpowers-marketplace
