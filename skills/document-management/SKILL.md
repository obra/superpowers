---
name: document-management
description: Use when user needs to manage, search, or organize project documentation. 中文触发场景：当用户说'文档管理'、'搜索文档'、'查看文档统计'、'初始化文档系统'、'迁移文档'等需要管理文档时使用此技能。
---

# Document Management

## Overview

Manage the unified documentation system for horspowers, including initialization, search, organization, and migration capabilities.

**IMPORTANT:** All documentation commands use `${CLAUDE_PLUGIN_ROOT}` environment variable to locate the `docs-core.js` module within the plugin installation directory. **DO NOT** check for `lib/docs-core.js` in the user's project directory.

**Announce at start:** "我正在使用文档管理技能..." (I'm using document-management...)

## When to Use

- Initialize document system for a project
- Search for existing documents
- View document statistics and status
- Migrate documents from legacy systems
- Archive or clean up completed documents
- Restore documents from archive

## Prerequisites

**Check if documentation is enabled:**

IF `.horspowers-config.yaml` does NOT exist OR `documentation.enabled` is not `true`:

```
文档系统未启用。需要先在配置文件中启用：

创建或编辑 .horspowers-config.yaml：
```yaml
development_mode: personal  # 或 team
branch_strategy: simple     # 或 worktree
testing_strategy: test-after  # 或 tdd
completion_strategy: merge   # 或 pr
documentation.enabled: true
```

是否现在创建配置文件？(yes/no)
```

IF user says "yes":
- Create `.horspowers-config.yaml` with recommended settings
- Ask user for development mode preference if not clear
- Continue with document initialization

## Core Commands

### Initialize Document System

**Check if already initialized:**
```bash
# Check if docs/ directory exists
ls docs/ 2>/dev/null || echo "Not initialized"
```

**IF not initialized:**
```bash
# Create directory structure using horspowers plugin
node -e "
const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());
const result = manager.init();
console.log(result.message);
"
```

Expected output:
```
Document system initialized at /path/to/project/docs/
Created directories: docs/plans, docs/active, docs/archive
Created metadata directory: .docs-metadata
```

**IF already initialized:**
```
文档系统已初始化。

当前状态：
- docs/plans/：静态文档（设计、计划）
- docs/active/：活跃状态追踪文档
- docs/archive/：已归档文档

是否需要重新初始化？(这不会删除现有文档) (yes/no)
```

### Search Documents

**Usage:** `/docs search <keyword> [options]`

**Options:**
- `--type <type>`: Filter by document type (design, plan, task, bug, decision, context)
- `--status <status>`: Filter by status (待开始, 进行中, 已完成, 已关闭, etc.)
- `--days <n>`: Only search documents modified in last n days
- `--active`: Only search in docs/active/
- `--plans`: Only search in docs/plans/

**Examples:**

Search for "authentication" across all documents:
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" search "authentication"
```

Search for bugs in last 7 days:
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" search "bug" --type bug --days 7
```

Search for active tasks:
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" search "" --type task --active
```

### Document Statistics

**Usage:** `/docs stats`

**Display:**
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" stats
```

Expected output:
```json
{
  "total": 45,
  "byType": {
    "design": 5,
    "plan": 8,
    "task": 12,
    "bug": 6,
    "decision": 10,
    "context": 4
  },
  "byStatus": {
    "待开始": 5,
    "进行中": 8,
    "已完成": 20,
    "已关闭": 10,
    "已归档": 2
  },
  "directories": {
    "plans": 13,
    "active": 22,
    "archive": 10
  }
}
```

**Present to user in readable format:**
```
## 文档统计

总文档数：45

按类型分类：
- 设计文档 (design): 5
- 实施计划 (plan): 8
- 任务追踪 (task): 12
- Bug 追踪 (bug): 6
- 决策记录 (decision): 10
- 上下文文档 (context): 4

按状态分类：
- 待开始: 5
- 进行中: 8
- 已完成: 20
- 已关闭: 10
- 已归档: 2

目录分布：
- docs/plans/: 13 个文档
- docs/active/: 22 个文档
- docs/archive/: 10 个文档
```

### Recent Documents

**Usage:** `/docs recent [days] [type]`

**Examples:**

Last 7 days, all types:
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" recent 7
```

Last 30 days, tasks only:
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" recent 30 task
```

**Present results grouped by type:**
```
## 最近 7 天的文档

### 任务 (3)
- 2025-01-19: 实现用户认证功能 (docs/active/2025-01-19-task-implement-auth.md)
- 2025-01-18: 修复登录超时问题 (docs/active/2025-01-18-bug-login-timeout.md)
- 2025-01-17: 重构 API 客户端 (docs/active/2025-01-17-task-refactor-api.md)

### 决策 (2)
- 2025-01-16: 选择状态管理方案 (docs/active/2025-01-16-decision-state-management.md)
```

### Archive Management

**Archive a specific document:**
```bash
node "\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js" archive docs/active/2025-01-15-task-old-feature.md
```

**Archive all completed documents:**
```bash
node -e "
const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());
const result = manager.archiveCompleted();
console.log(\`Archived \${result.archived.length} documents\`);
result.archived.forEach(doc => console.log('  - ' + doc));
"
```

**List archive contents:**
```bash
find docs/archive -name "*.md" -type f | sort
```

### Restore from Archive

**Usage:** `/docs restore <filename>`

**Example:**
```bash
node -e "
const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const fs = require('fs');
const manager = new UnifiedDocsManager(process.cwd());

// Find document in archive
const archivePath = 'docs/archive/2025-01-15-task-old-feature.md';
if (fs.existsSync(archivePath)) {
  // Restore to active (you may want to update the date)
  const restorePath = 'docs/active/restored-' + require('path').basename(archivePath);
  fs.copyFileSync(archivePath, restorePath);
  console.log('Restored to: ' + restorePath);
} else {
  console.log('Document not found in archive');
}
"
```

## Migration from Legacy Systems

### Detect Legacy Document Directories

**Usage:** `/docs migrate detect`

```bash
node -e "
const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());
const detected = manager.detectDocDirectories();
console.log('Detected document directories:');
detected.forEach(dir => {
  console.log('  - ' + dir.path + ' (type: ' + dir.type + ')');
});
"
```

**Expected output:**
```
Detected legacy document directories:
- .docs/ (document-driven-ai-workflow)
- docs/ (existing mixed content)
```

### Analyze Legacy Directory

**Usage:** `/docs migrate analyze <directory>`

```bash
node -e "
const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());
const analysis = manager.analyzeDocDirectory('.docs');
console.log('Analysis:', JSON.stringify(analysis, null, 2));
"
```

### Generate Migration Plan

**Usage:** `/docs migrate plan <directory>`

```bash
node -e "
const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
const manager = new UnifiedDocsManager(process.cwd());
const plan = manager.generateMigrationPlan('.docs');
console.log('Migration plan:');
console.log('  From: ' + plan.sourceDir);
console.log('  Documents to migrate: ' + plan.documents.length);
plan.documents.forEach(doc => {
  console.log('    - ' + doc.source + ' -> ' + doc.target);
});
console.log('  Conflicts: ' + plan.conflicts.length);
"
```

### Execute Migration

**Usage:** `/docs migrate execute <directory> [options]`

**Options:**
- `--dry-run`: Show what would be done without making changes
- `--backup`: Create backup before migrating
- `--keep-original`: Don't remove original files after migration

**Interactive flow:**

1. **Generate and present plan:**
   ```
   迁移计划：
   从 .docs/ 迁移到 docs/（统一文档系统）

   将迁移 15 个文档：
   - .docs/active/task-1.md -> docs/active/2025-01-19-task-1.md
   - .docs/plans/design-1.md -> docs/plans/2025-01-19-design-1.md
   ...

   发现 2 个冲突：
   - docs/active/task-1.md 已存在
   - docs/plans/design-1.md 已存在

   是否继续迁移？(yes/no/skip-conflicts)
   ```

2. **Handle conflicts if user chooses "skip-conflicts":**
   ```
   处理冲突：
   1. task-1.md: 重命名为 task-1-migrated.md
   2. design-1.md: 跳过（已存在）

   继续执行？(yes/no)
   ```

3. **Execute migration:**
   ```bash
   node -e "
   const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
   const manager = new UnifiedDocsManager(process.cwd());
   const plan = manager.generateMigrationPlan('.docs');
   const options = {
     dryRun: false,
     backup: true,
     keepOriginal: false
   };
   const result = manager.executeMigration(plan, options);
   console.log('Migration result:');
   console.log('  Migrated: ' + result.migrated.length);
   console.log('  Failed: ' + result.failed.length);
   console.log('  Conflicts: ' + result.conflicts.length);
   console.log('  Backup: ' + result.backup);
   "
   ```

4. **Validate migration:**
   ```bash
   node -e "
   const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
   const manager = new UnifiedDocsManager(process.cwd());
   const beforePlan = manager.generateMigrationPlan('.docs');
   const result = manager.executeMigration(beforePlan, {});
   const validation = manager.validateMigration(beforePlan);
   console.log('Validation:', JSON.stringify(validation, null, 2));
   "
   ```

## Quick Reference

| Command | Description |
|---------|-------------|
| `/docs init` | Initialize document system |
| `/docs search <keyword>` | Search documents |
| `/docs stats` | Show document statistics |
| `/docs recent [days]` | Show recent documents |
| `/docs archive <file>` | Archive a document |
| `/docs restore <file>` | Restore from archive |
| `/docs migrate detect` | Detect legacy directories |
| `/docs migrate plan <dir>` | Generate migration plan |
| `/docs migrate execute <dir>` | Execute migration |

## Common Workflows

### Start New Feature

1. User says "开始实现用户认证功能"
2. brainstorming skill creates design document
3. writing-plans skill creates task document
4. `$TASK_DOC` is set and tracked

### Track Bug Fix

1. TDD RED phase detects unexpected failure
2. Bug document created in `docs/active/`
3. `$BUG_DOC` is set
4. GREEN phase updates bug document with fix

### Complete Work

1. finishing-a-development-branch skill runs
2. Task document marked as completed
3. Auto-archived to `docs/archive/`
4. Environment variables cleared

### Resume Work

1. New session starts
2. Session Start Hook reads `.docs-metadata/last-session.json`
3. `$TASK_DOC` and `$BUG_DOC` restored
4. User sees context from previous session

## Integration with Workflow Skills

**brainstorming:**
- Creates decision documents in `docs/active/`
- Sets `$DECISION_DOC` environment variable

**writing-plans:**
- Creates task documents in `docs/active/`
- Sets `$TASK_DOC` environment variable
- Links to related design documents

**test-driven-development:**
- RED phase creates bug documents when tests fail unexpectedly
- GREEN phase updates bug documents with fix details
- Sets `$BUG_DOC` environment variable

**finishing-a-development-branch:**
- Marks task/bug documents as completed
- Archives completed documents
- Clears environment variables

## Error Handling

**Document not found:**
```
错误：文档不存在：docs/active/2025-01-19-task-missing.md

提示：使用 /docs search 搜索文档
```

**Migration conflict:**
```
错误：目标文档已存在：docs/active/task-1.md

选项：
1. 跳过此文档
2. 重命名为 task-1-migrated.md
3. 覆盖现有文档（不推荐）

请选择 (1/2/3):
```

**Permission denied:**
```
错误：无法写入目录 docs/active/

请检查：
1. 目录是否存在
2. 是否有写权限

运行: mkdir -p docs/active && chmod u+w docs/active
```

## Best Practices

- Always initialize before using other commands
- Search before creating new documents to avoid duplicates
- Archive completed documents regularly to keep `docs/active/` clean
- Use migration tools when adopting the unified system
- Keep document titles descriptive and searchable
- Update document status as work progresses
- Review and update archived documents if work resumes

## Troubleshooting

**Documents not being tracked:**
- Check that `documentation.enabled: true` in config
- Verify plugin is properly installed: `claude plugin list`
- Check that `${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js` exists in the plugin directory
- Try updating the plugin: `claude plugin update horspowers@horspowers-dev`

**Migration not finding documents:**
- Verify source directory path is correct
- Check directory permissions
- Ensure documents have `.md` extension

**Auto-archive not working:**
- Check Session End Hook is registered in `hooks/hooks.json`
- Verify document status is set to "已完成" or "已关闭"
- Check that document is in `docs/active/`, not `docs/plans/`
