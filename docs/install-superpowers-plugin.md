# Installing Superpowers Plugin for Claude Code

> **For DESI / Digital Alchemy** - Quick setup guide

---

## Option 1: Official Claude Marketplace (Recommended)

In Claude Code, run:

```bash
/plugin install superpowers@claude-plugins-official
```

That's it. You're done. All 14 skills are now available automatically.

---

## Option 2: Community Marketplace

If Option 1 doesn't work, register the marketplace first:

```bash
/plugin marketplace add obra/superpowers-marketplace
```

Then install:

```bash
/plugin install superpowers@superpowers-marketplace
```

---

## What Happens After Install

1. **SessionStart hook activates** - Every new Claude session automatically loads the `using-superpowers` skill
2. **14 skills become available** - Claude can invoke them via the `Skill` tool
3. **Your CLAUDE.md still takes priority** - Superpowers explicitly states: user instructions > skills > defaults

## Compatibility with Your Existing Setup

| Your Existing Config | Conflict? | Notes |
|---------------------|-----------|-------|
| Stop hook (git check) | No conflict | Different lifecycle event (Stop vs SessionStart) |
| `settings.json` | No conflict | Your Skill permission already enabled |
| Plugin blocklist | No conflict | Superpowers is not blocked |
| Your CLAUDE.md | No conflict | Your instructions take priority per superpowers' own rules |

## Verify Installation

After installing, start a new Claude Code session. You should see superpowers load in the session context. Try:

```
/skill using-superpowers
```

If it loads the skill content, you're good.

## Using the Enhanced CLAUDE.md

After installing the plugin, copy the enhanced CLAUDE.md from `docs/enhanced-claude-md.md` to your local machine:

- **Global:** `~/.claude/CLAUDE.md` (applies to all projects)
- **Per-project:** `<project-root>/CLAUDE.md` (applies to one project)

The enhanced version includes your full vibe coding methodology plus 4 superpowers concepts (verification, debugging, skill invocation, subagent patterns) adapted to your style.

## Uninstalling

If you want to remove superpowers:

```bash
/plugin uninstall superpowers
```

Your CLAUDE.md and Stop hook are completely independent and won't be affected.

---

## For Cursor Users

If you also use Cursor:

```text
/add-plugin superpowers
```

Or search for "superpowers" in the Cursor plugin marketplace.

## More Info

- **Repo:** https://github.com/obra/superpowers
- **Author:** Jesse Vincent (obra)
- **License:** MIT
- **Version:** 5.0.4
