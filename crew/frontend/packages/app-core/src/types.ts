// Mirror of backend types — keep in sync with kanban/backend/src/types/index.ts

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  team?: string
  sprint?: number
  created: string
  updated: string
  tags: string[]
  blocks: string[]
  blocked_by: string[]
  plan_doc?: string
  pr_url?: string
  body: string
}

export interface Sprint {
  id: number
  name: string
  start: string
  end: string
  goal: string
  status: 'planned' | 'active' | 'completed'
}

export interface Person {
  username: string
  name: string
  team: string
  updated: string
  current_task?: string
  blocked_by?: string
  completed_today: string[]
  body: string
}

export interface KnowledgeEntry {
  slug: string
  title: string
  tags: string[]
  author: string
  date: string
  body: string
}

export interface Decision {
  id: string
  title: string
  date: string
  author: string
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded'
  body: string
}

export interface Board {
  tasks: Task[]
  sprints: Sprint[]
  people: Person[]
}
