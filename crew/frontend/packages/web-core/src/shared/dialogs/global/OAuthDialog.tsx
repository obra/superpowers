import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { LogIn, Loader2 } from 'lucide-react';
import { OAuthSignInButton } from '@vibe/ui/components/OAuthButtons';
import { create, useModal } from '@ebay/nice-modal-react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthMutations } from '@/shared/hooks/auth/useAuthMutations';
import { useAuthStatus } from '@/shared/hooks/auth/useAuthStatus';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { organizationKeys } from '@/shared/hooks/organizationKeys';
import { tokenManager } from '@/shared/lib/auth/tokenManager';
import type { ProfileResponse } from 'shared/types';
import { useTranslation } from 'react-i18next';
import { defineModal } from '@/shared/lib/modals';

export type OAuthProvider = 'github' | 'google';
type OAuthDialogProps = { initialProvider?: OAuthProvider };

type OAuthState =
  | { type: 'select' }
  | { type: 'waiting'; provider: OAuthProvider }
  | { type: 'success'; profile: ProfileResponse }
  | { type: 'error'; message: string };

const OAuthDialogImpl = create<OAuthDialogProps>(({ initialProvider }) => {
  const modal = useModal();
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { reloadSystem } = useUserSystem();
  const [state, setState] = useState<OAuthState>({ type: 'select' });
  const popupRef = useRef<Window | null>(null);
  const autoStartedRef = useRef(false);
  const [isPolling, setIsPolling] = useState(false);

  // Auth mutations hook
  const { initHandoff } = useAuthMutations({
    onInitSuccess: (data) => {
      // Open popup window with authorize URL
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      popupRef.current = window.open(
        data.authorize_url,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},popup=yes,noopener=yes`
      );

      // Start polling
      setIsPolling(true);
    },
    onInitError: (error) => {
      setState({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to initialize OAuth flow',
      });
    },
  });

  // Poll for auth status using proper query hook
  const { data: statusData, isError: isStatusError } = useAuthStatus({
    enabled: isPolling,
  });

  // Handle status check errors
  useEffect(() => {
    if (isStatusError && isPolling) {
      setIsPolling(false);
      setState({
        type: 'error',
        message: 'Failed to check OAuth status',
      });
    }
  }, [isStatusError, isPolling]);

  // Monitor status changes
  useEffect(() => {
    if (!isPolling || !statusData) return;

    // Check if popup is closed
    if (popupRef.current?.closed) {
      setIsPolling(false);
      if (!statusData.logged_in) {
        setState({
          type: 'error',
          message: 'OAuth window was closed before completing authentication',
        });
      }
    }

    // If logged in, stop polling and trigger success
    if (statusData.logged_in && statusData.profile) {
      setIsPolling(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }

      // Reload user system, then refresh token so paused Electric shapes
      // resume after re-authentication without requiring a full page reload.
      void (async () => {
        await reloadSystem();
        await tokenManager.triggerRefresh();
      })();

      // Invalidate organization caches to force fresh fetch after login
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });

      setState({ type: 'success', profile: statusData.profile });
      setTimeout(() => {
        modal.resolve(statusData.profile);
        modal.remove();
      }, 1500);
    }
  }, [statusData, isPolling, modal, reloadSystem, queryClient]);

  const handleProviderSelect = useCallback(
    (provider: OAuthProvider) => {
      setState({ type: 'waiting', provider });

      // Get the current window location as return_to
      const returnTo = `${window.location.origin}/api/auth/handoff/complete`;

      // Initialize handoff flow
      initHandoff.mutate({ provider, returnTo });
    },
    [initHandoff]
  );

  const handleClose = () => {
    setIsPolling(false);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    setState({ type: 'select' });
    modal.resolve(null);
    modal.remove();
  };

  const handleBack = () => {
    setIsPolling(false);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    setState({ type: 'select' });
  };

  // Cleanup polling when dialog closes
  useEffect(() => {
    if (!modal.visible) {
      autoStartedRef.current = false;
      setIsPolling(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    }
  }, [modal.visible]);

  // Auto-start OAuth if a provider was preselected
  useEffect(() => {
    if (!modal.visible || !initialProvider) return;
    if (state.type !== 'select') return;
    if (autoStartedRef.current) return;

    autoStartedRef.current = true;
    handleProviderSelect(initialProvider);
  }, [handleProviderSelect, initialProvider, modal.visible, state.type]);

  const renderContent = () => {
    switch (state.type) {
      case 'select':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <LogIn className="h-6 w-6 text-primary-foreground" />
                <DialogTitle>{t('oauth.title')}</DialogTitle>
              </div>
              <DialogDescription className="text-left pt-2">
                {t('oauth.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <OAuthSignInButton
                provider="github"
                className="w-full"
                onClick={() => handleProviderSelect('github')}
              />
              <OAuthSignInButton
                provider="google"
                className="w-full"
                onClick={() => handleProviderSelect('google')}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                {t('buttons.cancel')}
              </Button>
            </DialogFooter>
          </>
        );

      case 'waiting':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <LogIn className="h-6 w-6 text-primary-foreground" />
                <DialogTitle>{t('oauth.waitingTitle')}</DialogTitle>
              </div>
              <DialogDescription className="text-left pt-2">
                {t('oauth.waitingDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-6">
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('oauth.waitingForAuth')}</span>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {t('oauth.popupInstructions')}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleBack}>
                {t('oauth.back')}
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                {t('buttons.cancel')}
              </Button>
            </DialogFooter>
          </>
        );

      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle>{t('oauth.successTitle')}</DialogTitle>
              <DialogDescription className="text-left pt-2">
                {t('oauth.welcomeBack', {
                  name: state.profile.username || state.profile.email,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex items-center justify-center">
              <div className="text-green-500">
                <svg
                  className="h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle>{t('oauth.errorTitle')}</DialogTitle>
              <DialogDescription className="text-left pt-2">
                {t('oauth.errorDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleBack}>
                {t('oauth.tryAgain')}
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                {t('buttons.close')}
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
});

export const OAuthDialog = defineModal<
  OAuthDialogProps,
  ProfileResponse | null
>(OAuthDialogImpl);
