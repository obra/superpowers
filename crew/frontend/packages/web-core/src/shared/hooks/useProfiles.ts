import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/shared/lib/api';
import type { JsonValue } from 'shared/types';
import { presetOptionsKeys } from '@/shared/hooks/usePresetOptions';

export type UseProfilesReturn = {
  // data
  profilesContent: string;
  parsedProfiles: JsonValue | null;
  profilesPath: string;

  // status
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isSaving: boolean;

  // actions
  refetch: () => void;
  save: (content: string) => Promise<void>;
  saveParsed: (obj: unknown) => Promise<void>;
};

export function useProfiles(): UseProfilesReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.load(),
    staleTime: 1000 * 60, // 1 minute cache
  });

  const { mutateAsync: saveMutation, isPending: isSaving } = useMutation({
    mutationFn: (content: string) => profilesApi.save(content),
    onSuccess: (_, content) => {
      // Optimistically update cache with new content
      queryClient.setQueryData<{ content: string; path: string }>(
        ['profiles'],
        (old) => (old ? { ...old, content } : old)
      );
      void queryClient.invalidateQueries({
        queryKey: presetOptionsKeys.all,
      });
    },
  });

  const save = async (content: string): Promise<void> => {
    await saveMutation(content);
  };

  const parsedProfiles = useMemo(() => {
    if (!data?.content) return null;
    try {
      return JSON.parse(data.content);
    } catch {
      return null;
    }
  }, [data?.content]);

  const saveParsed = async (obj: unknown) => {
    await save(JSON.stringify(obj, null, 2));
  };

  return {
    profilesContent: data?.content ?? '',
    parsedProfiles,
    profilesPath: data?.path ?? '',
    isLoading,
    isError,
    error,
    isSaving,
    refetch,
    save,
    saveParsed,
  };
}
