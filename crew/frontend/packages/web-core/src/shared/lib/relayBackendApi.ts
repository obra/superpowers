import type { RelaySessionAuthCodeResponse } from 'shared/remote-types';
import type {
  FinishSpake2EnrollmentRequest,
  FinishSpake2EnrollmentResponse,
  StartSpake2EnrollmentRequest,
  StartSpake2EnrollmentResponse,
} from 'shared/types';
import { getAuthRuntime } from '@/shared/lib/auth/runtime';

const BUILD_TIME_API_BASE = import.meta.env.VITE_VK_SHARED_API_BASE || '';
const BUILD_TIME_RELAY_API_BASE = import.meta.env.VITE_RELAY_API_BASE_URL || '';
const USE_REMOTE_API_BASE_FALLBACK = !BUILD_TIME_RELAY_API_BASE;

let _relayApiBase: string = BUILD_TIME_RELAY_API_BASE || BUILD_TIME_API_BASE;

export function setRelayApiBase(base: string | null | undefined) {
  if (base) {
    _relayApiBase = base;
  }
}

export function getRelayApiUrl(): string {
  return _relayApiBase;
}

export function syncRelayApiBaseWithRemote(base: string | null | undefined) {
  if (USE_REMOTE_API_BASE_FALLBACK) {
    setRelayApiBase(base);
  }
}

export async function createRelaySessionAuthCode(
  sessionId: string
): Promise<RelaySessionAuthCodeResponse> {
  const response = await makeAuthenticatedRequest(
    getRelayApiUrl(),
    `/v1/relay/sessions/${sessionId}/auth-code`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw await parseErrorResponse(
      response,
      'Failed to create relay session auth code'
    );
  }

  return (await response.json()) as RelaySessionAuthCodeResponse;
}

export async function establishRelaySessionBaseUrl(
  relayUrl: string,
  hostId: string,
  code: string
): Promise<string> {
  const exchangeUrl = buildRelayExchangeUrl(relayUrl, hostId, code);
  const exchangeResponse = await fetch(exchangeUrl, {
    method: 'GET',
    redirect: 'follow',
  });

  return parseRelaySessionBaseUrl(exchangeResponse.url, hostId);
}

export async function startRelaySpake2Enrollment(
  relaySessionBaseUrl: string,
  payload: StartSpake2EnrollmentRequest
): Promise<StartSpake2EnrollmentResponse> {
  const response = await fetch(
    `${relaySessionBaseUrl}/api/relay-auth/spake2/start`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  return parseLocalApiResponse(response, 'Failed to start pairing.');
}

export async function finishRelaySpake2Enrollment(
  relaySessionBaseUrl: string,
  payload: FinishSpake2EnrollmentRequest
): Promise<FinishSpake2EnrollmentResponse> {
  const response = await fetch(
    `${relaySessionBaseUrl}/api/relay-auth/spake2/finish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  return parseLocalApiResponse(response, 'Failed to finish pairing.');
}

async function makeAuthenticatedRequest(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<Response> {
  const authRuntime = getAuthRuntime();
  const token = await authRuntime.getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Client-Version', __APP_VERSION__);
  headers.set('X-Client-Type', 'frontend');

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retryOn401) {
    const newToken = await authRuntime.triggerRefresh();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }

    throw new Error('Session expired. Please log in again.');
  }

  return response;
}

async function parseErrorResponse(
  response: Response,
  fallbackMessage: string
): Promise<Error> {
  try {
    const body = await response.json();
    const message = body.error || body.message || fallbackMessage;
    return new Error(`${message} (${response.status} ${response.statusText})`);
  } catch {
    return new Error(
      `${fallbackMessage} (${response.status} ${response.statusText})`
    );
  }
}

function buildRelayExchangeUrl(
  relayUrl: string,
  hostId: string,
  code: string
): string {
  const relayBase = relayUrl.replace(/\/+$/, '');
  return `${relayBase}/relay/h/${hostId}/exchange?code=${encodeURIComponent(code)}`;
}

function parseRelaySessionBaseUrl(finalUrl: string, hostId: string): string {
  const parsed = new URL(finalUrl);
  const hostPattern = escapeRegExp(hostId);
  const match = parsed.pathname.match(
    new RegExp(`^/relay/h/${hostPattern}/s/[^/]+`)
  );
  if (!match) {
    throw new Error('Failed to establish relay browser session.');
  }

  return `${parsed.origin}${match[0]}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface LocalApiSuccess<T> {
  success: true;
  data: T;
}

interface LocalApiFailure {
  success: false;
  message?: string;
}

type LocalApiEnvelope<T> = LocalApiSuccess<T> | LocalApiFailure;

async function parseLocalApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, fallbackMessage));
  }

  const body = (await response.json()) as LocalApiEnvelope<T>;
  if (!body.success) {
    throw new Error(body.message || fallbackMessage);
  }

  return body.data;
}

async function extractErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.message === 'string') {
      return body.message;
    }
    if (body && typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Ignore parse failures and use fallback.
  }

  return `${fallbackMessage} (${response.status})`;
}
