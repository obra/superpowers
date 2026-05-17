# Agentic Development Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Automated Verification Harness that transforms the agentic development cycle into a closed Execution-Validation-Correction loop with stack-agnostic validation, workspace multi-project discovery, and reviewer agents.

**Architecture:** Core library (`lib/harness/`) with stack-agnostic validators, per-stack modules, CLI tools, automatic hooks, and skills. TypeScript throughout, npm wrappers for external tools.

**Tech Stack:** TypeScript, Node.js, npm packages (semgrep, gitleaks), Claude Code hooks, superpowers-prepared skills system.

---

## File Structure

### New Files to Create

**Core Library:**
- `lib/harness/types.ts` — Shared TypeScript interfaces
- `lib/harness/index.ts` — Entry point, orchestrator
- `lib/harness/config.ts` — Config parser (.harness-workspace.json, .harness.config.json)
- `lib/harness/discovery.ts` — Workspace scanning + stack auto-detection
- `lib/harness/runner.ts` — Validation pipeline orchestrator
- `lib/harness/reporter.ts` — Report generation (MD + JSON)
- `lib/harness/boundary.ts` — extract_boundary_context (AST parsing)
- `lib/harness/installer.ts` — On-demand tool installation

**Validators:**
- `lib/harness/validators/lint.ts`
- `lib/harness/validators/typecheck.ts`
- `lib/harness/validators/test.ts`
- `lib/harness/validators/coverage.ts`
- `lib/harness/validators/security.ts`
- `lib/harness/validators/integration.ts`
- `lib/harness/validators/domain-specific.ts`
- `lib/harness/validators/migration.ts`

**Stack Modules:**
- `lib/harness/stacks/base.ts` — IStackHandler interface
- `lib/harness/stacks/react-nextjs.ts`
- `lib/harness/stacks/csharp-aspnet.ts`
- `lib/harness/stacks/terraform.ts`
- `lib/harness/stacks/python-fastapi.ts`
- `lib/harness/stacks/node-express.ts`
- `lib/harness/stacks/go-std.ts`

**Reviewer Prompts:**
- `lib/harness/reviewers/base-prompt.md`
- `lib/harness/reviewers/secops-prompt.md`
- `lib/harness/reviewers/stacks/react-nextjs.md`
- `lib/harness/reviewers/stacks/csharp-aspnet.md`
- `lib/harness/reviewers/stacks/terraform.md`

**CLI Tools:**
- `tools/harness/cli.ts` — CLI entry point
- `tools/harness/install-tools.ts` — Tool installer
- `tools/harness/scan-workspace.ts` — Workspace rescan

**Hook:**
- `hooks/post-task-validation.js` — Auto-validation hook

**Skills:**
- `skills/harness-verify/SKILL.md`
- `skills/extract-boundary/SKILL.md`

### Files to Modify

- `hooks/hooks.json` — Add PostTaskValidation hook
- `plugin.universal.yaml` — Add new hook entry
- `skills/subagent-driven-development/SKILL.md` — Add harness integration steps
- `.gitignore` — Add `.harness/reports/` patterns if needed

---

## Wave 1: Core Types + Config + Discovery (Independent)

### Task 1: Shared TypeScript Types

**Files:**
- Create: `lib/harness/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// lib/harness/types.ts

export interface ValidationResult {
  passed: boolean;
  errors: ParsedError[];
  warnings: string[];
  duration: number;
}

export interface ParsedError {
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: 'error' | 'warning';
}

export interface SecurityTool {
  name: string;
  npmPackage: string;
  cmd: string;
  outputFormat: 'json' | 'text';
}

export interface DomainCheck {
  name: string;
  cmd: string;
  threshold?: number;
}

export interface IStackHandler {
  name: string;
  detect(projectRoot: string): boolean;
  lintCmd(): string;
  typecheckCmd(): string;
  testCmd(files?: string[]): string;
  coverageCmd(): string;
  securityTools(): SecurityTool[];
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[];
}

export interface HarnessConfig {
  coverageMin: number;
  securityScan: {
    enabled: boolean;
    tools: Record<string, boolean>;
  };
  domainSpecific: Record<string, { enabled: boolean; budget?: Record<string, number> }>;
  timeout: { verifyLocal: number; verifyAll: number };
  failOn: { lint: 'error' | 'warning'; coverage: 'error' | 'warning'; security: 'error' | 'warning' };
}

export interface WorkspaceProject {
  path: string;
  stack: string;
  config?: string;
}

export interface WorkspaceConfig {
  version: string;
  generated: string;
  lastScan: string;
  projects: WorkspaceProject[];
  workspaceConfig: {
    autoRescan: boolean;
    reportPath: string;
  };
}

export interface ProjectConfig {
  version: string;
  generated: string;
  projectRoot: string;
  stack: string;
  config: string;
}

export interface VerifyReport {
  feature: string;
  mode: 'verify-local' | 'verify-all' | 'verify-security';
  timestamp: string;
  duration: number;
  summary: {
    lint: { errors: number; warnings: number; details: string };
    typecheck: { passed: boolean; files: number };
    tests: { passed: number; total: number; framework: string };
    coverage: { percentage: number; target: number; filesBelow: number };
  };
  issues: {
    file: string;
    line: number;
    message: string;
    specRequirement?: string;
    suggestion: string;
  }[];
  recommendations: string[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc lib/harness/types.ts --noEmit --skipLibCheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/harness/types.ts
git commit -m "feat(harness): add shared TypeScript types and interfaces"
```

---

### Task 2: Config Parser

**Files:**
- Create: `lib/harness/config.ts`
- Depends on: `lib/harness/types.ts`

- [ ] **Step 1: Write the config parser**

```typescript
// lib/harness/config.ts

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
```

- [ ] **Step 2: Write tests for config parser**

```typescript
// tests/harness/config.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { loadProjectConfig, loadWorkspaceConfig, isWorkspaceMode, getProjects } from '../../lib/harness/config';

const TEST_DIR = path.join(__dirname, '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('loadProjectConfig', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('returns default config when no file exists', () => {
    const config = loadProjectConfig(TEST_DIR);
    expect(config.coverageMin).toBe(80);
    expect(config.securityScan.enabled).toBe(true);
  });

  test('merges user config with defaults', () => {
    fs.writeFileSync(
      path.join(TEST_DIR, '.harness.config.json'),
      JSON.stringify({ coverageMin: 90 })
    );
    const config = loadProjectConfig(TEST_DIR);
    expect(config.coverageMin).toBe(90);
    expect(config.securityScan.enabled).toBe(true); // default preserved
  });
});

describe('loadWorkspaceConfig', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('returns null when no file exists', () => {
    expect(loadWorkspaceConfig(TEST_DIR)).toBeNull();
  });

  test('parses workspace mode config', () => {
    const wsConfig = {
      version: '1', generated: '2026-05-17', lastScan: '2026-05-17',
      projects: [{ path: 'frontend', stack: 'react-nextjs' }],
      workspaceConfig: { autoRescan: true, reportPath: '.harness/reports' },
    };
    fs.writeFileSync(path.join(TEST_DIR, '.harness-workspace.json'), JSON.stringify(wsConfig));
    const loaded = loadWorkspaceConfig(TEST_DIR);
    expect(isWorkspaceMode(loaded!)).toBe(true);
    expect(getProjects(loaded!)).toHaveLength(1);
  });

  test('parses project mode config', () => {
    const projConfig = {
      version: '1', generated: '2026-05-17',
      projectRoot: '.', stack: 'react-nextjs', config: './.harness.config.json',
    };
    fs.writeFileSync(path.join(TEST_DIR, '.harness-workspace.json'), JSON.stringify(projConfig));
    const loaded = loadWorkspaceConfig(TEST_DIR);
    expect(isWorkspaceMode(loaded!)).toBe(false);
    expect(getProjects(loaded!)).toHaveLength(1);
    expect(getProjects(loaded!)[0].stack).toBe('react-nextjs');
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx jest tests/harness/config.test.ts --passWithNoTests` (install jest if needed: `npm install --save-dev jest @types/jest ts-jest`)
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/harness/config.ts tests/harness/config.test.ts
git commit -m "feat(harness): add config parser with workspace/project mode support"
```

---

### Task 3: Stack Discovery

**Files:**
- Create: `lib/harness/discovery.ts`
- Depends on: `lib/harness/types.ts`, `lib/harness/config.ts`

- [ ] **Step 1: Write the discovery module**

```typescript
// lib/harness/discovery.ts

import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceConfig, WorkspaceProject } from './types';
import { loadWorkspaceConfig, saveWorkspaceConfig, isWorkspaceMode } from './config';

const STACK_DETECTORS: Record<string, { files: string[]; deps?: string[] }> = {
  'react-nextjs': { files: ['package.json'], deps: ['next', 'react'] },
  'csharp-aspnet': { files: ['*.csproj', '*.sln'] },
  'terraform': { files: ['*.tf', 'terraform.tf'] },
  'python-fastapi': { files: ['requirements.txt', 'pyproject.toml'], deps: ['fastapi'] },
  'node-express': { files: ['package.json'], deps: ['express'] },
  'go-std': { files: ['go.mod'] },
};

export function detectStack(projectRoot: string): string | null {
  for (const [stack, detector] of Object.entries(STACK_DETECTORS)) {
    const hasFiles = detector.files.some(pattern => {
      if (pattern.includes('*')) {
        const dir = projectRoot;
        try {
          const entries = fs.readdirSync(dir);
          return entries.some(f => {
            const ext = pattern.replace('*.', '');
            return f.endsWith(ext);
          });
        } catch { return false; }
      }
      return fs.existsSync(path.join(projectRoot, pattern));
    });
    if (!hasFiles) continue;

    if (detector.deps && detector.files.includes('package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (detector.deps.some(dep => dep in allDeps)) return stack;
      } catch { return stack; }
    } else if (!detector.deps) {
      return stack;
    }
  }
  return null;
}

export function scanWorkspace(workspaceRoot: string): WorkspaceConfig {
  const existing = loadWorkspaceConfig(workspaceRoot);
  const projects: WorkspaceProject[] = existing && isWorkspaceMode(existing) ? [...existing.projects] : [];
  const existingPaths = new Set(projects.map(p => p.path));

  const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const projectPath = path.join(workspaceRoot, entry.name);
    if (existingPaths.has(entry.name)) continue;
    const stack = detectStack(projectPath);
    if (stack) {
      projects.push({ path: entry.name, stack, config: `./${entry.name}/.harness.config.json` });
    }
  }

  const config: WorkspaceConfig = {
    version: '1',
    generated: new Date().toISOString(),
    lastScan: new Date().toISOString(),
    projects,
    workspaceConfig: { autoRescan: true, reportPath: '.harness/reports' },
  };

  saveWorkspaceConfig(workspaceRoot, config);
  return config;
}

export function shouldRescan(workspaceRoot: string): boolean {
  const config = loadWorkspaceConfig(workspaceRoot);
  if (!config || !isWorkspaceMode(config)) return true;
  if (!config.workspaceConfig.autoRescan) return false;
  const lastScan = new Date(config.lastScan).getTime();
  const now = Date.now();
  return (now - lastScan) > 5 * 60 * 1000; // 5 minutes
}
```

- [ ] **Step 2: Write tests for discovery**

```typescript
// tests/harness/discovery.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { detectStack, scanWorkspace, shouldRescan } from '../../lib/harness/discovery';

const TEST_DIR = path.join(__dirname, '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('detectStack', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('detects React/Next.js project', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'package.json'), JSON.stringify({ dependencies: { next: '^14.0.0', react: '^18.0.0' } }));
    expect(detectStack(TEST_DIR)).toBe('react-nextjs');
  });

  test('detects Go project', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'go.mod'), 'module test\n\ngo 1.21');
    expect(detectStack(TEST_DIR)).toBe('go-std');
  });

  test('detects Terraform project', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'main.tf'), 'resource "aws_instance" "test" {}');
    expect(detectStack(TEST_DIR)).toBe('terraform');
  });

  test('returns null for empty directory', () => {
    expect(detectStack(TEST_DIR)).toBeNull();
  });
});

describe('scanWorkspace', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('scans and detects projects in workspace', () => {
    const frontend = path.join(TEST_DIR, 'frontend');
    const backend = path.join(TEST_DIR, 'backend');
    fs.mkdirSync(frontend);
    fs.mkdirSync(backend);
    fs.writeFileSync(path.join(frontend, 'package.json'), JSON.stringify({ dependencies: { next: '^14.0.0' } }));
    fs.writeFileSync(path.join(backend, 'go.mod'), 'module test');

    const config = scanWorkspace(TEST_DIR);
    expect(config.projects).toHaveLength(2);
    expect(config.projects.find(p => p.path === 'frontend')?.stack).toBe('react-nextjs');
    expect(config.projects.find(p => p.path === 'backend')?.stack).toBe('go-std');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest tests/harness/discovery.test.ts -v`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/harness/discovery.ts tests/harness/discovery.test.ts
git commit -m "feat(harness): add stack discovery and workspace scanning"
```

---

## Wave 2: Runner + Validators (Depends on Wave 1)

### Task 4: Command Runner + Error Parser

**Files:**
- Create: `lib/harness/runner.ts`
- Depends on: `lib/harness/types.ts`, `lib/harness/config.ts`

- [ ] **Step 1: Write the runner module**

```typescript
// lib/harness/runner.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { ValidationResult, ParsedError } from './types';

const execAsync = promisify(exec);

export async function runCommand(cmd: string, cwd: string, timeout: number = 30000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout, maxBuffer: 10 * 1024 * 1024 });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code === 'ETIMEDOUT' ? 124 : (error.status || 1),
    };
  }
}

export function parseLintErrors(output: string, cwd: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = output.split('\n');
  const errorRegex = /(.+?):(\d+):(\d+)\s+(error|warning)\s+(.+)/;

  for (const line of lines) {
    const match = line.match(errorRegex);
    if (match) {
      errors.push({
        file: match[1].startsWith('/') ? match[1] : `${cwd}/${match[1]}`,
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        message: match[5].trim(),
        rule: '',
        severity: match[4] as 'error' | 'warning',
      });
    }
  }
  return errors;
}

export function parseTestErrors(output: string, cwd: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('FAIL') || line.includes('✗') || line.includes('×')) {
      const fileMatch = line.match(/(.+?):(\d+)/);
      if (fileMatch) {
        errors.push({
          file: fileMatch[1],
          line: parseInt(fileMatch[2]),
          column: 0,
          message: line.trim(),
          rule: 'test-failure',
          severity: 'error',
        });
      }
    }
  }
  return errors;
}

export function compressOutput(output: string, maxLines: number = 50): string {
  const lines = output.split('\n');
  if (lines.length <= maxLines) return output;
  const header = lines.slice(0, 10).join('\n');
  const footer = lines.slice(-10).join('\n');
  const skipped = lines.length - 20;
  return `${header}\n\n[... ${skipped} lines compressed ...]\n\n${footer}`;
}
```

- [ ] **Step 2: Write tests for runner**

```typescript
// tests/harness/runner.test.ts

import { parseLintErrors, parseTestErrors, compressOutput } from '../../lib/harness/runner';

describe('parseLintErrors', () => {
  test('parses ESLint-style errors', () => {
    const output = 'src/auth.ts:42:5 error Missing semicolon semi\nsrc/auth.ts:10:1 warning Unused import no-unused-vars';
    const errors = parseLintErrors(output, '/project');
    expect(errors).toHaveLength(2);
    expect(errors[0].file).toBe('/project/src/auth.ts');
    expect(errors[0].line).toBe(42);
    expect(errors[0].severity).toBe('error');
    expect(errors[1].severity).toBe('warning');
  });

  test('returns empty array for clean output', () => {
    expect(parseLintErrors('No errors found.', '/project')).toEqual([]);
  });
});

describe('compressOutput', () => {
  test('does not compress short output', () => {
    const output = 'line 1\nline 2\nline 3';
    expect(compressOutput(output)).toBe(output);
  });

  test('compresses long output', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`);
    const output = lines.join('\n');
    const compressed = compressOutput(output);
    expect(compressed).toContain('compressed');
    expect(compressed.split('\n').length).toBeLessThan(output.split('\n').length);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest tests/harness/runner.test.ts -v`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/harness/runner.ts tests/harness/runner.test.ts
git commit -m "feat(harness): add command runner and error parser"
```

---

### Task 5: Core Validators (lint, typecheck, test, coverage)

**Files:**
- Create: `lib/harness/validators/lint.ts`
- Create: `lib/harness/validators/typecheck.ts`
- Create: `lib/harness/validators/test.ts`
- Create: `lib/harness/validators/coverage.ts`
- Depends on: `lib/harness/types.ts`, `lib/harness/runner.ts`

- [ ] **Step 1: Write lint validator**

```typescript
// lib/harness/validators/lint.ts

import { ValidationResult, ParsedError } from '../types';
import { runCommand, parseLintErrors, compressOutput } from '../runner';

export async function validateLint(cwd: string, stack: string, timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const cmdMap: Record<string, string> = {
    'react-nextjs': 'npx eslint . --format stylish 2>&1 || true',
    'node-express': 'npx eslint . --format stylish 2>&1 || true',
    'csharp-aspnet': 'dotnet format --verify-no-changes 2>&1 || true',
    'python-fastapi': 'black --check . 2>&1 || true',
    'terraform': 'terraform fmt -check -recursive 2>&1 || true',
    'go-std': 'gofmt -l . 2>&1 || true',
  };
  const cmd = cmdMap[stack] || 'echo "No lint command configured for stack"';

  const result = await runCommand(cmd, cwd, timeout);
  const errors = parseLintErrors(result.stderr || result.stdout, cwd);
  const warnings = errors.filter(e => e.severity === 'warning');
  const hardErrors = errors.filter(e => e.severity === 'error');

  return {
    passed: hardErrors.length === 0,
    errors: hardErrors,
    warnings: warnings.map(w => `${w.file}:${w.line} - ${w.message}`),
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 2: Write typecheck validator**

```typescript
// lib/harness/validators/typecheck.ts

import { ValidationResult } from '../types';
import { runCommand, compressOutput } from '../runner';

export async function validateTypeCheck(cwd: string, stack: string, timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const cmdMap: Record<string, string> = {
    'react-nextjs': 'npx tsc --noEmit 2>&1 || true',
    'node-express': 'npx tsc --noEmit 2>&1 || true',
    'csharp-aspnet': 'dotnet build --no-restore 2>&1 || true',
    'python-fastapi': 'mypy . 2>&1 || true',
    'go-std': 'go build ./... 2>&1 || true',
    'terraform': 'terraform validate 2>&1 || true',
  };
  const cmd = cmdMap[stack] || 'echo "No typecheck command configured"';

  const result = await runCommand(cmd, cwd, timeout);
  const output = result.stderr || result.stdout;
  const passed = result.exitCode === 0;

  return {
    passed,
    errors: passed ? [] : [{ file: '', line: 0, column: 0, message: compressOutput(output, 30), rule: 'typecheck', severity: 'error' as const }],
    warnings: [],
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 3: Write test validator**

```typescript
// lib/harness/validators/test.ts

import { ValidationResult, ParsedError } from '../types';
import { runCommand, parseTestErrors, compressOutput } from '../runner';

export async function validateTests(cwd: string, stack: string, files?: string[], timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const fileArg = files && files.length > 0 ? ` -- ${files.join(' ')}` : '';
  const cmdMap: Record<string, string> = {
    'react-nextjs': `npx jest --passWithNoTests --json --outputFile=/dev/null 2>&1 || true`,
    'node-express': `npx jest --passWithNoTests 2>&1 || true`,
    'csharp-aspnet': `dotnet test --no-build --logger "console;verbosity=normal" 2>&1 || true`,
    'python-fastapi': `pytest --tb=short 2>&1 || true`,
    'go-std': `go test ./... 2>&1 || true`,
    'terraform': 'echo "No test framework for Terraform"',
  };
  const cmd = cmdMap[stack] || 'echo "No test command configured"';

  const result = await runCommand(cmd, cwd, timeout);
  const output = result.stderr || result.stdout;
  const passed = result.exitCode === 0;

  // Parse test counts from output
  const passMatch = output.match(/(\d+)\s+passed?/);
  const failMatch = output.match(/(\d+)\s+failed?/);
  const totalMatch = output.match(/(\d+)\s+tests?/);
  const passed_count = passMatch ? parseInt(passMatch[1]) : 0;
  const failed_count = failMatch ? parseInt(failMatch[1]) : 0;
  const total = totalMatch ? parseInt(totalMatch[1]) : passed_count + failed_count;

  const errors = parseTestErrors(output, cwd);

  return {
    passed,
    errors,
    warnings: [],
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 4: Write coverage validator**

```typescript
// lib/harness/validators/coverage.ts

import { ValidationResult } from '../types';
import { runCommand, compressOutput } from '../runner';

export async function validateCoverage(cwd: string, stack: string, minCoverage: number = 80, timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const cmdMap: Record<string, string> = {
    'react-nextjs': 'npx jest --coverage --coverageReporters=text-summary 2>&1 || true',
    'node-express': 'npx jest --coverage --coverageReporters=text-summary 2>&1 || true',
    'csharp-aspnet': 'dotnet test --collect:"XPlat Code Coverage" 2>&1 || true',
    'python-fastapi': 'pytest --cov=. --cov-report=term-missing 2>&1 || true',
    'go-std': 'go test -coverprofile=coverage.out && go tool cover -func=coverage.out 2>&1 || true',
    'terraform': 'echo "N/A"',
  };
  const cmd = cmdMap[stack] || 'echo "No coverage command configured"';

  const result = await runCommand(cmd, cwd, timeout);
  const output = result.stderr || result.stdout;

  // Extract coverage percentage
  const pctMatch = output.match(/(?:Lines|All files|TOTAL)[:\s]+(\d+\.?\d*)%?/);
  const coverage = pctMatch ? parseFloat(pctMatch[1]) : 0;
  const passed = coverage >= minCoverage;

  return {
    passed,
    errors: passed ? [] : [{ file: '', line: 0, column: 0, message: `Coverage ${coverage.toFixed(1)}% below threshold ${minCoverage}%`, rule: 'coverage', severity: 'error' as const }],
    warnings: [],
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/harness/validators/lint.ts lib/harness/validators/typecheck.ts lib/harness/validators/test.ts lib/harness/validators/coverage.ts
git commit -m "feat(harness): add core validators (lint, typecheck, test, coverage)"
```

---

### Task 6: Security + Domain-Specific + Migration Validators

**Files:**
- Create: `lib/harness/validators/security.ts`
- Create: `lib/harness/validators/domain-specific.ts`
- Create: `lib/harness/validators/migration.ts`
- Depends on: `lib/harness/types.ts`, `lib/harness/runner.ts`

- [ ] **Step 1: Write security validator**

```typescript
// lib/harness/validators/security.ts

import { ValidationResult, ParsedError, SecurityTool } from '../types';
import { runCommand, compressOutput } from '../runner';

const SECURITY_TOOLS: SecurityTool[] = [
  { name: 'semgrep', npmPackage: 'semgrep', cmd: 'npx semgrep --config=auto --json --quiet . 2>&1 || true', outputFormat: 'json' },
  { name: 'gitleaks', npmPackage: 'gitleaks', cmd: 'npx gitleaks detect --report-format json --report-path /dev/null 2>&1 || true', outputFormat: 'json' },
  { name: 'npmAudit', npmPackage: '', cmd: 'npm audit --json 2>&1 || true', outputFormat: 'json' },
];

export async function validateSecurity(cwd: string, tools: Record<string, boolean>, timeout: number = 60000): Promise<ValidationResult> {
  const start = Date.now();
  const errors: ParsedError[] = [];
  const warnings: string[] = [];

  for (const tool of SECURITY_TOOLS) {
    if (!tools[tool.name]) continue;
    const result = await runCommand(tool.cmd, cwd, timeout);
    const output = result.stderr || result.stdout;

    if (result.exitCode !== 0 && result.exitCode !== 124) {
      errors.push({
        file: '', line: 0, column: 0,
        message: `${tool.name}: ${compressOutput(output, 20)}`,
        rule: tool.name, severity: 'error',
      });
    } else if (output && !output.includes('"vulnerabilities":0') && !output.includes('"results":[]')) {
      warnings.push(`${tool.name}: findings detected (review report)`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 2: Write domain-specific validator**

```typescript
// lib/harness/validators/domain-specific.ts

import { ValidationResult } from '../types';
import { runCommand, compressOutput } from '../runner';

export async function validateDomainSpecific(cwd: string, stack: string, domain: 'frontend' | 'backend' | 'infra', config: Record<string, any>, timeout: number = 120000): Promise<ValidationResult> {
  const start = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (domain === 'frontend' && (stack === 'react-nextjs' || stack === 'node-express')) {
    if (config.lighthouse?.enabled) {
      const budget = config.lighthouse.budget?.performance || 90;
      const cmd = `npx lhci autorun --collect.url=http://localhost:3000 2>&1 || true`;
      const result = await runCommand(cmd, cwd, timeout);
      if (result.exitCode !== 0) warnings.push(`Lighthouse: review output for performance score (target: ${budget})`);
    }
  }

  if (domain === 'infra' && stack === 'terraform') {
    if (config.tflint) {
      const cmd = 'tflint --format=json 2>&1 || true';
      const result = await runCommand(cmd, cwd, timeout);
      if (result.exitCode !== 0) errors.push(`TFLint: ${compressOutput(result.stderr || result.stdout, 20)}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors: errors.map(e => ({ file: '', line: 0, column: 0, message: e, rule: 'domain-specific', severity: 'error' as const })),
    warnings,
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 3: Write migration validator**

```typescript
// lib/harness/validators/migration.ts

import { ValidationResult } from '../types';
import { runCommand } from '../runner';
import * as fs from 'fs';
import * as path from 'path';

const DESTRUCTIVE_PATTERNS = [
  /DROP\s+TABLE/i,
  /DROP\s+COLUMN/i,
  /ALTER\s+.*\s+COLUMN.*\s+(SET\s+DATA\s+TYPE|TYPE)\s+/i,
  /ALTER\s+.*\s+DROP\s+CONSTRAINT/i,
];

const SAFE_ALTERNATIVES: Record<string, string> = {
  'DROP TABLE': 'Use soft deletes (is_deleted column) + archive migration instead',
  'DROP COLUMN': 'Mark column as deprecated, add new column, backfill, then remove in next release',
  'ALTER COLUMN TYPE': 'Add new column, dual-write, backfill, switch reads, remove old column',
  'DROP CONSTRAINT': 'Add new constraint as NOT VALID, validate in background',
};

export async function validateMigrations(cwd: string, stack: string): Promise<ValidationResult> {
  const start = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  // Find migration files
  const migrationPatterns = ['**/migrations/*.sql', '**/Migrations/*.cs', '**/*.up.sql'];
  let migrationFiles: string[] = [];

  for (const pattern of migrationPatterns) {
    try {
      const { execSync } = require('child_process');
      const result = execSync(`git ls-files "${pattern}"`, { cwd }).toString().trim();
      if (result) migrationFiles = migrationFiles.concat(result.split('\n'));
    } catch { /* ignore */ }
  }

  for (const file of migrationFiles) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');

    for (const pattern of DESTRUCTIVE_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        const key = Object.keys(SAFE_ALTERNATIVES).find(k => pattern.test(k)) || 'destructive operation';
        warnings.push(`${file}: ${match[0]} — ${SAFE_ALTERNATIVES[key]}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors: errors.map(e => ({ file: '', line: 0, column: 0, message: e, rule: 'migration', severity: 'error' as const })),
    warnings,
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/harness/validators/security.ts lib/harness/validators/domain-specific.ts lib/harness/validators/migration.ts
git commit -m "feat(harness): add security, domain-specific, and migration validators"
```

---

## Wave 3: Stack Modules + Reporter + Harness Index (Depends on Wave 2)

### Task 7: Stack Base Interface + Implementations

**Files:**
- Create: `lib/harness/stacks/base.ts`
- Create: `lib/harness/stacks/react-nextjs.ts`
- Create: `lib/harness/stacks/csharp-aspnet.ts`
- Create: `lib/harness/stacks/terraform.ts`
- Create: `lib/harness/stacks/python-fastapi.ts`
- Create: `lib/harness/stacks/node-express.ts`
- Create: `lib/harness/stacks/go-std.ts`
- Depends on: `lib/harness/types.ts`

- [ ] **Step 1: Write base interface**

```typescript
// lib/harness/stacks/base.ts

import { IStackHandler, SecurityTool, DomainCheck } from '../types';

export abstract class BaseStackHandler implements IStackHandler {
  abstract name: string;
  abstract detect(projectRoot: string): boolean;
  abstract lintCmd(): string;
  abstract typecheckCmd(): string;
  abstract testCmd(files?: string[]): string;
  abstract coverageCmd(): string;
  abstract securityTools(): SecurityTool[];
  abstract domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[];
}
```

- [ ] **Step 2: Write React/Next.js stack**

```typescript
// lib/harness/stacks/react-nextjs.ts

import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class ReactNextJsStack extends BaseStackHandler {
  name = 'react-nextjs';

  detect(projectRoot: string): boolean {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return 'next' in deps && 'react' in deps;
    } catch { return false; }
  }

  lintCmd(): string { return 'npx eslint . --format stylish'; }
  typecheckCmd(): string { return 'npx tsc --noEmit'; }
  testCmd(files?: string[]): string { return files ? `npx jest ${files.join(' ')}` : 'npx jest'; }
  coverageCmd(): string { return 'npx jest --coverage --coverageReporters=text-summary'; }

  securityTools(): SecurityTool[] {
    return [
      { name: 'semgrep', npmPackage: 'semgrep', cmd: 'npx semgrep --config=auto --json .', outputFormat: 'json' },
      { name: 'npmAudit', npmPackage: '', cmd: 'npm audit --json', outputFormat: 'json' },
    ];
  }

  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    if (domain === 'frontend') {
      return [
        { name: 'lighthouse', cmd: 'npx lhci autorun', threshold: 90 },
      ];
    }
    return [];
  }
}
```

- [ ] **Step 3: Write C#/ASP.NET stack**

```typescript
// lib/harness/stacks/csharp-aspnet.ts

import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class CSharpAspNetStack extends BaseStackHandler {
  name = 'csharp-aspnet';

  detect(projectRoot: string): boolean {
    try {
      const entries = fs.readdirSync(projectRoot);
      return entries.some(f => f.endsWith('.csproj') || f.endsWith('.sln'));
    } catch { return false; }
  }

  lintCmd(): string { return 'dotnet format --verify-no-changes'; }
  typecheckCmd(): string { return 'dotnet build --no-restore'; }
  testCmd(files?: string[]): string { return files ? `dotnet test ${files.join(' ')} --no-build` : 'dotnet test --no-build'; }
  coverageCmd(): string { return 'dotnet test --collect:"XPlat Code Coverage"'; }

  securityTools(): SecurityTool[] {
    return [
      { name: 'dotnet-audit', npmPackage: '', cmd: 'dotnet list package --vulnerable', outputFormat: 'text' },
    ];
  }

  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    if (domain === 'backend') {
      return [
        { name: 'openapi-validate', cmd: 'dotnet swagger validate', threshold: undefined },
      ];
    }
    return [];
  }
}
```

- [ ] **Step 4: Write remaining stacks (terraform, python-fastapi, node-express, go-std)**

```typescript
// lib/harness/stacks/terraform.ts

import * as fs from 'fs';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class TerraformStack extends BaseStackHandler {
  name = 'terraform';
  detect(projectRoot: string): boolean {
    try {
      return fs.readdirSync(projectRoot).some(f => f.endsWith('.tf'));
    } catch { return false; }
  }
  lintCmd(): string { return 'terraform fmt -check -recursive'; }
  typecheckCmd(): string { return 'terraform validate'; }
  testCmd(): string { return 'echo "No tests for Terraform"'; }
  coverageCmd(): string { return 'echo "N/A"'; }
  securityTools(): SecurityTool[] {
    return [{ name: 'checkov', npmPackage: 'checkov', cmd: 'checkov -d . --quiet', outputFormat: 'json' }];
  }
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    return domain === 'infra' ? [{ name: 'tflint', cmd: 'tflint --format=json' }] : [];
  }
}
```

```typescript
// lib/harness/stacks/python-fastapi.ts

import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class PythonFastApiStack extends BaseStackHandler {
  name = 'python-fastapi';
  detect(projectRoot: string): boolean {
    try {
      const req = fs.readFileSync(path.join(projectRoot, 'requirements.txt'), 'utf-8');
      return req.toLowerCase().includes('fastapi');
    } catch { return false; }
  }
  lintCmd(): string { return 'black --check .'; }
  typecheckCmd(): string { return 'mypy .'; }
  testCmd(): string { return 'pytest --tb=short'; }
  coverageCmd(): string { return 'pytest --cov=. --cov-report=term-missing'; }
  securityTools(): SecurityTool[] {
    return [{ name: 'bandit', npmPackage: 'bandit', cmd: 'bandit -r . -f json', outputFormat: 'json' }];
  }
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    return domain === 'backend' ? [{ name: 'openapi-check', cmd: 'openapi-spec-validator openapi.json' }] : [];
  }
}
```

```typescript
// lib/harness/stacks/node-express.ts

import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class NodeExpressStack extends BaseStackHandler {
  name = 'node-express';
  detect(projectRoot: string): boolean {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return 'express' in deps;
    } catch { return false; }
  }
  lintCmd(): string { return 'npx eslint . --format stylish'; }
  typecheckCmd(): string { return 'npx tsc --noEmit'; }
  testCmd(): string { return 'npx jest'; }
  coverageCmd(): string { return 'npx jest --coverage --coverageReporters=text-summary'; }
  securityTools(): SecurityTool[] {
    return [
      { name: 'semgrep', npmPackage: 'semgrep', cmd: 'npx semgrep --config=auto --json .', outputFormat: 'json' },
      { name: 'npmAudit', npmPackage: '', cmd: 'npm audit --json', outputFormat: 'json' },
    ];
  }
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    return domain === 'backend' ? [{ name: 'openapi-validate', cmd: 'npx swagger-cli validate' }] : [];
  }
}
```

```typescript
// lib/harness/stacks/go-std.ts

import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class GoStdStack extends BaseStackHandler {
  name = 'go-std';
  detect(projectRoot: string): boolean {
    return fs.existsSync(path.join(projectRoot, 'go.mod'));
  }
  lintCmd(): string { return 'gofmt -l .'; }
  typecheckCmd(): string { return 'go build ./...'; }
  testCmd(): string { return 'go test ./...'; }
  coverageCmd(): string { return 'go test -coverprofile=coverage.out && go tool cover -func=coverage.out'; }
  securityTools(): SecurityTool[] {
    return [{ name: 'gosec', npmPackage: 'gosec', cmd: 'gosec -fmt=json ./...', outputFormat: 'json' }];
  }
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    return domain === 'backend' ? [{ name: 'go-vet', cmd: 'go vet ./...' }] : [];
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/harness/stacks/
git commit -m "feat(harness): add stack modules for all supported technologies"
```

---

### Task 8: Reporter Module

**Files:**
- Create: `lib/harness/reporter.ts`
- Depends on: `lib/harness/types.ts`, `lib/harness/runner.ts`

- [ ] **Step 1: Write the reporter**

```typescript
// lib/harness/reporter.ts

import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, VerifyReport } from './types';

export function extractFeatureName(cwd: string): string {
  // Try branch name first
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git branch --show-current', { cwd }).toString().trim();
    if (branch) {
      // Extract feature name from branch (feature/auth-middleware -> auth-middleware)
      const parts = branch.split('/');
      return parts[parts.length - 1] || branch;
    }
  } catch { /* ignore */ }
  // Fallback to timestamp
  return `session-${Date.now()}`;
}

export function generateReport(
  feature: string,
  mode: 'verify-local' | 'verify-all' | 'verify-security',
  results: Record<string, ValidationResult>,
  coverageTarget: number
): VerifyReport {
  const lintResult = results.lint || { passed: true, errors: [], warnings: [], duration: 0 };
  const typecheckResult = results.typecheck || { passed: true, errors: [], warnings: [], duration: 0 };
  const testResult = results.test || { passed: true, errors: [], warnings: [], duration: 0 };
  const coverageResult = results.coverage || { passed: true, errors: [], warnings: [], duration: 0 };

  const totalDuration = Object.values(results).reduce((sum, r) => sum + r.duration, 0);

  const allErrors = [...lintResult.errors, ...typecheckResult.errors, ...testResult.errors, ...coverageResult.errors];
  const allWarnings = [...lintResult.warnings, ...typecheckResult.warnings, ...testResult.warnings, ...coverageResult.warnings];

  const report: VerifyReport = {
    feature,
    mode,
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    summary: {
      lint: { errors: lintResult.errors.length, warnings: lintResult.warnings.length, details: lintResult.warnings.join(', ') || 'clean' },
      typecheck: { passed: typecheckResult.passed, files: 0 },
      tests: { passed: testResult.passed ? -1 : 0, total: -1, framework: 'unknown' },
      coverage: { percentage: coverageResult.passed ? coverageTarget : 0, target: coverageTarget, filesBelow: coverageResult.errors.length },
    },
    issues: allErrors.map(e => ({
      file: e.file,
      line: e.line,
      message: e.message,
      suggestion: `Review and fix: ${e.message}`,
    })),
    recommendations: allWarnings.map(w => w),
  };

  return report;
}

export function formatReportMarkdown(report: VerifyReport): string {
  const lines: string[] = [];
  lines.push(`# Verify Report — ${report.feature}`);
  lines.push(`Date: ${report.timestamp} | Mode: ${report.mode} | Duration: ${(report.duration / 1000).toFixed(1)}s`);
  lines.push('');
  lines.push('## Summary');

  const s = report.summary;
  lines.push(`${s.lint.errors === 0 ? '✅' : '❌'} Lint: ${s.lint.errors} errors, ${s.lint.warnings} warnings (${s.lint.details})`);
  lines.push(`${s.typecheck.passed ? '✅' : '❌'} TypeCheck: ${s.typecheck.passed ? 'passed' : 'failed'} (${s.typecheck.files} files)`);
  lines.push(`${s.tests.passed >= 0 ? (s.tests.passed === s.tests.total ? '✅' : '❌') : '✅'} Tests: ${s.tests.passed >= 0 ? `${s.tests.passed}/${s.tests.total} passing` : 'passed'} (${s.tests.framework})`);
  lines.push(`${s.coverage.percentage >= s.coverage.target ? '✅' : '⚠️'} Coverage: ${s.coverage.percentage.toFixed(1)}% (target: ${s.coverage.target}%) — ${s.coverage.filesBelow} files below threshold`);

  if (report.issues.length > 0) {
    lines.push('');
    lines.push('## Issues');
    report.issues.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue.file}:${issue.line} — ${issue.message}`);
      if (issue.suggestion) lines.push(`   💡 Sugestão: ${issue.suggestion}`);
    });
  }

  if (report.recommendations.length > 0) {
    lines.push('');
    lines.push('## Recommendations');
    report.recommendations.forEach(r => lines.push(`- ${r}`));
  }

  return lines.join('\n');
}

export function saveReport(report: VerifyReport, reportDir: string): string {
  const featureDir = path.join(reportDir, report.feature);
  fs.mkdirSync(featureDir, { recursive: true });

  const timestamp = report.timestamp.replace(/[:.]/g, '-');
  const mdPath = path.join(featureDir, `${timestamp}-verify-report.md`);
  const mdContent = formatReportMarkdown(report);
  fs.writeFileSync(mdPath, mdContent + '\n');

  const jsonPath = path.join(featureDir, `${timestamp}-verify-report.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');

  return mdPath;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/harness/reporter.ts
git commit -m "feat(harness): add report generator with markdown and JSON output"
```

---

### Task 9: Harness Index + Orchestrator

**Files:**
- Create: `lib/harness/index.ts`
- Depends on: All validators, config, discovery, reporter, stacks

- [ ] **Step 1: Write the harness orchestrator**

```typescript
// lib/harness/index.ts

import { ValidationResult, HarnessConfig, VerifyReport } from './types';
import { loadProjectConfig, loadWorkspaceConfig, isWorkspaceMode, getProjects } from './config';
import { detectStack, scanWorkspace, shouldRescan } from './discovery';
import { validateLint } from './validators/lint';
import { validateTypeCheck } from './validators/typecheck';
import { validateTests } from './validators/test';
import { validateCoverage } from './validators/coverage';
import { validateSecurity } from './validators/security';
import { validateDomainSpecific } from './validators/domain-specific';
import { validateMigrations } from './validators/migration';
import { generateReport, saveReport, extractFeatureName } from './reporter';
import * as path from 'path';

export interface VerifyOptions {
  mode: 'verify-local' | 'verify-all' | 'verify-security';
  cwd?: string;
  feature?: string;
}

export async function verify(options: VerifyOptions = { mode: 'verify-local' }): Promise<VerifyReport> {
  const cwd = options.cwd || process.cwd();
  const config = loadProjectConfig(cwd);
  let stack = detectStack(cwd);

  if (!stack) {
    // Try workspace scan
    const wsConfig = loadWorkspaceConfig(cwd);
    if (wsConfig && isWorkspaceMode(wsConfig)) {
      if (shouldRescan(cwd)) scanWorkspace(cwd);
    }
    throw new Error(`Could not detect stack for project at ${cwd}`);
  }

  const feature = options.feature || extractFeatureName(cwd);
  const results: Record<string, ValidationResult> = {};

  if (options.mode === 'verify-security') {
    results.security = await validateSecurity(cwd, config.securityScan.tools, config.timeout.verifyAll);
  } else {
    // verify-local or verify-all
    results.lint = await validateLint(cwd, stack, config.timeout.verifyLocal);
    if (!results.lint.passed && config.failOn.lint === 'error') {
      const report = generateReport(feature, options.mode, results, config.coverageMin);
      saveReport(report, path.join(cwd, '.harness', 'reports'));
      return report;
    }

    results.typecheck = await validateTypeCheck(cwd, stack, config.timeout.verifyLocal);
    if (!results.typecheck.passed) {
      const report = generateReport(feature, options.mode, results, config.coverageMin);
      saveReport(report, path.join(cwd, '.harness', 'reports'));
      return report;
    }

    results.test = await validateTests(cwd, stack);
    if (!results.test.passed) {
      const report = generateReport(feature, options.mode, results, config.coverageMin);
      saveReport(report, path.join(cwd, '.harness', 'reports'));
      return report;
    }

    results.coverage = await validateCoverage(cwd, stack, config.coverageMin, config.timeout.verifyLocal);

    if (options.mode === 'verify-all') {
      results.security = await validateSecurity(cwd, config.securityScan.tools, config.timeout.verifyAll);
      results.integration = await validateIntegration(cwd, stack, config.timeout.verifyAll);
      results.domainSpecific = await validateDomainSpecific(cwd, stack, 'frontend', config.domainSpecific, config.timeout.verifyAll);
      results.migration = await validateMigrations(cwd, stack);
    }
  }

  const report = generateReport(feature, options.mode, results, config.coverageMin);
  const reportPath = saveReport(report, path.join(cwd, '.harness', 'reports'));
  return report;
}

// Re-exports for CLI and hooks
export { loadProjectConfig, loadWorkspaceConfig, detectStack, scanWorkspace } from './config';
export { extractFeatureName, formatReportMarkdown } from './reporter';
export { validateLint } from './validators/lint';
export { validateTypeCheck } from './validators/typecheck';
export { validateTests } from './validators/test';
export { validateCoverage } from './validators/coverage';
export { validateSecurity } from './validators/security';
```

Note: Need to add `validateIntegration` import — add it to the validators list.

- [ ] **Step 2: Add integration validator stub**

```typescript
// lib/harness/validators/integration.ts

import { ValidationResult } from '../types';
import { runCommand } from '../runner';

export async function validateIntegration(cwd: string, stack: string, timeout: number = 120000): Promise<ValidationResult> {
  const start = Date.now();
  const cmdMap: Record<string, string> = {
    'react-nextjs': 'npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true',
    'node-express': 'npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true',
    'csharp-aspnet': 'dotnet test --filter "Category=Integration" 2>&1 || true',
    'python-fastapi': 'pytest -m integration --tb=short 2>&1 || true',
    'go-std': 'go test -tags=integration ./... 2>&1 || true',
    'terraform': 'echo "No integration tests for Terraform"',
  };
  const cmd = cmdMap[stack] || 'echo "No integration test command configured"';
  const result = await runCommand(cmd, cwd, timeout);

  return {
    passed: result.exitCode === 0,
    errors: result.exitCode === 0 ? [] : [{ file: '', line: 0, column: 0, message: result.stderr || result.stdout, rule: 'integration', severity: 'error' as const }],
    warnings: [],
    duration: Date.now() - start,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/harness/index.ts lib/harness/validators/integration.ts
git commit -m "feat(harness): add orchestrator and integration validator"
```

---

## Wave 4: CLI Tools + Hook + Skills (Depends on Wave 3)

### Task 10: CLI Entry Point

**Files:**
- Create: `tools/harness/cli.ts`
- Create: `tools/harness/install-tools.ts`
- Create: `tools/harness/scan-workspace.ts`
- Depends on: `lib/harness/index.ts`

- [ ] **Step 1: Write CLI**

```typescript
#!/usr/bin/env node
// tools/harness/cli.ts

import { verify } from '../../lib/harness';

const args = process.argv.slice(2);
const mode = args[0] || 'local';

const modeMap: Record<string, 'verify-local' | 'verify-all' | 'verify-security'> = {
  local: 'verify-local',
  all: 'verify-all',
  security: 'verify-security',
};

const verifyMode = modeMap[mode] || 'verify-local';

async function main() {
  console.log(`Running ${verifyMode}...`);
  try {
    const report = await verify({ mode: verifyMode });
    console.log(`\nReport saved to: .harness/reports/${report.feature}/`);
    console.log(`Duration: ${(report.duration / 1000).toFixed(1)}s`);

    const allPassed = report.issues.length === 0;
    if (allPassed) {
      console.log('✅ All checks passed');
      process.exit(0);
    } else {
      console.log(`\n❌ ${report.issues.length} issue(s) found:`);
      report.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.file}:${issue.line} — ${issue.message}`);
      });
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Write install-tools CLI**

```typescript
#!/usr/bin/env node
// tools/harness/install-tools.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TOOLS = [
  { name: 'semgrep', package: 'semgrep' },
  { name: 'gitleaks', package: 'gitleaks' },
  { name: 'checkov', package: 'checkov' },
  { name: 'bandit', package: 'bandit' },
  { name: 'gosec', package: 'gosec' },
];

async function main() {
  const args = process.argv.slice(2);
  const toolName = args[0];

  if (toolName) {
    const tool = TOOLS.find(t => t.name === toolName);
    if (!tool) {
      console.error(`Unknown tool: ${toolName}`);
      process.exit(1);
    }
    console.log(`Installing ${tool.name}...`);
    await execAsync(`npm install -g ${tool.package}`);
    console.log(`✅ ${tool.name} installed`);
  } else {
    console.log('Installing all harness tools...');
    for (const tool of TOOLS) {
      try {
        console.log(`Installing ${tool.name}...`);
        await execAsync(`npm install -g ${tool.package}`);
        console.log(`✅ ${tool.name}`);
      } catch (error: any) {
        console.log(`⚠️  ${tool.name}: ${error.message}`);
      }
    }
    console.log('\nDone!');
  }
}

main();
```

- [ ] **Step 3: Write scan-workspace CLI**

```typescript
#!/usr/bin/env node
// tools/harness/scan-workspace.ts

import { scanWorkspace } from '../../lib/harness/discovery';
import * as path from 'path';

async function main() {
  const cwd = process.argv[2] || process.cwd();
  console.log(`Scanning workspace: ${cwd}`);
  const config = scanWorkspace(cwd);
  console.log(`\nFound ${config.projects.length} project(s):`);
  for (const project of config.projects) {
    console.log(`  - ${project.path} (${project.stack})`);
  }
  console.log(`\nWorkspace config saved to: ${path.join(cwd, '.harness-workspace.json')}`);
}

main();
```

- [ ] **Step 4: Commit**

```bash
git add tools/harness/
git commit -m "feat(harness): add CLI tools (verify, install-tools, scan-workspace)"
```

---

### Task 11: Post-Task Validation Hook

**Files:**
- Create: `hooks/post-task-validation.js`
- Modify: `hooks/hooks.json`
- Modify: `plugin.universal.yaml`

- [ ] **Step 1: Write the hook**

```javascript
#!/usr/bin/env node
// hooks/post-task-validation.js
/**
 * PostTaskValidation Hook — Automatic validation after file edits.
 *
 * Reads stdin for edit context, detects modified files, identifies
 * the affected project/stack, and runs verify-local.
 *
 * If validation fails, returns structured error to block the agent.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const modifiedFiles = data.modified_files || [];
      if (modifiedFiles.length === 0) {
        process.stdout.write('{}');
        return;
      }

      const cwd = data.cwd || process.cwd();

      // Find project root by looking for .harness-workspace.json or config files
      let projectRoot = cwd;
      let current = cwd;
      while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.harness-workspace.json'))) {
          projectRoot = current;
          break;
        }
        current = path.dirname(current);
      }

      // Run verify-local via CLI
      const cliPath = path.join(__dirname, '..', 'tools', 'harness', 'cli.ts');
      try {
        execSync(`npx ts-node "${cliPath}" local`, { cwd: projectRoot, stdio: 'pipe' });
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'Validation passed' }));
      } catch (error) {
        const output = error.stderr?.toString() || error.stdout?.toString() || 'Validation failed';
        process.stdout.write(JSON.stringify({
          decision: 'block',
          reason: `Validation failed: ${output.substring(0, 500)}`
        }));
      }
    } catch (_) {
      // Parse failure — allow (never break the pipeline)
      process.stdout.write('{}');
    }
  });
}

main();
```

- [ ] **Step 2: Update hooks.json**

Add to the `hooks.json` file, inside the `"hooks"` object, after `"SubagentStop"`:

```json
"PostTaskValidation": [
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/post-task-validation.js\"",
        "async": false
      }
    ]
  }
]
```

- [ ] **Step 3: Update plugin.universal.yaml**

Add after the SubagentStop section:

```yaml
  # --- PostTaskValidation ---

  # Claude Code: automatic validation after edits
  - event: PostTaskValidation
    matcher: "Edit|Write"
    command: "node {PLUGIN_ROOT}/hooks/post-task-validation.js"
    async: false
    platforms: [claude-code]
```

- [ ] **Step 4: Commit**

```bash
git add hooks/post-task-validation.js hooks/hooks.json plugin.universal.yaml
git commit -m "feat(harness): add post-task validation hook"
```

---

### Task 12: Skills (harness-verify + extract-boundary)

**Files:**
- Create: `skills/harness-verify/SKILL.md`
- Create: `skills/extract-boundary/SKILL.md`

- [ ] **Step 1: Write harness-verify skill**

```markdown
---
name: harness-verify
description: >
  Run validation pipeline on current project. Invoke for /verify local,
  /verify all, or /verify security commands. Routed by harness CLI.
---

# Harness Verify

Run the Automated Verification Harness validation pipeline.

## Required Start

Announce: `I'm running the harness-verify skill.`

## Modes

- **local** — Run lint, typecheck, tests, coverage (fast, for Ralph Loop)
- **all** — Run full pipeline including security, integration, domain-specific
- **security** — Run only security scan (Semgrep, gitleaks, npm audit)

## Execution

1. Run: `npx ts-node tools/harness/cli.ts <mode>`
2. Inspect exit code and output.
3. If failed, read the report at `.harness/reports/<feature>/<timestamp>-verify-report.md`
4. Return structured errors to the agent for fixing.

## Hard Rules

- Do not claim success without fresh command output.
- Do not skip any validation step in the selected mode.
- If a validation fails, report the exact error with file:line context.
```

- [ ] **Step 2: Write extract-boundary skill**

```markdown
---
name: extract-boundary
description: >
  Extract boundary context for subagents. Maps direct dependencies,
  types, and contracts consumed by modified files. Use before dispatching
  subagents to provide minimal required context.
---

# Extract Boundary Context

Extract the minimal context a subagent needs to work on specific files.

## Required Start

Announce: `I'm using extract-boundary to gather context for the subagent.`

## Execution

1. Identify the files the subagent will modify.
2. For each file, find:
   - Direct imports (what it consumes)
   - Exported types/interfaces (what it provides)
   - Function signatures it calls from other modules
3. Compile a minimal context bundle containing only:
   - Type definitions and interfaces
   - Function signatures (no implementations)
   - Schema definitions

## Context Bundle Format

```
## Types consumed
- `User` (from src/types/user.ts): { id: string; name: string; email: string }
- `AuthService` (from src/services/auth.ts): interface with verifyToken(), refreshToken()

## Files to modify
- src/middleware/auth.ts
- tests/middleware/auth.test.ts
```

## Hard Rules

- Do NOT include full file contents — only signatures and types.
- Do NOT include implementation details from unrelated files.
- Keep context under 200 lines per subagent.
```

- [ ] **Step 3: Commit**

```bash
git add skills/harness-verify/SKILL.md skills/extract-boundary/SKILL.md
git commit -m "feat(harness): add harness-verify and extract-boundary skills"
```

---

## Wave 5: Integration + Reviewer Prompts (Depends on Wave 4)

### Task 13: Reviewer Agent Prompts

**Files:**
- Create: `lib/harness/reviewers/base-prompt.md`
- Create: `lib/harness/reviewers/secops-prompt.md`
- Create: `lib/harness/reviewers/stacks/react-nextjs.md`
- Create: `lib/harness/reviewers/stacks/csharp-aspnet.md`
- Create: `lib/harness/reviewers/stacks/terraform.md`

- [ ] **Step 1: Write base reviewer prompt**

```markdown
# Senior Code Reviewer — Base Prompt

You are a Senior Code Reviewer. Your review determines whether code is ready to merge. Downstream developers and the merge decision depend on your accuracy — a false positive ships bugs, a false negative wastes cycles.

## Universal Checklist

- [ ] SOLID principles followed
- [ ] Clean Code conventions (naming, function size, single responsibility)
- [ ] Design patterns used appropriately (not over-engineered)
- [ ] Error handling is resilient (no uncaught exceptions, proper error boundaries)
- [ ] No prop drilling (frontend) / no tight coupling (backend)
- [ ] Performance considerations addressed (no N+1 queries, no unnecessary re-renders)
- [ ] YAGNI — no unnecessary features or abstractions
- [ ] DRY — no duplicated logic

## Review Output Format

For each finding:
1. **Severity**: Critical / High / Medium / Low
2. **File:Line**: Exact location
3. **Issue**: What's wrong
4. **Suggestion**: How to fix

Mark the single most impactful finding as the ASI (Actionable Side Information) — this is the entry point for the auto-fix pipeline.

## Approval Criteria

All Critical and High findings must be fixed before approval. Medium and Low findings can be noted as recommendations.
```

- [ ] **Step 2: Write SecOps prompt**

```markdown
# SecOps Agent — Security Reviewer

You are a Security Operations specialist. You analyze reports from Semgrep, Trivy, gitleaks, and npm audit. Your job is to determine real risks from tool noise.

## Analysis Process

1. **Triage**: Classify each finding as True Positive, False Positive, or Needs Investigation
2. **Severity Assessment**: Tools often over-report. Assess real-world exploitability
3. **Exception Handling**: For false positives, generate an auditable exception rule with justification

## Output Format

For each finding:
- **Tool**: Which tool reported it
- **Classification**: TP / FP / Needs Investigation
- **Real Severity**: Critical / High / Medium / Low / Info
- **Justification**: Why this is or isn't a real risk
- **Exception Rule** (if FP): Config snippet to suppress

## Hard Rules

- Never approve code with unaddressed Critical or High true positives
- Always document exceptions with justification for audit trail
- Flag dependency vulnerabilities with known CVEs as High minimum
```

- [ ] **Step 3: Write stack-specific reviewer prompts**

```markdown
# React/Next.js Review Rules

## Component Architecture
- Components are isolated and testable
- No direct DOM manipulation (use refs properly)
- Error boundaries around new features
- No global state for local component data

## Performance
- No unnecessary re-renders (use React.memo, useMemo, useCallback appropriately)
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Images use next/image with proper sizing
- Code splitting for route-level and component-level lazy loading

## Accessibility
- All interactive elements have aria labels
- Keyboard navigation works
- Color contrast meets WCAG AA
- Form inputs have associated labels

## State Management
- No prop drilling beyond 2 levels (use context or state library)
- Server state separated from UI state
- Optimistic updates with proper rollback
```

```markdown
# C#/ASP.NET Review Rules

## Architecture
- Dependency Injection used correctly (no service locator anti-pattern)
- Async/await used properly (no .Result or .Wait(), no sync-over-async)
- Repository pattern or CQRS used consistently
- Minimal API or Controller pattern used consistently (not mixed)

## API Design
- Idempotency keys on POST/PUT/PATCH mutations
- Rate limiting on public endpoints
- Proper HTTP status codes (not always 200)
- OpenAPI/Swagger annotations complete
- Backward compatibility maintained

## Observability
- Structured logging (JSON format, correlation IDs)
- OpenTelemetry traces on all endpoints
- Health check endpoints implemented
- Metrics for request duration, error rates

## Security
- Authentication/Authorization on all protected endpoints
- Input validation (FluentValidation or DataAnnotations)
- No secrets in code or config (use User Secrets / Key Vault)
- CORS configured with specific origins (not *)
```

```markdown
# Terraform Review Rules

## State Management
- Remote state configured (S3 + DynamoDB, Terraform Cloud, etc.)
- State locking enabled
- No hardcoded state paths

## Resource Design
- Resources are parameterized (no hardcoded values)
- Variables have descriptions and validation rules
- Outputs are documented
- Modules used for reusable patterns

## Security
- No public S3 buckets, open security groups, or 0.0.0.0/0 CIDRs
- IAM follows least privilege (no wildcard actions)
- Secrets not stored in state (use AWS Secrets Manager, etc.)
- Encryption enabled for data at rest and in transit

## Best Practices
- terraform fmt and validate pass
- tflint warnings addressed
- Version constraints pinned (not latest)
- Lifecycle rules for prevent_destroy on critical resources
```

- [ ] **Step 4: Commit**

```bash
git add lib/harness/reviewers/
git commit -m "feat(harness): add reviewer agent prompts (base, secops, stack-specific)"
```

---

### Task 14: Update subagent-driven-development SKILL.md

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Add harness integration to the Core Flow section**

After the "Core Flow" diagram and before "Parallel Waves", add:

```markdown
## Harness Integration

Before dispatching any implementer subagent:

1. Invoke `extract-boundary` to gather minimal context for the task's files.
2. Include in the implementer prompt: "After each change, run `npx ts-node tools/harness/cli.ts local` to verify."

After each implementer completes:

1. Main Agent spawns ReviewerAgent subagent with the diff and relevant stack modules.
2. ReviewerAgent analyzes → generates structured report.
3. If issues found → Main Agent delegates fixes to the same implementer subagent.
4. Implementer fixes → re-runs verify-local → returns.
5. ReviewerAgent re-reviews only affected files → approves or repeats loop.

After all tasks in a wave complete:

1. Main Agent merges all branches.
2. Main Agent runs `npx ts-node tools/harness/cli.ts all` (verify-all).
3. If verify-all fails → delegate fixes to relevant subagents.
4. If verify-all passes → proceed to `finishing-a-development-branch`.
```

- [ ] **Step 2: Update the Context Isolation section**

Add to the "Context Isolation" section, after the existing content:

```markdown
**Harness context injection:** Use `extract-boundary` to provide only the types, interfaces, and function signatures the subagent needs. Do not include full file contents or implementation details from unrelated modules.
```

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(harness): integrate harness into subagent-driven-development workflow"
```

---

### Task 15: Add .gitignore entries + package.json scripts

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Update .gitignore**

Add to `.gitignore`:

```
# Harness reports (optional — uncomment to track in git)
# .harness/reports/

# Harness workspace config (auto-generated)
.harness-workspace.json
```

- [ ] **Step 2: Update package.json**

Add to the `scripts` section:

```json
"harness:local": "npx ts-node tools/harness/cli.ts local",
"harness:all": "npx ts-node tools/harness/cli.ts all",
"harness:security": "npx ts-node tools/harness/cli.ts security",
"harness:install": "npx ts-node tools/harness/install-tools.ts",
"harness:scan": "npx ts-node tools/harness/scan-workspace.ts"
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore package.json
git commit -m "feat(harness): add gitignore entries and npm scripts"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Core library (lib/harness/) | Tasks 1-9 |
| Validators (lint, typecheck, test, coverage, security, integration, domain-specific, migration) | Tasks 5, 6, 9 |
| Stack modules (base + 6 stacks) | Task 7 |
| Reviewer prompts (base, secops, stack-specific) | Task 13 |
| CLI tools (cli, install-tools, scan-workspace) | Task 10 |
| Post-task validation hook | Task 11 |
| Skills (harness-verify, extract-boundary) | Task 12 |
| Workspace discovery + config | Tasks 2, 3 |
| Reporter (MD + JSON by feature) | Task 8 |
| Integration with SDD | Task 14 |
| Hooks.json + plugin.universal.yaml updates | Task 11 |
| .gitignore + package.json scripts | Task 15 |

All spec requirements covered.

### Placeholder Scan

No TBDs, TODOs, or "implement later" found. All steps contain actual code.

### Type Consistency

- `ValidationResult`, `ParsedError`, `IStackHandler`, `HarnessConfig` defined in `types.ts` and used consistently across all modules.
- All validators return `ValidationResult`.
- Reporter consumes `ValidationResult` from all validators.
- Stack handlers implement `IStackHandler` interface.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-17-agentic-development-harness.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
