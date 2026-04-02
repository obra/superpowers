# Codex 工具映射

技能使用 Claude Code 工具名称。当您在技能中遇到这些时，请使用您平台的等效工具：

| 技能引用 | Codex 等效工具 |
|-----------------|------------------|
| `Task` 工具（派遣子代理） | `spawn_agent` |
| 多个 `Task` 调用（并行） | 多个 `spawn_agent` 调用 |
| 任务返回结果 | `wait` |
| 任务自动完成 | `close_agent` 以释放槽位 |
| `TodoWrite`（任务跟踪） | `update_plan` |
| `Skill` 工具（调用技能） | 技能原生加载——只需遵循指令 |
| `Read`、`Write`、`Edit`（文件） | 使用您原生的文件工具 |
| `Bash`（运行命令） | 使用您原生的 shell 工具 |

## 子代理分发需要多代理支持

添加到您的 Codex 配置（`~/.codex/config.toml`）：

```toml
[features]
multi_agent = true
```

这将启用 `spawn_agent`、`wait` 和 `close_agent`，适用于像 `dispatching-parallel-agents` 和 `subagent-driven-development` 这样的技能。
