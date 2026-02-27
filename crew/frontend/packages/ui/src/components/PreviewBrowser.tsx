import type { CSSProperties, MouseEvent, RefObject, TouchEvent } from 'react';
import {
  PlayIcon,
  SpinnerIcon,
  WrenchIcon,
  ArrowSquareOutIcon,
  ArrowClockwiseIcon,
  CopyIcon,
  XIcon,
  CrosshairIcon,
  MonitorIcon,
  DeviceMobileIcon,
  ArrowsOutCardinalIcon,
  PauseIcon,
  CheckIcon,
  TerminalIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { PrimaryButton } from './PrimaryButton';
import { IconButtonGroup, IconButtonGroupItem } from './IconButtonGroup';
import {
  PreviewNavigation,
  type PreviewNavigationState,
} from './PreviewNavigation';

export const MOBILE_WIDTH = 390;
export const MOBILE_HEIGHT = 844;
// Phone frame adds padding (p-3 = 12px * 2) and rounded corners
export const PHONE_FRAME_PADDING = 24;
const PREVIEW_IFRAME_SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals';

export type PreviewBrowserScreenSize = 'desktop' | 'mobile' | 'responsive';

export interface PreviewBrowserResponsiveDimensions {
  width: number;
  height: number;
}

export interface PreviewBrowserRepo {
  dev_server_script?: string | null;
}

interface PreviewBrowserProps {
  url?: string;
  autoDetectedUrl?: string;
  urlInputValue: string;
  urlInputRef: RefObject<HTMLInputElement>;
  isUsingOverride?: boolean;
  onUrlInputChange: (value: string) => void;
  onUrlSubmit: () => void;
  onUrlEscape?: () => void;
  onClearOverride?: () => void;
  onCopyUrl: () => void;
  onOpenInNewTab: () => void;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
  isStarting: boolean;
  isStopping: boolean;
  isServerRunning: boolean;
  showIframe: boolean;
  allowManualUrl?: boolean;
  screenSize: PreviewBrowserScreenSize;
  localDimensions: PreviewBrowserResponsiveDimensions;
  onScreenSizeChange: (size: PreviewBrowserScreenSize) => void;
  onResizeStart: (
    direction: 'right' | 'bottom' | 'corner'
  ) => (e: MouseEvent | TouchEvent) => void;
  isResizing: boolean;
  containerRef: RefObject<HTMLDivElement>;
  repos: PreviewBrowserRepo[];
  handleEditDevScript: () => void;
  handleFixDevScript?: () => void;
  hasFailedDevServer?: boolean;
  mobileScale: number;
  className?: string;
  iframeRef: RefObject<HTMLIFrameElement>;
  navigation: PreviewNavigationState | null;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  isInspectMode: boolean;
  onToggleInspectMode: () => void;
  isErudaVisible: boolean;
  onToggleEruda: () => void;
  onIframeLoad?: () => void;
}

export function PreviewBrowser({
  url,
  autoDetectedUrl,
  urlInputValue,
  urlInputRef,
  isUsingOverride,
  onUrlInputChange,
  onUrlSubmit,
  onUrlEscape,
  onClearOverride,
  onCopyUrl,
  onOpenInNewTab,
  onRefresh,
  onStart,
  onStop,
  isStarting,
  isStopping,
  isServerRunning,
  showIframe,
  allowManualUrl,
  screenSize,
  localDimensions,
  onScreenSizeChange,
  onResizeStart,
  isResizing,
  containerRef,
  repos,
  handleEditDevScript,
  handleFixDevScript,
  hasFailedDevServer,
  mobileScale,
  className,
  iframeRef,
  navigation,
  onNavigateBack,
  onNavigateForward,
  isInspectMode,
  onToggleInspectMode,
  isErudaVisible,
  onToggleEruda,
  onIframeLoad,
}: PreviewBrowserProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const isLoading = isStarting || (isServerRunning && !url);
  // Use the showIframe prop from container which handles the 2-second delay
  const showIframeContent = showIframe && url && !isLoading && isServerRunning;
  // Show loading when URL detected but waiting for delay
  const isWaitingForDelay = isServerRunning && url && !showIframe;

  const hasDevScript = repos.some(
    (repo) => repo.dev_server_script && repo.dev_server_script.trim() !== ''
  );

  const getIframeContainerStyle = (): CSSProperties => {
    switch (screenSize) {
      case 'mobile':
        return {
          width: MOBILE_WIDTH,
          height: MOBILE_HEIGHT,
        };
      case 'responsive':
        return {
          width: localDimensions.width,
          height: localDimensions.height,
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
        };
    }
  };

  return (
    <div
      className={cn(
        'bg-brand/20 w-full h-full flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Floating Toolbar */}
      <div className="p-double">
        <div className="backdrop-blur-sm bg-primary/80 border border-brand/20 flex items-center gap-base p-base rounded-md shadow-md shrink-0">
          {/* Navigation (Back/Forward) */}
          <PreviewNavigation
            navigation={navigation}
            onBack={onNavigateBack}
            onForward={onNavigateForward}
            disabled={!isServerRunning}
          />

          {/* Inspect Mode & DevTools */}
          <IconButtonGroup>
            <IconButtonGroupItem
              icon={CrosshairIcon}
              onClick={onToggleInspectMode}
              active={isInspectMode}
              disabled={!isServerRunning}
              aria-label="Select element as context"
              title="Select element as context"
            />
            <IconButtonGroupItem
              icon={TerminalIcon}
              onClick={onToggleEruda}
              active={isErudaVisible}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.toggleDevTools')}
              title={t('preview.toolbar.toggleDevTools')}
            />
          </IconButtonGroup>

          {/* URL Input */}
          <div
            className={cn(
              'flex items-center gap-half rounded-sm px-base py-half flex-1 min-w-0',
              !isServerRunning && 'opacity-50'
            )}
          >
            <input
              ref={urlInputRef}
              type="text"
              value={urlInputValue}
              onChange={(e) => onUrlInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onUrlSubmit();
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  onUrlEscape?.();
                }
              }}
              placeholder={autoDetectedUrl ?? 'Enter URL...'}
              disabled={!isServerRunning}
              className={cn(
                'flex-1 font-mono text-sm bg-transparent border-none outline-none min-w-0',
                isUsingOverride
                  ? 'text-normal'
                  : 'text-low placeholder:text-low',
                !isServerRunning && 'cursor-not-allowed'
              )}
            />
          </div>

          {/* URL Actions */}
          <IconButtonGroup>
            <IconButtonGroupItem
              icon={CheckIcon}
              onClick={onUrlSubmit}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.submitUrl')}
              title={t('preview.toolbar.submitUrl')}
            />
            {isUsingOverride && (
              <IconButtonGroupItem
                icon={XIcon}
                onClick={onClearOverride}
                disabled={!isServerRunning}
                aria-label={t('preview.toolbar.clearUrlOverride')}
                title={t('preview.toolbar.resetUrl')}
              />
            )}
            <IconButtonGroupItem
              icon={CopyIcon}
              onClick={onCopyUrl}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.copyUrl')}
              title={t('preview.toolbar.copyUrl')}
            />
            <IconButtonGroupItem
              icon={ArrowSquareOutIcon}
              onClick={onOpenInNewTab}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.openInTab')}
              title={t('preview.toolbar.openInTab')}
            />
            <IconButtonGroupItem
              icon={ArrowClockwiseIcon}
              onClick={onRefresh}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.refresh')}
              title={t('preview.toolbar.refresh')}
            />
          </IconButtonGroup>

          {/* Screen Size Toggle */}
          <IconButtonGroup>
            <IconButtonGroupItem
              icon={MonitorIcon}
              onClick={() => onScreenSizeChange('desktop')}
              active={screenSize === 'desktop'}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.desktopView')}
              title={t('preview.toolbar.desktopView')}
            />
            <IconButtonGroupItem
              icon={DeviceMobileIcon}
              onClick={() => onScreenSizeChange('mobile')}
              active={screenSize === 'mobile'}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.mobileView')}
              title={t('preview.toolbar.mobileView')}
            />
            <IconButtonGroupItem
              icon={ArrowsOutCardinalIcon}
              onClick={() => onScreenSizeChange('responsive')}
              active={screenSize === 'responsive'}
              disabled={!isServerRunning}
              aria-label={t('preview.toolbar.responsiveView')}
              title={t('preview.toolbar.responsiveView')}
            />
          </IconButtonGroup>

          {/* Dimensions display for responsive mode */}
          {screenSize === 'responsive' && (
            <span className="text-xs text-low font-mono whitespace-nowrap">
              {Math.round(localDimensions.width)} &times;{' '}
              {Math.round(localDimensions.height)}
            </span>
          )}

          {/* Start/Stop Button */}
          <IconButtonGroup>
            <IconButtonGroupItem
              icon={
                isServerRunning
                  ? isStopping
                    ? SpinnerIcon
                    : PauseIcon
                  : isStarting
                    ? SpinnerIcon
                    : PlayIcon
              }
              iconClassName={
                (isServerRunning && isStopping) ||
                (!isServerRunning && isStarting)
                  ? 'animate-spin'
                  : undefined
              }
              onClick={isServerRunning ? onStop : onStart}
              disabled={
                isServerRunning ? isStopping : isStarting || !hasDevScript
              }
              aria-label={
                isServerRunning
                  ? t('preview.toolbar.stopDevServer')
                  : t('preview.toolbar.startDevServer')
              }
              title={
                isServerRunning
                  ? t('preview.toolbar.stopDevServer')
                  : t('preview.toolbar.startDevServer')
              }
            />
          </IconButtonGroup>
        </div>
      </div>

      {/* Content area */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 min-h-0 relative px-double pb-double',
          screenSize === 'mobile' ? 'overflow-hidden' : 'overflow-auto'
        )}
      >
        {showIframeContent ? (
          <div
            className={cn(
              'h-full',
              screenSize === 'desktop' ? '' : 'flex items-center justify-center'
            )}
          >
            {screenSize === 'mobile' ? (
              // Phone frame for mobile mode - scales down to fit container
              <div
                className="bg-primary rounded-[2rem] p-3 shadow-xl origin-center"
                style={{
                  transform:
                    mobileScale < 1 ? `scale(${mobileScale})` : undefined,
                }}
              >
                <div
                  className="rounded-[1.5rem] overflow-hidden"
                  style={{ width: MOBILE_WIDTH, height: MOBILE_HEIGHT }}
                >
                  <iframe
                    ref={iframeRef}
                    src={url}
                    title={t('preview.browser.title')}
                    className="w-full h-full border-0"
                    sandbox={PREVIEW_IFRAME_SANDBOX}
                    referrerPolicy="no-referrer"
                    onLoad={onIframeLoad}
                  />
                </div>
              </div>
            ) : (
              // Desktop and responsive modes
              <div
                className={cn(
                  'rounded-sm border overflow-hidden relative',
                  screenSize === 'responsive' && 'shadow-lg'
                )}
                style={getIframeContainerStyle()}
              >
                <iframe
                  ref={iframeRef}
                  src={url}
                  title={t('preview.browser.title')}
                  className={cn(
                    'w-full h-full border-0',
                    isResizing && 'pointer-events-none'
                  )}
                  sandbox={PREVIEW_IFRAME_SANDBOX}
                  referrerPolicy="no-referrer"
                  onLoad={onIframeLoad}
                />

                {/* Resize handles for responsive mode */}
                {screenSize === 'responsive' && (
                  <>
                    {/* Right edge handle */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-brand/30 transition-colors"
                      onMouseDown={onResizeStart('right')}
                      onTouchStart={onResizeStart('right')}
                    />
                    {/* Bottom edge handle */}
                    <div
                      className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-brand/30 transition-colors"
                      onMouseDown={onResizeStart('bottom')}
                      onTouchStart={onResizeStart('bottom')}
                    />
                    {/* Corner handle */}
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-brand/30 transition-colors"
                      onMouseDown={onResizeStart('corner')}
                      onTouchStart={onResizeStart('corner')}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-base text-low">
            {isLoading || isWaitingForDelay ? (
              <>
                <SpinnerIcon className="size-icon-lg animate-spin text-brand" />
                <p className="text-sm">
                  {isStarting
                    ? t('preview.loading.startingServer')
                    : isWaitingForDelay
                      ? t('preview.loading.loadingPreview')
                      : t('preview.loading.waitingForServer')}
                </p>
                {allowManualUrl && !autoDetectedUrl && (
                  <p className="text-sm text-low mt-base">
                    {t('preview.loading.manualUrlHint')}
                  </p>
                )}
              </>
            ) : hasDevScript ? (
              <>
                <p>{t('preview.noServer.title')}</p>
                {hasFailedDevServer && handleFixDevScript ? (
                  <PrimaryButton
                    variant="tertiary"
                    value={t('scriptFixer.fixScript')}
                    actionIcon={WrenchIcon}
                    onClick={handleFixDevScript}
                  />
                ) : (
                  <PrimaryButton
                    value={t('attempt.actions.startDevServer')}
                    actionIcon={PlayIcon}
                    onClick={onStart}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col gap-double p-double max-w-md">
                <div className="flex flex-col gap-base">
                  <p className="text-xl text-high max-w-xs">
                    {t('preview.noServer.setupTitle')}
                  </p>
                  <p>{t('preview.noServer.setupPrompt')}</p>
                </div>
                <div className="flex flex-col gap-base">
                  <div>
                    <PrimaryButton
                      value={t('preview.noServer.editDevScript')}
                      onClick={handleEditDevScript}
                    />
                  </div>
                  <a
                    href="https://www.vibekanban.com/docs/core-features/testing-your-application"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-hover underline"
                  >
                    {t('preview.noServer.learnMore')}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
