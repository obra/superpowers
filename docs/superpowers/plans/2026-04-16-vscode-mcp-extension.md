# VS Code MCP Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that bundles and runs an MCP (Model Context Protocol) server exposing all Superpowers skills as Tools, Resources, and Prompts — compatible with GitHub Copilot Agent Mode, Cline, Roo Code, and any MCP client.

**Architecture:** A thin VS Code extension host (`extension.ts`) registers an MCP server definition using `vscode.lm.registerMcpServerDefinitionProvider`. VS Code launches the MCP server as a child process over stdio. The server is implemented using `@modelcontextprotocol/sdk`, reads bundled skill Markdown files, and returns them via MCP Tools (`activate_skill`, `list_skills`), Resources (`superpowers://skills/*`), and Prompts (`brainstorm`, `debug`, `tdd`, `plan`, `review`).

**Tech Stack:** TypeScript, Node.js 24, `@modelcontextprotocol/sdk`, `esbuild` (bundler), `vitest` (tests), VS Code Extension API (`vscode.lm.registerMcpServerDefinitionProvider`, `vscode.McpStdioServerDefinition`)

---

## Phase Overview

| Phase | What ships | Can be tested independently |
|---|---|---|
| **Phase 1** | Extension scaffold + build system | Yes — `F5` loads extension host |
| **Phase 2** | Skill loader (reads + parses skill files) | Yes — unit tests |
| **Phase 3** | MCP server with Tools | Yes — MCP Inspector |
| **Phase 4** | MCP server Resources | Yes — MCP Inspector |
| **Phase 5** | MCP server Prompts | Yes — MCP Inspector |
| **Phase 6** | VS Code extension host wires up MCP server | Yes — Copilot Agent Mode |
| **Phase 7** | Standalone CLI + npm package | Yes — `npx superpowers-mcp` |
| **Phase 8** | Docs, README, version bump integration | Yes — manual review |

---

## Phase 1: Scaffold & Build System

**Goal:** Create the `.vscode-extension/` directory with TypeScript project, dual-target esbuild build (extension host + MCP server), and vitest test runner. Running `npm run build` should produce `dist/extension.js` and `dist/server.js`.

**Files:**
- Create: `.vscode-extension/package.json`
- Create: `.vscode-extension/tsconfig.json`
- Create: `.vscode-extension/esbuild.js`
- Create: `.vscode-extension/.vscodeignore`
- Create: `.vscode-extension/.gitignore`
- Create: `.vscode-extension/src/extension.ts` (stub)
- Create: `.vscode-extension/src/server.ts` (stub)
- Create: `.vscode-extension/tests/placeholder.test.ts`

---

### Task 1.1: Create `package.json`

**Files:**
- Create: `.vscode-extension/package.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "superpowers-mcp",
  "displayName": "Superpowers",
  "description": "Development workflow skills for any AI agent via MCP: TDD, debugging, brainstorming, planning, and code review",
  "version": "5.0.7",
  "publisher": "obra",
  "license": "MIT",
  "repository": "https://github.com/obra/superpowers",
  "homepage": "https://github.com/obra/superpowers",
  "engines": {
    "vscode": "^1.99.0",
    "node": ">=20.0.0"
  },
  "categories": ["AI", "Chat"],
  "keywords": ["mcp", "skills", "tdd", "debugging", "brainstorming", "copilot", "cline"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "mcpServerDefinitionProviders": [
      {
        "id": "superpowers-mcp.provider",
        "label": "Superpowers Skills"
      }
    ],
    "commands": [
      {
        "command": "superpowers.listSkills",
        "title": "Superpowers: List Available Skills"
      }
    ]
  },
  "scripts": {
    "build": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "package": "npm run build && vsce package --no-dependencies",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.11.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/vscode": "^1.99.0",
    "@vscode/vsce": "^3.0.0",
    "esbuild": "^0.25.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Verify the file was created**

```bash
cat .vscode-extension/package.json
```

Expected: JSON printed without error.

---

### Task 1.2: Create `tsconfig.json`

**Files:**
- Create: `.vscode-extension/tsconfig.json`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

### Task 1.3: Create `esbuild.js` (dual-target bundler)

**Files:**
- Create: `.vscode-extension/esbuild.js`

- [ ] **Step 1: Create `esbuild.js`**

```javascript
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const watch = process.argv.includes('--watch');

// Copy skills directory into extension bundle
function copySkills() {
  const src = path.join(__dirname, '..', 'skills');
  const dest = path.join(__dirname, 'skills');
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log('[skills] Copied skills/ -> .vscode-extension/skills/');
}

// Shared options
const commonOptions = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
};

async function build() {
  copySkills();

  // Build 1: VS Code extension host
  // external: 'vscode' is required — VS Code provides this module at runtime
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
  });

  // Build 2: Standalone MCP server (no 'vscode' dependency)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/server.ts'],
    outfile: 'dist/server.js',
    format: 'esm',
  });

  console.log('[build] Done.');
}

if (watch) {
  // Watch mode: rebuild on changes
  Promise.all([
    esbuild.context({
      ...commonOptions,
      entryPoints: ['src/extension.ts'],
      outfile: 'dist/extension.js',
      external: ['vscode'],
      format: 'cjs',
    }).then(ctx => ctx.watch()),
    esbuild.context({
      ...commonOptions,
      entryPoints: ['src/server.ts'],
      outfile: 'dist/server.js',
      format: 'esm',
    }).then(ctx => ctx.watch()),
  ]).then(() => {
    copySkills();
    console.log('[watch] Watching for changes...');
  });
} else {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
```

---

### Task 1.4: Create `.vscodeignore` and `.gitignore`

**Files:**
- Create: `.vscode-extension/.vscodeignore`
- Create: `.vscode-extension/.gitignore`

- [ ] **Step 1: Create `.vscodeignore`**

```
src/
tests/
esbuild.js
tsconfig.json
node_modules/
.gitignore
*.map
```

- [ ] **Step 2: Create `.gitignore`**

```
dist/
node_modules/
skills/
*.vsix
```

Note: `skills/` is gitignored because it is copied at build time from the root `skills/` directory. The source of truth is always `../skills/`.

---

### Task 1.5: Create stub source files

**Files:**
- Create: `.vscode-extension/src/extension.ts`
- Create: `.vscode-extension/src/server.ts`
- Create: `.vscode-extension/tests/placeholder.test.ts`

- [ ] **Step 1: Create stub `extension.ts`**

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  console.log('Superpowers MCP extension activating...');
}

export function deactivate(): void {}
```

- [ ] **Step 2: Create stub `server.ts`**

```typescript
// MCP Server entry point — will be filled in Phase 3
console.log('Superpowers MCP server starting...');
```

- [ ] **Step 3: Create placeholder test**

```typescript
import { describe, it, expect } from 'vitest';

describe('placeholder', () => {
  it('passes', () => {
    expect(true).toBe(true);
  });
});
```

---

### Task 1.6: Add `vitest.config.ts`

**Files:**
- Create: `.vscode-extension/vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

---

### Task 1.7: Install dependencies and verify build

**Files:** (none — install + run)

- [ ] **Step 1: Install dependencies**

```bash
cd .vscode-extension && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 2: Run build**

```bash
cd .vscode-extension && npm run build
```

Expected output:
```
[skills] Copied skills/ -> .vscode-extension/skills/
[build] Done.
```
And `dist/extension.js` + `dist/server.js` both exist.

- [ ] **Step 3: Run tests**

```bash
cd .vscode-extension && npm test
```

Expected: `1 test passed`.

- [ ] **Step 4: Commit**

```bash
git add .vscode-extension/
git commit -m "feat(vscode-mcp): Phase 1 — scaffold, build system, stub sources"
```

---

## Phase 2: Skill Loader

**Goal:** Implement `src/mcp/skillLoader.ts` — a module that reads bundled skill directories, parses YAML frontmatter, and returns skill content. Fully unit-tested before any MCP code is written.

**Files:**
- Create: `.vscode-extension/src/mcp/skillLoader.ts`
- Create: `.vscode-extension/tests/skillLoader.test.ts`

---

### Task 2.1: Write failing tests for `skillLoader`

**Files:**
- Create: `.vscode-extension/tests/skillLoader.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { SkillLoader } from '../src/mcp/skillLoader';

// Point to the real skills directory (copied by build, or source for tests)
const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

let loader: SkillLoader;

beforeAll(() => {
  loader = new SkillLoader(SKILLS_DIR);
});

describe('SkillLoader.listSkills()', () => {
  it('returns a non-empty array', () => {
    const skills = loader.listSkills();
    expect(skills.length).toBeGreaterThan(0);
  });

  it('each skill has a name and description', () => {
    const skills = loader.listSkills();
    for (const skill of skills) {
      expect(skill.name, `skill ${skill.dirName} is missing name`).toBeTruthy();
      expect(skill.description, `skill ${skill.dirName} is missing description`).toBeTruthy();
      expect(skill.dirName, `skill entry missing dirName`).toBeTruthy();
    }
  });

  it('includes brainstorming skill', () => {
    const skills = loader.listSkills();
    const found = skills.find(s => s.dirName === 'brainstorming');
    expect(found).toBeDefined();
    expect(found!.name).toBe('brainstorming');
  });

  it('includes test-driven-development skill', () => {
    const skills = loader.listSkills();
    const found = skills.find(s => s.dirName === 'test-driven-development');
    expect(found).toBeDefined();
  });
});

describe('SkillLoader.loadSkill()', () => {
  it('returns content for a known skill', () => {
    const content = loader.loadSkill('brainstorming');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(100);
  });

  it('strips YAML frontmatter from content', () => {
    const content = loader.loadSkill('brainstorming');
    expect(content).not.toContain('---\nname:');
    expect(content).not.toMatch(/^---\n/);
  });

  it('throws on unknown skill name', () => {
    expect(() => loader.loadSkill('nonexistent-skill-xyz')).toThrow();
  });
});

describe('SkillLoader.loadBootstrap()', () => {
  it('returns using-superpowers content', () => {
    const content = loader.loadBootstrap();
    expect(content).toBeTruthy();
    expect(content).toContain('Superpowers');
  });
});

describe('SkillLoader.parseFrontmatter()', () => {
  it('extracts name and description', () => {
    const raw = `---\nname: my-skill\ndescription: "Does something"\n---\n\n# Body`;
    const result = loader.parseFrontmatter(raw);
    expect(result.frontmatter.name).toBe('my-skill');
    expect(result.frontmatter.description).toBe('Does something');
    expect(result.body).toContain('# Body');
  });

  it('handles content without frontmatter', () => {
    const raw = `# Just a heading\n\nSome content.`;
    const result = loader.parseFrontmatter(raw);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toContain('# Just a heading');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (RED)**

```bash
cd .vscode-extension && npm test
```

Expected: Fails with `Cannot find module '../src/mcp/skillLoader'`.

---

### Task 2.2: Implement `skillLoader.ts`

**Files:**
- Create: `.vscode-extension/src/mcp/skillLoader.ts`

- [ ] **Step 1: Create the skill loader**

```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface SkillMeta {
  dirName: string;
  name: string;
  description: string;
}

export interface ParsedSkill {
  frontmatter: Record<string, string>;
  body: string;
}

export class SkillLoader {
  private skillsDir: string;
  private cache: Map<string, string> = new Map();

  constructor(skillsDir: string) {
    if (!fs.existsSync(skillsDir)) {
      throw new Error(`Skills directory not found: ${skillsDir}`);
    }
    this.skillsDir = skillsDir;
  }

  /**
   * List all skills by scanning directories that contain a SKILL.md file.
   * Reads frontmatter for name and description.
   */
  listSkills(): SkillMeta[] {
    const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
    const skills: SkillMeta[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(this.skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillPath)) continue;

      const raw = fs.readFileSync(skillPath, 'utf8');
      const { frontmatter } = this.parseFrontmatter(raw);

      skills.push({
        dirName: entry.name,
        name: frontmatter.name || entry.name,
        description: frontmatter.description || '',
      });
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Load a skill's content by directory name.
   * Strips YAML frontmatter, returns the body.
   * Throws if the skill directory or SKILL.md does not exist.
   */
  loadSkill(dirName: string): string {
    const cached = this.cache.get(dirName);
    if (cached !== undefined) return cached;

    const skillPath = path.join(this.skillsDir, dirName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill not found: ${dirName} (looked in ${skillPath})`);
    }

    const raw = fs.readFileSync(skillPath, 'utf8');
    const { body } = this.parseFrontmatter(raw);
    this.cache.set(dirName, body);
    return body;
  }

  /**
   * Load the bootstrap context: using-superpowers skill content.
   */
  loadBootstrap(): string {
    return this.loadSkill('using-superpowers');
  }

  /**
   * Parse YAML frontmatter from a Markdown file.
   * Frontmatter is delimited by --- ... --- at the top.
   */
  parseFrontmatter(raw: string): ParsedSkill {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, body: raw };
    }

    const frontmatterStr = match[1];
    const body = match[2];
    const frontmatter: Record<string, string> = {};

    for (const line of frontmatterStr.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 1) continue;
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }

    return { frontmatter, body };
  }
}
```

- [ ] **Step 2: Run tests to verify they pass (GREEN)**

```bash
cd .vscode-extension && npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add .vscode-extension/src/mcp/skillLoader.ts .vscode-extension/tests/skillLoader.test.ts
git commit -m "feat(vscode-mcp): Phase 2 — SkillLoader with tests"
```

---

## Phase 3: MCP Tools

**Goal:** Implement `src/mcp/tools.ts` with two tools (`activate_skill`, `list_skills`) and wire them into the MCP server. Verify with MCP Inspector.

**Files:**
- Create: `.vscode-extension/src/mcp/tools.ts`
- Create: `.vscode-extension/src/mcp/toolMapping.ts`
- Modify: `.vscode-extension/src/server.ts`
- Create: `.vscode-extension/tests/tools.test.ts`

---

### Task 3.1: Create `toolMapping.ts`

**Files:**
- Create: `.vscode-extension/src/mcp/toolMapping.ts`

- [ ] **Step 1: Create the tool mapping module**

```typescript
/**
 * Returns a Markdown string that maps Claude Code tool names used in skills
 * to their VS Code / MCP equivalents.
 * This is appended to every skill response so the agent knows what to call.
 */
export function getVSCodeToolMapping(): string {
  return `
---

## VS Code / MCP Tool Mapping

When skills reference these tool names, use the VS Code/MCP equivalents:

| Skill references | VS Code / MCP equivalent |
|---|---|
| \`Read\` (file reading) | Read files from the workspace using your native tools |
| \`Write\` (file creation) | Create/edit workspace files using your native tools |
| \`Edit\` (file editing) | Apply edits to open files using your native tools |
| \`Bash\` (run commands) | Use the VS Code integrated terminal |
| \`Grep\` (search content) | Use VS Code workspace search |
| \`Glob\` (find files) | Use VS Code file search |
| \`TodoWrite\` (task tracking) | Output numbered task lists in Markdown |
| \`Skill\` tool (invoke skill) | Call the \`activate_skill\` MCP tool |
| \`Task\` (subagent dispatch) | Not available — execute tasks sequentially |
`.trim();
}
```

---

### Task 3.2: Write failing tests for tools

**Files:**
- Create: `.vscode-extension/tests/tools.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { buildActivateSkillHandler, buildListSkillsHandler } from '../src/mcp/tools';
import { SkillLoader } from '../src/mcp/skillLoader';

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const loader = new SkillLoader(SKILLS_DIR);

describe('activate_skill handler', () => {
  const handler = buildActivateSkillHandler(loader);

  it('returns skill content for a valid skill name', async () => {
    const result = await handler({ skillName: 'brainstorming' });
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Brainstorm');
  });

  it('appends VS Code tool mapping to response', async () => {
    const result = await handler({ skillName: 'brainstorming' });
    expect(result.content[0].text).toContain('VS Code / MCP Tool Mapping');
  });

  it('returns isError true for unknown skill', async () => {
    const result = await handler({ skillName: 'nonexistent-xyz' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });
});

describe('list_skills handler', () => {
  const handler = buildListSkillsHandler(loader);

  it('returns a list of skills', async () => {
    const result = await handler({});
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('brainstorming');
    expect(result.content[0].text).toContain('test-driven-development');
  });

  it('includes descriptions', async () => {
    const result = await handler({});
    expect(result.content[0].text).toContain('**');
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

```bash
cd .vscode-extension && npm test
```

Expected: Fails with `Cannot find module '..src/mcp/tools'`.

---

### Task 3.3: Implement `tools.ts`

**Files:**
- Create: `.vscode-extension/src/mcp/tools.ts`

- [ ] **Step 1: Create `tools.ts`**

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SkillLoader } from './skillLoader.js';
import { getVSCodeToolMapping } from './toolMapping.js';

// Exported for testing — pure handler functions with no MCP dependency
export function buildActivateSkillHandler(loader: SkillLoader) {
  return async (input: { skillName: string }) => {
    try {
      const body = loader.loadSkill(input.skillName);
      const mapping = getVSCodeToolMapping();
      return {
        content: [{
          type: 'text' as const,
          text: `# Skill: ${input.skillName}\n\n${body}\n\n${mapping}`,
        }],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{
          type: 'text' as const,
          text: `Skill not found: "${input.skillName}". ${message}\n\nUse list_skills to see available skills.`,
        }],
      };
    }
  };
}

export function buildListSkillsHandler(loader: SkillLoader) {
  return async (_input: Record<string, never>) => {
    const skills = loader.listSkills();
    const lines = skills.map(s => `- **${s.name}** (\`${s.dirName}\`): ${s.description}`);
    return {
      content: [{
        type: 'text' as const,
        text: `# Available Superpowers Skills\n\n${lines.join('\n')}\n\nUse \`activate_skill\` with the name in backticks to load a skill.`,
      }],
    };
  };
}

/** Register all Superpowers tools on an MCP server instance. */
export function registerTools(server: McpServer, loader: SkillLoader): void {
  const activateHandler = buildActivateSkillHandler(loader);
  const listHandler = buildListSkillsHandler(loader);

  server.tool(
    'activate_skill',
    'Load and activate a Superpowers development workflow skill. Returns the full skill content that you MUST follow. ' +
    'Available skills: brainstorming, test-driven-development, systematic-debugging, writing-plans, executing-plans, ' +
    'requesting-code-review, receiving-code-review, verification-before-completion, using-git-worktrees, ' +
    'finishing-a-development-branch, subagent-driven-development, dispatching-parallel-agents, writing-skills.',
    { skillName: z.string().describe('Name of the skill directory (e.g., "brainstorming", "test-driven-development")') },
    activateHandler,
  );

  server.tool(
    'list_skills',
    'List all available Superpowers development workflow skills with their names and descriptions.',
    {},
    listHandler,
  );
}
```

- [ ] **Step 2: Run tests (GREEN)**

```bash
cd .vscode-extension && npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add .vscode-extension/src/mcp/tools.ts .vscode-extension/src/mcp/toolMapping.ts .vscode-extension/tests/tools.test.ts
git commit -m "feat(vscode-mcp): Phase 3 — MCP tools (activate_skill, list_skills)"
```

---

### Task 3.4: Wire tools into the MCP server and verify with MCP Inspector

**Files:**
- Modify: `.vscode-extension/src/server.ts`

- [ ] **Step 1: Replace stub `server.ts` with real implementation**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'path';
import * as url from 'url';
import { SkillLoader } from './mcp/skillLoader.js';
import { registerTools } from './mcp/tools.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// SUPERPOWERS_SKILLS_DIR is set by the VS Code extension host.
// Fall back to adjacent skills/ directory for standalone/testing use.
const skillsDir = process.env['SUPERPOWERS_SKILLS_DIR'] ??
  path.join(__dirname, '..', 'skills');

const loader = new SkillLoader(skillsDir);

const server = new McpServer({
  name: 'superpowers',
  version: '5.0.7',
});

registerTools(server, loader);

// Resources and Prompts will be added in Phases 4 and 5.

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Build**

```bash
cd .vscode-extension && npm run build
```

Expected: `dist/server.js` created, no errors.

- [ ] **Step 3: Test server with MCP Inspector (install if needed)**

```bash
npx @modelcontextprotocol/inspector node .vscode-extension/dist/server.js
```

Expected: MCP Inspector opens in browser. In the Tools tab, `activate_skill` and `list_skills` are listed.

- [ ] **Step 4: Test `list_skills` in inspector**

In MCP Inspector: click `list_skills` → Execute. Expected: List of 14 skills printed.

- [ ] **Step 5: Test `activate_skill` in inspector**

In MCP Inspector: click `activate_skill` → set `skillName = "brainstorming"` → Execute.
Expected: Full brainstorming skill content + VS Code tool mapping returned.

- [ ] **Step 6: Commit**

```bash
git add .vscode-extension/src/server.ts
git commit -m "feat(vscode-mcp): Phase 3 — wire tools into MCP server"
```

---

## Phase 4: MCP Resources

**Goal:** Register each skill as a readable MCP Resource at `superpowers://skills/<name>` plus a `superpowers://bootstrap` resource.

**Files:**
- Create: `.vscode-extension/src/mcp/resources.ts`
- Create: `.vscode-extension/tests/resources.test.ts`
- Modify: `.vscode-extension/src/server.ts`

---

### Task 4.1: Write failing tests for resources

**Files:**
- Create: `.vscode-extension/tests/resources.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { buildBootstrapContent, buildSkillResourceContent } from '../src/mcp/resources';
import { SkillLoader } from '../src/mcp/skillLoader';

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const loader = new SkillLoader(SKILLS_DIR);

describe('buildBootstrapContent()', () => {
  it('returns a string containing superpowers content', () => {
    const content = buildBootstrapContent(loader);
    expect(content).toBeTruthy();
    expect(content).toContain('Superpowers');
  });

  it('includes VS Code tool mapping', () => {
    const content = buildBootstrapContent(loader);
    expect(content).toContain('VS Code / MCP Tool Mapping');
  });
});

describe('buildSkillResourceContent()', () => {
  it('returns skill content for brainstorming', () => {
    const content = buildSkillResourceContent(loader, 'brainstorming');
    expect(content).toContain('Brainstorm');
  });

  it('returns skill content for test-driven-development', () => {
    const content = buildSkillResourceContent(loader, 'test-driven-development');
    expect(content).toBeTruthy();
  });

  it('throws for unknown skill', () => {
    expect(() => buildSkillResourceContent(loader, 'nonexistent-xyz')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests (RED)**

```bash
cd .vscode-extension && npm test
```

Expected: Fails with `Cannot find module '..src/mcp/resources'`.

---

### Task 4.2: Implement `resources.ts`

**Files:**
- Create: `.vscode-extension/src/mcp/resources.ts`

- [ ] **Step 1: Create `resources.ts`**

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SkillLoader } from './skillLoader.js';
import { getVSCodeToolMapping } from './toolMapping.js';

// Exported for testing
export function buildBootstrapContent(loader: SkillLoader): string {
  const bootstrap = loader.loadBootstrap();
  const mapping = getVSCodeToolMapping();
  return `# Superpowers Bootstrap\n\n${bootstrap}\n\n${mapping}`;
}

// Exported for testing
export function buildSkillResourceContent(loader: SkillLoader, dirName: string): string {
  const body = loader.loadSkill(dirName);
  return body;
}

/** Register all skill Resources on an MCP server instance. */
export function registerResources(server: McpServer, loader: SkillLoader): void {
  // Bootstrap resource — the using-superpowers skill + tool mapping
  server.resource(
    'superpowers-bootstrap',
    'superpowers://bootstrap',
    {
      description: 'Core Superpowers bootstrap context. Read at session start to understand available skills and how to use them.',
      mimeType: 'text/markdown',
    },
    async (_uri) => ({
      contents: [{
        uri: 'superpowers://bootstrap',
        mimeType: 'text/markdown',
        text: buildBootstrapContent(loader),
      }],
    }),
  );

  // One resource per skill
  const skills = loader.listSkills();
  for (const skill of skills) {
    const uri = `superpowers://skills/${skill.dirName}`;

    server.resource(
      `superpowers-skill-${skill.dirName}`,
      uri,
      {
        description: skill.description || `Superpowers skill: ${skill.name}`,
        mimeType: 'text/markdown',
      },
      async (_uri) => ({
        contents: [{
          uri,
          mimeType: 'text/markdown',
          text: buildSkillResourceContent(loader, skill.dirName),
        }],
      }),
    );
  }
}
```

- [ ] **Step 2: Run tests (GREEN)**

```bash
cd .vscode-extension && npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add .vscode-extension/src/mcp/resources.ts .vscode-extension/tests/resources.test.ts
git commit -m "feat(vscode-mcp): Phase 4 — MCP resources"
```

---

### Task 4.3: Wire resources into server and verify

**Files:**
- Modify: `.vscode-extension/src/server.ts`

- [ ] **Step 1: Add `registerResources` to `server.ts`**

Add these lines after `registerTools(server, loader);`:

```typescript
import { registerResources } from './mcp/resources.js';
// ...
registerResources(server, loader);
```

Full updated `server.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'path';
import * as url from 'url';
import { SkillLoader } from './mcp/skillLoader.js';
import { registerTools } from './mcp/tools.js';
import { registerResources } from './mcp/resources.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const skillsDir = process.env['SUPERPOWERS_SKILLS_DIR'] ??
  path.join(__dirname, '..', 'skills');

const loader = new SkillLoader(skillsDir);

const server = new McpServer({
  name: 'superpowers',
  version: '5.0.7',
});

registerTools(server, loader);
registerResources(server, loader);

// Prompts will be added in Phase 5.

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Build and verify in MCP Inspector**

```bash
cd .vscode-extension && npm run build
npx @modelcontextprotocol/inspector node .vscode-extension/dist/server.js
```

In MCP Inspector → Resources tab: verify `superpowers://bootstrap` and 14 `superpowers://skills/*` URIs appear.

- [ ] **Step 3: Commit**

```bash
git add .vscode-extension/src/server.ts
git commit -m "feat(vscode-mcp): Phase 4 — wire resources into server"
```

---

## Phase 5: MCP Prompts

**Goal:** Register five pre-built prompt templates (`brainstorm`, `debug`, `tdd`, `plan`, `review`) that kickstart specific workflows.

**Files:**
- Create: `.vscode-extension/src/mcp/prompts.ts`
- Create: `.vscode-extension/tests/prompts.test.ts`
- Modify: `.vscode-extension/src/server.ts`

---

### Task 5.1: Write failing tests for prompts

**Files:**
- Create: `.vscode-extension/tests/prompts.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { buildPrompt } from '../src/mcp/prompts';
import { SkillLoader } from '../src/mcp/skillLoader';

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const loader = new SkillLoader(SKILLS_DIR);

describe('buildPrompt()', () => {
  it('brainstorm prompt includes skill content and user topic', () => {
    const result = buildPrompt(loader, 'brainstorm', { topic: 'a login page' });
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.text).toContain('brainstorming');
    expect(result.messages[1].role).toBe('user');
    expect(result.messages[1].content.text).toContain('a login page');
  });

  it('debug prompt includes systematic-debugging skill content', () => {
    const result = buildPrompt(loader, 'debug', { issue: 'null pointer on line 42' });
    expect(result.messages[0].content.text).toContain('debugging');
    expect(result.messages[1].content.text).toContain('null pointer');
  });

  it('tdd prompt includes test-driven-development skill content', () => {
    const result = buildPrompt(loader, 'tdd', { feature: 'user registration' });
    expect(result.messages[0].content.text).toBeTruthy();
  });

  it('plan prompt includes writing-plans skill content', () => {
    const result = buildPrompt(loader, 'plan', { design: 'the auth module design doc' });
    expect(result.messages[0].content.text).toBeTruthy();
  });

  it('review prompt includes requesting-code-review skill content', () => {
    const result = buildPrompt(loader, 'review', { context: 'completed task 3' });
    expect(result.messages[0].content.text).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run (RED)**

```bash
cd .vscode-extension && npm test
```

Expected: Fails with `Cannot find module '..src/mcp/prompts'`.

---

### Task 5.2: Implement `prompts.ts`

**Files:**
- Create: `.vscode-extension/src/mcp/prompts.ts`

- [ ] **Step 1: Create `prompts.ts`**

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SkillLoader } from './skillLoader.js';
import { getVSCodeToolMapping } from './toolMapping.js';

type PromptName = 'brainstorm' | 'debug' | 'tdd' | 'plan' | 'review';

interface PromptArgs {
  topic?: string;
  issue?: string;
  feature?: string;
  design?: string;
  context?: string;
}

interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

interface PromptResult {
  messages: PromptMessage[];
}

// Exported for unit testing
export function buildPrompt(
  loader: SkillLoader,
  name: PromptName,
  args: PromptArgs,
): PromptResult {
  const mapping = getVSCodeToolMapping();

  const skillMap: Record<PromptName, string> = {
    brainstorm: 'brainstorming',
    debug: 'systematic-debugging',
    tdd: 'test-driven-development',
    plan: 'writing-plans',
    review: 'requesting-code-review',
  };

  const skillContent = loader.loadSkill(skillMap[name]);
  const systemText = `${skillContent}\n\n${mapping}`;

  const userTextMap: Record<PromptName, string> = {
    brainstorm: `I want to brainstorm: ${args.topic ?? '(describe your feature or idea)'}`,
    debug: `I need to debug: ${args.issue ?? '(describe the bug or unexpected behavior)'}`,
    tdd: `Let's use TDD to build: ${args.feature ?? '(describe the feature or component)'}`,
    plan: `Create an implementation plan for: ${args.design ?? '(paste your design or describe what to build)'}`,
    review: `Please review my code. Context: ${args.context ?? '(describe what you implemented or which task you completed)'}`,
  };

  return {
    messages: [
      { role: 'user', content: { type: 'text', text: systemText } },
      { role: 'user', content: { type: 'text', text: userTextMap[name] } },
    ],
  };
}

/** Register all Superpowers prompt templates on an MCP server instance. */
export function registerPrompts(server: McpServer, loader: SkillLoader): void {
  server.prompt(
    'brainstorm',
    'Start a Superpowers brainstorming session to design a feature before writing code',
    { topic: z.string().describe('What you want to brainstorm (e.g., "a user authentication system")').optional() },
    (args) => buildPrompt(loader, 'brainstorm', args),
  );

  server.prompt(
    'debug',
    'Start a systematic 4-phase debugging session using the Superpowers systematic-debugging skill',
    { issue: z.string().describe('Description of the bug or unexpected behavior').optional() },
    (args) => buildPrompt(loader, 'debug', args),
  );

  server.prompt(
    'tdd',
    'Start a test-driven development session — RED → GREEN → REFACTOR cycle',
    { feature: z.string().describe('The feature or component to build with TDD').optional() },
    (args) => buildPrompt(loader, 'tdd', args),
  );

  server.prompt(
    'plan',
    'Create a detailed step-by-step implementation plan from a design or specification',
    { design: z.string().describe('Your design document or description of what to build').optional() },
    (args) => buildPrompt(loader, 'plan', args),
  );

  server.prompt(
    'review',
    'Request a code review against the original plan and coding standards',
    { context: z.string().describe('What you implemented — task name, description, or completed step').optional() },
    (args) => buildPrompt(loader, 'review', args),
  );
}
```

- [ ] **Step 2: Run tests (GREEN)**

```bash
cd .vscode-extension && npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add .vscode-extension/src/mcp/prompts.ts .vscode-extension/tests/prompts.test.ts
git commit -m "feat(vscode-mcp): Phase 5 — MCP prompts (brainstorm, debug, tdd, plan, review)"
```

---

### Task 5.3: Wire prompts into server

**Files:**
- Modify: `.vscode-extension/src/server.ts`

- [ ] **Step 1: Add `registerPrompts` to `server.ts`**

Final complete `server.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'path';
import * as url from 'url';
import { SkillLoader } from './mcp/skillLoader.js';
import { registerTools } from './mcp/tools.js';
import { registerResources } from './mcp/resources.js';
import { registerPrompts } from './mcp/prompts.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const skillsDir = process.env['SUPERPOWERS_SKILLS_DIR'] ??
  path.join(__dirname, '..', 'skills');

const loader = new SkillLoader(skillsDir);

const server = new McpServer({
  name: 'superpowers',
  version: '5.0.7',
});

registerTools(server, loader);
registerResources(server, loader);
registerPrompts(server, loader);

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Build and verify all three in MCP Inspector**

```bash
cd .vscode-extension && npm run build
npx @modelcontextprotocol/inspector node .vscode-extension/dist/server.js
```

Verify in MCP Inspector:
- **Tools tab**: `activate_skill`, `list_skills`
- **Resources tab**: `superpowers://bootstrap`, 14 `superpowers://skills/*` entries
- **Prompts tab**: `brainstorm`, `debug`, `tdd`, `plan`, `review`

- [ ] **Step 3: Commit**

```bash
git add .vscode-extension/src/server.ts
git commit -m "feat(vscode-mcp): Phase 5 — wire prompts into server, server complete"
```

---

## Phase 6: VS Code Extension Host

**Goal:** Implement the thin VS Code extension host that registers the MCP server via `vscode.lm.registerMcpServerDefinitionProvider`. After this phase, Copilot Agent Mode and other VS Code MCP clients discover and use the server automatically.

**Files:**
- Modify: `.vscode-extension/src/extension.ts`

---

### Task 6.1: Implement `extension.ts`

**Files:**
- Modify: `.vscode-extension/src/extension.ts`

- [ ] **Step 1: Replace stub with full implementation**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext): void {
  const serverPath = path.join(context.extensionPath, 'dist', 'server.js');
  const skillsDir = path.join(context.extensionPath, 'skills');

  const provider: vscode.McpServerDefinitionProvider = {
    provideMcpServerDefinitions: async () => {
      return [
        new vscode.McpStdioServerDefinition(
          'Superpowers Skills',   // Label shown in MCP server list
          'node',                  // Command
          [serverPath],            // Args
          {                        // Environment variables
            SUPERPOWERS_SKILLS_DIR: skillsDir,
          },
          '5.0.7',                 // Version
        ),
      ];
    },
    resolveMcpServerDefinition: async (server) => {
      // No dynamic resolution needed — return as-is
      return server;
    },
  };

  const disposable = vscode.lm.registerMcpServerDefinitionProvider(
    'superpowers-mcp.provider',
    provider,
  );

  // Command: list skills in output channel
  const listCommand = vscode.commands.registerCommand(
    'superpowers.listSkills',
    () => {
      const channel = vscode.window.createOutputChannel('Superpowers');
      channel.appendLine('Superpowers MCP server is running.');
      channel.appendLine(`Skills directory: ${skillsDir}`);
      channel.appendLine(`Server: ${serverPath}`);
      channel.show();
    },
  );

  context.subscriptions.push(disposable, listCommand);
}

export function deactivate(): void {}
```

- [ ] **Step 2: Build**

```bash
cd .vscode-extension && npm run build
```

Expected: `dist/extension.js` + `dist/server.js` both built without errors.

- [ ] **Step 3: Launch Extension Development Host**

Press `F5` in VS Code with `.vscode-extension/` as the workspace root, OR run:

```bash
code --extensionDevelopmentPath="$(pwd)/.vscode-extension"
```

Expected: A new VS Code window opens with "Superpowers MCP extension activating..." in the Debug Console.

- [ ] **Step 4: Verify MCP server in Copilot Agent Mode**

In the Extension Development Host:
1. Open Copilot Chat
2. Switch to Agent Mode
3. Click the tools icon — look for "Superpowers Skills" in the MCP servers list
4. Ask: "Use list_skills to show me available Superpowers skills"
5. Expected: Agent calls `list_skills`, returns the full list

- [ ] **Step 5: Verify `activate_skill` works end-to-end**

In Agent Mode chat:
`"I want to start a brainstorming session for a new feature. Use the activate_skill tool with brainstorming."`
Expected: Agent loads brainstorming skill content and begins the brainstorming workflow.

- [ ] **Step 6: Run command palette command**

`Ctrl+Shift+P` → "Superpowers: List Available Skills"
Expected: Output channel opens with server info.

- [ ] **Step 7: Commit**

```bash
git add .vscode-extension/src/extension.ts
git commit -m "feat(vscode-mcp): Phase 6 — VS Code extension host, registers MCP server"
```

---

## Phase 7: Standalone CLI + npm Package

**Goal:** Add a `bin/superpowers-mcp` CLI entry point so the server can be used outside VS Code (with `npx superpowers-mcp` or manually configured in any MCP client).

**Files:**
- Create: `.vscode-extension/bin/superpowers-mcp.js`
- Modify: `.vscode-extension/package.json` (add `bin` field)

---

### Task 7.1: Create CLI entry point

**Files:**
- Create: `.vscode-extension/bin/superpowers-mcp.js`

- [ ] **Step 1: Create the CLI wrapper**

```javascript
#!/usr/bin/env node
/**
 * Standalone CLI entry point for the Superpowers MCP server.
 * Usage: npx superpowers-mcp
 *        node ./bin/superpowers-mcp.js
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// If SUPERPOWERS_SKILLS_DIR is not set, use the skills/ directory
// adjacent to this binary (set by the package install location)
if (!process.env.SUPERPOWERS_SKILLS_DIR) {
  process.env.SUPERPOWERS_SKILLS_DIR = path.join(__dirname, '..', 'skills');
}

// Import and run the bundled server
await import(path.join(__dirname, '..', 'dist', 'server.js'));
```

- [ ] **Step 2: Add `bin` and `type` to `package.json`**

Add these fields to `.vscode-extension/package.json`:

```json
{
  "type": "module",
  "bin": {
    "superpowers-mcp": "./bin/superpowers-mcp.js"
  }
}
```

- [ ] **Step 3: Mark binary as executable (Linux/macOS)**

```bash
chmod +x .vscode-extension/bin/superpowers-mcp.js
```

- [ ] **Step 4: Build and test standalone**

```bash
cd .vscode-extension && npm run build
node bin/superpowers-mcp.js &
# In another terminal, test with inspector:
npx @modelcontextprotocol/inspector node bin/superpowers-mcp.js
```

Expected: MCP Inspector connects, shows same tools/resources/prompts as before.

- [ ] **Step 5: Test manual mcp.json config**

Create a test file `.vscode/mcp.json` in any workspace:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "node",
      "args": ["<absolute_path>/.vscode-extension/bin/superpowers-mcp.js"]
    }
  }
}
```

Open VS Code in that workspace → Copilot Agent Mode → verify "Superpowers Skills" server appears.

- [ ] **Step 6: Commit**

```bash
git add .vscode-extension/bin/ .vscode-extension/package.json
git commit -m "feat(vscode-mcp): Phase 7 — standalone CLI entry point"
```

---

## Phase 8: Documentation, Icon, and Version Integration

**Goal:** Add extension icon, marketplace README, VS Code-specific docs, update root README, and wire into version-bump system.

**Files:**
- Create: `.vscode-extension/icon.png` (128×128 SVG → PNG)
- Create: `.vscode-extension/README.md`
- Create: `docs/README.vscode.md`
- Modify: `README.md` (add VS Code section)
- Modify: `.version-bump.json` (add vscode-extension/package.json)

---

### Task 8.1: Add extension icon

**Files:**
- Create: `.vscode-extension/icon.png`

- [ ] **Step 1: Generate icon**

Create a 128×128 PNG icon for the extension. The image should use the Superpowers branding (lightning bolt / star symbol on dark background). Use any image tool or the generate_image tool to create this. Save as `.vscode-extension/icon.png`.

- [ ] **Step 2: Reference icon in `package.json`**

Add to `.vscode-extension/package.json`:

```json
{
  "icon": "icon.png"
}
```

---

### Task 8.2: Create Marketplace `README.md`

**Files:**
- Create: `.vscode-extension/README.md`

- [ ] **Step 1: Create the README**

```markdown
# Superpowers — Skills for Any AI Agent

**Superpowers** gives your AI coding agents structured development workflows: brainstorming, test-driven development, systematic debugging, implementation planning, and code review — via the **Model Context Protocol (MCP)**.

## Works With

- ✅ **GitHub Copilot** (Agent Mode)
- ✅ **Cline**
- ✅ **Roo Code**
- ✅ **Continue**
- ✅ Any MCP-compatible client

## Quickstart

1. Install this extension from the VS Code Marketplace
2. Open your AI agent (Copilot Agent Mode, Cline, etc.)
3. The **Superpowers Skills** MCP server is registered automatically

## Available Skills

| Use | Skill |
|---|---|
| Design before coding | `brainstorm` prompt or `activate_skill("brainstorming")` |
| Write implementation plan | `plan` prompt or `activate_skill("writing-plans")` |
| Debug systematically | `debug` prompt or `activate_skill("systematic-debugging")` |
| Test-driven development | `tdd` prompt or `activate_skill("test-driven-development")` |
| Code review | `review` prompt or `activate_skill("requesting-code-review")` |
| + 9 more | `list_skills` tool |

## MCP Tools

| Tool | Description |
|---|---|
| `activate_skill` | Load a skill by name. Returns full content the agent must follow. |
| `list_skills` | List all 14 available skills with descriptions. |

## MCP Resources

Each skill is also available as a readable resource:
- `superpowers://bootstrap` — Core bootstrap context
- `superpowers://skills/brainstorming`
- `superpowers://skills/test-driven-development`
- ... (14 skills total)

## MCP Prompts

Pre-built prompt templates to kickstart workflows:
- `brainstorm` — Brainstorm a feature
- `debug` — Debug an issue
- `tdd` — Start TDD
- `plan` — Write an implementation plan
- `review` — Request a code review

## Manual Configuration (without VS Code extension)

Add to `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

## Links

- [GitHub](https://github.com/obra/superpowers)
- [Discord](https://discord.gg/35wsABTejz)
- [Release Notes](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md)
```

---

### Task 8.3: Update root `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add VS Code section to Installation**

In `README.md`, after the "Gemini CLI" section (around line 100), add:

```markdown
### VS Code (via Marketplace)

Install from the VS Code Extensions Marketplace:

1. Open VS Code
2. Press `Ctrl+Shift+X` → search **"Superpowers"** → Install
3. Restart VS Code
4. The MCP server registers automatically in Copilot Agent Mode, Cline, Roo Code, and any MCP-compatible agent

**Manual configuration** — add to `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```
```

---

### Task 8.4: Update `.version-bump.json`

**Files:**
- Modify: `.version-bump.json`

- [ ] **Step 1: Add vscode-extension to version sync**

Update `.version-bump.json`:

```json
{
  "files": [
    { "path": "package.json", "field": "version" },
    { "path": ".claude-plugin/plugin.json", "field": "version" },
    { "path": ".cursor-plugin/plugin.json", "field": "version" },
    { "path": ".claude-plugin/marketplace.json", "field": "plugins.0.version" },
    { "path": "gemini-extension.json", "field": "version" },
    { "path": ".vscode-extension/package.json", "field": "version" }
  ],
  "audit": {
    "exclude": [
      "CHANGELOG.md",
      "RELEASE-NOTES.md",
      "node_modules",
      ".git",
      ".version-bump.json",
      "scripts/bump-version.sh"
    ]
  }
}
```

- [ ] **Step 2: Final build, test, package verification**

```bash
cd .vscode-extension && npm run build && npm test
```

Expected: Build succeeds, all tests pass.

```bash
cd .vscode-extension && npm run package
```

Expected: `.vsix` file created. e.g. `superpowers-mcp-5.0.7.vsix`.

- [ ] **Step 3: Install the .vsix in a clean VS Code window**

```bash
code --install-extension .vscode-extension/superpowers-mcp-5.0.7.vsix
```

Restart VS Code. Open Copilot Agent Mode → verify "Superpowers Skills" server appears without any manual configuration.

- [ ] **Step 4: Final commit**

```bash
git add README.md .version-bump.json .vscode-extension/
git commit -m "feat(vscode-mcp): Phase 8 — docs, icon, version integration, .vsix packaging"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| MCP Tools (activate_skill, list_skills) | Phase 3 |
| MCP Resources (superpowers://skills/*) | Phase 4 |
| MCP Prompts (brainstorm, debug, tdd, plan, review) | Phase 5 |
| VS Code extension host registration | Phase 6 |
| Skills bundled at build time | Task 1.3 (esbuild.js copySkills) |
| VS Code tool mapping in responses | Task 3.1 (toolMapping.ts) |
| Standalone CLI / npx | Phase 7 |
| Copilot Agent Mode compatibility | Phase 6 verification |
| Cline / Roo Code compatibility | Phase 7 verification |
| Extension icon + marketplace README | Phase 8 |
| Root README updated | Task 8.3 |
| Version bump integration | Task 8.4 |

**Placeholder scan:** No TBDs, all code is complete.

**Type consistency:** `SkillLoader` constructed in `server.ts` and passed to `registerTools`, `registerResources`, `registerPrompts` — all accept `SkillLoader`. `buildActivateSkillHandler` and `buildListSkillsHandler` exported from `tools.ts`, imported in `tools.test.ts`. All consistent.
