# 文档迁移指南

本指南帮助你从旧的文档系统迁移到统一的文档系统。

## 支持的迁移源

### 1. document-driven-ai-workflow

**特征**：
- 使用 `.docs/` 隐藏目录
- 文档类型：task, bug, decision, context
- 通常有 `.docs/active/` 和 `.docs/archive/`

### 2. 原始 horspowers 文档系统

**特征**：
- 使用 `docs/plans/` 目录
- 只有静态文档（design, plan）
- 没有状态追踪

### 3. 混合/自定义文档目录

**特征**：
- `docs/`、`doc/`、`document/` 等目录
- 自命名的文件
- 可能包含 Markdown 文档

## 迁移前准备

### 1. 备份现有文档

```bash
# 创建备份
cp -r .docs .docs.backup.$(date +%Y%m%d)
cp -r docs docs.backup.$(date +%Y%m%d)
```

### 2. 初始化新系统

```bash
# 运行初始化
/docs-init
```

这将创建统一的目录结构。

### 3. 检查迁移目标

```bash
# 检查新目录结构
ls docs/
ls docs/active/
ls docs/plans/
```

## 迁移步骤

### 步骤 1：检测文档目录

```bash
/docs-migrate
```

或直接运行：

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const detected = manager.detectDocDirectories();
console.log('Detected:', JSON.stringify(detected, null, 2));
"
```

**预期输出**：

```json
[
  {
    "path": ".docs",
    "type": "document-driven-ai-workflow"
  },
  {
    "path": "docs/plans",
    "type": "horspowers-legacy"
  }
]
```

### 步骤 2：分析源目录

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const analysis = manager.analyzeDocDirectory('.docs');
console.log(JSON.stringify(analysis, null, 2));
"
```

**预期输出**：

```json
{
  "totalFiles": 25,
  "byType": {
    "task": 10,
    "bug": 5,
    "decision": 7,
    "context": 3
  },
  "conflicts": [
    ".docs/active/task-1.md",
    "docs/active/task-1.md"
  ]
}
```

### 步骤 3：生成迁移计划

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const plan = manager.generateMigrationPlan('.docs');
console.log(JSON.stringify(plan, null, 2));
"
```

**预期输出**：

```json
{
  "sourceDir": ".docs",
  "targetDir": "docs",
  "documents": [
    {
      "source": ".docs/active/task-1.md",
      "target": "docs/active/2025-01-19-task-1.md",
      "type": "task",
      "action": "migrate"
    }
  ],
  "conflicts": [
    {
      "source": ".docs/active/task-1.md",
      "existing": "docs/active/task-1.md",
      "reason": "文件名已存在"
    }
  ]
}
```

### 步骤 4：预演迁移（Dry Run）

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const plan = manager.generateMigrationPlan('.docs');
const result = manager.executeMigration(plan, { dryRun: true, backup: true });
console.log('Dry run result:', JSON.stringify(result, null, 2));
"
```

这将显示：
- 将迁移哪些文件
- 将跳过哪些文件
- 将创建什么备份

### 步骤 5：执行迁移

**选项 A：自动迁移（推荐）**

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const plan = manager.generateMigrationPlan('.docs');
const result = manager.executeMigration(plan, {
  dryRun: false,
  backup: true,
  keepOriginal: false
});
console.log('Migration completed!');
console.log('Migrated:', result.migrated.length);
console.log('Failed:', result.failed.length);
console.log('Backup:', result.backup);
"
```

**选项 B：手动迁移**

对于每个文档：

1. 读取旧文档
2. 根据类型确定新位置
3. 更新文件名格式（添加日期前缀）
4. 复制到新位置
5. 验证内容

示例：

```bash
# 从 .docs/active/task-1.md 迁移到 docs/active/
OLD_DOC=".docs/active/task-1.md"
NEW_DOC="docs/active/2025-01-19-task-1.md"

# 读取旧文档
CONTENT=$(cat "$OLD_DOC")

# 添加迁移标记
echo "<!-- Migrated from $OLD_DOC on $(date) -->" > "$NEW_DOC"
echo "" >> "$NEW_DOC"
echo "$CONTENT" >> "$NEW_DOC"

echo "Migrated: $OLD_DOC -> $NEW_DOC"
```

### 步骤 6：验证迁移

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());

// 统计迁移后的文档
const stats = manager.getStats();
console.log('After migration:', JSON.stringify(stats, null, 2));

// 验证所有文档都存在
const validation = manager.validateMigration(plan);
console.log('Validation:', JSON.stringify(validation, null, 2));
"
```

### 步骤 7：清理旧文件（可选）

**⚠️ 警告：只有在确认迁移成功后才执行此步骤**

```bash
# 保留备份，删除原始目录
rm -rf .docs

# 或重命名以便追溯
mv .docs .docs.migrated.$(date +%Y%m%d)
```

## 处理冲突

### 冲突类型 1：同名文件

**问题**：目标目录已存在同名文件

**解决方案**：
1. 重命名迁移的文件
2. 跳过该文件
3. 合并内容

```bash
# 重命名策略
NEW_DOC="docs/active/2025-01-19-task-1-migrated.md"
```

### 冲突类型 2：类型不匹配

**问题**：文件名无法识别类型

**解决方案**：
1. 手动指定类型
2. 使用默认类型（context）

```bash
# 手动分类
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const classification = manager.classifyDocument('my-custom-file.md');
console.log('Type:', classification.type);
"
```

### 冲突类型 3：内容格式不同

**问题**：旧文档缺少必需字段

**解决方案**：
1. 添加默认字段
2. 标记需要手动更新
3. 保留原格式

## 特殊场景

### 场景 1：从 document-driven-bridge 迁移

如果你使用了 `document-driven-bridge` 技能：

1. **停止使用 bridge**：
   - 移除 bridge 配置
   - 删除 bridge 相关脚本

2. **迁移文档**：
   ```bash
   # 检测 bridge 目录
   /docs-migrate detect

   # 迁移到统一系统
   /docs-migrate execute .docs
   ```

3. **更新配置**：
   ```yaml
   # .horspowers-config.yaml
   documentation.enabled: true
   # 移除 bridge 相关配置
   ```

### 场景 2：多个文档源

如果项目有多个文档目录：

```bash
# 迁移每个源
for source in .docs docs/legacy documentation; do
    if [ -d "$source" ]; then
        echo "Migrating $source..."
        node -e "
        const DocsCore = require('./lib/docs-core.js');
        const manager = new DocsCore(process.cwd());
        const plan = manager.generateMigrationPlan('$source');
        const result = manager.executeMigration(plan, { backup: true });
        console.log('Result:', JSON.stringify(result, null, 2));
        "
    fi
done
```

### 场景 3：保留原始目录

如果需要保留原始目录：

```bash
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const plan = manager.generateMigrationPlan('.docs');
const result = manager.executeMigration(plan, {
  keepOriginal: true  // 不删除原始文件
});
"
```

## 迁移后清理

### 1. 验证所有文档

```bash
# 检查文档数量
/docs-stats

# 搜索特定文档
/docs-search "关键词"
```

### 2. 更新引用

如果其他文件引用了旧文档路径：

```bash
# 查找引用
grep -r "\.docs/" . --include="*.md" --include="*.txt"

# 批量替换
find . -name "*.md" -exec sed -i '' 's|\.docs/active/|docs/active/|g' {} \;
```

### 3. 更新技能调用

如果有脚本直接调用旧文档路径，需要更新：

```bash
# 旧方式
OLD_DOC=".docs/active/task-1.md"

# 新方式
NEW_DOC="docs/active/2025-01-19-task-1.md"
```

### 4. 测试工作流

验证迁移后的工作流：

1. 开始新功能 → 应创建决策/任务文档
2. 运行 TDD → 应创建 bug 文档（如有）
3. 完成任务 → 应归档文档
4. 新会话 → 应恢复上下文

## 回滚迁移

如果迁移出现问题：

### 从备份恢复

```bash
# 恢复备份
rm -rf docs
cp -r docs.backup.20250119 docs

# 或恢复 .docs
rm -rf .docs
cp -r .docs.backup.20250119 .docs
```

### 部分回滚

```bash
# 只恢复特定目录
cp -r docs.backup.20250119/active docs/
```

## 常见问题

### Q: 迁移会修改原始文件吗？

A: 默认不会。设置 `keepOriginal: false` 才会删除原始文件。建议先备份。

### Q: 迁移失败怎么办？

A: 检查：
1. 目录权限是否正确
2. 磁盘空间是否充足
3. 文件名是否包含特殊字符
4. 查看详细错误日志

### Q: 如何验证迁移成功？

A: 运行：
```bash
# 统计文档
/docs-stats

# 搜索测试
/docs-search "test"

# 验证特定文档
ls docs/active/ | grep task
```

### Q: 迁移后能否使用旧工作流？

A: 不推荐。统一系统提供了更好的集成和自动化。旧系统已标记为 deprecated。

### Q: 如何处理自定义文档格式？

A: 可以：
1. 手动调整格式
2. 继续使用自定义格式（分类为 context 类型）
3. 创建转换脚本

## 迁移检查清单

完成迁移前，确保：

- [ ] 已备份所有文档
- [ ] 已初始化统一文档系统
- [ ] 已检测所有文档源
- [ ] 已生成迁移计划
- [ ] 已预演迁移（dry run）
- [ ] 已执行迁移
- [ ] 已验证所有文档存在
- [ ] 已测试工作流集成
- [ ] 已更新文档引用
- [ ] 已清理原始文件（可选）

## 需要帮助？

如果遇到问题：

1. 查看 [统一文档系统指南](./unified-document-system.md)
2. 检查 [设计文档](./plans/2025-01-19-unified-document-system-design.md)
3. 在 GitHub 提交 issue
