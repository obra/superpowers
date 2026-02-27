import { useCallback } from 'react';
import { imagesApi } from '@/shared/lib/api';
import type { ImageResponse } from 'shared/types';

export function useImageUpload() {
  const upload = useCallback(async (file: File): Promise<ImageResponse> => {
    return imagesApi.upload(file);
  }, []);

  const uploadForTask = useCallback(
    async (taskId: string, file: File): Promise<ImageResponse> => {
      return imagesApi.uploadForTask(taskId, file);
    },
    []
  );

  const deleteImage = useCallback(async (imageId: string): Promise<void> => {
    return imagesApi.delete(imageId);
  }, []);

  return {
    upload,
    uploadForTask,
    deleteImage,
  };
}
