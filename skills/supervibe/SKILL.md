---
name: supervibe
description: |
  Orchestrate vibe coding workflows with Azure DevOps integration. Use when:
  (1) User says "/supervibe {work-item-id}" to start a task from ADO
  (2) User says "/supervibe" followed by task description to begin structured vibe coding
  (3) User wants to begin coding with proper design, planning, and review process
  (4) User needs to sync coding progress with Azure DevOps Work Items
  (5) User says "/supervibe --dry-run {work-item-id}" to test the workflow without side effects

  SuperVibe guides users through 5 stages: Start → Design → Plan → Implement → Finish,
  automatically calling superpowers skills (brainstorming, writing-plans, TDD, code-review)
  and syncing status to ADO at key checkpoints.
---

# SuperVibe

> "Vibe Coding, Supervised"

Orchestrate vibe coding with ADO integration. Guide users through structured workflow while syncing progress to Azure DevOps.

## Dry Run Mode

When user includes `--dry-run` flag (e.g., `/supervibe --dry-run 12345`), activate **Dry Run Mode**:

<DRY-RUN-RULES>
**Dry Run 模式行为：**

当用户使用 `--dry-run` 标志时（如 `/supervibe --dry-run 12345`），进入 Dry Run 模式。

**启动时显示：**
```
╔════════════════════════════════════════════════════════════╗
║  🧪 DRY RUN MODE - 只跳过代码生成，其他操作正常执行         ║
╚════════════════════════════════════════════════════════════╝
```

**1. 正常执行的操作：**
- ✅ ADO 读取（work-item show）
- ✅ ADO 写入（update, comment add）
- ✅ 调用所有 sub-skills（brainstorming, writing-plans, etc.）
- ✅ 写设计文档和计划文档（docs/plans/*.md）
- ✅ Git 提交文档
- ✅ 探索代码库

**2. 跳过的操作：**
- ❌ 生成应用代码（.py, .js, .html, .css 等）
- ❌ Implement 阶段的 subagent 代码编写任务

**3. Implement 阶段行为：**
- 进入 Implement 阶段时，显示任务列表
- 显示 `[DRY RUN] 跳过代码生成`
- 添加 ADO Comment 记录跳过的任务
- 直接进入 Finish 阶段

**4. 完成时显示摘要：**
```
╔════════════════════════════════════════════════════════════╗
║  🧪 DRY RUN 完成                                            ║
║                                                            ║
║  已执行:                                                    ║
║  - ADO: {n} 个 Comments                                     ║
║  - 文档: {n} 个                                              ║
║  - Git: {n} 个 commits                                      ║
║                                                            ║
║  已跳过:                                                    ║
║  - 代码: {n} 个文件                                          ║
╚════════════════════════════════════════════════════════════╝
```
</DRY-RUN-RULES>

## ADO Comments

每个阶段完成后，**必须**添加 ADO Comment 记录结果。

**重要：Comments 必须使用 HTML 格式**，不支持 Markdown 渲染。

| 阶段 | Comment 标题 | 内容 |
|------|-------------|------|
| Start | `🚀 任务启动` | 开始处理通知 |
| Design | `📐 设计完成` | 设计摘要 + 文档链接 |
| Plan | `📋 计划完成` | 任务列表 + 计划链接 |
| Implement | `🔨 实现完成` | 完成情况 + 代码统计 |
| Finish | `✅ 任务完成` | 总结 + 产出物列表 |

**Comment 命令格式（使用 REST API + HTML）：**

```bash
# 获取 Access Token
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

# 添加 Comment（必须使用 HTML 格式）
curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "<h2>标题</h2><p>内容</p>"}'
```

**HTML 格式规范：**
- 标题: `<h2>`, `<h3>`
- 段落: `<p>`
- 粗体: `<strong>`
- 代码: `<code>`
- 表格: `<table><tr><th>/<td>`
- 列表: `<ul><li>` 或 `<ol><li>`
- 换行: `<br/>` 或新 `<p>`

**注意:** `az boards work-item comment` 命令不可用，必须使用 REST API。

**Dry Run 模式的 Implement Comment（HTML 格式）：**
```html
<h2>🧪 [DRY RUN] 实现阶段</h2>

<h3>任务列表（未实际执行）</h3>
<ol>
<li>{task_1}</li>
<li>{task_2}</li>
</ol>

<h3>跳过的代码文件</h3>
<ul>
<li><code>{file_1}</code></li>
<li><code>{file_2}</code></li>
</ul>

<p><strong>注意:</strong> Dry Run 模式，代码未实际生成</p>
```

## Quick Start

When user triggers SuperVibe:

1. Parse Work Item ID from input (or ask for it)
2. Fetch Work Item details via `az boards work-item show`
3. Display task info and confirm understanding
4. Guide through stages, calling appropriate skills

## Stages Overview

| Stage | Skill Called | ADO Sync |
|-------|--------------|----------|
| Start | - | State → Active |
| Design | /brainstorming | Comment: design summary |
| Plan | /writing-plans | Optional: create subtasks |
| Implement | /test-driven-development | Comment: progress |
| Finish | /requesting-code-review | State → Closed |

<HARD-GATE>
**MANDATORY SKILL INVOCATION:** When entering each stage, you MUST immediately invoke the corresponding skill using the Skill tool BEFORE doing anything else:

- **Design stage** → Invoke `brainstorming` skill FIRST, then follow its instructions
- **Plan stage** → Invoke `writing-plans` skill FIRST, then follow its instructions
- **Implement stage** → Invoke `test-driven-development` skill FIRST, then follow its instructions
- **Finish stage** → Invoke `requesting-code-review` skill FIRST, then follow its instructions

Do NOT ask clarifying questions, do NOT explore the codebase, do NOT do any other work until the skill is invoked. The skill will guide the appropriate process.
</HARD-GATE>

For detailed stage behavior, see [references/stages.md](references/stages.md).

## ADO Integration

Use `az boards` commands for all ADO operations. See [references/ado-commands.md](references/ado-commands.md).

**Prerequisites:** User must have `az` CLI installed and logged in.

Before starting, verify ADO access:
```bash
az account show
```

If not logged in, prompt user:
```
请先登录 Azure CLI：az login
```

## State Persistence

Store current task state in `.supervibe/current.json`:

```json
{
  "workItemId": 12345,
  "stage": "design",
  "startedAt": "2025-02-28T10:00:00Z",
  "designDoc": null
}
```

Check this file to resume interrupted sessions.

## Conversation Flow

### Starting a Task

```
User: /supervibe 12345

SuperVibe:
1. az boards work-item show --id 12345
2. az boards work-item relation list --id 12345
3. Display: title, description, acceptance criteria, dependencies
4. az boards work-item update --id 12345 --state "Active"
5. Ask: "这个需求清楚吗？有问题现在可以提，没问题我们开始设计。"
```

### Stage Transitions

After each stage completes:
1. Verify gate condition met (design doc exists, tests pass, etc.)
2. Sync to ADO (comment or status update)
3. Ask user to proceed to next stage
4. Call appropriate skill

### Completing a Task

```
SuperVibe:
1. Verify code review passed
2. Generate completion summary
3. az boards work-item update --id {id} --state "Closed"
4. az boards work-item comment add --id {id} --body "{summary}"
5. Check for dependent Work Items, notify if any
```

## Design Doc Template

When starting brainstorming, use template from [templates/design-doc.md](templates/design-doc.md).

Save design docs to: `docs/plans/YYYY-MM-DD-{feature-name}-design.md`

## Resuming Interrupted Sessions

On `/supervibe` without ID:

1. Check `.supervibe/current.json`
2. If exists:
   ```
   发现未完成的任务 #{id}【{title}】，当前在 {stage} 阶段。
   要继续这个任务还是开始新任务？
   ```
3. If continue: resume from current stage
4. If new: ask for Work Item ID

## Error Handling

### ADO Connection Failed
```
⚠️ 无法连接 Azure DevOps。请检查：
1. az login 是否已执行？
2. 网络连接是否正常？

运行 az account show 检查状态。
```

### Work Item Not Found
```
⚠️ 找不到 Work Item #{id}。请检查 ID 是否正确。
```

## Resources

- **references/ado-commands.md** - Azure CLI commands for Work Item operations
- **references/stages.md** - Detailed behavior for each workflow stage
- **templates/design-doc.md** - Template for design documents
