// lib/harness/completeness/implementation-matcher.ts

import * as fs from 'fs';
import * as path from 'path';
import { AcceptanceCriterion, ACEvidence } from './types';

export interface MatchConfig {
  projectRoot: string;
  sourceDirs: string[];
  testDirs: string[];
  fileExtensions: string[];
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
    const codeResult = searchInFiles(ac.keywords, cfg.sourceDirs, cfg.projectRoot, cfg.fileExtensions);
    const codeFound = codeResult.files.length > 0;
    const codeSymbols = codeResult.files.flatMap(f => extractSymbols(f));

    const testResult = searchInFiles([ac.id, ...ac.keywords], cfg.testDirs, cfg.projectRoot, cfg.fileExtensions);
    const testFound = testResult.files.length > 0;

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
        files: codeResult.files.slice(0, 5),
        symbols: codeSymbols.slice(0, 10),
        confidence: codeResult.files.length > 2 ? 'high' : codeFound ? 'medium' : 'low',
      },
      testEvidence: {
        found: testFound,
        testFiles: testResult.files.slice(0, 5),
        testNames: [],
        coversEdgeCases: false,
      },
      status,
      gapDescription,
    };
  });
}
