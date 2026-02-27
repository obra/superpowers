import {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { configApi } from '@/shared/lib/api';
import {
  PreviewBrowser,
  MOBILE_WIDTH,
  MOBILE_HEIGHT,
  PHONE_FRAME_PADDING,
} from '@vibe/ui/components/PreviewBrowser';
import { usePreviewDevServer } from '@/features/workspace/model/hooks/usePreviewDevServer';
import { usePreviewUrl } from '@/shared/hooks/usePreviewUrl';
import {
  usePreviewSettings,
  type ScreenSize,
} from '@/shared/hooks/usePreviewSettings';
import { useLogStream } from '@/shared/hooks/useLogStream';
import { useUiPreferencesStore } from '@/shared/stores/useUiPreferencesStore';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { ScriptFixerDialog } from '@/shared/dialogs/scripts/ScriptFixerDialog';
import { usePreviewNavigation } from '@/shared/hooks/usePreviewNavigation';
import { PreviewDevToolsBridge } from '@/shared/lib/previewDevToolsBridge';
import { useInspectModeStore } from '@/features/workspace-chat/model/store/useInspectModeStore';
import type { PreviewDevToolsMessage } from '@/shared/types/previewDevTools';

const MIN_RESPONSIVE_WIDTH = 320;
const MIN_RESPONSIVE_HEIGHT = 480;

function parsePreviewUrl(rawUrl: string, baseUrl?: string): URL | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname
    ) {
      return parsed;
    }
  } catch {
    // Keep going.
  }

  if (
    (trimmed.startsWith('/') ||
      trimmed.startsWith('?') ||
      trimmed.startsWith('#')) &&
    baseUrl
  ) {
    try {
      return new URL(trimmed, baseUrl);
    } catch {
      return null;
    }
  }

  if (!trimmed.includes('://')) {
    try {
      return new URL(`http://${trimmed}`);
    } catch {
      return null;
    }
  }

  return null;
}

function normalizePreviewUrl(rawUrl: string, baseUrl?: string): string | null {
  return parsePreviewUrl(rawUrl, baseUrl)?.toString() ?? null;
}

/**
 * Transform a proxy URL back to the dev server URL.
 * Proxy format: http://{devPort}.localhost:{proxyPort}{path}?_refresh=...
 * Dev format:   http://localhost:{devPort}{path}
 */
function transformProxyUrlToDevUrl(proxyUrl: string): string | null {
  try {
    const url = new URL(proxyUrl);

    const hostnameParts = url.hostname.split('.');
    if (
      hostnameParts.length < 2 ||
      !hostnameParts.slice(1).join('.').startsWith('localhost')
    ) {
      return null;
    }

    const devPort = hostnameParts[0];
    if (!/^\d+$/.test(devPort)) {
      return null;
    }

    url.searchParams.delete('_refresh');

    const devUrl = new URL(`http://localhost${url.pathname}`);

    const search = url.searchParams.toString();
    if (search) {
      devUrl.search = search;
    }

    if (url.hash) {
      devUrl.hash = url.hash;
    }

    const portNum = parseInt(devPort, 10);
    if (portNum !== 80) {
      devUrl.port = devPort;
    }

    return devUrl.toString();
  } catch {
    return null;
  }
}

interface PreviewBrowserContainerProps {
  attemptId: string;
  className: string;
}

export function PreviewBrowserContainer({
  attemptId,
  className,
}: PreviewBrowserContainerProps) {
  // ─── Data Sources ───────────────────────────────────────────────────────────
  // Workspace context, preview proxy config, dev server state, log streams,
  // URL auto-detection, and preview settings (override URL, screen size).

  const previewRefreshKey = useUiPreferencesStore((s) => s.previewRefreshKey);
  const triggerPreviewRefresh = useUiPreferencesStore(
    (s) => s.triggerPreviewRefresh
  );
  const { repos, workspaceId } = useWorkspaceContext();

  // Get preview proxy port for security isolation
  const { data: systemInfo } = useQuery({
    queryKey: ['user-system'],
    queryFn: configApi.getConfig,
    staleTime: 5 * 60 * 1000,
  });
  const previewProxyPort = systemInfo?.preview_proxy_port;

  const {
    start,
    stop,
    isStarting,
    isStopping,
    runningDevServers,
    devServerProcesses,
  } = usePreviewDevServer(attemptId);

  const primaryDevServer = useMemo(() => {
    if (runningDevServers.length === 0) return undefined;

    return runningDevServers.reduce((latest, current) =>
      new Date(current.started_at).getTime() >
      new Date(latest.started_at).getTime()
        ? current
        : latest
    );
  }, [runningDevServers]);
  const { logs } = useLogStream(primaryDevServer?.id ?? '');
  const urlInfo = usePreviewUrl(logs, previewProxyPort ?? undefined);

  // Detect failed dev server process (failed status or completed with non-zero exit code)
  const failedDevServerProcess = devServerProcesses.find(
    (p) =>
      p.status === 'failed' ||
      (p.status === 'completed' && p.exit_code !== null && p.exit_code !== 0n)
  );
  const hasFailedDevServer = Boolean(failedDevServerProcess);

  // Preview settings (URL override and screen size)
  const {
    overrideUrl,
    hasOverride,
    setOverrideUrl,
    clearOverride,
    screenSize,
    responsiveDimensions,
    setScreenSize,
    setResponsiveDimensions,
  } = usePreviewSettings(workspaceId);

  // ─── URL Bar State ──────────────────────────────────────────────────────────
  // effectiveUrl:       The override URL (if set) or the auto-detected dev server URL.
  // urlInputValue:      Local state for the URL bar text. Decoupled from effectiveUrl
  //                     so that external URL changes don't disrupt the user while typing.
  // prevEffectiveUrlRef: Tracks the previous effectiveUrl so the sync effect can detect
  //                     when it changes (new URL detected or override toggled).
  // Use override URL if set, otherwise fall back to auto-detected
  const effectiveUrl = hasOverride ? overrideUrl : urlInfo?.url;
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlInputValue, setUrlInputValue] = useState(effectiveUrl ?? '');
  const prevEffectiveUrlRef = useRef(effectiveUrl);

  // ─── Iframe Display Timing ──────────────────────────────────────────────────
  // Controls when the iframe becomes visible after URL detection.
  // Iframe display timing state
  const [showIframe, setShowIframe] = useState(false);
  const [allowManualUrl, setAllowManualUrl] = useState(false);
  const [immediateLoad, setImmediateLoad] = useState(false);

  // Inspect mode state
  const isInspectMode = useInspectModeStore((s) => s.isInspectMode);
  const toggleInspectMode = useInspectModeStore((s) => s.toggleInspectMode);
  const setPendingComponentMarkdown = useInspectModeStore(
    (s) => s.setPendingComponentMarkdown
  );

  // ─── Navigation Bridge ────────────────────────────────────────────────────
  // The Rust proxy injects devtools_script.js into every iframe response.
  // That script reports navigation events (URL changes, page ready) via postMessage.
  // PreviewDevToolsBridge wraps the postMessage protocol for type-safe communication.
  //
  // navigationDevUrl transforms proxy URLs back to dev URLs:
  //   proxy:  http://4000.localhost:{proxyPort}/path
  //   dev:    http://localhost:4000/path
  //
  // currentPreviewUrl = best-known current URL (navigation > effectiveUrl).
  // Eruda DevTools state
  const [isErudaVisible, setIsErudaVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const {
    navigation,
    isReady,
    handleMessage: handleNavigationMessage,
    reset: resetNavigation,
  } = usePreviewNavigation();
  const bridgeRef = useRef<PreviewDevToolsBridge | null>(null);
  const navigationDevUrl = useMemo(() => {
    if (!navigation?.url || !previewProxyPort) {
      return null;
    }
    return transformProxyUrlToDevUrl(navigation.url);
  }, [navigation?.url, previewProxyPort]);
  const currentPreviewUrl = navigationDevUrl ?? effectiveUrl ?? null;

  const handleBridgeMessage = useCallback(
    (message: PreviewDevToolsMessage) => {
      handleNavigationMessage(message);
    },
    [handleNavigationMessage]
  );

  // ─── URL Sync Effect ──────────────────────────────────────────────────────
  // Keeps urlInputValue in sync with navigation/effectiveUrl. Priority:
  //   1. Skip if input is focused (user is typing)
  //   2. Prefer navigationDevUrl (iframe reported this URL via postMessage)
  //   3. Use effectiveUrl if it changed (new URL detected or override set)
  //   4. Fallback: set to effectiveUrl (catch-all for initial render, etc.)
  //
  // NOTE: After resetNavigation() in handleUrlSubmit, there's a brief flash
  // where the URL bar shows the old URL before the iframe reports the new URL.
  // This is a known cosmetic limitation.
  // Sync URL bar from effectiveUrl changes OR iframe navigation
  useEffect(() => {
    if (document.activeElement === urlInputRef.current) {
      return;
    }

    if (navigationDevUrl) {
      setUrlInputValue(navigationDevUrl);
      return;
    }

    if (prevEffectiveUrlRef.current !== effectiveUrl) {
      prevEffectiveUrlRef.current = effectiveUrl;
      setUrlInputValue(effectiveUrl ?? '');
      return;
    }

    setUrlInputValue(effectiveUrl ?? '');
  }, [effectiveUrl, navigation?.url, navigationDevUrl]);

  useEffect(() => {
    bridgeRef.current = new PreviewDevToolsBridge(
      handleBridgeMessage,
      iframeRef
    );
    bridgeRef.current.start();

    return () => {
      bridgeRef.current?.stop();
    };
  }, [handleBridgeMessage]);

  // Send inspect mode toggle to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        source: 'click-to-component',
        type: 'toggle-inspect',
        payload: { active: isInspectMode },
      },
      '*'
    );
  }, [isInspectMode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!event.data || event.data.source !== 'click-to-component') return;
      if (event.data.type !== 'component-detected') return;

      const { data } = event;

      if (data.version === 2 && data.payload) {
        const fenced = `\`\`\`vk-component\n${JSON.stringify(data.payload)}\n\`\`\``;
        setPendingComponentMarkdown(fenced);
      } else if (data.payload?.markdown) {
        setPendingComponentMarkdown(data.payload.markdown);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setPendingComponentMarkdown]);

  // 10-second timeout to enable manual URL entry when no URL detected
  useEffect(() => {
    if (!runningDevServers.length) {
      setAllowManualUrl(false);
      return;
    }
    if (urlInfo?.url) return; // Already have URL
    const timer = setTimeout(() => setAllowManualUrl(true), 10000);
    return () => clearTimeout(timer);
  }, [runningDevServers.length, urlInfo?.url]);

  // Reset immediateLoad when server stops
  useEffect(() => {
    if (!runningDevServers.length) {
      setImmediateLoad(false);
    }
  }, [runningDevServers.length]);

  // 2-second delay before showing iframe after URL detection
  // When there's an override URL from scratch, wait for server to detect a URL first
  // unless user has triggered an immediate load (refresh/submit)
  useEffect(() => {
    if (!effectiveUrl) {
      setShowIframe(false);
      return;
    }

    // If user has triggered immediate load (refresh/submit), show immediately after delay
    // OR if no override (normal flow), show after delay once effectiveUrl is set
    // OR if we have both override and auto-detected URL (server is ready), show after delay
    // OR after timeout fallback when URL auto-detection never resolves.
    const shouldShow =
      immediateLoad || !hasOverride || Boolean(urlInfo?.url) || allowManualUrl;

    if (!shouldShow) {
      setShowIframe(false);
      return;
    }

    setShowIframe(false);
    const timer = setTimeout(() => setShowIframe(true), 2000);
    return () => clearTimeout(timer);
  }, [
    effectiveUrl,
    previewRefreshKey,
    immediateLoad,
    hasOverride,
    urlInfo?.url,
    allowManualUrl,
  ]);

  // Responsive resize state - use refs for values that shouldn't trigger re-renders
  const [localDimensions, setLocalDimensions] = useState(responsiveDimensions);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const resizeDirectionRef = useRef<'right' | 'bottom' | 'corner' | null>(null);
  const localDimensionsRef = useRef(localDimensions);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const startDimensionsRef = useRef<{ width: number; height: number } | null>(
    null
  );

  // Store callback in ref to avoid effect re-runs when callback identity changes
  const setResponsiveDimensionsRef = useRef(setResponsiveDimensions);
  useEffect(() => {
    setResponsiveDimensionsRef.current = setResponsiveDimensions;
  }, [setResponsiveDimensions]);

  // Keep ref in sync with state for use in event handlers
  useEffect(() => {
    localDimensionsRef.current = localDimensions;
  }, [localDimensions]);

  // Sync local dimensions with prop when not resizing
  useEffect(() => {
    if (!isResizingRef.current) {
      setLocalDimensions(responsiveDimensions);
    }
  }, [responsiveDimensions]);

  // Calculate scale for mobile preview to fit container
  const [mobileScale, setMobileScale] = useState(1);

  useLayoutEffect(() => {
    if (screenSize !== 'mobile' || !containerRef.current) {
      setMobileScale(1);
      return;
    }

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get available space (subtract padding from p-double which is typically 32px total)
      const availableWidth = container.clientWidth - 32;
      const availableHeight = container.clientHeight - 32;

      // Total phone frame dimensions including padding
      const totalFrameWidth = MOBILE_WIDTH + PHONE_FRAME_PADDING;
      const totalFrameHeight = MOBILE_HEIGHT + PHONE_FRAME_PADDING;

      // Calculate scale needed to fit
      const scaleX = availableWidth / totalFrameWidth;
      const scaleY = availableHeight / totalFrameHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      setMobileScale(scale);
    };

    updateScale();

    // Observe container size changes
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [screenSize]);

  // Handle resize events - register listeners once on mount
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (
        !isResizingRef.current ||
        !startPosRef.current ||
        !startDimensionsRef.current
      )
        return;

      const direction = resizeDirectionRef.current;
      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;

      setLocalDimensions(() => {
        let newWidth = startDimensionsRef.current!.width;
        let newHeight = startDimensionsRef.current!.height;

        if (direction === 'right' || direction === 'corner') {
          // Double delta to compensate for centered element (grows on both sides)
          newWidth = Math.max(
            MIN_RESPONSIVE_WIDTH,
            startDimensionsRef.current!.width + deltaX * 2
          );
        }

        if (direction === 'bottom' || direction === 'corner') {
          // Double delta to compensate for centered element (grows on both sides)
          newHeight = Math.max(
            MIN_RESPONSIVE_HEIGHT,
            startDimensionsRef.current!.height + deltaY * 2
          );
        }

        return { width: newWidth, height: newHeight };
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        resizeDirectionRef.current = null;
        startPosRef.current = null;
        startDimensionsRef.current = null;
        setIsResizing(false);
        setResponsiveDimensionsRef.current(localDimensionsRef.current);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, []); // Empty deps - mount only, uses refs for all external values

  const handleResizeStart = useCallback(
    (direction: 'right' | 'bottom' | 'corner') =>
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        resizeDirectionRef.current = direction;
        setIsResizing(true);

        // Capture starting position and dimensions for delta-based resizing
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        startPosRef.current = { x: clientX, y: clientY };
        startDimensionsRef.current = { ...localDimensionsRef.current };
      },
    []
  );

  // ─── URL Bar Handlers ─────────────────────────────────────────────────────
  // handleUrlSubmit flow:
  //   1. Empty input → clear override, blur
  //   2. Invalid URL → reject (stay focused so user can fix)
  //   3. Same URL as current → noop, blur
  //   4. New URL → resetNavigation() to force sync effect to fire when iframe
  //      reports new URL
  //   5. Same port as current → bridge goto (postMessage to iframe, SPA navigation)
  //   6. Different port → set override URL (full iframe src change)
  //
  // WHY resetNavigation is needed: after blur + navigateTo, no React state changes
  // occur, so the sync effect wouldn't fire without it. resetNavigation nullifies
  // navigation.url → sync effect dependency changes → effect will fire when iframe
  // reports new URL.
  const handleUrlInputChange = useCallback((value: string) => {
    setUrlInputValue(value);
  }, []);

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlInputValue.trim();
    if (!trimmed) {
      clearOverride();
      urlInputRef.current?.blur();
      return;
    }

    const baseUrl = currentPreviewUrl ?? urlInfo?.url ?? undefined;
    const normalizedInput = normalizePreviewUrl(trimmed, baseUrl);
    if (!normalizedInput) {
      return;
    }

    urlInputRef.current?.blur();
    const normalizedCurrentUrl = currentPreviewUrl
      ? normalizePreviewUrl(currentPreviewUrl, urlInfo?.url ?? undefined)
      : null;
    if (normalizedCurrentUrl && normalizedInput === normalizedCurrentUrl) {
      if (hasOverride) {
        clearOverride();
      }
      return;
    }

    resetNavigation();

    if (showIframe && iframeRef.current?.contentWindow && previewProxyPort) {
      try {
        const parsed = new URL(normalizedInput);
        const devPort =
          parsed.port || (parsed.protocol === 'https:' ? '443' : '80');

        const currentUrl = currentPreviewUrl
          ? parsePreviewUrl(currentPreviewUrl, urlInfo?.url ?? undefined)
          : null;
        const currentPort =
          currentUrl?.port ||
          (currentUrl?.protocol === 'https:' ? '443' : '80');

        if (currentPort != null && devPort === currentPort) {
          const proxyPath = parsed.pathname + parsed.search + parsed.hash;
          const proxyUrl = `http://${devPort}.localhost:${previewProxyPort}${proxyPath}`;
          bridgeRef.current?.navigateTo(proxyUrl);
          return;
        }
      } catch {
        // fall through to iframe src change
      }
    }

    setOverrideUrl(normalizedInput);
    setImmediateLoad(true);
  }, [
    urlInputValue,
    urlInfo?.url,
    currentPreviewUrl,
    hasOverride,
    showIframe,
    previewProxyPort,
    clearOverride,
    resetNavigation,
    setOverrideUrl,
  ]);

  // handleUrlEscape: reverts URL bar to the current page URL and blurs,
  // discarding whatever the user typed.
  const handleUrlEscape = useCallback(() => {
    setUrlInputValue(navigationDevUrl ?? effectiveUrl ?? '');
    urlInputRef.current?.blur();
  }, [navigationDevUrl, effectiveUrl]);

  const handleStart = useCallback(() => {
    start();
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleRefresh = useCallback(() => {
    const canUseBridgeRefresh = Boolean(
      showIframe &&
        isReady &&
        iframeRef.current?.contentWindow &&
        bridgeRef.current
    );

    if (canUseBridgeRefresh) {
      bridgeRef.current?.refresh();
      return;
    }
    setImmediateLoad(true);
    triggerPreviewRefresh();
  }, [triggerPreviewRefresh, showIframe, isReady]);

  const handleClearOverride = useCallback(async () => {
    await clearOverride();
    setUrlInputValue('');
  }, [clearOverride]);

  const handleNavigateBack = useCallback(() => {
    bridgeRef.current?.navigateBack();
  }, []);

  const handleNavigateForward = useCallback(() => {
    bridgeRef.current?.navigateForward();
  }, []);

  const sendErudaCommand = useCallback((visible: boolean) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        source: 'vibe-kanban',
        command: visible ? 'show-eruda' : 'hide-eruda',
      },
      '*'
    );
  }, []);

  const handleToggleEruda = useCallback(() => {
    const newState = !isErudaVisible;
    setIsErudaVisible(newState);
    sendErudaCommand(newState);
  }, [isErudaVisible, sendErudaCommand]);

  // Re-send the current Eruda state when the iframe devtools bridge becomes ready.
  useEffect(() => {
    if (!isReady) return;
    sendErudaCommand(isErudaVisible);
  }, [isReady, isErudaVisible, sendErudaCommand]);

  const handleIframeLoad = useCallback(() => {
    // Initial postMessage can race with injected script startup on fresh loads.
    window.setTimeout(() => {
      sendErudaCommand(isErudaVisible);
    }, 150);
  }, [isErudaVisible, sendErudaCommand]);

  const handleCopyUrl = useCallback(async () => {
    if (!currentPreviewUrl) return;

    const normalizedUrl = normalizePreviewUrl(
      currentPreviewUrl,
      urlInfo?.url ?? undefined
    );
    if (normalizedUrl) {
      await navigator.clipboard.writeText(normalizedUrl);
    }
  }, [currentPreviewUrl, urlInfo?.url]);

  const handleOpenInNewTab = useCallback(() => {
    if (!currentPreviewUrl) return;

    const normalizedUrl = normalizePreviewUrl(
      currentPreviewUrl,
      urlInfo?.url ?? undefined
    );
    if (normalizedUrl) {
      window.open(normalizedUrl, '_blank');
    }
  }, [currentPreviewUrl, urlInfo?.url]);

  const handleScreenSizeChange = useCallback(
    (size: ScreenSize) => {
      setScreenSize(size);
    },
    [setScreenSize]
  );

  // ─── Iframe URL Construction ────────────────────────────────────────────────
  // Builds the subdomain-based proxy URL loaded by the iframe.
  //   Dev server at localhost:4000 → iframe loads http://4000.localhost:{proxyPort}/path
  //   The proxy extracts the target port from the subdomain and forwards to the dev server.
  //   _refresh query param forces iframe reload on refresh button click.
  // Construct proxy URL for iframe to enable security isolation via separate origin
  // Uses subdomain-based routing: http://{devPort}.localhost:{proxyPort}{path}
  const iframeUrl = useMemo(() => {
    if (!effectiveUrl || !previewProxyPort) return undefined;

    const parsed = parsePreviewUrl(effectiveUrl, urlInfo?.url ?? undefined);
    if (!parsed) return undefined;

    try {
      const devServerPort =
        parsed.port || (parsed.protocol === 'https:' ? '443' : '80');

      // Don't proxy to Vibe Kanban's own ports (would create infinite loop)
      const vibeKanbanPort = window.location.port || '80';
      if (devServerPort === vibeKanbanPort) {
        console.warn(
          `[Preview] Ignoring dev server URL with same port as Vibe Kanban (${devServerPort}). ` +
            'This usually means the dev server failed to start or reported the wrong port.'
        );
        return undefined;
      }

      // Also check if it's the preview proxy port itself
      if (devServerPort === String(previewProxyPort)) {
        console.warn(
          `[Preview] Ignoring dev server URL with same port as preview proxy (${devServerPort}).`
        );
        return undefined;
      }

      // Warn if not on localhost (subdomain routing requires localhost)
      if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        console.warn(
          '[Preview] Preview proxy subdomain routing may not work on non-localhost hostname'
        );
      }

      const path = parsed.pathname + parsed.search;

      // Subdomain-based routing: the proxy extracts the port from the Host header
      const proxyUrl = new URL(
        `http://${devServerPort}.localhost:${previewProxyPort}${path}`
      );
      proxyUrl.searchParams.set('_refresh', String(previewRefreshKey));

      return proxyUrl.toString();
    } catch {
      return undefined;
    }
  }, [effectiveUrl, previewProxyPort, previewRefreshKey, urlInfo?.url]);

  // ─── Navigation Reset on URL Change ────────────────────────────────────────
  // Resets navigation state when the iframe URL changes (e.g., new dev server
  // detected, user switched override). Prevents stale navigation data from the
  // previous page.

  const prevIframeUrlRef = useRef(iframeUrl);
  useEffect(() => {
    if (prevIframeUrlRef.current !== iframeUrl) {
      prevIframeUrlRef.current = iframeUrl;
      resetNavigation();
    }
  }, [iframeUrl, resetNavigation]);

  // NOTE: handleEditDevScript and handleFixDevScript have identical bodies.
  // This duplication is intentional — they may diverge in the future to support
  // different dialog configurations (e.g., edit vs. auto-fix modes).
  const handleEditDevScript = useCallback(() => {
    if (!attemptId || repos.length === 0) return;

    const sessionId = devServerProcesses[0]?.session_id;

    ScriptFixerDialog.show({
      scriptType: 'dev_server',
      repos,
      workspaceId: attemptId,
      sessionId,
      initialRepoId: repos.length === 1 ? repos[0].id : undefined,
    });
  }, [attemptId, repos, devServerProcesses]);

  const handleFixDevScript = useCallback(() => {
    if (!attemptId || repos.length === 0) return;

    // Get session ID from the latest dev server process
    const sessionId = devServerProcesses[0]?.session_id;

    ScriptFixerDialog.show({
      scriptType: 'dev_server',
      repos,
      workspaceId: attemptId,
      sessionId,
      initialRepoId: repos.length === 1 ? repos[0].id : undefined,
    });
  }, [attemptId, repos, devServerProcesses]);

  return (
    <PreviewBrowser
      url={iframeUrl}
      autoDetectedUrl={urlInfo?.url}
      urlInputValue={urlInputValue}
      urlInputRef={urlInputRef}
      isUsingOverride={hasOverride}
      onUrlInputChange={handleUrlInputChange}
      onUrlSubmit={handleUrlSubmit}
      onUrlEscape={handleUrlEscape}
      onClearOverride={handleClearOverride}
      onCopyUrl={handleCopyUrl}
      onOpenInNewTab={handleOpenInNewTab}
      onRefresh={handleRefresh}
      onStart={handleStart}
      onStop={handleStop}
      isStarting={isStarting}
      isStopping={isStopping}
      isServerRunning={runningDevServers.length > 0}
      showIframe={showIframe}
      allowManualUrl={allowManualUrl}
      screenSize={screenSize}
      localDimensions={localDimensions}
      onScreenSizeChange={handleScreenSizeChange}
      onResizeStart={handleResizeStart}
      isResizing={isResizing}
      containerRef={containerRef}
      repos={repos}
      handleEditDevScript={handleEditDevScript}
      handleFixDevScript={
        attemptId && repos.length > 0 ? handleFixDevScript : undefined
      }
      hasFailedDevServer={hasFailedDevServer}
      mobileScale={mobileScale}
      className={className}
      iframeRef={iframeRef}
      navigation={navigation}
      onNavigateBack={handleNavigateBack}
      onNavigateForward={handleNavigateForward}
      isInspectMode={isInspectMode}
      onToggleInspectMode={toggleInspectMode}
      isErudaVisible={isErudaVisible}
      onToggleEruda={handleToggleEruda}
      onIframeLoad={handleIframeLoad}
    />
  );
}
