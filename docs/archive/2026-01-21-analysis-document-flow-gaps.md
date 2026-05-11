# Horspowers 文档流转体系分析

**分析时间**: 2026-01-21
**分析方法**: 基于 CPU-内存-硬盘 类比
**目标**: 识别文档流转的遗漏点和优化机会

## 核心思想回顾

```
┌─────────────────────────────────────────────────────────┐
│                    AI 开发工作流                          │
├─────────────────────────────────────────────────────────┤
│  AI (CPU)           →  处理逻辑、运算、决策               │
│  上下文 (内存)       →  快速存取，容量有限，易丢失         │
│  文档 (硬盘)         →  持久化存储，容量大，长期读取       │
│  文档流转           →  内存↔硬盘数据交换                  │
└─────────────────────────────────────────────────────────┘
```

**核心原则**：
1. **信息持久化分层存储**：关键信息从内存（上下文）持久化到硬盘（文档）
2. **文档流转即数据交换**：技能间通过文档传递数据，而非通过上下文堆叠
3. **避免内存溢出**：按需从文档加载到上下文，避免信息丢失

---

## 当前技能分类（基于文档交互）

### 🟢 已集成文档的技能

| 技能 | 输入文档 | 输出文档 | 更新文档 |
|------|---------|---------|---------|
| **brainstorming** | context, design | design | - |
| **writing-plans** | design | plan, task | - |
| **subagent-driven-development** | plan, task, design | - | task |
| **executing-plans** | plan, task | - | task (检查点) |
| **test-driven-development** | task | bug | task, bug |
| **requesting-code-review** | task, design, plan | - | task |
| **systematic-debugging** | bug, task | - | bug |
| **finishing-a-development-branch** | task, bug | - | task → archive, bug → delete |
| **dispatching-parallel-agents** | task, plan | - | task |

### 🟡 部分集成/可能遗漏的技能

| 技能 | 当前状态 | 潜在问题 | 建议 |
|------|---------|---------|------|
| **verification-before-completion** | ❌ 无文档集成 | 验证结果未持久化 | 应写入 task 文档 |
| **automated-development-workflow** | ❌ 无文档集成 | 工作流执行无记录 | 应创建/更新 workflow 文档 |
| **using-git-worktrees** | ⚠️ 间接关联 | worktree 路径未记录 | 应在 task 文档中记录 |
| **receiving-code-review** | ⚠️ 间接关联 | 反馈未持久化 | 应写入 task 文档 |

### 🔴 元技能（不需要文档集成）

| 技能 | 原因 |
|------|------|
| **using-horspowers** | 元技能，介绍其他技能 |
| **writing-skills** | 元技能，创建技能文档 |
| **document-management** | 文档管理工具本身 |

---

## 遗漏识别

### 1. **verification-before-completion** - 验证结果未持久化

**问题描述**：
- 验证技能只确保在声明完成前运行验证
- 但验证结果（测试输出、lint 结果）没有持久化到文档
- 如果会话中断，验证信息丢失

**CPU-内存-硬盘 分析**：
- 当前：验证结果只存在于内存（上下文）
- 问题：会话结束即丢失，无法跨会话追溯
- 应该：写入硬盘（task 文档）持久化

**建议集成方案**：

```markdown
#### verification-before-completion

**输入文档**：task 文档路径
**输出更新**：task 文档的"验证记录"部分

**新增字段到 task 模板**：
```markdown
## 验证记录
- [时间戳] 测试验证：✅ 通过 (34/34)
- [时间戳] 类型检查：✅ 无错误
- [时间戳] Lint 检查：✅ 无警告
```

**技能更新要点**：
1. 读取 $TASK_DOC 环境变量
2. 运行验证命令
3. 将验证结果追加到 task 文档的"验证记录"部分
4. 在 finishing-a-development-branch 时检查验证记录
```

---

### 2. **automated-development-workflow** - 工作流执行无记录

**问题描述**：
- 自动化工作流执行 commit、push、merge 等操作
- 但执行历史没有记录，无法追溯
- 与任务文档脱节

**CPU-内存-硬盘 分析**：
- 当前：工作流执行只存在于内存（上下文）
- 问题：无法追溯何时做了什么 commit/merge
- 应该：写入硬盘（task 或 workflow 文档）

**建议集成方案**：

```markdown
#### automated-development-workflow

**输入文档**：task 文档路径（可选）
**输出更新**：task 文档的"Git 操作记录"部分

**新增字段到 task 模板**：
```markdown
## Git 操作记录
- [时间戳] commit: "feat: 添加用户认证" (abc1234)
- [时间戳] push: origin → feat/user-auth
- [时间戳] merge: feat/user-auth → develop
```

**或者创建独立的 workflow 文档**：
类型：`workflow`
命名：`YYYY-MM-DD-workflow-daily-commit.md`
位置：`docs/active/` → 完成后归档

**技能更新要点**：
1. 如果 $TASK_DOC 存在，更新 task 文档
2. 如果不存在，创建 workflow 文档
3. 记录每个 git 操作（commit、push、merge）
```

---

### 3. **using-git-worktrees** - worktree 路径未记录

**问题描述**：
- 创建 worktree 后，路径信息只在上下文中
- 新会话无法知道 worktree 在哪里
- 与任务文档脱节

**CPU-内存-硬盘 分析**：
- 当前：worktree 路径只存在于内存（上下文）
- 问题：会话结束后无法找到 worktree
- 应该：写入硬盘（task 文档或元数据）

**建议集成方案**：

```markdown
#### using-git-worktrees

**输入文档**：无（通常在 brainstorming 之后，writing-plans 之前）
**输出更新**：task 文档（如果已创建）或元数据

**方案 A：更新 task 文档**
在 task 模板中添加：
```markdown
## 开发环境
- Worktree 路径: `.worktrees/feature-name`
- 分支: `feat/feature-name`
- 创建时间: [时间戳]
```

**方案 B：使用元数据文件**
在 `.docs-metadata/worktree.json` 中记录：
```json
{
  "activeWorktree": {
    "path": ".worktrees/feature-name",
    "branch": "feat/feature-name",
    "taskDoc": "docs/active/YYYY-MM-DD-task-feature.md",
    "createdAt": "2026-01-21T10:00:00Z"
  }
}
```

**技能更新要点**：
1. 创建 worktree 后，检查 $TASK_DOC 是否存在
2. 如果存在，更新 task 文档的"开发环境"部分
3. 如果不存在，更新元数据文件
```

---

### 4. **receiving-code-review** - 反馈未持久化

**问题描述**：
- 收到 code review 反馈后，只在上下文中处理
- 反馈内容和改进计划没有持久化
- 无法追溯 review 历史

**CPU-内存-硬盘 分析**：
- 当前：review 反馈只存在于内存（上下文）
- 问题：会话结束后无法追溯 review 历史
- 应该：写入硬盘（task 文档）

**建议集成方案**：

```markdown
#### receiving-code-review

**输入文档**：task 文档路径
**输出更新**：task 文档的"Code Review 记录"部分

**新增字段到 task 模板**：
```markdown
## Code Review 记录

### Review 1: [时间戳]
**审查者**: [姓名/AI]
**状态**: ⏳ 待处理 / ✅ 已解决

**反馈**：
1. [问题 1]
   - 位置: `src/file.ts:42`
   - 建议: [具体建议]
   - 优先级: 高/中/低

2. [问题 2]
   ...

**改进计划**：
- [ ] [改进项 1]
- [ ] [改进项 2]

**解决时间**: [时间戳]
```

**技能更新要点**：
1. 读取 $TASK_DOC 环境变量
2. 解析 review 反馈
3. 将反馈写入 task 文档的"Code Review 记录"部分
4. 更新任务状态为"根据反馈改进"
```

---

## 流程优化建议

### 当前流程 vs 优化后流程

#### 场景：完整开发周期（含 review）

**当前流程**：
```
brainstorming → design
writing-plans → plan + task
using-git-worktrees → worktree (路径未记录)
subagent-driven-development → 更新 task
test-driven-development → 可能创建 bug
requesting-code-review → review (反馈未记录)
[收到反馈]
receiving-code-review → 处理反馈 (未记录)
verification-before-completion → 验证 (结果未记录)
finishing-a-development-branch → 归档
```

**问题**：
1. worktree 路径丢失
2. review 反馈未记录
3. 验证结果未记录
4. 无法追溯完整历史

**优化后流程**：
```
brainstorming → design (硬盘)
    ↓
writing-plans → plan (硬盘) + task (硬盘)
    ↓
using-git-worktrees → 更新 task.开发环境 (硬盘)
    ↓
subagent-driven-development → 更新 task.进度 (硬盘)
    ↓
test-driven-development → 可能创建 bug (硬盘)
    ↓
requesting-code-review → review (内存)
    ↓
[收到反馈]
receiving-code-review → 更新 task.code_review记录 (硬盘)
    ↓
verification-before-completion → 更新 task.验证记录 (硬盘)
    ↓
finishing-a-development-branch → 归档 task, 删除 bug
```

---

## 新增文档类型建议

基于 CPU-内存-硬盘 思想，建议新增以下文档类型：

### 1. **workflow** 文档（可选）

**用途**：记录自动化工作流执行历史
**命名**：`YYYY-MM-DD-workflow-<operation>.md`
**位置**：`docs/active/` → 完成后归档
**生命周期**：临时，执行后归档

**模板**：
```markdown
# 工作流执行: <操作名称>

## 基本信息
- 执行时间: ${date}
- 操作类型: [commit/push/merge/sync]
- 分支: [branch-name]
- 关联任务: [task 文档链接]

## 执行步骤
1. [步骤 1]
2. [步骤 2]

## 执行结果
- 状态: [成功/失败]
- Commit: [hash]
- 变更文件: [列表]

## 错误处理（如有）
[错误信息和解决方案]
```

---

## 实施优先级

### P0（高优先级）- 核心数据丢失风险

1. **verification-before-completion**：验证结果必须持久化
   - 影响：无法追溯验证历史
   - 实施：更新 task 模板，添加"验证记录"字段

2. **using-git-worktrees**：worktree 路径必须记录
   - 影响：会话结束后无法找到 worktree
   - 实施：更新 task 模板，添加"开发环境"字段

### P1（中优先级）- 流程完整性

3. **receiving-code-review**：反馈必须持久化
   - 影响：无法追溯 review 历史
   - 实施：更新 task 模板，添加"Code Review 记录"字段

4. **automated-development-workflow**：工作流执行应记录
   - 影响：无法追溯 git 操作历史
   - 实施：更新 task 文档或创建 workflow 文档

### P2（低优先级）- 增强功能

5. **dispatching-parallel-agents**：子代理执行详细日志
   - 影响：并行执行历史不详细
   - 实施：在 task 文档中记录每个子代理的执行细节

---

## 新增文档类型详细设计：workflow 文档

### 核心理念

workflow 文档不是某个技能的输出，而是**整个工作流的运行日志**。它需要一个 **hook 机制**，让所有技能都能随时写入。

### Hook 机制设计

#### 方案 A：文档更新 Hook（推荐）

**核心思想**：在每个技能的"写入硬盘"阶段，自动调用 hook 更新 workflow 文档

```javascript
// 在 lib/docs-core.js 中添加
class UnifiedDocsManager {
    /**
     * 记录工作流执行步骤（Hook 调用）
     * @param {string} skillName - 技能名称
     * @param {string} action - 执行的动作
     * @param {object} details - 详细信息
     */
    logWorkflowStep(skillName, action, details = {}) {
        const workflowDoc = this.getActiveWorkflowDoc();

        if (!workflowDoc) {
            // 如果没有活跃的 workflow 文档，创建一个
            this.createWorkflowDocument();
        }

        // 追加执行记录
        const timestamp = new Date().toISOString();
        const logEntry = `
### [${timestamp}] ${skillName}: ${action}

**状态**: ${details.status || '进行中'}
${details.input ? `**输入**: ${details.input}` : ''}
${details.output ? `**输出**: ${details.output}` : ''}
${details.error ? `**错误**: ${details.error}` : ''}
${details.notes ? `**备注**: ${details.notes}` : ''}

---

`;

        this.appendToFile(workflowDoc.path, logEntry);
        return { success: true };
    }

    /**
     * 获取当前活跃的 workflow 文档
     */
    getActiveWorkflowDoc() {
        const metadataFile = path.join(this.metadataDir, 'active-workflow.txt');
        if (fs.existsSync(metadataFile)) {
            const workflowPath = fs.readFileSync(metadataFile, 'utf8').trim();
            if (fs.existsSync(workflowPath)) {
                return { path: workflowPath };
            }
        }
        return null;
    }

    /**
     * 创建新的 workflow 文档
     */
    createWorkflowDocument() {
        const date = new Date().toISOString().slice(0, 10);
        const filename = `${date}-workflow-session-${Date.now()}.md`;
        const filepath = path.join(this.activeDir, filename);

        // 记录为活跃 workflow
        fs.writeFileSync(
            path.join(this.metadataDir, 'active-workflow.txt'),
            filepath,
            'utf8'
        );

        // 创建初始内容
        const initialContent = `# 工作流执行日志

## 基本信息
- 开始时间: ${new Date().toISOString()}
- 会话 ID: ${this.generateSessionId()}
- 关联任务: ${process.env.TASK_DOC || '无'}

## 执行记录

---

`;

        fs.writeFileSync(filepath, initialContent, 'utf8');
        return { success: true, path: filepath };
    }
}
```

#### 方案 B：Session Hook（更自动）

**在 session start/end hook 中自动管理**

```bash
# hooks/session-start.sh
# 创建新的 workflow 文档
WORKFLOW_DOC=$(node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const result = manager.createWorkflowDocument();
console.log(result.path);
")
export WORKFLOW_DOC
```

```bash
# hooks/session-end.sh
# 归档 workflow 文档
if [ -n "$WORKFLOW_DOC" ]; then
    # 移动到 archive
    mv "$WORKFLOW_DOC" "docs/archive/"
fi
```

### 技能集成模式

每个技能在关键节点调用 hook：

```markdown
#### brainstorming 示例

**开始时**：
```javascript
manager.logWorkflowStep('brainstorming', '开始头脑风暴', {
    input: '用户需求',
    status: '进行中'
});
```

**结束时**：
```javascript
manager.logWorkflowStep('brainstorming', '完成设计', {
    status: '完成',
    output: 'design 文档已创建：docs/plans/...md',
    notes: '包含 3 个技术方案选择'
});
```

---

### Workflow 文档模板

```markdown
# 工作流执行日志

## 基本信息
- 开始时间: 2026-01-21T10:00:00Z
- 会话 ID: session-abc123
- 关联任务: docs/active/YYYY-MM-DD-task-feature.md

## 执行记录

### [2026-01-21T10:00:00Z] brainstorming: 开始头脑风暴

**状态**: 进行中
**输入**: 用户需求：添加用户认证功能

### [2026-01-21T10:15:00Z] brainstorming: 完成设计

**状态**: 完成
**输出**: design 文档已创建：docs/plans/2026-01-21-design-user-auth.md
**备注**: 包含 3 个技术方案选择，最终选择 JWT 认证

---

### [2026-01-21T10:20:00Z] writing-plans: 开始创建计划

**状态**: 进行中
**输入**: design 文档：docs/plans/2026-01-21-design-user-auth.md

### [2026-01-21T10:45:00Z] writing-plans: 完成计划

**状态**: 完成
**输出**:
- plan 文档：docs/plans/2026-01-21-plan-user-auth.md
- task 文档：docs/active/2026-01-21-task-user-auth.md

---

### [2026-01-21T11:00:00Z] using-git-worktrees: 创建 worktree

**状态**: 完成
**输出**: worktree 创建在 .worktrees/feat-user-auth
**备注**: 分支 feat/user-auth

---

## 总结

- 总执行时间: 2 小时
- 涉及技能: brainstorming, writing-plans, using-git-worktrees
- 创建文档: 1 design, 1 plan, 1 task
- 状态: 进行中
```

---

### Hook 调用时机

| 技能 | 调用时机 | 记录内容 |
|------|---------|---------|
| **所有技能** | 技能开始时 | 输入参数、开始时间 |
| **所有技能** | 技能结束时 | 输出结果、状态、错误 |
| **brainstorming** | 完成 | 创建的 design 文档路径 |
| **writing-plans** | 完成 | 创建的 plan、task 文档路径 |
| **using-git-worktrees** | 完成 | worktree 路径、分支名称 |
| **TDD** | RED phase | bug 文档路径（如果创建） |
| **TDD** | GREEN phase | bug 文档更新 |
| **verification** | 验证完成 | 验证结果（测试输出等） |
| **finishing** | 归档 | 归档的文档列表 |

---

### 实施建议

#### 阶段 1：实现 Hook 机制

1. 在 `lib/docs-core.js` 中添加 `logWorkflowStep()` 方法
2. 创建 workflow 文档模板
3. 实现 session start/end hook 集成

#### 阶段 2：集成到核心技能

按优先级集成：
- **P0**：brainstorming, writing-plans, test-driven-development
- **P1**：using-git-worktrees, verification-before-completion
- **P2**：其他技能

#### 阶段 3：优化和完善

- 添加 workflow 文档搜索功能
- 支持 workflow 文档的可视化
- 添加 workflow 性能分析

---

### 替代方案：不使用 Hook

如果不想引入复杂的 hook 机制，可以采用**简化方案**：

**方案 C：每个技能手动更新 workflow**

在每个技能中添加明确的"更新 workflow 文档"步骤：

```markdown
## After the Work

**Update workflow document**:
```bash
# 追加执行记录到 workflow 文档
echo "
### [$(date -u +%Y-%m-%dT%H:%M:%SZ)] brainstorming: 完成

**状态**: 完成
**输出**: design 文档已创建
" >> $WORKFLOW_DOC
```
```

**优点**：简单直接
**缺点**：每个技能都需要手动添加，容易遗漏

---

## 总结

基于 CPU-内存-硬盘 类比，当前 Horspowers 文档流转体系存在以下主要问题：

### 核心问题
1. **关键数据未持久化**：验证结果、worktree 路径、review 反馈
2. **流程断点**：某些技能的输出未写入文档
3. **追溯困难**：无法跨会话追溯完整历史

### 解决方案
1. **扩展 task 文档模板**：添加"验证记录"、"开发环境"、"Code Review 记录"字段
2. **更新技能**：让这些技能读取并更新 task 文档
3. **新增 workflow 文档类型 + Hook 机制**：自动记录所有技能的执行历史

### 下一步行动
1. 更新任务文档，纳入这些发现
2. 扩展 Phase 2（模板统一），包含这些新字段
3. **新增 Phase：实现 workflow Hook 机制** ⭐
4. 更新 Phase 4（技能更新），包含这些技能
