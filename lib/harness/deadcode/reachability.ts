// lib/harness/deadcode/reachability.ts

import { SymbolInfo, ReachabilityResult } from './types';
import { ImportEdge, getImporters } from './import-graph';

const ENTRY_POINT_PATTERNS = [
  /pages\/.*\.(ts|tsx|js)$/,
  /app\/.*\/page\.(ts|tsx|js)$/,
  /src\/main\.(ts|js)$/,
  /src\/index\.(ts|js)$/,
  /Program\.cs$/,
  /main\.go$/,
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
