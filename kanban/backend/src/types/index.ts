// Core data types — mirrors what lives in .team/ as MD/JSON files

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export interface Task {
  id: string              // e.g. ENG-001
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: string       // username
  team?: string
  sprint?: number
  created: string         // ISO date
  updated: string
  tags: string[]
  blocks: string[]        // task IDs this blocks
  blocked_by: string[]    // task IDs blocking this
  plan_doc?: string       // path to docs/plans/*.md
  pr_url?: string
  body: string            // markdown body (background, acceptance criteria, discussion)
}

export interface Sprint {
  id: number
  name: string
  start: string           // ISO date
  end: string
  goal: string
  status: 'planned' | 'active' | 'completed'
}

export interface Person {
  username: string
  name: string
  team: string
  updated: string
  current_task?: string   // task ID
  blocked_by?: string     // task ID or description
  completed_today: string[]
  body: string            // markdown notes
}

export interface KnowledgeEntry {
  slug: string            // filename without .md
  title: string
  tags: string[]
  author: string
  date: string
  body: string
}

export interface Decision {
  id: string              // ADR-001
  title: string
  date: string
  author: string
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded'
  body: string
}

// API response shapes
export interface KanbanBoard {
  tasks: Task[]
  sprints: Sprint[]
  people: Person[]
}
