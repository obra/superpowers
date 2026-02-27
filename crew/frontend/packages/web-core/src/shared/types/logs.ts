import type { NormalizedEntry, ExecutorAction } from 'shared/types';

export interface UnifiedLogEntry {
  id: string;
  ts: number; // epoch-ms timestamp for sorting and react-window key
  processId: string;
  processName: string;
  channel: 'raw' | 'stdout' | 'stderr' | 'normalized' | 'process_start';
  payload: string | NormalizedEntry | ProcessStartPayload;
}

export interface ProcessStartPayload {
  processId: string;
  runReason: string;
  startedAt: string;
  status: string;
  action?: ExecutorAction;
}
