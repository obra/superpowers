# claude-skills Maintenance Guide

## Overview

This repo is a private fork of [obra/superpowers](https://github.com/obra/superpowers) with native Codex integration. It replaces the official superpowers plugin via the `codex-integration` marketplace.

## Remotes

```
origin    https://github.com/sskys18/claude-skills.git   (your private repo)
upstream  https://github.com/obra/superpowers.git         (upstream source)
```

## Plugin Identity

| Field | Value |
|-------|-------|
| plugin.json name | `superpowers` (namespace prefix) |
| marketplace.json name | `codex-integration` |
| settings.json key | `superpowers@codex-integration` |
| Cache path | `~/.claude/plugins/cache/codex-integration/superpowers/5.0.7/` |

## After Making Changes

```bash
cd ~/Mine/claude-skills

# 1. Edit files, commit, push
git add -A && git commit -m "description" && git push origin main

# 2. Sync to plugin cache
rsync -a --delete \
  --exclude '.git' \
  ~/Mine/claude-skills/ \
  ~/.claude/plugins/cache/codex-integration/superpowers/5.0.7/

# 3. Restart Claude Code to pick up changes
```

## Syncing Upstream Updates

```bash
cd ~/Mine/claude-skills

# 1. Fetch upstream
git fetch upstream

# 2. Merge upstream changes
git merge upstream/main

# 3. Resolve conflicts (expected in these files)
#    - skills/brainstorming/SKILL.md
#    - skills/executing-plans/SKILL.md
#    - skills/subagent-driven-development/SKILL.md
#    - skills/requesting-code-review/SKILL.md
#    - skills/finishing-a-development-branch/SKILL.md
#    - .claude-plugin/marketplace.json
#    For each: keep upstream changes + re-add codex-gate references

# 4. Push and sync to cache
git push origin main
rsync -a --delete \
  --exclude '.git' \
  ~/Mine/claude-skills/ \
  ~/.claude/plugins/cache/codex-integration/superpowers/5.0.7/

# 5. Restart Claude Code
```

## Files Modified from Upstream

| File | What was changed |
|------|-----------------|
| `skills/codex-gate/SKILL.md` | NEW — Codex integration skill (3 parts) |
| `skills/brainstorming/SKILL.md` | Added Codex spec review step (checklist item 8, flow diagram, prose section) |
| `skills/executing-plans/SKILL.md` | Added `superpowers:codex-gate` to Integration section |
| `skills/subagent-driven-development/SKILL.md` | Added `superpowers:codex-gate` to Integration section |
| `skills/requesting-code-review/SKILL.md` | Added "After Code Review" section with codex-gate handoff |
| `skills/finishing-a-development-branch/SKILL.md` | Added codex-gate as prerequisite in Integration section |
| `.claude-plugin/marketplace.json` | Name set to `codex-integration`, owner to `sskys18` |

## Rollback

If something breaks:

```bash
# Re-enable official superpowers
# In ~/.claude/settings.json:
#   "superpowers@claude-plugins-official": true
#   "superpowers@codex-integration": false
# Restart Claude Code
```

## Key Config Files

- `~/.claude/settings.json` — `enabledPlugins` and `extraKnownMarketplaces`
- `~/.claude/plugins/installed_plugins.json` — install entry for `superpowers@codex-integration`
- `~/.claude/plugins/known_marketplaces.json` — marketplace registration
- `~/.claude/plugins/cache/codex-integration/superpowers/5.0.7/` — cached plugin files
