import { useQuery } from '@tanstack/react-query';
import { imagesApi } from '@/shared/lib/api';
import type { ImageResponse } from 'shared/types';

export function useTaskImages(taskId?: string) {
  return useQuery<ImageResponse[]>({
    queryKey: ['taskImages', taskId],
    queryFn: () => imagesApi.getTaskImages(taskId!),
    enabled: !!taskId,
  });
}
