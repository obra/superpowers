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
