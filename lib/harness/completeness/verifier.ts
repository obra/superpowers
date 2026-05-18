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
  minScore?: number;
}

export async function verifyCompleteness(options: CompletenessOptions): Promise<CompletenessReport> {
  const projectRoot = options.projectRoot || process.cwd();
  const minScore = options.minScore ?? 100;

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

  const matchConfig: Partial<MatchConfig> = { projectRoot };
  let evidence = matchAC(criteria, matchConfig);

  if (options.coverageReportPath) {
    evidence = crossRefWithCoverage(evidence, options.coverageReportPath);
  }

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
    const icon = ev.status === 'implemented' ? '\u2705' : ev.status === 'partial' ? '\u26a0\ufe0f' : '\u274c';
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
