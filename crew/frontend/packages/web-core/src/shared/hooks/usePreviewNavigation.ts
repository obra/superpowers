import { useCallback, useRef, useState } from 'react';
import type {
  NavigationState,
  PreviewDevToolsMessage,
} from '@/shared/types/previewDevTools';

export interface UsePreviewNavigationReturn {
  navigation: NavigationState | null;
  isReady: boolean;
  handleMessage: (message: PreviewDevToolsMessage) => void;
  reset: () => void;
}

export function usePreviewNavigation(): UsePreviewNavigationReturn {
  const [navigation, setNavigation] = useState<NavigationState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const activeDocIdRef = useRef<string | null>(null);
  const lastSeqByDocRef = useRef<Record<string, number>>({});
  const lastTimestampRef = useRef(0);

  const handleMessage = useCallback((message: PreviewDevToolsMessage) => {
    switch (message.type) {
      case 'navigation': {
        const docId = message.payload.docId;
        if (docId) {
          const activeDocId = activeDocIdRef.current;
          if (activeDocId && activeDocId !== docId) {
            return;
          }
          if (!activeDocId) {
            activeDocIdRef.current = docId;
          }

          const seq = message.payload.seq;
          if (typeof seq === 'number') {
            const lastSeq = lastSeqByDocRef.current[docId] ?? 0;
            if (seq <= lastSeq) {
              return;
            }
            lastSeqByDocRef.current[docId] = seq;
          }
        }

        if (message.payload.timestamp < lastTimestampRef.current) {
          return;
        }
        lastTimestampRef.current = message.payload.timestamp;

        setNavigation({
          url: message.payload.url,
          title: message.payload.title,
          canGoBack: message.payload.canGoBack,
          canGoForward: message.payload.canGoForward,
        });
        break;
      }
      case 'ready': {
        const readyDocId = message.payload?.docId;
        if (readyDocId) {
          activeDocIdRef.current = readyDocId;
          if (!(readyDocId in lastSeqByDocRef.current)) {
            lastSeqByDocRef.current[readyDocId] = 0;
          }
        }
        setIsReady(true);
        break;
      }
      default:
        break;
    }
  }, []);

  const reset = useCallback(() => {
    setNavigation(null);
    setIsReady(false);
    activeDocIdRef.current = null;
    lastSeqByDocRef.current = {};
    lastTimestampRef.current = 0;
  }, []);

  return { navigation, isReady, handleMessage, reset };
}
