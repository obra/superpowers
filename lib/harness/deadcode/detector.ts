// lib/harness/deadcode/detector.ts

import * as path from 'path';
import { SymbolInfo, ReachabilityResult, DeadCodeReport } from './types';
import { extractSymbolsFromFiles } from './symbol-extractor';
import { buildImportGraph } from './import-graph';
import { analyzeReachability } from './reachability';

export interface DeadCodeOptions {
  taskFiles: string[];
  projectRoot?: string;
  specKeywords?: string[];
}

export function detectDeadCode(options: DeadCodeOptions): DeadCodeReport {
  const projectRoot = options.projectRoot || process.cwd();

  const symbols = extractSymbolsFromFiles(options.taskFiles);

  const edges = buildImportGraph(projectRoot);

  const results = analyzeReachability(symbols, edges, options.specKeywords || []);

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
    const icon = r.status === 'connected' ? '\u2705' : r.status === 'isolated' ? '\u26a0\ufe0f' : '\u274c';
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
