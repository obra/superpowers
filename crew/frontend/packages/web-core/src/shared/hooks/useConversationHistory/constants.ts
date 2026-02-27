import type { PatchTypeWithKey } from './types';

export const MIN_INITIAL_ENTRIES = 10;
export const REMAINING_BATCH_SIZE = 50;

export const makeLoadingPatch = (
  executionProcessId: string
): PatchTypeWithKey => ({
  type: 'NORMALIZED_ENTRY',
  content: {
    entry_type: {
      type: 'loading',
    },
    content: '',
    timestamp: null,
  },
  patchKey: `${executionProcessId}:loading`,
  executionProcessId,
});

export const nextActionPatch: (
  failed: boolean,
  execution_processes: number,
  needs_setup: boolean,
  setup_help_text?: string
) => PatchTypeWithKey = (
  failed,
  execution_processes,
  needs_setup,
  setup_help_text
) => ({
  type: 'NORMALIZED_ENTRY',
  content: {
    entry_type: {
      type: 'next_action',
      failed: failed,
      execution_processes: execution_processes,
      needs_setup: needs_setup,
      setup_help_text: setup_help_text ?? null,
    },
    content: '',
    timestamp: null,
  },
  patchKey: 'next_action',
  executionProcessId: '',
});
