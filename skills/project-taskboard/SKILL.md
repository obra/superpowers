---
name: project-taskboard
description: Create, serve, validate, and update a local hierarchical project task board from Codex, OpenCode, or another agent runtime without requiring a PM session.
---

# 通用项目任务看板

当用户需要从规格、计划、任务清单或已有任务 JSON 生成一个可以持续更新的项目看板时使用本 Skill。它提供独立的本地数据文件、层级视图、状态和类型颜色、起止时间、正在执行列表，以及创建和更新任务的 HTTP 接口。

本 Skill 是运行时无关的：看板服务只依赖 Python 3 标准库和 HTTP，项目可以由 Codex、OpenCode 或其他能执行 shell/HTTP 请求的 agent 共同更新。PM Session 是可选的协调者，不是看板的前置条件。每个运行时只需要把本 Skill 安装到自己的 Skill 发现目录，所有 agent 再通过同一个项目看板 URL 写入同一份任务数据。

## 标准流程

1. 选择一个专用看板目录，不要直接覆盖已有项目目录。初始化空看板：

   ```bash
   python3 <project-taskboard-skill-dir>/scripts/taskboard.py init \
     --root /绝对路径/项目看板 \
     --project "项目名称"
   ```

   从已有任务 JSON 初始化时增加 `--input /绝对路径/tasks.json`。输入可以是任务数组，也可以是包含 `tasks` 数组的对象。使用 Superpowers 计划初始化时改用 `--plan /绝对路径/docs/superpowers/plans/YYYY-MM-DD-feature.md`；计划标题、`### Task N` 和每个任务下的 `Step N` 会自动形成层级。

   对完整 Superpowers 项目直接扫描标准计划目录，不需要手动列出任务或计划文件：

   ```bash
   python3 <project-taskboard-skill-dir>/scripts/taskboard.py init \
     --root /绝对路径/项目看板 \
     --project-root /绝对路径/项目目录 \
     --project "项目名称"
   ```

2. 校验并启动服务：

   ```bash
   python3 <project-taskboard-skill-dir>/scripts/taskboard.py check --root /绝对路径/项目看板
   python3 <project-taskboard-skill-dir>/scripts/taskboard.py start \
     --root /绝对路径/项目看板 \
     --project-root /绝对路径/项目目录
   ```

   默认地址是 `http://127.0.0.1:47832/`。传入 `--project-root` 后，服务会持续监听 `docs/superpowers/plans/*.md`，计划中的任务和勾选状态变化会自动同步到看板。复用正在运行的服务，不重复启动第二份看板。`<project-taskboard-skill-dir>` 指当前 agent 实际发现到的本 Skill 目录；Codex 和 OpenCode 的安装路径可以不同，但它们应指向同一个看板根目录和 URL。

3. 打开页面并核对项目名称、根节点汇总、完整层级、任务状态、任务类型颜色、时间进度和“正在执行”列表。没有 PM Session 时，任务更新直接通过本 Skill 的本地 API 或页面详情面板完成。

## 更新接口

- `GET /api/board`：读取完整项目和任务树；`GET /api/progress` 是兼容别名。
- `GET /api/health`：校验任务树并返回任务数量。
- `POST /api/tasks`：创建任务。至少提供 `title`，可提供 `parent_id`、`kind`、`owner`、`status`、`planned_start`、`planned_end`。
- `POST /api/tasks/{id}/children`：创建指定任务的子任务。
- `PUT /api/tasks/{id}`：按稳定任务 ID 幂等创建或更新任务，适合任意 agent 在开始前声明任务。
- `PATCH /api/tasks/{id}`：更新任务标题、父节点、类型、状态、负责人、当前步骤、起止时间、阶段状态和说明。
- `POST /api/tasks/{id}/status`：只更新状态和当前步骤的快捷接口。

已有看板可以用 `import-plan --root /绝对路径/项目看板 --plan /绝对路径/implementation-plan.md` 同步 Superpowers 计划的新增、删除外的结构变化。同步只更新计划标题、父子关系、任务类型和规格来源，保留 agent 已经上报的状态、负责人和时间。

状态从 `todo` 改为 `in_progress` 时，如果没有开始时间，接口自动登记 `started_at`；状态改为 `done` 时，如果没有结束时间，接口自动登记 `completed_at`。显式提供的真实时间会被保留。每次状态变化会追加到 `status_history`，并原子写回 `board.json`。

## 数据边界

- 该 Skill 自己维护 `board.json`，不要求 PM Session，也不依赖 `tasks.json`、PM 心跳或外部任务系统。
- 任务层级由 `parent_id` 决定；执行任务由 `kind=task`、`implementation_task` 或 `work_item` 表示。Superpowers 计划中的 `### Task N` 导入为 `implementation_task`，`Step N` 导入为不计入执行任务数的 `step` 节点。阶段、模块、计划和能力节点用于组织层级，也不计入执行任务数。
- `updated_at` 只表示记录更新时间；没有 `completed_at` 时不把它冒充结束时间。父节点可以显示子任务时间范围，但会标注为汇总。
- 删除接口默认不提供，避免误删历史。需要移除任务时先将其标记为 `canceled`，保留层级和状态变更记录。

任意 agent 的接入约定见 [references/agent-integration.md](references/agent-integration.md)；详细字段和请求示例见 [references/api.md](references/api.md)。OpenCode 的用户级发现目录通常是 `~/.config/opencode/skills/project-taskboard`；其他运行时可使用其对应的 Skill 目录，或者直接调用本目录下的 `scripts/taskboard.py` 和 HTTP API。
