# SuperVibe 流程概览

> "Vibe Coding, Supervised" - 结构化的 AI 辅助开发流程

## 流程图

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────────┐    ┌─────────┐
│  Start  │───▶│ Design  │───▶│  Plan   │───▶│ Implement │───▶│ Finish  │
└─────────┘    └─────────┘    └─────────┘    └───────────┘    └─────────┘
     │              │              │               │               │
     ▼              ▼              ▼               ▼               ▼
  ADO:Active    brainstorming  writing-plans     TDD        code-review
                                              (dry-run跳过)   ADO:Closed
```

---

## Stage 1: Start

**目的：** 获取任务信息，确认理解需求

**触发：** `/supervibe {work-item-id}` 或 `/supervibe --dry-run {id}`

**操作：**
| 步骤 | 操作 | 命令/工具 |
|------|------|-----------|
| 1 | 获取 Work Item 详情 | `az boards work-item show --id {id}` |
| 2 | 获取依赖关系 | `az boards work-item relation list --id {id}` |
| 3 | 更新状态为 Active | `az boards work-item update --id {id} --state "Active"` |
| 4 | 添加启动 Comment | REST API (HTML 格式) |
| 5 | 确认用户理解需求 | 询问用户 |

**产出：**
- ADO State: `New` → `Active`
- ADO Comment: `🚀 任务启动`
- 本地状态文件: `.supervibe/current.json`

**Gate：** 用户确认理解需求

---

## Stage 2: Design

**目的：** 探索需求，设计技术方案

**依赖 Skill：** `brainstorming`

**操作：**
| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 调用 brainstorming skill | **必须首先调用** |
| 2 | 探索项目上下文 | 读取文件、检查结构 |
| 3 | 提问澄清需求 | 一次一个问题 |
| 4 | 提出 2-3 个方案 | 包含权衡分析 |
| 5 | 获取用户批准 | 分段确认设计 |
| 6 | 写设计文档 | 保存到 `docs/plans/` |
| 7 | 添加设计 Comment | REST API (HTML 格式) |

**产出：**
- 设计文档: `docs/plans/YYYY-MM-DD-{feature}-design.md`
- ADO Comment: `📐 设计完成`

**Gate：** 设计文档存在且已批准

---

## Stage 3: Plan

**目的：** 制定详细实施计划

**依赖 Skill：** `writing-plans`

**操作：**
| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 调用 writing-plans skill | **必须首先调用** |
| 2 | 基于设计文档创建计划 | 参考设计文档 |
| 3 | 拆分为 bite-sized 任务 | 每个任务 2-5 分钟 |
| 4 | 包含完整代码示例 | 不写 "添加验证" 这种模糊描述 |
| 5 | 可选：创建 ADO 子任务 | `az boards work-item create --type "Task"` |
| 6 | 添加计划 Comment | REST API (HTML 格式) |

**产出：**
- 实施计划: `docs/plans/YYYY-MM-DD-{feature}-implementation.md`
- ADO Comment: `📋 计划完成`
- 可选：ADO 子任务

**Gate：** 实施计划已确认

---

## Stage 4: Implement

**目的：** 按 TDD 方式实现代码

**依赖 Skill：** `test-driven-development`

**操作（正常模式）：**
| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 调用 TDD skill | **必须首先调用** |
| 2 | 写失败测试 | 先写测试 |
| 3 | 实现代码通过测试 | 最小实现 |
| 4 | 重构 | 保持测试通过 |
| 5 | 提交 | 频繁小提交 |
| 6 | 定期更新进度 Comment | REST API (HTML 格式) |

**操作（Dry Run 模式）：**
| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 显示任务列表 | 列出所有计划任务 |
| 2 | 显示跳过的文件 | 列出将生成的文件 |
| 3 | 添加 DRY RUN Comment | 记录跳过的内容 |
| 4 | 直接进入 Finish | 跳过代码生成 |

**产出：**
- 代码文件（正常模式）
- 测试文件（正常模式）
- Git 提交（正常模式）
- ADO Comment: `🔨 实现完成` 或 `🧪 [DRY RUN] 实现阶段`

**Gate：** 测试通过，代码已提交

---

## Stage 5: Finish

**目的：** 代码审查，完成任务

**依赖 Skill：** `requesting-code-review`

**操作：**
| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 调用 code-review skill | **必须首先调用** |
| 2 | 审查实现 vs 设计 | 确保符合设计文档 |
| 3 | 检查测试覆盖 | 确保关键路径有测试 |
| 4 | 验证验收标准 | 对照 Work Item |
| 5 | 生成完成摘要 | 列出所有产出物 |
| 6 | 添加完成 Comment | REST API (HTML 格式) |
| 7 | 更新状态为 Closed | `az boards work-item update --state "Closed"` |
| 8 | 检查依赖任务 | 通知可以开始的任务 |

**产出：**
- ADO State: `Active` → `Closed`
- ADO Comment: `✅ 任务完成`
- 本地状态归档: `.supervibe/history/{id}.json`

**Gate：** 代码审查通过

---

## 技能依赖总结

| 阶段 | 依赖 Skill | 调用方式 |
|------|------------|----------|
| Start | - | 无 |
| Design | `brainstorming` | `Skill(skill="brainstorming")` |
| Plan | `writing-plans` | `Skill(skill="writing-plans")` |
| Implement | `test-driven-development` | `Skill(skill="test-driven-development")` |
| Finish | `requesting-code-review` | `Skill(skill="requesting-code-review")` |

---

## ADO Comment 格式

**重要：** ADO Comments **必须使用 HTML 格式**，不支持 Markdown 渲染。

| 阶段 | Comment 标题 | HTML 示例 |
|------|-------------|-----------|
| Start | 🚀 任务启动 | `<h2>🚀 任务启动</h2><p>...</p>` |
| Design | 📐 设计完成 | `<h2>📐 设计完成</h2><table>...</table>` |
| Plan | 📋 计划完成 | `<h2>📋 计划完成</h2><ol>...</ol>` |
| Implement | 🔨 实现完成 | `<h2>🔨 实现完成</h2><ul>...</ul>` |
| Finish | ✅ 任务完成 | `<h2>✅ 任务完成</h2><table>...</table>` |

**HTML 标签参考：**
- 标题: `<h2>`, `<h3>`
- 段落: `<p>`
- 表格: `<table><tr><th>/<td>`
- 列表: `<ul><li>`, `<ol><li>`
- 粗体: `<strong>`
- 代码: `<code>`

---

## Dry Run 模式

**触发：** `/supervibe --dry-run {id}`

**行为差异：**

| 操作 | 正常模式 | Dry Run 模式 |
|------|----------|--------------|
| ADO 读取 | ✅ 执行 | ✅ 执行 |
| ADO 写入 (状态/Comment) | ✅ 执行 | ✅ 执行 |
| 调用 sub-skills | ✅ 执行 | ✅ 执行 |
| 写设计/计划文档 | ✅ 执行 | ✅ 执行 |
| 生成应用代码 | ✅ 执行 | ❌ 跳过 |
| Git 提交代码 | ✅ 执行 | ❌ 跳过 |

---

## 状态流转

```
ADO Work Item States:
New → Proposed → Committed → Active → Closed
                              ↑        ↑
                           Start    Finish
```

**SuperVibe 控制的状态：**
- Stage 1 (Start): 设置为 `Active`
- Stage 5 (Finish): 设置为 `Closed`

---

## 本地状态文件

**位置：** `.supervibe/current.json`

```json
{
  "workItemId": 7012823,
  "stage": "implement",
  "startedAt": "2026-02-28T10:00:00Z",
  "designDoc": "docs/plans/2026-02-28-feature-design.md",
  "planDoc": "docs/plans/2026-02-28-feature-implementation.md",
  "dryRun": false
}
```

**用途：** 恢复中断的会话
