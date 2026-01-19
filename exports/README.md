# Superpowers Agents Export

Pre-formatted agents ready for use in Claude Code and Claude.ai.

## Claude Code Installation

### Option 1: Project-Level (Recommended)

Copy agents to your project's `.claude/agents/` directory:

```bash
# From your project root
mkdir -p .claude/agents
cp /path/to/superpowers/exports/claude-code-agents/*.md .claude/agents/
```

Agents will be available in all Claude Code sessions for this project.

### Option 2: User-Level (All Projects)

Copy to your home directory:

```bash
mkdir -p ~/.claude/agents
cp /path/to/superpowers/exports/claude-code-agents/*.md ~/.claude/agents/
```

Agents will be available across all your projects.

### Verify Installation

In Claude Code, run:
```
/agents
```

You should see the new agents listed.

## Claude.ai Projects Installation

1. Go to [claude.ai](https://claude.ai)
2. Create a new Project (or open existing)
3. Click "Project Settings" → "Custom Instructions"
4. Copy the contents of `claude-ai-projects/software-development-agents.md`
5. Paste into the custom instructions field
6. Save

All conversations in that project will have access to the agent patterns.

## Available Agents

| Agent | Purpose |
|-------|---------|
| **implementer** | Execute tasks with TDD and self-review |
| **debugger** | 4-phase root cause debugging |
| **planner** | Create detailed implementation plans |
| **code-reviewer** | Review work against plans and standards |
| **spec-reviewer** | Verify implementation matches spec |
| **code-quality-reviewer** | Production readiness review |
| **brainstormer** | Collaborative design exploration |

## Usage in Claude Code

Once installed, agents are automatically available. Claude will use them when appropriate, or you can explicitly request:

```
Use the debugger agent to investigate this test failure
```

```
Have the code-reviewer agent check this implementation
```

## Usage in Claude.ai

With the custom instructions installed, invoke agents by role:

```
Act as the Debugger Agent and help me find the root cause of this bug
```

```
Using the Planner Agent approach, create an implementation plan for...
```

## Customization

Feel free to modify the agent definitions for your needs:

- Adjust `tools` in frontmatter to restrict/expand capabilities
- Change `model` to use different Claude models (sonnet, opus, haiku)
- Modify prompts to match your team's conventions
