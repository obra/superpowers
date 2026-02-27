import { useCallback, useState, useEffect, useRef } from 'react';
import { ScratchType, type WorkspaceNotesData } from 'shared/types';
import { useScratch } from '@/shared/hooks/useScratch';
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback';

export interface UseWorkspaceNotesResult {
  content: string;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  setContent: (content: string) => void;
}

/**
 * Hook for managing workspace notes stored in scratch memory.
 * Provides debounced saves and local state for immediate UI feedback.
 */
export function useWorkspaceNotes(
  workspaceId: string | undefined
): UseWorkspaceNotesResult {
  const {
    scratch,
    updateScratch,
    isLoading: isScratchLoading,
    isConnected,
    error,
  } = useScratch(ScratchType.WORKSPACE_NOTES, workspaceId ?? '', {
    enabled: !!workspaceId,
  });

  // Local state for immediate UI feedback
  const [localContent, setLocalContent] = useState('');

  // Track if user is actively editing to prevent server overwrites
  const isEditingRef = useRef(false);

  // Extract content from scratch payload
  const scratchData: WorkspaceNotesData | undefined =
    scratch?.payload?.type === 'WORKSPACE_NOTES'
      ? scratch.payload.data
      : undefined;

  // Sync from server when scratch loads (but not while editing)
  useEffect(() => {
    if (isScratchLoading) return;
    if (isEditingRef.current) return;
    setLocalContent(scratchData?.content ?? '');
  }, [isScratchLoading, scratchData?.content]);

  // Debounced save to server
  const { debounced: saveContent } = useDebouncedCallback(
    useCallback(
      async (content: string) => {
        if (!workspaceId) return;
        try {
          await updateScratch({
            payload: {
              type: 'WORKSPACE_NOTES',
              data: { content },
            },
          });
        } catch (e) {
          console.error('Failed to save workspace notes', e);
        }
        isEditingRef.current = false;
      },
      [workspaceId, updateScratch]
    ),
    500
  );

  const setContent = useCallback(
    (content: string) => {
      isEditingRef.current = true;
      setLocalContent(content);
      saveContent(content);
    },
    [saveContent]
  );

  return {
    content: localContent,
    isLoading: isScratchLoading,
    isConnected,
    error,
    setContent,
  };
}
