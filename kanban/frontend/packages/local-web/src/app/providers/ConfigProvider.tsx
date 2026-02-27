import { ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type Config,
  type Environment,
  type UserSystemInfo,
  type BaseAgentCapability,
} from 'shared/types';
import type { ExecutorProfile } from 'shared/types';
import { configApi } from '@/shared/lib/api';
import { updateLanguageFromConfig } from '@/i18n/config';
import { setRemoteApiBase } from '@/shared/lib/remoteApi';
import {
  UserSystemContext,
  type UserSystemContextType,
} from '@/shared/hooks/useUserSystem';

interface UserSystemProviderProps {
  children: ReactNode;
}

export function UserSystemProvider({ children }: UserSystemProviderProps) {
  const queryClient = useQueryClient();

  const { data: userSystemInfo, isLoading } = useQuery({
    queryKey: ['user-system'],
    queryFn: configApi.getConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const config = userSystemInfo?.config || null;
  const environment = userSystemInfo?.environment || null;
  const analyticsUserId = userSystemInfo?.analytics_user_id || null;
  const loginStatus = userSystemInfo?.login_status || null;
  const profiles =
    (userSystemInfo?.executors as Record<string, ExecutorProfile> | null) ||
    null;
  const capabilities =
    (userSystemInfo?.capabilities as Record<
      string,
      BaseAgentCapability[]
    > | null) || null;

  // Set runtime remote API base URL for self-hosting support.
  // Must run during render (not in useEffect) so it's set before children mount.
  setRemoteApiBase(userSystemInfo?.shared_api_base);

  // Sync language with i18n when config changes
  useEffect(() => {
    if (config?.language) {
      updateLanguageFromConfig(config.language);
    }
  }, [config?.language]);

  const updateConfig = useCallback(
    (updates: Partial<Config>) => {
      queryClient.setQueryData<UserSystemInfo>(['user-system'], (old) => {
        if (!old) return old;
        return {
          ...old,
          config: { ...old.config, ...updates },
        };
      });
    },
    [queryClient]
  );

  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!config) return false;
    try {
      await configApi.saveConfig(config);
      return true;
    } catch (err) {
      console.error('Error saving config:', err);
      return false;
    }
  }, [config]);

  const updateAndSaveConfig = useCallback(
    async (updates: Partial<Config>): Promise<boolean> => {
      if (!config) return false;

      const newConfig = { ...config, ...updates };
      updateConfig(updates);

      try {
        const saved = await configApi.saveConfig(newConfig);
        queryClient.setQueryData<UserSystemInfo>(['user-system'], (old) => {
          if (!old) return old;
          return {
            ...old,
            config: saved,
          };
        });
        return true;
      } catch (err) {
        console.error('Error saving config:', err);
        queryClient.invalidateQueries({ queryKey: ['user-system'] });
        return false;
      }
    },
    [config, queryClient, updateConfig]
  );

  const reloadSystem = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['user-system'] });
  }, [queryClient]);

  const setEnvironment = useCallback(
    (env: Environment | null) => {
      queryClient.setQueryData<UserSystemInfo>(['user-system'], (old) => {
        if (!old || !env) return old;
        return { ...old, environment: env };
      });
    },
    [queryClient]
  );

  const setProfiles = useCallback(
    (newProfiles: Record<string, ExecutorProfile> | null) => {
      queryClient.setQueryData<UserSystemInfo>(['user-system'], (old) => {
        if (!old || !newProfiles) return old;
        return {
          ...old,
          executors: newProfiles as unknown as UserSystemInfo['executors'],
        };
      });
    },
    [queryClient]
  );

  const setCapabilities = useCallback(
    (newCapabilities: Record<string, BaseAgentCapability[]> | null) => {
      queryClient.setQueryData<UserSystemInfo>(['user-system'], (old) => {
        if (!old || !newCapabilities) return old;
        return { ...old, capabilities: newCapabilities };
      });
    },
    [queryClient]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<UserSystemContextType>(
    () => ({
      system: {
        config,
        environment,
        profiles,
        capabilities,
        analyticsUserId,
        loginStatus,
      },
      config,
      environment,
      profiles,
      capabilities,
      analyticsUserId,
      loginStatus,
      updateConfig,
      saveConfig,
      updateAndSaveConfig,
      setEnvironment,
      setProfiles,
      setCapabilities,
      reloadSystem,
      loading: isLoading,
    }),
    [
      config,
      environment,
      profiles,
      capabilities,
      analyticsUserId,
      loginStatus,
      updateConfig,
      saveConfig,
      updateAndSaveConfig,
      reloadSystem,
      isLoading,
      setEnvironment,
      setProfiles,
      setCapabilities,
    ]
  );

  return (
    <UserSystemContext.Provider value={value}>
      {children}
    </UserSystemContext.Provider>
  );
}
