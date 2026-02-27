import { useEffect, useRef, useState } from 'react';
import { stripAnsi } from 'fancy-ansi';

export interface PreviewUrlInfo {
  url: string;
  port?: number;
  scheme: 'http' | 'https';
}

const urlPatterns = [
  // Full URL pattern (e.g., http://localhost:3000, https://127.0.0.1:8080)
  /(https?:\/\/(?:\[[0-9a-f:]+\]|localhost|127\.0\.0\.1|0\.0\.0\.0|\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?(?:\/\S*)?)/i,
  // Host:port pattern (e.g., localhost:3000, 0.0.0.0:8080)
  /((?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[0-9a-f:]+\]|(?:\d{1,3}\.){3}\d{1,3})):(\d{2,5})/gi,
];
const LOG_SCAN_BUFFER_LIMIT = 16 * 1024;

const LOOPBACK_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::',
  '[::]',
]);

const isIpv4Host = (host: string): boolean =>
  /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);

const normalizeDetectedHost = (host: string): string => {
  const normalized = host.toLowerCase();
  if (LOOPBACK_HOSTS.has(normalized)) {
    return 'localhost';
  }

  // Dev servers often print network/private IP addresses in addition to Local.
  // We keep preview stable by preferring localhost for these cases.
  if (isIpv4Host(normalized)) {
    return 'localhost';
  }

  return host;
};

const getUrlParts = (
  url: string
): { hostname: string; port: string } | null => {
  try {
    const parsed = new URL(url);
    return {
      hostname: parsed.hostname,
      port: parsed.port,
    };
  } catch {
    return null;
  }
};

const isLocalPreviewUrl = (url: string): boolean => {
  const parsed = getUrlParts(url);
  if (!parsed) return false;
  return normalizeDetectedHost(parsed.hostname) === 'localhost';
};

const isBetterPreviewUrlCandidate = (
  candidate: PreviewUrlInfo,
  current: PreviewUrlInfo
): boolean => {
  if (candidate.url === current.url) {
    return false;
  }

  const candidateIsLocal = isLocalPreviewUrl(candidate.url);
  const currentIsLocal = isLocalPreviewUrl(current.url);
  if (candidateIsLocal && !currentIsLocal) {
    return true;
  }
  if (!candidateIsLocal && currentIsLocal) {
    return false;
  }

  return false;
};

const getVibeKanbanPort = (): string | null => {
  if (typeof window !== 'undefined' && window.location.port) {
    return window.location.port;
  }
  return null;
};

const isStandaloneHostPortMatch = (
  source: string,
  startIndex: number,
  matchedText: string
): boolean => {
  const before = startIndex > 0 ? source[startIndex - 1] : '';
  const afterIndex = startIndex + matchedText.length;
  const after = afterIndex < source.length ? source[afterIndex] : '';

  // Ignore embedded matches such as "4000.localhost:3009" where the detected
  // "localhost:3009" is just a suffix of a larger hostname.
  if (before && /[A-Za-z0-9_.-]/.test(before)) {
    return false;
  }

  // Reject if token keeps going with hostname-safe chars.
  if (after && /[A-Za-z0-9_.-]/.test(after)) {
    return false;
  }

  return true;
};

const trimMatchedUrlCandidate = (raw: string): string => {
  let candidate = raw.trim();

  while (
    candidate.length > 0 &&
    ['"', "'", '`', '<', '(', '[', '{'].includes(candidate[0])
  ) {
    candidate = candidate.slice(1).trimStart();
  }

  while (
    candidate.length > 0 &&
    ['"', "'", '`', '>', ')', ']', '}', ',', ';'].includes(
      candidate[candidate.length - 1]
    )
  ) {
    candidate = candidate.slice(0, -1).trimEnd();
  }

  return candidate;
};

const toOriginUrlInfo = (
  parsed: URL,
  scheme: 'http' | 'https'
): PreviewUrlInfo => {
  const originOnly = new URL(parsed.origin);
  originOnly.pathname = '/';
  originOnly.search = '';
  originOnly.hash = '';
  return {
    url: originOnly.toString(),
    port: parsed.port ? Number(parsed.port) : undefined,
    scheme,
  };
};

export const detectPreviewUrl = (line: string): PreviewUrlInfo | null => {
  const cleaned = stripAnsi(line);
  // Some dev servers split terminal output into chunks, which can break
  // ports as `:40\n00`. Collapse whitespace inside the port before matching.
  const normalized = cleaned.replace(
    /:(\d(?:[\d\s]{0,8}\d))(?=\/|\s|$)/g,
    (_match, rawPort) => `:${rawPort.replace(/\s+/g, '')}`
  );
  const vibeKanbanPort = getVibeKanbanPort();

  const fullUrlMatch = urlPatterns[0].exec(normalized);
  if (fullUrlMatch) {
    try {
      const candidateUrl = trimMatchedUrlCandidate(fullUrlMatch[1]);
      const parsed = new URL(candidateUrl);
      const normalizedHost = normalizeDetectedHost(parsed.hostname);
      const isLocalhost = normalizedHost === 'localhost';

      if (isLocalhost && !parsed.port) {
        // Fall through to host:port pattern detection
      } else {
        parsed.hostname = normalizedHost;

        if (vibeKanbanPort && parsed.port === vibeKanbanPort) {
          return null;
        }

        const scheme = parsed.protocol === 'https:' ? 'https' : 'http';
        return toOriginUrlInfo(parsed, scheme);
      }
    } catch {
      // Ignore invalid URLs and fall through to host:port detection
    }
  }

  const hostPortPattern = new RegExp(urlPatterns[1]);
  let hostPortMatch: RegExpExecArray | null;

  while ((hostPortMatch = hostPortPattern.exec(normalized)) !== null) {
    if (
      !isStandaloneHostPortMatch(
        normalized,
        hostPortMatch.index,
        hostPortMatch[0]
      )
    ) {
      continue;
    }

    const host = normalizeDetectedHost(hostPortMatch[1]);
    const port = Number(hostPortMatch[2]);

    if (vibeKanbanPort && String(port) === vibeKanbanPort) {
      continue;
    }

    const scheme = /https/i.test(normalized) ? 'https' : 'http';
    const originOnly = new URL(`${scheme}://${host}:${port}`);
    originOnly.pathname = '/';
    originOnly.search = '';
    originOnly.hash = '';
    return {
      url: originOnly.toString(),
      port,
      scheme: scheme as 'http' | 'https',
    };
  }

  return null;
};

function detectPreviewUrlFromBuffer(
  buffer: string,
  blockedPort?: number
): PreviewUrlInfo | null {
  const lines = buffer.split(/\r?\n/);
  let best: PreviewUrlInfo | null = null;

  // Prefer the newest entries first so stale older matches don't block detection.
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line) continue;

    const detected = detectPreviewUrl(line);
    if (!detected || (blockedPort && detected.port === blockedPort)) {
      continue;
    }

    if (!best || isBetterPreviewUrlCandidate(detected, best)) {
      best = detected;
    }
  }
  if (best) return best;

  // Fallback for URLs split across chunk boundaries where line-by-line matching fails.
  const fallback = detectPreviewUrl(buffer);
  if (fallback && blockedPort && fallback.port === blockedPort) {
    return null;
  }
  return fallback;
}

export function usePreviewUrl(
  logs: Array<{ content: string }> | undefined,
  previewProxyPort?: number
): PreviewUrlInfo | undefined {
  const [urlInfo, setUrlInfo] = useState<PreviewUrlInfo | undefined>();
  const lastIndexRef = useRef(0);
  const logBufferRef = useRef('');

  useEffect(() => {
    if (!logs) {
      setUrlInfo(undefined);
      lastIndexRef.current = 0;
      logBufferRef.current = '';
      return;
    }

    // Reset if logs were cleared (new process started)
    if (logs.length < lastIndexRef.current) {
      lastIndexRef.current = 0;
      setUrlInfo(undefined);
      logBufferRef.current = '';
    }

    const hasBlockedUrl =
      Boolean(previewProxyPort) && urlInfo?.port === previewProxyPort;
    if (hasBlockedUrl) {
      setUrlInfo(undefined);
      lastIndexRef.current = 0;
      logBufferRef.current = '';
    }

    // Scan new log entries for URL
    let detectedUrl: PreviewUrlInfo | undefined;
    const newEntries = logs.slice(lastIndexRef.current);
    if (newEntries.length > 0) {
      const chunk = newEntries.map((entry) => entry.content).join('');
      const merged = `${logBufferRef.current}${chunk}`;
      logBufferRef.current =
        merged.length > LOG_SCAN_BUFFER_LIMIT
          ? merged.slice(-LOG_SCAN_BUFFER_LIMIT)
          : merged;
      detectedUrl =
        detectPreviewUrlFromBuffer(logBufferRef.current, previewProxyPort) ??
        undefined;
    }

    if (detectedUrl) {
      setUrlInfo((prev) => {
        if (!prev) return detectedUrl;
        return isBetterPreviewUrlCandidate(detectedUrl, prev)
          ? detectedUrl
          : prev;
      });
    }

    lastIndexRef.current = logs.length;
  }, [logs, urlInfo, previewProxyPort]);

  return urlInfo;
}
