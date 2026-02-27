import { useCallback, useState } from 'react';
import { imagesApi } from '@/shared/lib/api';
import type { LocalImageMetadata } from '@vibe/ui/components/TaskAttemptContext';
import type { ImageResponse } from 'shared/types';

/**
 * Hook for handling image attachments in session follow-up messages.
 * Uploads images to the workspace and calls back with markdown to insert.
 * Also tracks uploaded images for immediate preview in the editor.
 */
export function useSessionAttachments(
  workspaceId: string | undefined,
  onInsertMarkdown: (markdown: string) => void
) {
  const [uploadedImages, setUploadedImages] = useState<ImageResponse[]>([]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!workspaceId) return;

      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const uploadResults: ImageResponse[] = [];

      for (const file of imageFiles) {
        try {
          const response = await imagesApi.uploadForAttempt(workspaceId, file);
          uploadResults.push(response);
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }

      if (uploadResults.length > 0) {
        setUploadedImages((prev) => [...prev, ...uploadResults]);
        const allMarkdown = uploadResults
          .map((r) => `![${r.original_name}](${r.file_path})`)
          .join('\n\n');
        onInsertMarkdown(allMarkdown);
      }
    },
    [workspaceId, onInsertMarkdown]
  );

  const clearUploadedImages = useCallback(() => {
    setUploadedImages([]);
  }, []);

  // Convert uploaded images to LocalImageMetadata format for WYSIWYG preview
  const localImages: LocalImageMetadata[] = uploadedImages.map((img) => ({
    path: img.file_path,
    proxy_url: `/api/images/${img.id}/file`,
    file_name: img.original_name,
    size_bytes: Number(img.size_bytes),
    format: img.mime_type?.split('/')[1] ?? 'png',
  }));

  return { uploadFiles, localImages, clearUploadedImages };
}
