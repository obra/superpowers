# Superpowers for Gemini CLI

You have superpowers. This is your core skill library for professional development workflows.

## What Are Superpowers?

Superpowers is a complete software development workflow built on proven techniques and refined through real-world usage.

**Core principles:**
- **Test-Driven Development** - RED → GREEN → REFACTOR cycle
- **Systematic Debugging** - 4-phase root-cause analysis
- **Structured Planning** - Detailed task breakdown with verification
- **Collaborative Development** - Skill-based workflows and best practices
- **Evidence Over Claims** - Verify before declaring success

All skills are automatically discovered and activate when relevant.

## The 15+ Skills

Superpowers includes skills organized by domain:

### Testing & Quality
- **test-driven-development** - RED-GREEN-REFACTOR methodology
- **verification-before-completion** - Ensure fixes actually work

### Debugging & Investigation
- **systematic-debugging** - 4-phase root-cause analysis
  - root-cause-tracing
  - defense-in-depth
  - condition-based-waiting

### Planning & Design
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed task breakdown

### Execution
- **subagent-driven-development** - Parallel task execution with review
- **executing-plans** - Batch execution with human checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows

### Collaboration
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decisions

### Meta
- **writing-skills** - Creating new skills (TDD for documentation)
- **using-superpowers** - Introduction to the skills system

## Using Skills

Skills activate **automatically** based on context. Examples:

```
You: Help me debug this issue
→ systematic-debugging skill loads → 4-phase methodology

You: Let's plan this feature
→ brainstorming skill loads → Socratic refinement

You: Write tests first
→ test-driven-development skill loads → RED-GREEN-REFACTOR
```

## Discovery & Management

### List all skills
```bash
gemini skills list
```

### View skill details
```bash
gemini skills info test-driven-development
```

### Load a skill into current context
```bash
gemini skills load writing-plans
```

### Create project-specific skills
```bash
mkdir -p .gemini/skills/my-skill
touch .gemini/skills/my-skill/SKILL.md
```

Then edit the SKILL.md file with your skill content.

## Tool Mapping for Gemini CLI

Superpowers references tools that work across multiple platforms. Here's how they map to Gemini CLI:

| Superpowers | Gemini CLI | Notes |
|---|---|---|
| `Task` (subagent) | Native parallel | Built-in support |
| `Read` (read file) | `read_file` | Direct mapping |
| `Write` (write file) | `write_file` | Direct mapping |
| `Edit` (edit file) | `replace` | Direct mapping |
| `Bash` (shell) | `run_shell_command` | Direct mapping |
| `Glob` (find files) | `glob` | Direct mapping |
| `Grep` (text search) | `run_shell_command` | Use grep/rg via shell |
| `Skill` tool | `gemini skills` | Native command |
| `TodoWrite` | N/A | Use project `.md` files |

## Philosophy

**Test-Driven Development** is the foundation:
- Write tests first (RED)
- Watch them fail
- Write minimal implementation (GREEN)
- Watch them pass
- Refactor safely (REFACTOR)

This applies to **everything**: code, skills, workflows, debugging.

**Systematic over ad-hoc** - Process beats guessing

**Complexity reduction** - Simplicity is the goal

**Evidence over claims** - Verify before declaring success

## Quick Start

1. **Ask for something that needs a skill:**
   ```
   "Help me debug this null pointer"
   "Let me plan this feature"
   "Write tests for this function"
   ```

2. **Skills activate automatically** with relevant guidance

3. **Follow the workflow** the skill provides

4. **Verify the result** before moving on

## Learning Resources

### Superpowers
- **Main Repository**: https://github.com/obra/superpowers
- **Philosophy Blog**: https://blog.fsck.com/2025/10/09/superpowers/
- **Contributing Guide**: See skills/writing-skills/SKILL.md

### Gemini CLI
- **Official Docs**: https://github.com/google-gemini/gemini-cli
- **Agent Skills Standard**: https://agentskills.io
- **Extensions Guide**: https://github.com/google-gemini/gemini-cli/docs/extensions

## Troubleshooting

### Skills not loading?
1. Check `gemini skills list` shows them
2. Restart with `gemini restart`
3. See TROUBLESHOOTING.md in this extension

### Context not appearing?
1. This GEMINI.md file should be in every session
2. Check that Superpowers extension is installed
3. Verify contextFileName in gemini-extension.json

### Need help?
- Check [TROUBLESHOOTING.md](.gemini-cli/TROUBLESHOOTING.md)
- File an issue: https://github.com/obra/superpowers/issues
- Review docs: https://github.com/obra/superpowers

---

**Superpowers Version:** 4.3.1
**Last Updated:** 2025-02-28
**Platform:** Gemini CLI
