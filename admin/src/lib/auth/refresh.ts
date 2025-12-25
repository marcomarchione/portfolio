/**
 * Token Refresh Utilities
 *
 * Handles automatic token refresh before expiry.
 */
import { refresh } from '@/lib/api/auth';
import {
  getRefreshToken,
  isTokenExpired,
  updateAccessToken,
  clearTokens,
} from './storage';

/** Refresh interval in milliseconds (check every minute) */
const REFRESH_CHECK_INTERVAL = 60000;

/** Buffer time before expiry to trigger refresh (60 seconds) */
const REFRESH_BUFFER_MS = 60000;

/** Reference to the interval timer */
let refreshInterval: ReturnType<typeof setInterval> | null = null;

/** Flag to prevent concurrent refresh attempts */
let isRefreshing = false;

/**
 * Attempts to refresh the access token if needed.
 *
 * @returns True if refresh was successful or not needed, false if refresh failed
 */
export async function tryRefreshToken(): Promise<boolean> {
  // Prevent concurrent refresh attempts
  if (isRefreshing) {
    return true;
  }

  // Check if token needs refresh
  if (!isTokenExpired(REFRESH_BUFFER_MS)) {
    return true;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  isRefreshing = true;

  try {
    const response = await refresh(refreshToken);
    updateAccessToken(response.accessToken, response.expiresIn);
    return true;
  } catch {
    // Refresh failed - tokens are invalid
    clearTokens();
    return false;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Starts the automatic token refresh interval.
 *
 * @param onRefreshFailed - Callback when refresh fails (should trigger logout)
 */
export function startTokenRefresh(onRefreshFailed: () => void): void {
  // Clear any existing interval
  stopTokenRefresh();

  // Set up periodic refresh check
  refreshInterval = setInterval(async () => {
    const success = await tryRefreshToken();
    if (!success) {
      onRefreshFailed();
    }
  }, REFRESH_CHECK_INTERVAL);

  // Also check on window focus
  const handleFocus = async () => {
    const success = await tryRefreshToken();
    if (!success) {
      onRefreshFailed();
    }
  };

  window.addEventListener('focus', handleFocus);

  // Store cleanup function
  const originalStop = stopTokenRefresh;
  stopTokenRefresh = () => {
    originalStop();
    window.removeEventListener('focus', handleFocus);
  };
}

/**
 * Stops the automatic token refresh interval.
 */
export let stopTokenRefresh = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};
