# 任务3: 自动化开发工作流 Skill

> **创建日期**: 2026-01-15
> **状态**: ✅ 已完成
> **完成日期**: 2026-01-15
> **优先级**: 中

---

## 📋 任务概述

将 [自动化开发工作流设计文档.md](../自动化开发工作流设计文档.md) 转换为可执行的 Claude Skill，作为 `using-git-worktrees` 的替代方案。

### 设计目标

1. **互补关系**：当用户不使用 worktree 时，使用此工作流
2. **自动化优先**：减少手动操作，自动执行常见流程
3. **中文友好**：全中文交互和提示
4. **灵活配置**：支持 `.workflow-config.json` 自定义

---

## 🎯 Skill 结构设计

### 技能元数据
```yaml
---
name: automated-development-workflow
description: |
  当你在日常开发中需要自动化代码提交流程时使用此技能

  中文触发场景：
  - "下班了"
  - "完成今天的工作，帮我提交代码"
  - "今天的代码可以提交了吗？"
  - "帮我执行每日工作流"
  - "提交并推送代码"

  也适用于：
  - 快速提交代码（跳过检查）
  - 合并到 develop 分支
  - 解决 Git 冲突
  - 同步分支代码
---

# 自动化开发工作流

## Overview
这个技能帮助你自动化日常开发中的 Git 操作，包括代码检查、提交、推送和合并。

## The Process
...
```

### 技能命名
- **文件名**: `automated-development-workflow/SKILL.md`
- **简称**: `auto-dev-workflow` 或 `daily-workflow`
- **命令**: `/daily-workflow`, `/quick-commit`, `/merge-develop`

---

## 📋 功能模块分解

### 模块 1: 每日工作流（核心功能）

#### 触发条件
用户说以下内容时启动：
- "下班了"
- "提交代码"
- "今天的代码可以提交了吗？"
- "执行每日工作流"

#### 执行流程
```
1. 显示当前状态
   ├─ 当前分支
   ├─ 未提交更改（文件列表）
   └─ 最近提交历史

2. 代码质量检查
   ├─ 类型检查（可配置）
   ├─ Lint 检查（可配置）
   └─ 测试（可选）

3. 自动生成 Commit Message
   ├─ 分析更改类型（feat/fix/docs/chore）
   ├─ 分析更改范围（types/config/logger 等）
   ├─ 生成主题行
   └─ 生成详细说明（可选）

4. 用户确认
   └─ 显示生成的 commit message
   └─ 询问是否使用 / 编辑 / 重新生成

5. 提交和推送
   ├─ git add -A
   ├─ git commit
   └─ git push

6. 询问下一步
   ├─ 合并到 develop
   ├─ 创建 Pull Request
   ├─ 结束工作流
   └─ 取消（已提交）
```

#### 输出模板
```
🌅 下班时间到！开始执行每日工作流...

📊 当前状态：
分支：feat/config-system-optimization
未提交更改：3 个文件
  + frontend/src/types/config-system.ts (新增 50 行)
  + frontend/src/utils/configItemSort.ts (新增 70 行)
  + CLAUDE.md (修改)

🔍 步骤 1：代码质量检查
✓ 类型检查通过（2.3s）
✓ Lint 通过（1.1s）

📝 步骤 2：生成 Commit Message
分析更改内容...
  - 新增类型定义
  - 新增工具函数
  - 更新文档

自动生成的 commit message：
feat(config): 添加配置项排序功能

- 新增 ModuleConfigItems 类型定义
- 新增 configItemSort 工具函数
- 更新 CLAUDE.md 文档

是否使用此 commit message？(y/n/edit)
```

---

### 模块 2: 快速提交

#### 触发条件
- `/quick-commit`
- "快速提交"
- "跳过检查直接提交"

#### 流程
```
1. 跳过所有质量检查
2. 快速生成 commit message（或使用用户提供的）
3. 提交并推送
```

---

### 模块 3: 合并到 Develop

#### 触发条件
- `/merge-develop`
- "合并到 develop"
- "把这个功能合并到 develop"

#### 流程
```
1. 检查当前分支状态
2. 切换到 develop
3. 拉取最新代码
4. 合并当前分支
5. 处理冲突（如果有）
   ├─ 自动解决已知类型冲突
   └─ 手动解决复杂冲突
6. 推送 develop
7. 可选：删除功能分支
```

#### 冲突解决规则
```typescript
interface ConflictResolution {
  // 配置文件：合并
  packageJson: "merge"

  // 代码文件：基础设施优先
  codeFiles: "infra-priority"

  // 文档：保留当前分支
  docs: "ours"

  // 测试文件：保留传入版本
  testFiles: "theirs"
}
```

---

### 模块 4: 分支同步

#### 触发条件
- `/sync-branch`
- "同步分支"
- "更新分支代码"

#### 流程
```
1. 保存当前更改（使用 stash）
2. 切换到 develop/main
3. 拉取最新代码
4. 返回原分支
5. 执行 rebase
6. 恢复保存的更改
7. 处理冲突（如果有）
```

---

### 模块 5: 冲突解决

#### 触发条件
- `/resolve-conflicts`
- 检测到冲突时自动触发

#### 流程
```
1. 列出所有冲突文件
2. 对每个文件分类：
   ├─ package.json → 合并策略
   ├─ *.ts/*.tsx → infra-priority
   ├─ *.md → ours
   └─ 其他 → 询问用户
3. 应用解决策略
4. 验证解决结果
5. 完成合并
```

---

### 模块 6: 分支管理

#### 创建分支
- `/create-branch <type> <name>`
- "创建一个新的 feature 分支"

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<name>
git push -u origin <type>/<name>
```

#### 清理分支
- `/cleanup-branches`
- "清理已合并的分支"

```bash
# 删除本地已合并分支
git branch --merged | grep -v "develop\|main" | xargs git branch -d

# 清理远程已合并分支
git remote prune origin
```

---

### 模块 7: 配置管理

#### 读取配置
```typescript
function loadConfig(): WorkflowConfig {
  const defaultConfig = {
    developBranch: "main",
    checks: {
      typeCheck: { enabled: true, command: "npm run type-check" },
      lint: { enabled: true, command: "npm run lint" },
      test: { enabled: false }
    },
    autoMerge: {
      enabled: false,
      targetBranch: "develop"
    }
  }

  // 尝试读取 .workflow-config.json
  try {
    const userConfig = JSON.parse(readFile('.workflow-config.json'))
    return { ...defaultConfig, ...userConfig }
  } catch {
    return defaultConfig
  }
}
```

#### 配置文件模板
```json
{
  "developBranch": "main",
  "featureBranchPrefix": "feat/",
  "checks": {
    "typeCheck": {
      "enabled": true,
      "command": "npm run type-check",
      "autoFix": true
    },
    "lint": {
      "enabled": true,
      "command": "npm run lint",
      "autoFix": true
    },
    "test": {
      "enabled": false,
      "command": "npm test"
    }
  },
  "autoMerge": {
    "enabled": false,
    "targetBranch": "develop"
  },
  "conflictResolution": {
    "packageJson": "merge",
    "codeFiles": "infra-priority",
    "docs": "ours"
  }
}
```

---

## 📝 Commit Message 生成逻辑

### 分析算法
```typescript
interface CommitAnalysis {
  type: 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'style' | 'perf' | 'test'
  scope?: string
  subject: string
  body?: string
}

function analyzeCommit(diff: string, files: string[]): CommitAnalysis {
  // 1. 确定类型
  let type = 'chore'
  if (diff.includes('export') || diff.includes('function') || diff.includes('class')) {
    type = 'feat'
  } else if (diff.includes('fix') || diff.includes('bug')) {
    type = 'fix'
  } else if (files.some(f => f.endsWith('.md'))) {
    type = 'docs'
  } else if (diff.includes('refactor') || diff.includes('优化')) {
    type = 'refactor'
  }

  // 2. 确定范围
  let scope = ''
  if (files.some(f => f.includes('type'))) scope = 'types'
  else if (files.some(f => f.includes('config'))) scope = 'config'
  else if (files.some(f => f.includes('logger'))) scope = 'logger'
  else if (files.some(f => f.includes('test'))) scope = 'test'

  // 3. 生成主题
  const subject = extractSubjectFromDiff(diff)

  // 4. 生成详细说明
  const body = generateBody(files)

  return { type, scope, subject, body }
}
```

### 示例
**输入**：
- 修改了 `src/types/config.ts`（添加新类型）
- 修改了 `src/components/ConfigEditor.tsx`（使用新类型）
- 修改了 `README.md`（更新文档）

**输出**：
```
feat(types): 添加 ModuleConfigItems 类型定义

- 新增 ModuleConfigItems 接口
- ConfigEditor 使用新的类型系统
- 更新文档说明
```

---

## 🎨 交互设计

### 场景 1: 正常工作流
```
User: "下班了"

Claude:
🌅 下班时间到！开始执行每日工作流...

📊 当前状态：
分支：feat/user-auth
未提交更改：2 个文件

🔍 步骤 1：代码质量检查
✓ 类型检查通过
✓ Lint 通过

📝 步骤 2：生成 Commit Message
feat(auth): 添加用户登录功能

- 实现用户名密码登录
- 添加 JWT token 管理
- 更新登录页面 UI

是否使用此 commit message？(y/n/edit)
```

### 场景 2: 检查失败
```
Claude:
❌ 类型检查失败（3 个错误）

src/auth.ts:10:5
  error TS2322: Type 'unknown' is not assignable to type 'string'

💡 建议操作：
1. 尝试自动修复类型错误
2. 手动修复后重试
3. 暂时跳过检查（不推荐）

选择操作（输入数字）：
```

### 场景 3: 解决冲突
```
User: "/merge-develop"

Claude:
🔄 正在合并到 develop...

⚠️  检测到冲突！

冲突文件（2）：
1. package.json
   └─ npm scripts 冲突

2. src/utils/logger.ts
   └─ console.log vs logger.debug

🔍 分析并解决冲突：
✓ package.json - 已自动合并（合并双方 scripts）
✓ logger.ts - 已自动解决（采用 logger 版本）

是否继续合并？(y/n)
```

---

## 📋 实施步骤

### Step 1: 创建技能文件
```
skills/
└── automated-development-workflow/
    ├── SKILL.md          # 主技能文件
    ├── templates/        # 模板文件
    │   └── commit-message.txt
    └── scripts/          # 辅助脚本
        └── merge-package-json.js
```

### Step 2: 实现 Commit Message 生成
- [ ] 编写分析逻辑
- [ ] 创建模板系统
- [ ] 添加中文支持

### Step 3: 实现冲突解决
- [ ] package.json 合并脚本
- [ ] 文件分类逻辑
- [ ] 自动解决规则

### Step 4: 实现配置系统
- [ ] 配置文件读取
- [ ] 默认配置定义
- [ ] 配置验证

### Step 5: 测试和验证
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户测试

---

## ✅ 验证清单

### 功能验证
- [ ] 每日工作流完整执行
- [ ] 快速提交正常工作
- [ ] 分支合并无问题
- [ ] 冲突解决正确

### 配置验证
- [ ] 默认配置可用
- [ ] 自定义配置加载
- [ ] 配置验证正常

### 交互验证
- [ ] 中文提示友好
- [ ] 错误处理完善
- [ ] 用户选择清晰

---

## 📚 与 using-git-worktrees 的关系

| 特性 | using-git-worktrees | automated-development-workflow |
|------|---------------------|-------------------------------|
| **使用场景** | 并行开发多个功能 | 单一分支顺序开发 |
| **隔离性** | 完全隔离的工作目录 | 同一工作目录 |
| **复杂性** | 较复杂 | 简单直接 |
| **适用项目** | 大型项目、长期分支 | 小型项目、快速迭代 |
| **切换成本** | 低（已有 worktree） | 低（无需设置） |

**推荐使用场景**：
- 使用 `using-git-worktrees`：当你需要同时开发多个不相关的功能时
- 使用 `automated-development-workflow`：当你专注于一个功能的快速迭代时

---

## ✅ 完成总结

### 已创建文件

1. **技能文件**
   - [`skills/automated-development-workflow/SKILL.md`](../skills/automated-development-workflow/SKILL.md)
     - 完整的每日工作流程（显示状态、代码检查、生成提交、推送）
     - 快速提交子流程
     - 合并到 develop/main 子流程
     - 分支同步子流程
     - 智能冲突解决策略
     - 分支管理功能
     - 配置系统集成

2. **斜杠命令**
   - [`commands/daily-workflow.md`](../commands/daily-workflow.md) - 执行每日工作流
   - [`commands/quick-commit.md`](../commands/quick-commit.md) - 快速提交
   - [`commands/merge-branch.md`](../commands/merge-branch.md) - 合并分支
   - [`commands/sync-branch.md`](../commands/sync-branch.md) - 同步分支

3. **测试脚本**
   - [`tests/claude-code/test-automated-development-workflow.sh`](../tests/claude-code/test-automated-development-workflow.sh)
     - 10 个单元测试覆盖核心功能
     - 已添加到主测试运行器

### 功能特性

✅ **每日工作流**：完整的代码检查、提交、推送流程
✅ **智能 Commit Message 生成**：基于更改内容自动分析类型和范围
✅ **快速提交模式**：跳过检查，直接提交
✅ **智能冲突解决**：按文件类型应用不同策略
✅ **分支管理**：创建、同步、清理分支
✅ **配置系统集成**：支持 `.workflow-config.json` 和 session context
✅ **中文友好**：全中文交互提示
✅ **与 using-git-worktrees 互补**：明确各自使用场景

### 待后续完善

- [ ] 集成测试（完整工作流执行）
- [ ] 配置 hook 自动注入检测标记
- [ ] 用户反馈收集和优化

---

**创建日期**: 2026-01-15
**完成日期**: 2026-01-15
