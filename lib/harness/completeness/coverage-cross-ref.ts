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
