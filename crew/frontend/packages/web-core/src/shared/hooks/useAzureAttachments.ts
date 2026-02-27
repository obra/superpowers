import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  computeFileHash,
  confirmAttachmentUpload,
  initAttachmentUpload,
  uploadToAzure,
} from '@/shared/lib/remoteApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingAttachment {
  file: File;
  progress: number;
  status: 'hashing' | 'uploading' | 'confirming';
}

export interface CompletedAttachment {
  id: string;
  filename: string;
  blob_id: string;
}

interface UseAzureAttachmentsOptions {
  projectId: string;
  issueId?: string;
  commentId?: string;
  onMarkdownInsert?: (markdown: string) => void;
  onError?: (message: string) => void;
}

interface UseAzureAttachmentsReturn {
  uploadFiles: (files: File[]) => Promise<void>;
  pendingAttachments: PendingAttachment[];
  completedAttachments: CompletedAttachment[];
  getAttachmentIds: () => string[];
  clearAttachments: () => void;
  isUploading: boolean;
  uploadError: string | null;
  clearUploadError: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_BATCH_SIZE = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAzureAttachments({
  projectId,
  issueId,
  commentId,
  onMarkdownInsert,
  onError,
}: UseAzureAttachmentsOptions): UseAzureAttachmentsReturn {
  const { t } = useTranslation('common');
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [completedAttachments, setCompletedAttachments] = useState<
    CompletedAttachment[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Avoid stale closures — these may change during async upload
  const issueIdRef = useRef(issueId);
  issueIdRef.current = issueId;
  const commentIdRef = useRef(commentId);
  commentIdRef.current = commentId;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const reportError = onErrorRef.current ?? console.error;
      const reportErrorMessage = (message: string) => {
        setUploadError(message);
        reportError(message);
      };

      setUploadError(null);

      if (files.length > MAX_BATCH_SIZE) {
        reportErrorMessage(
          t('kanban.maxFilesAtOnce', { count: MAX_BATCH_SIZE })
        );
        return;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          reportErrorMessage(
            t('kanban.fileExceedsLimit', { filename: file.name })
          );
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);

      for (const file of validFiles) {
        setPendingAttachments((prev) => [
          ...prev,
          { file, progress: 0, status: 'hashing' },
        ]);

        try {
          const hash = await computeFileHash(file);

          setPendingAttachments((prev) =>
            prev.map((p) =>
              p.file === file ? { ...p, status: 'uploading', progress: 0 } : p
            )
          );

          const initResult = await initAttachmentUpload({
            project_id: projectId,
            filename: file.name,
            size_bytes: file.size,
            hash,
          });

          if (!initResult.skip_upload) {
            await uploadToAzure(initResult.upload_url, file, (pct) => {
              setPendingAttachments((prev) =>
                prev.map((p) => (p.file === file ? { ...p, progress: pct } : p))
              );
            });
          }

          setPendingAttachments((prev) =>
            prev.map((p) =>
              p.file === file
                ? { ...p, status: 'confirming', progress: 100 }
                : p
            )
          );

          const result = await confirmAttachmentUpload({
            project_id: projectId,
            upload_id: initResult.upload_id,
            filename: file.name,
            content_type: file.type,
            size_bytes: file.size,
            hash,
            issue_id: issueIdRef.current,
            comment_id: commentIdRef.current,
          });

          setCompletedAttachments((prev) => [
            ...prev,
            { id: result.id, filename: file.name, blob_id: result.blob_id },
          ]);

          setPendingAttachments((prev) => prev.filter((p) => p.file !== file));

          onMarkdownInsert?.(`![${file.name}](attachment://${result.id})`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : t('kanban.unknownError');
          reportErrorMessage(
            t('kanban.failedToUploadFile', {
              filename: file.name,
              message,
            })
          );
          setPendingAttachments((prev) => prev.filter((p) => p.file !== file));
        }
      }

      setIsUploading(false);
    },
    [projectId, onMarkdownInsert, t]
  );

  const getAttachmentIds = useCallback(
    () => completedAttachments.map((a) => a.id),
    [completedAttachments]
  );

  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
    setCompletedAttachments([]);
  }, []);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    uploadFiles,
    pendingAttachments,
    completedAttachments,
    getAttachmentIds,
    clearAttachments,
    isUploading,
    uploadError,
    clearUploadError,
  };
}
