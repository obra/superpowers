import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { User, Project, UserRegistry } from './types'

export class FileRegistry implements UserRegistry {
  private filePath: string
  private data: { users: User[] }

  constructor(filePath: string) {
    this.filePath = filePath
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify({ users: [] }, null, 2))
    }
    this.data = JSON.parse(readFileSync(filePath, 'utf-8'))
  }

  private save() {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }

  async findUser(githubId: number): Promise<User | null> {
    return this.data.users.find(u => u.github_id === githubId) ?? null
  }

  async saveUser(user: User): Promise<void> {
    const idx = this.data.users.findIndex(u => u.github_id === user.github_id)
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user }
    } else {
      this.data.users.push(user)
    }
    this.save()
  }

  async addProject(githubId: number, info: Omit<Project, 'id' | 'added_at' | 'last_visited'>): Promise<Project> {
    const user = await this.findUser(githubId)
    if (!user) throw new Error('User not found')
    const project: Project = {
      ...info,
      id: `proj_${Date.now()}`,
      added_at: new Date().toISOString(),
      last_visited: new Date().toISOString(),
    }
    user.projects.push(project)
    this.save()
    return project
  }

  async removeProject(githubId: number, projectId: string): Promise<void> {
    const user = await this.findUser(githubId)
    if (!user) throw new Error('User not found')
    user.projects = user.projects.filter(p => p.id !== projectId)
    this.save()
  }

  async listProjects(githubId: number): Promise<Project[]> {
    const user = await this.findUser(githubId)
    return user?.projects ?? []
  }

  async touchProject(githubId: number, projectId: string): Promise<void> {
    const user = await this.findUser(githubId)
    if (!user) return
    const proj = user.projects.find(p => p.id === projectId)
    if (proj) {
      proj.last_visited = new Date().toISOString()
      this.save()
    }
  }
}
