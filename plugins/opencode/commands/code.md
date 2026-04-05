---
description: 分角色 Coding Agent
---

# /ace-code - 分角色 Coding Agent

根据场景自动选择编码角色，聚焦对应工作目录和工具集。Argument: `$ARGUMENTS`

## Determine Role

解析 `$ARGUMENTS`：
- `user [task]`：用户编码模式 — 修改 `~/.ace/` 下的数据和 node
- `device [device-name] [task]`：设备适配模式 — 修改 `~/.ace/store/devices/` 中的设备定义
- `dev [task]`：ACE 平台开发模式 — 修改 ACE 平台源代码
- 无参数：自动检测场景（见下方 Auto-Detect）

## Auto-Detect Role

当无参数或无法从参数判断角色时，按以下顺序检测：

1. **检查当前工作文件**：
   - 如果最近编辑的文件在 `~/.ace/store/` 下 → **user**
   - 如果最近编辑的文件在 `~/.ace/store/devices/` 下 → **device**
   - 如果最近编辑的文件在 `src/core/`、`src/cli/`、`src/backend/`、`tests/` 下 → **dev**

2. **检查 git status**：
   ```bash
   git diff --name-only HEAD 2>/dev/null | head -20
   ```
   - 包含 `~/.ace/store/devices/` 路径 → **device**
   - 包含 `src/core/` 或 `src/cli/` 或 `src/backend/` 或 `tests/` 路径 → **dev**

3. **如果无法自动判断**：展示角色选择菜单：
   ```
   请选择编码角色：
   1. user    — 修改 ~/.ace 下自己的数据和 node
   2. device  — 设备适配，修改 store/devices 中的内容
   3. dev     — 开发 ACE 平台本身
   ```

## Role Dispatch

确定角色后，使用 Agent tool 调度对应的编码子 agent：

### user 角色
```
Agent(prompt: "<user_task>", subagent_type: "ace-coder-user")
```
- 工作目录: `~/.ace/store/`
- 技能: knowledge, workflow, workflow_builder, node_builder, sandbox
- 约束: 只修改 `~/.ace/` 下内容，不修改平台源代码

### device 角色
```
Agent(prompt: "<user_task>", subagent_type: "ace-coder-device")
```
- 工作目录: `~/.ace/store/devices/`（如指定了设备名，聚焦到 `~/.ace/store/devices/<device-name>/`）
- 技能: sandbox, knowledge, node_builder
- 约束: 只修改 `~/.ace/store/devices/` 下内容，不修改 `src/core/`

### dev 角色
```
Agent(prompt: "<user_task>", subagent_type: "ace-coder-dev")
```
- 工作目录: 项目根目录
- 技能: 全部
- 约束: 遵循 CLAUDE.md 规范，修改前先读文档

## Examples

```
/ace-code user 帮我创建一个数据预处理节点
/ace-code device stm/nanonis 添加新的扫描操作到 SKILL.md
/ace-code dev 为 workflow engine 添加并行执行支持
/ace-code                              ← 自动检测场景
```

## Source of Truth

1. `CLAUDE.md`
2. `.claude/agents/ace-coder-user.md`
3. `.claude/agents/ace-coder-device.md`
4. `.claude/agents/ace-coder-dev.md`
