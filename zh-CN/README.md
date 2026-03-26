# Superpowers

Superpowers 是一个为您的编程智能体构建的完整软件开发工作流，它建立在一组可组合的“技能”和一些初始指令之上，确保您的智能体能够正确使用它们。

## 工作原理

它从您启动编程智能体的那一刻开始。一旦它发现您正在构建某些东西，它*不会*直接跳入尝试编写代码。相反，它会退一步，询问您真正想要实现的目标。

一旦它从对话中梳理出需求规格，它会以足够简短、便于您实际阅读和消化的块状形式展示给您。

在您确认设计之后，您的智能体会制定一个足够清晰的实施计划，即使是一个品味不佳、缺乏判断力、没有项目背景且厌恶测试的热心初级工程师也能遵循。它强调真正的红/绿测试驱动开发、YAGNI（您不会需要它）和 DRY 原则。

接下来，一旦您说“开始”，它会启动一个*子智能体驱动开发*过程，让智能体们处理每个工程任务，检查和评审他们的工作，并持续推进。Claude 通常能够自主工作数小时而不偏离您制定的计划。

其中还有更多内容，但这是系统的核心。由于技能会自动触发，您无需做任何特殊操作。您的编程智能体就拥有了 Superpowers。

## 赞助

如果 Superpowers 帮助您完成了能赚钱的事情，并且您有意愿，如果您能考虑[赞助我的开源工作](https://github.com/sponsors/obra)，我将不胜感激。

谢谢！

* Jesse

## 安装

**注意：** 安装方式因平台而异。Claude Code 或 Cursor 有内置的插件市场。Codex 和 OpenCode 需要手动设置。

### Claude Code 官方市场

Superpowers 可通过[官方 Claude 插件市场](https://claude.com/plugins/superpowers)获取

从 Claude 市场安装插件：

```bash
/plugin install superpowers@claude-plugins-official
```

### Claude Code（通过插件市场）

在 Claude Code 中，首先注册市场：

```bash
/plugin marketplace add obra/superpowers-marketplace
```

然后从此市场安装插件：

```bash
/plugin install superpowers@superpowers-marketplace
```

### Cursor（通过插件市场）

在 Cursor Agent 聊天中，从市场安装：

```text
/add-plugin superpowers
```

或在插件市场中搜索“superpowers”。

### Codex

告诉 Codex：

```
从 https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md 获取并遵循说明。
```

**详细文档：** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

告诉 OpenCode：

```
从 https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md 获取并遵循说明。
```

**详细文档：** [docs/README.opencode.md](docs/README.opencode.md)

### Gemini CLI

```bash
gemini extensions install https://github.com/obra/superpowers
```

要更新：

```bash
gemini extensions update superpowers
```

### 验证安装

在您选择的平台中启动一个新会话，并询问一些应该触发技能的事情（例如，“帮我规划这个功能”或“我们来调试这个问题”）。智能体应该会自动调用相关的 superpowers 技能。

## 基本工作流程

1. **头脑风暴** - 在编写代码前激活。通过提问完善粗略想法，探索替代方案，分部分呈现设计以供验证。保存设计文档。

2. **使用 Git 工作树** - 在设计批准后激活。在新分支上创建隔离的工作区，运行项目设置，验证干净的测试基线。

3. **编写计划** - 在批准设计后激活。将工作分解成小块任务（每个 2-5 分钟）。每个任务都有确切的文件路径、完整代码、验证步骤。

4. **子智能体驱动开发** 或 **执行计划** - 在计划制定后激活。为每个任务派遣新的子智能体，进行两阶段评审（规范符合性，然后是代码质量），或者分批执行并设置人工检查点。

5. **测试驱动开发** - 在实施过程中激活。强制执行 RED-GREEN-REFACTOR 循环：编写失败测试，观察其失败，编写最小化代码，观察其通过，提交。删除在测试之前编写的代码。

6. **请求代码审查** - 在任务之间激活。对照计划进行审查，按严重程度报告问题。关键问题会阻止进展。

7. **完成开发分支** - 在任务完成时激活。验证测试，呈现选项（合并/PR/保留/丢弃），清理工作树。

**智能体在任何任务前都会检查相关技能。** 这是强制性的工作流程，而非建议。

## 包含内容

### 技能库

**测试**

* **测试驱动开发** - RED-GREEN-REFACTOR 循环（包含测试反模式参考）

**调试**

* **系统化调试** - 4 阶段根本原因分析过程（包含根本原因追溯、深度防御、条件等待技术）
* **完成前验证** - 确保问题真正解决

**协作**

* **头脑风暴** - 苏格拉底式设计完善
* **编写计划** - 详细的实施计划
* **执行计划** - 带检查点的批量执行
* **派遣并行智能体** - 并发子智能体工作流
* **请求代码审查** - 预审查清单
* **接收代码审查** - 响应反馈
* **使用 Git 工作树** - 并行开发分支
* **完成开发分支** - 合并/PR 决策工作流
* **子智能体驱动开发** - 带两阶段评审（规范符合性，然后是代码质量）的快速迭代

**元技能**

* **编写技能** - 遵循最佳实践创建新技能（包含测试方法）
* **使用 superpowers** - 技能系统介绍

## 理念

* **测试驱动开发** - 始终先写测试
* **系统化优于临时性** - 流程优于猜测
* **降低复杂性** - 以简洁为主要目标
* **证据优于断言** - 在宣布成功前进行验证

阅读更多：[适用于 Claude Code 的 Superpowers](https://blog.fsck.com/2025/10/09/superpowers/)

## 贡献

技能直接存放在此代码库中。要贡献：

1. 分叉此代码库
2. 为您的技能创建一个分支
3. 遵循 `writing-skills` 技能来创建和测试新技能
4. 提交 PR

查看 `skills/writing-skills/SKILL.md` 获取完整指南。

## 更新

当您更新插件时，技能会自动更新：

```bash
/plugin update superpowers
```

## 许可证

MIT 许可证 - 详见 LICENSE 文件

## 社区

Superpowers 由 [Jesse Vincent](https://blog.fsck.com) 和 [Prime Radiant](https://primeradiant.com) 的其他成员共同构建。

如需社区支持、问题咨询，或分享您使用 Superpowers 构建的项目，欢迎加入我们的 [Discord](https://discord.gg/Jd8Vphy9jq)。

## 支持

* **Discord**：[加入我们的 Discord](https://discord.gg/Jd8Vphy9jq)
* **问题反馈**：https://github.com/obra/superpowers/issues
* **市场**：https://github.com/obra/superpowers-marketplace
