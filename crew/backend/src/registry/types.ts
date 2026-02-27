export interface Project {
  id: string
  repo_full_name: string
  repo_url: string
  added_at: string
  last_visited: string
}

export interface User {
  github_id: number
  login: string
  name: string
  avatar_url: string
  created_at: string
  projects: Project[]
}

export interface UserRegistry {
  findUser(githubId: number): Promise<User | null>
  saveUser(user: User): Promise<void>
  addProject(githubId: number, project: Omit<Project, 'id' | 'added_at' | 'last_visited'>): Promise<Project>
  removeProject(githubId: number, projectId: string): Promise<void>
  listProjects(githubId: number): Promise<Project[]>
  touchProject(githubId: number, projectId: string): Promise<void>
}
