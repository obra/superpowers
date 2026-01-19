# Installation Instructions

## Option A: Claude Code

### Method 1: Individual Agent Files (Recommended)

This gives you the most control and enables Claude to automatically invoke agents.

**Step 1: Create agents directory**
```bash
# For a specific project (recommended)
mkdir -p /path/to/your/project/.claude/agents

# OR for all projects (user-level)
mkdir -p ~/.claude/agents
```

**Step 2: Copy agent files**
```bash
# Copy all agents
cp /path/to/superpowers/exports/claude-code-agents/*.md ~/.claude/agents/

# Or copy specific ones you want
cp /path/to/superpowers/exports/claude-code-agents/debugger.md ~/.claude/agents/
cp /path/to/superpowers/exports/claude-code-agents/implementer.md ~/.claude/agents/
```

**Step 3: Verify**
```bash
# In Claude Code, run:
/agents
```

You should see your agents listed.

**Step 4: Add skills to CLAUDE.md (optional)**

Create or edit your project's `CLAUDE.md`:

```bash
cat >> /path/to/your/project/CLAUDE.md << 'EOF'

## Development Skills

Use these development practices:

- **TDD**: Write failing test first, then minimal implementation, then refactor
- **Root Cause Debugging**: Never fix without understanding why - trace backwards from error
- **Verification**: Always run tests and show output before claiming completion
- **YAGNI**: Only build what's needed, nothing extra

EOF
```

### Method 2: Complete Guide in CLAUDE.md

Add the entire guide to your project instructions.

**Step 1: Create CLAUDE.md**
```bash
# Copy the complete guide as your CLAUDE.md
cp /path/to/superpowers/exports/COMPLETE-GUIDE.md /path/to/your/project/CLAUDE.md
```

**Step 2: (Optional) Add project-specific content**

Edit the file to add your project's specific guidelines at the top.

---

## Option B: Claude.ai (Web)

### Method 1: Project Custom Instructions (Recommended)

**Step 1: Create a Project**
1. Go to https://claude.ai
2. Click "Projects" in the sidebar
3. Click "New Project"
4. Name it (e.g., "Software Development")

**Step 2: Add Custom Instructions**
1. Click on your project
2. Click the gear icon (Settings) or "Edit Project"
3. Find "Custom Instructions" or "Project Instructions"
4. Copy the ENTIRE contents of `COMPLETE-GUIDE.md`
5. Paste into the instructions field
6. Save

**Step 3: Use**
- All conversations in this project will have access to the skills and agents
- Start new chats within the project
- Invoke agents: "Act as the Debugger Agent and help me..."

### Method 2: Per-Conversation Instructions

If you don't want to create a project:

1. Start a new conversation
2. In your first message, paste the relevant section from `COMPLETE-GUIDE.md`
3. Or say: "I'm going to give you development guidelines to follow" and paste the content

---

## Option C: Claude API / SDK

### System Prompt

Use `COMPLETE-GUIDE.md` as part of your system prompt:

```python
import anthropic

client = anthropic.Anthropic()

# Load the complete guide
with open("exports/COMPLETE-GUIDE.md", "r") as f:
    superpowers_guide = f.read()

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=f"""You are a software development assistant.

{superpowers_guide}

Always follow these practices when helping with code.""",
    messages=[
        {"role": "user", "content": "Help me debug this failing test..."}
    ]
)
```

### With Tool Use / Agents

For agentic workflows, include relevant agent instructions in task prompts:

```python
# Load specific agent
with open("exports/claude-code-agents/debugger.md", "r") as f:
    debugger_prompt = f.read()

# Use in agent task
task_prompt = f"""
{debugger_prompt}

## Current Issue

{user_bug_description}
"""
```

---

## Quick Start Examples

### Claude Code: Debug a Test

```
# With agents installed, just describe the problem:
This test is failing with "undefined is not a function".
Help me find the root cause.

# Claude will automatically use the debugger agent approach
```

### Claude Code: Implement a Feature

```
# Request TDD implementation:
Implement a user authentication feature following TDD.
Write failing tests first, then minimal implementation.

# Or explicitly invoke:
Use the implementer agent to add a login endpoint.
```

### Claude.ai: Plan a Feature

```
# With custom instructions set:
I need to add a shopping cart feature to my e-commerce app.
Let's brainstorm the approach before writing any code.

# Claude will follow the brainstorming skill pattern
```

---

## Customization Tips

### Restricting Agent Tools

Edit the agent file's frontmatter:

```yaml
---
name: debugger
tools: Read, Grep, Glob  # Remove Bash, Edit, Write for read-only
---
```

### Changing Default Model

```yaml
---
name: implementer
model: opus  # Use opus for complex implementations
---
```

### Adding Project-Specific Rules

Add to your CLAUDE.md:

```markdown
## Project-Specific Rules

- Always use TypeScript strict mode
- Run `npm test` before committing
- Follow the existing patterns in src/
- Database changes require migrations
```

---

## File Locations Summary

| Platform | Location | Scope |
|----------|----------|-------|
| Claude Code | `.claude/agents/*.md` | Project |
| Claude Code | `~/.claude/agents/*.md` | All projects |
| Claude Code | `CLAUDE.md` | Project instructions |
| Claude Code | `~/.claude/CLAUDE.md` | Global instructions |
| Claude.ai | Project → Custom Instructions | Project |
| API | System prompt | Per-request |

---

## Troubleshooting

### Agents not showing in Claude Code

1. Check file location: `ls ~/.claude/agents/` or `ls .claude/agents/`
2. Check file extension: Must be `.md`
3. Check frontmatter: Must have `name:` and `description:`
4. Restart Claude Code

### Claude not following skills

1. Skills are guidelines, not commands - Claude interprets them
2. Be explicit: "Follow the TDD skill - write a failing test first"
3. Check if skills are in CLAUDE.md or custom instructions

### Too much context

If responses are slow or truncated:
1. Use individual agents instead of complete guide
2. Only include skills relevant to your project
3. Use project-level config, not conversation-level
