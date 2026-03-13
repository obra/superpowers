# Superpowers

Superpowers 是一套专为编程智能体打造的完整软件开发工作流，构建在一组可组合的"技能"之上，并配有初始指令，确保你的智能体能够正确使用这些技能。

## 工作原理

一切从你启动编程智能体的那一刻开始。当它察觉到你要构建某个东西时，*不会*急着直接写代码，而是先停下来，问你真正想做什么。

通过一系列对话提炼出需求规格后，它会分段展示给你——每段都足够简短，让你能真正读懂并消化。

在你确认设计方案之后，智能体会制定一份实现计划，清晰到即使是热情满满却经验不足、品味欠佳、缺乏判断力、没有项目背景、又不爱写测试的初级工程师也能照着执行。计划强调真正的红绿测试驱动开发（TDD）、YAGNI（你不会需要它）和 DRY 原则。

接下来，当你说"开始"，系统会启动*子智能体驱动开发*流程——让多个智能体逐一完成各项工程任务，检查并审查它们的工作，然后继续推进。Claude 往往能在不偏离你制定的计划的情况下，连续自主工作数小时。

当然还有更多内容，但这就是系统的核心。由于技能会自动触发，你无需做任何特殊操作——你的编程智能体就是拥有了 Superpowers。


## 赞助

如果 Superpowers 帮助你做成了一些有收益的事，并且你愿意的话，我非常感谢你考虑[赞助我的开源工作](https://github.com/sponsors/obra)。

谢谢！

— Jesse


## 安装

**注意：** 不同平台的安装方式有所不同。Claude Code 或 Cursor 有内置插件市场，Codex 和 OpenCode 需要手动配置。

### Claude Code 官方市场

Superpowers 已上架[官方 Claude 插件市场](https://claude.com/plugins/superpowers)

从 Claude 市场安装插件：

```bash
/plugin install superpowers@claude-plugins-official
```

### Claude Code（通过插件市场）

在 Claude Code 中，先注册市场：

```bash
/plugin marketplace add obra/superpowers-marketplace
```

然后从该市场安装插件：

```bash
/plugin install superpowers@superpowers-marketplace
```

### Cursor（通过插件市场）

在 Cursor Agent 聊天中，从市场安装：

```text
/add-plugin superpowers
```

或在插件市场搜索"superpowers"。

### Codex

告诉 Codex：

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

**详细文档：** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

告诉 OpenCode：

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

**详细文档：** [docs/README.opencode.md](docs/README.opencode.md)

### Gemini CLI

```bash
gemini extensions install https://github.com/obra/superpowers
```

更新：

```bash
gemini extensions update superpowers
```

### 验证安装

在你选择的平台中开启一个新会话，并请求一个应当触发技能的操作（例如："帮我规划这个功能"或"我们来调试这个问题"）。智能体应自动调用相关的 Superpowers 技能。

## 基本工作流程

1. **brainstorming（头脑风暴）** - 在写代码之前激活。通过提问打磨模糊想法，探索替代方案，分段展示设计以供验证，并保存设计文档。

2. **using-git-worktrees（使用 Git 工作树）** - 在设计获批后激活。在新分支上创建隔离工作空间，运行项目初始化，验证干净的测试基线。

3. **writing-plans（编写计划）** - 在设计获批时激活。将工作拆分为小任务（每个 2-5 分钟）。每个任务都有精确的文件路径、完整代码和验证步骤。

4. **subagent-driven-development（子智能体驱动开发）** 或 **executing-plans（执行计划）** - 在有计划时激活。为每个任务派发全新子智能体并进行两阶段审查（规格合规性检查，然后是代码质量检查），或分批执行并设置人工检查点。

5. **test-driven-development（测试驱动开发）** - 在实现过程中激活。强制执行红-绿-重构循环：先写失败测试，确认它失败，再写最少量代码，确认它通过，然后提交。删除在测试之前写的代码。

6. **requesting-code-review（请求代码审查）** - 在任务之间激活。对照计划进行审查，按严重程度报告问题。关键问题会阻止进度继续。

7. **finishing-a-development-branch（完成开发分支）** - 在任务完成时激活。验证测试，提供选项（合并/PR/保留/丢弃），清理工作树。

**智能体在任何任务之前都会检查相关技能。** 这是强制工作流，不是建议。

## 内容一览

### 技能库

**测试**
- **test-driven-development** - 红-绿-重构循环（包含测试反模式参考）

**调试**
- **systematic-debugging** - 4 阶段根因分析流程（包含根因追踪、深度防御、条件等待技术）
- **verification-before-completion** - 确保问题真正已修复

**协作**
- **brainstorming** - 苏格拉底式设计打磨
- **writing-plans** - 详细实现计划
- **executing-plans** - 分批执行并设检查点
- **dispatching-parallel-agents** - 并发子智能体工作流
- **requesting-code-review** - 审查前检查清单
- **receiving-code-review** - 响应反馈
- **using-git-worktrees** - 并行开发分支
- **finishing-a-development-branch** - 合并/PR 决策工作流
- **subagent-driven-development** - 快速迭代并配两阶段审查（规格合规性，然后代码质量）

**元技能**
- **writing-skills** - 按最佳实践创建新技能（包含测试方法论）
- **using-superpowers** - 技能系统介绍

## 理念

- **测试驱动开发** - 永远先写测试
- **系统化而非临时性** - 用流程代替猜测
- **降低复杂度** - 简洁是首要目标
- **证据胜于声明** - 在宣告成功之前先验证

阅读更多：[Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## 贡献

技能直接存放在本仓库中。参与贡献：

1. Fork 本仓库
2. 为你的技能创建一个分支
3. 参考 `writing-skills` 技能来创建和测试新技能
4. 提交 PR

详见 `skills/writing-skills/SKILL.md` 完整指南。

## 更新

更新插件时技能会自动更新：

```bash
/plugin update superpowers
```

## 许可证

MIT 许可证 - 详见 LICENSE 文件

## 支持

- **问题反馈**：https://github.com/obra/superpowers/issues
- **插件市场**：https://github.com/obra/superpowers-marketplace
