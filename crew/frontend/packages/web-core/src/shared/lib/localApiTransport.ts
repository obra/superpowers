export interface LocalApiTransport {
  request: (pathOrUrl: string, init?: RequestInit) => Promise<Response>;
  openWebSocket: (pathOrUrl: string) => Promise<WebSocket> | WebSocket;
}

function isAbsoluteUrl(pathOrUrl: string): boolean {
  return /^https?:\/\//i.test(pathOrUrl) || /^wss?:\/\//i.test(pathOrUrl);
}

function toAbsoluteWsUrl(pathOrUrl: string): string {
  if (/^wss?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl.replace(/^http/i, 'ws');
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const normalizedPath = pathOrUrl.startsWith('/')
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${protocol}//${window.location.host}${normalizedPath}`;
}

const defaultTransport: LocalApiTransport = {
  request: (pathOrUrl, init = {}) => fetch(pathOrUrl, init),
  openWebSocket: (pathOrUrl) => new WebSocket(toAbsoluteWsUrl(pathOrUrl)),
};

let transport: LocalApiTransport = defaultTransport;

export function setLocalApiTransport(nextTransport: LocalApiTransport | null) {
  transport = nextTransport ?? defaultTransport;
}

export async function makeLocalApiRequest(
  pathOrUrl: string,
  init: RequestInit = {}
): Promise<Response> {
  return transport.request(pathOrUrl, init);
}

export async function openLocalApiWebSocket(
  pathOrUrl: string
): Promise<WebSocket> {
  return transport.openWebSocket(pathOrUrl);
}

export function isLocalApiPath(pathOrUrl: string): boolean {
  if (isAbsoluteUrl(pathOrUrl)) {
    const url = new URL(pathOrUrl);
    return url.pathname.startsWith('/api/');
  }

  const normalizedPath = pathOrUrl.startsWith('/')
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return normalizedPath.startsWith('/api/');
}

export function toPathAndQuery(pathOrUrl: string): string {
  if (isAbsoluteUrl(pathOrUrl)) {
    const url = new URL(pathOrUrl);
    return `${url.pathname}${url.search}`;
  }

  return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
}
