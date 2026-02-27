import { useCallback, useEffect, useMemo } from 'react';
import type { BaseCodingAgent, ExecutorDiscoveredOptions } from 'shared/types';
import { useJsonPatchWsStream } from '@/shared/hooks/useJsonPatchWsStream';
import { agentsApi } from '@/shared/lib/api';

type ExecutorDiscoveryStreamState = {
  options: ExecutorDiscoveredOptions | null;
};

const defaultOptions: ExecutorDiscoveredOptions = {
  model_selector: {
    providers: [],
    models: [],
    default_model: null,
    agents: [],
    permissions: [],
  },
  slash_commands: [],
  loading_models: true,
  loading_agents: true,
  loading_slash_commands: true,
  error: null,
};

function useExecutorDiscovery(
  agent: BaseCodingAgent | null | undefined,
  opts?: { workspaceId?: string; repoId?: string }
) {
  const { workspaceId, repoId } = opts ?? {};
  const endpoint = useMemo(() => {
    if (!agent) return undefined;
    return agentsApi.getDiscoveredOptionsStreamUrl(agent, {
      workspaceId,
      repoId,
    });
  }, [agent, workspaceId, repoId]);

  const initialData = useCallback(
    (): ExecutorDiscoveryStreamState => ({
      options: { ...defaultOptions },
    }),
    []
  );

  const { data, error, isConnected, isInitialized } =
    useJsonPatchWsStream<ExecutorDiscoveryStreamState>(
      endpoint,
      !!endpoint,
      initialData
    );

  const combinedError = data?.options?.error ?? error;

  useEffect(() => {
    if (combinedError) {
      console.error(
        'Failed to fetch executor discovery options',
        combinedError
      );
    }
  }, [combinedError]);

  return {
    options: data?.options ?? null,
    error: combinedError,
    isConnected,
    isInitialized,
  };
}

export function useModelSelectorConfig(
  agent: BaseCodingAgent | null | undefined,
  opts?: { workspaceId?: string; repoId?: string }
) {
  const { options, error, isConnected, isInitialized } = useExecutorDiscovery(
    agent,
    opts
  );

  return {
    config: options?.model_selector ?? null,
    loadingModels: options?.loading_models ?? false,
    loadingAgents: options?.loading_agents ?? false,
    error,
    isConnected,
    isInitialized,
  };
}

export function useSlashCommands(
  agent: BaseCodingAgent | null | undefined,
  opts?: { workspaceId?: string; repoId?: string }
) {
  const { options, error, isConnected, isInitialized } = useExecutorDiscovery(
    agent,
    opts
  );

  return {
    commands: options?.slash_commands ?? [],
    discovering: options?.loading_slash_commands ?? false,
    error,
    isConnected,
    isInitialized,
  };
}
