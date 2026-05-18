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

  const { title, requirements } = readSpecRequirements(options.specPath);

  const summaries = computeSemanticDiff(requirements, projectRoot);

  const items = classifyGaps(summaries, []);

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
    const icon = item.status === 'aligned' ? '\u2705' : item.status === 'missing' ? '\u274c' : item.status === 'partial' ? '\u26a0\ufe0f' : item.status === 'divergent' ? '\ud83d\udd04' : '\u2795';
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
