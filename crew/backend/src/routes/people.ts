import { Hono } from 'hono'
import { listPeople, readPerson, writePerson } from '../store/index.js'
import type { Person } from '../types/index.js'

const app = new Hono()

// GET /people
app.get('/', (c) => {
  return c.json(listPeople())
})

// GET /people/:username
app.get('/:username', (c) => {
  const person = readPerson(c.req.param('username'))
  if (!person) return c.json({ error: 'Not found' }, 404)
  return c.json(person)
})

// POST /people — create person
app.post('/', async (c) => {
  const body = await c.req.json<Partial<Person>>()
  if (!body.username) {
    return c.json({ error: 'username is required' }, 400)
  }
  if (readPerson(body.username)) {
    return c.json({ error: `Person ${body.username} already exists` }, 409)
  }
  const person: Person = {
    username: body.username,
    name: body.name ?? body.username,
    team: body.team ?? '',
    updated: new Date().toISOString().split('T')[0],
    current_task: body.current_task,
    blocked_by: body.blocked_by,
    completed_today: body.completed_today ?? [],
    body: body.body ?? '',
  }
  writePerson(person)
  return c.json(person, 201)
})

// PATCH /people/:username — update person
app.patch('/:username', async (c) => {
  const username = c.req.param('username')
  const existing = readPerson(username)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<Partial<Person>>()
  const updated: Person = { ...existing, ...body, username }
  writePerson(updated)
  return c.json(updated)
})

export default app
