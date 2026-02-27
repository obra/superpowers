import { Hono } from 'hono'
import { listSprints, activeSprint, writeSprint } from '../store/index.js'
import type { Sprint } from '../types/index.js'

const app = new Hono()

// GET /sprints
app.get('/', (c) => {
  return c.json(listSprints())
})

// GET /sprints/active
app.get('/active', (c) => {
  const sprint = activeSprint()
  if (!sprint) return c.json({ error: 'No active sprint' }, 404)
  return c.json(sprint)
})

// GET /sprints/:id
app.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const sprint = listSprints().find(s => s.id === id)
  if (!sprint) return c.json({ error: 'Not found' }, 404)
  return c.json(sprint)
})

// POST /sprints — create sprint
app.post('/', async (c) => {
  const body = await c.req.json<Partial<Sprint>>()
  if (!body.id || !body.name || !body.start || !body.end) {
    return c.json({ error: 'id, name, start, end are required' }, 400)
  }
  const sprint: Sprint = {
    id: body.id,
    name: body.name,
    start: body.start,
    end: body.end,
    goal: body.goal ?? '',
    status: body.status ?? 'planned',
  }
  writeSprint(sprint)
  return c.json(sprint, 201)
})

// PATCH /sprints/:id — update sprint
app.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const existing = listSprints().find(s => s.id === id)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<Partial<Sprint>>()
  const updated: Sprint = { ...existing, ...body, id }
  writeSprint(updated)
  return c.json(updated)
})

export default app
