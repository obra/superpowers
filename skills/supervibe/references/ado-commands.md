# Azure DevOps CLI Commands Reference

## Prerequisites

Ensure Azure CLI is installed and logged in:

```bash
az login
az account show
az devops configure --defaults organization=https://dev.azure.com/{org} project={project}
```

## Work Item Operations

### Get Work Item Details

```bash
az boards work-item show --id {id}
```

Returns: id, title, description, state, assignedTo, areaPath, iterationPath

Parse specific fields:
```bash
az boards work-item show --id {id} --query "fields.\"System.Title\""
az boards work-item show --id {id} --query "fields.\"System.Description\""
az boards work-item show --id {id} --query "fields.\"System.State\""
az boards work-item show --id {id} --query "fields.\"Microsoft.VSTS.Common.AcceptanceCriteria\""
```

### Update Work Item State

```bash
# Start work
az boards work-item update --id {id} --state "Active"

# Complete work
az boards work-item update --id {id} --state "Closed"
```

**Work Item States:**
| 状态 | 说明 |
|------|------|
| New | 新建 |
| Proposed | 已提议 |
| Committed | 已承诺 |
| Active | 进行中 |
| Closed | 已关闭 |
| Removed | 已移除 |
| Cut | 已裁剪 |

### Add Comment (REST API)

**注意:** `az boards work-item comment` 命令不可用，需使用 REST API：

```bash
# 获取 Access Token
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

# 添加 Comment（支持 Markdown 格式）
curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "## Comment Title\n\n- Item 1\n- Item 2\n\n**Bold** and _italic_ supported."}'
```

**Markdown 格式 Comment 示例：**

```bash
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

COMMENT_BODY='## 📐 设计完成

设计文档: `docs/plans/2026-02-28-feature-design.md`

### 概要
- 功能描述
- 技术选型

### 技术栈
| 组件 | 技术 |
|------|------|
| 后端 | FastAPI |
| 前端 | React |

### 下一步
进入计划阶段。'

curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$COMMENT_BODY\"}"
```

**辅助函数（可在脚本中使用）：**

```bash
# 添加 ADO Comment 的函数
add_ado_comment() {
    local WORK_ITEM_ID=$1
    local COMMENT_TEXT=$2
    local ORG=${3:-"O365Exchange"}
    local PROJECT=${4:-"O365 Core"}

    TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)

    curl -s -X POST "https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/workItems/${WORK_ITEM_ID}/comments?api-version=7.1-preview.3" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"$COMMENT_TEXT\"}"
}

# 使用示例
add_ado_comment 7012823 "## 🚀 任务启动\n\n开始处理任务..."
```

## Relations & Dependencies

### List Relations

```bash
az boards work-item relation list --id {id}
```

Relation types:
- `System.LinkTypes.Hierarchy-Forward` — Parent
- `System.LinkTypes.Hierarchy-Reverse` — Child
- `System.LinkTypes.Dependency-Forward` — Predecessor (depends on)
- `System.LinkTypes.Dependency-Reverse` — Successor (blocked by this)
- `System.LinkTypes.Related` — Related

### Add Relation

```bash
# Add dependency
az boards work-item relation add --id {id} --relation-type "System.LinkTypes.Dependency-Forward" --target-id {target_id}
```

## Creating Work Items

### Create Subtask

```bash
az boards work-item create \
  --type "Task" \
  --title "Subtask title" \
  --parent {parent_id} \
  --assigned-to "user@example.com"
```

### Create with Description

```bash
az boards work-item create \
  --type "Task" \
  --title "Task title" \
  --description "Detailed description"
```

## Querying Work Items

### WIQL Query

```bash
az boards query --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.Id] = {id}"
```

### Find Related Items

```bash
az boards query --wiql "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.Title] CONTAINS '{keyword}'"
```

## Common Patterns

### Start a Task

```bash
# 1. Get details
ITEM=$(az boards work-item show --id {id})

# 2. Update state to Active
az boards work-item update --id {id} --state "Active"

# 3. Get relations
az boards work-item relation list --id {id}

# 4. Add start comment
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)
curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "## 🚀 任务启动\n\n开始处理此任务。"}'
```

### Complete a Task

```bash
# 1. Add completion comment
TOKEN=$(az account get-access-token --resource "499b84ac-1321-427f-aa17-267ca6975798" --query accessToken -o tsv)
curl -X POST "https://dev.azure.com/{org}/{project}/_apis/wit/workItems/{id}/comments?api-version=7.1-preview.3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "## ✅ 任务完成\n\n任务已完成，测试通过。"}'

# 2. Update state to Closed
az boards work-item update --id {id} --state "Closed"
```

### Check Dependencies

```bash
# Get all relations
RELATIONS=$(az boards work-item relation list --id {id} --output json)

# Filter for dependencies
echo $RELATIONS | jq '.[] | select(.rel == "System.LinkTypes.Dependency-Forward")'
```
