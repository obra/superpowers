# 统一文档系统 - 用户指南

## 概述

Horspowers 的统一文档系统提供了集成的文档管理功能，与开发工作流深度集成。文档会随着你的工作自动创建、更新和归档。

## 核心特性

- **自动追踪**：文档状态随开发进度自动更新
- **工作流集成**：与 brainstorming、TDD、writing-plans 等技能无缝集成
- **智能归档**：完成的任务和修复的 bug 自动归档
- **会话恢复**：下次会话自动恢复上下文
- **全文搜索**：快速查找任何文档

## 快速开始

### 1. 启用文档系统

在项目根目录创建 `.horspowers-config.yaml`：

```yaml
development_mode: personal  # 或 team
branch_strategy: simple     # 或 worktree
testing_strategy: test-after  # 或 tdd
completion_strategy: merge   # 或 pr
documentation.enabled: true
```

### 2. 初始化文档目录

运行：`/docs-init`

或使用技能：Invoke `horspowers:document-management`

这将创建：
- `docs/plans/` - 静态文档（设计、计划）
- `docs/active/` - 活跃状态追踪文档
- `docs/archive/` - 已归档的文档
- `.docs-metadata/` - 元数据和会话追踪

### 3. 开始使用

文档会在你使用各种技能时自动创建：

- **brainstorming**：创建决策文档
- **writing-plans**：创建任务追踪文档
- **test-driven-development**：创建 bug 追踪文档
- **finishing-a-development-branch**：归档完成的文档

## 文档类型

### 设计文档 (Design)

位置：`docs/plans/YYYY-MM-DD-<topic>-design.md`

创建时机：使用 brainstorming 技能完成设计后

内容：
- 决策背景
- 可选方案比较
- 最终决策及理由
- 影响范围
- 实施计划

### 实施计划 (Plan)

位置：`docs/plans/YYYY-MM-DD-<feature-name>.md`

创建时机：使用 writing-plans 技能创建详细计划后

内容：
- 目标描述
- 架构说明
- 技术栈
- 详细任务步骤
- 测试策略

### 任务追踪 (Task)

位置：`docs/active/YYYY-MM-DD-task-<name>.md`

创建时机：使用 writing-plans 技能开始实施时

内容：
- 任务描述
- 实施计划
- 验收标准
- 进展记录（自动更新）
- 相关文档链接

### Bug 追踪 (Bug)

位置：`docs/active/YYYY-MM-DD-bug-<description>.md`

创建时机：TDD RED phase 检测到意外失败时

内容：
- 问题描述
- 复现步骤
- 状态（待修复 → 已修复 → 已关闭）
- 修复方案
- 验证结果

### 决策记录 (Decision)

位置：`docs/active/YYYY-MM-DD-decision-<title>.md`

创建时机：brainstorming 技能遇到重要技术选择时

内容：
- 决策背景
- 可选方案
- 最终决策
- 影响范围
- 实施计划

### 上下文文档 (Context)

位置：`docs/active/YYYY-MM-DD-context-<topic>.md`

创建时机：需要记录项目特定上下文时

内容：
- 项目特定信息
- 环境配置
- 依赖说明
- 注意事项

## 工作流集成

### 场景 1：开发新功能

1. **设计阶段**
   ```
   用户：帮我设计一个用户认证功能
   → brainstorming 技能启动
   → 创建决策文档（如果有重要选择）
   → 保存设计文档到 docs/plans/
   ```

2. **计划阶段**
   ```
   用户：开始实施这个功能
   → writing-plans 技能启动
   → 创建任务追踪文档到 docs/active/
   → 设置 $TASK_DOC 环境变量
   ```

3. **开发阶段**
   ```
   用户：开始写代码
   → test-driven-development 技能启动
   → 如果发现意外 bug，创建 bug 文档
   → 设置 $BUG_DOC 环境变量
   → 自动更新任务进度
   ```

4. **完成阶段**
   ```
   用户：功能做完了
   → finishing-a-development-branch 技能启动
   → 任务文档标记为已完成
   → 自动归档到 docs/archive/
   → 清除环境变量
   ```

### 场景 2：修复 Bug

1. **RED Phase**：测试意外失败
   ```
   → 自动创建 bug 文档
   → 记录失败信息
   → 设置 $BUG_DOC
   ```

2. **GREEN Phase**：修复并验证
   ```
   → 更新 bug 文档状态为"已修复"
   → 记录修复方案
   → 记录验证结果
   ```

3. **完成**：合并代码
   ```
   → bug 文档标记为"已关闭"
   → 自动归档
   ```

### 场景 3：会话恢复

1. **会话结束时**
   ```
   → Session End Hook 运行
   → 保存会话元数据到 .docs-metadata/last-session.json
   → 记录 $TASK_DOC 和 $BUG_DOC 路径
   ```

2. **新会话开始**
   ```
   → Session Start Hook 运行
   → 读取 last-session.json
   → 恢复 $TASK_DOC 和 $BUG_DOC 环境变量
   → 显示活跃文档列表
   ```

3. **继续工作**
   ```
   用户：继续上次的任务
   → AI 已经知道 $TASK_DOC 的路径
   → 可以直接更新进度
   ```

## 常用命令

| 命令 | 功能 |
|------|------|
| `/docs-init` | 初始化文档系统 |
| `/docs-search <关键词>` | 搜索文档 |
| `/docs-stats` | 查看文档统计 |
| `/docs-migrate` | 迁移旧文档 |

## 搜索和过滤

### 按关键词搜索

```
用户：搜索关于认证的文档
→ 运行：node lib/docs-core.js search "认证"
→ 显示所有匹配的文档
```

### 按类型过滤

```
用户：显示所有任务
→ 运行：node lib/docs-core.js search "" --type task
→ 显示所有任务文档
```

### 按状态过滤

```
用户：显示进行中的任务
→ 运行：node lib/docs-core.js search "" --type task --status 进行中
→ 显示所有进行中的任务
```

### 按时间过滤

```
用户：显示最近 7 天的文档
→ 运行：node lib/docs-core.js recent 7
→ 显示最近 7 天修改的文档
```

## 文档统计

运行 `/docs-stats` 查看项目文档概览：

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
  }
}
```

## 自动化功能

### 自动归档

完成的任务和修复的 bug 会自动归档：

- 触发时机：finishing-a-development-branch 技能运行时
- 归档条件：状态为"已完成"或"已关闭"
- 归档位置：`docs/archive/`

### 自动进度更新

文档会在以下时机自动更新：

- 会话结束时：添加会话记录（时间、目录、分支）
- TDD GREEN phase：更新 bug 文档的修复信息
- 任务完成时：更新任务文档的验收结果

### 自动会话恢复

下次会话开始时：

- 读取 `.docs-metadata/last-session.json`
- 恢复 `$TASK_DOC` 和 `$BUG_DOC` 环境变量
- 显示最近活跃的文档列表

## 最佳实践

### 1. 保持文档简洁

- 只记录必要信息
- 避免过度详细
- 链接到相关文档而非重复

### 2. 及时更新状态

- 任务开始时设置状态为"进行中"
- 完成时设置为"已完成"
- 遇到阻塞时记录阻塞原因

### 3. 使用有意义的标题

- 好标题：`task-implement-user-authentication`
- 差标题：`task-1`、`todo`

### 4. 定期归档

- 已完成的任务会自动归档
- 旧的设计文档可以手动归档
- 保持 `docs/active/` 整洁

### 5. 利用搜索

- 创建新文档前先搜索，避免重复
- 使用具体关键词搜索
- 按类型和时间过滤结果

## 故障排除

### 文档未自动创建

**症状**：使用技能后没有创建文档

**解决**：
1. 检查 `documentation.enabled: true` 在配置中
2. 验证 `lib/docs-core.js` 存在
3. 检查目录权限

### 环境变量丢失

**症状**：`$TASK_DOC` 或 `$BUG_DOC` 为空

**解决**：
1. 检查 `.docs-metadata/last-session.json` 是否存在
2. 验证文档路径是否正确
3. 手动设置：`export TASK_DOC="docs/active/...`

### 自动归档不工作

**症状**：完成的任务没有归档

**解决**：
1. 检查文档状态是否为"已完成"
2. 验证文档在 `docs/active/` 而非 `docs/plans/`
3. 检查 Session End Hook 是否注册

## 迁移指南

如果你在使用旧的文档系统，请参考 [文档迁移指南](./document-migration-guide.md)。

## 相关文档

- [设计文档](./plans/2025-01-19-unified-document-system-design.md)
- [迁移指南](./document-migration-guide.md)
- [技能开发文档](../README.md)
