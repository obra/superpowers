import { useCallback, useEffect, useRef, useState } from 'react';
import { imagesApi } from '@/shared/lib/api';
import type { LocalImageMetadata } from '@vibe/ui/components/TaskAttemptContext';
import type { DraftWorkspaceImage } from 'shared/types';

/**
 * Hook for handling image attachments during workspace creation.
 * Uploads images and tracks their IDs for association with the workspace.
 * Also tracks uploaded images for immediate preview in the editor.
 * Supports restoring previously uploaded images from a persisted draft.
 */
export function useCreateAttachments(
  onInsertMarkdown: (markdown: string) => void,
  initialImages?: DraftWorkspaceImage[],
  onImagesChange?: (images: DraftWorkspaceImage[]) => void
) {
  const [images, setImages] = useState<DraftWorkspaceImage[]>(
    initialImages ?? []
  );
  const hasInitialized = useRef(false);

  // Seed from draft when initialImages arrives (only once)
  useEffect(() => {
    if (hasInitialized.current) return;
    if (initialImages && initialImages.length > 0) {
      hasInitialized.current = true;
      setImages(initialImages);
    }
  }, [initialImages]);

  // Notify parent when images change (for draft persistence)
  useEffect(() => {
    onImagesChange?.(images);
  }, [images, onImagesChange]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const uploadResults: DraftWorkspaceImage[] = [];

      for (const file of imageFiles) {
        try {
          const response = await imagesApi.upload(file);
          uploadResults.push({
            id: response.id,
            file_path: response.file_path,
            original_name: response.original_name,
            mime_type: response.mime_type,
            // size_bytes comes as a JSON number despite the bigint TS type
            size_bytes: Number(response.size_bytes) as unknown as bigint,
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }

      if (uploadResults.length > 0) {
        setImages((prev) => [...prev, ...uploadResults]);
        const allMarkdown = uploadResults
          .map((r) => `![${r.original_name}](${r.file_path})`)
          .join('\n\n');
        onInsertMarkdown(allMarkdown);
      }
    },
    [onInsertMarkdown]
  );

  const getImageIds = useCallback(() => {
    const ids = images.map((img) => img.id);
    return ids.length > 0 ? ids : null;
  }, [images]);

  const clearAttachments = useCallback(() => setImages([]), []);

  // Convert images to LocalImageMetadata format for WYSIWYG preview
  const localImages: LocalImageMetadata[] = images.map((img) => ({
    path: img.file_path,
    proxy_url: `/api/images/${img.id}/file`,
    file_name: img.original_name,
    size_bytes: Number(img.size_bytes),
    format: img.mime_type?.split('/')[1] ?? 'png',
  }));

  return { uploadFiles, getImageIds, clearAttachments, localImages };
}
