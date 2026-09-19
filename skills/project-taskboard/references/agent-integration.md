# Agent 接入约定

任何项目运行 Skill 都可以把任务进度写入看板。看板只要求 agent 遵守以下最小协议，不要求 PM Session、特定模型、特定代码仓库或特定 agent 工具。Codex、OpenCode 以及其他能执行 shell/HTTP 请求的运行时都可以使用同一套协议。

## 运行时安装

Skill 的发现路径由运行时决定；服务和数据格式不随运行时变化。

| 运行时 | 用户级 Skill 目录示例 |
|---|---|
| Codex | `~/.codex/skills/project-taskboard` |
| OpenCode | `~/.config/opencode/skills/project-taskboard` |
| 其他 agent | 该运行时的 Skill 目录，或直接调用 `scripts/taskboard.py` |

如果多个 agent 共同推进同一个项目，只需要启动一份看板服务，其他 agent 复用同一个 `TASKBOARD_URL`。不要因为运行时不同而创建多份项目看板。

## 接入步骤

1. 直接扫描项目的 `docs/superpowers/plans/*.md` 初始化任务树：`taskboard.py init --root /绝对路径/项目看板 --project-root /绝对路径/项目目录`。每个 `### Task N` 是执行任务，每个 `Step N` 是展开用的步骤节点，不需要手动创建任务。
2. 用 `taskboard.py start --root /绝对路径/项目看板 --project-root /绝对路径/项目目录` 启动自动同步服务，并把看板地址传给 agent，例如 `TASKBOARD_URL=http://127.0.0.1:47832`。
3. 看板服务持续监听计划文件；Superpowers 执行计划中的勾选变化会自动更新任务状态和完成时间。
4. agent 仍可以为执行中的任务补充负责人、当前步骤、证据以及 `blocked`/`in_review` 等运行时状态，但不需要创建任务。重复调用同一个稳定 ID 也不会产生重复卡片。
5. 计划发生结构变化时，自动同步会加入新增任务并保留 agent 已经上报的执行状态；已移除的任务保留在看板中，避免丢失历史。

## 推荐生命周期

```text
todo -> in_progress -> in_review -> done
                         └-> blocked
```

取消的任务使用 `canceled` 并保留原卡片。规划节点使用 `phase`、`module` 或 `capability`；agent 真正执行的节点使用 `task`、`implementation_task` 或 `work_item`。

## 最小请求示例

```bash
board="${TASKBOARD_URL:-http://127.0.0.1:47832}"

curl -sS -X PUT "$board/api/tasks/agent-login-001" \
  -H 'Content-Type: application/json' \
  -d '{"title":"实现登录流程","kind":"implementation_task","owner":"agent-auth","agent_id":"agent-auth","run_id":"run-20260920-001","parent_id":"module-auth","status":"todo"}'

curl -sS -X POST "$board/api/tasks/agent-login-001/status" \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress","current_step":"实现 API"}'

curl -sS -X POST "$board/api/tasks/agent-login-001/status" \
  -H 'Content-Type: application/json' \
  -d '{"status":"done","current_step":"已完成并提交验证证据"}'
```

## 责任边界

看板能保证任务树校验、状态变更记录、开始/完成时间登记和本地原子写入。它不能自动判断 agent 是否真的执行了代码、测试或发布；这些事实仍需要 agent 把证据写入 `evidence` 或 `summary`，并由项目自己的验收流程核实。

所有 agent 必须使用同一个看板 URL。不要为每个子 agent 启动一个独立服务，否则它们会写入不同的 `board.json`，页面无法形成统一全景。
