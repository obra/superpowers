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
