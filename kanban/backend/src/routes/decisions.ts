import { Hono } from 'hono'
import { listDecisions } from '../store/index.js'

const app = new Hono()

// GET /decisions
app.get('/', (c) => {
  return c.json(listDecisions())
})

// GET /decisions/:id
app.get('/:id', (c) => {
  const id = c.req.param('id')
  const decision = listDecisions().find(d => d.id === id)
  if (!decision) return c.json({ error: 'Not found' }, 404)
  return c.json(decision)
})

export default app
