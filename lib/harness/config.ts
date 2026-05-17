import * as fs from 'fs';
import * as path from 'path';
import { HarnessConfig, WorkspaceConfig, ProjectConfig, WorkspaceProject } from './types';

const DEFAULT_CONFIG: HarnessConfig = {
  coverageMin: 80,
  securityScan: { enabled: true, tools: { semgrep: true, gitleaks: true, npmAudit: true, trivy: false } },
  domainSpecific: {},
  timeout: { verifyLocal: 30, verifyAll: 300 },
  failOn: { lint: 'error', coverage: 'warning', security: 'error' },
};

export function loadProjectConfig(projectRoot: string): HarnessConfig {
  const configPath = path.join(projectRoot, '.harness.config.json');
  if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...raw };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function loadWorkspaceConfig(workspaceRoot: string): WorkspaceConfig | ProjectConfig | null {
  const configPath = path.join(workspaceRoot, '.harness-workspace.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function isWorkspaceMode(config: WorkspaceConfig | ProjectConfig): config is WorkspaceConfig {
  return 'projects' in config && Array.isArray((config as WorkspaceConfig).projects);
}

export function getProjects(config: WorkspaceConfig | ProjectConfig): WorkspaceProject[] {
  if (isWorkspaceMode(config)) return config.projects;
  return [{ path: (config as ProjectConfig).projectRoot || '.', stack: (config as ProjectConfig).stack, config: (config as ProjectConfig).config }];
}

export function saveWorkspaceConfig(workspaceRoot: string, config: WorkspaceConfig | ProjectConfig): void {
  const configPath = path.join(workspaceRoot, '.harness-workspace.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}
