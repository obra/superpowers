# Claude Desktop Pro - Superpowers Setup

This directory contains everything you need to set up Superpowers skills for Claude Desktop Pro.

## 📚 Documentation

1. **[SETUP.md](SETUP.md)** - Main setup guide
   - Traditional project knowledge upload method
   - Overview of all features

2. **[SKILLS-ZIP-UPLOAD-GUIDE.md](SKILLS-ZIP-UPLOAD-GUIDE.md)** - ⭐ Recommended
   - Complete tutorial for ZIP upload method
   - Skills architecture (Settings → Capabilities)
   - Automation scripts included
   - Best practices and troubleshooting

3. **[custom-instructions.txt](custom-instructions.txt)**
   - Custom instructions for your project/account
   - Reminders for Claude to use skills

## 🚀 Quick Start

### Recommended: Skills ZIP Upload

1. **Create skill ZIPs:**
   ```bash
   cd pro-setup
   ./create-skill-zips.sh
   ```

2. **Upload to Claude Desktop:**
   - Open Claude Desktop
   - Go to Settings → Capabilities
   - Click "Upload skill" for each ZIP
   - Start with: test-driven-development, systematic-debugging, brainstorming

3. **Read the full guide:** [SKILLS-ZIP-UPLOAD-GUIDE.md](SKILLS-ZIP-UPLOAD-GUIDE.md)

### Alternative: Project Knowledge Upload

Follow [SETUP.md](SETUP.md) for the traditional method of uploading individual files to Projects.

## 📁 Directory Structure

```
pro-setup/
├── README.md (you are here)
├── SETUP.md                      # Main setup guide
├── SKILLS-ZIP-UPLOAD-GUIDE.md    # ZIP upload tutorial (recommended)
├── custom-instructions.txt       # Custom instructions
├── create-skill-zips.sh          # Automation script
├── skills/                       # Source skill files
│   ├── core/                     # Start here (4 skills)
│   ├── testing/                  # Quality & testing (2 skills)
│   ├── debugging/                # Bug investigation (3 skills)
│   ├── collaboration/            # Team workflows (8 skills)
│   ├── meta/                     # Skill management (3 skills)
│   └── index.md                  # Skill directory
└── skill-zips/                   # Generated ZIPs (after running script)
```

## 🎯 Which Method Should I Use?

| Aspect | ZIP Upload | Project Knowledge |
|--------|------------|-------------------|
| **Ease** | ⭐⭐⭐⭐⭐ Script automates | ⭐⭐⭐ Manual upload |
| **Organization** | ⭐⭐⭐⭐⭐ Clean packages | ⭐⭐⭐ Many loose files |
| **Activation** | ⭐⭐⭐⭐ Better | ⭐⭐⭐ Manual invocation |
| **Scope** | Account-wide | Project-specific |
| **Updates** | Re-upload ZIP | Re-upload files |

**Recommendation:** Use ZIP upload method for better experience.

## 📖 Available Skills

### Core (Must-Have)
- `test-driven-development` - RED-GREEN-REFACTOR workflow
- `systematic-debugging` - 4-phase root cause investigation
- `brainstorming` - Socratic design refinement
- `using-superpowers` - Understanding the system

### Testing
- `testing-skills-with-subagents` - Validating skill effectiveness
- `testing-anti-patterns` - What NOT to do

### Debugging
- `verification-before-completion` - Pre-completion checks
- `defense-in-depth` - Multiple validation layers
- `root-cause-tracing` - Deep issue investigation

### Collaboration
- `writing-plans` - Structured planning
- `executing-plans` - Plan implementation
- `requesting-code-review` - Pre-review preparation
- `receiving-code-review` - Responding to feedback
- `finishing-a-development-branch` - Branch completion
- `using-git-worktrees` - Parallel development
- `dispatching-parallel-agents` - Task distribution
- `subagent-driven-development` - Delegated implementation

### Meta
- `writing-skills` - Creating new skills
- `sharing-skills` - Contributing skills
- `condition-based-waiting` - Async operation patterns

## 🛠️ Scripts

### create-skill-zips.sh

Automatically creates ZIP files for all skills:

```bash
cd pro-setup
./create-skill-zips.sh
```

Output: `skill-zips/` directory with all skills packaged and ready to upload.

## 💡 Tips

1. **Start with 4 core skills** - Don't upload everything at once
2. **Use explicit invocation** - "Use test-driven-development skill for this"
3. **Track checklists manually** - TodoWrite isn't available in Desktop
4. **Update regularly** - Re-create ZIPs when skills are updated

## 🆘 Getting Help

- **Setup questions:** Read [SKILLS-ZIP-UPLOAD-GUIDE.md](SKILLS-ZIP-UPLOAD-GUIDE.md)
- **Skill usage:** Check individual skill content in `skills/` directory
- **Issues:** [GitHub Issues](https://github.com/obra/superpowers/issues)
- **Discussions:** [GitHub Discussions](https://github.com/obra/superpowers/discussions)

## 🔗 Related

- **Main Repository:** [obra/superpowers](https://github.com/obra/superpowers)
- **Claude Code Plugin:** Full experience with automation
- **Free Mode:** Alternative for non-Pro users

---

**Ready?** → [SKILLS-ZIP-UPLOAD-GUIDE.md](SKILLS-ZIP-UPLOAD-GUIDE.md)
