# Superpowers 个人开发者适配设计方案

**日期**: 2025-01-04
**设计目标**: 将 Superpowers 插件适配为个人开发者工作流，保留核心能力但提供灵活的决策选择

## 背景和需求

用户是一名个人开发者，从 Superpowers 原仓库 fork 了插件进行定制。当前 Superpowers 的某些重型流程（TDD、git worktree、PR）对个人开发场景来说过于复杂。

**核心需求**:
1. 保留原有 Superpowers 的完整能力和 skills
2. 在关键决策点提供选择，让用户决定使用哪种流程
3. 支持用户的工作模式：对话驱动设计 → 文档沉淀 → 编码实现
4. 首次配置后提供默认值，但关键决策点仍需二次确认

## 系统架构

### 1. 配置系统

创建项目级配置文件 `.superpowers-config.yaml`（gitignored），包含：

```yaml
# 开发模式：personal（个人）或 team（团队）
development_mode: personal

# 分支策略：worktree（隔离工作树）或 simple（普通分支）
branch_strategy: simple

# 测试策略：tdd（先测试后代码）或 test-after（先代码后测试）
testing_strategy: test-after

# 完成策略：pr（创建 PR）、merge（本地合并）或 keep（保留分支）
completion_strategy: merge
```

**配置文件位置**: 项目根目录，向上遍历查找

**配置创建时机**: 首次使用插件时，通过 AskUserQuestion 工具引导用户创建

### 2. 配置管理模块

创建 `lib/config-manager.js`（ES 模块），提供：

- `detectConfig(projectDir)` - 向上遍历目录树查找配置文件
- `readConfig(projectDir)` - 读取并解析 YAML
- `writeConfig(projectDir, config)` - 创建配置文件
- `promptForInitialConfig()` - 返回 AskUserQuestion 结构用于首次配置

**技术选择**: 使用 YAML 格式（易读、支持注释）。如果没有 js-yaml 依赖，使用轻量级纯 JS 解析器。

### 3. Session Start Hook 增强

修改 `hooks/session-start.sh`：

1. 调用 `config-manager.js` 检测配置文件
2. 如果配置不存在，在 `additionalContext` 中注入 `<initial-config-needed>` 标记
3. `using-superpowers` skill 检测到标记后，触发初始配置流程

### 4. Skill 修改策略

#### using-git-worktrees

**修改点**: 在创建 worktree 前增加决策

```
[决策点] 分支创建策略

当前配置建议：使用普通分支（simple）
原因：个人模式下，普通分支更轻量，无需 worktree 隔离

选项：
1. 采用建议（普通分支）
2. 更改为：worktree（隔离环境）
3. 跳过此步骤
```

#### test-driven-development

**修改点**: 不强制"先写测试"，支持配置驱动

```
[决策点] 测试策略

当前配置允许：先写代码再补充测试
建议流程：实现功能 → 编写测试 → 验证通过
注意：这偏离了严格 TDD，但适合个人开发场景

选项：
1. 按配置执行（代码优先）
2. 改用严格 TDD（测试优先）
3. 跳过测试
```

#### finishing-a-development-branch

**修改点**: 根据配置调整推荐选项

**个人模式**：
- 默认推荐：本地 merge
- 次选：保留分支（继续开发）
- 不可见：创建 PR（除非明确选择）

**团队模式**：
- 默认推荐：创建 PR
- 次选：本地 merge
- 可选：保留分支

#### brainstorming

**修改点**: 增强文档输出功能

1. 设计阶段完成后，自动创建 `docs/plans/YYYY-MM-DD-<topic>-design.md`
2. 设计文档包含：需求概述、架构设计、实施要点
3. 提示用户："设计已保存到文档。你可以通过编辑文档来调整设计，完成后说'继续'进入实施阶段。"

### 5. 决策确认模板

统一的决策交互格式：

```
[决策点] <决策名称>

当前配置建议：<<建议方案>>

原因：<<基于当前配置的解释>>

选项：
1. 采用建议
2. 更改为：<<替代方案>>
3. 跳过此步骤

请选择：
```

## 实施计划

### 第一阶段：Brainstorming 文档增强

**文件修改**:
- `skills/brainstorming/SKILL.md`

**改动内容**:
- 在设计完成后增加文档输出步骤
- 创建 `docs/plans/` 目录（如果不存在）
- 保存设计为 Markdown 文件
- 提示用户可以通过编辑文档继续完善设计

**验证方法**:
1. 运行 `/horspowers:brainstorm`
2. 完成设计对话
3. 确认 `docs/plans/` 下生成了设计文档
4. 编辑文档，说"继续"，验证 Claude 能读取更新后的设计

### 第二阶段：配置系统基础

**文件新增**:
- `lib/config-manager.js`

**文件修改**:
- `hooks/session-start.sh` - 增加配置检测逻辑

**改动内容**:
1. 实现 `config-manager.js` 的四个核心函数
2. 修改 session start hook，调用配置检测
3. 在 `using-superpowers` skill 中增加配置初始化逻辑

**验证方法**:
1. 在新项目中首次使用插件
2. 验证触发配置创建流程
3. 检查 `.superpowers-config.yaml` 是否正确创建
4. 重新启动会话，验证配置能被正确读取

### 第三阶段：Git 流程适配

**文件修改**:
- `skills/using-git-worktrees/SKILL.md`
- `skills/finishing-a-development-branch/SKILL.md`

**改动内容**:
1. 在 worktree 创建前增加决策点
2. 在分支完成时根据配置调整选项
3. 实现普通分支的创建和切换逻辑

**验证方法**:
1. 设置 `branch_strategy: simple`
2. 启动一个新功能开发
3. 验证提示使用普通分支
4. 完成功能后验证推荐本地 merge

### 第四阶段：测试策略适配

**文件修改**:
- `skills/test-driven-development/SKILL.md`

**改动内容**:
1. 读取 `testing_strategy` 配置
2. 支持"先代码后测试"流程
3. 保留决策确认机制

**验证方法**:
1. 设置 `testing_strategy: test-after`
2. 实现一个功能
3. 验证不强制先写测试
4. 确认完成后提醒补充测试

### 第五阶段：端到端测试

**测试场景**: 完整的"设计 → 编码 → 完成"流程

1. 使用 `/horspowers:brainstorm` 完成设计
2. 编辑设计文档进行调整
3. 进入实施阶段
4. 在各个决策点选择个人模式偏好
5. 验证完整的开发流程

## 本地插件安装

### 配置本地 Marketplace

在 `~/.claude/settings.json` 中添加：

```json
{
  "localMarketplaces": [
    {
      "directory": "/Users/zego/Zego/horspowers",
      "name": "horspowers-dev"
    }
  ]
}
```

### 安装和切换

```bash
# 安装本地版本
/plugin install superpowers@horspowers-dev

# 卸载旧版本
/plugin uninstall superpowers@superpowers-marketplace
```

### 回退机制

如遇问题可随时切回原版：

```bash
/plugin uninstall superpowers@horspowers-dev
/plugin install superpowers@superpowers-marketplace
```

## 与上游同步

### Git 工作流

```bash
# 获取上游更新
git fetch upstream

# 查看变化
git log main..upstream/main --oneline

# 合并或 rebase
git merge upstream/main
# 或
git rebase upstream/main
```

### 冲突处理原则

1. **优先保留你的修改** - 定制的 skills 是核心功能
2. **手动审查上游变更** - 评估是否需要合并改进
3. **实验性功能用分支** - 测试可行后再合并到 main

### 版本号管理

修改 `plugin.json`，使用独立版本号：

```json
{
  "version": "4.0.3-lh.1"
}
```

### Gitignore

添加 `.superpowers-config.yaml` 到 `.gitignore`：

```bash
echo ".superpowers-config.yaml" >> .gitignore
```

可选：创建 `.superpowers-config.yaml.example` 作为模板提交到 git。

## 文件清单

### 新增文件

- `lib/config-manager.js` - 配置管理模块
- `.superpowers-config.yaml.example` - 配置模板

### 修改文件

- `skills/brainstorming/SKILL.md` - 增强文档输出
- `skills/using-git-worktrees/SKILL.md` - 添加决策点
- `skills/test-driven-development/SKILL.md` - 支持配置驱动
- `skills/finishing-a-development-branch/SKILL.md` - 根据配置调整选项
- `hooks/session-start.sh` - 增加配置检测
- `plugin.json` - 更新版本号
- `.gitignore` - 忽略配置文件

## 成功标准

1. ✅ 配置系统正常工作，能创建和读取配置
2. ✅ 所有关键决策点提供选择，且显示配置建议
3. ✅ 个人模式下默认使用轻量级流程（普通分支、本地 merge、可选测试）
4. ✅ 文档作为沟通媒介，支持编辑后继续
5. ✅ 能与上游保持同步，不丢失核心功能
6. ✅ 可以随时切换回原版 superpowers
