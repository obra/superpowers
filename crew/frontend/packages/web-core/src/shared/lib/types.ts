import {
  ExecutionProcess,
  NormalizedEntry,
  ExecutionProcessStatus,
} from 'shared/types';

export type AttemptData = {
  processes: ExecutionProcess[];
  runningProcessDetails: Record<string, ExecutionProcess>;
};

export interface ConversationEntryDisplayType {
  entry: NormalizedEntry;
  processId: string;
  processPrompt?: string;
  processStatus: ExecutionProcessStatus;
  processIsRunning: boolean;
  process: ExecutionProcess;
  isFirstInProcess: boolean;
  processIndex: number;
  entryIndex: number;
}
