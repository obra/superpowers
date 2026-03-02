# Superpowers for Gemini CLI: Complete Guide

## Overview

Superpowers is now available as a native extension for Gemini CLI. This guide covers installation, features, and troubleshooting.

## What You Get

**14+ skills** including:
- Test-Driven Development (TDD)
- Systematic Debugging
- Brainstorming & Design
- Planning & Task Breakdown
- Code Review Workflows
- Collaboration Patterns
- Git Best Practices
- And more...

All skills are **automatically discovered** and **activate when relevant** to your work.

## Installation

### Quick Install (Recommended)

```bash
gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli
gemini restart
```

### Verify Installation

```bash
gemini skills list        # Shows all available skills
gemini skills info brainstorming  # Show skill details
```

### Local Development Setup

If you want to develop with the extension:

```bash
cd /path/to/superpowers/.gemini-cli
gemini extensions link .
gemini restart
```

Changes update immediately without reinstalling.

## Understanding Superpowers

### Core Philosophy

**Test-Driven Development** is more than code—it's a mindset applied to everything:
- **Code:** Write tests first, then implementation
- **Debugging:** Follow a systematic 4-phase methodology
- **Documentation:** Test your skills with subagents before publishing
- **Planning:** Verify tasks are complete before moving on
- **Verification:** Evidence beats claims

### How Skills Work

Skills are **automatically discovered** from three locations (in order of precedence):

1. **Workspace Skills** (`.gemini/skills/`) - Your project-specific skills
2. **User Skills** (`~/.gemini-cli/skills/`) - Personal skills across all projects
3. **Extension Skills** (Superpowers) - The core library

When you ask Gemini CLI something relevant, the matching skill loads automatically.

**Example:**
```
You: "Help me debug this null pointer exception"

Gemini CLI recognizes: systematic-debugging skill matches
                        ↓
Loads the 4-phase methodology automatically
                        ↓
Guides you through: Gather Symptoms → Form Hypothesis → Test → Fix & Verify
```

## Available Skills

### Testing & Quality Assurance
- **test-driven-development** - RED-GREEN-REFACTOR cycle for reliable code
- **verification-before-completion** - Verify fixes work before declaring done

### Debugging & Problem Solving
- **systematic-debugging** - 4-phase root-cause analysis methodology
  - Includes supporting guides: root-cause-tracing, defense-in-depth, condition-based-waiting
- **verification-before-completion** - Ensure the fix actually works

### Design & Planning
- **brainstorming** - Socratic method for design refinement through questions
- **writing-plans** - Detailed task breakdown (2-5 min tasks with exact files)

### Implementation & Execution
- **test-driven-development** - Start with tests, then code
- **subagent-driven-development** - Parallel task execution with review cycles
- **executing-plans** - Batch execution with human checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows

### Collaboration & Code Review
- **requesting-code-review** - Pre-review checklist before asking for review
- **receiving-code-review** - Responding to feedback constructively
- **using-git-worktrees** - Parallel development branches for clean history
- **finishing-a-development-branch** - Merge/PR decision workflows

### Meta Skills
- **writing-skills** - Create new skills using TDD for documentation
- **using-superpowers** - Introduction to the Superpowers system

## Discovery & Management

### List Skills

```bash
gemini skills list
```

Shows all available skills from all sources.

### View Skill Details

```bash
gemini skills info test-driven-development
```

Shows the skill's description and content.

### Load a Skill

```bash
gemini skills load brainstorming
```

Explicitly load a skill into your current context (usually happens automatically).

### Create Project-Specific Skills

```bash
# Create a new skill
mkdir -p .gemini/skills/my-skill
cat > .gemini/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Use when [your condition]
---

# My Custom Skill

[Your skill content here]
EOF

# Restart to discover
gemini restart
gemini skills list  # Should show your skill
```

**Skill Priority:** Project skills override personal skills, which override extension skills.

## Tool Mapping

Superpowers works across multiple platforms. Here's how tools map to Gemini CLI:

| Superpowers | Gemini CLI | Status | Notes |
|---|---|---|---|
| `Read` tool | `read_file` | ✅ Works | Direct mapping |
| `Write` tool | `write_file` | ✅ Works | Direct mapping |
| `Edit` tool | `replace` | ✅ Works | Direct mapping |
| `Bash` tool | `run_shell_command` | ✅ Works | Direct mapping |
| `Glob` tool | `glob` | ✅ Works | Direct mapping |
| `Grep` tool | N/A | ⚠️ Workaround | Use `run_shell_command("grep pattern file")` |
| `Task` (subagents) | Native | ✅ Works | Built-in to Gemini CLI |
| `Skill` tool | `gemini skills` | ✅ Works | Native command |
| `TodoWrite` | N/A | ⚠️ Workaround | Use project `.md` files for tracking |

**Tool Compatibility:** ~95% direct mapping. The two workarounds are minor and well-documented.

## Common Workflows

### Workflow 1: Design → Plan → Implement → Review

```
Step 1: You ask for design help
  ↓ brainstorming skill activates
  ↓ Refinement through Socratic questions
  ↓ You validate the design

Step 2: You ask for detailed plan
  ↓ writing-plans skill activates
  ↓ Get task breakdown (2-5 min each)
  ↓ Review and approve plan

Step 3: Implement each task
  ↓ test-driven-development activates
  ↓ Write test first (RED)
  ↓ Write code (GREEN)
  ↓ Refactor (REFACTOR)
  ↓ Commit when done

Step 4: Review before merging
  ↓ requesting-code-review activates
  ↓ Pre-review checklist
  ↓ Fix any issues
  ↓ Safe to merge
```

### Workflow 2: Bug Fix & Verification

```
Step 1: You discover a bug
  ↓ systematic-debugging activates
  ↓ Phase 1: Gather symptoms
  ↓ Phase 2: Form hypothesis
  ↓ Phase 3: Test hypothesis
  ↓ Phase 4: Fix & verify
  ↓ Root cause found and fixed

Step 2: Verify the fix
  ↓ verification-before-completion activates
  ↓ Test edge cases
  ↓ Verify it doesn't break anything
  ↓ Confident the fix is complete
```

### Workflow 3: Feature with Parallel Tasks

```
Step 1: Plan the feature
  ↓ Get detailed task breakdown
  ↓ Review plan

Step 2: Execute in parallel
  ↓ subagent-driven-development activates
  ↓ Multiple subagents work on tasks simultaneously
  ↓ Each subagent:
     - Implements task
     - Self-reviews against spec
     - Code quality review
     - Reports completion
  ↓ Main agent verifies integration
  ↓ All tests pass
```

## Frequently Asked Questions

### Installation & Setup

**Q: Is Superpowers free?**
A: Yes, Superpowers is open source and completely free.

**Q: Do I need anything else?**
A: Just Gemini CLI installed. Skills are local markdown files—no external dependencies.

**Q: Can I use Superpowers offline?**
A: Yes, once installed. No internet required.

### Skills & Features

**Q: Do all skills load automatically?**
A: Yes! Gemini CLI recognizes relevant skills based on your request and loads them automatically.

**Q: Can I disable a skill?**
A: Yes: `gemini skills disable skill-name`
To re-enable: `gemini skills enable skill-name`

**Q: Can I create my own skills?**
A: Absolutely. Create in `.gemini/skills/` and they override extension skills.

**Q: Do skill changes take effect immediately?**
A: For local changes, run `gemini restart` to reload.

### Troubleshooting

**Q: Skills aren't showing up?**
A:
```bash
gemini restart
gemini skills list
```
If still missing, see [TROUBLESHOOTING.md](../.gemini-cli/TROUBLESHOOTING.md).

**Q: A skill isn't activating when I need it?**
A: Try asking more specifically. Or load manually:
```bash
gemini skills load skill-name
```

**Q: What if I encounter an error?**
A: See [TROUBLESHOOTING.md](../.gemini-cli/TROUBLESHOOTING.md) for solutions or file an issue with:
```bash
gemini --version
gemini extensions list
gemini skills list
```

## Advanced Topics

### Skill Priority (Override System)

Skills are discovered in this order—first match wins:

1. **Workspace Skills** (highest priority)
   ```
   .gemini/skills/my-skill/SKILL.md
   ```

2. **User Skills**
   ```
   ~/.gemini-cli/skills/my-skill/SKILL.md
   ```

3. **Extension Skills** (lowest priority)
   ```
   ~/.gemini/extensions/superpowers/skills/my-skill/SKILL.md
   ```

**Use Case:** Create a project-specific version of a skill by placing it in `.gemini/skills/`.

### Creating Custom Skills

Follow the `writing-skills` methodology (TDD for documentation):

1. **RED:** Show the agent violating the rule without the skill
2. **GREEN:** Write the SKILL.md that teaches the rule
3. **REFACTOR:** Tighten language, close loopholes

Template:

```markdown
---
name: my-skill
description: Use when [triggering condition]
---

# My Skill Title

## When to Use This

[Explain the situation]

## The Pattern

[Describe the technique or workflow]

## Step-by-Step

1. [First step]
2. [Second step]
3. [etc...]

## Examples

[Show real examples]

## Common Mistakes

[What people get wrong]
```

### Tool Mapping & Workarounds

**Grep Workaround:**
```javascript
// Superpowers expects: grep("pattern", "file")
// Gemini CLI workaround:
run_shell_command("grep \"pattern\" file")
```

**TodoWrite Workaround:**
```markdown
// Superpowers expects: TodoWrite for plan tracking
// Gemini CLI workaround: Use project markdown files

# Implementation Progress

- [x] Task 1: Create schema
- [ ] Task 2: Implement login
- [ ] Task 3: Add middleware
```

## Performance Tips

1. **Keep GEMINI.md in context** - It's ~2000 tokens, which is normal
2. **Project-specific skills update immediately** - No reinstall needed
3. **Clear sessions periodically** - Helps manage context size

## Integration with Other Extensions

Superpowers works alongside other Gemini CLI extensions:
- Skills are merged from all sources
- Your project skills take precedence
- No conflicts between extensions

## Contributing & Feedback

### Report Issues

Found a bug? Have a suggestion?

```bash
# File an issue with context
gemini --version
gemini extensions list
gemini skills list
```

Then go to: https://github.com/obra/superpowers/issues

### Contribute Improvements

1. Follow the `writing-skills` skill methodology
2. Test with subagents
3. Submit PR to: https://github.com/obra/superpowers

### Discuss & Learn

- GitHub Discussions: https://github.com/obra/superpowers/discussions
- Blog: https://blog.fsck.com/2025/10/09/superpowers/
- Agent Skills Standard: https://agentskills.io

## Support

- **Installation Help:** See [.gemini-cli/INSTALL.md](../.gemini-cli/INSTALL.md)
- **Examples:** See [.gemini-cli/EXAMPLES.md](../.gemini-cli/EXAMPLES.md)
- **Troubleshooting:** See [.gemini-cli/TROUBLESHOOTING.md](../.gemini-cli/TROUBLESHOOTING.md)
- **Issues:** https://github.com/obra/superpowers/issues
- **Main Docs:** https://github.com/obra/superpowers

## Quick Reference

```bash
# Installation
gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli

# Restart to apply
gemini restart

# Verify
gemini skills list

# View skill details
gemini skills info brainstorming

# Load a skill
gemini skills load test-driven-development

# Create custom skill
mkdir -p .gemini/skills/my-skill
touch .gemini/skills/my-skill/SKILL.md

# Update/refresh
gemini extensions update superpowers

# Uninstall
gemini extensions uninstall superpowers
```

---

**Superpowers Version:** 4.3.1
**Last Updated:** 2025-02-28
**Maintained by:** Jesse Vincent (@obra)
**License:** MIT
