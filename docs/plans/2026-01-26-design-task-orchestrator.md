# 任务编排系统设计文档

**设计时间**: 2026-01-26
**状态**: 设计阶段
**设计者**: 基于 Vibe Kanban 的启发

---

## 📋 设计背景

### 灵感来源

[Vibe Kanban](https://github.com/BloopAI/vibe-kanban) 是一个基于 Rust + React 的全栈任务管理和 AI 编码代理编排平台。它提供了：

- 完整的任务管理系统（Projects → Tasks → Workspaces）
- Git Worktree 隔离执行环境
- MCP 协议与 AI 代理集成
- 实时进度追踪和可视化看板

### Horspowers 的差异化定位

Horspowers 不应复制 Vibe Kanban 的全栈方案，而是应该：

1. **基于 Claude Code 原生能力** - Worktree + Subagents
2. **轻量级实现** - 本地数据库，无需额外服务器
3. **与现有技能深度集成** - 复用 `using-git-worktrees`、`dispatching-parallel-agents`
4. **聚焦核心价值** - 多任务并行开发 + 编排 + 进度追踪

---

## 🎯 核心目标

```
┌─────────────────────────────────────────────────────────────┐
│        基于 Claude Code 原生特性的任务编排系统                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 多任务并行开发     利用 Git Worktree + Subagents       │
│  2️⃣ 任务编排          管理任务依赖和执行顺序                │
│  3️⃣ 进度追踪          实时监控每个 subagent 的状态          │
│  4️⃣ 可视化展示        看板/终端界面展示进度                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│          Horspowers Task Orchestrator                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Task Orchestration Layer                  │   │
│  │  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ Task Queue   │→ │ Dependency   │               │   │
│  │  │ (待执行任务)  │  │ Graph (DAG)  │               │   │
│  │  └──────────────┘  └──────────────┘               │   │
│  │         ↓                  ↓                        │   │
│  │  ┌──────────────────────────────────────┐         │   │
│  │  │     Worktree Allocator               │         │   │
│  │  │  (为每个任务分配独立的 worktree)      │         │   │
│  │  └──────────────────────────────────────┘         │   │
│  │         ↓                                          │   │
│  │  ┌──────────────────────────────────────┐         │   │
│  │  │     Parallel Agent Dispatcher        │         │   │
│  │  │  (复用 dispatching-parallel-agents)  │         │   │
│  │  └──────────────────────────────────────┘         │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                          ↓                         │
│  ┌──────────────┐        ┌──────────────┐                   │
│  │ Progress     │        │ Visualization │                   │
│  │ Tracker      │        │ (TUI/Web)    │                   │
│  │ (状态持久化)  │        │ (进度展示)    │                   │
│  └──────────────┘        └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 技术选型

```yaml
数据存储: SQLite (本地文件，.horspowers/tasks.db)
任务编排: Node.js (与现有 lib/ 一致)
可视化方案:
  - 方案 A: Terminal UI (blessed/ink) - 最轻量
  - 方案 B: Web UI (Vite + React) - 更现代
  - 方案 C: Markdown 实时渲染 - 最简单
```

---

## 📐 核心设计

### 1. 数据模型

```typescript
// lib/task-orchestrator/types.ts

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed';

  // 依赖关系
  dependencies: string[];  // 依赖的任务 ID
  dependents: string[];    // 被哪些任务依赖

  // 执行配置
  worktree?: string;       // 分配的 worktree 路径
  agentPrompt?: string;    // 传递给 subagent 的 prompt

  // 进度追踪
  startedAt?: Date;
  completedAt?: Date;
  checkpoints: Checkpoint[];

  // 元数据
  planFile: string;        // 来自 writing-plans
  taskDoc?: string;        // 任务文档路径
}

export interface Checkpoint {
  batch: number;
  task: string;
  timestamp: Date;
  status: 'passed' | 'failed';
}

export interface TaskGraph {
  tasks: Map<string, Task>;
  executionOrder: string[][];  // 拓扑排序的层级
}

export interface ProgressSummary {
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
  percentage: number;
}
```

### 2. 数据库 Schema

```sql
-- .horspowers/tasks.db

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed')),
  dependencies TEXT,  -- JSON array
  worktree TEXT,
  agent_prompt TEXT,
  started_at TEXT,
  completed_at TEXT,
  plan_file TEXT NOT NULL,
  task_doc TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  batch INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_plan ON tasks(plan_file);
CREATE INDEX idx_checkpoints_task ON checkpoints(task_id);
```

### 3. 编排器核心

```typescript
// lib/task-orchestrator/orchestrator.ts

export class TaskOrchestrator {
  private db: Database;
  private worktreeManager: WorktreeManager;

  constructor(projectRoot: string) {
    this.db = new Database(`${projectRoot}/.horspowers/tasks.db`);
    this.worktreeManager = new WorktreeManager(projectRoot);
    this.initDatabase();
  }

  /**
   * 从 writing-plans 生成的 plan.md 解析任务
   */
  async loadPlan(planPath: string): Promise<Task[]> {
    const content = await fs.readFile(planPath, 'utf-8');
    const tasks = this.parsePlanTasks(content);

    for (const task of tasks) {
      await this.db.run(`
        INSERT INTO tasks (id, title, description, plan_file)
        VALUES (?, ?, ?, ?)
      `, [task.id, task.title, task.description, planPath]);
    }

    return tasks;
  }

  /**
   * 构建依赖图并返回执行层级
   */
  buildExecutionGraph(tasks: Task[]): TaskGraph {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const levels = this.topologicalSort(tasks);

    return { tasks: taskMap, executionOrder: levels };
  }

  /**
   * 执行任务编排
   */
  async execute(graph: TaskGraph) {
    for (const level of graph.executionOrder) {
      if (this.canExecuteInParallel(level, graph)) {
        console.log(`🚀 并行执行 ${level.length} 个任务`);
        await this.executeParallel(level, graph);
      } else {
        console.log(`📋 顺序执行 ${level.length} 个任务`);
        for (const taskId of level) {
          await this.executeTask(taskId, graph);
        }
      }

      await this.checkpoint(level);
    }
  }

  /**
   * 并行执行一组任务
   */
  private async executeParallel(taskIds: string[], graph: TaskGraph) {
    const worktrees = await Promise.all(
      taskIds.map(id => this.allocateWorktree(id, graph))
    );

    const agentTasks = taskIds.map((id, i) => ({
      description: `Execute task: ${graph.tasks.get(id)?.title}`,
      subagent_type: 'general-purpose',
      prompt: this.buildAgentPrompt(id, graph, worktrees[i])
    }));

    return await Promise.all(agentTasks);
  }

  /**
   * 为任务分配独立的 worktree
   */
  private async allocateWorktree(taskId: string, graph: TaskGraph): Promise<string> {
    const task = graph.tasks.get(taskId)!;
    const branchName = `task/${taskId.slice(0, 8)}`;
    const worktreePath = await this.worktreeManager.create(branchName);

    await this.db.run(`
      UPDATE tasks SET worktree = ?, status = 'queued' WHERE id = ?
    `, [worktreePath, taskId]);

    return worktreePath;
  }
}
```

### 4. 进度追踪器

```typescript
// lib/task-orchestrator/tracker.ts

export class ProgressTracker {
  private db: Database;

  /**
   * 更新任务状态（从 executing-plans 的检查点读取）
   */
  async updateFromCheckpoint(taskDoc: string) {
    const content = await fs.readFile(taskDoc, 'utf-8');
    const checkpoint = this.parseCheckpoint(content);

    await this.db.run(`
      UPDATE tasks
      SET current_batch = ?, current_task = ?, last_update = ?
      WHERE id = ?
    `, [checkpoint.batch, checkpoint.task, new Date(), checkpoint.taskId]);
  }

  /**
   * 获取整体进度
   */
  getProgress(): ProgressSummary {
    const total = this.db.prepare('SELECT COUNT(*) FROM tasks').get() as { count: number };
    const completed = this.db.prepare('SELECT COUNT(*) FROM tasks WHERE status = "completed"').get();
    const running = this.db.prepare('SELECT COUNT(*) FROM tasks WHERE status = "running"').get();

    return {
      total: total.count,
      completed: completed.count,
      running: running.count,
      percentage: Math.round((completed.count / total.count) * 100)
    };
  }
}
```

---

## 🎨 可视化方案

### 方案 A: Markdown 看板（最简单）

```typescript
// lib/task-orchestrator/markdown-view.ts

export class MarkdownView {
  generateBoard(tasks: Task[]): string {
    const columns = {
      pending: tasks.filter(t => t.status === 'pending'),
      running: tasks.filter(t => t.status === 'running'),
      completed: tasks.filter(t => t.status === 'completed')
    };

    return `
# 📋 任务看板

## 📍 待执行 (${columns.pending.length})
${columns.pending.map(t => `- [ ] **${t.title}** (${t.id.slice(0, 8)})`).join('\n')}

## 🔄 进行中 (${columns.running.length})
${columns.running.map(t => `- [🔄] **${t.title}**\n  - Worktree: \`${t.worktree}\``).join('\n\n')}

## ✅ 已完成 (${columns.completed.length})
${columns.completed.map(t => `- [x] **${t.title}**`).join('\n')}

---
**进度:** ${columns.completed.length} / ${tasks.length} (${Math.round(columns.completed.length / tasks.length * 100)}%)
`;
  }

  async updateBoard(tasks: Task[]) {
    const markdown = this.generateBoard(tasks);
    await fs.writeFile('.horspowers/TASK_BOARD.md', markdown);
  }
}
```

### 方案 B: 终端 UI（交互式）

```typescript
// lib/task-orchestrator/tui.ts

import blessed from 'blessed';

export class TaskTUI {
  private screen: any;
  private board: any;

  render(tasks: Task[]) {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Horspowers Task Board'
    });

    const columns = {
      pending: this.createColumn('待执行', 'grey'),
      running: this.createColumn('进行中', 'blue'),
      completed: this.createColumn('已完成', 'green')
    };

    tasks.forEach(task => {
      const card = blessed.box({
        content: `${task.title}\n${task.worktree || 'No worktree'}`,
        border: { type: 'line' }
      });
      columns[task.status].append(card);
    });

    this.screen.render();
  }
}
```

---

## 🚀 实施计划

### Phase 1: 核心编排器（1 周）

```
lib/task-orchestrator/
├── index.ts              # 主入口
├── orchestrator.ts       # 编排逻辑
├── graph.ts             # DAG 依赖图
├── database.ts          # SQLite 操作
└── types.ts             # TypeScript 类型
```

**目标:**
- 从 plan.md 解析任务
- 构建依赖图
- 拓扑排序

### Phase 2: Worktree 集成（1 周）

```
lib/task-orchestrator/
└── worktree-allocator.ts  # 与 using-git-worktrees 集成
```

**目标:**
- 为每个任务分配 worktree
- 复用现有 worktree 管理逻辑

### Phase 3: 并行执行集成（1 周）

```
lib/task-orchestrator/
└── agent-dispatcher.ts    # 与 dispatching-parallel-agents 集成
```

**目标:**
- 调用 Claude Code 的 Task 工具
- 传递正确的 agent prompt
- 收集执行结果

### Phase 4: 进度追踪（1 周）

```
lib/task-orchestrator/
└── tracker.ts             # 进度追踪器
```

**目标:**
- 读取 TASK_DOC 检查点
- 更新任务状态
- 生成进度报告

### Phase 5: 可视化（1 周）

选择一个方案实现：
- Markdown 看板（最简单）
- 终端 UI（交互式）
- Web UI（可选）

---

## 📚 与现有技能集成

### 新增技能

```yaml
task-orchestrator:
  description: Use when managing multiple tasks with dependencies
  流程:
    1. 加载 writing-plans 生成的计划
    2. 构建任务依赖图
    3. 分配 worktrees
    4. 并行/顺序执行
    5. 追踪进度
```

### 增强现有技能

```yaml
executing-plans:
  添加: 支持从编排器接收任务
  添加: 自动更新检查点到数据库

dispatching-parallel-agents:
  添加: 从编排器接收并行任务组
  添加: 报告执行状态到编排器
```

---

## 💡 使用示例

```bash
# 1. 编写计划（复用现有）
hp plan write "实现用户认证系统"

# 2. 启动编排器
hp orchestrator start docs/plans/2025-01-26-user-auth.md

# 输出示例：
# ✅ 从 plan.md 加载了 8 个任务
# 📊 构建依赖图: 3 层
#
# 层 1 (可并行):
#   - task-1: 设计数据库模型
#   - task-2: 实现注册 API
#
# 🚀 启动 2 个并行 subagents...

# 3. 查看进度
hp orchestrator status

# 输出:
# 📊 任务看板
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 待执行: 3 | 进行中: 2 | 已完成: 3
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔗 参考资料

- [Vibe Kanban GitHub](https://github.com/BloopAI/vibe-kanban)
- [Vibe Kanban MCP Server 文档](https://vibekanban.com/docs/integrations/vibe-kanban-mcp-server)
- Horspowers 现有技能：
  - `using-git-worktrees`
  - `dispatching-parallel-agents`
  - `executing-plans`
  - `writing-plans`

---

**下一步**: 创建实施任务文档，开始 Phase 1 开发
