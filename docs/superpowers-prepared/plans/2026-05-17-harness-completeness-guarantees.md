# Harness Completeness & Integration Guarantees — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Agentic Development Harness with semantic completeness verification, dead code detection, enhanced subagent context injection, and spec-implementation drift analysis. These components close the gap between technical validation (lint/test/coverage) and actual spec fulfillment.

**Architecture:** New modules in `lib/harness/` that integrate with the existing validation pipeline. TypeScript throughout. AST parsing via `@typescript-eslint/typescript-estree` (or equivalent per-stack).

**Tech Stack:** TypeScript, Node.js, AST parsing libraries, existing harness infrastructure.

**Parent Spec:** [2026-05-17-harness-completeness-addendum.md](../specs/2026-05-17-harness-completeness-addendum.md)

---

## File Structure

### New Files to Create

**Completeness Verification:**
- `lib/harness/completeness/types.ts` — Completeness-specific types
- `lib/harness/completeness/spec-parser.ts` — ACCriteriaExtractor (multi-format)
- `lib/harness/completeness/implementation-matcher.ts` — Maps ACs to code evidence
- `lib/harness/completeness/coverage-cross-ref.ts` — Validates ACs have tests
- `lib/harness/completeness/verifier.ts` — CompletenessVerifier orchestrator

**Dead Code Detection:**
- `lib/harness/deadcode/types.ts` — Dead code-specific types
- `lib/harness/deadcode/symbol-extractor.ts` — Lists new symbols from task
- `lib/harness/deadcode/import-graph.ts` — Builds import/usage graph
- `lib/harness/deadcode/reachability.ts` — Checks symbol reachability
- `lib/harness/deadcode/detector.ts` — DeadCodeDetector orchestrator

**Context Injection:**
- `lib/harness/context/types.ts` — ContextEnvelope type
- `lib/harness/context/envelope-builder.ts` — Builds ContextEnvelope from spec + boundary
- `lib/harness/context/prompt-template.md` — Subagent prompt template

**Drift Analysis:**
- `lib/harness/drift/types.ts` — Drift-specific types
- `lib/harness/drift/spec-reader.ts` — Loads and parses spec
- `lib/harness/drift/semantic-diff.ts` — Compares spec vs implementation
- `lib/harness/drift/gap-classifier.ts` — Categorizes gaps
- `lib/harness/drift/analyzer.ts` — Drift analyzer orchestrator

**Updated/Extended:**
- `lib/harness/types.ts` — Add completeness/deadcode/drift types
- `lib/harness/index.ts` — Add completeness, deadcode, drift to pipeline
- `lib/harness/reporter.ts` — Add completeness/deadcode/drift report formatters
- `lib/harness/boundary.ts` — Extend to support ContextEnvelope
- `tools/harness/cli.ts` — Add `explain-drift` command
- `skills/harness-verify/SKILL.md` — Update with new verification steps
- `skills/extract-boundary/SKILL.md` — Replace with enhanced context injection

---

## Wave 1: Completeness Types + Spec Parser (Independent)

### Task 1: Completeness Types

**Files:**
- Create: `lib/harness/completeness/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// lib/harness/completeness/types.ts

export interface AcceptanceCriterion {
  id: string;
  description: string;
  keywords: string[];
  type: 'functional' | 'non-functional' | 'edge-case' | 'security';
}

export interface ACEvidence {
  ac: AcceptanceCriterion;
  codeEvidence: {
    found: boolean;
    files: string[];
    symbols: string[];
    confidence: 'high' | 'medium' | 'low';
  };
  testEvidence: {
    found: boolean;
    testFiles: string[];
    testNames: string[];
    coversEdgeCases: boolean;
  };
  status: 'implemented' | 'partial' | 'missing';
  gapDescription?: string;
}

export interface CompletenessReport {
  taskId: string;
  specTitle: string;
  timestamp: string;
  criteria: ACEvidence[];
  summary: {
    total: number;
    implemented: number;
    partial: number;
    missing: number;
    score: number;
  };
  overallStatus: 'pass' | 'partial' | 'fail';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc lib/harness/completeness/types.ts --noEmit --skipLibCheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/harness/completeness/types.ts
git commit -m "feat(harness-completeness): add types for acceptance criterion tracking"
```

---

### Task 2: Spec Parser (ACCriteriaExtractor)

**Files:**
- Create: `lib/harness/completeness/spec-parser.ts`
- Depends on: `lib/harness/completeness/types.ts`

- [ ] **Step 1: Write the spec parser**

```typescript
// lib/harness/completeness/spec-parser.ts

import * as fs from 'fs';
import { AcceptanceCriterion } from './types';

interface SpecParser {
  format: 'numbered' | 'gherkin' | 'user-story' | 'checklist';
  detect(content: string): boolean;
  extract(content: string): AcceptanceCriterion[];
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'all', 'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .filter((v, i, a) => a.indexOf(v) === i);
}

const parsers: SpecParser[] = [
  {
    format: 'numbered',
    detect: (c) => /(?:AC[-\s]?\d+|^\d+\.\s+[A-Z])/.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const regex = /(?:AC[-\s]?(\d+)|^(\d+)\.\s+([A-Z][^\n]+))/gm;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const id = `AC-${match[1] || match[2]}`;
        const desc = (match[3] || match[0]).trim();
        criteria.push({ id, description: desc, keywords: extractKeywords(desc), type: 'functional' });
      }
      return criteria;
    },
  },
  {
    format: 'gherkin',
    detect: (c) => /Given.*When.*Then/s.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const blocks = content.split(/(?=Given\b)/i);
      blocks.forEach((block, i) => {
        const givenMatch = block.match(/Given\s+(.+?)(?=When|$)/is);
        const whenMatch = block.match(/When\s+(.+?)(?=Then|$)/is);
        const thenMatch = block.match(/Then\s+(.+?)(?=Given|When|$)/is);
        if (whenMatch && thenMatch) {
          const desc = `When ${whenMatch[1].trim()} then ${thenMatch[1].trim()}`;
          criteria.push({ id: `AC-${i + 1}`, description: desc, keywords: extractKeywords(desc), type: 'functional' });
        }
      });
      return criteria;
    },
  },
  {
    format: 'checklist',
    detect: (c) => /-\s*\[\s*\]\s+/.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const regex = /-\s*\[\s*\]\s+(.+)/g;
      let match;
      let idx = 1;
      while ((match = regex.exec(content)) !== null) {
        const desc = match[1].trim();
        criteria.push({ id: `AC-${idx++}`, description: desc, keywords: extractKeywords(desc), type: 'functional' });
      }
      return criteria;
    },
  },
  {
    format: 'user-story',
    detect: (c) => /As a\s+.*I want\s+.*So that\s+/is.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const acSection = content.split(/Acceptance Criteria:?\s*/i)[1];
      if (!acSection) return criteria;
      const lines = acSection.split('\n').filter(l => l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
      lines.forEach((line, i) => {
        const desc = line.replace(/^[-\d.\s]+/, '').trim();
        if (desc) criteria.push({ id: `AC-${i + 1}`, description: desc, keywords: extractKeywords(desc), type: 'functional' });
      });
      return criteria;
    },
  },
];

export function parseSpec(filePath: string): { title: string; criteria: AcceptanceCriterion[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filePath.split('/').pop() || 'Unknown';

  for (const parser of parsers) {
    if (parser.detect(content)) {
      return { title, criteria: parser.extract(content) };
    }
  }

  // Fallback: try all parsers and merge results
  const allCriteria: AcceptanceCriterion[] = [];
  for (const parser of parsers) {
    allCriteria.push(...parser.extract(content));
  }
  return { title, criteria: allCriteria };
}

export function detectSpecFormat(content: string): string {
  for (const parser of parsers) {
    if (parser.detect(content)) return parser.format;
  }
  return 'unknown';
}
```

- [ ] **Step 2: Write tests for spec parser**

```typescript
// tests/harness/completeness/spec-parser.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseSpec, detectSpecFormat } from '../../../lib/harness/completeness/spec-parser';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('parseSpec - numbered format', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('parses AC-1, AC-2 format', () => {
    const spec = `# Auth Middleware\n\nAC-1: Return 401 for unauthenticated requests\nAC-2: Validate JWT token format`;
    fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);
    const result = parseSpec(path.join(TEST_DIR, 'spec.md'));
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].id).toBe('AC-1');
    expect(result.criteria[1].id).toBe('AC-2');
  });

  test('parses numbered list format', () => {
    const spec = `# Feature\n\n1. User can login with email\n2. User can reset password`;
    fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);
    const result = parseSpec(path.join(TEST_DIR, 'spec.md'));
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].id).toBe('AC-1');
  });
});

describe('parseSpec - checklist format', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('parses checklist items', () => {
    const spec = `# Tasks\n\n- [ ] Implement login endpoint\n- [ ] Add password validation`;
    fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);
    const result = parseSpec(path.join(TEST_DIR, 'spec.md'));
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].description).toBe('Implement login endpoint');
  });
});

describe('detectSpecFormat', () => {
  test('detects numbered format', () => {
    expect(detectSpecFormat('AC-1: Do something')).toBe('numbered');
  });

  test('detects gherkin format', () => {
    expect(detectSpecFormat('Given user is logged in\nWhen they click save\nThen data is persisted')).toBe('gherkin');
  });

  test('detects checklist format', () => {
    expect(detectSpecFormat('- [ ] Task one\n- [ ] Task two')).toBe('checklist');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest tests/harness/completeness/spec-parser.test.ts -v`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/harness/completeness/spec-parser.ts tests/harness/completeness/spec-parser.test.ts
git commit -m "feat(harness-completeness): add spec parser with multi-format AC extraction"
```

---

## Wave 2: Implementation Matcher + Completeness Verifier (Depends on Wave 1)

### Task 3: Implementation Matcher

**Files:**
- Create: `lib/harness/completeness/implementation-matcher.ts`
- Depends on: `lib/harness/completeness/types.ts`, `lib/harness/completeness/spec-parser.ts`

- [ ] **Step 1: Write the implementation matcher**

```typescript
// lib/harness/completeness/implementation-matcher.ts

import * as fs from 'fs';
import * as path from 'path';
import { AcceptanceCriterion, ACEvidence } from './types';

export interface MatchConfig {
  projectRoot: string;
  sourceDirs: string[];   // e.g., ['src', 'lib', 'app']
  testDirs: string[];     // e.g., ['tests', '__tests__', 'spec']
  fileExtensions: string[]; // e.g., ['.ts', '.tsx', '.js']
}

const DEFAULT_CONFIG: MatchConfig = {
  projectRoot: process.cwd(),
  sourceDirs: ['src', 'lib', 'app', 'pages', 'components'],
  testDirs: ['tests', '__tests__', 'spec', 'test'],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
};

function searchInFiles(keywords: string[], dirs: string[], root: string, extensions: string[]): { files: string[]; matches: Map<string, string[]> } {
  const results: { files: string[]; matches: Map<string, string[]> } = { files: [], matches: new Map() };

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist', 'build', 'coverage'].includes(entry.name)) {
            scanDir(fullPath);
          }
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const matchedKeywords = keywords.filter(kw => content.toLowerCase().includes(kw.toLowerCase()));
            if (matchedKeywords.length > 0) {
              results.files.push(fullPath);
              results.matches.set(fullPath, matchedKeywords);
            }
          } catch { /* skip unreadable files */ }
        }
      }
    } catch { /* skip inaccessible dirs */ }
  }

  for (const dir of dirs) {
    scanDir(path.join(root, dir));
  }

  return results;
}

function extractSymbols(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const symbols: string[] = [];

    // Match function declarations, class declarations, const exports
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    const constRegex = /export\s+(?:const|let|var)\s+(\w+)/g;

    let match;
    while ((match = funcRegex.exec(content)) !== null) symbols.push(match[1]);
    while ((match = classRegex.exec(content)) !== null) symbols.push(match[1]);
    while ((match = constRegex.exec(content)) !== null) symbols.push(match[1]);

    return symbols;
  } catch {
    return [];
  }
}

export function matchAC(criteria: AcceptanceCriterion[], config: Partial<MatchConfig> = {}): ACEvidence[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const allSourceFiles = new Set<string>();
  const allTestFiles = new Set<string>();

  // Collect all source and test files
  function collectFiles(dirs: string[], target: Set<string>) {
    for (const dir of dirs) {
      const dirPath = path.join(cfg.projectRoot, dir);
      if (!fs.existsSync(dirPath)) continue;
      function scan(d: string) {
        try {
          const entries = fs.readdirSync(d, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory() && !['node_modules', '.git', '.next', 'dist'].includes(entry.name)) scan(full);
            else if (cfg.fileExtensions.some(ext => entry.name.endsWith(ext))) target.add(full);
          }
        } catch { /* skip */ }
      }
      scan(dirPath);
    }
  }

  collectFiles(cfg.sourceDirs, allSourceFiles);
  collectFiles(cfg.testDirs, allTestFiles);

  return criteria.map(ac => {
    // Search for code evidence
    const codeResult = searchInFiles(ac.keywords, cfg.sourceDirs, cfg.projectRoot, cfg.fileExtensions);
    const codeFound = codeResult.files.length > 0;
    const codeSymbols = codeResult.files.flatMap(f => extractSymbols(f));

    // Search for test evidence
    const testResult = searchInFiles([ac.id, ...ac.keywords], cfg.testDirs, cfg.projectRoot, cfg.fileExtensions);
    const testFound = testResult.files.length > 0;

    // Determine status
    let status: ACEvidence['status'];
    let gapDescription: string | undefined;

    if (codeFound && testFound) {
      status = 'implemented';
    } else if (codeFound && !testFound) {
      status = 'partial';
      gapDescription = `Code found (${codeResult.files.length} files) but no matching test`;
    } else if (!codeFound && testFound) {
      status = 'partial';
      gapDescription = `Test found but no matching implementation code`;
    } else {
      status = 'missing';
      gapDescription = `No code or test evidence found for: ${ac.description}`;
    }

    return {
      ac,
      codeEvidence: {
        found: codeFound,
        files: codeResult.files.slice(0, 5), // Limit to avoid token bloat
        symbols: codeSymbols.slice(0, 10),
        confidence: codeResult.files.length > 2 ? 'high' : codeFound ? 'medium' : 'low',
      },
      testEvidence: {
        found: testFound,
        testFiles: testResult.files.slice(0, 5),
        testNames: [], // Would need test framework parsing to extract names
        coversEdgeCases: false, // Would need deeper analysis
      },
      status,
      gapDescription,
    };
  });
}
```

- [ ] **Step 2: Write tests for implementation matcher**

```typescript
// tests/harness/completeness/implementation-matcher.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { matchAC } from '../../../lib/harness/completeness/implementation-matcher';
import { AcceptanceCriterion } from '../../../lib/harness/completeness/types';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('matchAC', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('finds implemented AC when code and test exist', () => {
    const srcDir = path.join(TEST_DIR, 'src');
    const testDir = path.join(TEST_DIR, 'tests');
    fs.mkdirSync(srcDir);
    fs.mkdirSync(testDir);

    fs.writeFileSync(path.join(srcDir, 'auth.ts'), `export function authenticateUser(token: string) { /* validate JWT token */ }`);
    fs.writeFileSync(path.join(testDir, 'auth.test.ts'), `test('AC-1: should authenticate user with valid JWT token', () => {});`);

    const criteria: AcceptanceCriterion[] = [
      { id: 'AC-1', description: 'Authenticate user with valid JWT token', keywords: ['authenticate', 'user', 'jwt', 'token'], type: 'functional' },
    ];

    const results = matchAC(criteria, { projectRoot: TEST_DIR, sourceDirs: ['src'], testDirs: ['tests'], fileExtensions: ['.ts'] });
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('implemented');
    expect(results[0].codeEvidence.found).toBe(true);
    expect(results[0].testEvidence.found).toBe(true);
  });

  test('marks AC as partial when only code exists', () => {
    const srcDir = path.join(TEST_DIR, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'auth.ts'), `export function validateToken(token: string) { }`);

    const criteria: AcceptanceCriterion[] = [
      { id: 'AC-2', description: 'Validate token format and expiry', keywords: ['validate', 'token', 'format', 'expiry'], type: 'functional' },
    ];

    const results = matchAC(criteria, { projectRoot: TEST_DIR, sourceDirs: ['src'], testDirs: ['tests'], fileExtensions: ['.ts'] });
    expect(results[0].status).toBe('partial');
    expect(results[0].gapDescription).toContain('no matching test');
  });

  test('marks AC as missing when no evidence found', () => {
    const srcDir = path.join(TEST_DIR, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'other.ts'), `export function unrelated() { }`);

    const criteria: AcceptanceCriterion[] = [
      { id: 'AC-3', description: 'Implement role-based access control', keywords: ['role', 'access', 'control', 'rbac'], type: 'functional' },
    ];

    const results = matchAC(criteria, { projectRoot: TEST_DIR, sourceDirs: ['src'], testDirs: ['tests'], fileExtensions: ['.ts'] });
    expect(results[0].status).toBe('missing');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest tests/harness/completeness/implementation-matcher.test.ts -v`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/harness/completeness/implementation-matcher.ts tests/harness/completeness/implementation-matcher.test.ts
git commit -m "feat(harness-completeness): add implementation matcher for AC-to-code mapping"
```

---

### Task 4: Completeness Verifier Orchestrator

**Files:**
- Create: `lib/harness/completeness/verifier.ts`
- Create: `lib/harness/completeness/coverage-cross-ref.ts`
- Depends on: All Wave 1 + Task 3 files

- [ ] **Step 1: Write coverage cross-ref**

```typescript
// lib/harness/completeness/coverage-cross-ref.ts

import * as fs from 'fs';
import * as path from 'path';
import { ACEvidence } from './types';

export function crossRefWithCoverage(evidence: ACEvidence[], coverageReportPath?: string): ACEvidence[] {
  if (!coverageReportPath || !fs.existsSync(coverageReportPath)) return evidence;

  try {
    const coverageData = JSON.parse(fs.readFileSync(coverageReportPath, 'utf-8'));
    return evidence.map(ev => {
      if (ev.status === 'implemented' && ev.codeEvidence.files.length > 0) {
        // Check if the files implementing this AC have coverage
        const fileCoverage = ev.codeEvidence.files.map(f => {
          const relativePath = f.split('/src/')[1] || f.split('/lib/')[1] || path.basename(f);
          return coverageData[relativePath] || coverageData[path.basename(f)];
        }).filter(Boolean);

        if (fileCoverage.length > 0) {
          const avgCoverage = fileCoverage.reduce((sum: number, c: any) => sum + (c.lines?.pct || 0), 0) / fileCoverage.length;
          ev.testEvidence.coversEdgeCases = avgCoverage >= 80;
        }
      }
      return ev;
    });
  } catch {
    return evidence;
  }
}
```

- [ ] **Step 2: Write the verifier orchestrator**

```typescript
// lib/harness/completeness/verifier.ts

import * as path from 'path';
import { AcceptanceCriterion, ACEvidence, CompletenessReport } from './types';
import { parseSpec } from './spec-parser';
import { matchAC, MatchConfig } from './implementation-matcher';
import { crossRefWithCoverage } from './coverage-cross-ref';

export interface CompletenessOptions {
  specPath: string;
  projectRoot?: string;
  coverageReportPath?: string;
  minScore?: number; // Default: 100 (all ACs must be implemented)
}

export async function verifyCompleteness(options: CompletenessOptions): Promise<CompletenessReport> {
  const projectRoot = options.projectRoot || process.cwd();
  const minScore = options.minScore ?? 100;

  // Step 1: Parse spec to extract ACs
  const { title, criteria } = parseSpec(options.specPath);

  if (criteria.length === 0) {
    return {
      taskId: path.basename(options.specPath),
      specTitle: title,
      timestamp: new Date().toISOString(),
      criteria: [],
      summary: { total: 0, implemented: 0, partial: 0, missing: 0, score: 100 },
      overallStatus: 'pass',
    };
  }

  // Step 2: Match ACs to implementation
  const matchConfig: Partial<MatchConfig> = { projectRoot };
  let evidence = matchAC(criteria, matchConfig);

  // Step 3: Cross-reference with coverage if available
  if (options.coverageReportPath) {
    evidence = crossRefWithCoverage(evidence, options.coverageReportPath);
  }

  // Step 4: Compute summary
  const implemented = evidence.filter(e => e.status === 'implemented').length;
  const partial = evidence.filter(e => e.status === 'partial').length;
  const missing = evidence.filter(e => e.status === 'missing').length;
  const total = evidence.length;
  const score = total > 0 ? Math.round((implemented / total) * 100) : 100;

  let overallStatus: CompletenessReport['overallStatus'];
  if (score >= minScore) overallStatus = 'pass';
  else if (score >= 50) overallStatus = 'partial';
  else overallStatus = 'fail';

  return {
    taskId: path.basename(options.specPath),
    specTitle: title,
    timestamp: new Date().toISOString(),
    criteria: evidence,
    summary: { total, implemented, partial, missing, score },
    overallStatus,
  };
}

export function formatCompletenessMarkdown(report: CompletenessReport): string {
  const lines: string[] = [];
  lines.push(`# Completeness Report — ${report.specTitle}`);
  lines.push(`Date: ${report.timestamp} | Score: ${report.summary.score}%`);
  lines.push('');

  lines.push('## Acceptance Criteria Status');
  for (const ev of report.criteria) {
    const icon = ev.status === 'implemented' ? '✅' : ev.status === 'partial' ? '⚠️' : '❌';
    lines.push(`${icon} ${ev.ac.id}: ${ev.ac.description}`);

    if (ev.codeEvidence.found) {
      lines.push(`   Code: ${ev.codeEvidence.files[0]} (${ev.codeEvidence.symbols.slice(0, 3).join(', ')})`);
    } else {
      lines.push(`   Code: NOT FOUND`);
    }

    if (ev.testEvidence.found) {
      lines.push(`   Test: ${ev.testEvidence.testFiles[0]}`);
    } else {
      lines.push(`   Test: NOT FOUND`);
    }

    if (ev.gapDescription) {
      lines.push(`   Gap: ${ev.gapDescription}`);
    }
    lines.push('');
  }

  lines.push('## Summary');
  const s = report.summary;
  lines.push(`- Implemented: ${s.implemented}/${s.total} (${Math.round(s.implemented / s.total * 100)}%)`);
  lines.push(`- Partial: ${s.partial}/${s.total}`);
  lines.push(`- Missing: ${s.missing}/${s.total}`);
  lines.push(`- Overall: ${report.overallStatus.toUpperCase()}${report.overallStatus !== 'pass' ? ` — ${s.missing} ACs missing, ${s.partial} partial` : ''}`);

  return lines.join('\n');
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/harness/completeness/verifier.ts lib/harness/completeness/coverage-cross-ref.ts
git commit -m "feat(harness-completeness): add completeness verifier orchestrator and coverage cross-ref"
```

---

## Wave 3: Dead Code Detection (Depends on Wave 1 types)

### Task 5: Dead Code Types + Symbol Extractor

**Files:**
- Create: `lib/harness/deadcode/types.ts`
- Create: `lib/harness/deadcode/symbol-extractor.ts`

- [ ] **Step 1: Write dead code types**

```typescript
// lib/harness/deadcode/types.ts

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'component' | 'route' | 'type' | 'constant';
  file: string;
  line: number;
  exported: boolean;
}

export interface ReachabilityResult {
  symbol: SymbolInfo;
  isReachable: boolean;
  reachableFrom?: string[];
  importedBy?: string[];
  status: 'connected' | 'isolated' | 'dead';
  specExpected: boolean;
  recommendation: string;
}

export interface DeadCodeReport {
  taskId: string;
  timestamp: string;
  symbolsAnalyzed: number;
  results: ReachabilityResult[];
  summary: {
    connected: number;
    isolated: number;
    dead: number;
    integrationGaps: number;
  };
}
```

- [ ] **Step 2: Write symbol extractor**

```typescript
// lib/harness/deadcode/symbol-extractor.ts

import * as fs from 'fs';
import * as path from 'path';
import { SymbolInfo } from './types';

export function extractSymbols(filePath: string): SymbolInfo[] {
  if (!fs.existsSync(filePath)) return [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const symbols: SymbolInfo[] = [];
    const lines = content.split('\n');

    const patterns: { regex: RegExp; kind: SymbolInfo['kind'] }[] = [
      { regex: /export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/g, kind: 'function' },
      { regex: /export\s+(?:default\s+)?class\s+(\w+)/g, kind: 'class' },
      { regex: /export\s+const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g, kind: 'function' },
      { regex: /export\s+const\s+(\w+)\s*=/g, kind: 'constant' },
      { regex: /export\s+(?:type|interface)\s+(\w+)/g, kind: 'type' },
      { regex: /export\s+default\s+function/g, kind: 'component' },
    ];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      for (const { regex, kind } of patterns) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const name = match[1] || (kind === 'component' ? path.basename(filePath, path.extname(filePath)) : 'default');
          symbols.push({
            name,
            kind,
            file: filePath,
            line: lineIdx + 1,
            exported: true,
          });
        }
      }
    }

    return symbols;
  } catch {
    return [];
  }
}

export function extractSymbolsFromFiles(filePaths: string[]): SymbolInfo[] {
  return filePaths.flatMap(f => extractSymbols(f));
}
```

- [ ] **Step 3: Write tests for symbol extractor**

```typescript
// tests/harness/deadcode/symbol-extractor.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { extractSymbols } from '../../../lib/harness/deadcode/symbol-extractor';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('extractSymbols', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('extracts exported functions', () => {
    const file = path.join(TEST_DIR, 'auth.ts');
    fs.writeFileSync(file, `export function authenticate() {}\nexport async function validateToken() {}`);
    const symbols = extractSymbols(file);
    expect(symbols).toHaveLength(2);
    expect(symbols[0].name).toBe('authenticate');
    expect(symbols[0].kind).toBe('function');
  });

  test('extracts exported classes', () => {
    const file = path.join(TEST_DIR, 'service.ts');
    fs.writeFileSync(file, `export class AuthService {}`);
    const symbols = extractSymbols(file);
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('AuthService');
    expect(symbols[0].kind).toBe('class');
  });

  test('extracts arrow function exports', () => {
    const file = path.join(TEST_DIR, 'handler.ts');
    fs.writeFileSync(file, `export const handleRequest = (req, res) => {}`);
    const symbols = extractSymbols(file);
    expect(symbols.some(s => s.name === 'handleRequest')).toBe(true);
  });

  test('returns empty for non-existent file', () => {
    expect(extractSymbols('/nonexistent/file.ts')).toEqual([]);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx jest tests/harness/deadcode/symbol-extractor.test.ts -v`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/harness/deadcode/types.ts lib/harness/deadcode/symbol-extractor.ts tests/harness/deadcode/symbol-extractor.test.ts
git commit -m "feat(harness-deadcode): add types and symbol extractor"
```

---

### Task 6: Import Graph + Reachability + Detector

**Files:**
- Create: `lib/harness/deadcode/import-graph.ts`
- Create: `lib/harness/deadcode/reachability.ts`
- Create: `lib/harness/deadcode/detector.ts`

- [ ] **Step 1: Write import graph builder**

```typescript
// lib/harness/deadcode/import-graph.ts

import * as fs from 'fs';
import * as path from 'path';

export interface ImportEdge {
  from: string;
  to: string;
  importedSymbols: string[];
}

export function buildImportGraph(projectRoot: string, fileExtensions: string[] = ['.ts', '.tsx', '.js']): ImportEdge[] {
  const edges: ImportEdge[] = [];
  const importRegex = /(?:import\s+(?:.*?\s+from\s+)?['"](.+?)['"]|require\(['"](.+?)['"]\))/g;

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
          scanDir(fullPath);
        } else if (fileExtensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            let match;
            while ((match = importRegex.exec(content)) !== null) {
              const importPath = match[1] || match[2];
              if (importPath.startsWith('.')) {
                const resolved = resolveImport(fullPath, importPath, projectRoot, fileExtensions);
                if (resolved) {
                  edges.push({ from: fullPath, to: resolved, importedSymbols: [] });
                }
              }
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
  }

  scanDir(projectRoot);
  return edges;
}

function resolveImport(fromFile: string, importPath: string, projectRoot: string, extensions: string[]): string | null {
  const fromDir = path.dirname(fromFile);
  const candidate = path.resolve(fromDir, importPath);

  // Try exact path
  if (fs.existsSync(candidate)) return candidate;

  // Try with extensions
  for (const ext of extensions) {
    if (fs.existsSync(candidate + ext)) return candidate + ext;
    if (fs.existsSync(candidate + '/index' + ext)) return candidate + '/index' + ext;
  }

  return null;
}

export function getImporters(filePath: string, edges: ImportEdge[]): string[] {
  return edges.filter(e => e.to === filePath).map(e => e.from);
}
```

- [ ] **Step 2: Write reachability analyzer**

```typescript
// lib/harness/deadcode/reachability.ts

import * as fs from 'fs';
import { SymbolInfo, ReachabilityResult } from './types';
import { ImportEdge, getImporters } from './import-graph';

const ENTRY_POINT_PATTERNS = [
  /pages\/.*\.(ts|tsx|js)$/,           // Next.js pages
  /app\/.*\/page\.(ts|tsx|js)$/,       // Next.js app router
  /src\/main\.(ts|js)$/,               // Express/Node entry
  /src\/index\.(ts|js)$/,              // Library entry
  /Program\.cs$/,                       // .NET entry
  /main\.go$/,                          // Go entry
];

function isEntryPoint(filePath: string): boolean {
  return ENTRY_POINT_PATTERNS.some(p => p.test(filePath));
}

function isReachableFromEntry(symbolFile: string, edges: ImportEdge[], visited: Set<string> = new Set()): boolean {
  if (visited.has(symbolFile)) return false;
  visited.add(symbolFile);

  if (isEntryPoint(symbolFile)) return true;

  const importers = getImporters(symbolFile, edges);
  return importers.some(importer => isReachableFromEntry(importer, edges, visited));
}

export function analyzeReachability(
  symbols: SymbolInfo[],
  edges: ImportEdge[],
  specKeywords: string[] = []
): ReachabilityResult[] {
  return symbols.map(symbol => {
    const importers = getImporters(symbol.file, edges);
    const isReachable = isReachableFromEntry(symbol.file, edges);
    const specExpected = specKeywords.some(kw => symbol.name.toLowerCase().includes(kw.toLowerCase()));

    let status: ReachabilityResult['status'];
    let recommendation: string;

    if (isReachable) {
      status = 'connected';
      recommendation = 'Symbol is properly integrated';
    } else if (importers.length > 0) {
      status = 'isolated';
      recommendation = specExpected
        ? `Symbol is expected by spec but not reachable from entry points — check integration`
        : `Symbol is imported but not reachable from entry points — may be dead code`;
    } else {
      status = 'dead';
      recommendation = specExpected
        ? `Symbol is expected by spec but never imported — implement integration`
        : `Symbol is never imported and not mentioned in spec — consider removing`;
    }

    return {
      symbol,
      isReachable,
      importedBy: importers,
      status,
      specExpected,
      recommendation,
    };
  });
}
```

- [ ] **Step 3: Write dead code detector orchestrator**

```typescript
// lib/harness/deadcode/detector.ts

import * as path from 'path';
import { SymbolInfo, ReachabilityResult, DeadCodeReport } from './types';
import { extractSymbolsFromFiles } from './symbol-extractor';
import { buildImportGraph } from './import-graph';
import { analyzeReachability } from './reachability';

export interface DeadCodeOptions {
  taskFiles: string[];       // Files created/modified by the task
  projectRoot?: string;
  specKeywords?: string[];   // Keywords from spec to check if symbols are expected
}

export function detectDeadCode(options: DeadCodeOptions): DeadCodeReport {
  const projectRoot = options.projectRoot || process.cwd();

  // Step 1: Extract symbols from task files
  const symbols = extractSymbolsFromFiles(options.taskFiles);

  // Step 2: Build import graph for the project
  const edges = buildImportGraph(projectRoot);

  // Step 3: Analyze reachability
  const results = analyzeReachability(symbols, edges, options.specKeywords || []);

  // Step 4: Compute summary
  const connected = results.filter(r => r.status === 'connected').length;
  const isolated = results.filter(r => r.status === 'isolated').length;
  const dead = results.filter(r => r.status === 'dead').length;
  const integrationGaps = results.filter(r => r.status !== 'connected' && r.specExpected).length;

  return {
    taskId: path.basename(projectRoot),
    timestamp: new Date().toISOString(),
    symbolsAnalyzed: symbols.length,
    results,
    summary: { connected, isolated, dead, integrationGaps },
  };
}

export function formatDeadCodeMarkdown(report: DeadCodeReport): string {
  const lines: string[] = [];
  lines.push(`# Dead Code Report — ${report.taskId}`);
  lines.push(`Date: ${report.timestamp}`);
  lines.push('');

  lines.push('## Analysis');
  for (const r of report.results) {
    const icon = r.status === 'connected' ? '✅' : r.status === 'isolated' ? '⚠️' : '❌';
    lines.push(`${icon} ${r.symbol.file}:${r.symbol.line}:${r.symbol.name} — ${r.status}`);
    if (r.specExpected) lines.push(`   Spec mentions this → likely should be connected`);
    lines.push(`   ${r.recommendation}`);
    lines.push('');
  }

  lines.push('## Summary');
  const s = report.summary;
  lines.push(`- Connected: ${s.connected}`);
  lines.push(`- Isolated: ${s.isolated}`);
  lines.push(`- Dead: ${s.dead}`);
  lines.push(`- Integration gaps: ${s.integrationGaps}`);

  return lines.join('\n');
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/harness/deadcode/import-graph.ts lib/harness/deadcode/reachability.ts lib/harness/deadcode/detector.ts
git commit -m "feat(harness-deadcode): add import graph, reachability analysis, and detector"
```

---

## Wave 4: Drift Analysis (Depends on Wave 1 + 2)

### Task 7: Drift Types + Spec Reader

**Files:**
- Create: `lib/harness/drift/types.ts`
- Create: `lib/harness/drift/spec-reader.ts`

- [ ] **Step 1: Write drift types**

```typescript
// lib/harness/drift/types.ts

export interface DriftItem {
  requirement: string;
  requirementId: string;
  status: 'aligned' | 'missing' | 'partial' | 'divergent' | 'extra';
  severity: 'critical' | 'high' | 'medium' | 'low';
  specDescription: string;
  implementationSummary: string;
  files: string[];
  gapDescription: string;
  suggestedFix: string;
}

export interface DriftReport {
  feature: string;
  specFile: string;
  timestamp: string;
  items: DriftItem[];
  summary: {
    total: number;
    aligned: number;
    missing: number;
    partial: number;
    divergent: number;
    extra: number;
    healthScore: number;
  };
  overallStatus: 'aligned' | 'drift-detected' | 'critical-drift';
}
```

- [ ] **Step 2: Write spec reader**

```typescript
// lib/harness/drift/spec-reader.ts

import * as fs from 'fs';
import { AcceptanceCriterion } from '../completeness/types';
import { parseSpec } from '../completeness/spec-parser';

export interface SpecRequirement {
  id: string;
  type: 'acceptance-criterion' | 'architecture' | 'constraint' | 'non-functional';
  description: string;
  keywords: string[];
}

export function readSpecRequirements(specPath: string): { title: string; requirements: SpecRequirement[] } {
  const { title, criteria } = parseSpec(specPath);

  const requirements: SpecRequirement[] = criteria.map(c => ({
    id: c.id,
    type: 'acceptance-criterion',
    description: c.description,
    keywords: c.keywords,
  }));

  // Also extract architecture decisions and constraints from spec
  const content = fs.readFileSync(specPath, 'utf-8');

  // Extract architecture section
  const archSection = content.split(/##?\s*Architecture\s*/i)[1];
  if (archSection) {
    const archItems = archSection.split('\n').filter(l => l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
    archItems.forEach((line, i) => {
      const desc = line.replace(/^[-\d.\s]+/, '').trim();
      if (desc) requirements.push({ id: `ARCH-${i + 1}`, type: 'architecture', description: desc, keywords: desc.toLowerCase().split(/\s+/).filter(w => w.length > 3) });
    });
  }

  // Extract constraints section
  const constraintSection = content.split(/##?\s*Constraints?\s*/i)[1];
  if (constraintSection) {
    const constraintItems = constraintSection.split('\n').filter(l => l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
    constraintItems.forEach((line, i) => {
      const desc = line.replace(/^[-\d.\s]+/, '').trim();
      if (desc) requirements.push({ id: `CONST-${i + 1}`, type: 'constraint', description: desc, keywords: desc.toLowerCase().split(/\s+/).filter(w => w.length > 3) });
    });
  }

  return { title, requirements };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/harness/drift/types.ts lib/harness/drift/spec-reader.ts
git commit -m "feat(harness-drift): add drift types and spec reader"
```

---

### Task 8: Semantic Diff + Gap Classifier + Analyzer

**Files:**
- Create: `lib/harness/drift/semantic-diff.ts`
- Create: `lib/harness/drift/gap-classifier.ts`
- Create: `lib/harness/drift/analyzer.ts`

- [ ] **Step 1: Write semantic diff**

```typescript
// lib/harness/drift/semantic-diff.ts

import * as fs from 'fs';
import * as path from 'path';
import { SpecRequirement } from './spec-reader';

export interface ImplementationSummary {
  requirement: SpecRequirement;
  matchingFiles: string[];
  matchingSymbols: string[];
  keywordMatchCount: number;
  totalKeywords: number;
  matchRatio: number;
}

function searchProject(projectRoot: string, keywords: string[], extensions: string[] = ['.ts', '.tsx', '.js']): { files: string[]; symbols: string[] } {
  const files: string[] = [];
  const symbols: string[] = [];
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
  const classRegex = /(?:export\s+)?class\s+(\w+)/g;

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', '.next', 'dist'].includes(entry.name)) {
          scanDir(fullPath);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lowerContent = content.toLowerCase();
            const matchedKeywords = keywords.filter(kw => lowerContent.includes(kw.toLowerCase()));
            if (matchedKeywords.length > 0) {
              files.push(fullPath);
              let match;
              while ((match = funcRegex.exec(content)) !== null) symbols.push(match[1]);
              funcRegex.lastIndex = 0;
              while ((match = classRegex.exec(content)) !== null) symbols.push(match[1]);
              classRegex.lastIndex = 0;
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
  }

  scanDir(projectRoot);
  return { files, symbols };
}

export function computeSemanticDiff(requirements: SpecRequirement[], projectRoot: string): ImplementationSummary[] {
  return requirements.map(req => {
    const { files, symbols } = searchProject(projectRoot, req.keywords);
    const matchRatio = req.keywords.length > 0 ? files.length / Math.max(req.keywords.length, 1) : 0;

    return {
      requirement: req,
      matchingFiles: files.slice(0, 5),
      matchingSymbols: [...new Set(symbols)].slice(0, 10),
      keywordMatchCount: files.length,
      totalKeywords: req.keywords.length,
      matchRatio: Math.min(matchRatio, 1),
    };
  });
}
```

- [ ] **Step 2: Write gap classifier**

```typescript
// lib/harness/drift/gap-classifier.ts

import { DriftItem } from './types';
import { ImplementationSummary } from './semantic-diff';

export function classifyGaps(summaries: ImplementationSummary[], allProjectFiles: string[]): DriftItem[] {
  return summaries.map(summary => {
    const { requirement, matchingFiles, matchRatio } = summary;
    let status: DriftItem['status'];
    let severity: DriftItem['severity'];
    let implementationSummary: string;
    let gapDescription: string;
    let suggestedFix: string;

    if (matchingFiles.length === 0) {
      status = 'missing';
      severity = requirement.type === 'acceptance-criterion' ? 'critical' : 'high';
      implementationSummary = 'NOT FOUND — no implementation detected';
      gapDescription = `No code found matching requirement: ${requirement.description}`;
      suggestedFix = `Implement ${requirement.type}: ${requirement.description}`;
    } else if (matchRatio < 0.3) {
      status = 'partial';
      severity = 'high';
      implementationSummary = `Partial — ${matchingFiles.length} file(s) with limited keyword overlap`;
      gapDescription = `Implementation appears incomplete. Only ${Math.round(matchRatio * 100)}% of spec keywords found in code.`;
      suggestedFix = `Expand implementation to cover all aspects of: ${requirement.description}`;
    } else if (matchRatio < 0.7) {
      status = 'partial';
      severity = 'medium';
      implementationSummary = `Partial — ${matchingFiles.length} file(s) found, some gaps`;
      gapDescription = `Implementation covers most of the requirement but may be missing edge cases or details.`;
      suggestedFix = `Review implementation against full requirement: ${requirement.description}`;
    } else {
      status = 'aligned';
      severity = 'low';
      implementationSummary = `${matchingFiles.length} file(s) implementing this requirement`;
      gapDescription = '';
      suggestedFix = '';
    }

    return {
      requirement: requirement.description,
      requirementId: requirement.id,
      status,
      severity,
      specDescription: requirement.description,
      implementationSummary,
      files: matchingFiles,
      gapDescription,
      suggestedFix,
    };
  });
}

export function detectExtraFiles(allProjectFiles: string[], requirementsFiles: Set<string>): DriftItem[] {
  // This is a simplified version — a full implementation would use git diff to find task-specific new files
  return [];
}
```

- [ ] **Step 3: Write drift analyzer orchestrator**

```typescript
// lib/harness/drift/analyzer.ts

import * as path from 'path';
import { DriftItem, DriftReport } from './types';
import { readSpecRequirements } from './spec-reader';
import { computeSemanticDiff } from './semantic-diff';
import { classifyGaps } from './gap-classifier';

export interface DriftOptions {
  specPath: string;
  projectRoot?: string;
}

export function analyzeDrift(options: DriftOptions): DriftReport {
  const projectRoot = options.projectRoot || process.cwd();

  // Step 1: Read spec requirements
  const { title, requirements } = readSpecRequirements(options.specPath);

  // Step 2: Compute semantic diff
  const summaries = computeSemanticDiff(requirements, projectRoot);

  // Step 3: Classify gaps
  const items = classifyGaps(summaries, []);

  // Step 4: Compute summary
  const aligned = items.filter(i => i.status === 'aligned').length;
  const missing = items.filter(i => i.status === 'missing').length;
  const partial = items.filter(i => i.status === 'partial').length;
  const divergent = items.filter(i => i.status === 'divergent').length;
  const extra = items.filter(i => i.status === 'extra').length;
  const total = items.length;
  const healthScore = total > 0 ? Math.round((aligned / total) * 100) : 100;

  let overallStatus: DriftReport['overallStatus'];
  if (missing > 0 && missing > total * 0.3) overallStatus = 'critical-drift';
  else if (missing > 0 || partial > 0 || divergent > 0) overallStatus = 'drift-detected';
  else overallStatus = 'aligned';

  return {
    feature: title,
    specFile: options.specPath,
    timestamp: new Date().toISOString(),
    items,
    summary: { total, aligned, missing, partial, divergent, extra, healthScore },
    overallStatus,
  };
}

export function formatDriftMarkdown(report: DriftReport): string {
  const lines: string[] = [];
  lines.push(`# Drift Report — ${report.feature}`);
  lines.push(`Date: ${report.timestamp} | Health: ${report.summary.healthScore}% | Status: ${report.overallStatus.toUpperCase().replace('-', ' ')}`);
  lines.push('');

  lines.push('## Spec vs Implementation');
  for (const item of report.items) {
    const icon = item.status === 'aligned' ? '✅' : item.status === 'missing' ? '❌' : item.status === 'partial' ? '⚠️' : item.status === 'divergent' ? '🔄' : '➕';
    lines.push(`${icon} ${item.requirementId}: ${item.requirement}`);
    lines.push(`   Spec: ${item.specDescription}`);
    lines.push(`   Implementation: ${item.implementationSummary}`);
    if (item.gapDescription) lines.push(`   Gap: ${item.gapDescription}`);
    if (item.suggestedFix) lines.push(`   Fix: ${item.suggestedFix}`);
    lines.push('');
  }

  lines.push('## Summary');
  const s = report.summary;
  lines.push(`- Aligned: ${s.aligned}/${s.total}`);
  lines.push(`- Missing: ${s.missing}`);
  lines.push(`- Partial: ${s.partial}`);
  lines.push(`- Divergent: ${s.divergent}`);
  lines.push(`- Extra: ${s.extra}`);
  lines.push(`- Health Score: ${s.healthScore}%`);

  return lines.join('\n');
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/harness/drift/semantic-diff.ts lib/harness/drift/gap-classifier.ts lib/harness/drift/analyzer.ts
git commit -m "feat(harness-drift): add semantic diff, gap classifier, and drift analyzer"
```

---

## Wave 5: Integration + CLI + Skills (Depends on all previous waves)

### Task 9: Update Harness Index + Pipeline

**Files:**
- Modify: `lib/harness/index.ts`
- Modify: `lib/harness/reporter.ts`

- [ ] **Step 1: Update harness index with new pipeline steps**

Add completeness as step 1 in verify-local, dead-code and drift-analysis in verify-all:

```typescript
// Add to lib/harness/index.ts imports:
import { verifyCompleteness, formatCompletenessMarkdown } from './completeness/verifier';
import { detectDeadCode, formatDeadCodeMarkdown } from './deadcode/detector';
import { analyzeDrift, formatDriftMarkdown } from './drift/analyzer';

// Update verify() function to include completeness check before lint:
// Step 0: Completeness (NEW)
const completenessReport = await verifyCompleteness({
  specPath: options.specPath || findSpecForTask(cwd),
  projectRoot: cwd,
});
results.completeness = {
  passed: completenessReport.overallStatus === 'pass',
  errors: completenessReport.criteria.filter(c => c.status === 'missing').map(c => ({
    file: '', line: 0, column: 0,
    message: `AC ${c.ac.id} missing: ${c.ac.description}`,
    rule: 'completeness', severity: 'error' as const,
  })),
  warnings: completenessReport.criteria.filter(c => c.status === 'partial').map(c => `${c.ac.id} partial: ${c.gapDescription}`),
  duration: 0,
};

if (!results.completeness.passed) {
  // Include completeness report in output
  saveReport(/* ... */);
  return report;
}

// For verify-all, add dead-code and drift:
if (options.mode === 'verify-all') {
  // ... existing steps ...
  results.deadCode = detectDeadCode({ taskFiles: getTaskFiles(cwd), projectRoot: cwd });
  results.drift = analyzeDrift({ specPath: options.specPath || findSpecForTask(cwd), projectRoot: cwd });
}
```

- [ ] **Step 2: Update reporter with new report formatters**

Add completeness, deadcode, and drift report sections to `formatReportMarkdown`.

- [ ] **Step 3: Commit**

```bash
git add lib/harness/index.ts lib/harness/reporter.ts
git commit -m "feat(harness): integrate completeness, deadcode, and drift into verification pipeline"
```

---

### Task 10: CLI Command for /explain-drift

**Files:**
- Modify: `tools/harness/cli.ts`

- [ ] **Step 1: Add explain-drift command**

```typescript
// Add to tools/harness/cli.ts

import { analyzeDrift, formatDriftMarkdown } from '../../lib/harness/drift/analyzer';
import { verifyCompleteness, formatCompletenessMarkdown } from '../../lib/harness/completeness/verifier';
import { detectDeadCode, formatDeadCodeMarkdown } from '../../lib/harness/deadcode/detector';

// Add command handlers:
case 'explain-drift': {
  const specPath = args['--spec'] || findSpecForBranch();
  if (!specPath) { console.error('No spec found. Use --spec to specify path.'); process.exit(1); }
  const report = analyzeDrift({ specPath, projectRoot: args['--root'] || process.cwd() });
  console.log(formatDriftMarkdown(report));
  process.exit(report.overallStatus === 'aligned' ? 0 : 1);
}

case 'verify-completeness': {
  const specPath = args['--spec'] || findSpecForBranch();
  if (!specPath) { console.error('No spec found.'); process.exit(1); }
  const report = await verifyCompleteness({ specPath, projectRoot: args['--root'] || process.cwd() });
  console.log(formatCompletenessMarkdown(report));
  process.exit(report.overallStatus === 'pass' ? 0 : 1);
}

case 'detect-deadcode': {
  const taskFiles = args['--files']?.split(',') || getTaskFilesFromGit();
  const report = detectDeadCode({ taskFiles, projectRoot: args['--root'] || process.cwd() });
  console.log(formatDeadCodeMarkdown(report));
  process.exit(report.summary.dead === 0 ? 0 : 1);
}
```

- [ ] **Step 2: Commit**

```bash
git add tools/harness/cli.ts
git commit -m "feat(harness-cli): add explain-drift, verify-completeness, and detect-deadcode commands"
```

---

### Task 11: Update Skills

**Files:**
- Modify: `skills/harness-verify/SKILL.md`
- Modify: `skills/extract-boundary/SKILL.md` (or create new `skills/context-injection/SKILL.md`)

- [ ] **Step 1: Update harness-verify SKILL.md**

Add new verification steps:

```markdown
## Updated Verification Pipeline

### verify-local
1. **completeness** — Verify all acceptance criteria implemented
2. **lint** — Code style and formatting
3. **typecheck** — Type safety
4. **test** — Unit tests passing
5. **coverage** — Coverage threshold met

### verify-all
1-5. All of verify-local
6. **security** — Security scan
7. **integration** — Integration tests
8. **domain-specific** — Framework-specific checks
9. **dead-code** — Detect unreachable symbols
10. **drift-analysis** — Spec vs implementation diff

### New Commands
- `/verify completeness` — Run completeness check only
- `/verify deadcode` — Run dead code detection only
- `/explain-drift` — Full semantic diff between spec and implementation
```

- [ ] **Step 2: Create context-injection SKILL.md**

Replace or augment extract-boundary with the enhanced ContextEnvelope approach described in the addendum spec.

- [ ] **Step 3: Commit**

```bash
git add skills/harness-verify/SKILL.md skills/extract-boundary/SKILL.md
git commit -m "docs(harness-skills): update skills with completeness, deadcode, and drift verification"
```

---

## Wave 6: Integration Tests + Documentation (Final)

### Task 12: End-to-End Integration Tests

**Files:**
- Create: `tests/harness/integration/completeness-e2e.test.ts`
- Create: `tests/harness/integration/deadcode-e2e.test.ts`
- Create: `tests/harness/integration/drift-e2e.test.ts`

- [ ] **Step 1: Write integration tests**

Create a mock project structure with known completeness gaps, dead code, and drift, then verify each detector correctly identifies them.

- [ ] **Step 2: Run all tests**

Run: `npx jest tests/harness/ --coverage`
Expected: All tests pass, coverage > 80%

- [ ] **Step 3: Commit**

```bash
git add tests/harness/integration/
git commit -m "test(harness): add end-to-end integration tests for completeness, deadcode, and drift"
```

---

## Dependency Graph

```
Wave 1: Types + Spec Parser          (independent)
Wave 2: Matcher + Verifier           → depends on Wave 1
Wave 3: Dead Code Detection          → depends on Wave 1 types
Wave 4: Drift Analysis               → depends on Wave 1 + 2
Wave 5: Integration + CLI + Skills   → depends on Waves 1-4
Wave 6: E2E Tests                    → depends on Waves 1-5
```

## Success Criteria

1. **Completeness:** Given a spec with 5 ACs and implementation of only 3, the verifier reports score=60%, status=fail, and identifies the 2 missing ACs.
2. **Dead Code:** Given a task that creates a file with exported functions never imported elsewhere, the detector flags them as dead/isolated.
3. **Drift:** Given a spec requiring JWT validation (signature + expiry + issuer) and implementation that only validates signature, drift analysis reports partial with severity=high.
4. **Pipeline Integration:** `verify-local` fails if completeness < 100%. `verify-all` includes dead-code and drift reports.
5. **CLI:** `/explain-drift --spec path/to/spec.md` produces a readable drift report.
