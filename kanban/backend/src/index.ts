import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { watch } from 'chokidar'
import { join } from 'path'
import tasksRouter from './routes/tasks.js'
import sprintsRouter from './routes/sprints.js'
import peopleRouter from './routes/people.js'
import knowledgeRouter from './routes/knowledge.js'
import decisionsRouter from './routes/decisions.js'
import { listTasks, listSprints, listPeople } from './store/index.js'

const TEAM_DIR = process.env.TEAM_DIR ?? join(process.cwd(), '..', '.team')
const PORT = parseInt(process.env.PORT ?? '3001', 10)

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route('/api/tasks', tasksRouter)
app.route('/api/sprints', sprintsRouter)
app.route('/api/people', peopleRouter)
app.route('/api/knowledge', knowledgeRouter)
app.route('/api/decisions', decisionsRouter)

// GET /api/board — all data in one shot (for initial load)
app.get('/api/board', (c) => {
  return c.json({
    tasks: listTasks(),
    sprints: listSprints(),
    people: listPeople(),
  })
})

// ─── SSE: real-time file-change events ────────────────────────────────────────

// Keep a set of active SSE controllers
const sseClients = new Set<(event: string, data: string) => void>()

function broadcast(event: string, data: object) {
  const payload = JSON.stringify(data)
  for (const send of sseClients) {
    try { send(event, payload) } catch { /* client disconnected */ }
  }
}

// Watch .team/ directory for changes
const watcher = watch(TEAM_DIR, {
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
})

function pathToResource(filePath: string): string {
  if (filePath.includes('/tasks/')) return 'tasks'
  if (filePath.includes('/sprints/')) return 'sprints'
  if (filePath.includes('/people/')) return 'people'
  if (filePath.includes('/knowledge/')) return 'knowledge'
  if (filePath.includes('/decisions/')) return 'decisions'
  return 'unknown'
}

watcher.on('all', (event, filePath) => {
  const resource = pathToResource(filePath)
  if (resource !== 'unknown') {
    broadcast('change', { resource, event, path: filePath })
  }
})

app.get('/api/events', (c) => {
  return streamSSE(c, async (stream) => {
    const send = (event: string, data: string) => {
      stream.writeSSE({ event, data }).catch(() => {})
    }

    sseClients.add(send)
    await stream.writeSSE({ event: 'connected', data: '{}' })

    // Keep alive ping every 30s
    const ping = setInterval(() => {
      stream.writeSSE({ event: 'ping', data: '{}' }).catch(() => clearInterval(ping))
    }, 30_000)

    // Cleanup on disconnect
    stream.onAbort(() => {
      clearInterval(ping)
      sseClients.delete(send)
    })

    // Hold open
    await new Promise<void>((resolve) => {
      stream.onAbort(resolve)
    })
  })
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ ok: true, teamDir: TEAM_DIR }))

// ─── Start ────────────────────────────────────────────────────────────────────

console.log(`Kanban backend running on http://localhost:${PORT}`)
console.log(`Watching .team/ at: ${TEAM_DIR}`)

export default {
  port: PORT,
  fetch: app.fetch,
}
