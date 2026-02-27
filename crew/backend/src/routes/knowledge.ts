import { Hono } from 'hono'
import { listKnowledge } from '../store/index.js'

const app = new Hono()

// GET /knowledge
app.get('/', (c) => {
  return c.json(listKnowledge())
})

// GET /knowledge/:slug
app.get('/:slug', (c) => {
  const slug = c.req.param('slug')
  const entry = listKnowledge().find(k => k.slug === slug)
  if (!entry) return c.json({ error: 'Not found' }, 404)
  return c.json(entry)
})

export default app
