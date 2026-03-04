# Idea: Horspowers + Beads 整合

## 背景

当前 Horspowers 和 Beads 是两个独立的系统：
- **Horspowers**：提供开发方法论（brainstorming、writing-plans、executing-plans 等）
- **Beads**：提供任务追踪（issue、epic、task、状态管理）, 仓库：https://github.com/steveyegge/beads，本地已安装

但实际上两者有**天然的映射关系**，可以完美整合。

---

## 映射关系

| Horspowers Skill | 产出物 | Beads 对应 |
|------------------|--------|------------|
| `brainstorming` | design 文档 | Epic + design 字段 |
| `writing-plans` | plan 文档 + task 文档 | Task 拆分 + design 字段 |
| `executing-plans` | 更新 task 文档状态 | Task 状态同步 |
| `systematic-debugging` | debug 报告 | Bug 类型 issue |
| `code-review` | review 报告 | Review task |
| `verification-before-completion` | 验证报告 | 关闭 Task 前检查 |

---

## 整合方案

### 方案 A：修改 Horspowers Skill（推荐）

在现有 skill 中添加 beads 同步逻辑：

```markdown
## brainstorming skill 修改

### 完成时自动执行：
1. 检查是否已有对应 Epic（通过标题搜索）
2. 如果有 → `bd update <id> --design=@"design.md"`
3. 如果没有 → `bd create --title="..." --type=epic --design=@"design.md"`

## writing-plans skill 修改

### 完成 plan 后自动执行：
1. 解析 plan 中的 tasks
2. 为每个 task 执行 `bd create --title="..." --type=task`
3. 解析依赖关系，执行 `bd dep add`
4. 将 beads ID 写入 task 文档头部

## executing-plans skill 修改

### 执行 task 时自动执行：
1. 读取 task 文档中的 beads ID
2. 开始时 → `bd update <id> --status=in_progress`
3. 完成时 → `bd close <id>`
```

### 方案 B：创建桥接 Skill

创建新 skill `/horspowers:beads-sync`，作为后处理器：

```markdown
## beads-sync skill

触发时机：其他 skill 完成后

逻辑：
1. 检测当前产出的文档类型
2. 根据类型执行对应的 beads 操作
3. 将 beads ID 回写到文档
```

### 方案 C：Hook 自动同步

在 `~/.claude/settings.json` 中添加 `PostToolUse` hook：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/scripts/skill-to-beads.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 实现步骤

### Phase 1: 基础整合
- [ ] 修改 `brainstorming` skill，完成后创建/更新 Epic
- [ ] 修改 `writing-plans` skill，完成后创建 Tasks
- [ ] 修改 `executing-plans` skill，执行时同步状态

### Phase 2: 双向同步
- [ ] task 文档头部添加 beads ID 字段
- [ ] 实现 beads → task 文档的反向同步
- [ ] 支持 `bd update` 时更新 task 文档

### Phase 3: 完整工作流
- [ ] 整合 `systematic-debugging` → Bug issue
- [ ] 整合 `code-review` → Review task
- [ ] 整合 `verification-before-completion` → 关闭前验证

---

## 预期效果

### 用户视角
```
用户：帮我实现歌词同步功能
  ↓
AI：/horspowers:brainstorming（自动创建 Epic）
  ↓
AI：/horspowers:writing-plans（自动创建 Tasks）
  ↓
AI：/horspowers:executing-plans（自动更新状态）
  ↓
用户：bd list 查看进度
```

### 开发者视角
- Horspowers 提供方法论和文档产出
- Beads 提供持久化追踪和状态管理
- 两者自动同步，无需手动维护

---

## 相关文件

- Horspowers 插件位置：`~/.claude/plugins/marketplace/horspowers-dev_horspowers/`
- Beads CLI：`bd` 命令
- 桥接脚本：`~/.claude/scripts/horspowers-beads-bridge.sh`

---

## 状态

- **创建时间**：2026-03-04
- **状态**：Idea
- **优先级**：P2
