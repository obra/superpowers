// File-based store — reads and writes .team/ directory as MD/JSON
// All data lives in the git repo alongside code

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'
import type { Task, Sprint, Person, KnowledgeEntry, Decision, TaskStatus } from '../types/index.js'

// Root of the .team/ directory — resolved relative to the project being managed
// Can be overridden via TEAM_DIR env var
const TEAM_DIR = process.env.TEAM_DIR ?? join(process.cwd(), '..', '.team')

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function listTasks(): Task[] {
  const dir = join(TEAM_DIR, 'tasks')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => readTask(basename(f, '.md')))
    .filter(Boolean) as Task[]
}

export function readTask(id: string): Task | null {
  const file = join(TEAM_DIR, 'tasks', `${id}.md`)
  if (!existsSync(file)) return null

  const { data, content } = matter(readFileSync(file, 'utf8'))
  return {
    id,
    title: data.title ?? '',
    status: data.status ?? 'backlog',
    priority: data.priority ?? 'P2',
    assignee: data.assignee,
    team: data.team,
    sprint: data.sprint,
    created: data.created ?? new Date().toISOString().split('T')[0],
    updated: data.updated ?? new Date().toISOString().split('T')[0],
    tags: data.tags ?? [],
    blocks: data.blocks ?? [],
    blocked_by: data.blocked_by ?? [],
    plan_doc: data.plan_doc,
    pr_url: data.pr_url,
    body: content.trim(),
  }
}

export function writeTask(task: Task): void {
  ensureDir(join(TEAM_DIR, 'tasks'))
  const { body, ...frontmatter } = task
  frontmatter.updated = new Date().toISOString().split('T')[0]

  // Remove undefined values (YAML cannot serialize undefined)
  const cleanFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([_, v]) => v !== undefined)
  )

  const file = join(TEAM_DIR, 'tasks', `${task.id}.md`)
  writeFileSync(file, matter.stringify(body, cleanFrontmatter))
}

export function updateTaskStatus(id: string, status: TaskStatus): Task | null {
  const task = readTask(id)
  if (!task) return null
  task.status = status
  writeTask(task)
  return task
}

export function deleteTask(id: string): boolean {
  const file = join(TEAM_DIR, 'tasks', `${id}.md`)
  if (!existsSync(file)) return false
  unlinkSync(file)
  return true
}

// ─── Sprints ──────────────────────────────────────────────────────────────────

export function listSprints(): Sprint[] {
  const dir = join(TEAM_DIR, 'sprints')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const raw = readFileSync(join(dir, f), 'utf8')
      return JSON.parse(raw) as Sprint
    })
    .sort((a, b) => b.id - a.id)
}

export function activeSprint(): Sprint | null {
  return listSprints().find(s => s.status === 'active') ?? null
}

export function writeSprint(sprint: Sprint): void {
  ensureDir(join(TEAM_DIR, 'sprints'))
  const file = join(TEAM_DIR, 'sprints', `sprint-${sprint.id}.json`)
  writeFileSync(file, JSON.stringify(sprint, null, 2))
}

// ─── People ───────────────────────────────────────────────────────────────────

export function listPeople(): Person[] {
  const dir = join(TEAM_DIR, 'people')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => readPerson(basename(f, '.md')))
    .filter(Boolean) as Person[]
}

export function readPerson(username: string): Person | null {
  const file = join(TEAM_DIR, 'people', `${username}.md`)
  if (!existsSync(file)) return null

  const { data, content } = matter(readFileSync(file, 'utf8'))
  return {
    username,
    name: data.name ?? username,
    team: data.team ?? '',
    updated: data.updated ?? '',
    current_task: data.current_task,
    blocked_by: data.blocked_by,
    completed_today: data.completed_today ?? [],
    body: content.trim(),
  }
}

export function writePerson(person: Person): void {
  ensureDir(join(TEAM_DIR, 'people'))
  const { body, ...frontmatter } = person
  frontmatter.updated = new Date().toISOString().split('T')[0]
  const file = join(TEAM_DIR, 'people', `${person.username}.md`)
  writeFileSync(file, matter.stringify(body, frontmatter))
}

// ─── Knowledge ────────────────────────────────────────────────────────────────

export function listKnowledge(): KnowledgeEntry[] {
  const dir = join(TEAM_DIR, 'knowledge')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => {
      const slug = basename(f, '.md')
      const { data, content } = matter(readFileSync(join(dir, f), 'utf8'))
      return {
        slug,
        title: data.title ?? slug,
        tags: data.tags ?? [],
        author: data.author ?? '',
        date: data.date ?? '',
        body: content.trim(),
      } as KnowledgeEntry
    })
}

// ─── Decisions (ADR) ──────────────────────────────────────────────────────────

export function listDecisions(): Decision[] {
  const dir = join(TEAM_DIR, 'decisions')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => {
      const id = basename(f, '.md')
      const { data, content } = matter(readFileSync(join(dir, f), 'utf8'))
      return {
        id,
        title: data.title ?? '',
        date: data.date ?? '',
        author: data.author ?? '',
        status: data.status ?? 'proposed',
        body: content.trim(),
      } as Decision
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}
