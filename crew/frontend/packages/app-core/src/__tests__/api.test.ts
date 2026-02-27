import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchBoard, createTask } from '../api.js'

describe('API error handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws with status message on non-ok response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    )
    await expect(fetchBoard()).rejects.toThrow('404 Not Found')
  })

  it('returns parsed JSON on 200', async () => {
    const board = { tasks: [], sprints: [], people: [] }
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(board), { status: 200 }),
    )
    const result = await fetchBoard()
    expect(result).toEqual(board)
  })
})

describe('createTask', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends POST /api/tasks with JSON body', async () => {
    const payload = {
      id: 'ENG-001',
      title: 'Test task',
      status: 'backlog' as const,
      priority: 'P2' as const,
      tags: [],
      blocks: [],
      blocked_by: [],
      body: '',
    }
    const mockResponse = { ...payload, created: '2026-01-01', updated: '2026-01-01' }
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )
    await createTask(payload)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })
})
