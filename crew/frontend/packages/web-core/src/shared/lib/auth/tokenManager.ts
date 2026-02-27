import { ApiError, oauthApi } from '@/shared/lib/api';
import { queryClient } from '@/shared/lib/queryClient';
import { shouldRefreshAccessToken } from 'shared/jwt';

const TOKEN_QUERY_KEY = ['auth', 'token'] as const;
const TOKEN_STALE_TIME = 125 * 1000;

type RefreshStateCallback = (isRefreshing: boolean) => void;
type PauseableShape = { pause: () => void; resume: () => void };

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private subscribers = new Set<RefreshStateCallback>();
  private pauseableShapes = new Set<PauseableShape>();

  /**
   * Get a valid access token, refreshing if needed.
   * Returns null immediately if the user is not logged in.
   */
  async getToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Skip token fetch if user is not logged in — avoids unnecessary 401s
    // from Electric shapes or other background requests after logout.
    const cachedSystem = queryClient.getQueryData<{
      login_status?: { status: string };
    }>(['user-system']);
    if (cachedSystem && cachedSystem.login_status?.status !== 'loggedin') {
      return null;
    }

    const cachedData = queryClient.getQueryData<{
      access_token?: string;
    }>(TOKEN_QUERY_KEY);
    const cachedToken = cachedData?.access_token;
    if (!cachedToken || shouldRefreshAccessToken(cachedToken)) {
      await queryClient.invalidateQueries({ queryKey: TOKEN_QUERY_KEY });
    }

    try {
      const data = await queryClient.fetchQuery({
        queryKey: TOKEN_QUERY_KEY,
        queryFn: () => oauthApi.getToken(),
        staleTime: TOKEN_STALE_TIME,
      });
      return data?.access_token ?? null;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await this.handleUnauthorized();
      }
      return null;
    }
  }

  /**
   * Force a token refresh. Call this when you receive a 401 response.
   * Coordinates multiple callers to prevent concurrent refresh attempts.
   *
   * Returns the new token (or null if refresh failed).
   */
  triggerRefresh(): Promise<string | null> {
    // CRITICAL: Assign promise SYNCHRONOUSLY so concurrent 401 handlers share one refresh.
    this.refreshPromise ??= this.doRefresh();
    return this.refreshPromise;
  }

  /**
   * Register an Electric shape for pause/resume during token refresh.
   * When refresh starts, all shapes are paused to prevent 401 spam.
   * When refresh completes, shapes are resumed.
   *
   * Returns an unsubscribe function.
   */
  registerShape(shape: PauseableShape): () => void {
    this.pauseableShapes.add(shape);
    // If currently refreshing, pause immediately
    if (this.isRefreshing) {
      shape.pause();
    }
    return () => this.pauseableShapes.delete(shape);
  }

  /**
   * Get the current refreshing state synchronously.
   */
  getRefreshingState(): boolean {
    return this.isRefreshing;
  }

  /**
   * Subscribe to refresh state changes.
   * Returns an unsubscribe function.
   */
  subscribe(callback: RefreshStateCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private async doRefresh(): Promise<string | null> {
    // Skip refresh if user is already logged out — avoids unnecessary 401s
    // from Electric shapes or other background requests after logout.
    const cachedSystem = queryClient.getQueryData<{
      login_status?: { status: string };
    }>(['user-system']);
    if (cachedSystem && cachedSystem.login_status?.status !== 'loggedin') {
      // Pause shapes so they stop making requests while logged out
      this.pauseShapes();
      return null;
    }

    this.setRefreshing(true);
    this.pauseShapes();

    try {
      // Invalidate the cache to force a fresh fetch
      await queryClient.invalidateQueries({ queryKey: TOKEN_QUERY_KEY });

      // Fetch fresh token
      const data = await queryClient.fetchQuery({
        queryKey: TOKEN_QUERY_KEY,
        queryFn: () => oauthApi.getToken(),
        staleTime: TOKEN_STALE_TIME,
      });

      const token = data?.access_token ?? null;
      if (token) {
        this.resumeShapes();
      }
      return token;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await this.handleUnauthorized();
      }
      return null;
    } finally {
      this.refreshPromise = null;
      this.setRefreshing(false);
    }
  }

  private async handleUnauthorized(): Promise<void> {
    // Check if the user was previously logged in before we invalidate.
    // If they're already logged out, 401s are expected — don't show the dialog.
    const cachedSystem = queryClient.getQueryData<{
      login_status?: { status: string };
    }>(['user-system']);
    const wasLoggedIn = cachedSystem?.login_status?.status === 'loggedin';

    // Pause shapes — session is invalid, prevent further 401s
    this.pauseShapes();

    // Reload system state so the UI transitions to logged-out
    await queryClient.invalidateQueries({ queryKey: ['user-system'] });

    // Only show the login dialog if the user was previously logged in
    // (i.e., their session expired unexpectedly). Don't prompt users who
    // intentionally logged out or were never logged in.
    if (wasLoggedIn) {
      const { OAuthDialog } = await import(
        '@/shared/dialogs/global/OAuthDialog'
      );
      void OAuthDialog.show({});
    }
  }

  private setRefreshing(value: boolean): void {
    this.isRefreshing = value;
    this.subscribers.forEach((cb) => cb(value));
  }

  private pauseShapes(): void {
    for (const shape of this.pauseableShapes) {
      shape.pause();
    }
  }

  private resumeShapes(): void {
    for (const shape of this.pauseableShapes) {
      shape.resume();
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
