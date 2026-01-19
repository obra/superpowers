# 文档驱动工作流集成 - 快速开始

> **⚠️ DEPRECATED - 此文档已过时**
>
> **此文档描述的 bridge 集成方式已被统一文档系统替代。**
>
> **请使用新的统一文档系统：**
> - 查看 [统一文档系统指南](./unified-document-system.md)
> - 参考 [文档迁移指南](./document-migration-guide.md)
> - 阅读设计文档：[docs/plans/2025-01-19-unified-document-system-design.md](./plans/2025-01-19-unified-document-system-design.md)
>
> **新系统更简单：**
> - 无需单独安装 document-driven-ai-workflow
> - 只需在 `.horspowers-config.yaml` 中设置 `documentation.enabled: true`
> - 运行 `/docs-init` 初始化即可
> - 所有工作流技能自动支持文档生成
>
> **此文档仅保留用于历史参考。新项目请勿使用 bridge 方式。**

---

5 分钟内为 superpowers 启用文档驱动 AI 工作流。

## 🎯 目标

在 superpowers 的关键操作步骤中自动触发文档生成，建立跨会话的 AI 上下文记忆。

## 📋 前置要求

- ✅ 已安装 superpowers（当前目录）
- ✅ Node.js 16+ 环境
- ✅ 一个需要 AI 协作的项目

## 🚀 快速开始（3 步）

### 步骤 1：安装 document-driven-ai-workflow

```bash
# 1. 克隆仓库（建议放在父目录）
cd /path/to/parent
git clone https://github.com/LouisHors/document-driven-ai-workflow.git

# 2. 验证安装
cd document-driven-ai-workflow
node cli.js --help

# 3. 测试 CLI
node cli.js init
```

**预期输出**：
```
✓ Created .docs/active
✓ Created .docs/context
✓ Created .docs/templates
✓ Created .docs/archive
Documentation structure initialized!
```

### 步骤 2：配置你的项目

```bash
# 1. 进入你的项目目录
cd /path/to/your/project

# 2. 复制配置模板
cp /path/to/horspowers/.superpowers-config.template.yaml .superpowers-config.yaml

# 3. 编辑配置文件
nano .superpowers-config.yaml  # 或使用你喜欢的编辑器
```

**最小配置**（只需修改这两行）：

```yaml
# 启用文档集成
documentation:
  enabled: true
  # 修改为实际的 CLI 路径
  cli_path: "node /absolute/path/to/document-driven-ai-workflow/cli.js"
```

**完整路径示例**：

```yaml
documentation:
  enabled: true
  # Mac/Linux 示例
  cli_path: "node /Users/username/document-driven-ai-workflow/cli.js"
  # Windows 示例
  # cli_path: "node C:\\Users\\username\\document-driven-ai-workflow\\cli.js"
```

### 步骤 3：初始化项目文档

```bash
# 1. 初始化文档结构
node /path/to/document-driven-ai-workflow/cli.js init

# 2. 创建项目上下文（可选但推荐）
node /path/to/document-driven-ai-workflow/cli.js create context "项目概览"
node /path/to/document-driven-ai-workflow/cli.js create context "技术架构"
node /path/to/document-driven-ai-workflow/cli.js create context "开发规范"

# 3. 查看状态
node /path/to/document-driven-ai-workflow/cli.js status
```

**完成！** 🎉

现在你的项目已经配置好文档驱动工作流。

## ✅ 验证集成

创建一个测试会话来验证集成是否工作：

```bash
cd /path/to/your/project
claude
```

在 Claude Code 中输入：

```
我需要添加一个用户登录功能，帮我设计一下
```

**预期行为**：

1. **brainstorming 技能启动**
2. **自动搜索**：`docs:search "项目架构"`
3. **设计讨论**
4. **自动创建**：`docs:create decision "技术决策：用户认证方案"`
5. **保存设计文档**

继续输入：

```
帮我写实现计划
```

**预期行为**：

1. **writing-plans 技能启动**
2. **自动搜索**：`docs:search "相关功能"`
3. **创建实施计划**
4. **自动创建**：`docs:create task "实现：用户登录功能"`

## 📊 效果对比

### 集成前

```
你：帮我添加用户登录功能
AI：好的，让我开始设计...
[设计过程]
AI：设计完成，保存到 docs/plans/2025-01-07-login-design.md

[几小时后，新会话]
你：继续之前的登录功能
AI：什么登录功能？让我重新看一下文档...
```

### 集成后

```
你：帮我添加用户登录功能
AI：正在搜索项目上下文...
    ✓ 找到 3 个相关文档
    ✓ 项目架构：React + Node.js
    ✓ 技术决策：使用 JWT 认证
AI：基于项目背景，我建议以下方案...
[设计过程]
AI：创建决策文档：.docs/active/2025-01-07-decision-登录认证方案.md
AI：创建任务文档：.docs/active/2025-01-07-task-用户登录功能.md

[几小时后，新会话]
你：继续之前的登录功能
AI：正在搜索相关任务...
    ✓ 找到活跃任务：用户登录功能（状态：进行中）
    ✓ 当前进度：完成基础组件
AI：我了解情况了，上次我们完成了基础组件，现在继续...
```

## 🎯 常用命令

### 项目管理

```bash
# 查看所有活跃文档
docs:status

# 搜索相关文档
docs:search "登录"

# 创建新文档
docs:create context "新的上下文"
docs:create task "新任务"
docs:create decision "技术决策"
docs:create bug "Bug 描述"
```

### 任务跟踪

```bash
# 更新任务状态
docs:update ".docs/active/任务文档.md" "status:进行中" "progress:完成组件开发"

# 标记完成
docs:update ".docs/active/任务文档.md" "status:已完成"
```

## 🔧 自定义配置

### 个人项目（简化模式）

```yaml
development_mode: personal
completion_strategy: merge

documentation:
  enabled: true
  cli_path: "node /path/to/cli.js"
  workflows:
    finishing-a-development-branch:
      actions:
        - type: update  # 只更新状态，不创建 PR
```

### 团队项目（完整模式）

```yaml
development_mode: team
completion_strategy: pr

documentation:
  enabled: true
  cli_path: "node /path/to/cli.js"
  workflows:
    brainstorming:
      create:
        - type: decision
          when: "technical_decisions_made"
    writing-plans:
      create:
        - type: task
          always: true
    test-driven-development:
      create:
        - type: bug
          when: "test_fails"
    finishing-a-development-branch:
      actions:
        - type: status
        - type: archive
```

### 临时实验（禁用文档）

```yaml
documentation:
  enabled: false  # 临时禁用文档生成
```

## ❓ 常见问题

### Q: CLI 路径总是报错找不到

**A:** 使用绝对路径而不是相对路径：

```yaml
# ❌ 不推荐
cli_path: "node ../document-driven-ai-workflow/cli.js"

# ✅ 推荐
cli_path: "node /Users/username/document-driven-ai-workflow/cli.js"
```

### Q: 文档创建在哪里？

**A:** 在项目根目录的 `.docs/` 文件夹：

```
your-project/
├── .docs/
│   ├── active/       # 活跃的任务、Bug、决策
│   ├── context/      # 项目上下文文档
│   ├── templates/    # 文档模板
│   └── archive/      # 已完成的文档
├── .superpowers-config.yaml
└── ...
```

### Q: 会产生太多文档吗？

**A:** 取决于你的使用频率。建议：

1. **重要决策才记录** - 不是所有设计都需要 decision 文档
2. **定期归档** - 使用 `finishing-a-development-branch` 自动归档
3. **按需启用** - 临时工作可以设置 `documentation.enabled: false`

### Q: 如何禁用某个工作流的文档？

**A:** 在配置文件中移除对应的 workflow 配置：

```yaml
workflows:
  # 移除 test-driven-development 配置即可禁用
  brainstorming:
    create:
      - type: decision
```

## 📚 下一步

- 📖 阅读 [完整集成指南](document-driven-integration-guide.md)
- 🔧 查看 [桥梁技能文档](../skills/document-driven-bridge/SKILL.md)
- 🎮 尝试 [示例项目](../examples/)

## 🆘 需要帮助？

1. **检查配置**：运行 `docs:status` 验证 CLI 工具可用
2. **查看日志**：技能调用时会显示执行的命令
3. **阅读文档**：[完整文档](document-driven-integration-guide.md)

---

**开始享受跨会话的 AI 记忆吧！** 🚀
