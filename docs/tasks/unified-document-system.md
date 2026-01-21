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

## 文档命名规范

### 统一前缀式命名

所有文档使用统一的**前缀式**命名规则：

```
YYYY-MM-DD-<type>-<slug>.md
```

| 部分 | 说明 | 示例 |
|------|------|------|
| `YYYY-MM-DD` | 创建日期（ISO 8601） | `2026-01-21` |
| `<type>` | 文档类型（小写） | `design`, `plan`, `task` |
| `<slug>` | 描述性标识符（kebab-case） | `user-authentication` |

### 完整示例

| 文档类型 | 文件名格式 | 示例 |
|---------|-----------|------|
| Design | `YYYY-MM-DD-design-<topic>.md` | `2026-01-21-design-user-authentication.md` |
| Plan | `YYYY-MM-DD-plan-<feature>.md` | `2026-01-21-plan-authentication-flow.md` |
| Task | `YYYY-MM-DD-task-<name>.md` | `2026-01-21-task-implement-login.md` |
| Bug | `YYYY-MM-DD-bug-<description>.md` | `2026-01-21-bug-login-crash.md` |
| Context | `YYYY-MM-DD-context-<topic>.md` | `2026-01-21-context-api-keys.md` |

**注意**：旧格式 `YYYY-MM-DD-<topic>-design.md`（后缀式）仍被支持，但建议迁移到新格式。参见 [迁移指南](./migration-guide.md)。

## 文档类型

### 设计文档 (Design)

**位置**：`docs/plans/YYYY-MM-DD-design-<topic>.md`

**创建时机**：使用 brainstorming 技能，**仅当有重要方案选择时**创建

**性质**：静态参考，长期保留

**模板结构**：
```markdown
# 设计: <标题>

## 基本信息
- 创建时间: YYYY-MM-DD
- 设计者: [待指定]
- 状态: [草稿/已批准/已实施]

## 设计背景
[描述需要设计的背景和原因]

## 设计方案

### 方案A
- 描述: [方案描述]
- 优点: [优点列表]
- 缺点: [缺点列表]

### 方案B
...

## 最终设计
**选择**: [选择的方案]
**理由**: [详细说明选择理由]

## 技术细节
[架构、组件、数据流等详细设计]

## 影响范围
[这个设计影响的模块/系统]

## 实施计划
1. [实施步骤1]
2. [实施步骤2]
3. [实施步骤3]

## 结果评估
[设计实施后的效果评估]

## 相关文档
- 计划文档: [../plans/YYYY-MM-DD-plan-<feature>.md](../plans/YYYY-MM-DD-plan-<feature>.md)
```

### 实施计划 (Plan)

**位置**：`docs/plans/YYYY-MM-DD-plan-<feature>.md`

**创建时机**：使用 writing-plans 技能创建详细计划时（必需）

**性质**：静态参考，长期保留

**模板结构**：
```markdown
# 计划: <功能名称>

## 基本信息
- 创建时间: YYYY-MM-DD
- 状态: [草稿/进行中/已完成]

## 目标
[清晰描述要实现的目标]

## 架构说明
[系统架构和组件关系]

## 技术栈
- [列出使用的技术]

## 实施步骤
1. [步骤1] (2-5分钟)
2. [步骤2] (2-5分钟)
3. [步骤3] (2-5分钟)

## 测试策略
[如何验证实施正确]

## 相关文档
- 设计文档: [YYYY-MM-DD-design-<topic>.md](../plans/YYYY-MM-DD-design-<topic>.md)
- 任务文档: [../active/YYYY-MM-DD-task-<name>.md](../active/YYYY-MM-DD-task-<name>.md)
```

### 任务追踪 (Task)

**位置**：`docs/active/YYYY-MM-DD-task-<name>.md`

**创建时机**：使用 writing-plans 技能开始实施时（必需）

**性质**：动态追踪，完成后归档

**模板结构**：
```markdown
# 任务: <任务名称>

## 基本信息
- 创建时间: YYYY-MM-DD
- 负责人: [待指定]
- 状态: [待开始/进行中/已完成/已阻塞]

## 任务描述
[清晰描述任务内容]

## 实施计划
[关联到 plan 文档的步骤]

## 验收标准
- [ ] [标准1]
- [ ] [标准2]
- [ ] [标准3]

## 进展记录
- YYYY-MM-DD: [进度更新]

## 相关文档
- 设计文档: [../plans/YYYY-MM-DD-design-<topic>.md](../plans/YYYY-MM-DD-design-<topic>.md)
- 计划文档: [../plans/YYYY-MM-DD-plan-<feature>.md](../plans/YYYY-MM-DD-plan-<feature>.md)
```

### Bug 追踪 (Bug)

**位置**：`docs/active/YYYY-MM-DD-bug-<description>.md`

**创建时机**：TDD RED phase 检测到意外失败时

**性质**：临时追踪，修复后删除

**生命周期**：
```
创建（TDD RED） → 更新（systematic-debugging） → 修复（TDD GREEN） → 删除（确认后）
```

**模板结构**：
```markdown
# Bug: <简短描述>

## 基本信息
- 发现时间: YYYY-MM-DD
- 严重程度: [低/中/高/紧急]
- 状态: [待修复/修复中/已修复/已验证]

## 问题描述
[清晰描述 bug 现象]

## 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

**预期行为**: [应该发生什么]
**实际行为**: [实际发生了什么]

## 根因分析
[使用 systematic-debugging 技能分析]

## 修复方案
[描述如何修复]

## 验证结果
- [ ] 测试通过
- [ ] 回归测试通过

## 相关任务
- 任务文档: [../active/YYYY-MM-DD-task-<name>.md](../active/YYYY-MM-DD-task-<name>.md)
```

### 上下文文档 (Context)

**位置**：`docs/context/YYYY-MM-DD-context-<topic>.md`

**创建时机**：需要记录项目特定上下文时

**性质**：静态参考，长期保留

**模板结构**：
```markdown
# 上下文: <主题>

## 基本信息
- 创建时间: YYYY-MM-DD
- 主题: [上下文主题]

## 内容
[项目特定信息、环境配置、依赖说明等]
```

## 文档复杂度控制

### 核心原则

借鉴 **Scrum 思想**：文档优先 + 敏捷开发

**CPU-内存-硬盘类比**：
- **AI (CPU)**：处理逻辑、运算、决策
- **上下文 (内存)**：快速存取，容量有限，易丢失
- **文档 (硬盘)**：持久化存储，容量大，长期读取
- **文档流转**：内存↔硬盘数据交换

### 每个需求的文档数量

**推荐上限：3 个核心文档**

| 阶段 | 文档类型 | 是否必需 | 说明 |
|------|---------|---------|------|
| 设计 | Design | 可选 | 仅重要方案选择时创建 |
| 计划 | Plan | 必需 | 详细实施步骤 |
| 执行 | Task | 必需 | 动态追踪进度 |
| 调试 | Bug | 临时 | 修复后删除 |

**文档生命周期**：
```
需求输入
    ↓
[brainstorming] → Design 文档（可选，静态参考）
    ↓
[writing-plans] → Plan 文档（必需，静态参考）
                 → Task 文档（必需，动态追踪）
    ↓
[开发执行] → Bug 文档（临时，修复后删除）
    ↓
[finishing] → Task 归档，Bug 删除
```

### 避免文档膨胀

**最小必要原则**：
1. 只创建真正需要的文档
2. 通过链接引用，避免重复内容
3. Bug 文档修复后立即删除
4. 定期归档已完成的任务

**复杂度警告**：
- 当核心文档超过 3 个时，系统会发出警告
- 审查是否每个文档都是必需的
- 考虑合并相关内容

### 文档流转机制

每个技能步骤有明确的**输入文档**（从硬盘加载到内存）和**输出文档**（从内存写回硬盘）：

```
[brainstorming]
输入：项目上下文（搜索现有 context、design）
输出：design 文档（可选）
    ↓
[writing-plans]
输入：design 文档路径（可选）
输出：plan 文档 + task 文档
    ↓
[subagent-driven-development]
输入：plan 文档、task 文档路径、design（可选）
输出：更新 task 文档进度
```

这种设计确保关键信息在工作流程中不丢失。

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

### 从旧格式迁移

如果你有旧格式文档（后缀式命名），请参考 [内部格式迁移指南](./migration-guide.md)。

**支持的迁移**：
- `YYYY-MM-DD-<topic>-design.md` → `YYYY-MM-DD-design-<topic>.md`
- `YYYY-MM-DD-decision-<title>.md` → `YYYY-MM-DD-design-<title>.md`

### 从外部系统迁移

如果从其他文档系统迁移到 Horspowers，请参考 [外部系统迁移指南](./document-migration-guide.md)。

## 相关文档

- [统一文档系统设计](../plans/2026-01-19-unified-document-system-design.md)
- [格式迁移指南](../migration-guide.md) ⭐ 新增
- [外部系统迁移指南](../document-migration-guide.md)
- [技能开发文档](../README.md)
