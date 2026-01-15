# Document-Driven AI Workflow Integration Guide

本文档展示如何在 superpowers 技能中集成 `document-driven-ai-workflow`，实现关键操作的自动文档生成。

## 🎯 集成概览

```
superpowers 技能 (流程编排)
         ↓
    检测配置启用
         ↓
    调用桥梁技能
         ↓
document-driven CLI 命令
         ↓
    统一的 .docs/ 目录
```

## 📋 集成点设计

### 1. brainstorming 技能集成

**集成位置**：设计完成后，写入设计文档之前

**添加代码** (在 `brainstorming/SKILL.md` 第 37 行附近)：

```markdown
## After the Design

**Documentation Integration:**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:
  **REQUIRED SUB-SKILL:** Use horspowerss:document-driven-bridge
  Run `$DOCS_CLI search "相关设计决策"` to check for existing decisions
  Run `$DOCS_CLI create decision "设计主题"` to capture technical decisions
  Update context if new architectural patterns discovered

**Documentation (original):**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
...
```

**效果**：
- ✅ 自动记录技术决策
- ✅ 搜索相关决策避免重复
- ✅ 建立项目知识库

### 2. writing-plans 技能集成

**集成位置**：计划创建完成后

**添加代码** (在 `writing-plans/SKILL.md` 第 100 行附近)：

```markdown
## Execution Handoff

**Documentation Integration:**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:
  **REQUIRED SUB-SKILL:** Use horspowerss:document-driven-bridge

  **Create task document:**
  ```bash
  $DOCS_CLI create task "实现：[feature-name]"
  ```

  Store the returned document path as `$TASK_DOC` for progress tracking.

**Original execution handoff:**
After saving the plan, offer execution choice:
...
```

**效果**：
- ✅ 自动创建任务跟踪文档
- ✅ 后续可更新任务状态
- ✅ 形成完整的任务历史

### 3. test-driven-development 技能集成

**集成位置**：测试失败需要调试时

**添加代码** (在 `test-driven-development/SKILL.md` RED 阶段)：

```markdown
## RED: Write a Failing Test

**Documentation Integration:**

IF test fails unexpectedly (not first run):
  Use horspowerss:document-driven-bridge
  Run `$DOCS_CLI create bug "测试失败：[test-name]"` to document investigation

**Original RED step:**
1. Write one test that fails
...
```

**集成位置**：Bug 修复完成时

```markdown
## GREEN: Make the Test Pass

**Documentation Integration:**

IF `$BUG_DOC` is set (from RED phase):
  Run `$DOCS_CLI update "$BUG_DOC" "status:已修复" "progress:[fix-description]"`

**Original GREEN step:**
1. Write the minimal code to make the test pass
...
```

**效果**：
- ✅ 自动记录 Bug 调查过程
- ✅ 建立 Bug 知识库
- ✅ 可追溯的修复历史

### 4. finishing-a-development-branch 技能集成

**集成位置**：测试通过后，呈现选项前

**添加代码** (在 `finishing-a-development-branch/SKILL.md` 第 39 行附近)：

```markdown
**If tests pass:**

**Documentation Integration:**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:
  **REQUIRED SUB-SKILL:** Use horspowerss:document-driven-bridge

  **Check project status:**
  ```bash
  $DOCS_CLI status
  ```

  **Archive completed documents:**
  ```bash
  # Archive completed tasks and bugs
  find .docs/active -name "*.md" -exec grep -l "status:已完成" {} \; | \
    xargs -I {} mv {} .docs/archive/
  ```

  **Update task document:**
  IF `$TASK_DOC` is set:
    Run `$DOCS_CLI update "$TASK_DOC" "status:已完成" "progress:代码已完成，准备合并"`

Continue to Step 2.
```

**效果**：
- ✅ 完成前查看项目状态
- ✅ 自动归档已完成文档
- ✅ 更新任务最终状态

## 🔧 配置文件示例

### 完整的 `.superpowers-config.yaml`

```yaml
# Superpowers 项目配置
version: "1.0"

# 开发模式：personal | team
development_mode: team

# 完成策略：merge | pr | keep
completion_strategy: pr

# 文档驱动工作流集成
documentation:
  enabled: true

  # CLI 工具路径（根据实际安装位置调整）
  cli_path: "node /path/to/document-driven-ai-workflow/cli.js"
  # 如果全局安装：cli_path: "docs"

  # 工作流集成配置
  workflows:
    brainstorming:
      # 开始前搜索
      pre_search:
        - "项目架构"
        - "相关决策"
      # 完成后创建
      create:
        - type: decision
          when: "technical_decisions_made"
          template: "技术决策记录"

    writing-plans:
      # 开始前搜索
      pre_search:
        - "相关功能"
        - "类似任务"
      # 完成后创建
      create:
        - type: task
          always: true
          template: "实现任务"

    test-driven-development:
      # 测试失败时
      create:
        - type: bug
          when: "test_fails_unexpectedly"
          template: "Bug 分析"
      # 修复完成时
      update:
        - type: bug
          when: "bug_fixed"
          status: "已修复"

    finishing-a-development-branch:
      # 完成前的操作
      actions:
        - type: status
          always: true
        - type: archive
          when: "merging_to_main"
        - type: update
          target: "task"
          status: "已完成"

  # 自动归档设置
  archive:
    enabled: true
    after_days: 30
    keep_active:
      - type: task
        status: ["进行中", "已阻塞"]
      - type: bug
        status: ["待修复", "进行中"]

  # 文档分类
  categories:
    decision:
      directory: ".docs/active"
      archive_after: "merged"
    task:
      directory: ".docs/active"
      archive_after: "completed"
    bug:
      directory: ".docs/active"
      archive_after: "fixed"
    context:
      directory: ".docs/context"
      archive_after: "never"
```

## 🚀 快速开始

### 步骤 1：安装 document-driven-ai-workflow

```bash
# 克隆仓库
git clone https://github.com/LouisHors/document-driven-ai-workflow.git
cd document-driven-ai-workflow

# 验证 CLI 工具
node cli.js --help
```

### 步骤 2：创建项目配置

```bash
# 在你的项目根目录
cat > .superpowers-config.yaml << 'EOF'
documentation:
  enabled: true
  cli_path: "node /path/to/document-driven-ai-workflow/cli.js"
EOF
```

### 步骤 3：初始化文档目录

```bash
# 运行初始化
node /path/to/document-driven-ai-workflow/cli.js init

# 创建初始上下文
node /path/to/document-driven-ai-workflow/cli.js create context "项目概览"
```

### 步骤 4：开始使用

现在当你使用 superpowers 技能时，文档会自动创建和更新：

```bash
# 示例工作流
claude "帮我设计一个用户管理功能"
# → brainstorming 技能运行
# → 自动创建 decision 文档

claude "帮我写实现计划"
# → writing-plans 技能运行
# → 自动创建 task 文档

claude "开始实现"
# → subagent-driven-development 技能运行
# → 自动更新 task 进度

claude "完成了"
# → finishing-a-development-branch 技能运行
# → 自动查看状态并归档文档
```

## 📊 集成效果对比

### 传统 superpowers 工作流

```
brainstorming → 设计文档 (一次性)
                ↓
writing-plans → 实施计划 (一次性)
                ↓
implementation → 代码实现
                ↓
finishing → 合并/PR
```

**问题**：
- ❌ 文档分散在 `docs/plans/` 目录
- ❌ 无法追溯任务状态变化
- ❌ 跨会话无法获取上下文
- ❌ 决策和 Bug 记录缺失

### 集成文档驱动工作流后

```
brainstorming → 搜索上下文 → 创建 decision 文档
                ↓
writing-plans → 搜索相关任务 → 创建 task 文档
                ↓
implementation → 更新 task 进度 → 创建 bug 文档（如有）
                ↓
finishing → 查看状态 → 归档文档 → 更新最终状态
```

**优势**：
- ✅ 统一的 `.docs/` 目录结构
- ✅ 完整的任务状态历史
- ✅ 跨会话的上下文记忆
- ✅ 全面的决策和 Bug 知识库

## 🎯 最佳实践

### 1. 配置管理

- **个人项目**：使用 `development_mode: personal`，简化文档流程
- **团队项目**：使用 `development_mode: team`，启用完整文档跟踪
- **临时实验**：设置 `documentation.enabled: false` 跳过文档生成

### 2. 文档维护

- **定期归档**：使用 `finishing-a-development-branch` 时自动归档
- **上下文优先**：项目初期多创建 `context` 文档
- **决策记录**：重要的技术选择都要记录 `decision` 文档

### 3. 搜索策略

- **开始前搜索**：使用 `docs:search` 了解现有工作
- **避免重复**：搜索后再创建新文档
- **关联查找**：按关键词搜索相关文档

## 🔍 故障排查

### CLI 命令找不到

**症状**：`command not found` 错误

**解决方案**：
```yaml
# 使用绝对路径
documentation:
  cli_path: "/full/path/to/document-driven-ai-workflow/cli.js"
```

### 文档未创建

**症状**：集成点被跳过

**检查**：
1. 确认 `documentation.enabled: true`
2. 确认 `.superpowers-config.yaml` 在项目根目录
3. 检查技能中是否正确添加了集成代码

### 无法找到之前创建的文档

**解决方案**：
```bash
# 运行状态查看
node cli.js status

# 搜索文档
node cli.js search "关键词"
```

## 📚 相关资源

- **[document-driven-bridge 技能](../skills/document-driven-bridge/SKILL.md)** - 桥梁技能文档
- **[document-driven-ai-workflow](https://github.com/LouisHors/document-driven-ai-workflow)** - 原始仓库
- **[superpowers 技能系统](../README.md)** - Superpowers 主文档

## 🤝 贡献

欢迎提交改进建议和问题反馈！

---

**让 AI 成为你的项目长期合作伙伴！** 🚀
