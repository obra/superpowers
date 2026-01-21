# 任务: 统一文档系统命名和模板规范

## 基本信息
- 创建时间: 2026-01-21
- 负责人: [待指定]
- 优先级: 高

## 任务描述

统一 Horspowers 文档系统的命名规范和模板格式，确保两个文档系统（原 Horspowers 和内化的 document-driven-ai-workflow）完全融合。

### 对文档作用和目标的详细阐述
1. 设计文档的最初目的是希望能够通过文档
   1. 完成项目的知识传承，后续加入团队的成员，能够通过文档，对项目快速了解
   2. 完成上下文的传递，方便不同的 AI，Agent通过文档，快速的跨会话，跨任务了解上下文，避免因为上下文长度限制，压缩等带来的关注度丢失，AI 幻觉等问题
   3. 任务管理，即通过文档的协助，创建一个临时的，精简的任务上下文管理模块，能够确保任务进度能被跟踪，任务状态能被管理

2. 现在融合到工作流里面以后
   1. 希望每一个步骤都能够存在输入输出，比如 brainstorming 的输入可能是一句话需求，在 brainstorming 后，创建决策/方案/任务相关文档，write-plan 根据读取文档以后，创建 plan 文档，即通过文档，完成工作流之间的信息传递，避免了关键上下文在工作流程的流转过程中，出现丢失的问题
   2. 我不希望文档设计的非常的复杂，不然每个小需求都有可能产生 10+的文档，那么将会在项目中产生庞大的文档内容，这似乎是一个矛盾的问题，所以此前我曾尝试过借助外部工具，比如 notion 等，来管理文档，但是目前不太可行，如果有更好的方案也欢迎给我建议

3. 因此，整体思路是一定程度借鉴了 scrum 的思想，即文档优先，敏捷开发，当然我也担心糅合了过多的内容以后，会使得当前的项目过于复杂，这也是我在本任务执行的同时，在思考的一个问题

## 背景分析

当前存在两套文档规范的遗留问题：

### 原有 Horspowers 文档规范
- **设计文档**: `YYYY-MM-DD-<topic>-design.md`（保存于 `docs/plans/`）
- **计划文档**: `YYYY-MM-DD-<feature-name>.md`（保存于 `docs/plans/`）

### 内化后的统一文档系统规范
- **活跃文档**: `YYYY-MM-DD-<type>-<slug>.md`（保存于 `docs/active/`）
  - type: task, bug, decision, context
- **静态文档**: 保持原 `docs/plans/` 规范

### 当前不一致的问题

1. **命名风格不统一**:
   - 原设计文档用 `-design` 后缀
   - 新活跃文档用 `<type>-` 前缀
   - 两者语义表达方式不同

2. **模板格式不一致**:
   - brainstorming 技能创建的设计文档模板（`getDesignTemplate`）
   - docs-core.js 中的决策文档模板（`getDecisionTemplate`）
   - 两者的字段结构和表述方式存在差异

3. **技能文档引用混乱**:
   - brainstorming/SKILL.md 提到创建 `YYYY-MM-DD-<topic>-design.md`
   - 同时提到创建 `docs/active/YYYY-MM-DD-decision-<title>.md`
   - 两者都是"设计"类文档，但存储位置和命名规则不同

## 模板产生历史分析

### 原始 Horspowers 设计文档（后缀式）

**产生时间**：commit b79b774 之前

**来源**：obra/superpowers 原始设计

**模板字段**：
```markdown
# ${topic} 设计文档
**日期**: ${date}
## 需求概述
## 设计方案
## 实施要点
## 相关文档
```

**命名规则**：`YYYY-MM-DD-<topic>-design.md`（后缀式）
**存储位置**：`docs/plans/`
**创建时机**：brainstorming 技能完成设计后

### DDAW 引入的活跃文档（前缀式）

**产生时间**：commit 7f4b656（2026-01-07）

**来源**：document-driven-ai-workflow 外部工具

**新增文档类型**：
- `decision` - 技术决策记录
- `task` - 任务追踪
- `bug` - Bug 追踪
- `context` - 项目上下文

**模板字段（DDAW 原始定义）**：
```markdown
# 决策文档
## 决策背景
## 可选方案
### 方案A
- 描述
- 优点
- 缺点
### 方案B
...
## 最终决策
**选择**:
**理由**:
## 影响范围
## 实施计划
## 结果评估
```

**命名规则**：`YYYY-MM-DD-<type>-<slug>.md`（前缀式）
**存储位置**：`.docs/active/`（后改为 `docs/active/`）

### 统一文档系统（两套并存）

**产生时间**：commit 88c6607（2026-01-19）

**整合方式**：
- 保留原有 `design`/`plan` 文档（静态，plans/）
- 新增 `decision`/`task`/`bug`/`context`（活跃，active/）
- brainstorming 技能同时创建两种文档

**问题**：两套模板字段不同步，命名风格不一致

## 用户确认的设计方向（最终版）

### 核心文档集合

基于对文档作用和目标的分析（见上文"### 对文档作用和目标的详细阐述"），确认以下核心文档类型：

| 文档类型 | 性质 | 生命周期 | 创建时机 | 存储位置 |
|---------|------|---------|---------|---------|
| **design** | 静态参考 | 长期保留 | brainstorming 有重要方案选择时 | `docs/plans/` |
| **plan** | 静态参考 | 长期保留 | writing-plans 创建详细计划时 | `docs/plans/` |
| **task** | 动态追踪 | 完成后归档 | writing-plans 开始实施时 | `docs/active/` → `docs/archive/` |
| **bug** | 临时追踪 | 修复后移除 | TDD 意外失败时 | `docs/active/` → **删除** |
| **context** | 静态参考 | 长期保留 | 需要记录项目特定上下文时 | `docs/context/` |

**文档复杂度控制**：
- 每个需求：1 个 design（可选）+ 1 个 plan + 1 个 task = 最多 3 个核心文档
- Bug 文档：临时创建，修复后删除，不计入核心文档数
- Context 文档：按需创建，不与具体需求绑定

### 设计方向确认

#### 核心思想（重要！）- CPU-内存-硬盘类比

**计算机体系结构类比**：
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

1. **信息持久化分层存储**：
   - **上下文（内存）**：当前会话的快速信息，但容量有限，会话结束即丢失
   - **文档（硬盘）**：关键信息持久化，跨会话、跨任务长期保留
   - **信息交换**：AI 需要时从文档（硬盘）加载到上下文（内存）处理

2. **文档流转即数据交换**：
   - 技能 A 输出文档 → 写入硬盘
   - 技能 B 输入文档 → 从硬盘加载到内存（上下文）
   - 技能 B 处理后输出更新 → 写回硬盘
   - **文档不是静态存储，而是在内存和硬盘间持续交换**

3. **避免内存溢出**：
   - 上下文（内存）有限，不能存储所有历史信息
   - 将关键信息持久化到文档（硬盘）
   - 按需从文档加载到上下文，避免上下文过长导致信息丢失

#### 具体设计方向

1. **命名风格**：统一采用前缀式 `YYYY-MM-DD-<type>-<slug>.md`

2. **模板标准**：采用 DDAW 中的更详细模板（含"结果评估"等字段）

3. **文档作用**：
   - 知识传承（团队成员快速了解）
   - 上下文传递（跨会话、跨任务、避免 AI 幻觉）
   - 任务管理（临时、精简的状态追踪）

4. **工作流集成 - 上下文传递机制**（核心！）：
   - 每个技能步骤有明确的**输入文档**（从硬盘加载到内存）
   - 每个技能步骤有明确的**输出文档**（从内存写回硬盘）
   - 在技能流转时**携带**相关文档路径（准备数据交换）
   - 子代理/并行执行时传递必要的文档路径（共享硬盘数据）
   - **文档流转 = 数据在内存和硬盘间按需交换**

5. **复杂度控制**：
   - 借鉴 Scrum 思想：文档优先 + 敏捷开发
   - 核心文档：design + plan + task（最多 3 个）
   - 临时文档：bug（修复后删除）
   - 避免硬盘膨胀

### 技能流转的文档上下文传递

#### 场景 1：标准开发流程

```
用户需求
    ↓
[brainstorming]
输入：项目上下文（搜索现有 context、design）
输出：design 文档（如有重要方案选择）
    ↓
[writing-plans]
输入：design 文档（如果存在）
输出：
  - plan 文档（docs/plans/）
  - task 文档（docs/active/）
    ↓
[subagent-driven-development] 或 [executing-plans]
输入：plan 文档、task 文档路径
输出：更新 task 文档进度
    ↓
[test-driven-development]
输入：task 文档路径
输出：可能创建 bug 文档（如意外失败）
    ↓
[requesting-code-review]
输入：task 文档路径、相关 design/plan
输出：更新 task 文档进度
    ↓
[finishing-a-development-branch]
输入：task 文档、bug 文档（如果有）
输出：
  - task 文档移至 archive
  - bug 文档删除（已修复）
```

#### 场景 2：Bug 修复流程

```
TDD RED phase：测试意外失败
    ↓
[test-driven-development]
输入：task 文档路径、测试失败信息
输出：bug 文档（docs/active/）
    ↓
[systematic-debugging]
输入：bug 文档路径、测试失败信息
输出：更新 bug 文档（根因分析）
    ↓
[test-driven-development GREEN phase]
输入：bug 文档路径
输出：
  - 更新 bug 文档（修复方案）
  - bug 文档状态：已修复
    ↓
[finishing-a-development-branch]
输入：bug 文档路径
输出：删除 bug 文档（确认修复后）
```

#### 场景 3：并行代理执行

```
[dispatching-parallel-agents]
输入：task 文档、plan 文档
    ├─→ Subagent 1
    │   输入：task 路径、plan 中相关任务片段、design（如需要）
    │   输出：更新 task 进度
    │
    ├─→ Subagent 2
    │   输入：task 路径、plan 中相关任务片段、design（如需要）
    │   输出：更新 task 进度
    │
    └─→ Subagent 3
        输入：task 路径、plan 中相关任务片段、bug（如遇到）
        输出：更新 task 进度、创建/更新 bug
    ↓
[主会话汇总]
输入：更新后的 task 文档
输出：汇总进度，决定下一步
```

#### 场景 4：独立会话执行

```
[executing-plans]
输入：plan 文档完整路径、task 文档路径
    ↓
检查点 1：完成前 3 个任务
    ↓
新会话恢复：
输入：task 文档路径（包含检查点信息）
    ↓
检查点 2：完成中间任务
    ↓
[可能遇到 bug]
输入：task 路径、bug 文档路径
    ↓
继续执行...
```

### 技能更新要点

#### brainstorming
- 搜索现有文档：context、相关 design
- 输出：design 文档（仅当有重要方案选择时）
- 不再创建 decision 文档（合并到 design）

#### writing-plans
- 输入：design 文档路径（如果存在）
- 输出：plan 文档 + task 文档
- task 文档包含对 design 和 plan 的链接

#### subagent-driven-development
- 输入：plan 文档、task 文档路径、design（可选）
- 每个任务执行前后更新 task 进度
- code-review 后更新 task 状态

#### executing-plans
- 输入：plan 文档路径、task 文档路径
- 检查点机制：保存进度到 task 文档
- 支持会话恢复：从 task 文档读取进度

#### test-driven-development
- 输入：task 文档路径
- RED phase 意外失败：创建 bug 文档
- GREEN phase：更新 bug 文档状态
- 更新 task 文档进度

#### requesting-code-review
- 输入：task 文档路径、相关 design/plan
- 审查通过后更新 task 状态

#### systematic-debugging
- 输入：bug 文档路径、失败信息
- 输出：更新 bug 文档（根因分析）

#### finishing-a-development-branch
- 输入：task 文档、bug 文档（如有）
- 输出：
  - task 文档移至 archive
  - bug 文档删除（已修复的）
  - 清除环境变量

#### dispatching-parallel-agents
- 输入：task 文档、plan 文档
- 为每个子代理准备相关文档上下文
- 汇总所有子代理进度到 task 文档

## 实施计划（修订版）

### Phase 1: 统一命名规范（采用前缀式）

**目标**: 将所有文档统一为前缀式命名 `YYYY-MM-DD-<type>-<slug>.md`

**步骤**:
1. 确定文档类型映射：
   - `design` → `design`（保持，但改为前缀式）
   - `plan` → `plan`（保持，前缀式）
   - `decision` → `decision`（已是前缀式）
   - `task` → `task`（已是前缀式）
   - `bug` → `bug`（已是前缀式）
   - `context` → `context`（已是前缀式）

2. 更新 `lib/docs-core.js` 中的文档命名逻辑：
   - `createDesignDocument()` → 改为 `YYYY-MM-DD-design-<topic>.md`
   - 其他方法已使用前缀式，保持不变

3. 更新所有技能文档中的引用：
   - brainstorming/SKILL.md
   - writing-plans/SKILL.md
   - test-driven-development/SKILL.md
   - 用户指南文档

### Phase 2: 统一模板格式（采用 DDAW 详细模板）

**目标**: 合并 `design` 和 `decision` 模板，采用 DDAW 的详细结构

**核心决策**: 合并"设计文档"和"决策文档"

**分析**:
- 当前：`design`（静态，4 字段）vs `decision`（活跃，7 字段）
- 问题：两者语义重叠，都是记录设计决策
- 方案：合并为一个统一的 `design` 类型，包含完整字段

**统一后的设计文档模板**（采用 DDAW 结构）：
```markdown
# 设计: ${title}

## 基本信息
- 创建时间: ${date}
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

**步骤**:
1. 合并 `getDesignTemplate()` 和 `getDecisionTemplate()` → 统一为 `getDesignTemplate()`
2. 更新 brainstorming 技能：只创建一种设计文档
3. 移除 brainstorming 中的"决策文档"创建逻辑
4. 更新所有引用

### Phase 3: 解决文档复杂度问题（Scrum 思想）

**目标**: 避免每个小需求产生 10+ 文档，建立清晰的文档层级

**设计原则**（基于你的分析）：
1. **最小必要文档原则**：只创建真正需要的文档
2. **文档复用**：通过链接引用，避免重复内容
3. **状态追踪分离**：静态参考 vs 动态追踪 vs 临时追踪
4. **Bug 文档临时性**：修复后删除，不长期占用存储

**文档层级设计**：
```
需求输入
    ↓
[brainstorming]
    ↓
设计文档（design）← 静态参考，记录方案决策（可选）
    ↓
[writing-plans]
    ↓
计划文档（plan）← 静态参考，详细实施步骤（必需）
    ↓
同时创建 → 任务文档（task）← 动态追踪，状态和进度（必需）
    ↓
[subagent-driven-development]
    ↓
    ↓
    ├─→ 如果发现 bug → Bug 文档（bug）← 临时追踪，修复后删除
    └─→ 如果需要新决策 → 设计文档（design）← 循环回到设计阶段
    ↓
[finishing-a-development-branch]
    ↓
    ├─→ task 文档移至 archive（长期保留）
    └─→ bug 文档删除（已修复的移除）
```

**创建规则**：
1. **brainstorming**：
   - 如果包含重要的技术方案选择 → 创建 `design` 文档
   - 否则 → 不创建文档，直接进入 writing-plans

2. **writing-plans**：
   - 总是创建 `plan` 文档（静态参考）
   - 同时创建 `task` 文档（动态追踪）

3. **test-driven-development**：
   - 只有意外失败时才创建 `bug` 文档

4. **每个需求最多 3 个核心文档**：
   - 1 个 design（可选）
   - 1 个 plan（必需）
   - 1 个 task（必需）
   - bug 文档不计入（临时，修复后删除）

**Bug 文档生命周期**：
```
创建（TDD RED phase）
    ↓
更新（systematic-debugging 根因分析）
    ↓
更新（TDD GREEN phase 修复方案）
    ↓
状态：已修复
    ↓
删除（finishing-a-development-branch 确认后）
```

**步骤**:
1. 更新 brainstorming：增加判断逻辑，避免无条件创建设计文档
2. 更新 writing-plans：确保 plan 和 task 文档正确链接
3. 添加文档数量告警：核心文档超过 3 个时提示用户
4. 实现 bug 文档删除逻辑：
   - 在 `lib/docs-core.js` 添加 `deleteBugDocument()` 方法
   - 在 `finishing-a-development-branch` 技能中调用删除逻辑
   - 确认 bug 状态为"已修复"后才删除
5. 更新用户指南：说明最小必要原则和 bug 临时性

### Phase 4: 更新技能引用（文档上下文传递）

**目标**: 确保所有技能使用统一的文档创建和引用方式，并实现上下文传递机制

**核心技能更新清单**：

#### 1. brainstorming/SKILL.md

**更新内容**：
- 移除 `decision` 文档创建逻辑
- 添加判断逻辑：何时创建 `design` 文档（仅重要方案选择时）
- 更新模板引用为统一的设计模板（DDAW 格式）
- 统一命名规则为前缀式：`YYYY-MM-DD-design-<topic>.md`
- 添加文档搜索逻辑：开始前搜索现有 context 和相关 design

**输入输出**：
```
输入：用户需求、现有文档上下文（context、design）
输出：design 文档（可选）
```

#### 2. writing-plans/SKILL.md

**更新内容**：
- 确保 `plan` 文档使用前缀式命名：`YYYY-MM-DD-plan-<feature>.md`
- 确保 `task` 文档正确链接到 `plan` 和 `design`
- 更新模板引用
- 添加文档输入逻辑：读取 design 文档（如果存在）

**输入输出**：
```
输入：design 文档路径（可选）
输出：
  - plan 文档（docs/plans/）
  - task 文档（docs/active/）
  - 设置 $TASK_DOC 环境变量
```

#### 3. subagent-driven-development/SKILL.md

**更新内容**：
- 添加文档输入逻辑：读取 plan、task、design（可选）
- 每个任务执行前后更新 task 进度
- code-review 后更新 task 状态
- 确保子代理能访问相关文档路径

**输入输出**：
```
输入：plan 文档、task 文档路径、design（可选）
输出：更新 task 文档进度
```

#### 4. executing-plans/SKILL.md

**更新内容**：
- 添加文档输入逻辑：读取 plan 和 task 文档路径
- 检查点机制：保存进度到 task 文档
- 支持会话恢复：从 task 文档读取进度
- 遇到 bug 时传递 task 和 bug 文档路径

**输入输出**：
```
输入：plan 文档路径、task 文档路径
输出：更新 task 文档进度、检查点信息
```

#### 5. test-driven-development/SKILL.md

**更新内容**：
- 确保 `bug` 文档使用统一模板
- 更新命名规则引用：`YYYY-MM-DD-bug-<description>.md`
- RED phase 意外失败：创建 bug 文档
- GREEN phase：更新 bug 文档状态
- 更新 task 文档进度

**输入输出**：
```
输入：task 文档路径
输出：
  - bug 文档（意外失败时）
  - 更新 bug 文档状态（GREEN phase）
  - 更新 task 文档进度
```

#### 6. requesting-code-review/SKILL.md

**更新内容**：
- 添加文档输入逻辑：读取 task、design、plan
- 审查通过后更新 task 状态
- 确保 review 结果记录到 task 文档

**输入输出**：
```
输入：task 文档路径、相关 design/plan
输出：更新 task 文档进度和状态
```

#### 7. systematic-debugging/SKILL.md

**更新内容**：
- 添加文档输入逻辑：读取 bug 文档、task 文档
- 输出根因分析到 bug 文档
- 确保 debugging 结果记录到 bug 文档

**输入输出**：
```
输入：bug 文档路径、task 文档路径
输出：更新 bug 文档（根因分析）
```

#### 8. finishing-a-development-branch/SKILL.md

**更新内容**：
- 添加文档输入逻辑：读取 task、bug 文档
- 输出：
  - task 文档移至 archive
  - bug 文档删除（已修复的）
  - 清除环境变量（$TASK_DOC、$BUG_DOC）
- 添加 bug 文档删除逻辑调用

**输入输出**：
```
输入：task 文档、bug 文档（可选）
输出：
  - task → archive
  - bug → 删除（已修复）
  - 清除环境变量
```

#### 9. dispatching-parallel-agents/SKILL.md

**更新内容**：
- 添加文档输入逻辑：读取 task 和 plan 文档
- 为每个子代理准备相关文档上下文
- 汇总所有子代理进度到 task 文档
- 支持传递 design/bug 文档给特定子代理

**输入输出**：
```
输入：task 文档、plan 文档
输出：汇总所有子代理进度到 task 文档
```

#### 10. document-management/SKILL.md

**更新内容**：
- 更新文档命名规则说明
- 添加 bug 文档删除功能
- 更新文档模板示例

**步骤**:
1. 按优先级更新技能：
   - P0：brainstorming、writing-plans、test-driven-development
   - P1：subagent-driven-development、executing-plans、finishing-a-development-branch
   - P2：requesting-code-review、systematic-debugging、dispatching-parallel-agents
   - P3：document-management

2. 每个技能更新后进行测试验证

3. 更新技能间的交叉引用

### Phase 5: 创建迁移指南和工具

**目标**: 为用户提供旧文档到新规范的迁移路径

**步骤**:
1. 编写迁移脚本：
   - 重命名旧 `design` 文档：`YYYY-MM-DD-<topic>-design.md` → `YYYY-MM-DD-design-<topic>.md`
   - 合并旧 `decision` 文档到 `design`（如果存在）
   - 更新所有内部链接

2. 创建迁移文档：
   - 迁移步骤指南
   - 常见问题解答
   - 回滚方案

3. 更新用户指南：
   - 更新命名规则说明
   - 更新模板示例
   - 添加文档复杂度控制说明

## 验收标准

- [ ] **命名统一**：所有文档类型使用 `YYYY-MM-DD-<type>-<slug>.md` 前缀式命名
- [ ] **模板统一**：`design` 和 `decision` 合并为统一模板，采用 DDAW 详细结构
- [ ] **技能同步**：所有技能正确引用新的命名和模板规则
- [ ] **复杂度控制**：每个需求最多 3-4 个文档，有明确的创建规则
- [ ] **迁移支持**：提供完整的迁移脚本和文档
- [ ] **测试验证**：创建各类文档并验证命名、格式和链接正确

## 相关文档

- [统一文档系统设计](../plans/2026-01-19-unified-document-system-design.md)
- [统一文档系统用户指南](../tasks/unified-document-system.md)
- [文档流转体系分析 - 遗漏识别与优化建议](./2026-01-21-analysis-document-flow-gaps.md) ⭐ 新增

## 进展记录

- 2026-01-21: 创建任务 - 待开始
- 2026-01-21: 完成文档流转体系分析，识别 4 个遗漏点
- 2026-01-21: 完成改动范围预估，确认实施方向
- 2026-01-21: **Phase 1 完成** - 统一命名规范（前缀式）
  - 修改 `createDesignDocument()` 采用前缀式命名
  - 更新 `extractDocType()` 支持新旧格式（后缀式优先检查）
  - 更新 `getStats()` 支持新旧格式 design 文档统计
  - 向后兼容性：旧格式文件仍可正确识别
- 2026-01-21: **Phase 2 完成** - 统一模板格式（合并 design + decision）
  - 合并 `getDesignTemplate()` 采用 DDAW 详细结构（10个字段）
  - 删除 `getDecisionTemplate()` 方法
  - 更新 `getActiveTemplate()` 移除 decision 类型
  - 更新 `createActiveDocument()` validTypes 移除 decision
  - 向后兼容性：保留旧 decision 文档的识别和统计
- 2026-01-21: **Phase 3 完成** - 解决文档复杂度问题（Scrum 思想）
  - 实现 `deleteBugDocument()` 方法：支持状态验证、用户确认、强制删除
  - 实现 `countCoreDocs()` 方法：统计核心文档数量，超过 3 个时发出警告
  - 更新 brainstorming 技能：添加询问用户是否需要创建 design 文档的逻辑
  - 更新 writing-plans 技能：添加文档输入上下文、正确链接、核心文档数量检查
  - 更新 finishing-a-development-branch 技能：添加 bug 文档删除/归档/保留选项
  - 测试验证：所有新方法测试通过
- 2026-01-21: **Phase 4 完成** - 更新技能引用（文档上下文传递）
  - 更新 subagent-driven-development：添加 Step 0 文档上下文加载，传递文档路径给子代理
  - 更新 executing-plans：添加 Step 0 文档上下文加载、Step 2.5 检查点保存机制
  - 更新 systematic-debugging：添加 Phase 0 文档上下文加载、Phase 4.5 更新 bug 文档
  - 更新 requesting-code-review：添加文档上下文加载、审查后更新任务文档
  - 更新 dispatching-parallel-agents：添加 Step 0 文档上下文加载、Step 4.5 汇总进度
  - **所有文档加载逻辑都处理了文件不存在的情况**：
    - 使用 `[ -f "$FILE" ]` 检查文件存在性
    - 文件不存在时的增强处理：
      - 🔍 搜索相关文档（最近 7 天内的 task/bug 文档）
      - 📝 从 git log 获取上下文（最近 5 条 commit）
      - 💡 提供流程引导建议（推荐工作流程）
      - 📋 检查文档系统是否初始化
      - 明确提示：继续使用可用上下文执行
  - **所有提示信息改为中文**，使用 emoji 增强可读性

---

## 改动范围预估

### 总体概览

| 类别 | 文件数量 | 改动类型 |
|------|---------|---------|
| **核心库文件** | 1 个 | `lib/docs-core.js` |
| **技能文件** | 10 个 | SKILL.md |
| **文档/脚本** | 1-2 个 | 迁移指南 |
| **测试脚本** | 约 3 个 | 验证新规范 |

### 确认的实施方向

| 决策点 | 确认方案 |
|--------|----------|
| **执行范围** | 全部5个Phase按顺序执行 |
| **Design文档创建** | brainstorming 技能询问用户是否需要 |
| **现有文档** | 不处理，保持现状（只影响新创建的文档） |
| **Bug删除** | finishing-a-development-branch 技能询问用户是否删除 |

**核心原则：新文档使用新规范，旧文档保持兼容**

### 各Phase详细预估

#### Phase 1: 命名统一

**文件：** `lib/docs-core.js`

| 方法 | 当前格式 | 新格式 | 改动量 |
|------|---------|--------|--------|
| `createDesignDocument()` | `YYYY-MM-DD-<topic>-design.md` | `YYYY-MM-DD-design-<topic>.md` | ~5 行 |
| `extractDocType()` | 检测后缀式 | 添加前缀式检测 | ~5 行 |
| `getDesignTemplate()` | 更新示例链接 | 新格式链接 | ~2 行 |

**小计：** ~12 行代码修改

#### Phase 2: 模板统一

**文件：** `lib/docs-core.js`

| 操作 | 详情 | 改动量 |
|------|------|--------|
| 合并模板 | `getDesignTemplate()` 采用 DDAW 结构 | ~20 行 |
| 移除模板 | 删除 `getDecisionTemplate()` | -25 行 |
| 更新调用 | `getActiveTemplate()` 移除 decision | ~3 行 |

**小计：** ~48 行代码修改

#### Phase 3: 复杂度控制

**文件：** `lib/docs-core.js`

| 新增方法 | 用途 | 改动量 |
|---------|------|--------|
| `deleteBugDocument()` | 删除已修复的bug文档 | ~15 行 |
| `countCoreDocs()` | 统计核心文档数量 | ~10 行 |

**技能文件更新（P0）：**
- `brainstorming/SKILL.md`: 添加询问用户逻辑 ~20 行
- `writing-plans/SKILL.md`: 确保 plan/task 正确链接 ~10 行

**小计：** ~55 行代码修改

#### Phase 4: 技能更新（最大工作量）

| 优先级 | 技能 | 主要改动 | 预估改动量 |
|--------|------|---------|-----------|
| **P0** | `brainstorming/SKILL.md` | 询问创建design、搜索现有文档 | ~50 行 |
| **P0** | `writing-plans/SKILL.md` | 读取design、创建task、设置环境变量 | ~40 行 |
| **P0** | `test-driven-development/SKILL.md` | 意外失败创建bug、更新task进度 | ~30 行 |
| **P1** | `subagent-driven-development/SKILL.md` | 输入输出文档路径、更新进度 | ~35 行 |
| **P1** | `executing-plans/SKILL.md` | 检查点机制、会话恢复 | ~25 行 |
| **P1** | `finishing-a-development-branch/SKILL.md` | 归档task、询问删除bug | ~30 行 |
| **P2** | `requesting-code-review/SKILL.md` | 输入文档路径、更新task状态 | ~20 行 |
| **P2** | `systematic-debugging/SKILL.md` | 输入bug/task、更新bug文档 | ~25 行 |
| **P2** | `dispatching-parallel-agents/SKILL.md` | 准备文档上下文、汇总进度 | ~25 行 |
| **P3** | `document-management/SKILL.md` | 更新命名规则、删除功能 | ~30 行 |

**小计：** ~310 行技能文档修改

#### Phase 5: 迁移工具

| 文件 | 类型 | 改动量 |
|------|------|--------|
| `scripts/migrate-docs.js` | 新建迁移脚本 | ~150 行 |
| `docs/migration-guide.md` | 迁移指南文档 | ~200 行 |

**小计：** ~350 行新增内容

### 总计统计

| 类别 | 文件数 | 代码行数 |
|------|--------|---------|
| **核心库修改** | 1 | ~115 行 |
| **技能文档更新** | 10 | ~310 行 |
| **新增脚本/文档** | 2 | ~350 行 |
| **测试验证** | 3 | ~150 行 |
| **合计** | **16** | **~925 行** |
