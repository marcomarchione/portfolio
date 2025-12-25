/**
 * Token Storage Utilities
 *
 * Handles secure storage and retrieval of auth tokens in localStorage.
 */
import type { StoredTokens } from '@/types/auth';

/** Storage keys */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  EXPIRES_AT: 'expiresAt',
} as const;

/**
 * Saves tokens to localStorage with calculated expiry timestamp.
 *
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 * @param expiresIn - Token expiry in seconds
 */
export function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  // Calculate expiry timestamp (current time + expiresIn seconds)
  const expiresAt = Date.now() + expiresIn * 1000;

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
}

/**
 * Updates the access token after refresh.
 *
 * @param accessToken - New JWT access token
 * @param expiresIn - Token expiry in seconds
 */
export function updateAccessToken(accessToken: string, expiresIn: number): void {
  const expiresAt = Date.now() + expiresIn * 1000;

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
}

/**
 * Retrieves stored tokens from localStorage.
 *
 * @returns Stored tokens or null if not found
 */
export function getTokens(): StoredTokens | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!accessToken || !refreshToken || !expiresAtStr) {
    return null;
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) {
    return null;
  }

  return { accessToken, refreshToken, expiresAt };
}

/**
 * Gets the access token from localStorage.
 *
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Gets the refresh token from localStorage.
 *
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Clears all stored auth tokens.
 */
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
}

/**
 * Checks if the access token is expired or about to expire.
 *
 * @param bufferMs - Buffer time in milliseconds (default 60 seconds)
 * @returns True if token is expired or will expire within buffer time
 */
export function isTokenExpired(bufferMs: number = 60000): boolean {
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!expiresAtStr) {
    return true;
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) {
    return true;
  }

  // Check if current time + buffer exceeds expiry
  return Date.now() + bufferMs >= expiresAt;
}

/**
 * Checks if tokens exist in storage.
 *
 * @returns True if tokens are stored
 */
export function hasStoredTokens(): boolean {
  return getTokens() !== null;
}
