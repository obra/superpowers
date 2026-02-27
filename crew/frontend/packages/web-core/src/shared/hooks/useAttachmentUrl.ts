import { useQuery } from '@tanstack/react-query';
import { fetchAttachmentSasUrl } from '@/shared/lib/remoteApi';

const SAS_URL_STALE_TIME = 4 * 60 * 1000; // 4 minutes, matches SAS URL TTL

interface AttachmentUrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
}

export function useAttachmentUrl(
  attachmentId: string | null,
  type: 'file' | 'thumbnail'
): AttachmentUrlResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attachment-url', attachmentId, type],
    queryFn: () => fetchAttachmentSasUrl(attachmentId!, type),
    enabled: !!attachmentId,
    staleTime: SAS_URL_STALE_TIME,
  });

  return {
    url: data ?? null,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Failed to load attachment'
      : null,
  };
}
