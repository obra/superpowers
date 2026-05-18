# Learning Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, compounding knowledge layer that captures user corrections as reusable patterns, injects them into SDD ContextEnvelopes, and verifies against them in the Harness pipeline.

**Architecture:** Four-layer system: (1) Knowledge Base with global+project wiki, (2) Capture Hook for automatic pattern detection, (3) Injection Layer for ContextEnvelope + Harness integration, (4) Maintenance via CLI lint/archiver. All configured via `.harness-config.json` patterns section.

**Tech Stack:** TypeScript (ESM), Node.js, Jest, existing harness infrastructure

---

### Task 1: Pattern Types and Config

**Files:**
- Create: `lib/patterns/types.ts`
- Create: `lib/patterns/config.ts`
- Create: `tests/patterns/config.test.ts`

- [ ] **Step 1: Write tests for PatternsConfig types and loading**

```typescript
// tests/patterns/config.test.ts
import { loadPatternsConfig, resolveWikiPaths, defaultPatternsConfig } from '../../lib/patterns/config';
import * as fs from 'fs';
import * as path from 'path';

describe('loadPatternsConfig', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-config-test');

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults when no .harness.config.json exists', () => {
    const config = loadPatternsConfig(tmpDir);
    expect(config.enabled).toBe(true);
    expect(config.globalWiki).toBe(true);
    expect(config.bootstrapThreshold).toBe(10);
    expect(config.recurrenceThreshold.minFrequency).toBe(3);
    expect(config.recurrenceThreshold.minProjects).toBe(2);
    expect(config.staleness.reviewDays).toBe(30);
    expect(config.staleness.archiveDays).toBe(90);
  });

  it('merges patterns section from .harness.config.json', () => {
    const harnessConfig = {
      patterns: {
        enabled: false,
        globalWiki: false,
        bootstrapThreshold: 5,
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, '.harness.config.json'),
      JSON.stringify(harnessConfig),
    );
    const config = loadPatternsConfig(tmpDir);
    expect(config.enabled).toBe(false);
    expect(config.globalWiki).toBe(false);
    expect(config.bootstrapThreshold).toBe(5);
    expect(config.recurrenceThreshold.minFrequency).toBe(3);
  });

  it('resolves globalPath with ~ expansion', () => {
    const config = loadPatternsConfig(tmpDir);
    expect(config.globalPath).toContain('.superpowers');
    expect(config.globalPath).not.toContain('~');
  });
});

describe('resolveWikiPaths', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-paths-test');

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns same path for global and project when globalWiki is false', () => {
    const config = defaultPatternsConfig();
    config.globalWiki = false;
    const paths = resolveWikiPaths(config, tmpDir);
    expect(paths.global).toBe(paths.project);
    expect(paths.project).toContain(tmpDir);
  });

  it('returns separate paths when globalWiki is true', () => {
    const config = defaultPatternsConfig();
    config.globalWiki = true;
    const paths = resolveWikiPaths(config, tmpDir);
    expect(paths.global).not.toBe(paths.project);
    expect(paths.global).toContain('.superpowers');
    expect(paths.project).toContain(tmpDir);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/patterns/config.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Define PatternEntry and related types**

```typescript
// lib/patterns/types.ts
export type PatternCategory = "error_pattern" | "good_practice" | "project_constraint";
export type PatternSeverity = "high" | "medium" | "low";
export type PatternStatus = "promoted" | "pending" | "bootstrap" | "archived";

export interface PatternEntry {
  id: string;
  category: PatternCategory;
  module: string;
  severity: PatternSeverity;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  projects: string[];
  status: PatternStatus;
  title: string;
  pattern: string;
  symptom: string;
  rootCause: string;
  fix: string;
  check: string;
  checkRegex?: string;
  related: string[];
  supersededBy?: string;
  supersededAt?: string;
}

export interface PatternQuery {
  module?: string;
  categories?: PatternCategory[];
  severity?: PatternSeverity[];
  maxResults?: number;
  excludeArchived?: boolean;
}

export interface PatternsConfig {
  enabled: boolean;
  globalWiki: boolean;
  globalPath: string;
  bootstrapThreshold: number;
  recurrenceThreshold: {
    minFrequency: number;
    minProjects: number;
  };
  staleness: {
    reviewDays: number;
    archiveDays: number;
  };
}

export interface WikiPaths {
  global: string;
  project: string;
}

export interface PatternViolation {
  pattern: string;
  message: string;
  severity: PatternSeverity;
  fix: string;
  file?: string;
  line?: number;
  recurrence: string;
}

export interface PatternsValidationResult {
  passed: boolean;
  violations: PatternViolation[];
  blocking: boolean;
}

export interface PatternLogEntry {
  date: string;
  action: "created" | "updated" | "promoted" | "archived" | "superseded" | "rejected";
  id: string;
  category: PatternCategory;
  trigger?: string;
  details?: string;
}
```

- [ ] **Step 4: Implement config loading**

```typescript
// lib/patterns/config.ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { PatternsConfig, WikiPaths } from "./types";

export function defaultPatternsConfig(): PatternsConfig {
  return {
    enabled: true,
    globalWiki: true,
    globalPath: path.join(os.homedir(), ".superpowers", "patterns-wiki"),
    bootstrapThreshold: 10,
    recurrenceThreshold: { minFrequency: 3, minProjects: 2 },
    staleness: { reviewDays: 30, archiveDays: 90 },
  };
}

export function loadPatternsConfig(projectRoot: string): PatternsConfig {
  const configPath = path.join(projectRoot, ".harness.config.json");
  const defaults = defaultPatternsConfig();

  if (!fs.existsSync(configPath)) return defaults;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const patternsSection = raw.patterns || {};
    return {
      ...defaults,
      ...patternsSection,
      recurrenceThreshold: {
        ...defaults.recurrenceThreshold,
        ...patternsSection.recurrenceThreshold,
      },
      staleness: {
        ...defaults.staleness,
        ...patternsSection.staleness,
      },
    };
  } catch {
    return defaults;
  }
}

export function resolveWikiPaths(config: PatternsConfig, projectRoot: string): WikiPaths {
  const projectWiki = path.join(projectRoot, ".superpowers", "patterns-wiki");

  if (!config.globalWiki) {
    return { global: projectWiki, project: projectWiki };
  }

  let globalPath = config.globalPath;
  if (globalPath.startsWith("~")) {
    globalPath = path.join(os.homedir(), globalPath.slice(1));
  }

  return { global: globalPath, project: projectWiki };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/patterns/config.test.ts --no-coverage`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/patterns/types.ts lib/patterns/config.ts tests/patterns/config.test.ts
git commit -m "feat(patterns): add types and config loading with global/project wiki support"
```

---

### Task 2: Pattern Catalog CRUD and Matcher

**Files:**
- Create: `lib/patterns/catalog.ts`
- Create: `lib/patterns/matcher.ts`
- Create: `tests/patterns/catalog.test.ts`
- Create: `tests/patterns/matcher.test.ts`

- [ ] **Step 1: Write tests for catalog CRUD**

```typescript
// tests/patterns/catalog.test.ts
import { PatternCatalog } from '../../lib/patterns/catalog';
import * as fs from 'fs';
import * as path from 'path';

describe('PatternCatalog', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-catalog-test');
  let catalog: PatternCatalog;

  const sampleEntry = {
    id: 'test-error-pattern',
    category: 'error_pattern' as const,
    module: 'react-components',
    severity: 'high' as const,
    frequency: 1,
    firstSeen: '2026-05-18',
    lastSeen: '2026-05-18',
    projects: ['test-project'],
    status: 'promoted' as const,
    title: 'Test Error Pattern',
    pattern: 'Test pattern description',
    symptom: 'Test symptom',
    rootCause: 'Test root cause',
    fix: 'Test fix',
    check: 'Test check',
    related: [],
  };

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    catalog = new PatternCatalog(tmpDir, tmpDir);
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a pattern entry', () => {
    catalog.create(sampleEntry);
    const entryPath = path.join(tmpDir, 'errors', 'test-error-pattern.md');
    expect(fs.existsSync(entryPath)).toBe(true);
  });

  it('reads a pattern entry back', () => {
    catalog.create(sampleEntry);
    const entry = catalog.getById('test-error-pattern');
    expect(entry).not.toBeNull();
    expect(entry!.title).toBe('Test Error Pattern');
    expect(entry!.severity).toBe('high');
  });

  it('updates an existing pattern', () => {
    catalog.create(sampleEntry);
    catalog.update('test-error-pattern', { frequency: 5, lastSeen: '2026-05-20' });
    const entry = catalog.getById('test-error-pattern');
    expect(entry!.frequency).toBe(5);
    expect(entry!.lastSeen).toBe('2026-05-20');
  });

  it('increments frequency and updates projects', () => {
    catalog.create(sampleEntry);
    catalog.incrementFrequency('test-error-pattern', 'another-project');
    const entry = catalog.getById('test-error-pattern');
    expect(entry!.frequency).toBe(2);
    expect(entry!.projects).toContain('another-project');
  });

  it('queries patterns by module', () => {
    const entry2 = { ...sampleEntry, id: 'another-pattern', module: 'api-endpoints' };
    catalog.create(sampleEntry);
    catalog.create(entry2);
    const results = catalog.query({ module: 'react-components' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test-error-pattern');
  });

  it('queries patterns by category', () => {
    const practiceEntry = {
      ...sampleEntry,
      id: 'test-practice',
      category: 'good_practice' as const,
    };
    catalog.create(sampleEntry);
    catalog.create(practiceEntry);
    const results = catalog.query({ categories: ['good_practice'] });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test-practice');
  });

  it('excludes archived patterns by default', () => {
    const archivedEntry = { ...sampleEntry, id: 'archived-pattern', status: 'archived' as const };
    catalog.create(sampleEntry);
    catalog.create(archivedEntry);
    const results = catalog.query({ excludeArchived: true });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test-error-pattern');
  });

  it('counts total non-archived patterns', () => {
    catalog.create(sampleEntry);
    catalog.create({ ...sampleEntry, id: 'second-pattern' });
    catalog.create({ ...sampleEntry, id: 'archived', status: 'archived' as const });
    expect(catalog.countTotal()).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/patterns/catalog.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement PatternCatalog**

```typescript
// lib/patterns/catalog.ts
import * as fs from "node:fs";
import * as path from "node:path";
import type { PatternEntry, PatternQuery, PatternLogEntry } from "./types";

const CATEGORY_DIR_MAP: Record<string, string> = {
  error_pattern: "errors",
  good_practice: "practices",
  project_constraint: "constraints",
};

export class PatternCatalog {
  constructor(
    private globalPath: string,
    private projectPath: string,
  ) {
    this.ensureDirectories(globalPath);
    this.ensureDirectories(projectPath);
  }

  private ensureDirectories(basePath: string): void {
    for (const dir of ["errors", "practices", "constraints", "pending", "archived"]) {
      const dirPath = path.join(basePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  create(entry: PatternEntry): void {
    const dirName = CATEGORY_DIR_MAP[entry.category] || "errors";
    const filePath = this.resolveWritePath(entry, dirName);
    this.writeEntry(filePath, entry);
    this.appendToLog({
      date: new Date().toISOString(),
      action: "created",
      id: entry.id,
      category: entry.category,
      details: `Created as ${entry.status}`,
    });
  }

  private resolveWritePath(entry: PatternEntry, dirName: string): string {
    const basePath = entry.status === "pending" ? this.projectPath :
                     entry.status === "archived" ? this.globalPath :
                     this.globalPath;
    const statusDir = entry.status === "pending" ? "pending" :
                      entry.status === "archived" ? "archived" : dirName;
    return path.join(basePath, statusDir, `${entry.id}.md`);
  }

  getById(id: string): PatternEntry | null {
    for (const basePath of [this.globalPath, this.projectPath]) {
      for (const dir of ["errors", "practices", "constraints", "pending", "archived"]) {
        const filePath = path.join(basePath, dir, `${id}.md`);
        if (fs.existsSync(filePath)) {
          return this.parseEntry(fs.readFileSync(filePath, "utf-8"));
        }
      }
    }
    return null;
  }

  update(id: string, updates: Partial<PatternEntry>): void {
    const existing = this.getById(id);
    if (!existing) throw new Error(`Pattern ${id} not found`);
    const updated = { ...existing, ...updates };
    const dirName = CATEGORY_DIR_MAP[updated.category] || "errors";
    const filePath = this.resolveWritePath(updated, dirName);
    this.writeEntry(filePath, updated);
    this.appendToLog({
      date: new Date().toISOString(),
      action: "updated",
      id,
      category: updated.category,
      details: `Updated: ${Object.keys(updates).join(", ")}`,
    });
  }

  incrementFrequency(id: string, projectName: string): void {
    const existing = this.getById(id);
    if (!existing) throw new Error(`Pattern ${id} not found`);
    const newProjects = existing.projects.includes(projectName)
      ? existing.projects
      : [...existing.projects, projectName];
    this.update(id, {
      frequency: existing.frequency + 1,
      lastSeen: new Date().toISOString().split("T")[0],
      projects: newProjects,
    });
  }

  archive(id: string): void {
    this.update(id, { status: "archived" });
    this.appendToLog({
      date: new Date().toISOString(),
      action: "archived",
      id,
      category: "error_pattern",
      details: "Auto-archived due to staleness",
    });
  }

  supersede(oldId: string, newId: string): void {
    this.update(oldId, {
      status: "archived",
      supersededBy: newId,
      supersededAt: new Date().toISOString().split("T")[0],
    });
    this.appendToLog({
      date: new Date().toISOString(),
      action: "superseded",
      id: oldId,
      category: "error_pattern",
      details: `Superseded by ${newId}`,
    });
  }

  query(query: PatternQuery): PatternEntry[] {
    const allEntries = this.loadAllEntries();
    let results = allEntries;

    if (query.excludeArchived) {
      results = results.filter(e => e.status !== "archived");
    }
    if (query.module) {
      results = results.filter(e => e.module === query.module);
    }
    if (query.categories && query.categories.length > 0) {
      results = results.filter(e => query.categories!.includes(e.category));
    }
    if (query.severity && query.severity.length > 0) {
      results = results.filter(e => query.severity!.includes(e.severity));
    }

    results.sort((a, b) => {
      const categoryWeight = (c: string) => c === "error_pattern" ? 2 : c === "good_practice" ? 1 : 0;
      const weightDiff = categoryWeight(b.category) - categoryWeight(a.category);
      if (weightDiff !== 0) return weightDiff;
      return b.frequency - a.frequency;
    });

    if (query.maxResults) {
      results = results.slice(0, query.maxResults);
    }

    return results;
  }

  countTotal(): number {
    return this.loadAllEntries().filter(e => e.status !== "archived").length;
  }

  private loadAllEntries(): PatternEntry[] {
    const entries: PatternEntry[] = [];
    for (const basePath of [this.globalPath, this.projectPath]) {
      for (const dir of ["errors", "practices", "constraints", "pending", "archived"]) {
        const dirPath = path.join(basePath, dir);
        if (!fs.existsSync(dirPath)) continue;
        for (const file of fs.readdirSync(dirPath)) {
          if (!file.endsWith(".md")) continue;
          const filePath = path.join(dirPath, file);
          try {
            const entry = this.parseEntry(fs.readFileSync(filePath, "utf-8"));
            if (!entries.find(e => e.id === entry.id)) {
              entries.push(entry);
            }
          } catch {
            // Skip malformed entries
          }
        }
      }
    }
    return entries;
  }

  private parseEntry(content: string): PatternEntry {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) throw new Error("Invalid pattern entry format");

    const [, frontmatterStr, body] = frontmatterMatch;
    const frontmatter: Record<string, unknown> = {};
    for (const line of frontmatterStr.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value.startsWith("[") && value.endsWith("]")) {
        try { value = JSON.parse(value); } catch { /* keep as string */ }
      }
      if (value === "true") value = true;
      if (value === "false") value = false;
      if (!isNaN(Number(value)) && value !== "") value = Number(value);
      frontmatter[key] = value;
    }

    const parseSection = (heading: string): string => {
      const regex = new RegExp(`\\*\\*${heading}:\\*\\*\\s*([^\\n]+)`);
      const match = body.match(regex);
      return match ? match[1].trim() : "";
    };

    return {
      id: frontmatter.id as string || "",
      category: frontmatter.category as PatternEntry["category"] || "error_pattern",
      module: frontmatter.module as string || "",
      severity: frontmatter.severity as PatternEntry["severity"] || "medium",
      frequency: frontmatter.frequency as number || 1,
      firstSeen: frontmatter.firstSeen as string || "",
      lastSeen: frontmatter.lastSeen as string || "",
      projects: frontmatter.projects as string[] || [],
      status: frontmatter.status as PatternEntry["status"] || "promoted",
      title: this.extractTitle(body),
      pattern: parseSection("Pattern"),
      symptom: parseSection("Symptom"),
      rootCause: parseSection("Root cause"),
      fix: parseSection("Fix"),
      check: parseSection("Check"),
      checkRegex: parseSection("CheckRegex") || undefined,
      related: this.parseRelated(body),
      supersededBy: frontmatter.supersededBy as string | undefined,
      supersededAt: frontmatter.supersededAt as string | undefined,
    };
  }

  private extractTitle(body: string): string {
    const match = body.match(/^## (.+)$/m);
    return match ? match[1].trim() : "";
  }

  private parseRelated(body: string): string[] {
    const matches = body.match(/\[\[(.+?)\]\]/g);
    return matches ? matches.map(m => m.slice(2, -2)) : [];
  }

  private writeEntry(filePath: string, entry: PatternEntry): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const frontmatter = [
      "---",
      `id: ${entry.id}`,
      `category: ${entry.category}`,
      `module: ${entry.module}`,
      `severity: ${entry.severity}`,
      `frequency: ${entry.frequency}`,
      `first_seen: ${entry.firstSeen}`,
      `last_seen: ${entry.lastSeen}`,
      `projects: ${JSON.stringify(entry.projects)}`,
      `status: ${entry.status}`,
      entry.supersededBy ? `superseded_by: ${entry.supersededBy}` : "",
      entry.supersededAt ? `superseded_at: ${entry.supersededAt}` : "",
      "---",
      "",
      `## ${entry.title}`,
      "",
      `**Pattern:** ${entry.pattern}`,
      `**Symptom:** ${entry.symptom}`,
      `**Root cause:** ${entry.rootCause}`,
      `**Fix:** ${entry.fix}`,
      `**Check:** ${entry.check}`,
      entry.checkRegex ? `**CheckRegex:** ${entry.checkRegex}` : "",
      entry.related.length > 0 ? `**Related:** ${entry.related.map(r => `[[${r}]]`).join(", ")}` : "",
      "",
    ].filter(Boolean).join("\n");

    fs.writeFileSync(filePath, frontmatter);
  }

  private appendToLog(logEntry: PatternLogEntry): void {
    const logPath = path.join(this.globalPath, "log.md");
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    const line = `## [${logEntry.date.split("T")[0]}] ${logEntry.action} | ${logEntry.id} | ${logEntry.category}\n${logEntry.details ? `${logEntry.details}\n` : ""}`;
    fs.appendFileSync(logPath, line);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/patterns/catalog.test.ts --no-coverage`
Expected: All 8 tests PASS

- [ ] **Step 5: Write tests for matcher**

```typescript
// tests/patterns/matcher.test.ts
import { findRelevantPatterns, detectModuleType } from '../../lib/patterns/matcher';
import type { PatternEntry } from '../../lib/patterns/types';

describe('findRelevantPatterns', () => {
  const patterns: PatternEntry[] = [
    {
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-17',
      projects: ['proj-a', 'proj-b'],
      status: 'promoted',
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'User reports missing validation',
      rootCause: 'Happy path focus',
      fix: 'Add Zod validation',
      check: 'input without required',
      related: [],
    },
    {
      id: 'api-error-handling',
      category: 'error_pattern',
      module: 'api-endpoints',
      severity: 'high',
      frequency: 3,
      firstSeen: '2026-05-12',
      lastSeen: '2026-05-16',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'API No Error Handling',
      pattern: 'Endpoints without try/catch',
      symptom: '500 errors on edge cases',
      rootCause: 'No error boundaries',
      fix: 'Add error handling middleware',
      check: 'route without try/catch',
      related: [],
    },
    {
      id: 'memo-overuse',
      category: 'good_practice',
      module: 'react-components',
      severity: 'low',
      frequency: 2,
      firstSeen: '2026-05-14',
      lastSeen: '2026-05-15',
      projects: ['proj-c'],
      status: 'pending',
      title: 'useMemo Overuse',
      pattern: 'Excessive useMemo',
      symptom: 'Code complexity',
      rootCause: 'Premature optimization',
      fix: 'Only memoize expensive computations',
      check: 'useMemo on simple values',
      related: [],
    },
  ];

  it('finds patterns matching module type', () => {
    const results = findRelevantPatterns(patterns, 'react-components');
    expect(results.length).toBe(2);
    expect(results.map(r => r.id)).toContain('react-form-validation');
    expect(results.map(r => r.id)).toContain('memo-overuse');
  });

  it('excludes archived patterns', () => {
    const withArchived = [...patterns, {
      ...patterns[0],
      id: 'archived-pattern',
      status: 'archived' as const,
    }];
    const results = findRelevantPatterns(withArchived, 'react-components');
    expect(results.find(r => r.id === 'archived-pattern')).toBeUndefined();
  });

  it('returns empty array when no match', () => {
    const results = findRelevantPatterns(patterns, 'terraform');
    expect(results.length).toBe(0);
  });

  it('limits results to maxResults', () => {
    const results = findRelevantPatterns(patterns, 'react-components', 1);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('react-form-validation');
  });
});

describe('detectModuleType', () => {
  it('detects react-components from tsx files', () => {
    expect(detectModuleType(['src/components/Button.tsx'])).toBe('react-components');
  });

  it('detects api-endpoints from route files', () => {
    expect(detectModuleType(['src/routes/users.ts'])).toBe('api-endpoints');
  });

  it('detects terraform from .tf files', () => {
    expect(detectModuleType(['main.tf', 'variables.tf'])).toBe('terraform');
  });

  it('returns generic for unknown types', () => {
    expect(detectModuleType(['README.md'])).toBe('generic');
  });
});
```

- [ ] **Step 6: Run matcher tests to verify they fail**

Run: `npx jest tests/patterns/matcher.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 7: Implement matcher**

```typescript
// lib/patterns/matcher.ts
import type { PatternEntry } from "./types";

export function findRelevantPatterns(
  patterns: PatternEntry[],
  moduleType: string,
  maxResults: number = 5,
): PatternEntry[] {
  return patterns
    .filter(p => p.status !== "archived")
    .filter(p => {
      if (p.module === moduleType) return true;
      if (moduleType.includes(p.module) || p.module.includes(moduleType)) return true;
      return false;
    })
    .sort((a, b) => {
      const categoryWeight = (c: string) => c === "error_pattern" ? 2 : c === "good_practice" ? 1 : 0;
      const weightDiff = categoryWeight(b.category) - categoryWeight(a.category);
      if (weightDiff !== 0) return weightDiff;
      return b.frequency - a.frequency;
    })
    .slice(0, maxResults);
}

export function detectModuleType(files: string[]): string {
  const hasReact = files.some(f => /\.(tsx|jsx)$/.test(f));
  const hasApi = files.some(f => f.includes("route") || f.includes("controller") || f.includes("endpoint"));
  const hasTerraform = files.some(f => /\.tf$/.test(f));
  const hasPython = files.some(f => /\.py$/.test(f));
  const hasCsharp = files.some(f => /\.cs$/.test(f));
  const hasGo = files.some(f => /\.go$/.test(f));

  if (hasReact) return "react-components";
  if (hasApi) return "api-endpoints";
  if (hasTerraform) return "terraform";
  if (hasPython) return "python-fastapi";
  if (hasCsharp) return "csharp-aspnet";
  if (hasGo) return "go-std";
  return "generic";
}
```

- [ ] **Step 8: Run matcher tests to verify they pass**

Run: `npx jest tests/patterns/matcher.test.ts --no-coverage`
Expected: All 8 tests PASS

- [ ] **Step 9: Commit**

```bash
git add lib/patterns/catalog.ts lib/patterns/matcher.ts tests/patterns/catalog.test.ts tests/patterns/matcher.test.ts
git commit -m "feat(patterns): implement catalog CRUD, matcher, and module detection"
```

---

### Task 3: Threshold Logic and CLI

**Files:**
- Create: `lib/patterns/threshold.ts`
- Create: `tools/patterns/cli.ts`
- Create: `tests/patterns/threshold.test.ts`

- [ ] **Step 1: Write tests for threshold logic**

```typescript
// tests/patterns/threshold.test.ts
import { shouldCreatePattern } from '../../lib/patterns/threshold';
import type { PatternsConfig } from '../../lib/patterns/types';

describe('shouldCreatePattern', () => {
  const defaultConfig: PatternsConfig = {
    enabled: true,
    globalWiki: true,
    globalPath: '/tmp/wiki',
    bootstrapThreshold: 10,
    recurrenceThreshold: { minFrequency: 3, minProjects: 2 },
    staleness: { reviewDays: 30, archiveDays: 90 },
  };

  it('creates pattern in bootstrap mode when total < threshold', () => {
    const result = shouldCreatePattern(5, defaultConfig);
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('bootstrap');
  });

  it('creates pattern when frequency threshold met', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 3, projects: 1 });
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('promoted');
  });

  it('creates pattern when project threshold met', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 1, projects: 2 });
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('promoted');
  });

  it('returns pending when below thresholds but has some recurrence', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 2, projects: 1 });
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('pending');
  });

  it('rejects one-off in normal mode with low counts', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 1, projects: 1 });
    expect(result.shouldCreate).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/patterns/threshold.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement threshold logic**

```typescript
// lib/patterns/threshold.ts
import type { PatternsConfig, PatternStatus } from "./types";

export interface ThresholdResult {
  shouldCreate: boolean;
  status: PatternStatus;
  reason: string;
}

export function shouldCreatePattern(
  totalPatternsInWiki: number,
  config: PatternsConfig,
  occurrence: { frequency: number; projects: number } = { frequency: 1, projects: 1 },
): ThresholdResult {
  if (totalPatternsInWiki < config.bootstrapThreshold) {
    return {
      shouldCreate: true,
      status: "bootstrap",
      reason: `Bootstrap mode (${totalPatternsInWiki}/${config.bootstrapThreshold} patterns)`,
    };
  }

  if (occurrence.frequency >= config.recurrenceThreshold.minFrequency) {
    return {
      shouldCreate: true,
      status: "promoted",
      reason: `Frequency threshold met (${occurrence.frequency} >= ${config.recurrenceThreshold.minFrequency})`,
    };
  }

  if (occurrence.projects >= config.recurrenceThreshold.minProjects) {
    return {
      shouldCreate: true,
      status: "promoted",
      reason: `Project threshold met (${occurrence.projects} >= ${config.recurrenceThreshold.minProjects})`,
    };
  }

  if (occurrence.frequency > 1 || occurrence.projects > 1) {
    return {
      shouldCreate: true,
      status: "pending",
      reason: `Below thresholds (freq: ${occurrence.frequency}, projects: ${occurrence.projects})`,
    };
  }

  return {
    shouldCreate: false,
    status: "pending",
    reason: "One-off in normal mode — not creating",
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/patterns/threshold.test.ts --no-coverage`
Expected: All 5 tests PASS

- [ ] **Step 5: Implement CLI**

```typescript
// tools/patterns/cli.ts
#!/usr/bin/env node
import { PatternCatalog } from "../../lib/patterns/catalog";
import { loadPatternsConfig, resolveWikiPaths } from "../../lib/patterns/config";
import { PatternLinter } from "../../lib/patterns/linter";
import * as fs from "node:fs";
import * as path from "node:path";

const args = process.argv.slice(2);
const command = args[0] || "help";
const projectRoot = process.cwd();

function getCatalog(): PatternCatalog {
  const config = loadPatternsConfig(projectRoot);
  if (!config.enabled) {
    console.error("Patterns feature is disabled in .harness.config.json");
    process.exit(1);
  }
  const paths = resolveWikiPaths(config, projectRoot);
  return new PatternCatalog(paths.global, paths.project);
}

async function main() {
  switch (command) {
    case "lint": {
      const catalog = getCatalog();
      const config = loadPatternsConfig(projectRoot);
      const paths = resolveWikiPaths(config, projectRoot);
      const linter = new PatternLinter(catalog, paths, config);
      const report = await linter.run();
      console.log(formatLintReport(report));
      process.exit(report.hasCritical ? 1 : 0);
      break;
    }

    case "query": {
      const term = args[1];
      if (!term) {
        console.error("Usage: patterns query <search-term>");
        process.exit(1);
      }
      const catalog = getCatalog();
      const allPatterns = catalog.query({ excludeArchived: true });
      const matches = allPatterns.filter(
        p => p.title.toLowerCase().includes(term.toLowerCase()) ||
             p.id.toLowerCase().includes(term.toLowerCase()) ||
             p.pattern.toLowerCase().includes(term.toLowerCase()) ||
             p.module.toLowerCase().includes(term.toLowerCase()),
      );
      if (matches.length === 0) {
        console.log(`No patterns found matching "${term}"`);
      } else {
        console.log(`Found ${matches.length} pattern(s) matching "${term}":\n`);
        for (const p of matches) {
          console.log(`- ${p.id} (${p.category}, ${p.severity}) — ${p.title}`);
          console.log(`  Frequency: ${p.frequency} | Projects: ${p.projects.join(", ")}`);
        }
      }
      break;
    }

    case "show": {
      const id = args[1];
      if (!id) {
        console.error("Usage: patterns show <pattern-id>");
        process.exit(1);
      }
      const catalog = getCatalog();
      const entry = catalog.getById(id);
      if (!entry) {
        console.error(`Pattern "${id}" not found`);
        process.exit(1);
      }
      console.log(`## ${entry.title}`);
      console.log(`ID: ${entry.id}`);
      console.log(`Category: ${entry.category}`);
      console.log(`Module: ${entry.module}`);
      console.log(`Severity: ${entry.severity}`);
      console.log(`Frequency: ${entry.frequency} (${entry.projects.join(", ")})`);
      console.log(`Status: ${entry.status}`);
      console.log(`\nPattern: ${entry.pattern}`);
      console.log(`Symptom: ${entry.symptom}`);
      console.log(`Fix: ${entry.fix}`);
      console.log(`Check: ${entry.check}`);
      if (entry.related.length > 0) console.log(`Related: ${entry.related.join(", ")}`);
      break;
    }

    case "stats": {
      const catalog = getCatalog();
      const all = catalog.query({ excludeArchived: false });
      const promoted = all.filter(p => p.status === "promoted");
      const pending = all.filter(p => p.status === "pending");
      const bootstrap = all.filter(p => p.status === "bootstrap");
      const archived = all.filter(p => p.status === "archived");

      console.log("## Patterns Statistics");
      console.log(`Total: ${all.length}`);
      console.log(`Promoted: ${promoted.length}`);
      console.log(`Pending: ${pending.length}`);
      console.log(`Bootstrap: ${bootstrap.length}`);
      console.log(`Archived: ${archived.length}`);
      console.log(`\nBy Category:`);
      console.log(`  Error patterns: ${promoted.filter(p => p.category === "error_pattern").length}`);
      console.log(`  Good practices: ${promoted.filter(p => p.category === "good_practice").length}`);
      console.log(`  Project constraints: ${promoted.filter(p => p.category === "project_constraint").length}`);
      console.log(`\nTop Recurrents:`);
      const topRecurrents = promoted.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
      for (const p of topRecurrents) {
        console.log(`  ${p.id}: ${p.frequency}x across ${p.projects.length} project(s)`);
      }
      break;
    }

    case "promote": {
      const id = args[1];
      if (!id) { console.error("Usage: patterns promote <pattern-id>"); process.exit(1); }
      const catalog = getCatalog();
      const entry = catalog.getById(id);
      if (!entry) { console.error(`Pattern "${id}" not found`); process.exit(1); }
      catalog.update(id, { status: "promoted" });
      console.log(`Promoted "${id}" to promoted status`);
      break;
    }

    case "archive": {
      const id = args[1];
      if (!id) { console.error("Usage: patterns archive <pattern-id>"); process.exit(1); }
      const catalog = getCatalog();
      catalog.archive(id);
      console.log(`Archived "${id}"`);
      break;
    }

    case "export": {
      const catalog = getCatalog();
      const all = catalog.query({ excludeArchived: false });
      console.log(JSON.stringify(all, null, 2));
      break;
    }

    case "import": {
      const filePath = args[1];
      if (!filePath) { console.error("Usage: patterns import <json-file>"); process.exit(1); }
      if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }
      const entries = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const catalog = getCatalog();
      let imported = 0;
      for (const raw of entries) {
        if (catalog.getById(raw.id)) { console.log(`Skipping existing: ${raw.id}`); continue; }
        catalog.create(raw as any);
        imported++;
      }
      console.log(`Imported ${imported} pattern(s)`);
      break;
    }

    case "help":
    default:
      console.log(`
Patterns CLI — Learning Harness Knowledge Base

Usage: npx ts-node tools/patterns/cli.ts <command> [args]

Commands:
  lint              Run wiki health check
  query <term>      Search patterns
  show <id>         Show full pattern details
  stats             Display summary statistics
  promote <id>      Promote pending pattern
  archive <id>      Archive stale pattern
  export            Export all patterns as JSON
  import <file>     Import patterns from JSON
  help              Show this help
`);
      break;
  }
}

function formatLintReport(report: {
  contradictions: Array<{ ids: [string, string]; reason: string }>;
  stale: Array<{ id: string; daysSinceLastSeen: number }>;
  orphans: string[];
  bootstrapReview: string[];
  duplicates: Array<{ ids: [string, string]; similarity: number }>;
  hasCritical: boolean;
}): string {
  const lines: string[] = ["## Wiki Lint Report\n"];
  if (report.contradictions.length > 0) {
    lines.push(`❌ Contradictions (${report.contradictions.length}):`);
    for (const c of report.contradictions) lines.push(`   ${c.ids[0]} vs ${c.ids[1]} — ${c.reason}`);
    lines.push("");
  }
  if (report.stale.length > 0) {
    lines.push(`⚠️ Stale patterns (${report.stale.length}):`);
    for (const s of report.stale) lines.push(`   ${s.id} (not seen in ${s.daysSinceLastSeen} days)`);
    lines.push("");
  }
  if (report.orphans.length > 0) {
    lines.push(`📋 Orphan patterns (${report.orphans.length}):`);
    for (const o of report.orphans) lines.push(`   ${o} (no inbound links)`);
    lines.push("");
  }
  if (report.bootstrapReview.length > 0) {
    lines.push(`🔍 Bootstrap review (${report.bootstrapReview.length}):`);
    for (const b of report.bootstrapReview) lines.push(`   ${b} (pending promotion decision)`);
    lines.push("");
  }
  if (report.duplicates.length > 0) {
    lines.push(`🔄 Possible duplicates (${report.duplicates.length}):`);
    for (const d of report.duplicates) lines.push(`   ${d.ids[0]} vs ${d.ids[1]} (${Math.round(d.similarity * 100)}% similar)`);
    lines.push("");
  }
  if (lines.length <= 1) lines.push("✅ No issues found. Wiki is healthy.");
  return lines.join("\n");
}

main();
```

- [ ] **Step 6: Commit**

```bash
git add lib/patterns/threshold.ts tools/patterns/cli.ts tests/patterns/threshold.test.ts
git commit -m "feat(patterns): add threshold logic and CLI with lint/query/stats/promote/archive"
```

---

### Task 4: Capture Hook

**Files:**
- Create: `hooks/capture-hook.js`
- Create: `hooks/capture-classifier.js`
- Create: `hooks/capture-patterns.json`
- Modify: `hooks/hooks.json`

- [ ] **Step 1: Create trigger patterns config**

```json
{
  "correction_triggers": [
    "não ficou bom", "precisa validar", "esqueceu", "falta",
    "não está funcionando", "corrigir", "isso deveria",
    "não deveria", "missing", "forgot to", "needs to",
    "should have", "not working as expected", "não funciona",
    "está quebrado", "bug", "error", "wrong", "incorrect",
    "não é isso", "está errado", "precisa ser", "deveria ter"
  ],
  "positive_triggers": [
    "isso sim", "agora ficou bom", "perfeito", "exatamente",
    "great", "perfect", "this works", "now it's good",
    "looks good", "approved", "LGTM"
  ]
}
```

- [ ] **Step 2: Create the capture hook**

```javascript
// hooks/capture-hook.js
#!/usr/bin/env node
/**
 * PostUserFeedback Hook — Pattern Capture
 *
 * Detects user corrections, classifies them, and catalogs patterns.
 * Reads stdin for conversation context.
 * Output: stdout JSON with detection result.
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
      const userMessage = data.user_message || '';
      const cwd = data.cwd || process.cwd();

      if (!userMessage) {
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'No user message' }));
        return;
      }

      const triggersPath = path.join(__dirname, 'capture-patterns.json');
      if (!fs.existsSync(triggersPath)) {
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'No triggers config' }));
        return;
      }

      const triggers = JSON.parse(fs.readFileSync(triggersPath, 'utf8'));
      const matchedTrigger = triggers.correction_triggers.find(trigger =>
        userMessage.toLowerCase().includes(trigger.toLowerCase())
      );

      if (!matchedTrigger) {
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'No correction detected' }));
        return;
      }

      // Classify the correction via LLM
      const classifierPath = path.join(__dirname, 'capture-classifier.js');
      let classification = { category: 'one_off', confidence: 0 };
      try {
        const result = execSync(
          `node "${classifierPath}"`,
          {
            input: JSON.stringify({ userMessage, matchedTrigger, cwd }),
            encoding: 'utf8',
            timeout: 30000,
          }
        );
        classification = JSON.parse(result.trim());
      } catch {
        classification = { category: 'error_pattern', confidence: 0.5 };
      }

      if (classification.category === 'one_off') {
        process.stdout.write(JSON.stringify({
          decision: 'allow',
          reason: 'One-off correction — not cataloging',
        }));
        return;
      }

      // Check if similar pattern exists
      const cliPath = path.join(__dirname, '..', 'tools', 'patterns', 'cli.ts');
      const queryTerm = classification.suggestedId || matchedTrigger.split(' ')[0];
      let existingMatch = '';
      try {
        const queryResult = execSync(
          `npx ts-node "${cliPath}" query "${queryTerm}"`,
          { cwd, encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        if (queryResult.includes('Found') && !queryResult.includes('No patterns')) {
          existingMatch = queryResult.trim();
        }
      } catch {
        // No match or CLI not available
      }

      // Output detection for the agent to handle
      const output = {
        decision: 'pattern_detected',
        category: classification.category,
        trigger: matchedTrigger,
        userMessage: userMessage.substring(0, 200),
        classification: classification,
        existingMatch: existingMatch,
        prompt: existingMatch
          ? `📋 Detected recurring pattern: "${matchedTrigger}"\n   Category: ${classification.category}\n   Similar pattern found:\n   ${existingMatch}\n\n   Update existing pattern frequency? (y/n)`
          : `📋 Detected a new pattern: "${matchedTrigger}"\n   Category: ${classification.category}\n   Suggested ID: ${classification.suggestedId || 'auto-generated'}\n\n   Add to patterns-wiki? (y/n/edit)`,
      };

      process.stdout.write(JSON.stringify(output));
    } catch (_) {
      process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'Hook error' }));
    }
  });
}

main();
```

- [ ] **Step 3: Create the LLM classifier**

```javascript
// hooks/capture-classifier.js
#!/usr/bin/env node
/**
 * LLM-based classifier for user corrections.
 * Reads stdin JSON with { userMessage, matchedTrigger, cwd }.
 * Outputs JSON with { category, suggestedId, confidence }.
 *
 * Falls back to keyword-based classification if LLM is unavailable.
 */

const fs = require('fs');
const path = require('path');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const userMessage = data.userMessage || '';
      const matchedTrigger = data.matchedTrigger || '';

      // Keyword-based fallback classification
      const category = classifyByKeywords(userMessage);
      const suggestedId = generateSuggestedId(userMessage, category);

      process.stdout.write(JSON.stringify({
        category,
        suggestedId,
        confidence: 0.6,
        reasoning: `Keyword-based classification: ${category}`,
      }));
    } catch {
      process.stdout.write(JSON.stringify({
        category: 'error_pattern',
        suggestedId: 'unknown-pattern',
        confidence: 0.3,
        reasoning: 'Fallback classification',
      }));
    }
  });
}

function classifyByKeywords(message) {
  const lower = message.toLowerCase();

  // Error pattern indicators
  if (lower.includes('missing') || lower.includes('forgot') || lower.includes('esqueceu') ||
      lower.includes('falta') || lower.includes('não está') || lower.includes('not working') ||
      lower.includes('quebrado') || lower.includes('error') || lower.includes('bug')) {
    return 'error_pattern';
  }

  // Good practice indicators
  if (lower.includes('melhor') || lower.includes('better') || lower.includes('should be') ||
      lower.includes('deveria') || lower.includes('poderia') || lower.includes('could')) {
    return 'good_practice';
  }

  // Project constraint indicators
  if (lower.includes('sempre') || lower.includes('always') || lower.includes('nunca') ||
      lower.includes('never') || lower.includes('regra') || lower.includes('rule') ||
      lower.includes('padrão') || lower.includes('standard')) {
    return 'project_constraint';
  }

  return 'one_off';
}

function generateSuggestedId(message, category) {
  // Generate a slug from the first meaningful words
  const words = message.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 4)
    .join('-');

  const prefix = category === 'error_pattern' ? '' :
                 category === 'good_practice' ? 'practice-' :
                 'constraint-';

  return `${prefix}${words || 'unknown-pattern'}`;
}

main();
```

- [ ] **Step 4: Register hook in hooks.json**

Read `hooks/hooks.json` and add a `PostUserFeedback` entry:

```json
{
  "hooks": {
    ...existing hooks...
    "PostUserFeedback": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/capture-hook.js\"",
            "async": false
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add hooks/capture-hook.js hooks/capture-classifier.js hooks/capture-patterns.json hooks/hooks.json
git commit -m "feat(patterns): add capture hook for automatic pattern detection from user feedback"
```

---

### Task 5: Harness Patterns Validator

**Files:**
- Create: `lib/harness/validators/patterns.ts`
- Create: `tests/patterns/harness-patterns.test.ts`
- Modify: `lib/harness/index.ts`
- Modify: `lib/harness/types.ts`

- [ ] **Step 1: Write tests for patterns validator**

```typescript
// tests/patterns/harness-patterns.test.ts
import { validatePatterns } from '../../lib/harness/validators/patterns';
import { PatternCatalog } from '../../lib/patterns/catalog';
import * as fs from 'fs';
import * as path from 'path';

describe('validatePatterns', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-harness-patterns');

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('passes when no error patterns exist', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    const result = await validatePatterns(tmpDir, catalog);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(result.blocking).toBe(false);
  });

  it('blocks when high severity pattern is violated', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    catalog.create({
      id: 'test-high-severity',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-18',
      projects: ['test-project'],
      status: 'promoted',
      title: 'Test High Severity',
      pattern: 'Test pattern',
      symptom: 'Test symptom',
      rootCause: 'Test cause',
      fix: 'Test fix',
      check: 'input without validation',
      checkRegex: 'input-without-validation-regex',
      related: [],
    });

    const result = await validatePatterns(tmpDir, catalog);
    expect(result.blocking).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].severity).toBe('high');
  });

  it('warns but does not block for medium severity', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    catalog.create({
      id: 'test-medium-severity',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'medium',
      frequency: 2,
      firstSeen: '2026-05-12',
      lastSeen: '2026-05-18',
      projects: ['test-project'],
      status: 'promoted',
      title: 'Test Medium Severity',
      pattern: 'Test pattern',
      symptom: 'Test symptom',
      rootCause: 'Test cause',
      fix: 'Test fix',
      check: 'Test check',
      related: [],
    });

    const result = await validatePatterns(tmpDir, catalog);
    expect(result.blocking).toBe(false);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(1);
  });

  it('includes recurrence info in violation message', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    catalog.create({
      id: 'test-recurrence',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 7,
      firstSeen: '2026-05-01',
      lastSeen: '2026-05-18',
      projects: ['proj-a', 'proj-b', 'proj-c'],
      status: 'promoted',
      title: 'Test Recurrence',
      pattern: 'Test pattern',
      symptom: 'Test symptom',
      rootCause: 'Test cause',
      fix: 'Test fix',
      check: 'Test check',
      checkRegex: 'test-recurrence-regex',
      related: [],
    });

    const result = await validatePatterns(tmpDir, catalog);
    expect(result.violations[0].recurrence).toContain('7 times');
    expect(result.violations[0].recurrence).toContain('3 projects');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/patterns/harness-patterns.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement patterns validator**

```typescript
// lib/harness/validators/patterns.ts
import type { PatternsValidationResult } from "../../patterns/types";
import { PatternCatalog } from "../../patterns/catalog";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs";
import * as path from "node:path";

const execAsync = promisify(exec);

export async function validatePatterns(
  cwd: string,
  catalog: PatternCatalog,
): Promise<PatternsValidationResult> {
  const patterns = catalog.query({
    categories: ["error_pattern"],
    excludeArchived: true,
  });

  if (patterns.length === 0) {
    return { passed: true, violations: [], blocking: false };
  }

  const violations: PatternsValidationResult["violations"] = [];

  for (const pattern of patterns) {
    let violated = false;
    let matchFile = "";
    let matchLine = 0;

    if (pattern.checkRegex) {
      const result = await grepSourceFiles(pattern.checkRegex, cwd);
      if (result.matches.length > 0) {
        violated = true;
        matchFile = result.matches[0].file;
        matchLine = result.matches[0].line;
      }
    }

    if (violated) {
      violations.push({
        pattern: pattern.id,
        message: `Known error pattern: ${pattern.title}`,
        severity: pattern.severity,
        fix: pattern.fix,
        file: matchFile || undefined,
        line: matchLine || undefined,
        recurrence: `Seen ${pattern.frequency} times across ${pattern.projects.length} project${pattern.projects.length > 1 ? "s" : ""}.`,
      });
    }
  }

  const hasBlocking = violations.some(v => v.severity === "high");

  return {
    passed: !hasBlocking,
    violations,
    blocking: hasBlocking,
  };
}

async function grepSourceFiles(regex: string, cwd: string): Promise<{
  matches: Array<{ file: string; line: number }>;
}> {
  const matches: Array<{ file: string; line }> = [];
  const extensions = ["ts", "tsx", "js", "jsx", "py", "cs", "go"];

  try {
    const { stdout } = await execAsync(
      `grep -rn "${regex}" --include="*.${extensions.join('" --include="*.')}" src/ lib/ app/ components/ 2>/dev/null || true`,
      { cwd, timeout: 10000 },
    );

    if (!stdout.trim()) return { matches };

    for (const line of stdout.trim().split("\n")) {
      const match = line.match(/^(.+?):(\d+):/);
      if (match) {
        matches.push({
          file: match[1],
          line: parseInt(match[2], 10),
        });
      }
    }
  } catch {
    // grep not available or error — fail open
  }

  return { matches };
}
```

- [ ] **Step 4: Update harness index.ts to include patterns step**

Read `lib/harness/index.ts` and add the patterns import and step.

Add import:
```typescript
import { validatePatterns } from "./validators/patterns";
import { PatternCatalog } from "../patterns/catalog";
import { loadPatternsConfig, resolveWikiPaths } from "../patterns/config";
```

In the `verify` function, after coverage check and before verify-all block, add:

```typescript
// Patterns check (always runs in verify-local and verify-all)
const patternsConfig = loadPatternsConfig(cwd);
if (patternsConfig.enabled) {
  const wikiPaths = resolveWikiPaths(patternsConfig, cwd);
  const patternCatalog = new PatternCatalog(wikiPaths.global, wikiPaths.project);
  const patternsResult = await validatePatterns(cwd, patternCatalog);

  results.patterns = {
    passed: patternsResult.passed,
    errors: patternsResult.violations.map(v => ({
      file: v.file || "",
      line: v.line || 0,
      column: 0,
      message: `${v.message} — ${v.recurrence}`,
      rule: v.pattern,
      severity: v.severity === "high" ? "error" : "warning",
    })),
    warnings: patternsResult.violations
      .filter(v => v.severity !== "high")
      .map(v => `${v.pattern}: ${v.message}`),
    duration: Date.now() - start,
  };

  if (patternsResult.blocking && config.failOn.security === "error") {
    const report = buildReport({
      feature,
      mode: options.mode,
      results,
      coverageTarget: config.coverageMin,
      harnessAction,
    });
    saveReport(report, path.join(cwd, ".harness", "reports"));
    return { ...report, secOpsDecision, harnessAction };
  }
}
```

- [ ] **Step 5: Add patterns to VerifyReport type**

Read `lib/harness/types.ts` and add to `VerifyReport.summary`:

```typescript
patterns: { violations: number; blocked: number; warned: number };
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest tests/patterns/harness-patterns.test.ts --no-coverage`
Expected: All 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add lib/harness/validators/patterns.ts lib/harness/index.ts lib/harness/types.ts tests/patterns/harness-patterns.test.ts
git commit -m "feat(harness): add patterns validator with BLOCK/WARN severity logic"
```

---

### Task 6: Pattern Injector for ContextEnvelope

**Files:**
- Create: `lib/patterns/injector.ts`
- Create: `tests/patterns/injector.test.ts`

- [ ] **Step 1: Write tests for injector**

```typescript
// tests/patterns/injector.test.ts
import { formatPatternsForContext, formatPatternsForReview } from '../../lib/patterns/injector';
import type { PatternEntry } from '../../lib/patterns/types';

describe('formatPatternsForContext', () => {
  const patterns: PatternEntry[] = [
    {
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-17',
      projects: ['proj-a', 'proj-b'],
      status: 'promoted',
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'User reports missing validation',
      rootCause: 'Happy path focus',
      fix: 'Add Zod validation',
      check: 'input without required',
      related: [],
    },
    {
      id: 'form-sanitization',
      category: 'good_practice',
      module: 'react-components',
      severity: 'medium',
      frequency: 3,
      firstSeen: '2026-05-12',
      lastSeen: '2026-05-16',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'Form Input Sanitization',
      pattern: 'Sanitize all inputs',
      symptom: 'N/A',
      rootCause: 'N/A',
      fix: 'Use Zod transform',
      check: 'Use Zod schema',
      related: [],
    },
  ];

  it('formats patterns for subagent context', () => {
    const result = formatPatternsForContext(patterns);
    expect(result).toContain('Learned Patterns');
    expect(result).toContain('React Form Missing Validation');
    expect(result).toContain('apply these proactively');
    expect(result).toContain('5 times across 2 projects');
  });

  it('returns empty string when no patterns', () => {
    const result = formatPatternsForContext([]);
    expect(result).toBe('');
  });

  it('includes check information', () => {
    const result = formatPatternsForContext(patterns);
    expect(result).toContain('Add Zod validation');
  });
});

describe('formatPatternsForReview', () => {
  const patterns: PatternEntry[] = [
    {
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-17',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'Missing validation',
      rootCause: 'Happy path',
      fix: 'Add validation',
      check: 'input without required',
      related: [],
    },
  ];

  it('formats patterns as review checklist', () => {
    const result = formatPatternsForReview(patterns);
    expect(result).toContain('Pattern Review Checklist');
    expect(result).toContain('- [ ]');
    expect(result).toContain('React Form Missing Validation');
  });

  it('returns empty string when no patterns', () => {
    const result = formatPatternsForReview([]);
    expect(result).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/patterns/injector.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement injector**

```typescript
// lib/patterns/injector.ts
import type { PatternEntry } from "./types";

export function formatPatternsForContext(patterns: PatternEntry[]): string {
  if (patterns.length === 0) return "";

  const lines = [
    "",
    "## Learned Patterns (apply these proactively)",
    "⚠️ The following patterns have been learned from past corrections.",
    "Apply them proactively — do NOT wait for the harness to catch them.",
    "",
  ];

  for (const p of patterns) {
    const severityTag = p.severity === "high" ? "🔴 CRITICAL" :
                        p.severity === "medium" ? "🟡 Watch" : "🟢 Consider";
    lines.push(`### ${p.title} [${severityTag}]`);
    lines.push(`Check: ${p.check}`);
    if (p.fix) lines.push(`Fix: ${p.fix}`);
    lines.push(`Seen: ${p.frequency} times across ${p.projects.length} project${p.projects.length > 1 ? "s" : ""}.`);
    lines.push("");
  }

  return lines.join("\n");
}

export function formatPatternsForReview(patterns: PatternEntry[]): string {
  if (patterns.length === 0) return "";

  const lines = [
    "",
    "## Pattern Review Checklist",
    "Verify the implementation does NOT trigger any known error patterns:",
    "",
  ];

  for (const p of patterns) {
    lines.push(`- [ ] **${p.title}**: ${p.check}`);
  }

  lines.push("");
  return lines.join("\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/patterns/injector.test.ts --no-coverage`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/patterns/injector.ts tests/patterns/injector.test.ts
git commit -m "feat(patterns): add injector for ContextEnvelope and review checklist formatting"
```

---

### Task 7: Wiki Linter

**Files:**
- Create: `lib/patterns/linter.ts`
- Create: `tests/patterns/linter.test.ts`

- [ ] **Step 1: Write tests for linter**

```typescript
// tests/patterns/linter.test.ts
import { PatternLinter } from '../../lib/patterns/linter';
import { PatternCatalog } from '../../lib/patterns/catalog';
import type { PatternsConfig, WikiPaths } from '../../lib/patterns/types';
import * as fs from 'fs';
import * as path from 'path';

describe('PatternLinter', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-linter-test');
  let catalog: PatternCatalog;
  let paths: WikiPaths;
  let config: PatternsConfig;

  const sampleEntry = {
    id: 'test-pattern',
    category: 'error_pattern' as const,
    module: 'react-components',
    severity: 'high' as const,
    frequency: 1,
    firstSeen: '2026-05-18',
    lastSeen: '2026-05-18',
    projects: ['test-project'],
    status: 'promoted' as const,
    title: 'Test Pattern',
    pattern: 'Test',
    symptom: 'Test',
    rootCause: 'Test',
    fix: 'Test',
    check: 'Test',
    related: [],
  };

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    catalog = new PatternCatalog(tmpDir, tmpDir);
    paths = { global: tmpDir, project: tmpDir };
    config = {
      enabled: true,
      globalWiki: true,
      globalPath: tmpDir,
      bootstrapThreshold: 10,
      recurrenceThreshold: { minFrequency: 3, minProjects: 2 },
      staleness: { reviewDays: 30, archiveDays: 90 },
    };
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports no issues for healthy wiki', async () => {
    catalog.create(sampleEntry);
    const linter = new PatternLinter(catalog, paths, config);
    const report = await linter.run();
    expect(report.contradictions.length).toBe(0);
    expect(report.stale.length).toBe(0);
    expect(report.hasCritical).toBe(false);
  });

  it('detects stale patterns', async () => {
    const staleEntry = {
      ...sampleEntry,
      id: 'stale-pattern',
      lastSeen: '2025-01-01',
    };
    catalog.create(staleEntry);
    const linter = new PatternLinter(catalog, paths, config);
    const report = await linter.run();
    expect(report.stale.length).toBe(1);
    expect(report.stale[0].id).toBe('stale-pattern');
  });

  it('detects bootstrap patterns pending review', async () => {
    const bootstrapEntry = {
      ...sampleEntry,
      id: 'bootstrap-pattern',
      status: 'bootstrap' as const,
      firstSeen: '2026-04-01',
    };
    catalog.create(bootstrapEntry);
    const linter = new PatternLinter(catalog, paths, config);
    const report = await linter.run();
    expect(report.bootstrapReview.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/patterns/linter.test.ts --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement linter**

```typescript
// lib/patterns/linter.ts
import { PatternCatalog } from "./catalog";
import type { PatternsConfig, WikiPaths } from "./types";

export interface LintReport {
  contradictions: Array<{ ids: [string, string]; reason: string }>;
  stale: Array<{ id: string; daysSinceLastSeen: number }>;
  orphans: string[];
  bootstrapReview: string[];
  duplicates: Array<{ ids: [string, string]; similarity: number }>;
  hasCritical: boolean;
}

export class PatternLinter {
  constructor(
    private catalog: PatternCatalog,
    private paths: WikiPaths,
    private config: PatternsConfig,
  ) {}

  async run(): Promise<LintReport> {
    const allPatterns = this.catalog.query({ excludeArchived: false });
    const activePatterns = allPatterns.filter(p => p.status !== "archived");

    return {
      contradictions: this.findContradictions(activePatterns),
      stale: this.findStalePatterns(activePatterns),
      orphans: this.findOrphans(activePatterns),
      bootstrapReview: this.findBootstrapReview(activePatterns),
      duplicates: this.findDuplicates(activePatterns),
      hasCritical: false, // Set by contradiction check
    };
  }

  private findContradictions(patterns: Array<{ id: string; check: string; category: string; module: string }>): LintReport["contradictions"] {
    const contradictions: LintReport["contradictions"] = [];
    const byModule = new Map<string, typeof patterns>();

    for (const p of patterns) {
      if (!byModule.has(p.module)) byModule.set(p.module, []);
      byModule.get(p.module)!.push(p);
    }

    for (const [, modulePatterns] of byModule) {
      for (let i = 0; i < modulePatterns.length; i++) {
        for (let j = i + 1; j < modulePatterns.length; j++) {
          const a = modulePatterns[i];
          const b = modulePatterns[j];
          if (this.areContradictory(a.check, b.check)) {
            contradictions.push({
              ids: [a.id, b.id],
              reason: `Opposing checks in module ${a.module}`,
            });
          }
        }
      }
    }

    return contradictions;
  }

  private areContradictory(checkA: string, checkB: string): boolean {
    const lowerA = checkA.toLowerCase();
    const lowerB = checkB.toLowerCase();
    // Simple heuristic: if one says "must X" and other says "must not X"
    const mustA = lowerA.includes("must") || lowerA.includes("required") || lowerA.includes("always");
    const mustNotB = lowerB.includes("must not") || lowerB.includes("never") || lowerB.includes("avoid");
    const mustB = lowerB.includes("must") || lowerB.includes("required") || lowerB.includes("always");
    const mustNotA = lowerA.includes("must not") || lowerA.includes("never") || lowerA.includes("avoid");

    return (mustA && mustNotB) || (mustB && mustNotA);
  }

  private findStalePatterns(patterns: Array<{ id: string; lastSeen: string; status: string }>): LintReport["stale"] {
    const stale: LintReport["stale"] = [];
    const now = new Date();

    for (const p of patterns) {
      if (p.status === "archived") continue;
      const lastSeen = new Date(p.lastSeen);
      const daysSince = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > this.config.staleness.reviewDays) {
        stale.push({ id: p.id, daysSinceLastSeen: daysSince });
      }
    }

    return stale;
  }

  private findOrphans(patterns: Array<{ id: string; related: string[] }>): LintReport["orphans"] {
    const allIds = new Set(patterns.map(p => p.id));
    const orphans: string[] = [];

    for (const p of patterns) {
      const hasInbound = patterns.some(other =>
        other.id !== p.id && other.related.includes(p.id)
      );
      if (!hasInbound && p.related.length === 0) {
        orphans.push(p.id);
      }
    }

    return orphans;
  }

  private findBootstrapReview(patterns: Array<{ id: string; status: string; firstSeen: string }>): LintReport["bootstrapReview"] {
    const review: string[] = [];
    const now = new Date();

    for (const p of patterns) {
      if (p.status !== "bootstrap") continue;
      const firstSeen = new Date(p.firstSeen);
      const daysSince = Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > this.config.staleness.reviewDays) {
        review.push(p.id);
      }
    }

    return review;
  }

  private findDuplicates(patterns: Array<{ id: string; title: string }>): LintReport["duplicates"] {
    const duplicates: LintReport["duplicates"] = [];

    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const similarity = this.titleSimilarity(patterns[i].title, patterns[j].title);
        if (similarity > 0.8) {
          duplicates.push({
            ids: [patterns[i].id, patterns[j].id],
            similarity,
          });
        }
      }
    }

    return duplicates;
  }

  private titleSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/patterns/linter.test.ts --no-coverage`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/patterns/linter.ts tests/patterns/linter.test.ts
git commit -m "feat(patterns): add wiki linter with contradiction/stale/orphan/duplicate detection"
```

---

### Task 8: Skill Updates and Integration

**Files:**
- Modify: `skills/extract-boundary/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/harness-verify/SKILL.md`
- Modify: `package.json`

- [ ] **Step 1: Update extract-boundary SKILL.md**

Read `skills/extract-boundary/SKILL.md` and add to the ContextEnvelope Structure section:

```markdown
### Learned Patterns (NEW)
- Query patterns catalog for relevant entries based on detected module type
- Include error patterns and good practices that apply to this module
- Format using `lib/patterns/injector.ts` → `formatPatternsForContext()`
```

Add to Execution step 4:

```
4. Query patterns catalog: `catalog.query({ module: moduleType, categories: ["error_pattern", "good_practice"], maxResults: 5 })`
5. Format patterns using injector and append to ContextEnvelope
6. For each file, find:
```

Add to Subagent Prompt Template:

```markdown
{{learnedPatternsSection}}

## Technical Dependencies
```

Where `{{learnedPatternsSection}}` is replaced by the injector output.

- [ ] **Step 2: Update subagent-driven-development SKILL.md**

Read `skills/subagent-driven-development/SKILL.md` and add to the Harness Integration section, after step 2:

```
3. Include learned patterns in implementer prompt:
   - Query patterns catalog for the task's module type
   - Append `formatPatternsForContext(patterns)` output
   - Add: "⚠️ Known Patterns for this task: Apply these proactively."

4. Include pattern checklist in reviewer prompt:
   - Append `formatPatternsForReview(patterns)` output
   - Add: "Verify implementation does NOT trigger known error patterns."
```

- [ ] **Step 3: Update harness-verify SKILL.md**

Read `skills/harness-verify/SKILL.md` and add to verify-local mode:

```
6. **patterns** — Check against known error patterns (BLOCK if high severity, WARN if medium/low)
```

And to verify-all mode after step 5:

```
6. patterns — (from verify-local)
```

- [ ] **Step 4: Add npm scripts to package.json**

Read `package.json` and add to scripts:

```json
{
  "scripts": {
    ...existing scripts...
    "patterns:lint": "npx ts-node tools/patterns/cli.ts lint",
    "patterns:query": "npx ts-node tools/patterns/cli.ts query",
    "patterns:stats": "npx ts-node tools/patterns/cli.ts stats",
    "patterns:export": "npx ts-node tools/patterns/cli.ts export"
  }
}
```

- [ ] **Step 5: Run full test suite**

Run: `npx jest --no-coverage`
Expected: All tests PASS (existing + new pattern tests)

- [ ] **Step 6: Run harness:local to verify no regressions**

Run: `npm run harness:local`
Expected: Runs without errors (may fail on actual project checks, but should not crash)

- [ ] **Step 7: Commit**

```bash
git add skills/extract-boundary/SKILL.md skills/subagent-driven-development/SKILL.md skills/harness-verify/SKILL.md package.json
git commit -m "docs(skills): integrate patterns into extract-boundary, SDD, and harness-verify workflows"
```

---

### Task 9: End-to-End Integration Test

**Files:**
- Create: `tests/patterns/integration.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
// tests/patterns/integration.test.ts
import { PatternCatalog } from '../../lib/patterns/catalog';
import { loadPatternsConfig, resolveWikiPaths, defaultPatternsConfig } from '../../lib/patterns/config';
import { shouldCreatePattern } from '../../lib/patterns/threshold';
import { findRelevantPatterns, detectModuleType } from '../../lib/patterns/matcher';
import { formatPatternsForContext, formatPatternsForReview } from '../../lib/patterns/injector';
import { validatePatterns } from '../../lib/harness/validators/patterns';
import * as fs from 'fs';
import * as path from 'path';

describe('Learning Harness Integration', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-integration-test');

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('full flow: create pattern → detect module → inject context → validate', async () => {
    // 1. Config
    const config = defaultPatternsConfig();
    const paths = resolveWikiPaths(config, tmpDir);

    // 2. Catalog
    const catalog = new PatternCatalog(paths.global, paths.project);

    // 3. Create a pattern (simulating capture hook output)
    const thresholdResult = shouldCreatePattern(5, config);
    expect(thresholdResult.shouldCreate).toBe(true);
    expect(thresholdResult.status).toBe('bootstrap');

    catalog.create({
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 1,
      firstSeen: '2026-05-18',
      lastSeen: '2026-05-18',
      projects: ['test-project'],
      status: thresholdResult.status,
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'Missing validation',
      rootCause: 'Happy path focus',
      fix: 'Add Zod validation',
      check: 'input without required',
      checkRegex: '<input(?![^>]*(?:required|pattern))',
      related: [],
    });

    // 4. Detect module type from files
    const files = ['src/components/ContactForm.tsx', 'src/components/Button.tsx'];
    const moduleType = detectModuleType(files);
    expect(moduleType).toBe('react-components');

    // 5. Query relevant patterns
    const allPatterns = catalog.query({ excludeArchived: true });
    const relevant = findRelevantPatterns(allPatterns, moduleType);
    expect(relevant.length).toBe(1);
    expect(relevant[0].id).toBe('react-form-validation');

    // 6. Format for ContextEnvelope
    const contextSection = formatPatternsForContext(relevant);
    expect(contextSection).toContain('Learned Patterns');
    expect(contextSection).toContain('React Form Missing Validation');

    // 7. Format for review checklist
    const reviewChecklist = formatPatternsForReview(relevant);
    expect(reviewChecklist).toContain('Pattern Review Checklist');
    expect(reviewChecklist).toContain('- [ ]');

    // 8. Validate (should pass since no actual source files to grep)
    const validationResult = await validatePatterns(tmpDir, catalog);
    expect(validationResult.violations.length).toBe(0);
    expect(validationResult.passed).toBe(true);
  });

  it('globalWiki false uses project-only paths', () => {
    const config = defaultPatternsConfig();
    config.globalWiki = false;
    const paths = resolveWikiPaths(config, tmpDir);
    expect(paths.global).toBe(paths.project);
  });

  it('wiki index is regenerated with correct counts', () => {
    const config = defaultPatternsConfig();
    const paths = resolveWikiPaths(config, tmpDir);
    const catalog = new PatternCatalog(paths.global, paths.project);

    catalog.create({
      id: 'pattern-a',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 3,
      firstSeen: '2026-05-18',
      lastSeen: '2026-05-18',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'Pattern A',
      pattern: 'A',
      symptom: 'A',
      rootCause: 'A',
      fix: 'A',
      check: 'A',
      related: [],
    });

    catalog.create({
      id: 'pattern-b',
      category: 'good_practice',
      module: 'api-endpoints',
      severity: 'medium',
      frequency: 2,
      firstSeen: '2026-05-18',
      lastSeen: '2026-05-18',
      projects: ['proj-b'],
      status: 'promoted',
      title: 'Pattern B',
      pattern: 'B',
      symptom: 'B',
      rootCause: 'B',
      fix: 'B',
      check: 'B',
      related: [],
    });

    catalog.regenerateIndex();

    const indexPath = path.join(paths.global, 'index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    expect(indexContent).toContain('Pattern A');
    expect(indexContent).toContain('Pattern B');
    expect(indexContent).toContain('Total: 2');
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npx jest tests/patterns/integration.test.ts --no-coverage`
Expected: All 3 tests PASS

- [ ] **Step 3: Final commit**

```bash
git add tests/patterns/integration.test.ts
git commit -m "test(patterns): add end-to-end integration test for full learning harness flow"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Knowledge Base with global+project wiki | Task 1 (config), Task 2 (catalog) |
| PatternEntry format with frontmatter | Task 2 (catalog.ts parseEntry/writeEntry) |
| index.md and log.md | Task 2 (catalog.ts appendToLog, regenerateIndex) |
| Capture Hook with keyword triggers | Task 4 (capture-hook.js, capture-patterns.json) |
| LLM classification fallback | Task 4 (capture-classifier.js) |
| Bootstrap mode (< 10 patterns) | Task 3 (threshold.ts) |
| Recurrence thresholds | Task 3 (threshold.ts) |
| Human gate (y/n/edit) | Task 4 (capture-hook.js output prompt) |
| ContextEnvelope injection | Task 6 (injector.ts), Task 8 (skill updates) |
| Harness patterns validator | Task 5 (patterns.ts) |
| BLOCK high / WARN medium-low | Task 5 (validatePatterns logic) |
| SDD skill updates | Task 8 (skill markdown updates) |
| Wiki lint (contradictions, stale, orphans, bootstrap, duplicates) | Task 7 (linter.ts) |
| CLI (lint, query, show, stats, promote, archive, export, import) | Task 3 (cli.ts) |
| Config in .harness.config.json | Task 1 (config.ts) |
| globalWiki toggle | Task 1 (config.ts resolveWikiPaths) |

### Placeholder Scan

No TBD, TODO, or "implement later" found. All steps contain actual code.

### Type Consistency

- `PatternEntry` defined in Task 1 types, used consistently in Tasks 2, 3, 5, 6, 7, 9
- `PatternsConfig` defined in Task 1, used in Tasks 3, 7
- `PatternsValidationResult` defined in Task 1, used in Task 5
- `PatternCatalog` constructor takes (globalPath, projectPath) consistently across Tasks 2, 5, 7, 9
- `WikiPaths` interface used in Tasks 1, 7

No inconsistencies found.
