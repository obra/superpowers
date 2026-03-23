# OpenCode 的 Superpowers

与 [OpenCode.ai](https://opencode.ai) 一起使用 Superpowers 的完整指南。

## 安装

将 superpowers 添加到你的 `opencode.json`（全局或项目级）中的 `plugin` 数组：

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

重启 OpenCode。插件将通过 Bun 自动安装并自动注册所有技能。

通过询问以下内容进行验证：“告诉我关于你的 superpowers”

### 从旧的基于符号链接的安装迁移

如果你之前使用 `git clone` 和符号链接安装了 superpowers，请移除旧设置：

```bash
# Remove old symlinks
rm -f ~/.config/opencode/plugins/superpowers.js
rm -rf ~/.config/opencode/skills/superpowers

# Optionally remove the cloned repo
rm -rf ~/.config/opencode/superpowers

# Remove skills.paths from opencode.json if you added one for superpowers
```

然后按照上述安装步骤操作。

## 使用

### 查找技能

使用 OpenCode 原生的 `skill` 工具列出所有可用技能：

```
使用技能工具来列出技能
```

### 加载技能

```
使用技能工具加载 superpowers/brainstorming
```

### 个人技能

在 `~/.config/opencode/skills/` 中创建您自己的技能：

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

创建 `~/.config/opencode/skills/my-skill/SKILL.md`：

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# 我的技能

[你的技能内容在此]
```

### 项目技能

在你的项目中，于 `.opencode/skills/` 内创建项目特定技能。

**技能优先级：** 项目技能 > 个人技能 > Superpowers 技能

## 更新

Superpowers 在你重启 OpenCode 时会自动更新。插件在每次启动时都会从 git 仓库重新安装。

要固定特定版本，请使用分支或标签：

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git#v5.0.3"]
}
```

## 工作原理

该插件执行两项操作：

1. **通过 `experimental.chat.system.transform` 钩子注入引导上下文**，为每次对话添加 superpowers 感知。
2. **通过 `config` 钩子注册技能目录**，以便 OpenCode 无需符号链接或手动配置即可发现所有 superpowers 技能。

### 工具映射

为 Claude Code 编写的技能会自动适配到 OpenCode：

* `TodoWrite` → `todowrite`
* 带有子代理的 `Task` → OpenCode 的 `@mention` 系统
* `Skill` 工具 → OpenCode 原生的 `skill` 工具
* 文件操作 → 原生 OpenCode 工具

## 故障排除

### 插件未加载

1. 检查 OpenCode 日志：`opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
2. 验证你的 `opencode.json` 中的插件行是否正确
3. 确保你运行的是最新版本的 OpenCode

### 技能未找到

1. 使用 OpenCode 的 `skill` 工具列出可用技能
2. 检查插件是否正在加载（见上文）
3. 每个技能都需要一个带有有效 YAML 前置元数据的 `SKILL.md` 文件

### 引导程序未出现

1. 检查 OpenCode 版本是否支持 `experimental.chat.system.transform` 钩子
2. 在配置更改后重启 OpenCode

## 获取帮助

* 报告问题：https://github.com/obra/superpowers/issues
* 主要文档：https://github.com/obra/superpowers
* OpenCode 文档：https://opencode.ai/docs/
