import { test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { readTask, writeTask, updateTaskStatus, readPerson } from '../store/index.js'
import type { Task } from '../types/index.js'

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'crew-test-'))
  process.env.TEAM_DIR = tempDir
})

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  delete process.env.TEAM_DIR
})

// ─── readTask ────────────────────────────────────────────────────────────────

test('readTask returns null for non-existent file', () => {
  expect(readTask('MISSING-001')).toBeNull()
})

test('writeTask + readTask round-trip preserves all fields', () => {
  const task: Task = {
    id: 'ENG-001',
    title: 'Test task',
    status: 'todo',
    priority: 'P1',
    created: '2026-01-01',
    updated: '2026-01-01',
    tags: ['backend'],
    blocks: ['ENG-002'],
    blocked_by: [],
    body: 'This is the task body.',
  }
  writeTask(task)
  const result = readTask('ENG-001')
  expect(result).not.toBeNull()
  expect(result!.title).toBe('Test task')
  expect(result!.status).toBe('todo')
  expect(result!.priority).toBe('P1')
  expect(result!.tags).toEqual(['backend'])
  expect(result!.blocks).toEqual(['ENG-002'])
  expect(result!.body).toBe('This is the task body.')
})

test('readTask applies default status and priority when frontmatter omits them', () => {
  mkdirSync(join(tempDir, 'tasks'), { recursive: true })
  writeFileSync(
    join(tempDir, 'tasks', 'MIN-001.md'),
    '---\ntitle: Minimal task\n---\n\nBody here.',
  )
  const result = readTask('MIN-001')
  expect(result).not.toBeNull()
  expect(result!.status).toBe('backlog')
  expect(result!.priority).toBe('P2')
  expect(result!.tags).toEqual([])
  expect(result!.blocks).toEqual([])
  expect(result!.blocked_by).toEqual([])
})

test('updateTaskStatus changes status and persists to disk', () => {
  const task: Task = {
    id: 'ENG-002',
    title: 'Status test',
    status: 'todo',
    priority: 'P2',
    created: '2026-01-01',
    updated: '2026-01-01',
    tags: [],
    blocks: [],
    blocked_by: [],
    body: '',
  }
  writeTask(task)
  const updated = updateTaskStatus('ENG-002', 'in-progress')
  expect(updated).not.toBeNull()
  expect(updated!.status).toBe('in-progress')
  expect(readTask('ENG-002')!.status).toBe('in-progress')
})

test('updateTaskStatus returns null for non-existent task', () => {
  expect(updateTaskStatus('MISSING-001', 'done')).toBeNull()
})

// ─── readPerson ───────────────────────────────────────────────────────────────

test('readPerson returns null for non-existent file', () => {
  expect(readPerson('nobody')).toBeNull()
})

test('readPerson parses person correctly', () => {
  mkdirSync(join(tempDir, 'people'), { recursive: true })
  writeFileSync(
    join(tempDir, 'people', 'alice.md'),
    [
      '---',
      'name: Alice',
      'team: eng',
      'updated: "2026-01-01"',
      'current_task: ENG-001',
      'completed_today:',
      '  - "Wrote tests"',
      '---',
      '',
      "Alice's notes.",
    ].join('\n'),
  )
  const result = readPerson('alice')
  expect(result).not.toBeNull()
  expect(result!.username).toBe('alice')
  expect(result!.name).toBe('Alice')
  expect(result!.team).toBe('eng')
  expect(result!.current_task).toBe('ENG-001')
  expect(result!.completed_today).toEqual(['Wrote tests'])
  expect(result!.body).toBe("Alice's notes.")
})
