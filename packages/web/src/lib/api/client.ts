/**
 * API Client
 *
 * Base fetch wrapper for public API requests with JSON handling and error transformation.
 * Used for fetching content from the portfolio API during static site generation.
 */

/** Base URL from environment variable */
export const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

/** API version prefix */
export const API_PREFIX = '/api/v1';

/**
 * API error class for structured error handling.
 */
export class ApiError extends Error {
  status: number;
  errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

/**
 * Makes a GET request to the API.
 *
 * @param endpoint - API endpoint path (without base URL or API prefix)
 * @returns Parsed JSON response
 * @throws ApiError if the request fails
 */
export async function get<T>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new ApiError(
      response.status,
      errorData.error || 'UNKNOWN_ERROR',
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Safely fetches data, returning null on error instead of throwing.
 * Useful for optional data fetching during SSG.
 *
 * @param endpoint - API endpoint path
 * @returns Parsed JSON response or null on error
 */
export async function getSafe<T>(endpoint: string): Promise<T | null> {
  try {
    return await get<T>(endpoint);
  } catch {
    return null;
  }
}
