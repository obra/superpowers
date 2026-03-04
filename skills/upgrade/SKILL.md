---
name: upgrade
description: Use when user invokes /upgrade command or needs to upgrade from old horspowers versions - detects and migrates old version content and notifies about new features
---

# Horspowers Version Upgrade

## Overview

This skill handles version upgrades from horspowers 4.2.0 and earlier. It detects old directories and migrates documentation to the new unified structure. Also notifies users about new features in recent versions.

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

3. **Notify about new features** (if upgrading to 4.4.0+):

After successful upgrade, inform user about new features:

```
🎉 升级完成！ Horspowers v4.4.0 新功能：

📎 Beads 任务追踪集成
   自动将设计文档同步为 Epic，任务文档同步为 Task

   启用方式：在 .horspowers-config.yaml 中添加：

   beads:
     enabled: true
     auto_sync: true

   需要安装 beads CLI: https://github.com/steveyegge/beads

是否需要我现在帮你启用 beads 集成？
```

IF user wants to enable beads:
- Check if `.horspowers-config.yaml` exists
- Add beads configuration section
- Ask if they want to install beads CLI

4. **Answer any follow-up questions** about the upgrade process

## Command Line Options

The underlying script supports:
- `--skip-ddaw` - Skip DDAW directory detection/removal
- `--skip-docs` - Skip documentation migration
- `--quiet, -q` - Silent mode

## Files Modified

- Creates/updates `.horspowers-version` marker file
- May move `document-driven-ai-workflow/` to `.horspowers-trash/`
- May create/migrate files in `docs/` directory structure
- May update `.horspowers-config.yaml` to add new configuration options
