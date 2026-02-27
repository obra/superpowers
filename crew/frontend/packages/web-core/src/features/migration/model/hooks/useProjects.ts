import { useQuery } from '@tanstack/react-query';
import { migrationApi } from '@/shared/lib/api';
import type { Project } from 'shared/types';

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  isError: boolean;
}

export function useProjects(): UseProjectsResult {
  const query = useQuery<Project[]>({
    queryKey: ['migration', 'projects'],
    queryFn: migrationApi.listProjects,
    staleTime: 5 * 60 * 1000,
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
