import { Hono } from 'hono'
import { listTasks, readTask, writeTask, updateTaskStatus, deleteTask } from '../store/index.js'
import type { Task, TaskStatus } from '../types/index.js'

const app = new Hono()

// GET /tasks — list all tasks
app.get('/', (c) => {
  const tasks = listTasks()
  return c.json(tasks)
})

// GET /tasks/:id — get single task
app.get('/:id', (c) => {
  const task = readTask(c.req.param('id'))
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json(task)
})

// POST /tasks — create task
app.post('/', async (c) => {
  const body = await c.req.json<Partial<Task>>()
  if (!body.id || !body.title) {
    return c.json({ error: 'id and title are required' }, 400)
  }
  if (readTask(body.id)) {
    return c.json({ error: `Task ${body.id} already exists` }, 409)
  }
  const task: Task = {
    id: body.id,
    title: body.title,
    status: body.status ?? 'backlog',
    priority: body.priority ?? 'P2',
    assignee: body.assignee,
    team: body.team,
    sprint: body.sprint,
    created: new Date().toISOString().split('T')[0],
    updated: new Date().toISOString().split('T')[0],
    tags: body.tags ?? [],
    blocks: body.blocks ?? [],
    blocked_by: body.blocked_by ?? [],
    plan_doc: body.plan_doc,
    pr_url: body.pr_url,
    body: body.body ?? '',
  }
  writeTask(task)
  return c.json(task, 201)
})

// PATCH /tasks/:id — partial update
app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = readTask(id)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<Partial<Task>>()
  const updated: Task = { ...existing, ...body, id }
  writeTask(updated)
  return c.json(updated)
})

// PUT /tasks/:id/status — update status only
app.put('/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: TaskStatus }>()
  const task = updateTaskStatus(id, status)
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json(task)
})

// DELETE /tasks/:id — delete task (removes .md file)
app.delete('/:id', (c) => {
  const id = c.req.param('id')
  const deleted = deleteTask(id)
  if (!deleted) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

export default app
