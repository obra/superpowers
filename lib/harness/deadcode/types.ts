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
