# Superpowers Pro Setup Guide

**Time Required:** 15 minutes one-time setup

**Prerequisites:** Claude Desktop Pro subscription ($20/month)

---

## Step 1: Create a New Project

1. Open Claude Desktop
2. Click on "Projects" in the sidebar
3. Click "+ New Project"
4. Name it: **"Superpowers Development"** (or your preferred name)
5. Click "Create"

---

## Step 2: Add Skills to Your Account

> **🆕 NEW: Skills ZIP Upload (Recommended)**
> Claude Desktop Pro now supports uploading skills as ZIP files via Settings → Capabilities.
> This is cleaner and more aligned with the Skills architecture.
> **→ [See Complete ZIP Upload Guide](SKILLS-ZIP-UPLOAD-GUIDE.md)**

**Two methods available:**

### Method A: Skills ZIP Upload (Recommended - See Guide)

Upload skills as ZIP packages to Settings → Capabilities for better integration.

**Advantages:**
- ✅ Cleaner than individual file uploads
- ✅ Account-wide availability
- ✅ Better skill activation
- ✅ Easier to share and update

**See [SKILLS-ZIP-UPLOAD-GUIDE.md](SKILLS-ZIP-UPLOAD-GUIDE.md) for complete instructions.**

### Method B: Project Knowledge Upload (Traditional)

Alternatively, upload skills as individual files to Project Knowledge:

1. In your project, click "Add content" → "Upload files"
2. Navigate to: `superpowers-desktop/pro-setup/skills/`
3. **Upload all directories:**
   - `core/` (4 files) - **Start here!**
   - `testing/` (2 files + 1 example)
   - `debugging/` (3 files + 1 script)
   - `collaboration/` (8 files)
   - `meta/` (3 files)
4. Upload `index.md` at the root of skills/

**Total:** 20+ skill files + index

#### Start with Core Skills Only (Method B)

If you want to start small:

1. Upload only the `core/` directory (4 files):
   - `using-superpowers.md`
   - `test-driven-development.md`
   - `systematic-debugging.md`
   - `brainstorming.md`
2. Upload `index.md`
3. Add more categories later as needed

---

## Step 3: Set Custom Instructions

1. In your project, click "Project settings" (gear icon)
2. Find "Custom instructions" section
3. Copy the content from `custom-instructions.txt`
4. Paste into the custom instructions field
5. Click "Save"

**What this does:**
- Reminds Claude to check for relevant skills before responding
- Establishes protocol for using skills
- Provides quick reference to available skills

---

## Step 4: Verify Installation

Start a new conversation in your project and test:

**Test 1: Skill Discovery**
```
You: "I need to implement a new login feature"
Claude: "I'm using brainstorming.md to refine this design..."
```

**Test 2: TDD Enforcement**
```
You: "Write code for user validation"
Claude: "I'm using test-driven-development.md.
        Let me write the test first..."
```

**Test 3: Debugging Protocol**
```
You: "The tests are failing"
Claude: "I'm using systematic-debugging.md.
        Let me investigate the root cause..."
```

---

## Step 5: Learn the Workflow

### Invoking Skills

**Manual invocation (always works):**
```
"Use test-driven-development.md to implement this"
"Follow systematic-debugging.md for this bug"
"Reference brainstorming.md to design this feature"
```

**Relying on custom instructions (sometimes works):**
- Custom instructions remind Claude to check for skills
- Not as reliable as manual invocation
- Works best for obvious task matches

**Best practice:** Explicitly reference the skill when starting a task.

### Tracking Checklists

Skills often include checklists. Track them explicitly:

```markdown
**TDD Checklist for login feature:**
- [ ] Write failing test for valid credentials
- [ ] Run test, verify it fails
- [ ] Implement minimal validation
- [ ] Run test, verify it passes
- [ ] Write failing test for invalid credentials
...
```

Update the list as you complete items.

---

## Tips for Success

### 1. Start Every Task Right

Before coding or debugging:
- Ask yourself: "Is there a skill for this?"
- Check `index.md` in project knowledge
- Reference the skill explicitly

### 2. Use the Index

`index.md` is your friend:
- Symptom-based lookup
- Quick decision guide
- Skill descriptions

### 3. Core Skills Are Mandatory

These four skills should be used for almost everything:
- `test-driven-development.md` - **Any feature/bugfix**
- `systematic-debugging.md` - **Any bug/failure**
- `brainstorming.md` - **Before new features**
- `using-superpowers.md` - **Understanding the system**

### 4. Announce Skill Usage

Always say:
```
"I'm using [skill-name] to [action]"
```

This helps you verify Claude is actually following the skill.

### 5. Track Explicitly

No automatic TodoWrite in Desktop. Track manually:
- Use checkboxes in responses
- Update status explicitly
- Don't skip checklist items

---

## Common Issues

### "Claude Isn't Using Skills"

**Problem:** Claude responds without referencing skills.

**Solution:**
- Explicitly invoke: "Use test-driven-development.md for this"
- Check custom instructions are set
- Remind: "Check project knowledge for relevant skills"

### "Too Many Files in Context"

**Problem:** Large project knowledge competes for context.

**Solution:**
- Start with core skills only
- Add categories as needed
- Consider using multiple projects for different work types

### "Skills Seem Out of Date"

**Problem:** Original plugin skills were updated.

**Solution:**
- Check for updates to superpowers-desktop
- Download new skill files
- Re-upload to your project

---

## Workflow Examples

### Example 1: Implementing a Feature

```
You: "I need to add email validation to the signup form"

Claude: "I'm using brainstorming.md to design this feature first.
         Let me ask some questions to understand the requirements..."

[After design is complete]

Claude: "I'm using test-driven-development.md to implement.
         Let me write the first failing test..."

[Follows RED-GREEN-REFACTOR cycle]
```

### Example 2: Debugging an Issue

```
You: "The login endpoint is returning 500 errors"

Claude: "I'm using systematic-debugging.md for this.

         Phase 1: Root Cause Investigation
         Let me read the error messages carefully..."

[Follows 4-phase process]
```

### Example 3: Code Review

```
You: "This branch is ready for review"

Claude: "I'm using requesting-code-review.md.
         Let me verify the pre-review checklist..."

[Works through checklist]
```

---

## Customization

### Adding Your Own Skills

You can add custom skills to your project:

1. Create a new `.md` file following the skill format:
```markdown
---
name: your-skill-name
description: Use when [triggering conditions] - [what it does]
---

# Your Skill Name

## Overview
...
```

2. Upload to your project
3. Add to your mental index of available skills

### Adapting Custom Instructions

Feel free to modify `custom-instructions.txt` to:
- Add project-specific workflows
- Emphasize certain skills over others
- Add reminders for your team's practices

---

## Maintenance

### Updating Skills

When new versions are released:

1. Download updated `pro-setup/skills/` directory
2. In your project, delete old skill files
3. Upload new skill files
4. Update custom instructions if needed

### Backing Up Your Project

Projects are stored by Claude Desktop. To backup:
- Export conversations regularly
- Keep a copy of your skill files locally
- Document any custom skills you've added

---

## Next Steps

**You're ready to use Superpowers!**

1. **Start with a small task** - Try TDD on a simple function
2. **Use the index** - Reference `index.md` when unsure
3. **Be explicit** - Always invoke skills by name
4. **Track progress** - Maintain checklists in responses
5. **Iterate** - The more you use skills, the more natural they become

---

## Getting Help

- **Skill usage questions:** Reference the skill's content
- **Installation issues:** Re-check steps above
- **Bug reports:** [GitHub Issues](https://github.com/obra/superpowers/issues)
- **General questions:** [Discussions](https://github.com/obra/superpowers/discussions)

---

## Comparison to Claude Code Plugin

**What you're missing:**
- Automatic skill activation (must invoke manually)
- TodoWrite tool (track manually)
- Task tool for subagents (break down manually)
- SessionStart hooks (custom instructions instead)
- Git-based auto-updates (manual reuploads)

**What you have:**
- Full skill content and workflows
- Persistent project knowledge
- Custom instructions for reminders
- All 20+ skills available

**If you have access to Claude Code, use the plugin instead for the full experience.**

---

**Happy coding with Superpowers! 🚀**
