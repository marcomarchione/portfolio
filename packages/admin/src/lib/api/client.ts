/**
 * API Client
 *
 * Base fetch wrapper for API requests with JSON handling and error transformation.
 */
import type { ApiErrorResponse } from '@/types/api';
import { getAccessToken, clearTokens } from '@/lib/auth/storage';

/** Base URL from environment variable or default to relative path for proxy */
export const BASE_URL = import.meta.env.VITE_API_URL || '';

/** API version prefix */
export const API_PREFIX = '/api/v1';

/** Custom event for unauthorized responses */
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

/**
 * API error class for structured error handling.
 */
export class ApiError extends Error {
  status: number;
  errorCode: string;
  details?: Record<string, unknown> | null;
  path?: string;
  timestamp?: string;

  constructor(
    status: number,
    errorCode: string,
    message: string,
    details?: Record<string, unknown> | null,
    path?: string,
    timestamp?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    this.path = path;
    this.timestamp = timestamp;
  }

  static fromResponse(response: ApiErrorResponse, status: number): ApiError {
    return new ApiError(
      status,
      response.error,
      response.message,
      response.details,
      response.path,
      response.timestamp
    );
  }
}

/**
 * Request options for API calls.
 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Skip authorization header */
  skipAuth?: boolean;
  /** Request body (will be JSON stringified) */
  body?: unknown;
}

/**
 * Makes an API request with proper headers and error handling.
 *
 * @param endpoint - API endpoint path (without base URL or API prefix)
 * @param options - Request options
 * @returns Parsed JSON response
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, body, ...fetchOptions } = options;

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build full URL
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    clearTokens();
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please login again.');
  }

  // Parse response
  const data = await response.json();

  // Handle error responses
  if (!response.ok) {
    const errorResponse = data as ApiErrorResponse;
    throw ApiError.fromResponse(errorResponse, response.status);
  }

  return data as T;
}

/**
 * Makes a GET request.
 */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Makes a POST request.
 */
export function post<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * Makes a PUT request.
 */
export function put<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * Makes a PATCH request.
 */
export function patch<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * Makes a DELETE request.
 */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
