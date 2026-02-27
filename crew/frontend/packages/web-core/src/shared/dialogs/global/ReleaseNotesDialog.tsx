import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { create, useModal } from '@ebay/nice-modal-react';
import { useTheme } from '@/shared/hooks/useTheme';
import { getActualTheme } from '@/shared/lib/theme';
import { defineModal, type NoProps } from '@/shared/lib/modals';

const RELEASE_NOTES_BASE_URL = 'https://vibekanban.com/release-notes';

const ReleaseNotesDialogImpl = create<NoProps>(() => {
  const modal = useModal();
  const [iframeError, setIframeError] = useState(false);
  const { theme } = useTheme();

  const releaseNotesUrl = useMemo(() => {
    const actualTheme = getActualTheme(theme);
    const url = new URL(RELEASE_NOTES_BASE_URL);
    url.searchParams.set('theme', actualTheme);
    return url.toString();
  }, [theme]);

  const handleOpenInBrowser = () => {
    window.open(releaseNotesUrl, '_blank');
    modal.resolve();
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => !open && modal.resolve()}
      className="h-[calc(100%-4rem)]"
    >
      <DialogContent className="flex flex-col w-full h-full max-w-7xl max-h-[calc(100dvh-1rem)] p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            We've updated Vibe Kanban! Check out what's new...
          </DialogTitle>
        </DialogHeader>

        {iframeError ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Unable to load release notes
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                We couldn't display the release notes in this window. Click
                below to view them in your browser.
              </p>
            </div>
            <Button onClick={handleOpenInBrowser} className="mt-4">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Release Notes in Browser
            </Button>
          </div>
        ) : (
          <iframe
            src={releaseNotesUrl}
            className="flex-1 w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            title="Release Notes"
            onError={handleIframeError}
            onLoad={(e) => {
              // Check if iframe content loaded successfully
              try {
                const iframe = e.target as HTMLIFrameElement;
                // If iframe is accessible but empty, it might indicate loading issues
                if (iframe.contentDocument?.body?.children.length === 0) {
                  setTimeout(() => setIframeError(true), 5000); // Wait 5s then show fallback
                }
              } catch {
                // Cross-origin access blocked (expected), iframe loaded successfully
              }
            }}
          />
        )}

        <DialogFooter className="p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleOpenInBrowser}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Browser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const ReleaseNotesDialog = defineModal<void, void>(
  ReleaseNotesDialogImpl
);
