import { useCallback } from 'react';
import { ScratchType, type DraftWorkspaceData } from 'shared/types';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { scratchApi } from '@/shared/lib/api';
import type { CreateModeInitialState } from '@/shared/types/createMode';

export function useProjectWorkspaceCreateDraft() {
  const { projectId, openWorkspaceCreate } = useKanbanNavigation();

  const openWorkspaceCreateFromState = useCallback(
    async (
      initialState: CreateModeInitialState,
      options?: { issueId?: string | null }
    ): Promise<string | null> => {
      if (!projectId) return null;

      const draftId = crypto.randomUUID();

      const draftData: DraftWorkspaceData = {
        message: initialState.initialPrompt ?? '',
        repos:
          initialState.preferredRepos?.map((repo) => ({
            repo_id: repo.repo_id,
            target_branch: repo.target_branch ?? '',
          })) ?? [],
        executor_config: null,
        linked_issue: initialState.linkedIssue
          ? {
              issue_id: initialState.linkedIssue.issueId,
              simple_id: initialState.linkedIssue.simpleId ?? '',
              title: initialState.linkedIssue.title ?? '',
              remote_project_id: initialState.linkedIssue.remoteProjectId,
            }
          : null,
        images: [],
      };

      try {
        await scratchApi.update(ScratchType.DRAFT_WORKSPACE, draftId, {
          payload: {
            type: 'DRAFT_WORKSPACE',
            data: draftData,
          },
        });
      } catch (error) {
        console.error('Failed to persist create-workspace draft:', error);
        return null;
      }

      openWorkspaceCreate(draftId, {
        issueId: options?.issueId ?? initialState.linkedIssue?.issueId ?? null,
      });

      return draftId;
    },
    [projectId, openWorkspaceCreate]
  );

  return {
    openWorkspaceCreateFromState,
  };
}
