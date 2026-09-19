# Codex 工具映射

技能使用 Claude Code 工具名称。当您在技能中遇到这些时，请使用您平台的等效工具：

| 技能参考 | Codex 对应项 |
|-----------------|------------------|
| `Task` 工具（分派子代理） | `spawn_agent`（参见[命名代理分派](#命名代理分派)） |
| 多个 `Task` 调用（并行） | 多个 `spawn_agent` 调用 |
| 任务返回结果 | `wait` |
| 任务自动完成 | `close_agent` 以释放槽位 |
| `TodoWrite`（任务跟踪） | `update_plan` |
| `Skill` 工具（调用技能） | 技能原生加载——只需遵循指令 |
| `Read`、`Write`、`Edit`（文件） | 使用您的原生文件工具 |
| `Bash`（运行命令） | 使用您的原生 Shell 工具 |

## 子代理分发需要多代理支持

添加到您的 Codex 配置（`~/.codex/config.toml`）：

```toml
[features]
multi_agent = true
```

这将启用 `spawn_agent`、`wait` 和 `close_agent`，适用于像 `dispatching-parallel-agents` 和 `subagent-driven-development` 这样的技能。

## 命名代理分派

Claude Code 技能引用命名代理类型，如 `superpowers:code-reviewer`。
Codex 没有命名代理注册表——`spawn_agent` 从内置角色（`default`、`explorer`、`worker`）创建通用代理。

当技能要求分派一个命名代理类型时：

1. 找到该代理的提示文件（例如，`agents/code-reviewer.md` 或技能的本地提示模板，如 `code-quality-reviewer-prompt.md`）
2. 读取提示内容
3. 填充所有模板占位符（`{BASE_SHA}`、`{WHAT_WAS_IMPLEMENTED}` 等）
4. 生成一个 `worker` 代理，并将填充后的内容作为 `message`

| 技能指令 | Codex 对应项 |
|-------------------|------------------|
| `Task tool (superpowers:code-reviewer)` | `spawn_agent(agent_type="worker", message=...)`，附带 `code-reviewer.md` 内容 |
| `Task tool (general-purpose)` 附带内联提示 | `spawn_agent(message=...)`，附带相同提示 |

### 消息框架

`message` 参数是用户级输入，而非系统提示。请为其构建结构以实现最大指令遵循：

```
你的任务是执行以下操作。请严格按照以下说明执行。

<agent-instructions>
[来自代理 .md 文件的已填充提示内容]
</agent-instructions>

立即执行。仅输出符合上述说明中指定格式的结构化响应。
```

* 使用任务委派框架（"您的任务是..."）而非角色框架（"您是..."）
* 将指令包裹在 XML 标签中——模型将带标签的块视为权威
* 以明确的执行指令结尾，以防止对指令进行总结

### 何时可以移除此变通方案

此方法是为了弥补 Codex 的插件系统尚不支持在 `plugin.json` 中包含 `agents` 字段。当 `RawPluginManifest` 获得 `agents` 字段时，插件可以符号链接到 `agents/`（镜像现有的 `skills/` 符号链接），并且技能可以直接分派命名代理类型。

## 环境检测

创建 worktree 或完成分支的技能应在继续之前，使用只读 git 命令检测其环境：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

* `GIT_DIR != GIT_COMMON` → 已在链接的 worktree 中（跳过创建）
* `BRANCH` 为空 → 分离的 HEAD（无法从沙盒中分支/推送/PR）

有关每个技能如何使用这些信号的示例，请参见 `using-git-worktrees` 第 0 步和 `finishing-a-development-branch` 第 1 步。

## Codex App 完成

当沙盒阻止分支/推送操作时（在外部管理的 worktree 中处于分离的 HEAD 状态），代理将提交所有工作并通知用户使用 App 的原生控件：

* **"创建分支"** —— 命名分支，然后通过 App UI 提交/推送/PR
* **"移交到本地"** —— 将工作转移到用户的本地检出

代理仍然可以运行测试、暂存文件，并输出建议的分支名称、提交消息和 PR 描述供用户复制。
