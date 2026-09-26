# 通用任务看板 API

服务默认监听 `127.0.0.1:47832`，接口只绑定本机。请求和响应均为 UTF-8 JSON。

## 创建任务

```bash
curl -sS -X POST http://127.0.0.1:47832/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"实现登录流程","kind":"implementation_task","owner":"开发 A","planned_start":"2026-09-20"}'
```

服务器会生成 `id`、`created_at`、`updated_at`，默认状态为 `todo`。

## 创建子任务

```bash
curl -sS -X POST http://127.0.0.1:47832/api/tasks/feature-login/children \
  -H 'Content-Type: application/json' \
  -d '{"title":"增加登录表单校验","kind":"task"}'
```

## 按稳定 ID 幂等创建或更新

agent 可以使用 `PUT` 复用稳定任务 ID。任务不存在时创建，已存在时更新，不会因为重复启动产生重复任务。

```bash
curl -sS -X PUT http://127.0.0.1:47832/api/tasks/feature-login \
  -H 'Content-Type: application/json' \
  -d '{"title":"实现登录流程","kind":"implementation_task","status":"todo","agent_id":"agent-auth"}'
```

## 更新状态

```bash
curl -sS -X POST http://127.0.0.1:47832/api/tasks/feature-login/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress","current_step":"开发中"}'
```

或使用通用更新接口：

```bash
curl -sS -X PATCH http://127.0.0.1:47832/api/tasks/feature-login \
  -H 'Content-Type: application/json' \
  -d '{"owner":"开发 A","planned_end":"2026-09-22","current_step":"联调"}'
```

可更新字段包括 `title`、`parent_id`、`kind`、`status`、`owner`、`scope_class`、`description`、`summary`、`source`、`next_step`、`current_step`、`started_at`、`completed_at`、`planned_start`、`planned_end`、`due_at`、`stages`、`labels`、`agent_id`、`run_id`、`session_id`、`worktree`、`branch`、`evidence` 和 `external_id`。

## 数据结构

```json
{
  "schema_version": 1,
  "project": "示例项目",
  "updated_at": "2026-09-20T10:00:00+00:00",
  "tasks": [
    {
      "id": "phase-1",
      "parent_id": null,
      "kind": "phase",
      "title": "第一阶段",
      "status": "in_progress"
    },
    {
      "id": "task-1",
      "parent_id": "phase-1",
      "kind": "task",
      "title": "具体执行任务",
      "status": "todo",
      "planned_start": "2026-09-20",
      "planned_end": "2026-09-22"
    }
  ]
}
```

校验会拒绝重复 ID、不存在的父节点和循环层级。写入通过临时文件加原子替换完成；当前服务进程内的并发更新由锁串行化。
