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
