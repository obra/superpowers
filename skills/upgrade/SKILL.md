---
name: upgrade
description: Use when user invokes /upgrade command or needs to upgrade from old horspowers versions - detects and migrates old version content
---

# Horspowers Version Upgrade

## Overview

This skill handles version upgrades from horspowers 4.2.0 and earlier. It detects old directories and migrates documentation to the new unified structure.

**Announce at start:** "正在运行 Horspowers 版本升级助手..." (Running Horspowers version upgrade assistant...)

## Process

1. **Run the upgrade script**:

```bash
# From horspowers project root, run:
node lib/version-upgrade.js
```

The script will automatically:
- Detect current version from `.claude-plugin/plugin.json`
- Check if upgrade is needed (looks for `.horspowers-version` marker)
- Handle document-driven-ai-workflow directory if it exists
- Migrate documentation to unified structure
- Update version marker to current version

2. **Interpret script output** for the user

3. **Answer any follow-up questions** about the upgrade process

## Command Line Options

The underlying script supports:
- `--skip-ddaw` - Skip DDAW directory detection/removal
- `--skip-docs` - Skip documentation migration
- `--quiet, -q` - Silent mode

## Files Modified

- Creates/updates `.horspowers-version` marker file
- May move `document-driven-ai-workflow/` to `.horspowers-trash/`
- May create/migrate files in `docs/` directory structure
