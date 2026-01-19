# Document-Driven Workflow Integration - Quick Start

> **⚠️ DEPRECATED - This document is outdated**
>
> **The bridge integration approach described in this document has been replaced by the Unified Document System.**
>
> **Please use the new Unified Document System:**
> - See [Unified Document System Guide](./unified-document-system.md)
> - Reference [Document Migration Guide](./document-migration-guide.md)
> - Read design document: [docs/plans/2025-01-19-unified-document-system-design.md](./plans/2025-01-19-unified-document-system-design.md)
>
> **The new system is simpler:**
> - No need to install document-driven-ai-workflow separately
> - Just set `documentation.enabled: true` in `.horspowers-config.yaml`
> - Run `/docs-init` to initialize
> - All workflow skills automatically support document generation
>
> **This document is kept for historical reference only. New projects should not use the bridge approach.**

---

Enable document-driven AI workflow for superpowers in 5 minutes.

## 🎯 Goal

Automatically trigger document generation at key superpowers operation steps, building cross-session AI context memory.

## 📋 Prerequisites

- ✅ Superpowers installed (current directory)
- ✅ Node.js 16+ environment
- ✅ A project needing AI collaboration

## 🚀 Quick Start (3 Steps)

### Step 1: Install document-driven-ai-workflow

```bash
# 1. Clone repository (recommended in parent directory)
cd /path/to/parent
git clone https://github.com/LouisHors/document-driven-ai-workflow.git

# 2. Verify installation
cd document-driven-ai-workflow
node cli.js --help

# 3. Test CLI
node cli.js init
```

**Expected output:**
```
✓ Created .docs/active
✓ Created .docs/context
✓ Created .docs/templates
✓ Created .docs/archive
Documentation structure initialized!
```

### Step 2: Configure Your Project

```bash
# 1. Enter your project directory
cd /path/to/your/project

# 2. Copy configuration template
cp /path/to/horspowers/.superpowers-config.template.yaml .superpowers-config.yaml

# 3. Edit configuration file
nano .superpowers-config.yaml  # or use your preferred editor
```

**Minimum configuration** (only need to modify these two lines):

```yaml
# Enable documentation integration
documentation:
  enabled: true
  # Modify to actual CLI path
  cli_path: "node /absolute/path/to/document-driven-ai-workflow/cli.js"
```

**Full path example:**

```yaml
documentation:
  enabled: true
  # Mac/Linux example
  cli_path: "node /Users/username/document-driven-ai-workflow/cli.js"
  # Windows example
  # cli_path: "node C:\\Users\\username\\document-driven-ai-workflow\\cli.js"
```

### Step 3: Initialize Project Documentation

```bash
# 1. Initialize documentation structure
node /path/to/document-driven-ai-workflow/cli.js init

# 2. Create project context (optional but recommended)
node /path/to/document-driven-ai-workflow/cli.js create context "Project Overview"
node /path/to/document-driven-ai-workflow/cli.js create context "Tech Stack"
node /path/to/document-driven-ai-workflow/cli.js create context "Development Standards"

# 3. Check status
node /path/to/document-driven-ai-workflow/cli.js status
```

**Done!** 🎉

Your project is now configured with document-driven workflow.

## ✅ Verify Integration

Create a test session to verify integration works:

```bash
cd /path/to/your/project
claude
```

In Claude Code, enter:

```
I need to add a user login feature, help me design it
```

**Expected behavior:**

1. **brainstorming skill starts**
2. **Auto search**: `docs:search "project architecture"`
3. **Design discussion**
4. **Auto create**: `docs:create decision "Technical decision: User authentication scheme"`
5. **Save design document**

Continue with:

```
Help me write implementation plan
```

**Expected behavior:**

1. **writing-plans skill starts**
2. **Auto search**: `docs:search "related features"`
3. **Create implementation plan**
4. **Auto create**: `docs:create task "Implement: User login feature"`

## 📊 Effect Comparison

### Before Integration

```
You: Help me add user login feature
AI: OK, let me start designing...
[Design process]
AI: Design complete, saved to docs/plans/2025-01-07-login-design.md

[A few hours later, new session]
You: Continue the previous login feature
AI: What login feature? Let me re-read the documents...
```

### After Integration

```
You: Help me add user login feature
AI: Searching project context...
    ✓ Found 3 related documents
    ✓ Project architecture: React + Node.js
    ✓ Technical decision: Use JWT authentication
AI: Based on project background, I suggest...
[Design process]
AI: Create decision document: .docs/active/2025-01-07-decision-login-auth-scheme.md
AI: Create task document: .docs/active/2025-01-07-task-user-login-feature.md

[A few hours later, new session]
You: Continue the previous login feature
AI: Searching related tasks...
    ✓ Found active task: User login feature (status: in_progress)
    ✓ Current progress: Completed basic components
AI: I understand the situation. Last time we completed basic components, now continuing...
```

## 🎯 Common Commands

### Project Management

```bash
# View all active documents
docs:status

# Search related documents
docs:search "login"

# Create new document
docs:create context "New context"
docs:create task "New task"
docs:create decision "Technical decision"
docs:create bug "Bug description"
```

### Task Tracking

```bash
# Update task status
docs:update ".docs/active/TaskDocument.md" "status:in_progress" "progress:Complete component development"

# Mark as complete
docs:update ".docs/active/TaskDocument.md" "status:completed"
```

## 🔧 Custom Configuration

### Personal Project (Simplified Mode)

```yaml
development_mode: personal
completion_strategy: merge

documentation:
  enabled: true
  cli_path: "node /path/to/cli.js"
  workflows:
    finishing-a-development-branch:
      actions:
        - type: update  # Only update status, don't create PR
```

### Team Project (Full Mode)

```yaml
development_mode: team
completion_strategy: pr

documentation:
  enabled: true
  cli_path: "node /path/to/cli.js"
  workflows:
    brainstorming:
      create:
        - type: decision
          when: "technical_decisions_made"
    writing-plans:
      create:
        - type: task
          always: true
    test-driven-development:
      create:
        - type: bug
          when: "test_fails"
    finishing-a-development-branch:
      actions:
        - type: status
        - type: archive
```

### Temporary Experiment (Disable Documentation)

```yaml
documentation:
  enabled: false  # Temporarily disable document generation
```

## ❓ Frequently Asked Questions

### Q: CLI path always reports error not found

**A:** Use absolute path instead of relative path:

```yaml
# ❌ Not recommended
cli_path: "node ../document-driven-ai-workflow/cli.js"

# ✅ Recommended
cli_path: "node /Users/username/document-driven-ai-workflow/cli.js"
```

### Q: Where are documents created?

**A:** In the `.docs/` folder in project root:

```
your-project/
├── .docs/
│   ├── active/       # Active tasks, bugs, decisions
│   ├── context/      # Project context documents
│   ├── templates/    # Document templates
│   └── archive/      # Completed documents
├── .superpowers-config.yaml
└── ...
```

### Q: Will it create too many documents?

**A:** Depends on your usage frequency. Recommendations:

1. **Only record important decisions** - Not all designs need decision documents
2. **Archive regularly** - Use `finishing-a-development-branch` to auto-archive
3. **Enable as needed** - Temporary work can set `documentation.enabled: false`

### Q: How to disable documentation for a specific workflow?

**A:** Remove the corresponding workflow configuration in config file:

```yaml
workflows:
  # Remove test-driven-development config to disable
  brainstorming:
    create:
      - type: decision
```

## 📚 Next Steps

- 📖 Read [Complete Integration Guide](document-driven-integration-guide-en.md)
- 🔧 View [Bridge Skill Documentation](../skills/document-driven-bridge/SKILL.md)
- 🎮 Try [Example Projects](../examples/)

## 🆘 Need Help?

1. **Check configuration**: Run `docs:status` to verify CLI tool is available
2. **View logs**: Skill invocations display executed commands
3. **Read documentation**: [Complete documentation](document-driven-integration-guide-en.md)

---

**Start enjoying cross-session AI memory!** 🚀
