# Superpowers for Claude Desktop

**Proven workflows for AI coding assistants, adapted for Claude Desktop.**

This distribution brings the Superpowers skills library to Claude Desktop users, with packages optimized for both Pro and Free subscription tiers.

## What Is This?

Superpowers is a comprehensive skills library providing:
- **Test-Driven Development** - RED-GREEN-REFACTOR cycle (mandatory)
- **Systematic Debugging** - 4-phase root cause process
- **Brainstorming** - Socratic design refinement
- **20+ Additional Skills** - Testing, collaboration, code review, git workflows

Originally built as a Claude Code plugin, this distribution adapts the skills for Claude Desktop with realistic expectations about what works without the full plugin system.

## Choose Your Path

### ⭐ Pro Users ($20/month)

**Best experience for Claude Desktop.**

- ✅ Full 20-skill library
- ✅ Persistent project knowledge
- ✅ Custom instructions
- ✅ One-time 15-minute setup
- ⚠️ Manual skill invocation (no automatic activation)
- ⚠️ Manual checklist tracking (no TodoWrite)

**→ [Get Started with Pro Setup](pro-setup/SETUP.md)**

### 💡 Free Users ($0)

**Limited but workable experience.**

- ✅ Core 3 workflows (TDD, debugging, brainstorming)
- ✅ Quick-reference cheat sheets
- ✅ 2-minute setup per session
- ❌ Must upload files each conversation
- ❌ No persistent knowledge
- ❌ No custom instructions
- ❌ No enforcement

**→ [Get Started with Free Mode](free-mode/QUICK-START.md)**

### 🚀 Claude Code Users (Recommended)

**Full experience with all features.**

If you have access to Claude Code, use the native plugin instead:

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

See [main repository](https://github.com/obra/superpowers) for details.

---

## Feature Comparison

| Feature | Claude Code Plugin | Desktop Pro | Desktop Free |
|---------|-------------------|-------------|--------------|
| **Automatic skill activation** | ✅ Yes | ❌ No | ❌ No |
| **Persistent skills** | ✅ Yes | ✅ Yes | ❌ No |
| **Custom instructions** | ✅ Yes | ✅ Yes | ❌ No |
| **TodoWrite tracking** | ✅ Yes | ⚠️ Manual | ⚠️ Manual |
| **Subagent spawning** | ✅ Yes | ❌ No | ❌ No |
| **Setup time** | 5 min | 15 min | 2 min/session |
| **Monthly cost** | $0* | $20 | $0 |
| **Skills available** | 20+ full | 20+ full | 3 core |
| **Context efficiency** | High | Medium | Low |
| **Enforcement** | Strong | Weak | None |

*If already using Claude Code

---

## What Works Well (All Tiers)

**Core workflows function without automation:**

1. **Test-Driven Development**
   - RED-GREEN-REFACTOR cycle
   - "Write test first" mandate
   - Verification steps

2. **Systematic Debugging**
   - 4-phase process
   - Root cause investigation
   - No-fix-without-understanding rule

3. **Brainstorming**
   - Socratic questioning
   - Alternative exploration
   - Incremental design validation

**These workflows are tool-agnostic and work great with manual invocation.**

## What Doesn't Work

**These features require Claude Code plugin:**

- ❌ Automatic skill activation based on task context
- ❌ SessionStart hooks for automatic setup
- ❌ TodoWrite tool for checklist tracking
- ❌ Task tool for spawning subagents
- ❌ Parallel execution workflows
- ❌ Mandatory enforcement mechanism

**Workarounds:**
- Manual skill invocation (you remember to use them)
- Explicit checklist tracking in responses
- Sequential instead of parallel workflows

---

## Philosophy

The workflows in this library are built on:

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Domain over implementation** - Work at problem level

---

## Quick Start (Choose Your Tier)

### Pro Users

1. Create new Project in Claude Desktop
2. Upload all files from `pro-setup/skills/`
3. Set custom instructions from `pro-setup/custom-instructions.txt`
4. Reference skills: "Use test-driven-development.md for this feature"

**[Full Pro Setup Guide →](pro-setup/SETUP.md)**

### Free Users

1. Download `free-mode/core-workflows.md`
2. Upload to each new conversation
3. Say: "Follow the workflows in core-workflows.md"
4. For quick reference, use cheat sheets in `free-mode/cheat-sheets/`

**[Full Free Quick-Start →](free-mode/QUICK-START.md)**

---

## Contents

```
superpowers-desktop/
├── README.md (you are here)
├── pro-setup/
│   ├── SETUP.md - Pro setup guide
│   ├── custom-instructions.txt - Custom instructions
│   └── skills/ - Full 20-skill library
│       ├── core/ - Start here
│       ├── testing/
│       ├── debugging/
│       ├── collaboration/
│       └── meta/
├── free-mode/
│   ├── QUICK-START.md - Free mode guide
│   ├── core-workflows.md - Condensed core skills
│   └── cheat-sheets/ - One-page references
│       ├── tdd-cheat-sheet.md
│       ├── debugging-cheat-sheet.md
│       └── brainstorming-cheat-sheet.md
└── conversion/ - Maintenance scripts
```

---

## Migration Paths

### From Free → Pro

**When to upgrade:**
- Tired of uploading files every session
- Want full skill library
- Need persistent project context

**What you gain:**
- Persistent skills (no reuploads)
- Custom instructions (automatic reminders)
- Full 20-skill library
- Better context management

**What you still won't have:**
- Automatic activation (still manual)
- TodoWrite tracking (still manual)
- Subagent spawning

### From Desktop Pro → Claude Code

**When to switch:**
- Want automatic skill activation
- Need TodoWrite tracking
- Want subagent workflows
- Want git-based auto-updates

**What you gain:**
- Everything. Full plugin experience.

---

## Maintenance & Updates

### For Users

**Pro users:**
- Watch for updates to this repository
- Download new skill files when available
- Re-upload to your project

**Free users:**
- Check for updated core-workflows.md
- Download and use in new conversations

### For Maintainers

See `conversion/README.md` for instructions on:
- Running conversion scripts
- Updating from plugin source
- Testing both Pro and Free packages
- Versioning and releases

---

## Support

- **Issues:** [https://github.com/obra/superpowers/issues](https://github.com/obra/superpowers/issues)
- **Original Plugin:** [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Marketplace:** [https://github.com/obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace)

---

## License

MIT License - see [LICENSE](../LICENSE) file for details.

---

## Acknowledgments

- **Original Superpowers Plugin:** Jesse Vincent ([@obra](https://github.com/obra))
- **Claude Desktop Adaptation:** This distribution
- **Community:** All contributors to the skills library

---

## Decision Guide

**Still not sure which path?**

**Use Claude Code Plugin if:**
- ✅ You have access to Claude Code
- ✅ You want the best experience
- ✅ You want automatic workflows

**Use Desktop Pro if:**
- ✅ You can't use Claude Code
- ✅ You're willing to pay $20/month
- ✅ You want full skills without reuploading
- ✅ Manual invocation is acceptable

**Use Desktop Free if:**
- ✅ You can't afford Pro
- ✅ You only need core workflows
- ✅ 2-minute setup per session is fine
- ✅ You understand the limitations

**Still unsure?** Start with Free mode. If you find it useful but tedious, upgrade to Pro. If you love it and want automation, switch to Claude Code.

---

**Ready to get started?**

- **[Pro Setup Guide →](pro-setup/SETUP.md)**
- **[Free Quick-Start →](free-mode/QUICK-START.md)**
