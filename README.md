# Superpowers

Superpowers 是为你的编程代理（coding agents）构建的完整软件开发工作流，它基于一组可组合的"技能"（skills）和一些确保你的代理正确使用这些技能的初始指令。

## 工作原理

一切都从你启动编程代理的那一刻开始。一旦它意识到你在构建某个东西，它*不会*直接跳进写代码的环节。相反，它会先停下来，问问你**真正想要做什么**。

一旦它从对话中提炼出需求规格，它会以足够短的片段展示给你，让你真正能读懂并消化。

等你签署并批准设计方案后，你的代理会整理出一份清晰的实现计划——这份计划清晰到一位热情的初级工程师（品味一般、没有评判能力、不了解项目背景、还讨厌测试 😈）也能照着执行。它强调真正的红/绿 TDD、YAGNI（你以后不会需要它）和 DRY 原则。

接下来，当你一声令下"出发"，它就启动**子代理驱动开发**（subagent-driven-development）流程，让代理们逐个完成工程任务，检查并审查他们的工作，然后继续推进。Claude 经常能够按照你制定的计划自主工作几个小时而不跑偏！

还有很多细节，但这是系统的核心。而且因为技能是自动触发的，你不需要做任何特别的事情。你的编程代理自然就拥有了 Superpowers。

## 赞助

如果 Superpowers 帮你赚到了钱，而你又有意愿的话，我非常感激你能考虑[赞助我的开源工作](https://github.com/sponsors/obra)。

非常感谢！

- Jesse

## 安装

**注意：** 安装方式因平台而异。Claude Code 有内置插件系统。Codex、OpenCode 和 CodeBuddy 需要手动设置。

### Claude Code（通过插件市场）

在 Claude Code 中，先注册市场：

```bash
/plugin marketplace add obra/superpowers-marketplace
```

然后从这个市场安装插件：

```bash
/plugin install superpowers@superpowers-marketplace
```

### 验证安装

检查命令是否出现：

```bash
/help
```

```
# 应该能看到：
# /superpowers:brainstorm - 交互式设计细化
# /superpowers:write-plan - 创建实现计划
# /superpowers:execute-plan - 批量执行计划
```

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

### CodeBuddy (Tencent) (包括 Internal 版本)

CodeBuddy 通过 MCP (Model Context Protocol) 协议集成 Superpowers。

**快速安装：**

克隆仓库并配置 MCP 服务器：

```bash
mkdir -p ~/.codebuddy
git clone https://github.com/obra/superpowers.git ~/.codebuddy/superpowers
cd ~/.codebuddy/superpowers/.codebuddy/mcp-server
npm install
```

然后在 CodeBuddy 的 Craft 模式中配置 MCP：

```json
{
  "name": "superpowers",
  "type": "stdio",
  "command": "node",
  "args": ["~/.codebuddy/superpowers/.codebuddy/mcp-server/index.js"],
  "disabled": false,
  "configSource": "user",
  "timeout": 60
}
```

**详细文档：** [docs/README.codebuddy.md](docs/README.codebuddy.md)

## 基本工作流程

1. **头脑风暴（brainstorming）** - 在写代码之前激活。通过问题细化粗略的想法，探索替代方案，以章节形式展示设计以供验证。保存设计文档。

2. **使用 Git 工作树（using-git-worktrees）** - 设计批准后激活。在新分支上创建隔离的工作空间，运行项目设置，验证干净的测试基线。

3. **编写计划（writing-plans）** - 获得批准的设计后激活。将工作分解为小型任务（每个 2-5 分钟）。每个任务都有确切的文件路径、完整代码、验证步骤。

4. **子代理驱动开发（subagent-driven-development）或执行计划（executing-plans）** - 有了计划后激活。为每个任务分派一个新的子代理，进行两阶段审查（先符合规格，再代码质量），或者以人工检查点的方式批量执行。

5. **测试驱动开发（test-driven-development）** - 实现过程中激活。强制执行 RED-GREEN-REFACTOR：先写失败的测试，看它失败，写最少的代码，看它通过，提交。删除测试前写的代码。

6. **请求代码审查（requesting-code-review）** - 任务之间激活。对照计划审查，按严重程度报告问题。关键问题会阻塞进度。

7. **完成开发分支（finishing-a-development-branch）** - 任务完成后激活。验证测试，呈现选项（合并/PR/保留/丢弃），清理工作树。

**代理在任何任务之前都会检查相关技能。** 这是强制性的工作流程，不是建议。

## 里面有什么

### 技能库（Skills Library）

**测试**
- **test-driven-development** - RED-GREEN-REFACTOR 循环（包含测试反模式参考）

**调试**
- **systematic-debugging** - 4 阶段根因过程（包含根因追踪、纵深防御、基于条件的等待技术）
- **verification-before-completion** - 确保真正修复

**协作**
- **brainstorming** - 苏格拉底式设计细化 😈 *就像苏格拉底用提问引导学生自己找到答案，这招在代码评审时也超有用！*
- **writing-plans** - 详细实现计划
- **executing-plans** - 带检查点的批量执行
- **dispatching-parallel-agents** - 并发子代理工作流
- **requesting-code-review** - 预审查检查表
- **receiving-code-review** - 响应反馈
- **using-git-worktrees** - 并行开发分支
- **finishing-a-development-branch** - 合并/PR 决策工作流
- **subagent-driven-development** - 快速迭代，两阶段审查（先符合规格，再代码质量）

**元技能**
- **writing-skills** - 创建新技能，遵循最佳实践（包含测试方法论）
- **using-superpowers** - 技能系统介绍

## 设计理念

- **测试驱动开发** - 始终先写测试
- **系统化而非临时** - 过程重于猜测
- **降低复杂度** - 简洁性是主要目标
- **证据而非声明** - 在宣布成功之前先验证

阅读更多：[Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## 贡献

技能直接存储在这个仓库中。要贡献：

1. Fork 仓库
2. 为你的技能创建分支
3. 遵循 `writing-skills` 技能来创建和测试新技能
4. 提交 PR

查看 `skills/writing-skills/SKILL.md` 获取完整指南。

## 更新

当你更新插件时，技能会自动更新：

```bash
/plugin update superpowers
```

## 许可证

MIT 许可证 - 查看 LICENSE 文件了解详情

## 支持

- **问题**：https://github.com/obra/superpowers/issues
- **市场**：https://github.com/obra/superpowers-marketplace
